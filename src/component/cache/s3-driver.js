'use strict';

const AbstractDriver = require('./abstract-driver');
const AwsS3 = require('aws-sdk/clients/s3');
const s3 = require('s3');
const path = require('path');

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
    this._client = s3.createClient({
      s3Client: new AwsS3(this.options),
    });
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
    return new Promise((resolve, reject) => {
      const uploader = this.client.uploadFile(this._uploadOptions);

      uploader.on('error', error => reject(error));
      uploader.on('progress', () => {
        this._progress(
          uploader.progressTotal, 
          uploader.progressAmount
        );
      });
      uploader.on('end', () => resolve());
    });
  }
  
  /**
   * @returns {Promise|*}
   *
   * @private
   */
  _download() {
    return new Promise((resolve, reject) => {
      const uploader = this.client.downloadFile(this._uploadOptions);

      uploader.on('error', error => {
        if (/404/i.test(error.message)) {
          return resolve();
        }
        
        reject(error);
      });
      uploader.on('progress', () => {
        this._progress(
          uploader.progressTotal, 
          uploader.progressAmount
        );
      });
      uploader.on('end', () => resolve());
    });
  }
  
  /**
   * @returns {*}
   *
   * @private
   */
  get _uploadOptions() {
    const { Bucket, Key } = this._parseS3Path(this.path);
    
    return {
      localFile: this._packagePath,
      s3Params: { Bucket, Key },
    };
  }
  
  /**
   * @returns {string} s3Path
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
