'use strict';

const Registry = require('./registry/registry');
const columnify = require('columnify');

module.exports = (args, options, logger) => {
  const registry = Registry.create(
    Registry.DEFAULT_STORAGE_PATH,
    options.namespace.toLowerCase()
  );
  
  logger.debug(
    `Initialize components registry in ${ registry.storage.registryFile }`
  );
  
  return registry.load()
    .then(() => {
      if (registry.listKeys().length <= 0) {
        logger.info(
          `There are no registered components. In order to register ` +
          `a component run ${ logger.chalk.green('recink component add <component>') }`
        );
        
        return Promise.resolve();
      }
      
      logger.info(`${logger.emoji.gift} Registered components`);
      
      let data = {};
      
      registry.list().map(component => {
        const name = logger.chalk.green(`- ${ component.name }@${ component.version }`);
        const config = logger.chalk.gray(`${ component.configPath || '<NOCONFIG>' }`);
        
        data[name] = config;
      });
      
      const outputOptions = {
        showHeaders: false,
        truncate: false,
      };
      
      logger.info(columnify(data, outputOptions));
      
      return Promise.resolve();
    });
};
