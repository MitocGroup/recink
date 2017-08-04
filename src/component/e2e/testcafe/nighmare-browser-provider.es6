'use strict';

const Nightmare = require('nightmare');
const debug = require('debug');
const pify = require('pify');

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
   * Nightmare initialization options
   * 
   * @type {*}
   * 
   * @private
   */
  _nightmareOptions: {
    show: debug.enabled(),
    openDevTools: debug.enabled(),
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
   * 
   * @param {string} id 
   * @param {string} pageUrl 
   * 
   * @returns {Promise}
   */
  async openBrowser(id, pageUrl) {
    const nightmare = Nightmare(this._nightmareOptions).goto(pageUrl);

    await pify(nightmare.run.bind(nightmare))();

    this.openedPages[id] = nightmare;
  },

  /**
   * Close given page in browser
   * 
   * @param {string} id
   * 
   * @returns {Promise}
   */
  async closeBrowser(id) {
    const page = this.openedPages[id];

    delete this.openedPages[id];
    await page.end();
  },

  /**
   * Init browser
   * 
   * @returns {Promise}
   */
  async init() {
    return;
  },

  /**
   * Dispose browser
   * 
   * @returns {Promise}
   */
  async dispose() {
    return;
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
