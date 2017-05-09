'use strict';

const Deepstiny = require('../../../src/index').Deepstiny;
const components = require('../../../src/component/factory');
const path = require('path');

module.exports = (args, options, logger) => {
  const dps = new Deepstiny();

  return Promise.all([
    dps.components(
      components.test(), 
      components.coverage(),
      components.cache(),
      components.emit()
    ),
    dps.configure(path.join(args.path, Deepstiny.CONFIG_FILE_NAME))
  ]).then(() => dps.run());
};
