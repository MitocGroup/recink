'use strict';

const ConfigBasedComponent = require('recink/src/component/config-based-component');
const PageSpeedClient = require('./pagespeed-client');
const ReporterFactory = require('./reporter/factory');
const StorageFactory = require('recink/src/component/coverage/factory');
const url = require('url');

/**
 * PageSpeed component
 */
class PageSpeedComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._storage = null;
    this._reports = [];
  }

  /**
   * @returns {AbstractDriver}
   *
   * @private
   */
  get _comparatorStorage() {
    if (this._storage) {
      return this._storage;
    }
    
    const driver = this.container.get('compare.storage.driver', 'volatile');
    const options = this.container.get('compare.storage.options', []);
    
    this._storage = StorageFactory.create(driver, ...options);
    
    return this._storage;
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
   * @param {string} uri 
   * @param {*} data 
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _doCompare(uri, data) {
    const allowedDelta = Math.abs(parseFloat(
      this.container.get('compare.negative-delta', 100)
    ));
    
    if (!allowedDelta || allowedDelta >= 100) {
      return Promise.resolve();
    }
    
    const scoreFile = this._scoreFile(uri);
    const storage = this._comparatorStorage;

    if (storage.constructor.name === 'VolatileDriver') {
      this.logger.debug(
        `Pagespeed Score stored in ${ storage._storageFile(scoreFile) }`
      );
    }

    return storage.read(scoreFile)
      .then(score => {
        const coloredUri = this.logger.chalk.gray.bold(uri);
        const newScore = {};

        Object.keys(data.ruleGroups).map(ruleGroup => {
          newScore[ruleGroup] = data.ruleGroups[ruleGroup].score;
        });
        
        if (!score) {
          this.logger.info(
            this.logger.emoji.bicycle,
            `No previous Pagespeed Score saved for ${ coloredUri }`
          );
          
          return storage.write(
            scoreFile, 
            newScore
          );
        }
        
        const delta = this._calculateDelta(score, newScore);
        
        if (delta > allowedDelta) {          
          return Promise.reject(new Error(
            `Pagespeed Score delta decreased ${ delta.toFixed(2) } > ${ allowedDelta.toFixed(2) } on ${ coloredUri }`
          ));
        }
        
        this.logger.info(
          this.logger.emoji.bicycle,
          `Pagespeed Score delta checked ${ delta.toFixed(2) } >= ${ allowedDelta.toFixed(2) } on ${ coloredUri }`
        );
        
        return storage.write(
          scoreFile, 
          newScore
        );
      });
  }

  /**
   * @param {*} score
   * @param {*} newScore
   *
   * @returns {number}
   *
   * @private
   */
  _calculateDelta(score, newScore) {
    const groups = Object.keys(score);
    
    return groups.reduce((accumulator, group) => {
      return accumulator + 
        parseFloat(score[group]) - 
        parseFloat((newScore[group] || 0));
    }, 0) / groups.length;
  }

  /**
   * @param {string} uri 
   * 
   * @returns {string}
   * 
   * @private
   */
  _scoreFile(uri) {
    const urlObj = url.parse(uri);
    const path = urlObj.pathname.replace(/\//g, '_');
    const prefix = `${ urlObj.host }_${ path }`
      .replace(/_+/g, '_')
      .replace(/((^_)|(_$))/g, '');

    return `${ prefix }|${ PageSpeedComponent.PAGESPEED_FILE }`;
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    if (this._reports.length <= 0) {
      return Promise.resolve();
    }
    
    return Promise.all(this._reports.map(report => {
      const { uri, output, data } = report;

      const coloredUri = this.logger.chalk.gray.bold(uri);
      
      process.stdout.write(
        `${ this.logger.emoji.star } PageSpeed report for ${ coloredUri }\n${ output }\n\n`
      );

      return this._doCompare(uri, data);
    }));
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
      .then(output => Promise.resolve({ uri, output, data }));
  }

  /**
   * @returns {string}
   */
  static get PAGESPEED_FILE() {
    return 'pagespeed.json';
  }
}

module.exports = PageSpeedComponent;
