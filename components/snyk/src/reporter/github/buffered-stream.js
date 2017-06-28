'use strict';

const { Writable } = require('stream');

/**
 * Buffer stream implementation
 */
class BufferedStream extends Writable {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._chunks = [];
  }
  
  /**
   * @returns {Buffer[]}
   */
  get chunks() {
    return this._chunks;
  }
  
  /**
   * @param {string} chunk
   * @param {string} encoding
   * @param {function} callback
   *
   * @returns {boolean}
   */
  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) 
      ? chunk 
      : new Buffer(chunk, encoding);
    
    this._chunks.push(buffer);
    
    callback();
  }
  
  /**
   * @returns {Buffer}
   */
  get buffer() {
    return Buffer.concat(this._chunks);
  }
}

module.exports = BufferedStream;
