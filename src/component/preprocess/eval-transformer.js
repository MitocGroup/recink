'use strict';

/* eslint no-eval: 0 */

const AbstractTransformer = require('./abstract-transformer');

/**
 * Transformer implementation of 'eval'
 */
class EvalTransformer extends AbstractTransformer {
  /**
   * @param {*} value
   * 
   * @returns {*}
   */
  transform(value) {
    return eval(value);
  }
}

module.exports = EvalTransformer;
