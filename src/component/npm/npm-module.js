'use strict';

const packageHash = require('package-hash');
const path = require('path');
const fse = require('fs-extra');
const ora = require('ora');
const spawn = require('child_process').spawn;

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
      .then(() => this._packageHash(packageFile))
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
            this.logger.debug(`Save ${ this.rootDir } cache to #${ cacheKey }`);
            
            return this.cache.save(cacheKey, modulesDir);
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
    return new Promise((resolve, reject) => {
      const depsDebug = deps.length > 0 ? deps.join(', ') : 'MAIN';
      const spinner = ora(`Installing dependencies in ${ this.rootDir } (${ depsDebug })`).start();
      const options = {
        cwd: this.rootDir, 
        stdio: 'ignore',
      };
      
      const npmInstall = spawn('npm', [ 'install' ].concat(deps), options);
      
      npmInstall.on('close', (code) => {
        if (code !== 0) {
          spinner.fail(
            `Dependencies installation failed with code ${ code } in ${ this.rootDir }`
          );
          
          return reject(new Error(
            `Failed to install dependencies in ${ this.rootDir }`
          ));
        }
        
        spinner.succeed(`Dependencies installation succeed in ${ this.rootDir }`);
        
        resolve();
      });
    });
  }
  
  /**
   * @param {string} packageFile
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _packageHash(packageFile) {
    return fse.pathExists(packageFile)
      .then(hasPackageFile => {
        const packageDebug = hasPackageFile ? 'exists' : 'missing';
        
        this.logger.debug(
          `File ${ NpmModule.PACKAGE_FILE } ${ packageDebug } in ${ this.rootDir }`
        );
        
        if (!hasPackageFile) {
          return Promise.resolve(NpmModule.DEFAULT_HASH);
        }
        
        return packageHash(packageFile);
      });
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_HASH() {
    return '_no_package';
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