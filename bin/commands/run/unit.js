'use strict';

const Deepstiny = require('../../../src/index').Deepstiny;
const componentsFactory = require('../../../src/component/factory');
const path = require('path');

module.exports = (args, options, logger) => {
  const dps = new Deepstiny();
  
  const components = [ 'preprocess', 'test', 'coverage', 'cache', 'emit', 'npm', ]
    .filter(c => (options.s || []).indexOf(c) === -1)
    .map(c => componentsFactory[c]());

  return Promise.all([
    dps.components(...components),
    dps.configure(path.join(args.path, Deepstiny.CONFIG_FILE_NAME))
  ]).then(() => dps.run());
};
