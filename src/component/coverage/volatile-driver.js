'use strict';

const AbstractDriver = require('./abstract-driver');
const path = require('path');
const fse = require('fs-extra');
const os = require('os');
const fs = require('fs');
const pify = require('pify');

class VolatileDriver extends AbstractDriver {
  /**
   * @param {string} name
   * 
   * @returns {promise}
   *
   * @private
   */
  _read(name) {
    const file = this._storageFile(name);
    
    return fse.pathExists(file)
      .then(exists => {
        if (!exists) {
          return Promise.resolve(null);
        }
        
        return pify(fs.readFile)(file);
      });
  }
  
  /**
   * @param {string} name
   * @param {string} content
   * 
   * @returns {promise}
   *
   * @private
   */
  _write(name, content) {
    return fse.outputFile(this._storageFile(name), content);
  }
  
  /**
   * @param {string} name
   * 
   * @returns {string}
   *
   * @private
   */
  _storageFile(name) {
    return path.join(os.tmpDir(), '__jst_coverage_volatile__', name);
  }
}

module.exports = VolatileDriver;
