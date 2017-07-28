'use strict';

const Env = require('recink/src/helper/env');
const github = require('octonode');
const pify = require('pify');
const AbstractProvider = require('./abstract-provider');

/**
 * GitHub comment providers
 */
class GitHubProvider extends AbstractProvider {
  /**
   * @returns {string}
   */
  get name() {
    return 'github';
  }
  
  /**
   * @returns {Issue}
   *
   * @private
   */
  get _ghissue() {
    return github.client(this.options.token || null).issue(
      Env.read('TRAVIS_PULL_REQUEST_SLUG'),
      Env.read('TRAVIS_PULL_REQUEST')
    );
  }

  /**
   * @param {string} body
   *
   * @returns {Promise}
   */
  comment(body) {
    if (!Env.isTravis) {
      this.logger.warn(
        `${ this.logger.emoji.poop } GitHub commenting` +
        ` is currently supported only in Travis environment.`
      );

      return Promise.resolve();
    } else if (!Env.read('TRAVIS_PULL_REQUEST_SLUG')) {
      this.logger.warn(
        `${ this.logger.emoji.cross } Not a Pull Request.` +
        ` Skip submitting comment to GitHub.`
      );

      return Promise.resolve();
    }

    const ghissue = this._ghissue;

    return pify(ghissue.createComment.bind(ghissue))({ body })
      .catch(error => {
        if (error.statusCode === 404) {
          return Promise.reject(new Error(
            'Failed to submit the comment to GitHub. ' +
            'It seems the repository or PR does not exist or ' +
            'you don\'t have enough rights to access the repository.'
          ));
        }

        return Promise.reject(new Error(
          'Failed to submit the comment to GitHub. ' +
          `Failed with message "${ error.message }" and code "${ error.statusCode }"`
        ));
      });
  }
}

module.exports = GitHubProvider;

