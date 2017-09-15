'use strict';

const fse = require('fs-extra');

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
   * @returns {Promise}
   */
  state() {
    return fse.readJson(this._path);
  }

  /**
   * @returns {Promise}
   */
  backupState() {
    return fse.readJson(this._backupPath);
  }
}

module.exports = State;
