'use strict';

const { spawn } = require('child_process');
const Spinner = require('../../../../../src/component/helper/spinner');

/**
 * Install NPM package
 */
class Install {
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
      `Installing "${ this.packageName }" component`
    )).then(
      `Component "${ this.packageName }" successfully installed`
    ).catch(
      `Failed to install "${ this.packageName }" component`
    ).promise(new Promise((resolve, reject) => {
      const options = { stdio: 'ignore' };
      const args = [ 'install', this.packageName ];
      
      if (this.cwd) {
        options.cwd = this.cwd;
      } else {
        args.push('-g');
      }

      const npmInstall = spawn('npm', args, options);
      
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
