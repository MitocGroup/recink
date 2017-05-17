'use strict';

const dot = require('dot-object');
const events = {};

events.$ = [
  'modules.process.start',
  'modules.process.end',
  'module.process.start',
  'module.process.end',
  'module.emit.asset',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;