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
    
    this._npmCache = null;
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
    return [];
  }
  
  /**
   * @returns {AbstractDriver}
   */
  get npmCache() {
    return this._npmCache;
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return this._handleNpmCache(emitter);
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    return this._teardownNpmCache(emitter);
  }

  /**
   * @param {string} cacheDriver
   * @param {string} cacheDir
   *
   * @returns {CacheComponent}
   *
   * @private
   */
  _initNpmCache(cacheDriver, cacheDir) {
    this._npmCache = cacheFactory[cacheDriver](
      cacheDir,
      ...this.container.get('options', [])
    );
    
    return this;
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _handleNpmCache(emitter) {
    if (!emitter.component('npm')) {
      return Promise.resolve();
    }

    const cacheDriver = this.container.get('driver');

    emitter.onBlocking(npmEvents.npm.cache.init, cacheDir => {
      return this
        ._initNpmCache(cacheDriver, cacheDir)
        ._downloadCache(this.npmCache);
    });

    return Promise.resolve();
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _teardownNpmCache(emitter) {
    if (!this.npmCache || !emitter.component('npm')) {
      return Promise.resolve();
    }

    return this._uploadCache(this.npmCache);
  }

  /**
   * @param {AbstractDriver} cache 
   * 
   * @private
   */
  _downloadCache(cache) {
    const spinner = new Spinner(`Downloading caches from #${ cache.name }`);
      
    return spinner.then(
      `Caches downloaded to ${ cache.cacheDir }`
    ).catch(
      `Failed to download caches to ${ cache.cacheDir }`
    ).promise(
      this._trackProgress(cache, spinner).download()
    );
  }

  /**
   * @param {AbstractDriver} cache 
   * 
   * @private
   */
  _uploadCache(cache) {
    const spinner = new Spinner(`Uploading caches to #${ cache.name }`);
      
    return spinner.then(
      `Caches uploaded from ${ cache.cacheDir }`
    ).catch(
      `Failed to upload caches from ${ cache.cacheDir }`
    ).promise(
      this._trackProgress(cache, spinner).upload()
    );
  }
  
  /**
   * @param {EventEmitter} emitter
   * @param {ora} spinner
   *
   * @returns {EventEmitter}
   *
   * @private
   */
  _trackProgress(emitter, spinner) {
    emitter.on(cacheEvents.cache.upload.progress, payload => {
      const { amount, total } = payload;
      
      spinner.prepend(`[${ prettyBytes(amount) }/${ prettyBytes(total) }]`);
    });
    
    spinner.prepend(`[0/0]`);
    
    return emitter;
  }
}

module.exports = CacheComponent;
