'use strict';

const ConfigBasedComponent = require('recink/src/component/config-based-component');
const pify = require('pify');
const GooglePageSpeedClient = require('./google-pagespeed-client');
const ReporterFactory = require('./reporter/factory');

/**
 * Google PageSpeed component
 */
class GooglePageSpeedComponent extends ConfigBasedComponent {  
  /**
   * @returns {string}
   */
  get name() {
    return 'google-pagespeed';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    const uris = this.container.get('uri', []);
    const client = new GooglePageSpeedClient();
    const options = {
      filter_third_party_resources: this.container.get('filter-third-party', true),
      locale: this.container.get('locale', 'en'),
      strategy: this.container.get('strategy', 'desktop'),
    };
    
    if (uris.length <= 0) {
      this.logger.info(
        `${ this.logger.emoji.poop } There are no URIs to be analyzed by Google PageSpeed`
      );
      
      return Promise.resolve();
    }
    
    return Promise.all(uris.map(uri => {
      return client.analyze(uri, options)
        .then(data => this._report(uri, data));
    })).then(reports => {      
      reports.map(report => {
        const uri = this.logger.chalk.gray.bold(report.uri);
        const output = report.output;
        
        process.stdout.write(
          `${ this.logger.emoji.star } Google PageSpeed report for ${ uri }\n${ output }\n\n`
        );
      });
      
      return Promise.resolve();
    });
  }
  
  /**
   * @param {*} data
   *
   * @returns {Promise}
   *
   * @private
   */
  _report(uri, data) {
    this.logger.debug(JSON.stringify(data, null, '  '));
    
    return ReporterFactory
      .text(this)
      .report(data)
      .then(output => Promise.resolve({ uri, output }));
  }
}

module.exports = GooglePageSpeedComponent;
