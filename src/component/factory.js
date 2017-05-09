'use strict';

const AbstractComponent = require('./abstract-component');

class Factory {  
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractComponent|*}
   */
  static create(name, ...args) {
    const ComponentImplementation = require(`./${ name }-component`);
    const component = new ComponentImplementation(...args);
    
    if (!(component instanceof AbstractComponent)) {
      throw new Error(`${ name } config should be an implementation of AbstractComponent`);
    }
    
    return component;
  }
  
  /**
   * @param {*} args
   *
   * @returns {EmitComponent|*}
   */
  static emit(...args) {
    return this.create('emit', ...args);
  }
  
  /**
   * @param {*} args
   *
   * @returns {CacheComponent|*}
   */
  static cache(...args) {
    return this.create('cache', ...args);
  }
  
  /**
   * @param {*} args
   *
   * @returns {CoverageComponent|*}
   */
  static coverage(...args) {
    return this.create('coverage', ...args);
  }
  
  /**
   * @param {*} args
   *
   * @returns {TestComponent|*}
   */
  static test(...args) {
    return this.create('test', ...args);
  }
}

module.exports = Factory;
