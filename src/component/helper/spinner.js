'use strict';

const ora = require('ora');

/**
 * Terminal spinner implementation
 */
class Spinner {
  /**
   * @param {String} msg
   */
  constructor(msg) {
    this._main = msg;
    this._then = msg;
    this._catch = msg;
    this._spinner = null;
  }
  
  /**
   * @param {String} text
   * @returns {ora}
   */
  prepend(text) {
    this.spinner.text = `${ text } ${ this._main }`;
    
    return this;
  }
  
  /**
   * @param {String} text
   * @returns {ora}
   */
  append(text) {
    this.spinner.text = `${ this._main } ${ text }`;
    
    return this;
  }
  
  /**
   * @returns {ora}
   */
  get spinner() {
    if (!this._spinner) {
      this._spinner = ora(this._main);
    }
    
    return this._spinner;
  }
  
  /**
   * @param {Promise} promiseToWrap
   *
   * @returns {Promise}
   */
  promise(promiseToWrap) {
    this.spinner.start();
    
    return promiseToWrap
      .then(result => {
        this.spinner.succeed(this.thenText);
        
        return Promise.resolve(result);
      })
      .catch(error => {
        this.spinner.fail(this.catchText);
        
        return Promise.reject(error);
      });
  }
  
  /**
   * @param {String} msg
   * @returns {Spinner}
   */
  then(msg) {
    this._then = msg;
    
    return this;
  }
  
  /**
   * @param {String} msg
   * @returns {Spinner}
   */
  catch(msg) {
    this._catch = msg;
    
    return this;
  }
  
  /**
   * @returns {String}
   */
  get catchText() {
    return this._catch;
  }
  
  /**
   * @returns {String}
   */
  get thenText() {
    return this._then;
  }
  
  /**
   * @returns {String}
   */
  get mainText() {
    return this._main;
  }
}

module.exports = Spinner;
