'use strict';

const Provider = require('./nighmare-browser-provider');
const testCafeBrowserProviderPool = require('testcafe/lib/browser/provider/pool');

module.exports = function register() {
  testCafeBrowserProviderPool.addProvider('nightmare', Provider);
};
