'use strict';

const AbstractTransformer = require('./abstract-transformer');

class Factory {  
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractTransformer}
   */
  static create(name, ...args) {
    const TransformerImplementation = require(`./${ name }-transformer`);
    const transformer = new TransformerImplementation(...args);
    
    if (!(transformer instanceof AbstractTransformer)) {
      throw new Error(`${ name } transformer should be an implementation of AbstractTransformer`);
    }
    
    return transformer;
  }
  
  /**
   * @param {*} args
   *
   * @returns {VoidDriver}
   */
  static eval(...args) {
    return this.create('eval', ...args);
  }
}

module.exports = Factory;
