'use strict';

const AbstractDriver = require('./abstract-driver');

class VoidDriver extends AbstractDriver {
  /**
   * @returns {promise}
   *
   * @private
   */
  _upload() {
    return Promise.resolve();
  }
  
  /**
   * @returns {promise}
   *
   * @private
   */
  _download() {
    return Promise.resolve();
  }
}

module.exports = VoidDriver;
