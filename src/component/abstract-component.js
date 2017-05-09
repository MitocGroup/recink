'use strict';

const events = require('../events');

class AbstractComponent {
  constructor() {
    this._logger = console;
    this._active = false;
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
   * @returns {AbstractComponent|*}
   */
  setLogger(logger) {
    this._logger = logger;
    
    return this;
  }
  
  /**
   * @param {boolean} state
   *
   * @returns {AbstractComponent|*}
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
   * @returns {string}
   */
  get name() {
    throw new Error(`${ this.constructor.name }.name not implemente!`);
  }
  
  /**
   * @returns {*}
   */
  get events() {
    return events;
  }

  /**
   * @param {EventEmitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    return Promise.resolve();
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  subscribe(emitter) {
    return Promise.resolve();
  }
  
  /**
   * @returns {Promise|*}
   */
  ready() {
    return Promise.resolve();
  }
}

module.exports = AbstractComponent;