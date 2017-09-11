'use strict';

const path = require('path');
const fse = require('fs-extra');
const execa = require('execa');
const Downloader = require('./downloader');
const Plan = require('./terraform/plan');
const State = require('./terraform/state');

/**
 * Terraform wrapper
 */
class Terraform {
  /**
   * @param {*} vars
   * @param {string} binaryPath 
   */
  constructor(vars = {}, binaryPath = Terraform.DEFAULT_BINARY_PATH) {
    this._binaryPath = binaryPath;
    this._vars = vars;
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
  get binaryPath() {
    return this._binaryPath;
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
   * 
   * @returns {Promise} 
   */
  init(dir) {
    return this.run('init', [
      '-no-color',
      '.',
    ], dir).then(result => Promise.resolve());
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * 
   * @param {string} dir
   * 
   * @returns {Promise} 
   */
  plan(dir) {
    return this.run('plan', [
      '-no-color',
      `-out=${ Terraform.PLAN }`,
    ], dir).then(result => {
      return new Plan(
        path.resolve(dir, Terraform.PLAN),
        result.output
      );
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
    return this.run('apply', [
      '-auto-approve=true',
      '-no-color',
      `-state=${ Terraform.STATE }`,
      `-state-out=${ Terraform.STATE }`,
      `-backup=${ Terraform.BACKUP_STATE }`,
    ], dir).then(result => {
      return new State(
        path.resolve(dir, Terraform.STATE),
        path.resolve(dir, Terraform.BACKUP_STATE)
      );
    });
  }

  /**
   * @param {string} command 
   * @param {Array} args
   * @param {string} cwd
   * 
   * @returns {Promise} 
   */
  run(command, args = [], cwd = process.cwd()) {
    const { env } = this;

    return execa(
      this.binaryPath, 
      [ command ].concat(args),
      { env, cwd }
    ).then(result => {
      const { stdout, code } = result;

      return Promise.resolve({ code, output: stdout });
    });
  }

  /**
   * @returns {Promise}
   */
  ensure() {
    return fse.pathExists(this.binaryPath)
      .then(exists => {
        if (exists) {
          return Promise.resolve();
        }

        const downloader = new Downloader();
        const dir = path.dirname(this.binaryPath);

        return downloader.download(dir)
          .then(() => {
            const realPath = path.join(dir, Terraform.BINARY);

            if (realPath === this.binaryPath) {
              return Promise.resolve();
            }

            return fse.move(realPath, this.binaryPath);
          });
      });
  }

  /**
   * @returns {string}
   */
  static get BACKUP_STATE() {
    return 'terraform.tfstate.backup';
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
  static get PLAN() {
    return 'terraform.tfplan';
  }

  /**
   * @returns {string}
   */
  static get BINARY() {
    return 'terraform';
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
  static get DEFAULT_BINARY_PATH() {
    return path.join(Terraform.BIN_PATH, Terraform.BINARY);
  }
}

module.exports = Terraform;
