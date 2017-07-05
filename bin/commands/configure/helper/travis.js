'use strict';

const Recink = require('../../../../src/recink');
const file = '.travis.yml';

const vars = {
  AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
  AWS_DEFAULT_REGION: 'AWS_DEFAULT_REGION',
};

const info = {
  AWS_ACCESS_KEY_ID: 'AWS Access Key Id',
  AWS_SECRET_ACCESS_KEY: 'AWS Secret Access Key',
  AWS_DEFAULT_REGION: 'AWS Region',
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
 * @param {String[]} localVars
 * 
 * @returns {string}
 */
function help(localVars = null) {
  const output = [
    `You can use the following variables in your ${ Recink.CONFIG_FILE_NAME }:`,
  ];
  
  output.push('\n');
  
  localVars = localVars || vars;
  
  Object.keys(localVars).map(key => {
    if (info[key]) {
      output.push(`  - process.env.${ localVars[key] } - ${ info[key] }`);
    } else {
      output.push(`  - process.env.${ localVars[key] }`);
    }
  });
  
  output.push('\n');
  output.push('Please ensure the \'eval\' preprocessor added for the options.');
  output.push('Sample Config: https://github.com/MitocGroup/recink/blob/master/bin/templates/.recink.yml#L4');
  
  return output.join('\n');
}

module.exports = { vars, dump, help, info, file, };
