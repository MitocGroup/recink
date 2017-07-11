'use strict';

const TextReporter = require('./text-reporter');
const BufferedStream = require('./github/buffered-stream');
const Env = require('recink/src/helper/env');
const github = require('octonode');
const pify = require('pify');

/**
 * GitHub Snyk.io reporter
 */
class GitHubReporter extends TextReporter {
  /**
   * @param {SnykComponent} component
   * @param {*} npmModule
   * @param {*} emitModule
   * @param {*} options
   */
  constructor(component, npmModule, emitModule, options = {}) {
    super(component, npmModule, emitModule);
    
    this._options = options;
  }
  
  /**
   * @returns {*}
   */
  get options() {
    return this._options;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'github';
  }
  
  /**
   * @param {*} result
   * @param {*} options
   *
   * @returns {Promise}
   */
  report(result, options) {
    const stream = new BufferedStream();
    
    this.disableColors().writeStream(stream);
    
    return super
      .report(result, options, false)
      .then(() => {
        const output = stream.buffer.toString('utf8');
        
        return this._report(output);
      });
  }
  
  /**
   * @returns {Pr}
   *
   * @private
   */
  get _ghpr() {
    return github.client(this.options.token || null).pr(
      Env.read('TRAVIS_PULL_REQUEST_SLUG'), 
      Env.read('TRAVIS_PULL_REQUEST')
    );
  }
  
  /**
   * @param {string} output
   *
   * @returns {Promise}
   *
   * @private
   */
  _report(output) {
    if (!Env.isTravis) {
      this.logger.warn(
        `${this.logger.emoji.poop} Snyk.io GitHub reporter` +
        ` is currently supported only in Travis environment.`
      );
      
      return Promise.resolve();
    } else if (!Env.read('TRAVIS_PULL_REQUEST_SLUG')) {
      this.logger.warn(
        `${this.logger.emoji.cross} Not a Pull Request.` +
        ` Skip submitting Snyk.io report to GitHub.`
      );
      
      return Promise.resolve();
    }
    
    const ghpr = this._ghpr;
    const body = 'The following issues found by [Snyk.io](https://snyk.io). ' +
      'You should fix them using the actionables bellow.' +
      TextReporter.ISSUES_DELIMITER + output;
    
    return this._createReview(ghpr, body)
      .then(() => {
        this.logger.info(
          `${this.logger.emoji.gift} Snyk.io report submitted to GitHub.`
        );
        
        return Promise.resolve();
      });
  }
  
  /**
   * @param {Pr} ghpr
   * @param {string} body
   *
   * @returns {Promise}
   * 
   * @private
   */
  _createReview(ghpr, body) {
    return pify(ghpr.createReview.bind(ghpr))({ body, event: 'REQUEST_CHANGES' })
      .catch(error => {
        if (error.statusCode === 404) {
          return Promise.reject(new Error(
            'Failed to submit Snyk.io report to GitHub. ' +
            'It seems the repository or PR does not exist or ' +
            'you don\'t have enough rights to access the repository.'
          ));
        }
        
        return Promise.reject(new Error(
          'Failed to submit Snyk.io report to GitHub. ' +
          `Failed with message "${ error.message }" and code "${ error.statusCode }"`
        ));
      });
  }
}

module.exports = GitHubReporter;
