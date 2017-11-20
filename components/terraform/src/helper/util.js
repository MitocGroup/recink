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
