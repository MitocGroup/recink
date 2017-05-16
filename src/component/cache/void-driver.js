'use strict';

const AbstractDriver = require('./abstract-driver');

class VoidDriver extends AbstractDriver {
  /**
   * @returns {Promise}
   *
   * @private
   */
  _upload() {
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _download() {
    return Promise.resolve();
  }
}

module.exports = VoidDriver;
