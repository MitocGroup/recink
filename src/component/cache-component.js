'use strict';

const npmEvents = require('./npm/events');
const emitEvents = require('./emit/events');
const cacheFactory = require('./cache/factory');
const ConfigBasedComponent = require('./config-based-component');

class CacheComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._cache = null;
  }
  
  /**
   * @returns {AbstractDriver|*}
   */
  get cache() {
    return this._cache;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'cache';
  }
  
  /**
   * @param {string} cacheDriver
   * @param {string} cacheDir
   *
   * @returns {CacheComponent|*}
   *
   * @private
   */
  _initCache(cacheDriver, cacheDir) {
    this._cache = cacheFactory[cacheDriver](
      cacheDir,
      ...this.container.get('options', [])
    );
    
    return this;
  }
  
  /**
   * @param {Emitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    return new Promise(resolve => {
      const cacheDriver = this.container.get('driver');
      
      emitter.onBlocking(npmEvents.npm.cache.init, cacheDir => {
        this.logger.info(
          this.logger.emoji.bicycle, 
          `Downloading caches from #${ cacheDriver }`
        );
        
        return this._initCache(cacheDriver, cacheDir)
          .cache.download();
      });
      
      emitter.on(emitEvents.modules.process.end, () => {
        if (!this.cache) {
          return process.nextTick(() => resolve());
        }
        
        this.logger.info(
          this.logger.emoji.star, 
          `Uploading caches to #${ cacheDriver }`
        );
        
        this.cache.upload()
          .then(() => resolve());
      });
    });
  }
}

module.exports = CacheComponent;