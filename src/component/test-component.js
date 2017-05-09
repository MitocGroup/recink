'use strict';

const ConfigBasedComponent = require('./config-based-component');

class TestComponent extends ConfigBasedComponent {
  /**
   * @returns {string}
   */
  get name() {
    return 'test';
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

module.exports = TestComponent;