'use strict';

const Spinner = require('run-jst/src/component/helper/spinner');
const DependantConfigBasedComponent = require('run-jst/src/component/dependant-config-based-component');

/**
 * Snyk.io component
 */
class SnykComponent extends DependantConfigBasedComponent {  
  /**
   * @returns {string}
   */
  get name() {
    return 'snyk';
  }
  
  /**
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'npm' ];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return Promise.resolve();
  }
}

module.exports = SnykComponent;
