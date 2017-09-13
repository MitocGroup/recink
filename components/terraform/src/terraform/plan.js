'use strict';

const PlanParser = require('tf-parse').Plan;

/**
 * Terraform plan
 */
class Plan {
  /**
   * @param {string} path 
   * @param {string} output
   */
  constructor(path, output) {
    this._path = path;
    this._output = output;
    this._diff = new PlanParser().parse(this.output);
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
  get output() {
    return this._output;
  }

  /**
   * @returns {*}
   */
  get diff() {
    return this._diff;
  }

  /**
   * @returns {boolean}
   */
  get changed() {
    return !(Object.keys(this._diff.mod.prev).length <= 0
      && Object.keys(this._diff.mod.next).length <= 0
      && Object.keys(this._diff.rep.prev).length <= 0
      && Object.keys(this._diff.rep.next).length <= 0
      && Object.keys(this._diff.add).length <= 0
      && Object.keys(this._diff.del).length <= 0);
  }
}

module.exports = Plan;
