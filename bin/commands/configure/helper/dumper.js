'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');
const SequentialPromise = require('../../../../src/component/helper/sequential-promise');

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
    this.transformers = [];
  }
  
  /**
   * @param {boolean} overwrite
   *
   * @returns {promise}
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
        
        return dump ? this._doDump() : Promise.resolve();
      });
  }
  
  /**
   * @returns {promise}
   *
   * @private
   */
  _doDump() {
    return pify(fs.readFile)(this.template)
      .then(content => SequentialPromise.all(this.transformers, content))
      .then(content => fse.outputFile(this.configPath, content));
  }
}

module.exports = Dumper;
