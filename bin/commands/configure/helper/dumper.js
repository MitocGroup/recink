'use strict';

const path = require('path');
const fse = require('fs-extra');

class Dumper {
  /**
   * @param {string} template
   * @param {string} configPath
   * @param {*} logger
   */
  constructor(template, configPath, logger) {
    this.template = template;
    this.configPath = configPath;
    this.logger = logger;
  }
  
  /**
   * @param {boolean} overwrite
   *
   * @returns {Promise|*}
   */
  dump(overwrite = false) {
    return fse.pathExists(this.configPath)
      .then(hasConfig => {
        if (!hasConfig) {
          return Promise.resolve(true);
        }
        
        return overwrite ? Promise.resolve(true) : Promise.reject(new Error(
          `Existing configuration found in ${ this.configPath }.\n` +
          'Please use "--overwrite" option to overwrite the existing one.'
        ));
      })
      .then(dump => {
        this.logger.info(
          this.logger.emoji.gift, 
          `Dumping configuration to ${ this.configPath }`
        );
        
        return dump ? fse.copy(this.template, this.configPath) : Promise.resolve();
      });
  }
}

module.exports = Dumper;
