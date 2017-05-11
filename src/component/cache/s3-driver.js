'use strict';

const AbstractDriver = require('./abstract-driver');
const S3 = require('aws-sdk/clients/s3');

class S3Driver extends AbstractDriver {
  /**
   * @param {string} cacheDir
   * @param {string} path
   * @param {*} options
   */
  constructor(cacheDir, path, options) {
    super(cacheDir);
    
    this._path = path;
    this._options = options;
    this._client = new S3(this.options);
    
    console.log('path', path);//@todo remove
    console.log('this.options', options);//@todo remove
  }
  
  /**
   * @returns {string}
   */
  get path() {
    return this._path;
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
