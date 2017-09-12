'use strict';

const Terraform = require('../terraform');
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
   * @param {boolean} stripPrivateData
   * 
   * @returns {Promise}
   */
  state(stripPrivateData = true) {
    return fse.readJson(this._path)
      .then(stateObj => {
        if (!stripPrivateData) {
          return Promise.resolve(stateObj);
        }

        return Promise.resolve(this._stripePrivateData(stateObj));
      });
  }

  /**
   * @param {boolean} stripPrivateData
   * 
   * @returns {Promise}
   */
  backupState(stripPrivateData = true) {
    return fse.readJson(this._backupPath)
      .then(stateObj => {
        if (!stripPrivateData) {
          return Promise.resolve(stateObj);
        }

        return Promise.resolve(this._stripPrivateData(stateObj));
      });
  }

  /**
   * @param {*} obj
   * 
   * @returns {*}
   * 
   * @private
   */
  _stripPrivateData(obj) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = this._stripSensitiveData(obj[key]);
        } else if (obj[key] && typeof obj[key] === 'object') {
          obj[key] = this._stripPrivateData(obj[key]);
        }
      });
    }

    return obj;
  }

  /**
   * @param {string} str 
   * 
   * @returns {string}
   * 
   * @private
   * 
   * @todo implement stripping any sensitive 
   *        data found besides AWS Account Id
   */
  _stripSensitiveData(str) {
    return this._stripAwsAccountFromArn(str);
  }

  /**
   * @param {string} str 
   * 
   * @returns {string}
   * 
   * @private
   */
  _stripAwsAccountFromArn(str) {
    return str.replace(/^(arn:aws:[^:]*:[^:]*:)([^:]*)(:.*)$/i, '$1************$3');
  }
}

module.exports = State;
