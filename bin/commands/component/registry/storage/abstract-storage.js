'use strict';

/**
 * Abstract Registry storage
 */
class AbstractStorage {
  /**
   * @param {string} namespace 
   */
  constructor(namespace = null) {
    this._namespace = namespace;
  }

  /**
   * @returns {string}
   */
  get namespace() {
    return this._namespace;
  }

  /**
   * @returns {Promise}
   */
  exists() {
    return Promise.reject(new Error(
      `${ this.constructor.name }.exists() not implemented!`
    ));
  }
  
  /**
   * @param {*} data
   * 
   * @returns {Promise}
   */
  write(data) {
    return this._write(JSON.stringify(data));
  }
  
  /**
   * @returns {Promise}
   */
  read() {
    return this._read()
      .then(rawData => Promise.resolve(JSON.parse(rawData)));
  }
  
  /**
   * @param {string} rawData
   * 
   * @returns {Promise}
   *
   * @private
   */
  _write(rawData) {
    return Promise.reject(new Error(
      `${ this.constructor.name }._write(rawData) not implemented!`
    ));
  }
  
  /**
   * @returns {Promise}
   *
   * @private
   */
  _read() {
    return Promise.reject(new Error(
      `${ this.constructor.name }._read() not implemented!`
    ));
  }
}

module.exports = AbstractStorage;
