'use strict';

const fs = require('fs');
const pify = require('pify');

class AbstractConfig {
  /**
   * @param {string} file
   */
  constructor(file = null) {
    this._file = file;
  }
  
  /**
   * @returns {string}
   */
  get file() {
    return this._file;
  }
  
  /**
   * @param {string} file
   *
   * @returns {promise}
   */
  load(file = null) {
    return pify(fs.readFile)(file || this.file)
      .then(rawConfig => this.decode(rawConfig));
  }
  
  /**
   * @param {*} config
   * @param {string} file
   *
   * @returns {promise}
   */
  dump(config, file = null) {
    return this.encode(config)
      .then(rawConfig => pify(fs.writeFile)(file || this.file, rawConfig));
  }
  
  /**
   * @param {string} rawConfig
   *
   * @returns {promise}
   */
  decode(rawConfig) {
    return Promise.reject(new Error(`${ this.constructor.name }.decode(rawConfig) not implemented!`));
  }
  
  /**
   * @param {*} config
   *
   * @returns {promise}
   */
  encode(config) {
    return Promise.reject(new Error(`${ this.constructor.name }.encode(config) not implemented!`));
  }
}

module.exports = AbstractConfig;
