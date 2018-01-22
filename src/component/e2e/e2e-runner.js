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
  constructor(
    hostName = E2ERunner.DEFAULT_SERVER_HOSTNAME,
    hostPorts = E2ERunner.DEFAULT_SERVER_PORTS
  ) {
    this._testcafe = false;
    this._hostName = hostName;
    this._hostPorts = hostPorts;
  }

  /**
   * Init runner
   * @returns {Promise}
   * @private
   */
  _init() {
    if (this._testcafe) {
      return Promise.resolve();
    }

    return createTestCafe(this._hostName, ...this._hostPorts).then(testcafe => {
      registerBrowsers();
      this._testcafe = testcafe;

      return Promise.resolve();
    });
  }

  /**
   * Get runner
   * @param {String} screenshotsPath
   * @param {Boolean} takeOnFail
   * @returns {Promise}
   * @private
   */
  _getRunner(screenshotsPath = process.cwd(), takeOnFail = false) {
    return this._init().then(() => {
      const runner = this._testcafe.createRunner().screenshots(screenshotsPath, takeOnFail);

      return Promise.resolve(runner);
    });
  }

  /**
   * Run tests
   * @param {Array|String} tests
   * @param {Object} options
   * @returns {Promise}
   */
  run(tests, options = {}) {
    return this._getRunner(options.screenshotsPath, options.takeOnFail).then(runner => {
      return runner
        .src(tests)
        .browsers(options.browsers || E2ERunner.DEFAULT_BROWSERS)
        .reporter(options.reporter || E2ERunner.DEFAULT_REPORTER)
        .run(E2ERunner.RUN_OPTIONS);
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
