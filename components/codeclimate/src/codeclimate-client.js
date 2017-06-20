'use strict';

const request = require('request');
const pjson = require('../package.json');
const pify = require('pify');

/**
 * CodeClimate http client
 */
class CodeclimateClient {
  /**
   * @param {string} token
   * @param {boolean} skipCertificate
   */
  constructor(token, skipCertificate) {
    this._token = token;
    this._skipCertificate = skipCertificate;
  }
  
  /**
   * @returns {string}
   */
  get token() {
    return this._token;
  }
  
  /**
   * @returns {boolean}
   */
  get skipCertificate() {
    return this._skipCertificate;
  }
  
  /**
   * @param {*} json
   *
   * @returns {Promise}
   */
  upload(json) {    
    return pify(request.post)(this._requestOptions(json))
      .then(response => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return Promise.resolve();
        } else if (response.statusCode === 401) {
          return Promise.reject(new Error(
            'An invalid CODECLIMATE_REPO_TOKEN repo token was specified.'
          ));
        } else {
          return Promise.reject(new Error(
            `Error uploading coverage data to CodeClimate (statusCode=${ response.statusCode })`
          ));
        }
      })
      .catch(error => {
        if (error.code === CodeclimateClient.INCORECT_CERTIFICATE_CHAIN_ERROR) {
          return Promise.reject(new Error(
            `It looks like you might be trying to send coverage 
            to an enterprise version of CodeClimate with a (probably) 
            invalid or incorrectly configured certificate chain. 
            If you are sure about where you are sending your data, 
            set "skip-certificate: true" and try again.`
          ));
        }
        
        return Promise.reject(error);
      });
  }
  
  /**
   * @param {*} json
   * 
   * @returns {*}
   *
   * @private
   */
  _requestOptions(json) {
    return {
      url: `${ CodeclimateClient.HOST }/test_reports`,
      headers: {
        'User-Agent': `${ pjson.description } (${ pjson.name } v${ pjson.version })`,
        'Content-Type': 'application/json',
      },
      timeout: CodeclimateClient.TIMEOUT,
      rejectUnauthorized: this.skipCertificate,
      body: JSON.stringify(Object.assign({ repo_token: this.token }, json)),
    };
  }
  
  /**
   * @returns {string}
   */
  static get INCORECT_CERTIFICATE_CHAIN_ERROR() {
    return 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
  }
  
  /**
   * @returns {number}
   */
  static get TIMEOUT() {
    return 5000;
  }
  
  /**
   * @returns {string}
   */
  static get HOST() {
    return 'https://codeclimate.com';
  }
}

module.exports = CodeclimateClient;
