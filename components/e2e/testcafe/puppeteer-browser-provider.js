'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const puppeteer = require('puppeteer');
const debug = require('debug');
const Env = require('../../../helper/env');

// Register Object.entries shim
require('object.entries').shim();

/**
 * Nighmare browser provider
 */
module.exports = {
  /**
   * Map with open page references
   * 
   * @type {*}
   */
  openedPages: {},

  /**
   * Multiple browsers support
   * 
   * @type {boolean}
   */
  isMultiBrowser: false,

  /**
   * Puppeteer initialization options
   * 
   * @type {*}
   * 
   * @private
   */
  _options: {
    ignoreHTTPSErrors: true,
    headless: !debug.enabled(),
    slowMo: debug.enabled() ? 250 : 0,
    timeout: 60000,
    dumpio: debug.enabled(),

    // avoid issues in Travis
    args: Env.isCI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
  },

  /**
   * Open new page in browser
   * 
   * @param {string} id 
   * @param {string} pageUrl 
   * 
   * @returns {Promise}
   */
  openBrowser(id, pageUrl) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const browser = yield puppeteer.launch(_this._options);
      const page = yield browser.newPage();

      _this.openedPages[id] = { browser, page };

      yield page.goto(pageUrl);
    })();
  },

  /**
   * Close given page in browser
   * 
   * @param {string} id
   * 
   * @returns {Promise}
   */
  closeBrowser(id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const { browser } = _this2.openedPages[id];

      delete _this2.openedPages[id];

      yield browser.close();
    })();
  },

  /**
   * Init browser
   * 
   * @returns {Promise}
   */
  init() {
    return _asyncToGenerator(function* () {
      return;
    })();
  },

  /**
   * Dispose browser
   * 
   * @returns {Promise}
   */
  dispose() {
    return _asyncToGenerator(function* () {
      return;
    })();
  },

  /**
   * resize browser window to given size
   * 
   * @param {string} id 
   * @param {number} width 
   * @param {number} height 
   * 
   * @returns {Promise}
   */
  resizeWindow(id, width, height) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const { page } = _this3.openedPages[id];

      yield page.setViewport({ width, height });
    })();
  },

  /**
   * take screenshot of given page in browser
   * 
   * @param {string} id 
   * @param {string} screenshotPath 
   * 
   * @returns {Promise}
   */
  takeScreenshot(id, screenshotPath) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const { page } = _this4.openedPages[id];

      yield page.screenshot({ path: screenshotPath });
    })();
  }
};