'use strict';

const AbstractComponent = require('./abstract-component');
const ConfigBasedComponent = require('./config-based-component');
const factory = require('./preprocess/factory');
const Container = require('../container');

class PreprocessComponent extends AbstractComponent {
  constructor(configPath = null) {
    super();
    
    this._configPath = configPath 
      || `${ ConfigBasedComponent.MAIN_CONFIG_KEY }.${ this.name }`;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'preprocess';
  }
  /**
   * @returns {string}
   */
  get configPath() {
    return this._configPath;
  }
  
  /**
   * @param {Emitter|*} emitter
   *
   * @returns {Promise|*}
   */
  subscribe(emitter) {
    emitter.onBlocking(this.events.config.preprocess, config => {
      const container = new Container(config);
      
      if (container.has(this.configPath)) {
        this.setActive(true);
        
        const preprocessObj = container.get(this.configPath, {});
        
        Object.keys(preprocessObj).map(configPath => {
          let preprocessors = preprocessObj[configPath];
          preprocessors = Array.isArray(preprocessors) 
            ? preprocessors : [ preprocessors.toString() ];
            
          this.logger.debug(
            `Preprocess ${ configPath } using - ${preprocessors.join(', ')  }`
          );
          
          const value = preprocessors.map(p => factory[p]()).reduce(
            (value, preprocessor) => preprocessor.transform(value),
            container.get(configPath)
          );
          
          container.set(configPath, value);
        });
      }
      
      console.log(container.dump());//@todo remove
      
      return Promise.resolve();
    }, PreprocessComponent.DEFAULT_PRIORITY);
    
    return Promise.resolve();
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_PRIORITY() {
    return 10;
  }
}

module.exports = PreprocessComponent;