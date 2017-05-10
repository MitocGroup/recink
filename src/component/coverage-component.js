'use strict';

const ConfigBasedComponent = require('./config-based-component');

class CoverageComponent extends ConfigBasedComponent {
  /**
   * @returns {string}
   */
  get name() {
    return 'coverage';
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

module.exports = CoverageComponent;