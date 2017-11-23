'use strict';

const path = require('path');
const AbstractDriver = require('./abstract-driver');
const AwsCredentials = require('../helper/aws-credentials');

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
    this._includeNodeVersion = includeNodeVersion;
    this._awsCredentials = new AwsCredentials(this.options);
    this._client = false;
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
   * Get AWS.S3 client promise
   * @return {Promise}
   */
  get client() {
    if (this._client) {
      return Promise.resolve(this._client);
    }

    return this._awsCredentials.getConfig().then(AWS => Promise.resolve(new AWS.S3()));
  }

  /**
   * @returns {*}
   */
  get options() {
    return this._options;
  }

  /**
   * @param {string} name
   * @returns {Promise}
   * @private
   */
  _read(name) {
    const { Bucket, Key } = this._s3Payload(name);

    return this.client
      .then(S3 => S3.getObject({ Bucket, Key }).promise())
      .then(data => Promise.resolve(data.Body.toString()))
      .catch(error => {
        if (this._isMissingObject(error)) {
          return Promise.resolve(null);
        }

        return Promise.reject(error);
      });
  }

  /**
   * @param {string} name
   * @param {string} content
   * @returns {Promise}
   * @private
   */
  _write(name, content) {
    const Body = content;
    const { Bucket, Key } = this._s3Payload(name);
    
    return this.client
      .then(S3 => S3.upload({ Bucket, Key, Body }).promise())
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
