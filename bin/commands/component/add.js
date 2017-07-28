'use strict';

const Registry = require('./registry/registry');
const SequentialPromise = require('../../../src/component/helper/sequential-promise');

module.exports = (args, options, logger) => {
  if (args.name.length <= 0) {
    return Promise.reject(new Error('You must provide at least one component name.'));
  }
  
  const registry = Registry.create(
    Registry.DEFAULT_STORAGE_PATH,
    options.namespace.toLowerCase()
  );
  const components = args.name.map(name => {
    return (/^recink-/i.test(name) || options.skipPrefix) ? name : `recink-${ name }`;
  });
  
  logger.debug(
    `Initialize components registry in ${ registry.storage.registryFile }`
  );
  
  return registry.load()
    .then(() => {
      return SequentialPromise.all(components.map(component => {
        return () => {
          const opType = registry.exists(component) ? 'Updating': 'Adding';
          
          logger.info(`${logger.emoji.gift} ${ opType } "${ component }" component`);
          
          return registry.add(component);
        };
      }));
    })
    .then(() => registry.persist());
};
