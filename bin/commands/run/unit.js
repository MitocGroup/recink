'use strict';

const Jst = require('../../../src/jst');
const componentsFactory = require('../../../src/component/factory');
const path = require('path');
const availableComponents = require('./unit/components');

module.exports = (args, options, logger) => {
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
      const ComponentConstructor =  require(
        /^[a-z]/i.test(component) 
          ? component 
          : path.join(process.cwd(), component)
      );
      
      return new ComponentConstructor();
    }));

  return Promise.all([
    jst.components(...components),
    jst.configure(path.join(args.path, Jst.CONFIG_FILE_NAME))
  ]).then(() => jst.run());
};
