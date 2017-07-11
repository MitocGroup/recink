'use strict';

const { spawn } = require('child_process');
const Spinner = require('../../../../../src/component/helper/spinner');

/**
 * Uninstall NPM package
 */
class Uninstall {
  /**
   * @param {string} packageName
   * @param {string} cwd
   */
  constructor(packageName, cwd = null) {
    this._packageName = packageName;
    this._cwd = cwd;
  }
  
  /**
   * @returns {string}
   */
  get cwd() {
    return this._cwd;
  }
  
  /**
   * @returns {Promise}
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
      const args = [ 'uninstall', this.packageName ];
      
      if (this.cwd) {
        options.cwd = this.cwd;
      } else {
        args.push('-g');
      }

      const npmUninstall = spawn('npm', args, options);
      
      npmUninstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(`Failed to uninstall ${ this.packageName }`));
        }
        
        resolve();
      });
    }));
  }
}

module.exports = Uninstall;
