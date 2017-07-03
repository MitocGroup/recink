'use strict';

const Registry = require('./registry/registry');

module.exports = (args, options, logger) => {
  const registry = Registry.create();
  
  logger.debug(`Initialize components registry in ${ registry.storage.path }`);
  
  return registry.load()
    .then(() => {
      if (registry.listKeys().length <= 0) {
        logger.info(
          `There are no registered components. In order to register ` +
          `a component run ${ logger.chalk.green('recink add <component>') }`
        );
        
        return Promise.resolve();
      }
      
      logger.info(`${logger.emoji.gift} Registered components`);
      
      registry.list().map(component => {
        const output = logger.chalk.yellow(`\t${ component.name }@${ component.version }`) + 
          logger.chalk.gray(`\t${ component.configPath || '<NOCONFIG>' }`);
        
        logger.info(output);
      });
      
      return Promise.resolve();
    });
};
