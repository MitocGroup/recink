'use strict';

const ConfigBasedComponent = require('./config-based-component');
const events = require('./emit/events');
const print = require('print');
const ContainerTransformer = require('./helper/container-transformer');

class TestComponent extends ConfigBasedComponent {
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
   * @param {Emitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      emitter.onBlocking(events.module.emit.asset, payload => {
        if (!this._match(payload)) {
          return Promise.resolve();
        }
        
        this.logger.info(this.logger.emoji.hat, `Test ${ payload.fileAbs }`);
        
        return new Promise((resolve, reject) => {
          this.addProcessing();

          setTimeout(() => {//@todo remove
            this.removeProcessing();
            resolve();
          }, 300 * (this.processing + 1));
        });
      }, TestComponent.DEFAULT_PRIORITY);
      
      emitter.on(events.module.emit.end, () => {
        this.waitProcessing().then(() => {
          this.logger.info(
            this.logger.emoji.smiley, 
            `Finished processing ${ this.stats.processed } test assets`
          );
          this.logger.debug(this.dumpStats());
          resolve();
        });
      });
    });
  }
  
  /**
   * @param {*} config
   * @param {string} configFile
   *
   * @returns {Container|*}
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