'use strict';

const print = require('print');
const path = require('path');
const fs = require('fs');
const pify = require('pify');
const readdir = require('readdir-enhanced');
const events = require('./events');

class EmitModule {
  /**
   * @param {string} name
   * @param {Container|*} container
   * @param {Emitter|*} emitter
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
   * @returns {Promise|*}
   */
  process(container) {
    if (!this.container.has('root')) {
      return Promise.reject(new Error(`Missing root for module ${ this.name }`));
    }
    
    const moduleRoot = this.container.get('root');

    return new Promise((resolve, reject) => {
      fs.exists(moduleRoot, exists => {
        if (!exists) {
          return reject(new Error(
            `Module ${ this.name } root ${ moduleRoot } does not exists or wrong permissions set`
          ));
        }
        
        this.emitter.emitBlocking(events.module.emit.start, this)
          .then(() => {
            const options = {
              deep: this._deepFilter(container).bind(this),
              filter: this._filter(container).bind(this),
            };
            
            return new Promise((resolve, reject) => {
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
                  
                  this.logger.debug(`Emit ${ filePath } asset`);
                  
                  this.emitter
                    .maxParallel(events.module.emit.asset, EmitModule.MAX_PARALLEL_ASSETS_EMIT)
                    .emitBlocking(events.module.emit.asset, payload)
                    .then(() => {
                      processing--;
                      
                      if (processing <= 0 && ended) {
                        this.emitter.emit(events.module.emit.end);
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
                    this.emitter.emit(events.module.emit.end);
                    resolve();
                  }
                })
                .on('error', error => reject(error));
            });
          })
          .then(() => resolve())
          .catch(error => {
            this.logger.warn(this.logger.emoji.poop, `failed dispatching module ${ this.name }`);
            reject(error);
          });
      });
    });
  }
  
  /**
   * @param {Container|*} container
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
   * @param {Container|*} container
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
   * @returns {Emitter|*}
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
   * @returns {Container|*}
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
