'use strict';

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
