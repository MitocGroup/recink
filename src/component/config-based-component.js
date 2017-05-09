'use strict';

const Container = require('../container');
const AbstractComponent = require('./abstract-component');

class ConfigBasedComponent extends AbstractComponent {
  /**
   * @param {string} configPath
   */
  constructor(configPath = null) {
    super();
    
    this._container = null;
    this._readyPromise = Promise.resolve();
    this._configPath = configPath 
      || `${ ConfigBasedComponent.MAIN_CONFIG_KEY }.${ this.name }`;
  }
  
  /**
   * @returns {*}
   */
  get container() {
    return this._container;
  }
  
  /**
   * @returns {string}
   */
  get configPath() {
    return this._configPath;
  }
  
  /**
   * @param {EventEmitter|*} emitter
   *
   * @returns {Promise|*}
   */
  subscribe(emitter) {
    this._readyPromise = this.waitConfig(emitter)
      .then(container => {
        this._container = container;
      });
      
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise|*}
   */
  ready() {
    return this._readyPromise;
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * @param {string} path
   *
   * @returns {Promise|*}
   */
  waitConfig(emitter) {
    return new Promise(resolve => {
      emitter.on(this.events.config.load, container => {
        if (container.has(this.configPath)) {
          return this.prepareConfig(container.get(this.configPath, {}))
            .then(container => {
              this.setActive(true);
              
              resolve(container);
            });
        }
        
        resolve(null);
      });
    });
  }
  
  /**
   * @param {*} config
   *
   * @returns {Container|*}
   */
  prepareConfig(config) {
    return Promise.resolve(new Container(config));
  }
  
  /**
   * @returns {string}
   */
  static get MAIN_CONFIG_KEY() {
    return '$';
  }
}

module.exports = ConfigBasedComponent;
