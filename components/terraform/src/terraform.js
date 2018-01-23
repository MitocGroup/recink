'use strict';

const fse = require('fs-extra');
const dot = require('dot-object');
const path = require('path');
const execa = require('execa');
const Plan = require('./terraform/plan');
const pjson = require('../package');
const State = require('./terraform/state');
const Downloader = require('./downloader');
const SecureOutput = require('./secure-output');
const { getFilesByPattern, versionCompare } = require('../node_modules/recink/src/helper/util');

/**
 * Terraform wrapper
 */
class Terraform {
  /**
   * @param {*} vars
   * @param {String} binary
   * @param {String} resource
   * @param {Array} varFiles
   */
  constructor(
    vars = {},
    binary = Terraform.BINARY,
    resource = Terraform.RESOURCE,
    varFiles = []
  ) {
    this._binary = binary;
    this._resource = resource;
    this._vars = vars;
    this._varFiles = varFiles;
    this._logger = false;
    this._isRemoteState = false;
    this._isWorkspaceSupported = false;
  }

  /**
   * @param {String} name
   * 
   * @returns {boolean} 
   */
  hasVar(name) {
    return this._vars.hasOwnProperty(name);
  }

  /**
   * @param {String} name
   * @param {*} defaultValue 
   * 
   * @returns {*}
   */
  getVar(name, defaultValue = null) {
    if (!this.hasVar(name)) {
      return defaultValue;
    }

    return this._vars[name];
  }

  /**
   * @param {String} name
   * @param {*} value 
   * 
   * @returns {Terraform}
   */
  setVar(name, value) {
    this._vars[name] = value;

    return this;
  }

  /**
   * @param {*} vars 
   * 
   * @returns {Terraform}
   */
  setVars(vars) {
    this._vars = vars;

    return this;
  }

  /**
   * @returns {String}
   */
  get getBinary() {
    return this._binary;
  }

  /**
   * @returns {String}
   */
  get getResource() {
    return this._resource;
  }

  /**
   * @returns {*}
   */
  get vars() {
    return this._vars;
  }

  /**
   * @returns {Array}
   */
  get varFiles() {
    return this._varFiles;
  }

  /**
   * @returns {Boolean}
   */
  get isWorkspaceSupported() {
    return this._isWorkspaceSupported;
  }

  /**
   * @returns {*}
   */
  get env() {
    const env = {};

    Object.keys(this.vars).forEach(name => {
      env[`TF_VAR_${ name }`] = this.vars[name];
    });

    return env;
  }

  /**
   * https://www.terraform.io/docs/commands/init.html
   * @param {String} dir
   * @returns {Promise}
   */
  init(dir) {
    return this
      .run('init', ['-no-color', '.'], dir)
      .then(() => this.checkRemoteState(dir))
      .then(() => this.pullState(dir))
      .then(() => Promise.resolve());
  }

  /**
   * https://www.terraform.io/docs/state/workspaces.html
   * @param {String} dir
   * @param {String} workspace
   * @returns {Promise}
   */
  workspace(dir, workspace) {
    return this._ensureResourceDir(dir).then(() => {
      const regex = RegExp(`(\\*\\s|\\s.)${workspace}$`,'m');
      let options = ['new', workspace, '-no-color'];

      this.run('workspace', ['list'], dir).then(result => {
        if (regex.exec(result.output) != null) {
          options[0] = 'select';
        }

        if (fse.existsSync(`${dir}/terraform.tfstate.d`)) {
          this._resource = `terraform.tfstate.d/${workspace}`;
        }

        return this.run('workspace', options, dir);
      });
    });
  }

  /**
   * Check if remote state configured
   * @param {String} dir
   * @return {Promise}
   */
  checkRemoteState(dir) {
    const statePath = path.join(dir, '.terraform', Terraform.STATE);

    if (!fse.existsSync(statePath)) {
      return Promise.resolve();
    }

    return fse.readJson(statePath).then(stateObj => {
      this._isRemoteState = !!dot.pick('backend.type', stateObj);
      return Promise.resolve();
    });
  }

