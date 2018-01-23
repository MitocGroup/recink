'use strict';

const path = require('path');
const resolvePackage = require('resolve-package');
const Recink = require('../../../src/recink');
const ComponentRegistry = require('../component/registry/registry');
const componentsFactory = require('../../../src/component/factory');
const { trimBoth } = require('../../../src/component/helper/utils');
const SequentialPromise = require('../../../src/component/helper/sequential-promise');
const ConfigBasedComponent = require('../../../src/component/config-based-component');
const dot = require('dot-object');
dot.overwrite = true;

module.exports = (args, options, logger) => {
  const recink = new Recink();

  let namespace = args.name;
  let disabledComponents = options.s;
  let additionalComponents = options.c;

  if (!Array.isArray(disabledComponents)) {
    disabledComponents = [ disabledComponents ].filter(Boolean);
  }

  if (!Array.isArray(additionalComponents)) {
    additionalComponents = [ additionalComponents ].filter(Boolean);
  }

  switch (namespace.toLowerCase()) {
    case 'e2e':
    case 'unit':
      namespace = namespace.toLowerCase();
      break;
    default:
      additionalComponents.push(namespace);
      namespace = 'generic';
  }

  const availableComponents = require(`./${namespace}/components`);
  const componentRegistry = ComponentRegistry.create(
    ComponentRegistry.DEFAULT_STORAGE_PATH,
    namespace.toLowerCase()
  );

  logger.debug(`Initialize components registry in ${componentRegistry.storage.registryFile}`);

  /**
   * @param {Array} modules
   * @param {Array} availableModules
   * @return {Array}
   */
  function cleanList(modules, availableModules) {
    return modules
      .map(key => key.trim())
      .filter(key => availableModules.includes(key.trim()));
  }

  /**
   * @param {Array} opts
   * @returns {Object}
   */
  function optionsToObject(opts) {
    let result = {};

    opts.map(key => key.trim()).forEach(item => {
      let [ property, value ] = item.split(':');
      let lowerCaseValue = value.trim().toLowerCase();

      result[property.trim()] = ['true', 'false'].includes(lowerCaseValue) ? (lowerCaseValue === 'true') : value.trim();
    });

    return result;
  }

  /**
   * Transform configuration
   * @param {Object} config
   * @return {Object}
   */
  function transformConfig(config) {
    let modules = Object.keys(config);
    let excludeModules = cleanList(options.excludeModules, modules);
    let includeModules = cleanList(options.includeModules, modules);

    if (includeModules.length) {
      excludeModules = modules
        .filter(key => key !== ConfigBasedComponent.MAIN_CONFIG_KEY)
        .filter(key => !includeModules.includes(key));
    }

    excludeModules.forEach(module => {
      dot.del(module, config);
    });

    let customConfig = optionsToObject(options.customConfig);
    for (let property in customConfig) {
      if (customConfig.hasOwnProperty(property)) {
        dot.str(property, customConfig[property], config);
      }
    }

    // @todo: refactor this code
    // move this code into recink-terraform component
    if (options.tfVersion || options.tfWorkspace || options.tfVarfiles) {
      for (let module in modules) {
        if (modules[module].terraform && options.tfVersion) {
          dot.str(`${modules[module]}.terraform.version`, options.tfVersion, config);
        }

        if (modules[module].terraform && options.tfWorkspace) {
          dot.str(`${modules[module]}.terraform.current_workspace`, trimBoth(options.tfWorkspace, '"'), config);
          if (config[modules[module]]['terraform']['available_workspaces']) {
            let availableWorkspaces = config[modules[module]]['terraform']['available_workspaces'];

            for (let property in availableWorkspaces[options.tfWorkspace]) {
              if (availableWorkspaces[options.tfWorkspace].hasOwnProperty(property)) {
                dot.str(`${modules[module]}.terraform.${property}`, availableWorkspaces[options.tfWorkspace][property], config);
              }
            }
          }
        }

        if (modules[module].terraform && options.tfVarfiles && options.tfVarfiles.length > 0) {
          dot.str(`${modules[module]}.terraform.var-files`, [], config);
          for (let property in options.tfVarfiles) {
            if (options.tfVarfiles.hasOwnProperty(property)) {
              dot.str(`${modules[module]}.terraform.var-files.${property}`, trimBoth(options.tfVarfiles[property], '"'), config);
            }
          }
        }

        if (modules[module].terraform && options.tfVars && options.tfVars.length > 0) {
          for (let property in options.tfVars) {
            if (options.tfVars.hasOwnProperty(property)) {
              dot.str(`${modules[module]}.terraform.vars.${property}`, trimBoth(options.tfVars[property], '"'), config);
            }
          }
        }
      }
    }

    // @todo: refactor this code
    // move this code into recink-terraform component
    /*if (options.tfVars) {
      let tfVars = optionsToObject(options.tfVars);
      for (let property in tfVars) {
        if (tfVars.hasOwnProperty(property)) {
          dot.str(`$.terraform.vars.${property}`, trimBoth(tfVars[property], '"'), config);
        }
      }
    }*/

    return Promise.resolve(config);
  }

  return componentRegistry.load()
    .then(() => {
      const additionalComponentsInstances = [];

      componentRegistry.listKeys()
        .map(component => {
          additionalComponents.push(component);
        });
      
      return SequentialPromise.all(additionalComponents.map(component => {
        return () => {
          let componentPromise;

          if (/^[a-z0-9]/i.test(component)) {
            let componentName = component;

            if (component.indexOf('recink') !== 0) {
              componentName = `recink-${ component }`;
            }

            componentPromise = resolvePackage(componentName);
          } else {
            componentPromise = Promise.resolve(path.resolve(
              process.cwd(),
              component
            ));
          }

          return componentPromise.then(componentPath => {

            if (!componentPath) {
              logger.warn(`${ logger.emoji.cross } Error initializing component ${ component }`);
              logger.error(new Error(`Unable to resolve path to ${ component } component`));

              return Promise.resolve();
            }

            try {
              const ComponentConstructor = require(componentPath);
              
              additionalComponentsInstances.push(new ComponentConstructor());
            } catch (error) {
              logger.warn(`${ logger.emoji.cross } Error initializing component ${ component }`);
              logger.error(error);
            }
              
            return Promise.resolve();
          });
        };
      })).then(() => {
        const components = availableComponents
          .filter(c => disabledComponents.indexOf(c) === -1)
          .map(c => componentsFactory[c]())
          .concat(additionalComponentsInstances);
          
        return Promise.resolve(components);
      });
    })
    .then(components => {
      const componentConfig = componentRegistry.configs;
      const configFilePath = path.join(args.path, Recink.CONFIG_FILE_NAME);

      if (componentConfig.length > 0) {
        logger.debug(`Loading component configurations - ${componentConfig.join(', ')}`);
      }

      return recink.configureExtend(configFilePath, ...componentConfig)
        .then(config => transformConfig(config))
        .then(config => {
          return Promise.all([
            recink.components(...components),
            recink.configLoad(config, configFilePath)
          ]);
        })
        .then(() => recink.run());
    });
};
