'use strict';

const AbstractReporter = require('./abstract-reporter');
const TextBlock = require('./helper/text-block');

/**
 * Text Google PageSpeed reporter
 */
class TextReporter extends AbstractReporter {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
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
    const info = Object.keys(data.ruleGroups).map(ruleGroup => {
      return this._chalk.gray.bold(`${ ruleGroup } SCORE: `) + 
        data.ruleGroups[ruleGroup].score;
    }).join('\n  ');
    
    let output = `\n  ${ info }\n`;
    
    output += this._chalk.gray.bold('  STATS:\n    ');
    output += `${ this._stats(data.pageStats).join('\n    ') }\n\n`;
    
    Object.keys(data.formattedResults.ruleResults).map(rule => {
      const ruleOutput = this._rule(
        data.formattedResults.ruleResults[rule]
      ).replace(/\n/g, '\n    ');
      
      output += `  ${ this.logger.emoji.fire } ${ ruleOutput }\n\n`;
    });
    
    return Promise.resolve(output);
  }
  
  /**
   * @param {*} data
   *
   * @returns {string}
   *
   * @private
   */
  _rule(data) {
    let output = this._chalk.red.bold(`${ data.localizedRuleName }:\n`);

    output += `  ${ this._chalk.white.bold('Impact:') } ${ data.ruleImpact }\n`;
    output += `  ${ this._chalk.white.bold('Groups:') } ${ data.groups.join(', ') }\n`;
    output += `  ${ this._chalk.white.bold('Summary:') } ${ this._text(data.summary) }`;
    
    if (Array.isArray(data.urlBlocks)) {
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
    
    return output;
  }
  
  /**
   * @param {*} stats
   *
   * @returns {string[]}
   *
   * @private
   */
  _stats(stats) {
    return Object.keys(stats).map(key => {
      let name;
      
      switch(key) {
        case 'numberResources':
          name = 'Total Assets';
          break;
        case 'numberHosts':
          name = 'Assets Hosts';
          break;
        case 'numberStaticResources':
          name = 'Static Assets';
          break;
        case 'numberJsResources':
          name = 'Javascript Assets';
          break;
        case 'numberCssResources':
          name = 'Css Assets';
          break;
        case 'totalRequestBytes':
          name = 'Metadata Transfered (in bytes)';
          break;
        case 'htmlResponseBytes':
          name = 'Html Content (in bytes)';
          break;
        case 'cssResponseBytes':
          name = 'Css Content (in bytes)';
          break;
        case 'imageResponseBytes':
          name = 'Image Content (in bytes)';
          break;
        case 'javascriptResponseBytes':
          name = 'Javascript Content (in bytes)';
          break;
        case 'otherResponseBytes':
          name = 'Other Content (in bytes)';
          break;
        default:
          name = key;
      }
      
      return `${ this._chalk.white.bold(name) }: ${ stats[key] }`;
    });
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
  _text(metedata) {
    return new TextBlock(metedata, this.logger).render();
  }
}

module.exports = TextReporter;
