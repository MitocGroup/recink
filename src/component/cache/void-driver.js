'use strict';

const AbstractDriver = require('./abstract-driver');

class VoidDriver extends AbstractDriver {
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

module.exports = VoidDriver;
