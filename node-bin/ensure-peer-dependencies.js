#!/usr/bin/env node

'use strict';

const Env = require('../src/helper/env');
const spawn = require('child_process').spawn;
const packageObj = require('../package.json');
const dependencies = packageObj.peerDependencies || {};

if (Env.isTravis) {
  console.log('Skip installation of peerDependencies whilst in TravisCI');
  process.exit(0);
}

const dependenciesVector = [];

Object.keys(dependencies).map(key => {
  const dependency = `${ key }@${ dependencies[key] }`;
  
  dependenciesVector.push(dependency);
});

console.log('Ensure peerDependencies are installed');

const npmInstall = spawn(
  'npm', 
  [ 'install' ].concat(dependenciesVector)
);

npmInstall.on('close', code => {
  process.exit(code);
});
