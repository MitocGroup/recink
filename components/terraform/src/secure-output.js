'use strict';

/**
 * Strip Terraform private data
 */
class SecureOutput {
  /**
   * @param {string} str 
   * 
   * @returns {string}
   * 
   * @todo implement stripping any sensitive 
   * data found besides AWS Account Id
   */
  static secure(str) {
    return SecureOutput.stripAwsAccountFromArn(str);
  }

  /**
   * @param {string} str 
   * 
   * @returns {string}
   */
  static stripAwsAccountFromArn(str) {
    return str.replace(/(.*arn:aws:[^:]*:[^:]*:)([^:]*)(:.*)/gi, '$1************$3');
  }
}

module.exports = SecureOutput;
