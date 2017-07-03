#!/usr/bin/env node

'use strict';

const logger = require('../src/logger');
const Env = require('../src/helper/env');
const prog = require('caporal');
const pkg = require('../package.json');
const path = require('path');

/**
 * @param {string} path
 *
 * @returns {function}
 */
function cmd(path) {
  return (args, options, customLogger) => {
    process.once('unhandledRejection', error => {
      logger.error(error);
      process.exit(1);
    });
    
    require(path)(
      args, 
      options, 
      logger.customLogger(customLogger)
    ).then(() => {
      logger.info(logger.emoji.rocket, 'Done.');
      process.exit(0);
    }).catch(error => {
      logger.error(error);
      process.exit(1);
    });
  };
}

let description = pkg.description;

if (Env.isCI) {
  description += ' [CI Build]';
}

const commands = prog
  .version(pkg.version)
  .description(description)
  .command('run unit', 'Run unit tests') 
    .argument('[path]', 'Path to tests', /.+/, process.cwd())
    .option('-s <component>', 'Skip component', prog.REPEATABLE)
    .option('-c <component>', 'Use 3\'rd party component', prog.REPEATABLE)
    .complete(() => require('./run/unit/components'))
  .action(cmd('./commands/run/unit'))
  .command('run e2e', 'Run end to end tests')
    .argument('[path]', 'Path to tests', /.+/, process.cwd())
    .option('-s <component>', 'Skip component', prog.REPEATABLE)
    .option('-c <component>', 'Use 3\'rd party component', prog.REPEATABLE)
    .complete(() => require('./run/e2e/components'))
  .action(cmd('./commands/run/e2e'))
;

if (!Env.isCI) {
  commands
    .command('configure recink', 'Configure REciNK')
      .argument('[path]', 'Path to package root', /.+/, process.cwd())
      .option('--overwrite', 'Overwrite existing configuration file')
    .action(cmd('./commands/configure/recink'))   
    .command('configure travis', 'Configure Travis') 
      .argument('[path]', 'Path to package root', /.+/, process.cwd())
      .option('--overwrite', 'Overwrite existing configuration file')
      .option('--aws-region <region>', 'AWS Region', /.+/, 'us-east-1')
      .option('--aws-access-key-id <access-key-id>', 'AWS Access Key Id')
      .option('--aws-secret-access-key <secret-access-key>', 'AWS Secret Access Key')
      .option('--github-repository <repository>', 'GitHub Repository')
      .option('--github-username <username>', 'GitHub Username to login to Travis CI Pro')
      .option('--github-password <password>', 'GitHub Password to login to Travis CI Pro')
      .option('--github-token <token>', 'GitHub Access Token to login to Travis CI Pro')
    .action(cmd('./commands/configure/travis'))
    .command('travis encrypt', 'Encrypt Travis environment variables') 
      .argument('[path]', 'Path to package root', /.+/, process.cwd())
      .option('-x <var>', 'Variable to encrypt', prog.REPEATABLE)
      .option('--github-repository <repository>', 'GitHub Repository')
      .option('--github-username <username>', 'GitHub Username to login to Travis CI Pro')
      .option('--github-password <password>', 'GitHub Password to login to Travis CI Pro')
      .option('--github-token <token>', 'GitHub Access Token to login to Travis CI Pro')
      .option('--print', 'Print JSON diff instead of dumping it to .travis.yml')
    .action(cmd('./commands/travis/encrypt'))
    .command('travis lint', 'Lint Travis configuration') 
      .argument('[path]', 'Path to .travis.yml', /.+/, path.join(process.cwd(), '.travis.yml'))
    .action(cmd('./commands/travis/lint'))
    .command('component generate', 'Generate REciNK boilerplate component')
      .argument('[path]', 'Path to component root', /.+/, process.cwd())
      .option('--name <name>', 'Component name', /^[a-z][a-z0-9_-]+$/i)
    .action(cmd('./commands/component/generate'))
      .command('component add', 'Adds a REciNK component to the registry')
      .argument('[name]', 'Component name', /^[a-z][a-z0-9_-]+$/i)
    .action(cmd('./commands/component/add'))
  ;
}

prog.parse(process.argv);
