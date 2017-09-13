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
  const template = path.join(TEMPLATES_BASEPATH, 'template/.recink.yml.twig');
  const templateTarget = path.join(target, `template/.recink.yml`);
  
  return Promise.all([
    [ packageJson, packageJsonTarget ],
    [ readme, readmeTarget ],
    [ component, componentTarget ],
    [ template, templateTarget ]
  ].map(metadata => {
    const [ source, target ] = metadata;
    
    return pify(Twig.renderFile)(source, { name })
      .then(content => fse.outputFile(target, content));
  }))
    .then(() => {
      logger.info(logger.chalk.green(
        `\n${ name.toUpperCase() }="John" recink run ${ target } ${ target }/template`
      ));
    
      return Promise.resolve();
    });
};
