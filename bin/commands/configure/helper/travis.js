'use strict';

const Jst = require('../../../../src/index').Jst;

const file = '.travis.yml';

const vars = {
  AWS_ACCESS_KEY_ID: 'JST_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'JST_AWS_SECRET_ACCESS_KEY',
  AWS_REGION: 'JST_AWS_REGION',
};

const info = {
  AWS_ACCESS_KEY_ID: 'AWS Access Key Id',
  AWS_SECRET_ACCESS_KEY: 'AWS Secret Access Key',
  AWS_REGION: 'AWS Region',
};

/**
 * @param {string} varName
 * @param {*} value
 *
 * @returns {string}
 */
function dump(varName, value) {
  return `${ varName }='${ value.replace(/'/g, '\\\'') }'`;
}

/**
 * @returns {string}
 */
function help() {
  const output = [
    `You can use the following variables in your ${ Jst.CONFIG_FILE_NAME }:`,
  ];
  
  output.push('\n');
  
  Object.keys(vars).map(key => {
    output.push(`  - process.env.${ vars[key] } - ${ info[key] }`);
  });
  
  output.push('\n');
  output.push('Please ensure the \'eval\' preprocessor added for the options.');
  output.push('Sample Config: https://github.com/MitocGroup/run-jst/blob/master/bin/templates/.jst.yml#L5');
  
  return output.join('\n');
}

module.exports = { vars, dump, help, info, file, };
