'use strict';

const SummaryReporter = require('./summary-reporter');
const TextBlock = require('./helper/text-block');

/**
 * Text PageSpeed reporter
 */
class TextReporter extends SummaryReporter {
  /**
   * @param {PageSpeedComponent} component 
   * @param {*} options 
   */
  constructor(component, options = {}) {
    super(component);

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
    return 'text';
  }
  
  /**
   * @param {*} data
   *
   * @returns {Promise}
   */
  report(data) {
    return super.report(data)
      .then(output => {
        Object.keys(data.formattedResults.ruleResults).map(rule => {
          const ruleOutput = this._rule(data.formattedResults.ruleResults[rule]);

          if (ruleOutput) {
            output += `\n\n  ${ this.logger.emoji.fire } ${ ruleOutput.replace(/\n/g, '\n    ') }`;
          }
        });
        
        return Promise.resolve(output);
      });
  }
  
  /**
   * @param {*} data
   *
   * @returns {string}
   *
   * @private
   */
  _rule(data) {
    if (data.ruleImpact <= 0) {
      return null;
    }

    let output = this._chalk.red.bold(`${ data.localizedRuleName }:\n`);

    output += `  ${ this._chalk.white.bold('Impact:') } ${ data.ruleImpact }\n`;
    output += `  ${ this._chalk.white.bold('Groups:') } ${ data.groups.join(', ') }\n`;
    output += `  ${ this._chalk.white.bold('Summary:') } ${ this._text(data.summary) }`;
    
    if (!this.options.minimal && Array.isArray(data.urlBlocks)) {
      output += `\n  ${ this._chalk.white.bold('Advices:') }\n    `;
      output += data.urlBlocks.map(urlBlock => {
        return this._urlBlock(urlBlock)
          .replace(/\n/g, '\n    ');
      }).join('\n    ');
    }
    
    return output;
  }
  
  /**
   * @param {*} data
   *
   * @returns {string}
   *
   * @private
   */
  _urlBlock(data) {
    let output = this._chalk.yellow.bold(`${ this.logger.emoji.banana } ${ this._text(data.header) }`);
    
    if (Array.isArray(data.urls)) {
      output += '\n  - ' + data.urls.map(data => {
        return this._text(data.result);
      }).join('\n  - ');
    }
    
    return output;
  }
  
  /**
   * @returns {chalk}
   *
   * @private
   */
  get _chalk() {
    return this.logger.chalk;
  }
  
  /**
   * @param {*} metadata
   *
   * @returns {string}
   *
   * @private
   */
  _text(metadata) {
    return new TextBlock(metadata, this.logger).render();
  }
}

module.exports = TextReporter;
