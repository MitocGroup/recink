'use strict';

const packageHash = require('package-hash');
const path = require('path');
const fse = require('fs-extra');
const Spinner = require('../helper/spinner');
const spawn = require('child_process').spawn;
const md5Hex = require('md5-hex');
const SequentialPromise = require('../helper/sequential-promise');

/**
 * Abstraction over an NPM module
 */
class NpmModule {
  /**
   * @param {string} rootDir
   * @param {Cache} cache
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
   * @param {Cache} cache
   */
  get cache() {
    return this._cache;
  }
  
  /**
   * @returns {string}
   */
  get packageFileRelative() {
    return path.relative(process.cwd(), this.packageFile);
  }
  
  /**
   * @returns {string}
   */
  get packageFile() {
    return path.join(this.rootDir, NpmModule.PACKAGE_FILE);
  }
  
  /**
   * @returns {string}
   */
  get modulesDir() {
    return path.join(this.rootDir, NpmModule.MODULES_DIR);
  }
  
  /**
   * @returns {string}
   */
  get debugFile() {
    return path.join(this.rootDir, NpmModule.NPM_DEBUG_FILE);
  }
  
  /**
   * @param {*} deps
   * @param {array} scripts
   *
   * @returns {Promise}
   */
  install(deps = {}, scripts = []) {
    let cacheKey;
    const packageFile = this.packageFile;
    const modulesDir = this.modulesDir;
    
    return fse.ensureDir(modulesDir)
      .then(() => this._packageHash(packageFile, deps))
      .then(hash => {
        cacheKey = hash;
        
        return this.cache.has(hash);
      })
      .then(inCache => {
        if (inCache) {
          this.logger.debug(`Restore ${ this.rootDir } cache from #${ cacheKey }`);
          
          return this.cache.restore(cacheKey, modulesDir)
            .then(() => this._runScripts(scripts));
        }
        
        this.logger.debug(`Install dependencies in ${ this.rootDir }`);
        
        return this._install(packageFile, deps)
          .then(() => this._runScripts(scripts))
          .then(() => {
            this.logger.debug(`Save ${ this.rootDir } cache to #${ cacheKey }`);
            
            return this.cache.flush()
              .then(() => this.cache.save(cacheKey, modulesDir));
          });
      });
  }
  
  /**
   * @param {array} scripts
   * 
   * @returns {Promise}
   *
   * @private
   */
  _runScripts(scripts) {
    if (scripts.length <= 0) {
      return Promise.resolve();
    }
    
    return SequentialPromise.all(scripts.map(script => {
      return () => this._runScript(script);
    }));
  }
  
  /**
   * @param {string} script
   * 
   * @returns {Promise}
   *
   * @private
   */
  _runScript(script) {
    return (new Spinner(
      `Running ${ script } script in ${ this.rootDir }`
    )).then(
      `Script ${ script } execution succeed in ${ this.rootDir }`
    ).catch(
      `Script ${ script } execution failed in ${ this.rootDir }`
    ).promise(new Promise((resolve, reject) => {
      const options = {
        cwd: this.rootDir, 
        stdio: 'ignore',
      };

      const npmInstall = spawn('npm', [ 'run', script ], options);
      
      npmInstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(
            `Failed to run script ${ script } in ${ this.rootDir }.\n` +
            `To open logs type: 'open ${ this.debugFile }'`
          ));
        }
        
        resolve();
      });
    }));
  }
  
  /**
   * @param {string} packageFile
   * @param {*} additionalDeps
   *
   * @returns {Promise}
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
   * @param {string} depsDebug
   *
   * @returns {string}
   * 
   * @private
   */
  _trimDepsDebugInfo(depsDebug) {
    if (depsDebug.length > 25) {
      return depsDebug.substr(0, 25) + '...';
    }
    
    return depsDebug;
  }
  
  /**
   * @param {array} deps
   *
   * @returns {Promise}
   *
   * @private
   */
  _doInstall(deps = []) {
    const depsDebug = this._trimDepsDebugInfo(deps.length > 0 ? deps.join(', ') : 'MAIN');
    
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
      
      // ignore running 'npm install' scripts
      if (deps.length <= 0) {
        deps = [ '--ignore-scripts' ];
      }

      const npmInstall = spawn('npm', [ 'install', '--no-shrinkwrap' ].concat(deps), options);
      
      npmInstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(
            `Failed to install dependencies in ${ this.rootDir }.\n` +
            `To open logs type: 'open ${ this.debugFile }'`
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
   * @returns {Promise}
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
