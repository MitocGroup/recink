'use strict';

const { spawn } = require('child_process');
const Spinner = require('../../../../../src/component/helper/spinner');

/**
 * Install NPM package
 */
class Install {
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
      `Installing "${ this.packageName }" component globally`
    )).then(
      `Component "${ this.packageName }" successfully installed globally`
    ).catch(
      `Failed to install "${ this.packageName }" component globally`
    ).promise(new Promise((resolve, reject) => {
      const options = { stdio: 'ignore' };

      const npmInstall = spawn('npm', [ 'install', '-g', this.packageName ], options);
      
      npmInstall.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(`Failed to install ${ this.packageName }`));
        }
        
        resolve();
      });
    }));
  }
}

module.exports = Install;
