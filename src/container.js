'use strict';

const print = require('print');
const dot = require('dot-object');
dot.overwrite = true;

/**
 * Configuration container
 */
class Container {
  /**
   * @param {*} config
   */
  constructor(config = {}) {
    this._config = config;
  }
  
  /**
   * @param {*} config
   *
   * @returns {Container}
   */
  reload(config) {
    this._config = config;
    
    return this;
  }
  
  /**
   * @returns {Array}
   */
  listKeys() {
    return Object.keys(this._config);
  }
  
  /**
   * @param {string} path
   * @param {*} value
   *
   * @returns {Container}
   */
  set(path, value) {
    dot.str(path, value, this._config);
    
    return this;
  }
  
  /**
   * @param {string} path
   * @param {*} defaultValue
   *
   * @returns {*}
   */
  get(path, defaultValue = null) {
    if (!this.has(path)) {
      return defaultValue;
    }
    
    return dot.pick(path, this._config);
  }
  
  /**
   * @param {string} path
   *
   * @returns {boolean}
   */
  has(path) {
    return typeof dot.pick(path, this._config) !== 'undefined';
  }

  /**
   * Remove the value
   * @param {String} path
   * @return {Container}
   */
  del(path) {
    dot.del(path, this._config);

    return this;
  }
  
  /**
   * @returns {string}
   */
  dump() {
    return print(this.raw, {
      showArrayIndices: true,
      showArrayLength: true,
      sortProps: false,
    }).replace(/\t/g, '   ');
  }
  
  /**
   * @returns {*}
   */
  get raw() {
    return this._config;
  }
}

module.exports = Container;
