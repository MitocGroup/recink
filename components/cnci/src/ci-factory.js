'use strict';

const JenkinsCI = require('./jenkins-ci');

class CiFactory {
  /**
   * @param {Object} cfg
   * @return {JenkinsCI}
   */
  static create(cfg) {
    switch (cfg.provider) {
      case 'jenkins':
        return new JenkinsCI(cfg.options);
      case 'codepipeline':
        return new CodePipelineCI(cfg.options);
      default:
        throw new Error(`${ cfg.provider } CI is not implemented`);
    }
  }
}

module.exports = CiFactory;
