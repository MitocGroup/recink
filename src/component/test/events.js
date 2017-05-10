'use strict';

const dot = require('dot-object');
const events = {};

events.$ = [
  'assets.test.end',
  'asset.test.start',
  'asset.test.end',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;