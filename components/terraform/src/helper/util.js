'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Read directory recursively
 * @param {String} dir
 * @param {String} filter
 * @param {Function} callback
 */
function walkDir(dir, filter, callback) {
  if (!fs.existsSync(dir)) {
    return;
  }

  let files = fs.readdirSync(dir);

  for (let i = 0; i < files.length; i++) {
    let filename = path.join(dir, files[i]);
    let stat = fs.lstatSync(filename);

    if (stat.isDirectory()) {
      walkDir(filename, filter, callback);
    } else if (filter.test(filename)) {
      callback(filename);
    }
  }
}

exports.walkDir = walkDir;

/**
 * Get filenames from dir by RegExp pattern
 * @param {String} dir
 * @param {RegExp} regExp
 * @return {Array}
 */
function getFilesByPattern(dir, regExp) {
  let fileNames = [];
  walkDir(dir, regExp, (fileName) => fileNames.push(fileName));

  return fileNames;
}

exports.getFilesByPattern = getFilesByPattern;

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * @param {String} v1 The first version to be compared.
 * @param {String} v2 The second version to be compared.
 * @param {Object} [options] Optional flags that affect comparison behavior:
 *
 * lexicographical: true | compares each part of the version strings lexicographically
 * instead of naturally; this allows suffixes such as "b" or "dev" but will cause "1.10"
 * to be considered smaller than "1.2".
 *
 * zeroExtend: true | changes the result if one version string has less parts than the other.
 * In this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *
 * @returns {Number|NaN} 0 / equals; -1 / smaller; +1 / higher; NaN / wrong format
 */
function versionCompare(v1, v2, options = {}) {
  let lexicographical = options && options.lexicographical,
    zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

  function isValidPart(x) {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) {
      v1parts.push("0");
    }

    while (v2parts.length < v1parts.length) {
      v2parts.push("0");
    }
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length == i) {
      return 1;
    }

    if (v1parts[i] == v2parts[i]) {
      continue;
    }
    else if (v1parts[i] > v2parts[i]) {
      return 1;
    }
    else {
      return -1;
    }
  }

  if (v1parts.length != v2parts.length) {
    return -1;
  }

  return 0;
}

exports.versionCompare = versionCompare;
