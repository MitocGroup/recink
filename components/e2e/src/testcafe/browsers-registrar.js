'use strict';

const NightmareProvider = require('./nighmare-browser-provider');
const PuppeteerProvider = require('./puppeteer-browser-provider');
const testCafeBrowserProviderPool = require('testcafe/lib/browser/provider/pool');

module.exports = function register() {
  testCafeBrowserProviderPool.addProvider('nightmare', NightmareProvider);
  testCafeBrowserProviderPool.addProvider('puppeteer', PuppeteerProvider);
};
