'use strict';

const dot = require('dot-object');

/**
 * Coverage component events
 */
const events = {};

events.$ = [
  'coverage.report.create',
  'coverage.report.compare',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
