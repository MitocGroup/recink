'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const Nightmare = require('nightmare');
const debug = require('debug');

module.exports = {
  // reference to Nightmare instance
  nightmare: null,

  // map with open page references
  openedPages: {},

  // multiple browsers support
  isMultiBrowser: false,

  // open new page in browser
  openBrowser(id, pageUrl) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const page = yield _this.nightmare.goto(pageUrl);

      _this.openedPages[id] = page;
    })();
  },

  // close given page in browser
  closeBrowser(id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const page = _this2.openedPages[id];

      delete _this2.openedPages[id];
      yield page.end();
    })();
  },

  // init browser
  init() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const conf = {
        show: debug.enabled(),
        openDevTools: debug.enabled(),
        webPreferences: {
          partition: `partition-${Date.now()}`
        }
      };

      _this3.nightmare = Nightmare(conf);
    })();
  },

  dispose() {
    return _asyncToGenerator(function* () {
      return;
    })();
  },

  // resize browser window to given size
  resizeWindow(id, width, height) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield _this4.nightmare.viewport(width, height);
    })();
  },

  // take screenshot of given page in browser
  takeScreenshot(id, screenshotPath) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield _this5.nightmare.screenshot(screenshotPath);
    })();
  }
};