'use strict';

const Twig  = require('twig');
const path = require('path');
const pify = require('pify');
const fse = require('fs-extra');

const TEMPLATES_BASEPATH = path.join(__dirname, '../../templates/component');

module.exports = (args, options, logger) => {
  if (!options.name) {
    return Promise.reject(new Error('You must provide component name.'));
  }
  
  const name = options.name;
  const target = path.join(args.path, name);
  const packageJson = path.join(TEMPLATES_BASEPATH, 'package.json.twig');
  const packageJsonTarget = path.join(target, 'package.json');
  const readme = path.join(TEMPLATES_BASEPATH, 'README.md.twig');
  const readmeTarget = path.join(target, 'README.md');
  const component = path.join(TEMPLATES_BASEPATH, 'src/component.js.twig');
  const componentTarget = path.join(target, `src/${ name.toLowerCase() }-component.js`);
  const example = path.join(TEMPLATES_BASEPATH, 'example/.recink.yml.twig');
  const exampleTarget = path.join(target, `example/.recink.yml`);
  
  return Promise.all([
    [ packageJson, packageJsonTarget ],
    [ readme, readmeTarget ],
    [ component, componentTarget ],
    [ example, exampleTarget ]
  ].map(metadata => {
    const [ source, target ] = metadata;
    
    return pify(Twig.renderFile)(source, { name })
      .then(content => pify(fse.outputFile)(target, content));
  }))
  .then(() => {
    logger.info(logger.chalk.green(
      `\n${ name.toUpperCase() }="John" recink run unit ${ target }/example -c ${ target }`
    ));
    
    return Promise.resolve();
  });
};
