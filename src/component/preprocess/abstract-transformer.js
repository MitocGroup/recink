'use strict';

/**
 * Transformer interface
 */
class AbstractTransformer {
  /**
   * @param {*} value
   * 
   * @returns {*}
   */
  transform(value) {
    throw new Error(
      `${ this.constructor.name }.transform(value) not implemented!`
    );
  }
}

module.exports = AbstractTransformer;
