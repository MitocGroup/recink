'use strict';

const AbstractConfig = require('./abstract-config');
const yaml = require('yaml-js');

class YamlConfig extends AbstractConfig {
  /**
   * @param {string} rawConfig
   *
   * @returns {promise}
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
   * @returns {promise}
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
