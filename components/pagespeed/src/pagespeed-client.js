'use strict';

const request = require('request');
const pjson = require('../package.json');
const pify = require('pify');

/**
 * PageSpeed http client
 */
class PageSpeedClient {
  /**
   * @param {number} retries 
   */
  constructor(retries = PageSpeedClient.MAX_RETRIES) {
    this._retries = retries;
  }

  /**
   * @param {string} url
   * @param {*} options
   *
   * @returns {Promise}
   */
  analyze(url, options) {
    return this._analyze(url, options)
      .then(response => {
        return Promise.resolve(JSON.parse(response.body));
      });
  }

  /**
   * @param {string} url
   * @param {*} options
   * @param {number} _retries
   *
   * @returns {Promise}
   * 
   * @private
   */
  _analyze(url, options, _retries = 0) {
    const requestOptions = this._requestOptions(Object.assign({ url }, options));

    return pify(request.get)(requestOptions)
      .catch(error => {
        if (_retries > this.retries) {
          return Promise.reject(error);
        }
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this._analyze(url, options, _retries + 1)
              .then(result => resolve(result))
              .catch(error => reject(error));
          }, PageSpeedClient.RETRY_INTERVAL);
        });
      });
  }
  
  /**
   * @param {*} qs
   * 
   * @returns {*}
   *
   * @private
   */
  _requestOptions(qs) {
    return {
      qs,
      url: `${ PageSpeedClient.HOST }/pagespeedonline/v2/runPagespeed`,
      headers: {
        'User-Agent': `${ pjson.description } (${ pjson.name } v${ pjson.version })`,
        'Content-Type': 'application/json',
      },
      timeout: PageSpeedClient.TIMEOUT,
    };
  }

  /**
   * @param {number} retries 
   * 
   * @returns {PageSpeedClient}
   */
  maxRetries(retries) {
    this._retries = retries;

    return this;
  }

  /**
   * @returns {number}
   */
  get retries() {
    return this._retries;
  }
  
  /**
   * @returns {number}
   */
  static get RETRY_INTERVAL() {
    return 300;
  }

  /**
   * @returns {string}
   */
  static get MAX_RETRIES() {
    return 3;
  }

  /**
   * @returns {number}
   */
  static get TIMEOUT() {
    return 15000;
  }
  
  /**
   * @returns {string}
   */
  static get HOST() {
    return 'https://www.googleapis.com';
  }
}

module.exports = PageSpeedClient;
