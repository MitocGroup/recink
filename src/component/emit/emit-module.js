'use strict';

const Container = require('../../container');

class EmitModule {
  /**
   * @param {string} name
   * @param {*} config
   * @param {EventEmitter|*} emitter
   * @param {*} logger
   */
  constructor(name, config, emitter, logger) {
    this._emitter = emitter;
    this._logger = logger;
    this._name = name;
    this._container = new Container(config);
    this._stats = {};
  }
  
  /**
   * @returns {Promise|*}
   */
  process(container) {
    return Promise.resolve();
  }
  
  /**
   * @returns {*}
   */
  get logger() {
    return this._logger;
  }
  
  /**
   * @returns {EventEmitter|*}
   */
  get emitter() {
    return this._emitter;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return this._name;
  }
  
  /**
   * @returns {Container|*}
   */
  get container() {
    return this._container;
  }
  
  /**
   * @returns {*}
   */
  get stats() {
    return this._stats;
  }
}

module.exports = EmitModule;
