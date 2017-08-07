'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const npmEvents = require('recink/src/component/npm/events');
const snykUserConfig = require('snyk/lib/user-config');
const snykTest = require('snyk/cli/commands/test');
const ReporterFactory = require('./reporter/factory');

/**
 * Snyk.io component
 */
class SnykComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._modules = [];
  }
  
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
    emitter.on(npmEvents.npm.dependencies.postinstall, (npmModule, emitModule) => {
      this._modules.push([ npmModule, emitModule ]);
    });
    
    return Promise.resolve();
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    if (!this.isActive) {
      return Promise.resolve();
    }
    
    const token = this.container.get('token', '');
    const dev = this.container.get('dev', false);
    const actionable = this.container.get('actionable', true);
    const options = {
      dev, json: true,
      'show-vulnerable-paths': actionable ? 'true' : 'false',
    };
    
    snykUserConfig.set('api', token);
    
    return Promise.all(
      this._modules.map(args => {
        const [ npmModule, emitModule ] = args;
        
        return snykTest(npmModule.rootDir, options)
          .then(result => this._createReport(npmModule, emitModule, result, options))
          .catch(error => this._createReport(npmModule, emitModule, error, options))
      })
    );
  }
  
  /**
   * @param {*} result
   *
   * @returns {Promise}
   *
   * @private
   */
  _handleFail(result) {
    const enabled = this.container.get('fail.enabled', false);
    const minSeverity = this.container.get('fail.severity', 'medium');
    const minSeverityInt = this._severityInt(minSeverity);
    
    if (!enabled) {
      return Promise.resolve();
    }
    
    const reportedVulns = {};
    const issues = (result.vulnerabilities || [])
      .map(vuln => {
        if (reportedVulns[vuln.id]) {
          vuln.severityInt = -1;
          
          return vuln;
        }
        
        reportedVulns[vuln.id] = true;
        
        vuln.severityInt = this._severityInt(vuln.severity);
        
        return vuln;
      })
      .filter(vuln => vuln.severityInt >= minSeverityInt);
    
    if (issues.length <= 0) {
      return Promise.resolve();
    }
    
    return Promise.reject(new Error(
      `Snyk.io detected at least ${ issues.length } issues of ${ minSeverity } or higher severity.`
    ));
  }
  
  /**
   * @param {string} severity
   *
   * @returns {number}
   *
   * @private
   */
  _severityInt(severity) {
    let severityInt;
    
    switch(severity) {
      case 'high':
        severityInt = 3;
        break;
      case 'medium':
        severityInt = 2;
        break;
      case 'low':
        severityInt = 1;
        break;
      default:
        severityInt = 2;
    }
    
    return severityInt;
  }
  
  /**
   * @param {*} npmModule
   * @param {*} emitModule
   * @param {string|Error} result
   * @param {*} options
   *
   * @returns {Promise}
   * 
   * @private
   */
  _createReport(npmModule, emitModule, result, options) {
    if (result && typeof result === 'object' && result instanceof Error) {
      if (/package\.json\sis\snot\sa\snode\sproject/i.test(result.message)) {
        this.logger.info(
          this.logger.emoji.cross,
          `Skipping Snyk.io analyze ${ npmModule.rootDir }. Not a node project.`
        );

        return Promise.resolve();
      }

      try {
        result = JSON.parse(result.message);
      } catch (error) {
        if (result.code === 'NO_API_TOKEN') {
          return Promise.reject(new Error('Missing Snyk.io API token.'));
        } else if (result.code === 401) {
          return Promise.reject(new Error('Snyk.io API token is invalid.'));
        }
        
        return Promise.reject(result);
      }
    } else {
      result = JSON.parse(result);
    }
    
    this.logger.debug(JSON.stringify(result, null, '  '));
    
    const reporters = this.container.get('reporters', { text: null });
    const multiReporter = ReporterFactory.multi(this, npmModule, emitModule);
    
    Object.keys(reporters).map(name => {
      const args = [ this, npmModule, emitModule ].concat(reporters[name] || []);
      const reporter = ReporterFactory.create(name, ...args);
      
      multiReporter.add(reporter);
    });
    
    return multiReporter.report(result, options)
      .then(() => this._handleFail(result));
  }
}

module.exports = SnykComponent;
