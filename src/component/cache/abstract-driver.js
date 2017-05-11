'use strict';

const jag = require('jag');
const path = require('path');
const fse = require('fs-extra');
const pify = require('pify');

class AbstractDriver {
  /**
   * @returns {string}
   */
  constructor(cacheDir) {
    this._cacheDir = cacheDir;
  }
  
  /**
   * @returns {string}
   */
  get cacheDir() {
    return this._cacheDir;
  }
  
  /**
   * @returns {Promise|*}
   */
  upload() {
    return this._removePackageFile()
      .then(() => this._pack())
      .then(() => this._upload())
      .then(() => this._removePackageFile());
  }
  
  /**
   * @returns {Promise|*}
   */
  download() {
    return this._removePackageFile()
      .then(() => this._download())
      .then(() => this._unpack())
      .then(() => this._removePackageFile());
  }
  
  /**
   * @returns {Promise|*}
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
      (path.basename(this.cacheDir) || 'dps_package') + '.tar.gz'
    );
  }
  
  /**
   * @returns {Promise|*}
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
   * @returns {Promise|*}
   *
   * @private
   */
  _unpack() {
    return fse.pathExists(this._packagePath)
      .then(result => {
        if (!result) {
          return Promise.resolve();
        }
        
        return fse.ensureDir(this.cacheDir)
          .then(() => {
            return pify(jag.unpack)(this._packagePath, this.cacheDir);
          });
      });
  }
  
  /**
   * @returns {Promise|*}
   *
   * @private
   */
  _upload() {
    return Promise.reject(new Error(
      `${ this.constructor.name }._upload() not implemented!`
    ));
  }
  
  /**
   * @returns {Promise|*}
   *
   * @private
   */
  _download() {
    return Promise.reject(new Error(
      `${ this.constructor.name }._download() not implemented!`
    ));
  }
}

module.exports = AbstractDriver;
