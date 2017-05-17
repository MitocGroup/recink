'use strict';

class Env {
  /**
   * @returns {boolean}
   */
  static get isTravis() {
    return !!((process.env.CI || process.env.CONTINUOUS_INTEGRATION) 
      && process.env.TRAVIS);
  }
  
  /**
   * @returns {boolean}
   */
  static get isGlobalInstallation() {
    return !!process.env.npm_config_global;
  }
}

module.exports = Env;
