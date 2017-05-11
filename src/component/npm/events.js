'use strict';

const dot = require('dot-object');
const events = {};

events.$ = [
  'npm.dependencies.install',
  'npm.cache.init',
  'npm.cache.purge',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;