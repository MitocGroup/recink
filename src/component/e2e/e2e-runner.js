'use strict';

const createTestCafe = require('testcafe');
const registerBrowsers = require('./testcafe/browsers-registrar');

/**
 * End2End test runner (build on top of TestCafe)
 * @see https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/browser-support.html
 * @see https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/reporters.html
 */
class E2ERunner {
  /**
   * @param {String} hostName
   * @param {Array} hostPorts
   */
  constructor(options = {}) {
    const defaults = {
      hostPorts: E2ERunner.DEFAULT_SERVER_PORTS,
      hostName: E2ERunner.DEFAULT_SERVER_HOSTNAME,
      reporter: E2ERunner.DEFAULT_REPORTER,
      browsers: E2ERunner.DEFAULT_BROWSERS,
      screenshotsPath: process.cwd(),
      takeOnFail: false,
    };

    this._config = Object.assign({}, defaults, options);

    console.log('this._config', JSON.stringify(this._config, null, 2));
  }

  /**
   * Init testcafe runner
   * @returns {Promise}
   */
  getTestCafe() {
    if (this._testcafe) {
      return Promise.resolve();
    }

    return createTestCafe(this._config.hostName, ...this._config.hostPorts).then(testcafe => {
      registerBrowsers();
      this._testcafe = testcafe;

      return Promise.resolve();
    });
  }

  /**
   * Run tests
   * @param {Array|String} tests
   * @param {Object} options
   * @returns {Promise}
   */
  run(tests) {
    return this.getTestCafe().then(() => {
      const runner = this._testcafe.createRunner().screenshots(this._config.screenshotsPath, this._config.takeOnFail);

      return runner
        .src(tests)
        .browsers(this._config.browsers)
        .reporter(this._config.reporter)
        .run(E2ERunner.RUN_OPTIONS)
        .then(failed => {
          if (failed > 0) {
            return Promise.reject(failed);
          }

          return Promise.resolve();
        });
    });
  }

  /**
   * Terminate
   * @returns {Promise}
   */
  cleanup() {
    return this._testcafe.close();
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_SERVER_HOSTNAME() {
    return 'localhost';
  }

  /**
   * @returns {Number[]}
   */
  static get DEFAULT_SERVER_PORTS() {
    return [ 1337, 1338 ];
  }

  /**
   * @todo figure out options that really matters!
   * @ex: skipJsErrors: true, quarantineMode: true
   * @returns {*}
   */
  static get RUN_OPTIONS() {
    return {};
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_REPORTER() {
    return 'spec';
  }

  /**
   * @returns {String[]}
   */
  static get DEFAULT_BROWSERS() {
    return [ 'puppeteer' ];
  }
}

module.exports = E2ERunner;
