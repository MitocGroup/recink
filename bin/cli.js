#!/usr/bin/env node

'use strict';

const logger = require('../src/logger');
const prog = require('caporal');
const pkg = require('../package.json');

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
      .option('-s <component>', 'Skip component', prog.REPEATABLE)
      .argument('[path]', 'Path to tests', /.+/, process.cwd())
      .action(cmd('./commands/run/unit'))
    .command('run e2e', 'Run end to end tests')
      .action(cmd('./commands/run/e2e'))
    .command('configure dps', 'Configure Deepstiny') 
      .action(cmd('./commands/configure/dps'))      
    .command('configure travis', 'Configure Travis') 
      .action(cmd('./commands/configure/travis'))
    .command('lint travis', 'Lint Travis configuration') 
      .argument('<path>', 'Path to .travis.yml')
      .action(cmd('./commands/lint/travis'))
;

prog.parse(process.argv);
