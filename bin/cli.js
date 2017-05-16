#!/usr/bin/env node

'use strict';

const logger = require('../src/logger');
const prog = require('caporal');
const pkg = require('../package.json');
const path = require('path');

function cmd(path) {
  return (args, options, customLogger) => {
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

prog
  .version(pkg.version)
  .description(pkg.description)
    .command('run unit', 'Run unit tests') 
      .argument('[path]', 'Path to tests', /.+/, process.cwd())
      .option('-s <component>', 'Skip component', prog.REPEATABLE)
      .complete(() => require('./run/unit/components'))
      .action(cmd('./commands/run/unit'))
    .command('run e2e', 'Run end to end tests')
      .action(cmd('./commands/run/e2e'))
    .command('configure dps', 'Configure Deepstiny') 
      .argument('[path]', 'Path to package root', /.+/, process.cwd())
      .option('--overwrite', 'Overwrite existing configuration file')
      .action(cmd('./commands/configure/dps'))   
    .command('configure travis', 'Configure Travis') 
      .argument('[path]', 'Path to package root', /.+/, process.cwd())
      .option('--overwrite', 'Overwrite existing configuration file')
      .option('--aws-region <region>', 'AWS Region', /.+/, 'us-east-1')
      .option('--aws-access-key-id <access-key-id>', 'AWS Access Key Id')
      .option('--aws-secret-access-key <secret-access-key>', 'AWS Secret Access Key')
      .option('--github-repository <repository>', 'GitHub Repository')
      .action(cmd('./commands/configure/travis'))
    .command('lint travis', 'Lint Travis configuration') 
      .argument('[path]', 'Path to .travis.yml', /.+/, path.join(process.cwd(), '.travis.yml'))
      .action(cmd('./commands/lint/travis'))
;

prog.parse(process.argv);
