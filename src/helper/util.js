'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Read directory recursively
 * @param {String} dir Directory path
 * @param {RegExp} include Pattern to include files
 * @param {RegExp} exclude Pattern to exclude directories
 * @param {Function} callback
 * @private
 */
function _walkDir(dir, include, exclude, callback) {
  if (!fs.existsSync(dir)) {
    return;
  }

  let files = fs.readdirSync(dir);

  for (let i = 0; i < files.length; i++) {
    let filename = path.join(dir, files[i]);
    let stat = fs.lstatSync(filename);

    if (stat.isDirectory()) {
      let dirName = path.basename(filename);

      if (exclude.test(dirName)) {
        continue;
      }

      _walkDir(filename, include, exclude, callback);
    } else if (include.test(filename)) {
      callback(filename);
    }
  }
}

/**
 * Find files by RegExp pattern except dirs
 * @param {String} dir Directory to search
 * @param {RegExp} include Pattern to filter
 * @param {RegExp} exclude Pattern to exclude directories
 * @return {Array}
 */
function findFilesByPattern(dir, include = /.*/, exclude = /^$/) {
  let fileNames = [];
  _walkDir(dir, include, exclude, (fileName) => fileNames.push(fileName));

  return fileNames;
}

exports.findFilesByPattern = findFilesByPattern;

/**
 * Remove all prefixes or suffixes from the given string
 * @param {String} string
 * @param {String} symbol
 * @returns {String}
 */
function trimBoth(string, symbol = '\s') {
  const leading = new RegExp(`^${symbol}`);
  const trailing = new RegExp(`${symbol}$`);

  return string.replace(leading, '').replace(trailing, '');
}

exports.trimBoth = trimBoth;

/**
 * Fill string with symbols
 * @param {String} str
 * @param {Number} length
 * @param {String} symbol
 * @returns {String}
 */
function fillString(str, length, symbol = 'x') {
  let result = str;

  while (result.length < length) {
    result += symbol;
  }

  return result;
}

exports.fillString = fillString;

/**
 * Compare two software version
 *  v1 == v2 => 0
 *  v1 < v2 => -1
 *  v1 > v2 => 1
 * @param {String} v1
 * @param {String} v2
 * @returns {Number}
 */
function versionCompare(v1, v2) {
  const fillTo = 10;
  let ver1 = v1.split('.').map(x => fillString(x.trim().toLowerCase(), fillTo, '#')).join('');
  let ver2 = v2.split('.').map(x => fillString(x.trim().toLowerCase(), fillTo, '#')).join('');
  let maxLength = Math.max(ver1.length, ver2.length);

  ver1 = fillString(ver1, maxLength, '#');
  ver2 = fillString(ver2, maxLength, '#');

  for (let i = 0; i < maxLength; i++) {
    let char1 = ver1.charCodeAt(i);
    let char2 = ver2.charCodeAt(i);

    if (char1 > 96) {
      char1 -= 60;
    }

    if (char2 > 96) {
      char2 -= 60;
    }

    if (char1 !== char2) {
      return (char1 > char2) ? 1 : -1;
    }
  }

  return 0;
}

exports.versionCompare = versionCompare;
