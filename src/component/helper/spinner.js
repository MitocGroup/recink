'use srtrict';

const ora = require('ora');

class Spinner {
  /**
   * @param {string} msg
   */
  constructor(msg) {
    this._main = msg;
    this._then = msg;
    this._catch = msg;
  }
  
  /**
   * @param {Promise|*} promiseToWrap
   *
   * @returns {Promise|*}
   */
  promise(promiseToWrap) {
    const spinner = ora(this._main).start();
    
    return promiseToWrap
      .then(result => {
        spinner.succeed(this.thenText);
        
        return Promise.resolve(result);
      })
      .catch(error => {
        spinner.fail(this.catchText);
        
        return Promise.reject(error);
      });
  }
  
  /**
   * @param {string} msg
   *
   * @returns {Spinner|*}
   */
  then(msg) {
    this._then = msg;
    
    return this;
  }
  
  /**
   * @param {string} msg
   *
   * @returns {Spinner|*}
   */
  catch(msg) {
    this._catch = msg;
    
    return this;
  }
  
  /**
   * @returns {string}
   */
  get catchText() {
    return this._catch + '\n';
  }
  
  /**
   * @returns {string}
   */
  get thenText() {
    return this._then + '\n';
  }
  
  /**
   * @returns {string}
   */
  get mainText() {
    return this._main + '\n';
  }
}

module.exports = Spinner;
