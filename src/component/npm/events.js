'use strict';

const dot = require('dot-object');

/**
 * NPM component events
 */
const events = {};

events.$ = [
  'npm.dependencies.install',
  'npm.dependencies.postinstall',
  'npm.cache.init',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
