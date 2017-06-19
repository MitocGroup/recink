'use strict';

const fse = require('fs-extra');
const path = require('path');

/**
 * File system cache implementation
 */
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
   * @returns {Promise}
   */
  has(key) {
    return fse.pathExists(this._cacheKey(key));
  }
  
  /**
   * @param {string} key
   * @param {string} src
   *
   * @returns {Promise}
   */
  save(key, src) {
    return fse.copy(src, this._cacheKey(key));
  }
  
  /**
   * @param {string} key
   * @param {string} dest
   *
   * @returns {Promise}
   */
  restore(key, dest) {
    return fse.copy(this._cacheKey(key), dest);
  }
  
  /**
   * @param {string} key
   *
   * @returns {Promise}
   */
  invalidate(key) {
    return fse.remove(this._cacheKey(key));
  }
  
  /**
   * @returns {Promise}
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
    return path.join(this.cacheDir, this.prefix);
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
