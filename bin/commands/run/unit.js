'use strict';

const Jst = require('../../../src/index').Jst;
const componentsFactory = require('../../../src/component/factory');
const path = require('path');
const availableComponents = require('./unit/components');

module.exports = (args, options, logger) => {
  const jst = new Jst();
  
  const components = availableComponents
    .filter(c => (options.s || []).indexOf(c) === -1)
    .map(c => componentsFactory[c]());

  return Promise.all([
    jst.components(...components),
    jst.configure(path.join(args.path, Jst.CONFIG_FILE_NAME))
  ]).then(() => jst.run());
};
