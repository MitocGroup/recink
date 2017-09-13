'use strict';

const DependantConfigBasedComponent = require('./dependant-config-based-component');
const emitEvents = require('./emit/events');
const events = require('./test/events');
const print = require('print');
const ContainerTransformer = require('./helper/container-transformer');
const Mocha = require('mocha');

/**
 * Test component
 */
class TestComponent extends DependantConfigBasedComponent {
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
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'emit' ];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      const mochas = {};
      const mochaOptions = this.container.get('mocha.options', {});
      
      emitter.onBlocking(emitEvents.module.emit.asset, payload => {
        if (!this._match(payload)) {
          return emitter.emitBlocking(events.asset.test.skip, payload);
        }
        
        const { fileAbs, module } = payload;
        
        mochas[module.name] = mochas[module.name] 
          || new Mocha(mochaOptions);

        return emitter.emitBlocking(events.asset.test.add, mochas[module.name])
          .then(() => {
            this.logger.info(this.logger.emoji.fist, `Test ${ fileAbs }`);
            
            mochas[module.name].addFile(fileAbs);
            
            return Promise.resolve();
          });
      }, TestComponent.DEFAULT_PRIORITY);
      
      emitter.onBlocking(emitEvents.module.process.end, module => {
        const mocha = mochas[module.name] || null;
        
        return emitter.emitBlocking(events.asset.tests.start, mocha, module)
          .then(() => {
            return mocha ? new Promise((resolve, reject) => {
              mocha.run(failures => {
                if (failures > 0) {
                  return reject(new Error(
                    `Tests failed in module ${ module.name } with ${ failures } failures`
                  ));
                }
                
                resolve();
              });
            }) : Promise.resolve();
          })
          .then(() => emitter.emitBlocking(events.asset.tests.end, mocha, module));
      }, TestComponent.DEFAULT_PRIORITY);
      
      emitter.on(emitEvents.modules.process.end, () => {
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
    }).replace(/\t/g, '   ');
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_PRIORITY() {
    return 10;
  }
}

module.exports = TestComponent;
