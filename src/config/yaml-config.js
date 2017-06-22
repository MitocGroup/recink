'use strict';

const AbstractConfig = require('./abstract-config');
const yamlReader = require('yaml-js');
const yamlWriter = require('yamljs');

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
      return Promise.resolve(yamlReader.load(rawConfig));
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
      return Promise.resolve(yamlWriter.stringify(
        config, 
        YamlConfig.INLINE_DEPTH, 
        YamlConfig.INDENTATION
      ));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  /**
   * @returns {number}
   */
  static get INLINE_DEPTH() {
    return 8;
  }
  
  /**
   * @returns {number}
   */
  static get INDENTATION() {
    return 2;
  }
}

module.exports = YamlConfig;
