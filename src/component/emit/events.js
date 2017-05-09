'use strict';

const dot = require('dot-object');
const events = {};

events.$ = [
  'module.process.start',
  'module.process.end',
  'module.asset.emit',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;