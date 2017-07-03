'use strict';

const ReCInk = require('../../../src/recink');
const componentsFactory = require('../../../src/component/factory');
const path = require('path');
const requireHacker = require('require-hacker');
const fs = require('fs');
const ComponentRegistry = require('../component/registry/registry');

module.exports = availableComponents => {
  return (args, options, logger) => {
    const recink = new ReCInk();
    let disabledComponents = options.s;
    let additionalComponents = options.c;
    
    if (!Array.isArray(disabledComponents)) {
      disabledComponents = [ disabledComponents ].filter(Boolean);
    }
    
    if (!Array.isArray(additionalComponents)) {
      additionalComponents = [ additionalComponents ].filter(Boolean);
    }
    
    const componentRegistry = ComponentRegistry.create();
    
    logger.debug(`Initialize components registry in ${ componentRegistry.storage.path }`);

    return componentRegistry.load()
      .then(() => {
        componentRegistry.listKeys()
          .map(component => {
            additionalComponents.push(component);
          });
        
        const components = availableComponents
          .filter(c => disabledComponents.indexOf(c) === -1)
          .map(c => componentsFactory[c]())
          .concat(additionalComponents.map(component => {
            const hook = requireHacker.global_hook(
              'js', 
              depPath => {
                if (!/^recink/i.test(depPath)) {
                  return;
                }
                
                const resolvedDepPath = path.join(
                  __dirname,
                  '../../..',
                  path.dirname(depPath).replace(/^recink(.*\/.*)$/i, '$1'),
                  path.basename(depPath, '.js') + '.js'
                );
                
                if (!fs.existsSync(resolvedDepPath)) {
                  return;
                }
                
                return {
                  source: fs.readFileSync(resolvedDepPath).toString(),
                  path: resolvedDepPath,
                };
              }
            );
            
            const requirePath = /^recink-/i.test(component) 
              ? component 
              : path.resolve(process.cwd(), component);
            
            try {
              const ComponentConstructor =  require(requirePath);
              const componentInstance =  new ComponentConstructor();
              
              hook.unmount();
              
              return componentInstance;
            } catch (error) {
              if (error.code === 'MODULE_NOT_FOUND') {
                logger.warn(
                  logger.chalk.red(`Missing "${ component }" component module -`),
                  logger.chalk.gray(`require('${ requirePath }')`)
                );
              }
              
              hook.unmount();
            }
            
            return null;
          }))
          .filter(Boolean);
        
        const componentConfig = componentRegistry.configs;
        
        if (componentConfig.length > 0) {
          logger.debug(`Loading component configurations - ${ componentConfig.join(', ') }`);
        }
        
        return Promise.all([
          recink.components(...components),
          recink.configureExtend(
            path.join(args.path, ReCInk.CONFIG_FILE_NAME),
            ...componentConfig
          )
        ])
        .then(() => recink.run());
      });
  };
};
