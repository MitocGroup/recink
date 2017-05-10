'use strict';

const path = require('path');
const fs = require('fs');
const pify = require('pify');

class TestAsset {
  /**
   * @param {string} file
   * @param {string} fileAbs
   * @param {EmitModule|*} module
   */
  constructor(file, fileAbs, module) {
    this._file = file;
    this._fileAbs = fileAbs;
    this._module = module;
  }
  
  /**
   * @param {Mocha|*} mocha
   * 
   * @returns {Promise|*}
   */
  test(mocha) {
    return new Promise((resolve, reject) => {
      mocha.addFile(this.fileAbs);
      mocha.run(failures => {
        if (failures > 0) {
          return reject(new Error(
            `Test failed in ${ this.fileAbs } with ${ failures } failures`
          ));
        }
        
        resolve();
      });
    });
  }
  
  /**
   * @returns {Promise|*}
   */
  get fileContent() {
    return pify(fs.readFile)(this.fileAbs);
  }
  
  /**
   * @returns {string}
   */
  get file() {
    return this._file;
  }
  
  /**
   * @returns {string}
   */
  get fileAbs() {
    return this._fileAbs;
  }
  
  /**
   * @returns {EmitModule|*}
   */
  get module() {
    return this._module;
  }
}

module.exports = TestAsset;
