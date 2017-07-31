'use strict';

const AbstractReporter = require('./abstract-reporter');

/**
 * Summary PageSpeed reporter
 */
class SummaryReporter extends AbstractReporter {
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
    return 'summary';
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
    output += this._stats(data.pageStats).join('\n    ');
    
    return Promise.resolve(output);
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
}

module.exports = SummaryReporter;
