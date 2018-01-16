'use strict';

const dot = require('dot-object');

/**
 * Test component events
 */
const events = {};

events.$ = [
  'assets.test.end',
  'asset.test.skip',
  'asset.test.add',
  'asset.tests.start',
  'asset.tests.end',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
