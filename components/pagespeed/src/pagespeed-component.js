'use strict';

const ConfigBasedComponent = require('recink/src/component/config-based-component');
const PageSpeedClient = require('./pagespeed-client');
const ReporterFactory = require('./reporter/factory');

/**
 * PageSpeed component
 */
class PageSpeedComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._reports = [];
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'pagespeed';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    const uris = this.container.get('uri', []);
    const client = new PageSpeedClient();
    const options = {
      filter_third_party_resources: this.container.get('filter-third-party', true),
      locale: this.container.get('locale', 'en'),
      strategy: this.container.get('strategy', 'desktop'),
    };
    
    if (uris.length <= 0) {
      this.logger.info(
        `${ this.logger.emoji.poop } There are no URIs to be analyzed by PageSpeed`
      );
      
      return Promise.resolve();
    }
    
    return Promise.all(uris.map(uri => {
      return client.analyze(uri, options)
        .then(data => this._report(uri, data));
    })).then(reports => {      
      this._reports = reports;
      
      return Promise.resolve();
    });
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    this._reports.map(report => {
      const uri = this.logger.chalk.gray.bold(report.uri);
      const output = report.output;
      
      process.stdout.write(
        `${ this.logger.emoji.star } PageSpeed report for ${ uri }\n${ output }\n\n`
      );
    });
    
    return Promise.resolve();
  }
  
  /**
   * @param {string} uri
   * @param {*} data
   *
   * @returns {Promise}
   *
   * @private
   */
  _report(uri, data) {
    this.logger.debug(JSON.stringify(data, null, '  '));
    
    const reporters = this.container.get('reporters', { text: [ { minimal: true } ] });
    const multiReporter = ReporterFactory.multi(this);
    
    Object.keys(reporters).map(name => {
      const args = [ this ].concat(reporters[name] || []);
      const reporter = ReporterFactory.create(name, ...args);
      
      multiReporter.add(reporter);
    });
    
    return multiReporter.report(data)
      .then(output => Promise.resolve({ uri, output }));
  }
}

module.exports = PageSpeedComponent;
