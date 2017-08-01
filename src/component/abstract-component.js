'use strict';

const events = require('../events');

/**
 * Abstract component
 */
class AbstractComponent {
  constructor() {
    this._logger = console;
    this._active = false;
    this._processing = 0;
  }
  
  /**
   * @returns {number}
   */
  get processing() {
    return this._processing;
  }
  
  /**
   * @param {number} interval
   *
   * @returns {Promise}
   */
  waitProcessing(interval = 200) {
    return new Promise(resolve => {
      if (!this.isProcessing) {
        return process.nextTick(() => resolve());
      }
      
      const id = setInterval(() => {
        if (!this.isProcessing) {
          clearInterval(id);
          process.nextTick(() => resolve());
        }
      }, interval);
    });
  }
  
  /**
   * @returns {AbstractComponent}
   */
  removeProcessing() {
    this._processing--;
    
    return this;
  }
  
  /**
   * @returns {AbstractComponent}
   */
  addProcessing() {
    this._processing++;
    
    return this;
  }
  
  /**
   * @returns {boolean}
   */
  get isProcessing() {
    return this.processing > 0;
  }
  
  /**
   * @returns {*}
   */
  get logger() {
    return this._logger;
  }
  
  /**
   * @param {*} logger
   *
   * @returns {AbstractComponent}
   */
  setLogger(logger) {
    this._logger = logger;
    
    return this;
  }
  
  /**
   * @param {boolean} state
   *
   * @returns {AbstractComponent}
   */
  setActive(state) {
    this._active = !!state;
    
    return this;
  }
  
  /**
   * @returns {boolean}
   */
  get isActive() {
    return !!this._active;
  }
  
  /**
   * @throws {Error}
   */
  get name() {
    throw new Error(`${ this.constructor.name }.name not implemented!`);
  }
  
  /**
   * @returns {*}
   */
  get events() {
    return events;
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  init(emitter) {
    return Promise.resolve();
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return Promise.resolve();
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    return Promise.resolve();
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  subscribe(emitter) {
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise}
   */
  ready() {
    return Promise.resolve();
  }
}

module.exports = AbstractComponent;
