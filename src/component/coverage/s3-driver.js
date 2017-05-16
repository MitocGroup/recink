'use strict';

const AbstractDriver = require('./abstract-driver');
const S3 = require('aws-sdk/clients/s3');
const path = require('path');

class S3Driver extends AbstractDriver {
  /**
   * @param {string} path
   * @param {*} options
   */
  constructor(path, options) {
    super();
    
    this._path = path;
    this._options = options;
    this._client = new S3(this.options);
  }
  
  /**
   * @returns {string}
   */
  get path() {
    return this._path;
  }
  
  /**
   * @returns {S3}
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
   * @param {string} name
   * 
   * @returns {Promise}
   *
   * @private
   */
  _read(name) {
    const { Bucket, Key } = this._s3Payload(name);
    
    return this.client
      .getObject({ Bucket, Key, })
      .promise()
      .then(data => Promise.resolve(data.Body.toString()))
      .catch(error => {
        if (this._isMissingObject(error)) {
          return Promise.resolve(null);
        }
        
        Promise.reject(error);
      });
  }
  
  /**
   * @param {string} name
   * @param {string} content
   * 
   * @returns {Promise}
   *
   * @private
   */
  _write(name, content) {
    const Body = content;
    const { Bucket, Key } = this._s3Payload(name);
    
    return this.client
      .upload({ Bucket, Key, Body, })
      .promise()
      .then(data => Promise.resolve());
  }
  
  /**
   * @param {*} error
   *
   * @returns {boolean}
   * 
   * @private
   */
  _isMissingObject(error) {
    return [ 'NoSuchKey', 'NotFound' ].indexOf(error.code) !== -1;
  }
  
  /**
   * @param {string} name
   *
   * @returns {*}
   *
   * @private
   */
  _s3Payload(name) {
    const matches = this.path.match(
      /^(?:s3:\/\/|\/)?([^\/]+)(?:\/(.*))?$/i
    );
    
    if (matches.length === 2) {
      matches.push('');
    }
    
    const [ , Bucket, keyPrefix ] = matches;
    const Key = path.join(keyPrefix || '', name);
    
    return { Bucket, Key };
  }
}

module.exports = S3Driver;
