'use strict';

const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
const uuidv1 = require('uuid/v1');

/**
 * Unit test runner
 */
class UnitRunner {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this._tmps = [];
    this._mocha = new Mocha(options);
  }

  /**
   * Run tests
   * @param {Array} tests
   * @returns {Promise}
   */
  run(tests) {
    return new Promise((resolve, reject) => {
      tests.forEach(test => {
        const testDir = path.dirname(test);
        const tmpTest = path.join(testDir, `${uuidv1()}.spec.js`);

        fs.writeFileSync(tmpTest, fs.readFileSync(test));
        this._tmps.push(tmpTest);
        this._mocha.addFile(tmpTest);
      });

      this._mocha.run(err => {
        if (err) {
          this._removeTmpFiles();
          return reject(err);
        }

        return resolve();
      });
    });
  }

  /**
   * Get mocha instance
   * @returns {Mocha}
   */
  getMocha() {
    return this._mocha;
  }

  /**
   * Cleanup action
   * @returns {Promise}
   */
  cleanup() {
    this._removeTmpFiles();

    return Promise.resolve();
  }

  /**
   * Remove tmp test files
   * @private
   */
  _removeTmpFiles() {
    this._tmps.forEach(tmpTest => {
      try {
        fs.unlinkSync(tmpTest);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.log(err.code);
        }
      }
    });
  }
}

module.exports = UnitRunner;
