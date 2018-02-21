'use strict';

const dot = require('dot-object');

/**
 * End2End component events
 */
const events = {};

events.$ = [
  'asset.e2e.skip',
  'asset.e2e.add',
  'assets.e2e.start',
  'assets.e2e.end',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
