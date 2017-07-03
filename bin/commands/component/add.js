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
      const opType = registry.exists(component) ? 'Updating': 'Adding';
      
      logger.info(
        `${logger.emoji.gift} ${ opType } "${ component }" component to registry`
      );
      
      return registry.add(component);
    })
    .then(() => registry.persist());
};
