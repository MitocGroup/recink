'use strict';

const DependencyBasedComponent = require('recink/src/component/dependency-based-component');

/**
 * CloudNativeCI integration component
 */
class CnciComponent extends DependencyBasedComponent {
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
    const name = this.container.get('name', 'World');
    const ci = this.container.get('ci', false);

    console.log('ci', ci);

    this.logger.info(this.logger.chalk.yellow.bold(`Hello ${ name }!`));
  
    return Promise.resolve();
  }

  // TIME=$(date +%s)
  // LOG_FILE="build-log-${TIME}.txt"
  // META_FILE="build-metadata-${TIME}.json"
  // JENKINS_HOST="127.0.0.1"
  // DEST_HOST="https://cloudnativeci-metadata.s3.amazonaws.com/public-dev"
  //
  // curl -s "${JENKINS_USER}:${JENKINS_TOKEN}@${JENKINS_HOST}/job/${JOB_NAME}/${BUILD_NUMBER}/consoleText" > ${LOG_FILE}
  // curl -s "${JENKINS_USER}:${JENKINS_TOKEN}@${JENKINS_HOST}/job/${JOB_NAME}/${BUILD_NUMBER}/api/json"  | sed "s/^{/{\"cnciToken\":\"$token\",/g" > ${META_FILE}
  //
  // curl -s -H 'x-amz-acl: bucket-owner-full-control' -X PUT ${DEST_HOST}/${LOG_FILE} --upload-file ${LOG_FILE}
  // curl -s -H 'x-amz-acl: bucket-owner-full-control' -X PUT ${DEST_HOST}/${META_FILE} --upload-file ${META_FILE}

}

module.exports = CnciComponent;
