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
    this._token = options.token;
  }
  
  getCI() {
    if (!this._codepipeline) {
      this._codepipeline = new AWS.CodePipeline({
        region: this._region
      });
    }

    return Promise.resolve(this._codepipeline);
  }

  _getCWL() {
    if (!this._cloudwatchlogs) {
      this._cloudwatchlogs = new AWS.CloudWatchLogs({
        region: this._region
      });
    }

    return Promise.resolve(this._cloudwatchlogs);
  }

  _getCB() {
    if (!this._codebuild) {
      this._codebuild = new AWS.CodeBuild({
        region: this._region
      });
    }

    return Promise.resolve(this._codebuild);
  }

  getJobMeta() {
    return this.getCI().then(codepipeline => {
      return codepipeline.getPipelineState({
        name: this._projectName
      }).promise().then(stage => {
        let pipelineStatus = 'SUCCESS';
        let queueId = null;

        stage.stageStates.forEach(state => {
          if (state.latestExecution.status === 'Failed') {
            pipelineStatus = 'FAILURE';
          }
          queueId = state.latestExecution.pipelineExecutionId;
        });

        stage.result = pipelineStatus;
        stage.queueId = queueId;
        stage.displayName = queueId.split('-').shift();

        return Promise.resolve(stage);
      });
    });
  }

  /**
   * @param {Object} pipelineJson 
   */
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

  /**
   * @param {String} pipelineName 
   */
  _getPipelineJson(pipelineName) {
    const params = {
      name: pipelineName
    };

    return this.getCI().then(codepipeline => {
      return codepipeline.getPipeline(params).promise();
    });
  }

  /**
   * @param {Array} namesArray 
   */
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

  /**
   * @param {String} log 
   */
  _extractLogMessages(log) {
    return Promise.resolve(log.events.map(event => event.message).join(''));
  }

  getJobLog() {
    return this._getPipelineJson(this._projectName)
      .then(pipelineJson => this._getCodebuildNames(pipelineJson))
      .then(codebuildNames => this._getLogParameters(codebuildNames))
      .then(logParameters => {
        return Promise.all(logParameters.map(parameter => {
            let splittedParameter = parameter.split(':');
            let params = {
              logGroupName: `/aws/codebuild/${splittedParameter.shift()}`,
              logStreamName: splittedParameter.shift()
            }

            return this._getCWL().then(cloudwatchlogs => {
              return cloudwatchlogs.getLogEvents(params).promise()
                .then(log => this._extractLogMessages(log));
            });
          }))
          .then(results => results.join('\n'));
      });
  }
}

module.exports = CodePipelineCI;
