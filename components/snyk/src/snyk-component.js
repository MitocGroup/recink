'use strict';

const DependantConfigBasedComponent = require('run-jst/src/component/dependant-config-based-component');
const emitEvents = require('run-jst/src/component/emit/events');
const npmEvents = require('run-jst/src/component/npm/events');
const snykConfig = require('snyk/lib/user-config');
const snykTest = require('snyk/cli/commands/test');

/**
 * Snyk.io component
 */
class SnykComponent extends DependantConfigBasedComponent {  
  /**
   * @returns {string}
   */
  get name() {
    return 'snyk';
  }
  
  /**
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'npm' ];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      const promises = [];
      const token = this.container.get('token', '');
      const org = this.container.get('org', null);
      const json = this.container.get('output-json', false);
      const showPaths = this.container.get('show-vulnerable-paths', true);
      
      snykConfig.set('api', token);
      snykConfig.set('org', org);
      
      emitter.on(npmEvents.npm.dependencies.postinstall, npmModule => {
        promises.push(snykTest(npmModule.rootDir, {
          json,
          'show-vulnerable-paths': showPaths ? 'true' : 'false',
        }));
      });
      
      emitter.on(emitEvents.modules.process.end, () => {
        Promise.all(promises)
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }
}

module.exports = SnykComponent;
