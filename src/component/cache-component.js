'use strict';

const npmEvents = require('./npm/events');
const testEvents = require('./test/events');
const cacheFactory = require('./cache/factory');
const ConfigBasedComponent = require('./config-based-component');
const Spinner = require('./helper/spinner');

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
        return (new Spinner(
          `Downloading caches from #${ cacheDriver }`
        )).then(
          'Caches downloaded.'
        ).catch(
          'Caches failed to download!'
        ).promise(
          this._initCache(cacheDriver, cacheDir)
            .cache.download()
        )
      });
      
      emitter.onBlocking(testEvents.assets.test.end, () => {
        if (!this.cache) {
          resolve();
          return Promise.resolve();
        }
        
        return (new Spinner(
          `Uploading caches to #${ cacheDriver }`
        )).then(
          'Caches uploaded.'
        ).catch(
          'Caches failed to upload!'
        ).promise(
          this.cache.upload()
        ).then(() => resolve());
      });
    });
  }
}

module.exports = CacheComponent;