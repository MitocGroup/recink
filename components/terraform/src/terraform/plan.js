'use strict';

const path = require('path');
const Terraform = require('../terraform');

/**
 * Terraform plan
 */
class Plan {
  /**
   * @param {string} path 
   * @param {boolean} diff
   */
  constructor(path, diff) {
    this._path = path;
    this._diff = diff;
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
  get diff() {
    return this._diff;
  }

  /**
   * @param {string} dir 
   * @param {boolean} diff 
   * 
   * @returns {Plan}
   */
  static create(dir, diff) {
    return new Plan(path.resolve(dir, Terraform.PLAN), diff);
  }
}

module.exports = Plan;
