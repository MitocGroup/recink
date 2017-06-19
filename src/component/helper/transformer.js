'use strict';

/**
 * Apply transformer over a value
 */
class Transformer {
  /**
   * @param {string} path
   * @param {function} transformer
   */
  constructor(path, transformer) {
    this._path = path;
    this._transformer = transformer;
  }
  
  /**
   * @param {*} value
   *
   * @returns {promise}
   */
  transform(value) {
    return this.transformer(value);
  }
  
  /**
   * @returns {function}
   */
  get transformer() {
    return this._transformer;
  }
  
  /**
   * @returns {string}
   */
  get path() {
    return this._path;
  }
}

module.exports = Transformer;
