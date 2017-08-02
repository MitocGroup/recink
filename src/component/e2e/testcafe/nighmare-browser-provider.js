'use strict';

const Nightmare = require('nightmare');
const debug = require('debug');

class NighmareBrowserProvider {
  constructor() {
    this._nightmare = null;
    this._openedPages = {};
  }

  /**
   * @return {Nightmare}
   */
  get nightmare() {
    return this._nightmare;
  }

  /**
   * @returns {*}
   */
  get openedPages() {
    return this._openedPages;
  }

  /**
   * @returns {boolean}
   */
  get isMultiBrowser() {
    return false;
  }

  /**
   * @param {string} id 
   * @param {string} pageUrl 
   * 
   * @returns {Promise}
   */
  openBrowser(id, pageUrl) {
    return this.nightmare.goto(pageUrl)
      .then(page => {
        this.openedPages[id] = page;

        return Promise.resolve();
      });
  }

  /**
   * @param {string} id 
   * 
   * @returns {Promise}
   */
  closeBrowser(id) {
    const page = this.openedPages[id];

    delete this.openedPages[id];

    return page.end();
  }

  /**
   * @returns {Promise}
   */
  init() {
    const config = {
      show: debug.enabled(),
      openDevTools: debug.enabled(),
      webPreferences: {
        partition: `partition-${ Date.now() }`,
      },
    };

    this._nightmare = Nightmare(config);

    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   */
  dispose() {
    return Promise.resolve();
  }

  /**
   * @param {string} id 
   * @param {number} width 
   * @param {number} height 
   * 
   * @returns {Promise}
   */
  resizeWindow(id, width, height) {
    return this.nightmare.viewport(width, height);
  }

  /**
   * @param {string} id 
   * @param {string} screenshotPath 
   * 
   * @returns {Promise}
   */
  takeScreenshot(id, screenshotPath) {
    return this.nightmare.screenshot(screenshotPath);
  }
}

module.exports = NighmareBrowserProvider;
