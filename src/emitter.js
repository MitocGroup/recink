'use strict';

const EventEmitter = require('events');

class Emitter extends EventEmitter {
  constructor(...args) {
    super(...args);
    
    this._blockingListeners = {};
    this._processing = {};
    this._parallel = {};
  }
  
  /**
   * @param {string} event
   * @param {number} count
   *
   * @returns {Emitter|*}
   */
  maxParallel(event, count) {
    this._parallel[event] = count;
    
    return this;
  }
  
  /**
   * @param {string} event
   * @param {*} args
   *
   * @returns {Promise|*}
   */
  emitBlocking(event, ...args) {
    return this._waitAllowParallel(event)
      .then(() => this._dispatch(event, args))
      .then(() => {
        this
          ._cleanupListeners(event)
          ._removeParallel(event)
          .emit(event, ...args);
        
        return Promise.resolve();
      })
      .catch(error => {
        this
          ._cleanupListeners(event)
          ._removeParallel(event);
        
        return Promise.reject(error);
      });
  }
  
  /**
   * @param {string} event
   * @param {function} listener
   * @param {number} priority
   *
   * @returns {Emitter|*}
   */
  onBlocking(event, listener, priority = Emitter.DEFAULT_PRIORITY) {
    return this._pushListener(event, listener, priority, 'on');
  }
  
  /**
   * @param {string} event
   * @param {function} listener
   * @param {number} priority
   *
   * @returns {Emitter|*}
   */
  onceBlocking(event, listener, priority = Emitter.DEFAULT_PRIORITY) {
    return this._pushListener(event, listener, priority, 'once');
  }
  
  /**
   * @param {string} event
   *
   * @returns {Emitter|*}
   *
   * @private
   */
  _removeParallel(event) {
    if (!this._processing.hasOwnProperty(event)) {
      return this;
    }
    
    this._processing[event]--;
    
    return this;
  }
  
  /**
   * @param {string} event
   *
   * @returns {Emitter|*}
   *
   * @private
   */
  _addParallel(event) {
    this._processing[event] = this._processing[event] || 0;
    this._processing[event]++;
    
    return this;
  }
  
  /**
   * @param {string} event
   *
   * @returns {boolean}
   *
   * @private
   */
  _allowParallel(event) {
    return !this._parallel.hasOwnProperty(event)
      || !this._processing.hasOwnProperty(event)
      || this._processing[event] < this._parallel[event];
  }
  
  /**
   * @param {string} event
   * @param {number} interval
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _waitAllowParallel(event, interval = 100) {
    if (this._allowParallel(event)) {
      this._addParallel(event);
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      const id = setInterval(() => {
        if (this._allowParallel(event)) {
          this._addParallel(event);
          clearInterval(id);
          resolve();
        }
      }, interval);
    });
  }
  
  /**
   * @param {string} event
   * @param {function} listener
   * @param {number} priority
   * @param {string} method
   *
   * @returns {Emitter|*}
   *
   * @private
   */
  _pushListener(event, listener, priority, method) {
    this._blockingListeners[event] = this._blockingListeners[event] || [];
    this._blockingListeners[event].push({ listener, priority, method });
    this._blockingListeners[event].sort((a, b) => {
      return b.priority - a.priority;
    });
    
    return this;
  }
  
  /**
   * @param {string} event
   *
   * @returns {Emitter|*}
   * 
   * @private
   */
  _cleanupListeners(event) {
    if (!this._blockingListeners.hasOwnProperty(event) ) {
      return this;
    }
    
    this._blockingListeners[event] = this._blockingListeners[event].filter(l => !!l);
    
    return this;
  }
  
  /**
   * @param {string} event
   * @param {*} args
   * 
   * @returns {Promise|*}
   * 
   * @private
   */
  _dispatch(event, args, _i = 0) {    
    if (!this._blockingListeners.hasOwnProperty(event) 
      || this._blockingListeners[event].length < _i + 1) {
      return Promise.resolve();
    }
    
    const dispatcher = this._blockingListeners[event][_i];
    const result = dispatcher.listener(...args);
    
    if (dispatcher.method === 'once') {
      delete this._blockingListeners[event][_i];
    }
    
    if (!result || typeof result !== 'object' || !(result instanceof Promise)) {
      return this._dispatch(event, args, _i + 1);
    }
    
    return result.then(() => this._dispatch(event, args, _i + 1));
  }
  
  /**
   * @returns {number}
   */
  static get DEFAULT_PRIORITY() {
    return 0;
  }
}

module.exports = Emitter;
