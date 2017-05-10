'use strict';

class TestAsset {
  /**
   * @param {string} pwd
   * @param {string} file
   */
  constructor(pwd, file) {
    this._pwd = pwd;
    this._file = file;
  }
  
  /**
   * @returns {string}
   */
  get file() {
    return this._file;
  }
  
  /**
   * @returns {string}
   */
  get pwd() {
    return this._pwd;
  }
  
  /**
   * @returns {Promise|*}
   */
  test() {
    return Promise.resolve();
  }
}

module.exports = TestAsset;
