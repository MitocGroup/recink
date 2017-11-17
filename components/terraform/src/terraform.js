'use strict';

const path = require('path');
const fse = require('fs-extra');
const execa = require('execa');
const pjson = require('../package');
const Downloader = require('./downloader');
const Plan = require('./terraform/plan');
const State = require('./terraform/state');
const SecureOutput = require('./secure-output');
const { walkDir } = require('./helper/util');

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
    this._vars = vars;
    this._binary = binary;
    this._resource = resource;
    this._varFiles = varFiles;
    this._logger = false;
  }

  /**
   * @param {string} name
   * 
   * @returns {boolean} 
   */
  hasVar(name) {
    return this._vars.hasOwnProperty(name);
  }

  /**
   * @param {string} name 
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
   * @param {string} name 
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
   * @returns {*}
   */
  get vars() {
    return this._vars;
  }

  /**
   * @returns {string}
   */
  get getBinary() {
    return this._binary;
  }

  /**
   * @returns {string}
   */
  get getResource() {
    return this._resource;
  }

  /**
   * @returns {Array}
   */
  get varFiles() {
    return this._varFiles;
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
   * 
   * @param {string} dir
   * @returns {Promise}
   */
  init(dir) {
    return this
      .run('init', ['-no-color', '.'], dir)
      .then(result => Promise.resolve());
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * 
   * @param {string} dir
   * 
   * @returns {Promise} 
   */
  plan(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const statePath = path.join(dir, this.getResource, Terraform.STATE);
      const planPath = path.join(dir, this.getResource, Terraform.PLAN);
      let options = ['-no-color', `-out=${planPath}`];

      if (fse.existsSync(statePath)) {
        options.push(`-state=${statePath}`);
      }

      return this.run('plan', options, dir).then(result =>  new Plan(planPath, result.output));
    });
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * 
   * @param {string} dir
   * 
   * @returns {Promise} 
   */
  apply(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const planPath = path.join(dir, this.getResource, Terraform.PLAN);
      const statePath = path.join(dir, this.getResource, Terraform.STATE);
      const backupStatePath = path.join(dir, this.getResource, Terraform.BACKUP_STATE);
      let options = ['-auto-approve=true', '-no-color', `-state-out=${ statePath }`];

      if (fse.existsSync(statePath)) {
        options.push(`-state=${ statePath }`, `-backup=${ backupStatePath }`);
      } else if (fse.existsSync(planPath)) {
        options.push(planPath);
      }

      this.varFiles.forEach(fileName => {
        options.push(`-var-file=${path.join(dir, fileName)}`);
      });

      return this.run('apply', options, dir).then(result => new State(statePath, backupStatePath));
    });
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   *
   * @param {string} dir
   *
   * @returns {Promise}
   */
  destroy(dir) {
    return this._ensureResourceDir(dir).then(() => {
      const statePath = path.join(dir, this.getResource, Terraform.STATE);
      const backupStatePath = path.join(dir, this.getResource, Terraform.BACKUP_STATE);
      let options = ['-no-color', '-force'];

      if (fse.existsSync(statePath)) {
        options.push(`-state=${ statePath }`, `-state-out=${ statePath }`, `-backup=${ backupStatePath }`);
      }

      return this.run('destroy', options, dir).then(result => new State(statePath, backupStatePath));
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

    if (planOrState instanceof Plan) {
      options.push(planOrState.path)
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
   * @param {string} dir
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

    if (this.logger) {
      let fileNames = [];
      walkDir(cwd, /.*/, (fileName) => fileNames.push(fileName));

      this.logger.debug({
        fileNames: fileNames,
        command: `${this.getBinary} ${command}`,
        args: args
      });
    }

    return execa(
      path.resolve(this.getBinary),
      [ command ].concat(args),
      { env, cwd }
    ).then(result => {
      const { stdout, code } = result;

      return Promise.resolve({ code, output: stdout });
    });
  }

  /**
   * @param {string} version
   *
   * @returns {Promise}
   */
  ensure(version = Terraform.VERSION) {
    return fse.pathExists(this.getBinary)
      .then(exists => {
        if (exists) {
          return Promise.resolve();
        }

        // todo: rethink this logic
        const downloader = new Downloader();
        const dir = path.dirname(this.getBinary);

        // todo: validate version to follow format X.Y.Z
        console.log(`TODO: Validate version ${ version } for binary ${ this.getBinary }`);

        return downloader.download(dir, version).then(() => {
          const realPath = path.join(dir, Terraform.BIN_FILE);

          if (realPath === this.getBinary) {
            return Promise.resolve();
          }

          return fse.move(realPath, this.getBinary);
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
   * @returns {string}
   */
  static get VERSION() {
    const { version } = pjson.terraform || '0.10.3';
    return version;
  }

  /**
   * @returns {string}
   */
  static get PLAN() {
    return 'terraform.tfplan';
  }

  /**
   * @returns {string}
   */
  static get STATE() {
    return 'terraform.tfstate';
  }

  /**
   * @returns {string}
   */
  static get BACKUP_STATE() {
    return `terraform.tfstate.${ new Date().getTime() }.backup`;
  }

  /**
   * @returns {string}
   */
  static get RESOURCE() {
    return '.resource';
  }

  /**
   * @returns {string}
   */
  static get BIN_PATH() {
    return path.resolve(process.cwd(), 'bin');
  }

  /**
   * @returns {string}
   */
  static get BIN_FILE() {
    return 'terraform';
  }

  /**
   * @returns {string}
   */
  static get BINARY() {
    return path.join(Terraform.BIN_PATH, Terraform.BIN_FILE);
  }
}

module.exports = Terraform;
