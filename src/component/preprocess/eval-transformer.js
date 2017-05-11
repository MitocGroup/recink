'use strict';

const AbstractTransformer = require('./abstract-transformer');

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
