'use strict';

const jag = require('jag');
const path = require('path');
const fse = require('fs-extra');
const pify = require('pify');
const EventEmitter = require('events');
const events = require('./events');
const fs = require('fs');

/**
 * Abstract cache driver
 */
class AbstractDriver extends EventEmitter {
  /**
   * @param {string} cacheDir
   */
  constructor(cacheDir) {
    super();
    
    this._cacheDir = cacheDir;
    this._progressType = null;
  }
  
  /**
   * @returns {string}
   */
  get cacheDir() {
    return this._cacheDir;
  }
  
  /**
   * @returns {Promise}
   */
  upload() {
    return this._switchProgressType('upload')
      ._removePackageFile()
      .then(() => this._pack())
      .then(() => this._upload())
      .then(() => this._resetOperation());
  }
  
  /**
   * @returns {Promise}
   */
  download() {
    return this._switchProgressType('download')
      ._removePackageFile()
      .then(() => this._download())
      .then(() => this._unpack())
      .then(() => this._resetOperation());
  }
  
  /**
   * @param {string} type
   *
   * @returns {AbstractDriver}
   *
   * @private
   */
  _switchProgressType(type) {
    this._progressType = type;
    
    return this;
  }
  
  /**
   * @param {number} total
   * @param {number} amount
   *
   * @returns {AbstractDriver}
   *
   * @private
   */
  _progress(total, amount) {
    const payload = {
      amount, total, remaining: total - amount,
    };
    
    this.emit(events.cache.progress, payload);
    this.emit(events.cache[this._progressType].progress, payload);
    
    return this;
  }
  
  /**
   * @returns {Promise}
   * 
   * @private
   */
  _resetOperation() {
    this._progressType = null;
    
    return this._removePackageFile();
  }
  
  /**
   * @returns {Promise}
   * 
   * @private
   */
  _removePackageFile() {
    return fse.remove(this._packagePath);
  }
  
  /**
   * @returns {string}
   *
   * @private
   */
  get _packagePath() {
    return path.join(
      path.dirname(this.cacheDir),
      (path.basename(this.cacheDir) || AbstractDriver.DEFAULT_NS) + '.tar.gz'
    );
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _pack() {
    const packagePath = this._packagePath;
    
    return fse.pathExists(this.cacheDir)
      .then(result => {
        if (!result) {
          return Promise.resolve();
        }
        
        return pify(jag.pack)(this.cacheDir, packagePath)
          .then(() => {
            
            // @todo remove when fixed
            // @see https://github.com/coderaiser/node-jag/blob/master/lib/jag.js#L53
            const tmpPackagePath = path.join(
              path.dirname(packagePath),
              path.basename(packagePath, '.tar.gz')
            ) + '.tar.tar.gz';
            
            return fse.move(
              tmpPackagePath, 
              packagePath, 
              { overwrite: true }
            );
          });
      });
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _unpack() {
    return fse.pathExists(this._packagePath)
      .then(result => {
        if (!result) {
          return Promise.resolve();
        }

        return this._packageSize
          .then(packageSize => {            
            if (packageSize <= 0) {
              return Promise.resolve();
            }
            
            return fse.ensureDir(this.cacheDir)
              .then(() => {
                return pify(jag.unpack)(this._packagePath, this.cacheDir);
              });
          });
      });
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  get _packageSize() {
    return pify(fs.stat)(this._packagePath)
      .then(stat => Promise.resolve(stat.size));
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _upload() {
    return Promise.reject(new Error(
      `${ this.constructor.name }._upload() not implemented!`
    ));
  }
  
  /**
   * @throws {Error}
   */
  get name() {
    throw new Error(
      `${ this.constructor.name }.name not implemented!`
    );
  }

  /**
   * @returns {Promise}
   *
   * @private
   */
  _download() {
    return Promise.reject(new Error(
      `${ this.constructor.name }._download() not implemented!`
    ));
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_NS() {
    return 'recink_package';
  }
}

module.exports = AbstractDriver;
