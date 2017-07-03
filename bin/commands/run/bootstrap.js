'use strict';

const ReCInk = require('../../../src/recink');
const componentsFactory = require('../../../src/component/factory');
const path = require('path');
const requireHacker = require('require-hacker');
const fs = require('fs');

module.exports = availableComponents => {
  return (args, options, logger) => {
    const recink = new ReCInk();
    let disabledComponents = options.s;
    let additionalComponents = options.c;
    
    if (!Array.isArray(disabledComponents)) {
      disabledComponents = [ disabledComponents ].filter(c => !!c);
    }
    
    if (!Array.isArray(additionalComponents)) {
      additionalComponents = [ additionalComponents ].filter(c => !!c);
    }
    
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
        
        const ComponentConstructor =  require(
          /^recink-/i.test(component) 
            ? component 
            : path.resolve(process.cwd(), component)
        );
        
        const componentInstance =  new ComponentConstructor();
        
        hook.unmount();
        
        return componentInstance;
      }));

    return Promise.all([
      recink.components(...components),
      recink.configureExtend(path.join(args.path, ReCInk.CONFIG_FILE_NAME))
    ])
    .then(() => recink.run());
  };
};
