'use strict';

const path = require('path');

/**
 * Registry Component
 */
class Component {
  /**
   * @param {string} name
   */
  constructor(name) {
    this._name = name;
    this._path = null;
    this._version = null;
  }
  
  /**
   * @returns {Promise}
   */
  load() {
    return Promise.resolve();
  }
  
  /**
   * @returns {string}
   */
  get configPath() {
    return path.join(this.path, 'template/.recink.yml');
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return this._name;
  }
  
  /**
   * @returns {string}
   */
  get path() {
    return this._path;
  }
  
  /**
   * @returns {string}
   */
  get version() {
    return this._version;
  }
  
  /**
   * @returns {*}
   */
  toJSON() {
    const { name, path, version, configPath } = this;
    
    return { name, path, version, configPath };
  }
}

module.exports = Component;
