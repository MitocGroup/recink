'use strict';

const os = require('os');
const download = require('download');

/**
 * Terraform binaries downloader
 */
class Downloader {
  /**
   * @param {string} binPath
   * @param {string} version
   * @param {string} platform
   * @param {string} arch
   * 
   * @returns {Promise} 
   */
  download(binPath, version, platform = Downloader.PLATFORM, arch = Downloader.ARCH) {
    console.log(`Download terraform version ${ version}`);
    const url = Downloader.urlTemplate(version, platform, arch);

    return download(url, binPath, { extract: true });
  }

  /**
   * @param {string} version
   * @param {string} platform
   * @param {string} arch
   *
   * @returns {string}
   */
  static urlTemplate(version, platform, arch) {
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

    console.log(`Terraform: https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platformVar}_${archVar}.zip`);
    return `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platformVar}_${archVar}.zip`;
  }

  /**
   * @returns {string}
   */
  static get ARCH() {
    return os.arch();
  }

  /**
   * @returns {string}
   */
  static get PLATFORM() {
    return os.platform();
  }
} 

module.exports = Downloader;
