'use strict';

const dot = require('dot-object');

/**
 * REciNK main events
 */
const events = {};

events.$ = [
  'config.preprocess',
  'config.load',
  'components.load',
  'components.run',
  'component.load',
  'component.init',
  'component.run',
  'component.teardown',
  'component.ready',
  'component.subscribe',
].map(eventPath => {
  dot.str(eventPath, eventPath, events);
  
  return eventPath;
});

module.exports = events;
