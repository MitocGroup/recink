'use strict';

const print = require('print');
const path = require('path');
const fse = require('fs-extra');
const pify = require('pify');
const readdir = require('readdir-enhanced');
const events = require('./events');

class EmitModule {
  /**
   * @param {string} name
   * @param {Container} container
   * @param {Emitter} emitter
   * @param {*} logger
   */
  constructor(name, container, emitter, logger) {
    this._emitter = emitter;
    this._logger = logger;
    this._name = name;
    this._container = container;
    this._stats = {
      total: 0,
      emitted: 0,
      ignored: 0,
      dirs: 0,
    };
  }
  
  /**
   * @returns {promise}
   */
  check() {
    const moduleRoot = this.container.get('root', null);
    
    if (!moduleRoot) {
      return Promise.reject(new Error(`Missing root for module ${ this.name }`));
    }
    
    return fse.pathExists(moduleRoot)
      .then(hasModuleRoot => {
        if (!hasModuleRoot) {
          return Promise.reject(new Error(
            `Module ${ this.name } root ${ moduleRoot } does not exists or wrong permissions set`
          ));
        }
        
        return Promise.resolve();
      })
  }
  
  /**
   * @returns {promise}
   */
  process(container) {
    return new Promise((resolve, reject) => {
      const moduleRoot = this.container.get('root');
      
      const options = {
        deep: this._deepFilter(container).bind(this),
        filter: this._filter(container).bind(this),
      };
      
      let ended = false;
      let processing = 0;
      
      readdir.stream(moduleRoot, options)
        .on('data', filePath => {
          processing++;
          
          const payload = {
            file: filePath,
            fileAbs: path.join(moduleRoot, filePath),
            module: this,
          };
          
          this.logger.debug('Emit asset', JSON.stringify(
            Object.assign({}, payload, { module: this.name })
          ));
          
          this.emitter
            .maxParallel(events.module.emit.asset, EmitModule.MAX_PARALLEL_ASSETS_EMIT)
            .emitBlocking(events.module.emit.asset, payload)
            .then(() => {
              processing--;
              
              if (processing <= 0 && ended) {
                resolve();
              }
            })
            .catch(error => {
              this.logger.warn(this.logger.emoji.poop, `failed dispatching asset ${ filePath }`);
              reject(error);
            });
        })
        .on('end', () => {
          ended = true;
          
          if (processing <= 0) {
            resolve();
          }
        })
        .on('error', error => reject(error));
    });
  }
  
  /**
   * @param {Container} container
   *
   * @returns {function}
   *
   * @private
   */
  _filter(container) {
    const pattern = container.get('pattern', []);
    const ignore = container.get('ignore', []);
    
    return stats => {
      const result = stats.isFile() 
        && pattern.filter(p => this._test(p, stats.path)).length > 0
        && ignore.filter(i => this._test(i, stats.path)).length <= 0;
      
      if (stats.isFile()) {
        if (result) {
          this.stats.emitted++;
        } else {
          this.stats.ignored++;
        }
        
        this.stats.total++;
      } else if(stats.isDirectory()) {
        this.stats.dirs++;
      }
        
      return result;  
    };
  }
  
  /**
   * @param {Container} container
   *
   * @returns {function}
   *
   * @private
   */
  _deepFilter(container) {
    const ignore = container.get('ignore', []);
    
    return stats => {
      return ignore.filter(i => this._test(i, stats.path)).length <= 0;
    };
  }
  
  /**
   * @param {string|RegExp} pattern
   * @param {string} value
   *
   * @returns {boolean}
   *
   * @private
   */
  _test(pattern, value) {
    if (!(pattern instanceof RegExp)) {
      return value.indexOf(pattern.toString()) !== -1;
    }
    
    return pattern.test(value);
  }
  
  /**
   * @returns {*}
   */
  get logger() {
    return this._logger;
  }
  
  /**
   * @returns {Emitter}
   */
  get emitter() {
    return this._emitter;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return this._name;
  }
  
  /**
   * @returns {Container}
   */
  get container() {
    return this._container;
  }
  
  /**
   * @returns {*}
   */
  get stats() {
    return this._stats;
  }
  
  /**
   * @returns {string}
   */
  dumpStats() {
    return print(this.stats, {
      showArrayIndices: true,
      showArrayLength: true,
      sortProps: false,
    }).replace(/\t/g, '   ')
  }
  
  /**
   * @returns {number}
   *
   * @todo make it configurable for specific use cases
   */
  static get MAX_PARALLEL_ASSETS_EMIT() {
    return 1;
  }
}

module.exports = EmitModule;
