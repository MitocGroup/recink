'use strict';

const path = require('path');
const Dumper = require('./helper/dumper');

module.exports = (args, options, logger) => {
  
  // @todo configure it
  const configFile = '.travis.yml';
  
  return (new Dumper(
    path.join(__dirname, '../../templates', configFile),
    path.join(args.path, configFile),
    logger
  )).dump(options.overwrite);
};
