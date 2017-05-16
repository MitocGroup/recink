'use strict';

const ConfigBasedComponent = require('./config-based-component');
const emitEvents = require('./emit/events');
const events = require('./test/events');
const print = require('print');
const ContainerTransformer = require('./helper/container-transformer');
const TestAsset = require('./test/test-asset');
const Mocha = require('mocha');

class TestComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._stats = {
      total: 0,
      processed: 0,
      ignored: 0,
    };
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'test';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      emitter.onBlocking(emitEvents.module.emit.asset, payload => {
        if (!this._match(payload)) {
          return Promise.resolve();
        }
        
        const { file, fileAbs, module } = payload;
        
        this.addProcessing();
        this.logger.info(this.logger.emoji.fist, `Test ${ fileAbs }`);
        
        const testAsset = new TestAsset(file, fileAbs, module);
        const mocha = new Mocha(this.container.get('mocha.options', {}));
        
        return emitter.emitBlocking(events.asset.test.start, testAsset, mocha)
          .then(() => testAsset.test(mocha))
          .then(() => emitter.emitBlocking(events.asset.test.end, testAsset, mocha))
          .then(() => {
            this.removeProcessing();
            return Promise.resolve();
          })
          .catch(error => {
            this.removeProcessing();
            return Promise.reject(error);
          });
      }, TestComponent.DEFAULT_PRIORITY);
      
      emitter.on(emitEvents.module.emit.end, () => {
        this.waitProcessing()
          .then(() => emitter.emitBlocking(events.assets.test.end, this))
          .then(() => {
            this.logger.info(
              this.logger.emoji.beer, 
              `Finished processing ${ this.stats.processed } test assets`
            );
            this.logger.debug(this.dumpStats());
            resolve();
          })
          .catch(error => reject(error));
      });
    });
  }
  
  /**
   * @param {*} config
   * @param {string} configFile
   *
   * @returns {Container}
   */
  prepareConfig(config, configFile) {
    return super.prepareConfig(config, configFile)
      .then(container => {
        return (new ContainerTransformer(container))
          .addPattern('pattern')
          .addPattern('ignore')
          .transform();
      });
  }
  
  /**
   * @param {*} payload
   *
   * @returns {boolean}
   * 
   * @private
   */
  _match(payload) {
    const pattern = this.container.get('pattern', []);
    const ignore = this.container.get('ignore', []);

    const result = pattern.filter(p => this._test(p, payload.file)).length > 0
      && ignore.filter(i => this._test(i, payload.file)).length <= 0;
    
    if (result) {
      this.stats.processed++;
    } else {
      this.stats.ignored++;
    }
    
    this.stats.total++;
      
    return result;
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
   */
  static get DEFAULT_PRIORITY() {
    return 10;
  }
}

module.exports = TestComponent;
