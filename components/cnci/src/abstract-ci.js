'use strict';

class AbstractCI {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Get initialized CI
   * @returns {Promise}
   */
  getCI() {
    return Promise.reject(
      new Error(`${ this.constructor.name }.getCI() is not implemented`)
    );
  }

  /**
   * Get CI job log
   * @returns {Promise}
   */
  getJobLog() {
    return Promise.reject(
      new Error(`${ this.constructor.name }.getJobLog() is not implemented`)
    );
  }


  /**
   * Get CI job metadata
   * @returns {Promise}
   */
  getJobMeta() {
    return Promise.reject(
      new Error(`${ this.constructor.name }.getJobMeta() is not implemented`)
    );
  }
}

module.exports = AbstractCI;
