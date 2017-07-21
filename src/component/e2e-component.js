'use strict';

const DependantConfigBasedComponent = require('./dependant-config-based-component');
const emitEvents = require('./emit/events');
const events = require('./e2e/events');
const print = require('print');
const ContainerTransformer = require('./helper/container-transformer');
const createTestCafe = require('testcafe');
const Spinner = require('./helper/spinner');
const urlExists = require('url-exists');
const pify = require('pify');

/**
 * End2End component
 */
class E2EComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._testAssets = [];
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
    return 'e2e';
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
   * 
   * @private
   *
   * @see https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/reporters.html
   * @see http://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/browser-support.html
   */
  _run(emitter) {
    return this._waitUris()
      .then(() => {
        return createTestCafe(
          E2EComponent.DEFAULT_SERVER_HOSTNAME, 
          ...E2EComponent.DEFAULT_SERVER_PORTS
        ).then(testcafe => {
          const runner = testcafe.createRunner();
          const reporter = this.container.get('reporter', E2EComponent.DEFAULT_REPORTER);
          const browsers = this.container.get('browsers', E2EComponent.DEFAULT_BROWSERS);
          
          return emitter.emitBlocking(
            events.assets.e2e.start, 
            testcafe, 
            runner, 
            browsers, 
            reporter
          ).then(() => {
            return runner
              .src(this._testAssets)
              .browsers(browsers)
              .reporter(reporter)
              .run(E2EComponent.RUN_OPTIONS);
          }).then(failedCount => {
            
            // @todo find a smarter way to indent the output (buffer it?)
            process.stdout.write('\n\n');
            
            return testcafe.close()
              .then(() => emitter.emitBlocking(events.assets.e2e.end, testcafe, failedCount))
              .then(() => Promise.resolve(failedCount));
          });
        });
      });
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _waitUris() {
    const uris = this.container.get('wait.uri', []);
    
    if (uris.length <= 0) {
      return Promise.resolve();
    }
    
    const spinner = new Spinner(
      `Wait for the following URIs to be available: ${ uris.join(', ') }`
    );
    
    return spinner.then(
      `All URIs are available:\n\t${ uris.join('\n\t') }`
    ).catch(
      `Some of the following URIs are not available:\n\t${ uris.join('\n\t') }`
    ).promise(Promise.all(uris.map(uri => this._waitUri(uri))));
  }
  
  /**
   * @param {string} uri
   * 
   * @returns {Promise}
   *
   * @private
   */
  _waitUri(uri) {
    return new Promise((resolve, reject) => {
      const timeout = parseInt(this.container.get(
        'wait.timeout', 
        E2EComponent.DEFAULT_WAIT_TIMEOUT
      ));
      const interval = this.container.get(
        'wait.interval', 
        E2EComponent.DEFAULT_WAIT_INTERVAL
      );
      const failTime = Date.now() + timeout;
      
      const id = setInterval(() => {
        pify(urlExists)(uri)
          .then(exists => {
            if (exists) {
              clearInterval(id);
              resolve();
            } else if (failTime <= Date.now()) {
              clearInterval(id);
              reject(new Error(
                `The max timeout limit of ${ timeout } reached`
              ));
            }
          })
          .catch(error => {
            clearInterval(id);
            reject(error);
          });
      }, interval);
    });
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
          return emitter.emitBlocking(events.asset.e2e.skip, payload);
        }
        
        return emitter.emitBlocking(events.asset.e2e.add, payload)
          .then(() => {
            const { fileAbs } = payload;
            
            this._testAssets.push(fileAbs);
          });
      }, E2EComponent.DEFAULT_PRIORITY);
      
      emitter.on(emitEvents.modules.process.end, () => {
        process.nextTick(() => {
          if (this._testAssets.length <= 0) {
            this.logger.info(
              this.logger.emoji.beer, 
              `Finished processing ${ this.stats.processed } end-to-end test assets`
            );
            this.logger.debug(this.dumpStats());
            
            return resolve();
          }
          
          this._run(emitter)
            .then(failedCount => {
              if (failedCount > 0) {
                return Promise.reject(new Error(
                  `There is/are ${ failedCount } end-to-end test case/s failed!`
                ));
              }
              
              this.logger.info(
                this.logger.emoji.beer, 
                `Finished processing ${ this.stats.processed } end-to-end test assets`
              );
              this.logger.debug(this.dumpStats());
              
              resolve();
            })
            .catch(error => reject(error));
        });
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
   * @returns {number[]}
   */
  static get DEFAULT_SERVER_PORTS() {
    return [ 1337, 1338 ];
  }
  
  /**
   * @returns {*}
   */
  static get RUN_OPTIONS() {
    return {
      skipJsErrors: true,
      assertionTimeout: 20000,
      quarantineMode: true,
    };
  }
  
  /**
   * @returns {string[]}
   */
  static get DEFAULT_BROWSERS() {
    return [ 'nightmare' ];
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_REPORTER() {
    return 'spec';
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_SERVER_HOSTNAME() {
    return 'localhost';
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_WAIT_INTERVAL() {
    return 200;
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_WAIT_TIMEOUT() {
    return 15000;
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_PRIORITY() {
    return 10;
  }
}

module.exports = E2EComponent;
