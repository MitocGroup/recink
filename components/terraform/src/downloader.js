'use strict';

const os = require('os');
const url = require('url');
const https = require('https');
const download = require('download');

/**
 * Terraform binaries downloader
 */
class Downloader {
  /**
   * @param {String} version
   */
  constructor(version) {
    this._version = version;
  }

  /**
   * Check if specified version is available
   * @return {Promise}
   */
  isVersionAvailable() {
    return new Promise((resolve, reject) => {
      https.get(this._getBaseUrl(), res => {
        return resolve(res.statusCode === 200);
      }).on('error', err => reject(err));
    });
  }

  /**
   * @param {String} saveToPath
   * @param {String} platform
   * @param {String} arch
   * @returns {Promise}
   */
  download(saveToPath, platform = Downloader.PLATFORM, arch = Downloader.ARCH) {
    return download(this._urlTemplate(platform, arch), saveToPath, { extract: true });
  }

  /**
   * @param {string} platform
   * @param {string} arch
   * @returns {String}
   */
  _urlTemplate(platform, arch) {
    let archVar, platformVar;

    switch (arch) {
      case 'x32':
        archVar = '386';
        break;
      case 'x64':
        archVar = 'amd64';
        break;
      default:
        archVar = arch;
    }

    switch (platform) {
      case 'sunos':
        platformVar = 'solaris';
        break;
      case 'win32':
        platformVar = 'windows';
        break;
      default:
        platformVar = platform;
    }

    return url.resolve(this._getBaseUrl(), `terraform_${this._version}_${platformVar}_${archVar}.zip`);
  }

  _getBaseUrl() {
    return `https://releases.hashicorp.com/terraform/${this._version}/`;
  }

  /**
   * @returns {String}
   */
  static get ARCH() {
    return os.arch();
  }

  /**
   * @returns {String}
   */
  static get PLATFORM() {
    return os.platform();
  }
} 

module.exports = Downloader;
