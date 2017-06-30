'use strict';

const AbstractReporter = require('./abstract-reporter');
const snykConfig = require('snyk/lib/config');

/**
 * Text Snyk.io reporter
 */
class TextReporter extends AbstractReporter {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._colors = true;
    this._stream = process.stdout;
  }
  
  /**
   * @param {stream.Writable} stream
   *
   * @returns {TextReporter}
   */
  writeStream(stream) {
    this._stream = stream;
    
    return this;
  }
  
  /**
   * @returns {stream.Writable}
   */
  get stream() {
    return this._stream;
  }
  
  /**
   * @returns {TextReporter}
   */
  disableColors() {
    this._colors = false;
    
    return this;
  }
  
  /**
   * @returns {TextReporter}
   */
  enableColors() {
    this._colors = true;
    
    return this;
  }
  
  /**
   * @returns {boolean}
   */
  get colors() {
    return this._colors;
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'text';
  }
  
  /**
   * @param {*} result
   * @param {*} options
   * @param {boolean} _info
   *
   * @returns {Promise}
   */
  report(result, options, _info = true) {
    const blueUnderline = this.colors ? this.logger.chalk.blue.underline : (t => t);
    const gray = this.colors ? this.logger.chalk.gray : (t => t);
    const grayBold = this.colors ? this.logger.chalk.gray.bold : (t => t);
    const red = this.colors ? this.logger.chalk.red : (t => t);
    const redBold = this.colors ? this.logger.chalk.red.bold : (t => t);
    const yellowBold = this.colors ? this.logger.chalk.yellow.bold : (t => t);
    const greenBold = this.colors ? this.logger.chalk.green.bold : (t => t);
    const npmModule = this.npmModule;
    const emitModule = this.emitModule;
    const moduleInfo = gray(`${ grayBold(emitModule.name) }:${ npmModule.packageFileRelative }`);
    const pm = result.packageManager;
    const deps = result.dependencyCount || 0;
    const badge = (result.ok && result.vulnerabilities.length <= 0)
      ? this.logger.emoji.check 
      : this.logger.emoji.cross;
    
    if (_info) {
      this.logger.info(
        `${ badge } Snyk.io processed ${ deps } ${ pm } dependencies - ${ moduleInfo }`
      );
    }
    
    const showVulnPaths = options['show-vulnerable-paths'] === 'true';
    const reportedVulns = {};
    
    const vulnerabilities = result.vulnerabilities.map(vuln => {
      if (showVulnPaths && reportedVulns[vuln.id]) {
        return;
      }
      
      reportedVulns[vuln.id] = true;

      let res = '';
      let badge = '';
      const name = `${ vuln.name }@${ vuln.version }`;
      const severity = vuln.severity[0].toUpperCase() + vuln.severity.slice(1);
      const issue = vuln.type === 'license' ? 'issue' : 'vulnerability';
      
      switch(vuln.severity) {
        case 'high':
          badge = this.logger.emoji.moon_empty;
          break;
        case 'medium':
          badge = this.logger.emoji.moon_half;
          break;
        case 'low':
          badge = this.logger.emoji.moon_full;
          break;
      }
      
      res += badge;
      res += red(` ${ severity } severity ${ issue } found on `);
      res += grayBold(`${ name }\n`);
      res += `   ${ gray('description:') } ${ vuln.title }\n`;
      res += `   ${ gray('info:') } `;
      res += blueUnderline(`${ snykConfig.ROOT }/vuln/${ vuln.id }\n`);
      
      if (showVulnPaths) {
        res += `   ${ gray('package:') } ${ vuln.from.join(' > ') }\n`;
      }

      if (vuln.note) {
        res += `   ${ gray('note:') } ${ vuln.note }\n`;
      }

      // none of the output past this point is relevant if we're not displaying
      // vulnerable paths
      if (!showVulnPaths) {
        return res.trim();
      }

      const upgradeSteps = (vuln.upgradePath || []).filter(Boolean);

      // Remediation instructions (if we have one)
      if (upgradeSteps.length) {

        // Create upgrade text
        let upgradeText = upgradeSteps.shift();
        
        upgradeText += upgradeSteps.length 
          ? ` (triggers upgrades to ${ upgradeSteps.join(' > ') })` 
          : '';

        let fix = '';
        
        for (let idx = 0; idx < vuln.upgradePath.length; idx++) {
          const elem = vuln.upgradePath[idx];

          if (elem) {
            
            // Check if we're suggesting to upgrade to ourselves.
            if (vuln.from.length > idx && vuln.from[idx] === elem) {
              
              // This ver should get the not-vuln dependency, suggest refresh
              fix += `Your dependencies are out of date, otherwise you would` +
                ` be using a newer ${ vuln.name } than ${ name }.\n`;
              break;
            }
            if (idx === 0) {
              
              // This is an outdated version of yourself
              fix += `You've tested an outdated version of the project. Should be upgraded to ${ upgradeText }`;
            } else if (idx === 1) {
              
              // A direct dependency needs upgrade. Nothing to add.
              fix += `Upgrade direct dependency ${ vuln.from[idx] } to ${ upgradeText }`;
            } else {
              
              // A deep dependency needs to be upgraded
              res += `   ${ gray('actionable:') } `;
              res += yellowBold('No direct dependency upgrade can address this issue.\n');
            }
            break;
          }
        }
        
        if (fix.length > 0) {
          res += `   ${ gray('actionable:') } ${ greenBold(fix) }`;
        }
      } else {
        if (vuln.type === 'license') {
          
          // do not display fix (there isn't any), remove newline
          res = res.slice(0, -1);
        } else if (pm === 'npm') {
          res += `   ${ gray('actionable:') } `;
          res += redBold(
            'No fix available. Consider removing this dependency.'
          );
        }
      }
      
      return res;
    }).filter(Boolean).join(TextReporter.ISSUES_DELIMITER);
    
    this.stream.write(`${ vulnerabilities }\n\n`);
    
    return Promise.resolve();
  }
  
  /**
   * @returns {string}
   */
  static get ISSUES_DELIMITER() {
    return '\n\n';
  }
}

module.exports = TextReporter;
