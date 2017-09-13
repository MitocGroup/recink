'use strict';

class Reporter {
  /**
   * @param {Emitter} emitter 
   * @param {*} logger
   */
  constructor(emitter, logger) {
    this._emitter = emitter;
    this._logger = logger;
  }

  /**
   * @returns {*}
   */
  get logger() {
    return this._logger;
  }

  /**
   * @returns {Emitter}
   */
  get emitter() {
    return this._emitter;
  }

  /**
   * @param {string} msg
   * 
   * @returns {Promise} 
   */
  report(msg) {
    const commentComponent = this._emitter.component('comment');

    if (commentComponent) {
      return commentComponent.comment(msg);
    }

    this.logger.info('[TERRAFORM]\n', msg);
    
    return Promise.resolve();
  }
}

module.exports = Reporter;
