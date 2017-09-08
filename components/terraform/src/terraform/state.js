'use strict';

const path = require('path');
const Terraform = require('../terraform');

/**
 * Terraform state
 */
class State {
  /**
   * @param {string} path 
   * @param {string} backupPath
   */
  constructor(path, backupPath) {
    this._path = path;
    this._backupPath = backupPath;
  }

  /**
   * @returns {string}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {string}
   */
  get backupPath() {
    return this._backupPath;
  }

  /**
   * @param {string} dir 
   * 
   * @returns {State}
   */
  static create(dir) {
    return new State(
      path.resolve(dir, Terraform.STATE),
      path.resolve(dir, Terraform.BACKUP_STATE)
    );
  }
}

module.exports = State;
