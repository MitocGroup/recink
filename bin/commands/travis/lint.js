'use strict';

const lint = require('travis-lint');
const pify = require('pify');
const fs = require('fs');

module.exports = (args, options, logger) => {
  return pify(fs.readFile)(args.path)
    .then(content => pify(lint)(content))
    .then(warnings => {
      if (warnings.length <= 0) {
        logger.info(logger.emoji.check, `Valid Travis config`);
      } else {
        warnings.reverse().map(warning => {
          logger.warn(
            logger.emoji.cross, 
            `{${ warning.key.join('::') }} ${ warning.message }`
          );
        });
      }
    });
};
