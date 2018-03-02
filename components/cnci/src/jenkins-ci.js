'use strict';

const jenkinsApi = require('jenkins');
const AbstractCI = require('./abstract-ci');

class JenkinsCI extends AbstractCI {
  /**
   * @param {Object} options
   */
  constructor(options) {
    super();

    this._jenkins = null;
    this._user = options.user;
    this._token = options.token;
    this._domain = options.domain || '127.0.0.1';
    this._jobName = options.jobName;
    this._buildNumber = options.buildNumber;
  }

  /**
   * Get API endpoint
   * @returns {String}
   */
  getEndpoint() {
    return `http://${ this._user }:${ this._token }@${ this._domain }`;
  }

  /**
   * @returns {Promise}
   */
  getCI() {
    if (!this._jenkins) {
      this._jenkins = jenkinsApi({
        baseUrl: this.getEndpoint(),
        crumbIssuer: true,
        promisify: true
      });
    }

    return Promise.resolve(this._jenkins);
  }

  /**
   * @returns {Promise}
   */
  getJobLog() {
    return this.getCI().then(jenkins => {
      return jenkins.build.log({ name: this._jobName, number: this._buildNumber });
    });
  }

  /**
   * @returns {Promise}
   */
  getJobMeta() {
    return this.getCI().then(jenkins => {
      return jenkins.build.get({ name: this._jobName, number: this._buildNumber });
    });
  }
}

module.exports = JenkinsCI;
