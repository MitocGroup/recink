'use strict';

const DependantConfigBasedComponent = require('run-jst/src/component/dependant-config-based-component');
const emitEvents = require('run-jst/src/component/emit/events');
const npmEvents = require('run-jst/src/component/npm/events');
const snykUserConfig = require('snyk/lib/user-config');
const snykTest = require('snyk/cli/commands/test');
const snykConfig = require('snyk/lib/config');

/**
 * Snyk.io component
 */
class SnykComponent extends DependantConfigBasedComponent {  
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
    return new Promise((resolve, reject) => {
      const promises = [];
      const token = this.container.get('token', '');
      const org = this.container.get('org', null);
      const showPaths = this.container.get('show-vulnerable-paths', true);
      
      snykUserConfig.set('api', token);
      
      emitter.on(npmEvents.npm.dependencies.postinstall, (npmModule, emitModule) => {
        const options = {
          org,
          json: true,
          'show-vulnerable-paths': showPaths ? 'true' : 'false',
        };
        
        promises.push(
          snykTest(npmModule.rootDir, options)
            .then(result => this._info(npmModule, emitModule, result, options))
            .catch(error => this._info(npmModule, emitModule, error, options))
        );
      });
      
      emitter.on(emitEvents.modules.process.end, () => {
        Promise.all(promises)
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }
  
  /**
   * @param {*} npmModule
   * @param {*} emitModule
   * @param {string|Error} result
   * @param {*} options
   *
   * @private
   */
  _info(npmModule, emitModule, result, options) {
    if (result && typeof result === 'object' && result instanceof Error) {
      try {
        result = JSON.parse(result.message);
      } catch (error) {
        throw result;
      }
    } else {
      result = JSON.parse(result);
    }
    
    this.logger.debug(JSON.stringify(result, null, '  '));
    
    const moduleInfo = `${ emitModule.name } (${ npmModule.packageFile })`;
    const pm = result.packageManager;
    const deps = result.dependencyCount || 0;
    const badge = (result.ok && result.vulnerabilities.length <= 0)
      ? this.logger.emoji.check 
      : this.logger.emoji.cross;

    this.logger.info(
      `${ badge } Snyk.io processed ${ deps } ${ pm } dependencies - ${ moduleInfo }`
    );
    
    const showVulnPaths = options['show-vulnerable-paths'] === 'true';
    const reportedVulns = {};
    
    const vulnerabilities = result.vulnerabilities.map(vuln => {
      if (showVulnPaths && reportedVulns[vuln.id]) {
        return;
      }
      
      reportedVulns[vuln.id] = true;

      let res = '';
      const name = `${ vuln.name }@${ vuln.version }`;
      const severity = vuln.severity[0].toUpperCase() + vuln.severity.slice(1);
      const issue = vuln.type === 'license' ? 'issue' : 'vulnerability';
      
      res += this.logger.chalk.red(`${ severity } severity ${ issue } found on ${ name }\n`);
      res += `  - desc: ${ vuln.title }\n`;
      res += `  - info: ${ snykConfig.ROOT }/vuln/${ vuln.id }\n`;
      
      if (showVulnPaths) {
        res += `  - from: ${ vuln.from.join(' > ') }\n`;
      }

      if (vuln.note) {
        res += `${ vuln.note }\n`;
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

        let fix = ''; // = 'Fix:\n';
        
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
              res += 'No direct dependency upgrade can address this issue.\n';
            }
            break;
          }
        }
        
        res += this.logger.chalk.bold(fix);
      } else {
        if (vuln.type === 'license') {
          
          // do not display fix (there isn't any), remove newline
          res = res.slice(0, -1);
        } else if (pm === 'npm') {
          res += this.logger.chalk.magenta(
            'Fix: None available. Consider removing this dependency.'
          );
        }
      }
      
      return res;
    }).filter(Boolean).join('\n\n');
    
    process.stdout.write(`${ vulnerabilities }\n\n`);
  }
}

module.exports = SnykComponent;
