'use strict';

/* eslint no-eval: 0 */

const AbstractTransformer = require('./abstract-transformer');
const Logger = require('../../../src/logger');

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
    try {
      return eval(value);
    } catch (err) {
      Logger.debug(Logger.emoji.bulb, `Is not possible to evaluate ${value} variable, leaving as is`);
      return value;
    }
  }
}

module.exports = EvalTransformer;
