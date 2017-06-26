'use strict';

const npmEvents = require('./npm/events');
const emitEvents = require('./emit/events');
const cacheFactory = require('./cache/factory');
const DependantConfigBasedComponent = require('./dependant-config-based-component');
const Spinner = require('./helper/spinner');
const cacheEvents = require('./cache/events');
const prettyBytes = require('pretty-bytes');

/**
 * Cache component
 */
class CacheComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._cache = null;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'cache';
  }
  
  /**
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'npm' ];
  }
  
  /**
   * @returns {AbstractDriver}
   */
  get cache() {
    return this._cache;
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
   * @returns {Promise}
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
      
      emitter.onBlocking(emitEvents.modules.process.end, () => {
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
          this._trackProgress(this.cache, spinner).cache.upload()
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
