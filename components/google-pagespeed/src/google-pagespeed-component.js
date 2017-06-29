'use strict';

const Spinner = require('recink/src/component/helper/spinner');
const ConfigBasedComponent = require('recink/src/component/config-based-component');
const pify = require('pify');
const GooglePageSpeedClient = require('./google-pagespeed-client');

/**
 * Google PageSpeed component
 */
class GooglePageSpeedComponent extends ConfigBasedComponent {  
  /**
   * @returns {string}
   */
  get name() {
    return 'google-pagespeed';
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

module.exports = GooglePageSpeedComponent;
