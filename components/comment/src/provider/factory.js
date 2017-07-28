'use strict';

const AbstractProvider = require('./abstract-provider');

/**
 * Comment provider factory
 */
class Factory {
  /**
   * @param {string} name
   * @param {*} args
   *
   * @returns {AbstractProvider}
   */
  static create(name, ...args) {
    const ProviderImplementation = require(`./${name}-provider`);
    const provider = new ProviderImplementation(...args);

    if (!(provider instanceof AbstractProvider)) {
      throw new Error(`${name} provider should be an implementation of AbstractProvider`);
    }

    return provider;
  }

  /**
   * @param {*} args
   *
   * @returns {GitHubProvider}
   */
  static github(...args) {
    return this.create('github', ...args);
  }

  /**
   * @param {*} args
   *
   * @returns {MultiProvider}
   */
  static multi(...args) {
    return this.create('multi', ...args);
  }
}

module.exports = Factory;
