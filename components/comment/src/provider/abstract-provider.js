'use strict';

/**
 * Abstract comment provider
 */
class AbstractProvider {
  /**
   * @param {CommentComponent} component
   * @param {*} options
   */
  constructor(component, options = {}) {
    this.component = component;
    this.options = options;
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
   * @param {string} body
   *
   * @returns {Promise}
   */
  comment(body) {
    return Promise.reject(new Error(
      `${ this.constructor.name }.comment(body) not implemented!`
    ));
  }
}

module.exports = AbstractProvider;
