'use strict';

const ConfigBasedComponent = require('./config-based-component');
const emitEvents = require('./emit/events');
const events = require('./npm/events');
const os = require('os');
const pify = require('pify');
const fse = require('fs-extra');
const NpmModule = require('./npm/npm-module');
const Cache = require('./npm/cache');
const path = require('path');

class NpmComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._cacheDir = null;
    this._cache = null;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'npm';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {promise}
   */
  cacheDir(emitter) {
    if (this._cacheDir) {
      return Promise.resolve(this._cacheDir);
    }
    
    this._cacheDir = path.join(os.tmpdir(), '_dps_npm_cache_');
    
    return fse.ensureDir(this._cacheDir)
      .then(() => {
        this.logger.debug('Npm cache', this._cacheDir);
        
        return emitter.emitBlocking(events.npm.cache.init, this._cacheDir)
          .then(() => Promise.resolve(this._cacheDir));
      });
  }
  
  /**
   * @param {Emitter} emitter
   * @param {string} name
   * 
   * @returns {promise}
   */
  cache(emitter, name) {
    if (this._cache) {
      return Promise.resolve(this._cache);
    }
    
    return this.cacheDir(emitter)
      .then(cacheDir => {
        this._cache = new Cache(cacheDir, name);
        
        return Promise.resolve(this._cache);
      });
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {promise}
   */
  run(emitter) {
    return new Promise(resolve => {
      emitter.onBlocking(emitEvents.module.emit.start, emitModule => {
        return this.cache(emitter, emitModule.name)
          .then(cache => {
            const npmModule = new NpmModule(
              emitModule.container.get('root'),
              cache,
              this.logger
            );
            
            this.logger.info(
              this.logger.emoji.hat, 
              `Ensure dependencies in place for ${ emitModule.name }`
            );
            emitter.emit(events.npm.dependencies.install, npmModule, emitModule);
            
            return npmModule.install(
              Object.assign(
                {}, 
                this.container.get('dependencies', {}), 
                emitModule.container.get('dependencies', {})
              ),
              [].concat(
                this.container.get('scripts', []),
                emitModule.container.get('scripts', [])
              )
            );
          });
      });
      
      emitter.on(emitEvents.modules.process.end, () => {
        process.nextTick(() => resolve());
      });
    });
  }
}

module.exports = NpmComponent;
