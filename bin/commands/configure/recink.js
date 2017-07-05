'use strict';

const path = require('path');
const Dumper = require('./helper/dumper');
const Recink = require('../../../src/recink');

module.exports = (args, options, logger) => {
  const configFile = Recink.CONFIG_FILE_NAME;
  
  return (new Dumper(
    path.join(__dirname, '../../templates', configFile),
    path.join(args.path, configFile),
    logger
  )).dump(options.overwrite);
};
