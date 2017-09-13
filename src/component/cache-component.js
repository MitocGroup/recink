'use strict';

const npmEvents = require('./npm/events');
const CacheFactory = require('./cache/factory');
const DependantConfigBasedComponent = require('./dependant-config-based-component');
const Spinner = require('./helper/spinner');
const cacheEvents = require('./cache/events');
const prettyBytes = require('pretty-bytes');
const SequentialPromise = require('./helper/sequential-promise');

/**
 * Cache component
 */
class CacheComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._caches = [];
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
   * @returns {AbstractDriver[]}
   */
  get caches() {
    return this._caches;
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  init(emitter) {
    return Promise.all([
      this._initCaches(emitter),
      this._initNpmCache(emitter)
    ]);
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    if (this.caches.length <= 0) {
      return Promise.resolve();
    }

    return SequentialPromise.all(this.caches.map(cache => {
      return () => this._uploadCache(cache);
    }));
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _initCaches(emitter) {
    const cachePaths = this.container.get('paths', []);

    if (cachePaths.length <= 0) {
      return Promise.resolve();
    }

    return SequentialPromise.all(cachePaths.map(cacheDir => {
      return () => {
        const cache = this._createCache(cacheDir);

        this.caches.push(cache);

        return this._downloadCache(cache);
      };
    }));
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _initNpmCache(emitter) {
    const enabled = this.container.get('npm', true);

    if (!enabled || !emitter.component('npm')) {
      return Promise.resolve();
    }

    emitter.onBlocking(npmEvents.npm.cache.init, cacheDir => {
      const npmCache = this._createCache(cacheDir);

      this.caches.push(npmCache);

      return this._downloadCache(npmCache);
    });

    return Promise.resolve();
  }

  /**
   * @param {string} cacheDir
   *
   * @returns {AbstractDriver}
   *
   * @private
   */
  _createCache(cacheDir) {
    return CacheFactory.create(
      this.container.get('driver'),
      cacheDir,
      ...this.container.get('options', [])
    );
  }

  /**
   * @param {AbstractDriver} cache 
   * 
   * @returns {Promise}
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
   * @returns {Promise}
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
