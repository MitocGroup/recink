'use strict';

const dot = require('dot-object');

/**
 * Cache component events
 */
const events = {};

events.$ = [
  'cache.progress',
  'cache.upload.progress',
  'cache.download.progress',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
