'use strict';

const ConfigBasedComponent = require('./config-based-component');

class CacheComponent extends ConfigBasedComponent {
  /**
   * @returns {string}
   */
  get name() {
    return 'cache';
  }
  
  /**
   * @param {Emitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

module.exports = CacheComponent;