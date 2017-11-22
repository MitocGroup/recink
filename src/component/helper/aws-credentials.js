'use strict';

const AWS = require('aws-sdk');

/**
 * AWS security credentials
 */
class AwsCredentials {
  /**
   * @param {Object} options
   */
  constructor(options) {
    this._options = options;
    this._providers = [
      new AWS.EnvironmentCredentials(
        options.hasOwnProperty('envPrefix') ? options.envPrefix : 'AWS'
      ),
      new AWS.SharedIniFileCredentials({
        profile: options.hasOwnProperty('profile') ? options.profile : 'default'
      }),
      AWS.ECSCredentials.prototype.isConfiguredForEcsCredentials()
        ? new AWS.ECSCredentials() : new AWS.EC2MetadataCredentials()
    ];

    if (options.hasOwnProperty('accessKeyId') && options.hasOwnProperty('secretAccessKey')) {
      this._providers.push(
        new AWS.Credentials({ accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey})
      );
    }
  }

  /**
   * Get initialized AWS
   * @return {Promise}
   */
  getAws() {
    return new AWS.CredentialProviderChain(this._providers).resolvePromise().then(credentials => {
      AWS.config.credentials = this._options.hasOwnProperty('roleArn')
        ? new AWS.TemporaryCredentials({ RoleArn: this._options.roleArn }, credentials)
        : credentials;

      if (this._options.hasOwnProperty('region')) {
        AWS.config.update({ region: this._options.region });
      }

      return Promise.resolve(AWS);
    });
  }
}

module.exports = AwsCredentials;
