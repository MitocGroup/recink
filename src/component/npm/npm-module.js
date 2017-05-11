'use strict';

const packageHash = require('package-hash');
const path = require('path');
const fse = require('fs-extra');
const Spinner = require('../helper/spinner');
const spawn = require('child_process').spawn;
const md5Hex = require('md5-hex');

class NpmModule {
  /**
   * @param {string} rootDir
   * @param {Cache|*} cache
   * @param {*} logger
   */
  constructor(rootDir, cache, logger) {
    this._rootDir = rootDir;
    this._cache = cache;
    this._logger = logger;
  }
  
  /**
   * @returns {*}
   */
  get logger() {
    return this._logger;
  }
  
  /**
   * @returns {string}
   */
  get rootDir() {
    return this._rootDir;
  }
  
  /**
   * @param {Cache|*} cache
   */
  get cache() {
    return this._cache;
  }
  
  /**
   * @param {*} deps
   * @param {boolean} includePackageDeps
   *
   * @returns {Promise|*}
   */
  install(deps = {}, includePackageDeps = false) {
    let cacheKey;
    const packageFile = path.join(this.rootDir, NpmModule.PACKAGE_FILE);
    const modulesDir = path.join(this.rootDir, NpmModule.MODULES_DIR);
    
    return fse.ensureDir(modulesDir)
      .then(() => this._packageHash(packageFile, deps))
      .then(hash => {
        cacheKey = hash;
        
        return this.cache.has(hash);
      })
      .then(inCache => {
        if (inCache) {
          this.logger.debug(`Restore ${ this.rootDir } cache from #${ cacheKey }`);
          
          return this.cache.restore(cacheKey, modulesDir);
        }
        
        this.logger.debug(`Install dependencies in ${ this.rootDir }`);
        
        return this._install(packageFile, deps)
          .then(() => {
            this.logger.debug(`Save ${ this.rootDir } cache to #${ cacheKey } (flush=true)`);
            
            // @todo find a smarter way to invalidate caches
            return this.cache.flush()
              .then(() => this.cache.save(cacheKey, modulesDir));
          });
      });
  }
  
  /**
   * @param {string} packageFile
   * @param {*} additionalDeps
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _install(packageFile, additionalDeps) {
    return fse.pathExists(packageFile)
      .then(hasPackageFile => {
        return hasPackageFile ? this._doInstall() : Promise.resolve();
      })
      .then(() => {
        const depsVector = Object.keys(additionalDeps)
          .map(depName => {
            return `${ depName }@${ additionalDeps[depName] }`;
          });
    
        return depsVector.length > 0 
          ? this._doInstall(depsVector) 
          : Promise.resolve();
      });
  }
  
  /**
   * @param {array} deps
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _doInstall(deps = []) {
    const depsDebug = deps.length > 0 ? deps.join(', ') : 'MAIN';
    
    return (new Spinner(
      `Installing dependencies in ${ this.rootDir } (${ depsDebug })`
    )).then(
      `Dependencies installation succeed in ${ this.rootDir } (${ depsDebug })`
    ).catch(
      `Dependencies installation failed in ${ this.rootDir } (${ depsDebug })`
    ).promise(new Promise((resolve, reject) => {
      const options = {
        cwd: this.rootDir, 
        stdio: 'ignore',
      };
      
      const npmInstall = spawn('npm', [ 'install' ].concat(deps), options);
      
      npmInstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(
            `Failed to install dependencies in ${ this.rootDir }.\n` +
            `To open logs type: 'open ${ path.join(this.rootDir, NpmModule.NPM_DEBUG_FILE) }'`
          ));
        }
        
        resolve();
      });
    }));
  }
  
  /**
   * @param {string} packageFile
   * @param {*} deps
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _packageHash(packageFile, deps) {
    return fse.pathExists(packageFile)
      .then(hasPackageFile => {
        const depsHash = this._depsHash(deps);
        const packageDebug = hasPackageFile ? 'exists' : 'missing';
        
        this.logger.debug(
          `File ${ NpmModule.PACKAGE_FILE } ${ packageDebug } in ${ this.rootDir }`
        );
        
        if (!hasPackageFile) {
          return Promise.resolve(`${ depsHash }-${ NpmModule.DEFAULT_HASH }`);
        }
        
        return packageHash(packageFile)
          .then(hash => {
            return Promise.resolve(`${ depsHash }-${ hash }`);
          });
      });
  }
  
  /**
   * @param {*} deps
   *
   * @returns {string}
   *
   * @private
   */
  _depsHash(deps) {
    const normalizedDeps = {};
    
    Object.keys(deps).sort().map(key => {
      normalizedDeps[key] = deps[key];
    });
    
    return md5Hex(JSON.stringify(normalizedDeps));
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_HASH() {
    return 'x'.repeat(32);
  }
  
  /**
   * @returns {string}
   */
  static get NPM_DEBUG_FILE() {
    return 'npm-debug.log';
  }
  
  /**
   * @returns {string}
   */
  static get PACKAGE_FILE() {
    return 'package.json';
  }
  
  /**
   * @returns {string}
   */
  static get MODULES_DIR() {
    return 'node_modules';
  }
}

module.exports = NpmModule;