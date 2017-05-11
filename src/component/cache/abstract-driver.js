'use strict';

class AbstractDriver {
  /**
   * @returns {string}
   */
  constructor(cacheDir) {
    this._cacheDir = cacheDir;
  }
  
  /**
   * @returns {string}
   */
  get cacheDir() {
    return this._cacheDir;
  }
  
  /**
   * @returns {Promise|*}
   */
  upload() {
    return Promise.reject(new Error(
      `${ this.constructor.name }.upload() not implemented!`
    ));
  }
  
  /**
   * @returns {Promise|*}
   */
  download() {
    return Promise.reject(new Error(
      `${ this.constructor.name }.download() not implemented!`
    ));
  }
}

module.exports = AbstractDriver;
