'use strict';

const AbstractDriver = require('./abstract-driver');

class S3Driver extends AbstractDriver {
  /**
   * @returns {Promise|*}
   */
  upload() {
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise|*}
   */
  download() {
    return Promise.resolve();
  }
}

module.exports = S3Driver;
