'use strict';

const DependantConfigBasedComponent = require('./dependant-config-based-component');
const emitEvents = require('./emit/events');
const events = require('./npm/events');
const os = require('os');
const fse = require('fs-extra');
const NpmModule = require('./npm/npm-module');
const Cache = require('./npm/cache');
const path = require('path');

/**
 * NPM component
 */
class NpmComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._cacheDir = null;
    this._cache = {};
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'npm';
  }
  
  /**
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'emit' ];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  cacheDir(emitter) {
    if (this._cacheDir) {
      return Promise.resolve(this._cacheDir);
    }
    
    this._cacheDir = path.join(os.tmpdir(), '_recink_npm_cache_');
    
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
   * @returns {Promise}
   */
  cache(emitter, name) {
    if (this._cache.hasOwnProperty(name)) {
      return Promise.resolve(this._cache[name]);
    }
    
    return this.cacheDir(emitter)
      .then(cacheDir => {
        this._cache[name] = new Cache(cacheDir, name);
        
        return Promise.resolve(this._cache[name]);
      });
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise(resolve => {
      emitter.onBlocking(emitEvents.module.process.start, emitModule => {
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
            ).then(() => {              
              emitter.emit(events.npm.dependencies.postinstall, npmModule, emitModule);
            });
          });
      });
      
      emitter.on(emitEvents.modules.process.end, () => {
        process.nextTick(() => resolve());
      });
    });
  }
}

module.exports = NpmComponent;
