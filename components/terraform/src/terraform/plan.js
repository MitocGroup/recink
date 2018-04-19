'use strict';

const path = require('path');

/**
 * Terraform plan
 */
class Plan {
  /**
   * @param {String} path 
   * @param {String} output
   */
  constructor(path, output) {
    this._path = path;
    this._output = output;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {String}
   */
  get dir() {
    return path.dirname(this._path);
  }

  /**
   * @returns {String}
   */
  get output() {
    return this._output;
  }
}

module.exports = Plan;
