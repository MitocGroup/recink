'use strict';

const AbstractConfig = require('./abstract-config');
const yaml = require('yaml-js');

/**
 * YAML configuration manager
 */
class YamlConfig extends AbstractConfig {
  /**
   * @param {string} rawConfig
   *
   * @returns {Promise}
   */
  decode(rawConfig) {
    try {
      return Promise.resolve(yaml.load(rawConfig));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  /**
   * @param {*} config
   *
   * @returns {Promise}
   */
  encode(config) {
    try {
      return Promise.resolve(yaml.dump(config));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = YamlConfig;
