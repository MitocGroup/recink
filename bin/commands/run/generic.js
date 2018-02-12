'use strict';

const dot = require('dot-object');
const path = require('path');
const Recink = require('../../../src/recink');
const { trimBoth } = require('../../../src/helper/util');
const resolvePackage = require('resolve-package');
const ComponentRegistry = require('../component/registry/registry');
const componentsFactory = require('../../../src/component/factory');
const SequentialPromise = require('../../../src/component/helper/sequential-promise');
const ConfigBasedComponent = require('../../../src/component/config-based-component');

dot.overwrite = true;

module.exports = (args, options, logger) => {
  const recink = new Recink();

  let cfg = {};
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
   * Clean array and trim string elements
   * @param {Array} array
   * @returns {Array}
   * @private
   */
  function _arr(array) {
    return array
      .map(key => key.constructor === String ? key.trim() : key)
      .filter(key => key !== '' ? true : false);
  }

  /**
   * @param {Array} modules
   * @param {Array} availableModules
   * @return {Array}
   */
  function cleanList(modules, availableModules) {
    return _arr(modules).filter(key => availableModules.includes(key.trim()));
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
   * @param {String} parameter
   * @param {*} value
   * @param {String} root
   */
  function setTfParameter(parameter, value, root = '$') {
    dot.str(`${root}.terraform.${parameter}`, value.constructor === String ? trimBoth(value, '"') : value, cfg);
  }

  /**
   * Transform configuration
   * @param {Object} config
   * @return {Object}
   */
  function transformConfig(config) {
    cfg = config;
    let modules = Object.keys(cfg).filter(module => module !== ConfigBasedComponent.MAIN_CONFIG_KEY);
    let excludeModules = cleanList(options.excludeModules, modules);
    let includeModules = cleanList(options.includeModules, modules);

    if (includeModules.length) {
      excludeModules = modules.filter(key => !includeModules.includes(key));
    }

    excludeModules.forEach(module => {
      dot.del(module, cfg);
      modules.splice(modules.indexOf(module), 1);
    });

    /**
     * Returns true if --include-modules or --exclude-modules applied
     * @type {Boolean}
     */
    let filtered = !!excludeModules.length || !!includeModules.length;
    let workspaceEnabled = false;
    let tfModules = modules.filter(module => typeof dot.pick(`${module}.terraform`, cfg) !== 'undefined');

    tfModules.forEach(module => {
      let tfVars = optionsToObject(options.tfVars);
      let tfVarfiles = _arr(options.tfVarfiles);
      let tfWorkspace = options.tfWorkspace;
      let cfgKey = filtered ? module : ConfigBasedComponent.MAIN_CONFIG_KEY;

      if (options.tfVersion) {
        setTfParameter('version', options.tfVersion, cfgKey);
      }

      if (tfWorkspace) {
        setTfParameter('current-workspace', tfWorkspace, cfgKey);

        if (tfWorkspace !== 'default') {
          workspaceEnabled = true;
        }
      }

      if (tfVarfiles.length > 0) {
        let key = workspaceEnabled ? `available-workspaces.${tfWorkspace}.var-files` : 'var-files';
        setTfParameter(key, tfVarfiles, cfgKey);
      }

      for (let property in tfVars) {
        if (tfVars.hasOwnProperty(property)) {
          let key = workspaceEnabled ? `available-workspaces.${tfWorkspace}.vars` : 'vars';
          setTfParameter(`${key}.${property}`, tfVars[property], cfgKey);
        }
      }
    });

    let customConfig = optionsToObject(options.customConfig);
    for (let property in customConfig) {
      if (customConfig.hasOwnProperty(property)) {
        dot.str(property, customConfig[property], cfg);
      }
    }

    return Promise.resolve(cfg);
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
              logger.warn(logger.emoji.cross, `Error initializing component ${ component }`);
              logger.error(new Error(`Unable to resolve path to ${ component } component`));

              return Promise.resolve();
            }

            try {
              const ComponentConstructor = require(componentPath);
              
              additionalComponentsInstances.push(new ComponentConstructor());
            } catch (error) {
              logger.warn(logger.emoji.cross, `Error initializing component ${ component }`);
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
        .then(() => {
          return Promise.all([
            recink.components(...components),
            recink.configLoad(cfg, configFilePath)
          ]);
        })
        .then(() => recink.run());
    });
};
