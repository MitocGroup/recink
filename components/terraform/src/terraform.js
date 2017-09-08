'use strict';

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const Downloader = require('./downloader');

/**
 * Terraform wrapper
 */
class Terraform {
  /**
   * @param {*} vars
   * @param {string} binaryPath 
   * @param {string} resourcePath
   */
  constructor(
    vars = {}, 
    binaryPath = Terraform.DEFAULT_BINARY_PATH, 
    resourcePath = Terraform.RESOURCE_PATH
  ) {
    this._binaryPath = binaryPath;
    this._resourcePath = resourcePath;
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
   * @returns {string}
   */
  get resourcePath() {
    return this._resourcePath;
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
   * @returns {string}
   */
  get planPath() {
    return path.join(this.resourcePath, Terraform.PLAN);
  }

  /**
   * @returns {string}
   */
  get statePath() {
    return path.join(this.resourcePath, Terraform.STATE);
  }

  /**
   * @returns {string}
   */
  get stateBackupPath() {
    return path.join(this.resourcePath, Terraform.BACKUP_STATE);
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * 
   * @param {string} statePath
   * @param {string} planPath
   * 
   * @returns {Promise} 
   */
  plan(statePath = null, planPath = null) {
    return this.run('plan', [
      `-out="${ planPath || this.planPath }"`,
      `-state="${ statePath || this.statePath }"`,
      '-detailed-exitcode',
      '-no-color',
    ]).then(result => {
      result.diff = result.code === 2;
console.log('-->', result)//@todo remove
      return Promise.resolve(result);
    });
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * 
   * @param {string} statePath
   * @param {string} planPath
   * @param {string} stateBackupPath
   * 
   * @returns {Promise} 
   */
  apply(planPath = null, statePath = null, stateBackupPath = null) {
    return this.run('apply', [
      planPath || this.planPath,
      `-state="${ statePath || this.statePath }"`,
      `-backup="${ stateBackupPath || this.stateBackupPath }"`,
      '-auto-approve=true',
      '-no-color',
    ]);
  }

  /**
   * @param {string} command 
   * @param {Array} args
   * 
   * @returns {Promise} 
   */
  run(command, args = []) {
    const { env } = this;

    return execa(
      this.binaryPath, 
      [ command ].concat(args),
      { env }
    ).then(result => {
      const { stdout, code } = result;

      return Promise.resolve({ code, output: stdout });
    });
  }

  /**
   * @returns {Promise}
   */
  init() {
    const downloader = new Downloader();

    return new Promise(resolve => {
      fs.exists(
        Terraform.DEFAULT_BINARY_PATH, 
        exists => resolve(exists)
      );
    }).then(exists => {
      if (exists) {
        return Promise.resolve();
      }

      return downloader.download(Terraform.BIN_PATH);
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
  static get DEFAULT_BINARY_PATH() {
    return path.join(Terraform.BIN_PATH, Terraform.BINARY);
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
    return path.resolve(__dirname, '../bin');
  }

  /**
   * @returns {string}
   */
  static get RESOURCE_PATH() {
    return path.resolve(__dirname, '../resource');
  }
}

module.exports = Terraform;
