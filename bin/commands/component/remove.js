'use strict';

const Registry = require('./registry/registry');

module.exports = (args, options, logger) => {
  if (!args.name) {
    return Promise.reject(new Error('You must provide component name.'));
  }
  
  const component = args.name;
  const registry = Registry.create();
  
  logger.debug(`Initialize components registry in ${ registry.storage.path }`);
  
  return registry.load()
    .then(() => {
      if (!registry.exists(component)) {
        return Promise.reject(new Error(
          `No such component "${ component }" registered. ` +
          `In order to register it run ${ logger.chalk.green(`recink add ${ component }`) }`
        ));
      }
      
      logger.info(`${logger.emoji.gift} Removing "${ component }" component`);
      
      return registry.remove(component).persist();
    });
};
