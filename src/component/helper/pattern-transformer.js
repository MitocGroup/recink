'use strict';

module.exports = (value => {  
  return Promise.resolve((Array.isArray(value) ? value : [ value ])
    .filter(pattern => !!(pattern.trim()))
    .map(pattern => {
      if (isRegexp(pattern)) {
        return toRegexp(pattern);
      }
      
      return pattern;
    }));
});

function toRegexp(value) {
  const matches = value.match(/^\/(.+)\/([gmiyu])*$/);
  
  return new RegExp(matches[1], matches[2]);
}

function isRegexp(value) {
  return /\/.+\/[a-z]*/i.test(value);
}
