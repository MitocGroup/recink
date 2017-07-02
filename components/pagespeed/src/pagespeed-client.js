'use strict';

const request = require('request');
const pjson = require('../package.json');
const pify = require('pify');

/**
 * PageSpeed http client
 */
class PageSpeedClient {
  /**
   * @param {string} url
   * @param {*} options
   *
   * @returns {Promise}
   */
  analyze(url, options) {
    return pify(request.get)(
      this._requestOptions(Object.assign({ url }, options))
    ).then(response => {
      return Promise.resolve(JSON.parse(response.body));
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
