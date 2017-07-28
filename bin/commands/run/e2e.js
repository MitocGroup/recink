'use strict';

const bootstrap = require('./bootstrap');
const availableComponents = require('./e2e/components');

module.exports = bootstrap('e2e', availableComponents);