  /**
   * https://www.terraform.io/docs/commands/state/index.html
   * @param {String} dir
   * @returns {Promise}
   */
  pullState(dir) {
    return this._ensureResourceDir(dir).then(() => {
      return this.run('state', ['pull'], dir).then(result => {
        if (this._isRemoteState && result.output) {
          const remoteStatePath = path.join(dir, this.getResource, Terraform.REMOTE);
          const backupStatePath = path.join(dir, this.getResource, Terraform.BACKUP);

          if (fse.existsSync(remoteStatePath)) {
            fse.moveSync(remoteStatePath, backupStatePath);
          }

          fse.writeFileSync(remoteStatePath, result.output, 'utf8');
        }

        return Promise.resolve();
      });
    });
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @param {String} dir
   * @returns {Promise}
   */
  plan(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const localStatePath = path.join(dir, this.getResource, Terraform.STATE);
      const planPath = path.join(dir, this.getResource, Terraform.PLAN);
      let options = ['-no-color', `-out=${planPath}`];

      this.varFiles.forEach(fileName => {
        options.push(`-var-file=${path.join(dir, fileName)}`);
      });

      if (!this._isRemoteState && fse.existsSync(localStatePath)) {
        options.push(`-state=${localStatePath}`);
      }

      return this.run('plan', options, dir).then(result => new Plan(planPath, result.output));
    });
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   *
   * @param {String} dir
   *
   * @returns {Promise}
   */
  apply(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const planPath = path.join(dir, this.getResource, Terraform.PLAN);
      const localStatePath = path.join(dir, this.getResource, Terraform.STATE);
      const remoteStatePath = path.join(dir, this.getResource, Terraform.REMOTE);
      const backupStatePath = path.join(dir, this.getResource, Terraform.BACKUP);
      let options = ['-no-color', '-auto-approve'];

      if (!this._isRemoteState && fse.existsSync(localStatePath)) {
        this.varFiles.forEach(fileName => {
          options.push(`-var-file=${path.join(dir, fileName)}`);
        });

        options.push(
          `-state=${ localStatePath }`,
          `-state-out=${ localStatePath }`,
          `-backup=${ backupStatePath }`
        );
      } else if (fse.existsSync(planPath)) {
        if (!this._isRemoteState) {
          options.push(`-state-out=${ localStatePath }`);
        }
        options.push(planPath);
      }

      return this.run('apply', options, dir).then(() => {
        if (this._isRemoteState) {
          return this.pullState(dir).then(() => Promise.resolve(new State(remoteStatePath, backupStatePath)));
        }

        return Promise.resolve(new State(localStatePath, backupStatePath));
      });
    });
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @param {String} dir
   * @returns {Promise}
   */
  destroy(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const localStatePath = path.join(dir, this.getResource, Terraform.STATE);
      const backupStatePath = path.join(dir, this.getResource, Terraform.BACKUP);
      let options = ['-no-color', '-force'];

      this.varFiles.forEach(fileName => {
        options.push(`-var-file=${path.join(dir, fileName)}`);
      });

      if (!this._isRemoteState && fse.existsSync(localStatePath)) {
        options.push(
          `-state=${ localStatePath }`,
          `-state-out=${ localStatePath }`,
          `-backup=${ backupStatePath }`
        );
      }

      return this.run('destroy', options, dir).then(() => {
        let state = new State(localStatePath, backupStatePath);

        if (!this._isRemoteState) {
          return Promise.resolve(state);
        }

        return this.pullState(dir).then(() => Promise.resolve(state));
      });
    });
  }

  /**
   * https://www.terraform.io/docs/commands/show.html
   * 
   * @param {Plan|State} planOrState
   * @param {Boolean} secureOutput
   * @returns {Promise} 
   */
  show(planOrState, secureOutput = true) {
    let options = ['-no-color'];

    if (planOrState.path) {
      options.push(planOrState.path);
    }

    return this.run('show', options, planOrState.dir).then(result => {
      return Promise.resolve(
        secureOutput 
          ? SecureOutput.secure(result.output)
          : result.output
      );
    });
  }

  /**
   * @param {String} dir
   * @returns {Promise}
   * @private
   */
  _ensureResourceDir(dir) {
    return fse.ensureDir(path.join(dir, this.getResource));
  }

  /**
   * @param {String} command
   * @param {Array} args
   * @param {String} cwd
   * @returns {Promise}
   */
  run(command, args = [], cwd = process.cwd()) {
    const { env } = this;
    const bin = path.resolve(this.getBinary);

    const childProcess = execa(bin, [command].concat(args), { env, cwd });

    if (this.logger) {
      this.logger.debug({
        command: `${this.getBinary} ${command}`,
        args: args,
        fileNames: getFilesByPattern(cwd, /.*/)
      });

      childProcess.stdout.on('data', data => {
        let chunk = data.toString().replace(/\s*$/g, '');
        if (chunk) {
          this.logger.debug(SecureOutput.secure(chunk));
        }
      });
    }

    return childProcess.then(({ stdout, code }) => Promise.resolve({ code, output: stdout }));
  }

  /**
   * Ensure binary exists (download otherwise)
   * @param {String} version
   * @returns {Promise}
   */
  ensure(version = Terraform.VERSION) {
    let compared = versionCompare(version, '0.11.0');
    if (compared === NaN) {
      throw new Error(`Terraform version ${version} is invalid`);
    }

    this._isWorkspaceSupported = (compared !== NaN && compared >= 0);

    return fse.pathExists(this.getBinary).then(exists => {
      if (exists) {
        return Promise.resolve();
      }

      const downloader = new Downloader(version);
      const saveToDir = path.dirname(this.getBinary);

      return downloader.isVersionAvailable().then(isAvailable => {
        if (!isAvailable) {
          throw new Error(`Terraform version ${version} is not available`);
        }

        return downloader.download(saveToDir);
      });
    });
  }

  /**
   * @return {boolean|*}
   */
  get logger() {
    return this._logger;
  }

  /**
   * @param {*} logger
   * @return {Terraform}
   */
  setLogger(logger) {
    this._logger = logger;

    return this;
  }

  /**
   * @returns {String}
   */
  static get VERSION() {
    return '0.11.0';
  }

  /**
   * @returns {String}
   */
  static get PLAN() {
    return 'terraform.tfplan';
  }

  /**
   * @returns {String}
   */
  static get STATE() {
    return 'terraform.tfstate';
  }

  /**
   * @returns {String}
   */
  static get REMOTE() {
    return 'terraform.tfstate.remote';
  }

  /**
   * @returns {String}
   */
  static get BACKUP() {
    return `terraform.tfstate.${ new Date().getTime() }.backup`;
  }

  /**
   * @returns {String}
   */
  static get RESOURCE() {
    return '.resource';
  }

  /**
   * @returns {String}
   */
  static get BIN_PATH() {
    return path.resolve(process.cwd(), 'bin');
  }

  /**
   * @returns {String}
   */
  static get BIN_FILE() {
    return 'terraform';
  }

  /**
   * @returns {String}
   */
  static get BINARY() {
    return path.join(Terraform.BIN_PATH, Terraform.BIN_FILE);
  }
}

module.exports = Terraform;
