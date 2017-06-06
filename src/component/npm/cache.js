'use strict';

const fse = require('fs-extra');
const path = require('path');

class Cache {
  /**
   * @param {string} cacheDir
   * @param {string} prefix
   */
  constructor(cacheDir, prefix) {
    this._cacheDir = cacheDir;
    this._prefix = prefix;
  }
  
  /**
   * @returns {string}
   */
  get prefix() {
    return this._prefix;
  }
  
  /**
   * @returns {string}
   */
  get cacheDir() {
    return this._cacheDir;
  }
  
  /**
   * @param {string} key
   *
   * @returns {promise}
   */
  has(key) {
    return fse.pathExists(this._cacheKey(key));
  }
  
  /**
   * @param {string} key
   * @param {string} src
   *
   * @returns {promise}
   */
  save(key, src) {
    return fse.copy(src, this._cacheKey(key));
  }
  
  /**
   * @param {string} key
   * @param {string} dest
   *
   * @returns {promise}
   */
  restore(key, dest) {
    return fse.copy(this._cacheKey(key), dest);
  }
  
  /**
   * @param {string} key
   *
   * @returns {promise}
   */
  invalidate(key) {
    return fse.remove(this._cacheKey(key));
  }
  
  /**
   * @returns {promise}
   */
  flush() {
    return fse.remove(this._base);
  }
  
  /**
   * @returns {string}
   *
   * @private
   */
  get _base() {
    return path.join(this.cacheDir, process.version, this.prefix);
  }
  
  /**
   * @param {string} key
   *
   * @returns {string}
   *
   * @private
   */
  _cacheKey(key) {
    return path.join(this._base, key);
  }
}

module.exports = Cache;
