'use strict';

const AWS = require('aws-sdk');
const AbstractCI = require('./abstract-ci');

class CodePipelineCI extends AbstractCI {
  /**
   * @param {Object} options
   */
  constructor(options) {
    super();

    this._codepipeline = null;
    this._codebuild = null;
    this._cloudwatchlogs = null;
    this._projectName = options.projectName;
    this._region = options.region;
    this._executionIds = [];
  }
  getCI() {
    if (!this._codepipeline) {
      const _codepipeline = new AWS.CodePipeline({
        region: this._region
      });
    }

    return Promise.resolve(_codepipeline);
  }

  _getCWL() {
    if (!this._cloudwatchlogs) {
      const _cloudwatchlogs = new AWS.CloudWatchLogs({
        region: this._region
      });
    }

    return Promise.resolve(_cloudwatchlogs);
  }

  _getCB() {
    if (!this._codebuild) {
      const _codebuild = new AWS.CodeBuild({
        region: this._region
      });
    }

    return Promise.resolve(_codebuild);
  }

  getJobMeta() {
    return this.getCI().then(codepipeline => {
      return codepipeline.getPipelineState({
        name: this._projectName
      }).promise().then(stage => {
        let pipelineStatus = 'Succeeded';

        stage.stageStates.forEach(state => {
          if (state.latestExecution.status === 'Failed') {
            pipelineStatus = 'Failed';
            break;
          }
        });

        stage.pipelineStatus = pipelineStatus;

        return Promise.resolve(stage);
      });
    });
  }

  _getCodebuildNames(pipelineJson) {
    let result = [];

    pipelineJson.pipeline.stages.forEach(stage => {
      stage.actions.forEach(action => {
        if (action.configuration.hasOwnProperty('ProjectName')) {
          result.push(action.configuration.ProjectName);
        }
      });
    });

    return Promise.resolve(result);
  }

  _getPipelineJson(pipelineName) {
    const params = {
      name: pipelineName
    };

    return this.getCI().then(codepipeline => {
      codepipeline.getPipeline(params).promise();
    });
  }

  _getLogParameters(namesArray) {
    return this._getCB().then(codebuild => {
      return Promise.all(namesArray.map(codebuildName => {
        let params = {
          projectName: codebuildName
        }
        return codebuild.listBuildsForProject(params).promise()
          .then(result => result.ids.shift());
      }));
    });
  }

  getJobLog() {
    return this._getPipelineJson()
      .then(pipelineJson => this._getCodebuildNames())
      .then(codebuildNames => this._getLogParameters())
      .then(logParameters => {
        return Promise.all(logParameters.map(parameter => {
            let splittedParameter = parameter.split(':');
            let params = {
              logGroupName: `/aws/codebuild/${splittedParameter.shift()}`,
              logStreamName: splittedParameter.shift()
            }

            return this._getCWL().then(cloudwatchlogs => {
              return cloudwatchlogs.getLogEvents(params).promise()
            });
          }))
          .then(results => results.join('\n'));
      });
  }
}

module.exports = CodePipelineCI;
