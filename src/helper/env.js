'use strict';

/**
 * Environment helpers
 */
class Env {
  /**
   * @returns {boolean}
   */
  static get isCI() {
    return Env.isTravis;
  }
  
  /**
   * @returns {boolean}
   */
  static get isTravis() {
    const isCI = !!(Env.read('CI', false) || Env.read('CONTINUOUS_INTEGRATION', false));
    
    return !!(isCI && Env.read('TRAVIS', false));
  }
  
  /**
   * @returns {boolean}
   */
  static get isGlobalInstallation() {
    return !!Env.read('npm_config_global', false);
  }
  
  /**
   * @param {string} name
   * 
   * @returns {*}
   */
  static exists(name) {
    return process.env.hasOwnProperty(name);
  }
  
  /**
   * @param {string} name
   * @param {*} defaultValue
   * 
   * @returns {*}
   */
  static read(name, defaultValue = null) {
    if (!Env.exists(name)) {
      return defaultValue;
    }
    
    return process.env[name];
  }
}

module.exports = Env;
