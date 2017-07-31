'use strict';

const AbstractReporter = require('./abstract-reporter');

/**
 * PageSpeed reporter factory
 */
class Factory {
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractReporter}
   */
  static create(name, ...args) {
    const ReporterImplementation = require(`./${ name }-reporter`);
    const reporter = new ReporterImplementation(...args);
    
    if (!(reporter instanceof AbstractReporter)) {
      throw new Error(`${ name } reporter should be an implementation of AbstractReporter`);
    }
    
    return reporter;
  }

  /**
   * @param {*} args
   *
   * @returns {MultiReporter}
   */
  static multi(...args) {
    return this.create('multi', ...args);
  }

  /**
   * @param {*} args
   *
   * @returns {SummaryReporter}
   */
  static summary(...args) {
    return this.create('summary', ...args);
  }
  
  /**
   * @param {*} args
   *
   * @returns {TextReporter}
   */
  static text(...args) {
    return this.create('text', ...args);
  }
}

module.exports = Factory;
