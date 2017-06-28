'use strict';

const TextReporter = require('./text-reporter');
const snykConfig = require('snyk/lib/config');
const BufferedStream = require('./github/buffered-stream');
const Env = require('recink/src/helper/env');

/**
 * GitHub Snyk.io reporter
 */
class GitHubReporter extends TextReporter {
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
        const issuesVector = output.split(TextReporter.ISSUES_DELIMITER);
        
        return this._report(issuesVector);
      });
  }
  
  /**
   * @param {string[]} issuesVector
   *
   * @returns {Promise}
   *
   * @private
   */
  _report(issuesVector) {
    if (!Env.isTravis) {
      this.logger.warn(
        `${this.logger.emoji.poop}  Snyk.io GitHub reporter` +
        ` is currently supported only in Travis environment`
      );
      
      return Promise.resolve();
    }
    
    return Promise.resolve();
  }
}

module.exports = GitHubReporter;
