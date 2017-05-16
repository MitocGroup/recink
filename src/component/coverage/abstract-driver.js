'use strict';

class AbstractDriver {
  /**
   * @param {string} name
   *
   * @returns {Promise}
   */
  read(name) {
    return this._read(name)
      .then(content => {
        if (!content) {
          return Promise.resolve(null);
        }
        
        return Promise.resolve(JSON.parse(content));
      });
  }
  
  /**
   * @param {string} name
   * @param {*} coverage
   *
   * @returns {Promise}
   */
  write(name, coverage) {
    return this._write(name, JSON.stringify(coverage));
  }

  /**
   * @param {string} name
   * 
   * @returns {Promise}
   *
   * @private
   */
  _read(name) {
    return Promise.reject(new Error(
      `${ this.constructor.name }._read(name) not implemented!`
    ));
  }
  
  /**
   * @param {string} name
   * @param {string} content
   * 
   * @returns {Promise}
   *
   * @private
   */
  _write(name, content) {
    return Promise.reject(new Error(
      `${ this.constructor.name }._write(name, content) not implemented!`
    ));
  }
}

module.exports = AbstractDriver;
