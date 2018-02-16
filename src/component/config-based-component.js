'use strict';

const path = require('path');
const Container = require('../container');
const AbstractComponent = require('./abstract-component');

/**
 * Abstract configuration aware component
 */
class ConfigBasedComponent extends AbstractComponent {
  /**
   * @param {String} configPath
   */
  constructor(configPath = null) {
    super();
    
    this._container = null;
    this._readyPromise = Promise.resolve();
    this._configPath = configPath || `${ ConfigBasedComponent.MAIN_CONFIG_KEY }.${ this.name }`;
    this._configFileRealPath = null;
  }

  /**
   * @returns {*}
   */
  get container() {
    return this._container;
  }
  
  /**
   * @returns {String}
   */
  get configPath() {
    return this._configPath;
  }

  /**
   * @returns {String}
   */
  get configFileRealPath() {
    return this._configFileRealPath;
  }

  /**
   * @param {Emitter} emitter
   *
   * @returns {Promise}
   */
  subscribe(emitter) {
    this._readyPromise = this.waitConfig(emitter)
      .then(container => {
        this._container = container;
      });
      
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise}
   */
  ready() {
    return this._readyPromise;
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {Promise}
   */
  waitConfig(emitter) {
    return new Promise((resolve, reject) => {
      emitter.on(this.events.config.load, (container, configFile) => {
        if (container.has(this.configPath)) {
          return this.prepareConfig(
            container.get(this.configPath, {}),
            configFile
          ).then(container => {
            this.setActive(true);
            
            resolve(container);
          }).catch(error => reject(error));
        }
        
        resolve(null);
      });
    });
  }
  
  /**
   * @param {*} config
   * @param {String} configFile
   * @returns {Container}
   */
  prepareConfig(config, configFile) {
    this._configFileRealPath = path.resolve(configFile);
    
    return Promise.resolve(this.createContainer(
      Object.assign({
        __file: this._configFileRealPath,
        __dir: path.dirname(this._configFileRealPath),
      }, config)
    ));
  }
  
  /**
   * @param {*} config
   * @returns {Container}
   */
  createContainer(config) {
    return new Container(config);
  }
  
  /**
   * @returns {string}
   */
  static get MAIN_CONFIG_KEY() {
    return '$';
  }
}

module.exports = ConfigBasedComponent;
