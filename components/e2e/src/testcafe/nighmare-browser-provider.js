'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const pify = require('pify');
const debug = require('debug');
const Nightmare = require('nightmare');

/**
 * Nighmare browser provider
 * @deprecated
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
   * Nightmare initialization options
   * 
   * @type {*}
   * 
   * @private
   */
  _options: {
    show: debug.enabled('nightmare'),
    openDevTools: debug.enabled('nightmare'),
    waitTimeout: 60000,
    gotoTimeout: 60000,
    loadTimeout: 60000,
    executionTimeout: 60000,
    switches: {
      'ignore-certificate-errors': true
    }
  },

  /**
   * Open new page in browser
   * @param {String} id
   * @param {String} pageUrl
   * @returns {Promise}
   */
  openBrowser(id, pageUrl) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const nightmare = Nightmare(_this._options).goto(pageUrl);

      yield pify(nightmare.run.bind(nightmare))();

      _this.openedPages[id] = nightmare;
    })();
  },

  /**
   * Close given page in browser
   * @param {String} id
   * @returns {Promise}
   */
  closeBrowser(id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const page = _this2.openedPages[id];

      delete _this2.openedPages[id];

      yield page.end();
    })();
  },

  /**
   * Init browser
   * @returns {Promise}
   */
  init() {
    return _asyncToGenerator(function* () {
      return;
    })();
  },

  /**
   * Dispose browser
   * @returns {Promise}
   */
  dispose() {
    return _asyncToGenerator(function* () {
      return;
    })();
  },

  /**
   * Resize browser window to given size
   * @param {String} id
   * @param {Number} width
   * @param {Number} height
   * 
   * @returns {Promise}
   */
  resizeWindow(id, width, height) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3._nightmare.viewport(width, height);
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
      yield _this4._nightmare.screenshot(screenshotPath);
    })();
  }
};