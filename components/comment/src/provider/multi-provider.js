'use strict';

const AbstractProvider = require('./abstract-provider');

/**
 * Multiple comment providers
 */
class MultiProvider extends AbstractProvider {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._providers = [];
  }

  /**
   * @param {AbstractProvider} providers
   *
   * @returns {MultiProvider}
   */
  add(...providers) {
    providers.map(provider => this._providers.push(provider));

    return this;
  }

  /**
   * @returns {AbstractProvider[]}
   */
  get providers() {
    return this._providers;
  }

  /**
   * @returns {string}
   */
  get name() {
    return 'multi';
  }

  /**
   * @param {string} body
   *
   * @returns {Promise}
   */
  comment(body) {
    return Promise.all(this.providers.map(provider => {
      return provider.comment(body);
    }));
  }
}

module.exports = MultiProvider;
