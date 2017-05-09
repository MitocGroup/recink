'use strict';

const AbstractConfig = require('./abstract-config');

class Factory {
  /**
   * @param {string} file
   *
   * @returns {YamlConfig|*}
   */
  static guess(file) {
    if (/\.ya?ml$/i.test(file)) {
      return this.yaml(file);
    }
    
    throw new Error(`Unknown config format in ${ file }`);
  }
  
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractConfig|*}
   */
  static create(name, ...args) {
    const ConfigImplementation = require(`./${ name }-config`);
    const config = new ConfigImplementation(...args);
    
    if (!(config instanceof AbstractConfig)) {
      throw new Error(`${ name } config should be an implementation of AbstractConfig`);
    }
    
    return config;
  }
  
  /**
   * @param {*} args
   *
   * @returns {YamlConfig|*}
   */
  static yaml(...args) {
    return this.create('yaml', ...args);
  }
}

module.exports = Factory;
