'use strict';

const AbstractDriver = require('./abstract-driver');

/**
 * Void cache driver
 */
class VoidDriver extends AbstractDriver {
  /**
   * @returns {string}
   */
  get name() {
    return 'void';
  }

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
