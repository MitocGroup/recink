'use strict';

const AbstractDriver = require('./abstract-driver');
const S3 = require('aws-sdk/clients/s3');
const path = require('path');
const fs = require('fs');
const progress = require('progress-stream');
const md5File = require('md5-file');
const pify = require('pify');

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
   * @returns {promise}
   *
   * @private
   */
  _upload() {
    return this._packageSize
      .then(ContentLength => {
        if (ContentLength <= 0) {
          return Promise.resolve();
        }
        
        return this._hasChanged
          .then(hasChanged => {
            if (!hasChanged) {
              return Promise.resolve();
            }
            
            const { Bucket, Key } = this._parseS3Path(this.path);
            const packageStream = fs.createReadStream(this._packagePath);
            
            packageStream.on('error', error => reject(error));
            
            const Body = this._track(packageStream, ContentLength);

            return this.client
              .upload({ Bucket, Key, Body, })
              .promise();
          });
      });
  }
  
  /**
   * @returns {promise}
   *
   * @private
   */
  get _hasChanged() {
    return pify(md5File)(this._packagePath)
      .then(packageHash => {
        const { Bucket, Key } = this._parseS3Path(this.path);
        
        return this.client
          .headObject({ Bucket, Key, })
          .promise()
          .then(data => {
            const remoteHash = data.ETag.replace(/"/g, '');
            
            return Promise.resolve(packageHash !== remoteHash);
          })
          .catch(error => {
            if (this._isMissingObject(error)) {
              return Promise.resolve(true);
            }
            
            return Promise.reject(error);
          });
      });
  }
  
  /**
   * @returns {promise}
   *
   * @private
   */
  _download() {
    return new Promise((resolve, reject) => {
      const { Bucket, Key } = this._parseS3Path(this.path);
      const packageStream = fs.createWriteStream(this._packagePath);
      const remoteStream = this.client
        .getObject({ Bucket, Key, }).createReadStream();
      
      remoteStream.on('end', () => resolve());
      remoteStream.on('error', error => {
        if (this._isMissingObject(error)) {
          return resolve();
        }
        
        reject(error);
      });
      packageStream.on('error', error => reject(error));
      
      this._track(remoteStream).pipe(packageStream);
    });
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
   * @param {ReadableStream} stream
   * @param {number} length
   * @param {number} time
   *
   * @private
   */
  _track(stream, length = undefined, time = 50) {
    const tracker = progress({ length, time, });
        
    tracker.on('progress', progress => {
      this._progress(progress.length, progress.transferred);
    });
        
    return stream.pipe(tracker);
  }
  
  /**
   * @param {string} s3Path
   *
   * @returns {*}
   *
   * @private
   */
  _parseS3Path(s3Path) {
    const matches = s3Path.match(
      /^(?:s3:\/\/|\/)?([^\/]+)(?:\/(.*))?$/i
    );
    
    if (matches.length === 2) {
      matches.push('');
    }
    
    const [ , Bucket, keyPrefix ] = matches;
    
    const Key = path.join(
      keyPrefix || '',
      path.basename(this._packagePath)
    );
    
    return { Bucket, Key };
  }
}

module.exports = S3Driver;
