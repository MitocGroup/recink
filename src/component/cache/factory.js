'use strict';

const AbstractDriver = require('./abstract-driver');

class Factory {  
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractDriver|*}
   */
  static create(name, ...args) {
    const DriverImplementation = require(`./${ name }-driver`);
    const driver = new DriverImplementation(...args);
    
    if (!(driver instanceof AbstractDriver)) {
      throw new Error(`${ name } driver should be an implementation of AbstractDriver`);
    }
    
    return driver;
  }
  
  /**
   * @param {*} args
   *
   * @returns {VoidDriver|*}
   */
  static s3(...args) {
    return this.create('s3', ...args);
  }
  
  /**
   * @param {*} args
   *
   * @returns {VoidDriver|*}
   */
  static void(...args) {
    return this.create('void', ...args);
  }
}

module.exports = Factory;
