'use strict';

const Env = require('recink/src/helper/env');
const debug = require('debug');
const puppeteer = require('puppeteer');

// Register Object.entries shim
require('object.entries').shim();

/**
 * Puppeteer browser provider
 */
module.exports = {
  /**
   * Map with open page references
   * @type {*}
   */
  openedPages: {},

  /**
   * Multiple browsers support
   * @type {Boolean}
   */
  isMultiBrowser: false,

  /**
   * Puppeteer initialization options
   * @type {*}
   * @private
   */
  _options: {
    ignoreHTTPSErrors: true,
    headless: !debug.enabled('puppeteer'),
    slowMo: debug.enabled('puppeteer') ? 250 : 0,
    timeout: 60000,
    dumpio: debug.enabled('puppeteer'),

    // avoid issues in Travis
    args: Env.isCI ? [ '--no-sandbox', '--disable-setuid-sandbox' ] : [],
  },

  /**
   * Open new page in browser
   * @param {String} id
   * @param {String} pageUrl
   * @returns {Promise}
   */
  async openBrowser(id, pageUrl) {
    const browser = await puppeteer.launch(this._options);
    const page = await browser.newPage();

    this.openedPages[id] = { browser, page };

    await page.goto(pageUrl);
  },

  /**
   * Close given page in browser
   * 
   * @param {string} id
   * 
   * @returns {Promise}
   */
  async closeBrowser(id) {
    const { browser } = this.openedPages[id];

    delete this.openedPages[id];

    await browser.close();
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
   * @returns {Promise}
   */
  async resizeWindow(id, width, height) {
    const { page } = this.openedPages[id];

    await page.setViewport({ width, height });
  },

  /**
   * Take screenshot of given page in browser
   * @param {String} id
   * @param {String} screenshotPath
   * @returns {Promise}
   */
  async takeScreenshot(id, screenshotPath) {
    const { page } = this.openedPages[id];

    await page.screenshot({ path: screenshotPath });
  }
};
