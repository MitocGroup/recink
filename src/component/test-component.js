  'use strict';

const print = require('print');
const unitEvents = require('./test/events');
const emitEvents = require('./emit/events');
const UnitRunner = require('./test/unit-runner');
const ContainerTransformer = require('./helper/container-transformer');
const DependencyBasedComponent = require('./dependency-based-component');

/**
 * Test component
 */
class TestComponent extends DependencyBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    /**
     * _units format
     * @type {{
     *  moduleName: {
     *    assets: [],
     *    runner: UnitRunner
     *  }
     * }}
     */
    this._units = {};
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
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      const mochaOptions = this.container.get('mocha.options', {});

      emitter.onBlocking(emitEvents.module.emit.asset, payload => {
        if (!this._match(payload)) {
          return emitter.emitBlocking(unitEvents.asset.test.skip, payload);
        }

        return emitter.emitBlocking(unitEvents.asset.test.add, {}).then(() => {
          const { fileAbs, module } = payload;
          this.logger.info(this.logger.emoji.fist, `New test registered: ${ fileAbs }`);

          if (!this._units.hasOwnProperty(module.name)) {
            this._units[module.name] = {
              assets: [],
              runner: new UnitRunner(mochaOptions)
            };
          }

          this._units[module.name].assets.push(fileAbs);

          return Promise.resolve();
        });
      }, TestComponent.DEFAULT_PRIORITY);

      emitter.onBlocking(emitEvents.module.process.end, module => {
        if (!this._units.hasOwnProperty(module.name)) {
          return Promise.resolve();
        }

        const unitModule = this._units[module.name];
        const unitRunner = unitModule.runner;
        const mocha = unitRunner.getMocha();

        return emitter.emitBlocking(unitEvents.asset.tests.start, mocha, module).then(() => {
          if (unitModule.assets.length <= 0) {
            return Promise.resolve();
          }

          return unitRunner.run(unitModule.assets).then(failures => {
            if (failures > 0) {
              return Promise.reject(
                new Error(`Tests failed in module ${ module.name } with ${ failures } failures`)
              );
            }

            return unitRunner.cleanup();
          });
        }).then(() => emitter.emitBlocking(unitEvents.asset.tests.end, mocha, module));
      }, TestComponent.DEFAULT_PRIORITY);
      
      emitter.on(emitEvents.modules.process.end, () => {
        this.waitProcessing()
          .then(() => emitter.emitBlocking(unitEvents.assets.test.end, this))
          .then(() => {
            this.logger.info(this.logger.emoji.beer, `Finished processing ${ this.stats.processed } test assets`);
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
