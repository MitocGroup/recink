'use strict';

const Nightmare = require('nightmare');
const debug = require('debug');

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
   * Reference to Nightmare instance
   * 
   * @type {Nightmare}
   * 
   * @private
   */
  _nightmare: null,

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
    const page = await this._nightmare.goto(pageUrl);

    this.openedPages[id] = page;
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
    this._nightmare = Nightmare(this._nightmareOptions);
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
