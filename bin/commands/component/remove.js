'use strict';

const Registry = require('./registry/registry');
const SequentialPromise = require('../../../src/component/helper/sequential-promise');
const Component = require('./registry/component');

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
          if (!registry.exists(component)) {
            logger.info(
              `No such component "${ component }" registered. ` +
              `In order to register it run ${ logger.chalk.green(`recink component add ${ component }`) }`
            );
            
            return Promise.resolve();
          }
          
          logger.info(`${logger.emoji.gift} Removing "${ component }" component`);
          
          registry.remove(component);
          
          if (!options.purge) {
            return Promise.resolve();
          }
          
          return new Component(component).unload();
        };
      })).then(() => registry.persist());
    });
};
