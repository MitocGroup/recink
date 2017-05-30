#!/usr/bin/env node

'use strict';

const Env = require('../src/helper/env');
const spawn = require('child_process').spawn;
const packageObj = require('../package.json');
const dependencies = packageObj.peerDependencies || {};

// Read npm parameters passed to original command
let args = JSON.parse((process.env.npm_config_argv || '{"original":[]}').trim()).original;
const forceNoPeer = args.map(a => a.toLowerCase()).filter(a => a === '--no-peer').length > 0;

if (Env.isTravis || forceNoPeer) {
  console.log('Skip installation of peerDependencies whilst either in TravisCI or forced by --no-peer flag');
  process.exit(0);
}

const dependenciesVector = [];

Object.keys(dependencies).map(key => {
  const dependency = `${ key }@${ dependencies[key] }`;
  
  dependenciesVector.push(dependency);
});

console.log('Ensure peerDependencies are installed');

const options = [ 'install' ];

if (Env.isGlobalInstallation) {
  options.push('-g');
}

const npmInstall = spawn( 'npm', options.concat(dependenciesVector));

npmInstall.on('close', code => {
  process.exit(code);
});
