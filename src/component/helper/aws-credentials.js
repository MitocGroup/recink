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
   * Get AWS Configuration
   * @return {Promise}
   */
  getConfig() {
    return new AWS.CredentialProviderChain(this._providers).resolvePromise().then(credentials => {
      let RoleArn = "";

      // @todo: validate roleArn, roleName and accountId
      if (this._options.hasOwnProperty('roleArn')) {
        RoleArn = this._options.roleArn;
      } else if (this._options.hasOwnProperty('accountId') && this._options.hasOwnProperty('roleName')) {
        RoleArn = RoleArn.concat("arn:aws:iam::", this._options.accountId, ":role/", this._options.roleName);
      }

      AWS.config.credentials = RoleArn
        ? new AWS.TemporaryCredentials({ RoleArn: RoleArn }, credentials)
        : credentials;

      if (this._options.hasOwnProperty('region')) {
        AWS.config.update({ region: this._options.region });
      }

      return Promise.resolve(AWS);
    });
  }
}

module.exports = AwsCredentials;
