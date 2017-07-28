'use strict';

const bootstrap = require('./bootstrap');
const availableComponents = require('./unit/components');

module.exports = bootstrap('unit', availableComponents);
