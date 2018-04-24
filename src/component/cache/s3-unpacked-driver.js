'use strict';

const fs = require('fs-extra');
const path = require('path');
const S3Driver = require('./s3-driver');
const { findFilesByPattern } = require('../../helper/util');

/**
 * AWS S3 (unpacked) cache driver
 */
class S3UnpackedDriver extends S3Driver {
  /**
   * @param {String} cacheDir
   * @param {String} baseDir
   * @param {String} s3path
   * @param {Object} s3options
   */
  constructor(cacheDir, baseDir, s3path, s3options) {
    super(cacheDir, s3path, s3options, false);

    this._baseDir = baseDir;
  }

  /**
   * @returns {String}
   */
  get name() {
    return 's3-unpacked';
  }

  /**
   * @returns {String}
   * @private
   */
  get _packagePath() {
    return this.cacheDir;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _download() {
    const { Bucket, Key } = this._s3Location(this.path);

    return this.client.then(S3 => {
      return S3.listObjectsV2({ Bucket: Bucket, Prefix: Key }).promise();
    }).then(listRes => {
      let keys = listRes.Contents.filter(item => item.Size).map(item => item.Key);

      return Promise.all(keys.map(key => {
        return this._getAndSaveS3Object(key, key.replace(Key, this.cacheDir));
      }));
    });
  }

  /**
   * @returns {Promise}
   * @private
   */
  _unpack() {
    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   * @private
   */
  _pack() {
    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   * @private
   */
  _removePackageFile() {
    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   * @private
   */
  _upload() {
    const { Bucket, Key } = this._s3Location(this.path);
    const list = findFilesByPattern(this.cacheDir, /.*/);

    return Promise.all(
      list.map(filePath => {
        const stream = fs.createReadStream(filePath);
        const tfResource = Key.split('/').pop();
        const additionalKey = filePath.substring(filePath.lastIndexOf(tfResource) + tfResource.length);
        const fullS3Key = path.normalize(`${Key}/${additionalKey}`);

        return this.client.then(S3 => {
          return S3.upload({ Bucket: Bucket, Key: fullS3Key, Body: stream }).promise();
        });
      })
    );
  }

  /**
   * Get S3 object and save it to local path
   * @param {String} objectKey
   * @param {String} pathToSave
   * @returns {Promise}
   */
  _getAndSaveS3Object(objectKey, pathToSave) {
    return this.client.then(S3 => {
      const { Bucket } = this._s3Location(this.path);

      return S3.getObject({ Bucket: Bucket, Key: objectKey }).promise().then(content => {
        return fs.outputFile(pathToSave, content.Body);
      });
    });
  }
}

module.exports = S3UnpackedDriver;
