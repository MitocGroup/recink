'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const pify = require('pify');
const chalk = require('chalk');
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
   * @returns {Promise}
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
   * @param {function} printer
   * 
   * @returns {Promise}
   */
  print(printer = Dumper.DEFAULT_PRINTER) {
    return this._read()
      .then(content => this._transform(content))
      .then(content => {
        printer(content);
        
        return Promise.resolve();
      });
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _doDump() {
    return this._read()
      .then(content => this._transform(content))
      .then(content => this._write(content));
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _read() {
    return pify(fs.readFile)(this.template);
  }
  
  /**
   * @param {string} content
   * 
   * @returns {Promise}
   *
   * @private
   */
  _transform(content) {
    return SequentialPromise.all(this.transformers, content);
  }
  
  /**
   * @param {string} content
   * 
   * @returns {Promise}
   *
   * @private
   */
  _write(content) {
    return fse.outputFile(this.configPath, content);
  }
  
  /**
   * @returns {function}
   */
  static get DEFAULT_PRINTER() {
    return content => {
      const delimiter = '-'.repeat(parseInt(process.stdout.columns) || 30);
      
      process.stdout.write(chalk.gray(`\n${ delimiter }\n\n`));
      process.stdout.write(chalk.green(content));
      process.stdout.write(chalk.gray(`\n${ delimiter }\n`));
    };
  }
}

module.exports = Dumper;
