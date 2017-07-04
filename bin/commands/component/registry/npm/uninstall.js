'use strict';

const { spawn } = require('child_process');
const Spinner = require('../../../../../src/component/helper/spinner');

/**
 * Uninstall NPM package
 */
class Uninstall {
  /**
   * @param {string} packageName
   */
  constructor(packageName) {
    this._packageName = packageName;
  }
  
  /**
   * @returns {string}
   */
  get packageName() {
    return this._packageName;
  }
  
  /**
   * @param {string} script
   * 
   * @returns {Promise}
   *
   * @private
   */
  run() {
    return (new Spinner(
      `Uninstalling "${ this.packageName }" component`
    )).then(
      `Component "${ this.packageName }" successfully uninstalled`
    ).catch(
      `Failed to uninstall "${ this.packageName }" component`
    ).promise(new Promise((resolve, reject) => {
      const options = { stdio: 'ignore' };

      const npmInstall = spawn('npm', [ 'uninstall', '-g', this.packageName ], options);
      
      npmInstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(`Failed to uninstall ${ this.packageName }`));
        }
        
        resolve();
      });
    }));
  }
}

module.exports = Uninstall;
