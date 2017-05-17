'use strict';

class Env {
  /**
   * @returns {boolean}
   */
  static get isTravis() {
    return (process.env.CI || process.env.CONTINUOUS_INTEGRATION) 
      && process.env.TRAVIS;
  }
}

module.exports = Env;
