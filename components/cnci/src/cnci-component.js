'use strict';

const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');
const CiFactory = require('./ci-factory');
const cnciEvents = require('./events');
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
    return new Promise(resolve => {
      const sync = this.container.get('sync', false);
      this._cnciToken = this.container.get('token', false);
      const projectDir = this.container.get('__dir');

      if (!this._cnciToken) {
        this.logger.error(this.logger.emoji.cross, 'CNCI token is required');
        return resolve();
      }

      /**
       * Listens 'cnci.upload.state' event
       * @param {Array} states
       */
      emitter.onBlocking(cnciEvents.cnci.upload.state, states => {
        return Promise.all(
          states.map(state => {
            const stateKey = this._getFullKey(state.replace(projectDir, ''));

            return this._uploadToS3(stateKey, fs.readFileSync(state))
          })
        );
      });

      /**
       * Listens 'cnci.upload.plan' event
       * @param {Array} plans
       */
      emitter.onBlocking(cnciEvents.cnci.upload.plan, plans => {
        return Promise.all(
          plans.map(plan => {
            const planKey = this._getFullKey(plan.path.replace(projectDir, ''));

            return this._uploadToS3(planKey, plan.output);
          })
        );
      });

      if (!sync) {
        return resolve();
      }

      /**
       * Upload build metadata if CI is configured and running as a post-build action
       */
      return this._getBuildMetadata().then(results => {
        return Promise.all(
          results.map(item => this._uploadToS3(item.key, item.body))
        ).then(uploaded => {
          if (uploaded.length > 0) {
            this.logger.info(this.logger.emoji.check, 'Build metadata uploaded');
          }

          return Promise.resolve();
        });
      });
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
      return Promise.resolve([
        { key: this._getFullKey('metadata.json'), body: JSON.stringify(meta, null, 2) },
        { key: this._getFullKey('log.txt'), body: log }
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
      Key: key,
      Metadata: {
        'cnci-token': this._cnciToken,
      }
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
   * Get full S3 key
   * @param {String} key
   * @returns {String}
   * @private
   */
  _getFullKey(key) {
    return `${CnciComponent.PUBLIC_KEYSPACE}/${this._timestamp}/${key.replace(/^\/?/, '')}`;
  }

  /**
   * CNCI metadata bucket
   * @returns {String}
   * @constructor
   */
  static get DEFAULT_ACL() {
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

  /**
   * CNCI public keyspace
   * @returns {String}
   * @constructor
   */
  static get PUBLIC_KEYSPACE() {
    return 'public-dev';
  }
}

module.exports = CnciComponent;
