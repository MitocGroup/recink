'use strict';

const AbstractDriver = require('./abstract-driver');
const S3 = require('aws-sdk/clients/s3');
const path = require('path');

/**
 * AWS S3 coverage storage driver
 */
class S3Driver extends AbstractDriver {
  /**
   * @param {string} path
   * @param {*} options
   * @param {boolean} includeNodeVersion
   */
  constructor(path, options, includeNodeVersion = true) {
    super();
    
    this._path = path;
    this._options = options;
    this._client = new S3(this.options);
    this._includeNodeVersion = includeNodeVersion;
  }
  
  /**
   * @returns {boolean}
   */
  get includeNodeVersion() {
    return this._includeNodeVersion;
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
   * @returns {promise}
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
   * @returns {promise}
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
    
    const Key = path.join(
      keyPrefix || '',
      this.includeNodeVersion ? process.version : '',
      name
    ).replace(/\\+/g, '/'); // ensure path delimiter set to slash
    
    return { Bucket, Key };
  }
}

module.exports = S3Driver;
