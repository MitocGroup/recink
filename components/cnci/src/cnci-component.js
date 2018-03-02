'use strict';

const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');
const CiFactory = require('./ci-factory');
const { findFilesByPattern } = require('recink/src/helper/util');
const DependencyBasedComponent = require('recink/src/component/dependency-based-component');

/**
 * CloudNativeCI integration component
 */
class CnciComponent extends DependencyBasedComponent {
  /**
   * Constructor
   */
  constructor() {
    super();

    this._s3client = new S3({ region: 'us-east-1' });
    this._timestamp = Math.floor(Date.now() / 1000);
    this._cnciToken = false;
  }

  /**
   * @returns {String}
   */
  get name() {
    return 'cnci';
  }
  
  /**
   * CNCI component dependencies
   * @returns {String[]}
   */
  get dependencies() {
    return [];
  }
  
  /**
   * @param {Emitter} emitter
   * @returns {Promise}
   */
  run(emitter) {
    this._cnciToken = this.container.get('token', false);

    if (!this._cnciToken) {
      this.logger.error(this.logger.emoji.cross, 'CNCI token is required');
      return Promise.resolve();
    }

    return this._getBuildMetadata().then(results => {
      return Promise.all(
        results.map(item => {
          return this._uploadToS3(item.key, item.body)
        })
      ).then(uploaded => {
        if (uploaded.length > 0) {
          this.logger.info(this.logger.emoji.check, 'Build metadata uploaded');
        }

        return Promise.resolve();
      }).then(() => {
        const tfMetadata = this._getTerraformMetadata();

        return Promise.all(
          tfMetadata.map(item => {
            return this._uploadToS3(item.key, item.body)
          })
        );
      });
    });
  }

  /**
   * Find terraform infrastructure related metadata
   * @returns {Array}
   * @private
   */
  _getTerraformMetadata() {
    const projectDir = this.container.get('__dir');
    const artifacts = findFilesByPattern(projectDir, /.*\.(tfstate|tfplan)$/, /^node_modules$/);

    return artifacts.map(item => {
      let type = /tfstate$/.test(item) ? 'state' : 'plan';
      let file = item.replace(projectDir, '');

      return {
        key: `terraform/${this._timestamp}/${type}${file}`,
        body: fs.readFileSync(item)
      };
    });
  }

  /**
   * Get CI job results if configured
   * @returns {Promise}
   * @private
   */
  _getBuildMetadata() {
    const ciConfig = this.container.get('ci', false);

    if (!ciConfig) {
      this.logger.info(this.logger.emoji.bulb, `CI is not configured, skipping`);
      return Promise.resolve([]);
    }

    const ci = CiFactory.create(ciConfig);

    return Promise.all([ci.getJobMeta(), ci.getJobLog()]).then(([ meta, log ]) => {
      meta.cnciToken = this._cnciToken;

      return Promise.resolve([
        { key: `public-dev/build-metadata-${this._timestamp}.json`, body: JSON.stringify(meta, null, 2) },
        { key: `public-dev/build-log-${this._timestamp}.txt`, body: log }
      ]);
    });
  }

  /**
   * Put object to s3
   * @param {String} key
   * @param {Buffer|String} body
   * @returns {Promise}
   * @private
   */
  _uploadToS3(key, body = '') {
    const params = {
      ACL: CnciComponent.DEFAULT_ACL,
      Body: body,
      Bucket: CnciComponent.METADATA_BUCKET,
      Key: key
    };

    return new Promise((resolve, reject) => {
      this._s3client.makeUnauthenticatedRequest('putObject', params, (err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(data);
      });
    });
  }

  /**
   * CNCI metadata bucket
   * @returns {String}
   * @constructor
   */
  static get DEFAULT_ACL() {
    // @todo use public-read-write instead of bucket-owner-full-control
    return 'bucket-owner-full-control';
  }

  /**
   * CNCI metadata bucket
   * @returns {String}
   * @constructor
   */
  static get METADATA_BUCKET() {
    return 'cloudnativeci-metadata';
  }
}

module.exports = CnciComponent;
