'use strict';

const chalk = require('chalk');

class Logger {
  /**
   * @param {*} logger
   *
   * @returns {Logger|*}
   */
  static customLogger(logger) {
    this._customLogger = logger;
    
    return this;
  }
  
  /**
   * @param {number} level
   *
   * @returns {Logger|*}
   */
  static level(level) {
    this._dbgLevel = level;
    
    return this;
  }
  
  /**
   * @param {number} level
   *
   * @returns {Logger|*}
   */
  static addLevel(level) {
    this._dbgLevel = this._level | level;
    
    return this;
  }
  
  /**
   * @param {*} args
   * 
   * @returns {Logger|*}
   */
  static debug(...args) {
    return this._exec('debug', ...args);
  }
  
  /**
   * @param {*} args
   * 
   * @returns {Logger|*}
   */
  static log(...args) {
    return this._exec('log', ...args);
  }
  
  /**
   * @param {*} args
   * 
   * @returns {Logger|*}
   */
  static info(...args) {
    return this._exec('info', ...args);
  }
  
  /**
   * @param {*} args
   * 
   * @returns {Logger|*}
   */
  static warn(...args) {
    return this._exec('warn', ...args);
  }
  
  /**
   * @param {*} args
   * 
   * @returns {Logger|*}
   */
  static error(...args) {
    return this._exec('error', ...args);
  }
  
  /**
   * @returns {*}
   *
   * @private
   */
  static get _logger() {
    return this._customLogger || console;
  }
  
  /**
   * @returns {number}
   *
   * @private
   */
  static get _level() {
    return this._dbgLevel || (this.WARN | this.ERROR);
  }
  
  /**
   * @param {string} method
   * @param {*} args
   *
   * @returns {Logger|*}
   * 
   * @private
   */
  static _exec(method, ...args) {
    if (this._logger instanceof console.constructor) {
      if (this._level & this[method.toUpperCase()]) {
        if (method === 'debug') {
          method = 'log';
        }
        
        this._logger[method](
          this._color(method).open,
          ...args,
          this._color(method).close
        );
      }
    } else { // rely on winston compatible logger
      this._logger[method](...args);
    }
    
    return this;
  }
  
  /**
   * @param {string} method
   * 
   * @returns {string}
   *
   * @private
   */
  static _color(method) {
    let color;
    
    switch (method) {
      case 'info':
        color = 'green';
        break;  
      case 'warn':
        color = 'yellow';
        break;   
      case 'error':
        color = 'red';
        break;    
      case 'log':
      default:
        color = 'white';
        break;
    }
    
    return chalk.styles[color];
  }
  
  /**
   * @returns {*}
   */
  static get emoji() {
    return {
      rocket: '🚀 ',
      cross: '❌ ',
      check: '✅ ',
      smiley: '😃 ',
      fire: '🔥 ',
      diamond: '💎 ',
      gift: '🎁 ',
      poop: '💩 ',
      magic: '✨ ',
    };
  }
  
  /**
   * @returns {number}
   */
  static get ALL() {
    return this.LOG | this.DEBUG | this.INFO | this.WARN | this.ERROR;
  }
  
  /**
   * @returns {number}
   */
  static get LOG() {
    return 1;
  }
  
  /**
   * @returns {number}
   */
  static get DEBUG() {
    return 2;
  }
  
  /**
   * @returns {number}
   */
  static get INFO() {
    return 4;
  }
  
  /**
   * @returns {number}
   */
  static get WARN() {
    return 8;
  }
  
  /**
   * @returns {number}
   */
  static get ERROR() {
    return 16;
  }
}

module.exports = Logger;
