'use strict';

const AbstractDriver = require('./abstract-driver');

class S3Driver extends AbstractDriver {
  /**
   * @param {string} cacheDir
   * @param {*} options
   */
  constructor(cacheDir, options) {
    super(cacheDir);
    
    this._options = options;
    this._client = null;
  }
  
  /**
   * @returns {*}
   */
  get client() {    
    return this._client;
  }
  
  /**
   * @returns {*}
   */
  get realOptions() {
    const result = {};
    
    // @todo find a smarter way to transform options
    Object.keys(this._options)
      .map(key => {
        result[key] = eval(this._options[key]);
      });
    
    return result;
  }
  
  /**
   * @returns {*}
   */
  get options() {
    return this._options;
  }
  
  /**
   * @returns {Promise|*}
   *
   * @private
   */
  _upload() {
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise|*}
   *
   * @private
   */
  _download() {
    return Promise.resolve();
  }
}

module.exports = S3Driver;
