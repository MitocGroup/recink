'use strict';

const chalk = require('chalk');
const ConfigBasedComponent = require('./config-based-component');

/**
 * Abstract dependency aware component
 */
class DependencyBasedComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }
  
  /**
   * @returns {string[]}
   */
  get dependencies() {
    return [];
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {Promise}
   */
  waitConfig(emitter) {
    return super.waitConfig(emitter).then(container => {
      if (container) {
        if (this.dependencies.length <= 0) {
          return Promise.resolve(container);
        }

        const waitComponents = this.dependencies.map(name => {
          const component = emitter.component(name);

          if (!component) {
            return Promise.resolve({ name, isActive: false });
          }

          return component.ready().then(() => Promise.resolve(component));
        });

        return Promise.all(waitComponents).then(components => {
          let failedComponents = [];

          components.map(component => {
            if (!component.isActive) {
              failedComponents.push(component.name);
            }
          });

          if (failedComponents.length > 0) {
            const failedInfo = failedComponents.map(c => chalk.red(c)).join(', ');

            this.setActive(false);
            this.logger.info(`${ this.logger.emoji.fire } ${ this.name } ~ ${ failedInfo }`);
          }

          return Promise.resolve(failedComponents.length <= 0 ? container : null);
        });
      }

      return Promise.resolve(null);
    });
  }
}

module.exports = DependentConfigBasedComponent;
