'use strict';

const events = require('run-jst/src/events');
const ConfigBasedComponent = require('run-jst/src/component/config-based-component');
// const Formatter = require('codeclimate-test-reporter/formatter');
// const client = require('codeclimate-test-reporter/http_client');

class CodeclimateComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._coverageReadyPromise = Promise.resolve();
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'codeclimate';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {promise}
   */
  run(emitter) {
    
    // @todo implement using 'Formatter' to process and 'client' to upload
    return Promise.resolve();
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {promise}
   */
  subscribe(emitter) {
    this._coverageReadyPromise = new Promise(resolve => {
      emitter.on(events.component.ready, component => {
        if (component.name === CodeclimateComponent.COVERAGE_COMPONENT) {
          resolve(component.isActive);
        }
      });
    });
    
    return super.subscribe(emitter);
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {promise}
   */
  waitConfig(emitter) {
    return super.waitConfig(emitter)
      .then(container => {
        if (container) {
          if (!emitter.component(CodeclimateComponent.COVERAGE_COMPONENT)) {
            this.setActive(false);
            this.logger.debug(`Disabled Coverage component ==> CodeClimate:off`);
            
            return Promise.resolve(null);
          }
          
          return this._coverageReadyPromise
            .then(coverageEnabled => {
              if (!coverageEnabled) {
                this.setActive(false);
                this.logger.debug(`Inactive Coverage component ==> CodeClimate:off`);
                
                return Promise.resolve(null);
              }
              
              return Promise.resolve(container);
            });
        }
        
        return Promise.resolve(null);
      });
  }
  
  /**
   * @returns {string}
   */
  static get COVERAGE_COMPONENT() {
    return 'coverage';
  }
}

module.exports = CodeclimateComponent;
