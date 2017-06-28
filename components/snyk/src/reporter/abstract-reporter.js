'use strict';

/**
 * Abstract Snyk.io reporter
 */
class AbstractReporter {
  /**
   * @param {SnykComponent} component
   * @param {*} npmModule
   * @param {*} emitModule
   */
  constructor(component, npmModule, emitModule) {
    this.component = component;
    this.npmModule = npmModule;
    this.emitModule = emitModule;
  }
  
  /**
   * @returns {Container}
   */
  get container() {
    return this.component.container;
  }
  
  /**
   * @returns {Logger}
   */
  get logger() {
    return this.component.logger;
  }
  
  /**
   * @throws {Error}
   */
  get name() {
    throw new Error(`${ this.constructor.name }.name not implemented!`);
  }
  
  /**
   * @param {*} result
   * @param {*} options
   *
   * @returns {Promise}
   */
  report(result, options) {
    return Promise.reject(new Error(
      `${ this.constructor.name }.report(result, options) not implemented!`
    ));
  }
}

module.exports = AbstractReporter;
