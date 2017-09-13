'use strict';

const path = require('path');
const modulesDir = require('global-modules');
const fse = require('fs-extra');
const Install = require('./npm/install');
const Uninstall = require('./npm/uninstall');

/**
 * Registry Component
 */
class Component {
  /**
   * @param {string} name
   */
  constructor(name) {
    this._name = name;
    this._version = null;
    this._hasConfig = false;
  }
  
  /**
   * @returns {Promise}
   */
  load() {
    return fse.pathExists(this.path)
      .then(exists => {
        if (!exists) {
          return new Install(this.name).run();
        }
        
        return Promise.resolve();
      })
      .then(() => {
        const packageJson = require(this.packagePath);
        
        this._version = packageJson.version;
        
        return fse.pathExists(this._configPath)
          .then(hasConfig => {
            this._hasConfig = hasConfig;
          });
      });
  }
  
  /**
   * @returns {Promise}
   */
  unload() {
    return fse.pathExists(this.path)
      .then(exists => {
        if (!exists) {
          this._version = null;
          this._hasConfig = false;
          
          return Promise.resolve();
        }
        
        return new Uninstall(this.name).run()
          .then(() => {
            this._version = null;
            this._hasConfig = false;
            
            return Promise.resolve();
          });
      });
  }
  
  /**
   * @returns {string}
   */
  get packagePath() {
    return path.join(this.path, 'package.json');
  }

  /**
   * @returns {string}
   */
  get configPath() {
    return this._hasConfig ? this._configPath : null;
  }
  
  /**
  * @returns {string}
  *
  * @private
  */
  get _configPath() {
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
    return path.join(modulesDir, this.name);
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
