'use strict';

const npmEvents = require('./npm/events');
const testEvents = require('./test/events');
const cacheFactory = require('./cache/factory');
const ConfigBasedComponent = require('./config-based-component');
const Spinner = require('./helper/spinner');
const cacheEvents = require('./cache/events');
const prettyBytes = require('pretty-bytes');

class CacheComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._cache = null;
  }
  
  /**
   * @returns {AbstractDriver}
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
   * @returns {CacheComponent}
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
   * @param {Emitter} emitter
   * 
   * @returns {promise}
   */
  run(emitter) {
    return new Promise(resolve => {
      const cacheDriver = this.container.get('driver');
      
      emitter.onBlocking(npmEvents.npm.cache.init, cacheDir => {
        const spinner = new Spinner(`Downloading caches from #${ cacheDriver }`);
        
        return spinner.then(
          'Caches downloaded.'
        ).catch(
          'Caches failed to download!'
        ).promise(
          this._initCache(cacheDriver, cacheDir)
            ._trackProgress(this.cache, spinner)
            .cache.download()
        )
      });
      
      emitter.onBlocking(testEvents.assets.test.end, () => {
        if (!this.cache) {
          resolve();
          return Promise.resolve();
        }
        
        const spinner = new Spinner(`Uploading caches to #${ cacheDriver }`);

        return spinner.then(
          'Caches uploaded.'
        ).catch(
          'Caches failed to upload!'
        ).promise(
          this._trackProgress(this.cache, spinner)
            .cache.upload()
        ).then(() => resolve());
      });
    });
  }
  
  /**
   * @param {EventEmitter} emitter
   * @param {ora} spinner
   *
   * @returns {CacheComponent}
   *
   * @private
   */
  _trackProgress(emitter, spinner) {
    emitter.on(cacheEvents.cache.upload.progress, payload => {
      const { amount, total } = payload;
      
      spinner.prepend(`[${ prettyBytes(amount) }/${ prettyBytes(total) }]`);
    });
    
    spinner.prepend(`[0/0]`);
    
    return this;
  }
}

module.exports = CacheComponent;
