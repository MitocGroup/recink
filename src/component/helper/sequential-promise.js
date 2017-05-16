'use strict';

class SequentialPromise {
  /**
   * @param {Promise[]} promises
   * 
   * @returns {Promise}
   */
  static all(promises) {
    const promisesCloned = [].concat(promises);
    
    return this._sequential(promisesCloned);
  }
  
  /**
   * @param {Promise[]} promises
   * 
   * @returns {Promise}
   *
   * @private
   */
  static _sequential(promises) {
    if (promises.length <= 0) {
      return Promise.resolve();
    }
    
    return promises.shift()
      .then(() => this._sequential(promises));
  }
}

module.exports = SequentialPromise;
