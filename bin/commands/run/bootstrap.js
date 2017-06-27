'use strict';

const Jst = require('../../../src/jst');
const componentsFactory = require('../../../src/component/factory');
const path = require('path');
const requireHacker = require('require-hacker');
const fs = require('fs');

module.exports = availableComponents => {
  return (args, options, logger) => {
    const jst = new Jst();
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
            if (!/^run-jst/i.test(depPath)) {
              return;
            }
            
            const resolvedDepPath = path.join(
              __dirname,
              '../../..',
              path.dirname(depPath).replace(/^run-jst(.*\/.*)$/i, '$1'),
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
          /^[a-z]/i.test(component) 
            ? component 
            : path.join(process.cwd(), component)
        );
        
        hook.unmount();
        
        return new ComponentConstructor();
      }));

    return Promise.all([
      jst.components(...components),
      jst.configure(path.join(args.path, Jst.CONFIG_FILE_NAME))
    ]).then(() => jst.run());
  };
};
