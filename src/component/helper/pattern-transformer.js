'use strict';

module.exports = (value => {  
  return Promise.resolve((Array.isArray(value) ? value : [ value ])
    .filter(pattern => !!((pattern || '').trim()))
    .map(pattern => {
      if (isRegexp(pattern)) {
        return toRegexp(pattern);
      }
      
      return pattern;
    }));
});

/**
 * @param {string} value
 *
 * @returns {RegExp|*}
 */
function toRegexp(value) {
  const matches = value.match(/^\/(.+)\/([gmiyu])*$/);
  
  const [ , regex, modifiers ] = matches;
  
  return new RegExp(regex, modifiers);
}

/**
 * @param {string} value
 *
 * @returns {boolean}
 */
function isRegexp(value) {
  return /\/.+\/[a-z]*/i.test(value);
}
