'use strict';

/**
 * Abstract PageSpeed reporter
 */
class AbstractReporter {
  /**
   * @param {PageSpeedComponent} component
   */
  constructor(component) {
    this.component = component;
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
