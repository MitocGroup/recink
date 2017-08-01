'use strict';

const { spawn } = require('child_process');
const Spinner = require('../../../../src/component/helper/spinner');
const chalk = require('chalk');

/**
 * Link NPM package
 */
class Link {
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
   * @returns {string}
   */
  get packageName() {
    return this._packageName;
  }
  
  /**
   * @returns {Promise}
   */
  run() {
    const pkgInfo = chalk.gray(this.packageName);
    const infoCwd = chalk.gray(this.cwd || process.cwd());
    
    return (new Spinner(
      `Linking ${ pkgInfo } package in ${ infoCwd }`
    )).then(
      `Package ${ pkgInfo } successfully linked in ${ infoCwd }`
    ).catch(
      `Failed to link ${ pkgInfo } package in ${ infoCwd }`
    ).promise(new Promise((resolve, reject) => {
      const options = { stdio: 'ignore' };
      const args = [ 'link', this.packageName ];
      
      if (this.cwd) {
        options.cwd = this.cwd;
      } else {
        args.push('-g');
      }

      const npmLink = spawn('npm', args, options);
      
      npmLink.on('close', code => {
        if (code !== 0) {          
          return reject(new Error(
            `Failed to link ${ pkgInfo } package in ${ infoCwd } with code ${ code }`
          ));
        }
        
        resolve();
      });
    }));
  }
}

module.exports = Link;
