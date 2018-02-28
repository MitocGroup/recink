'use strict';

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
      'ignore-certificate-errors': true,
    },
  },

  /**
   * Open new page in browser
   * @param {String} id
   * @param {String} pageUrl
   * @returns {Promise}
   */
  async openBrowser(id, pageUrl) {
    const nightmare = Nightmare(this._options).goto(pageUrl);

    await pify(nightmare.run.bind(nightmare))();

    this.openedPages[id] = nightmare;
  },

  /**
   * Close given page in browser
   * @param {String} id
   * @returns {Promise}
   */
  async closeBrowser(id) {
    const page = this.openedPages[id];

    delete this.openedPages[id];
    
    await page.end();
  },

  /**
   * Init browser
   * @returns {Promise}
   */
  async init() {
    return;
  },

  /**
   * Dispose browser
   * @returns {Promise}
   */
  async dispose() {
    return;
  },

  /**
   * Resize browser window to given size
   * @param {String} id
   * @param {Number} width
   * @param {Number} height
   * 
   * @returns {Promise}
   */
  async resizeWindow(id, width, height) {
    await this._nightmare.viewport(width, height);
  },

  /**
   * take screenshot of given page in browser
   * 
   * @param {string} id 
   * @param {string} screenshotPath 
   * 
   * @returns {Promise}
   */
  async takeScreenshot(id, screenshotPath) {
    await this._nightmare.screenshot(screenshotPath);
  },
};
