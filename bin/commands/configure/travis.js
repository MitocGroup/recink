'use strict';

const path = require('path');
const Dumper = require('./helper/dumper');
const configFactory = require('../../../src/config/factory');
const encrypt = require('travis-encrypt');
const ghslug = require('github-slug');
const pify = require('pify');
const parse = require('parse-github-repo-url');

module.exports = (args, options, logger) => {
  const region = options.awsRegion;
  const accessKeyId = options.awsAccessKeyId;
  const secretAccessKey = options.awsSecretAccessKey;
  let githubRepository = options.githubRepository;
  
  if (githubRepository) {
    let repositoryParts;
    
    try {
      repositoryParts = parse(githubRepository);
    } catch (error) {
      return Promise.reject(new Error(
        `Wrong GitHub repository identifier - ${ githubRepository }.\n` +
        `ParseError: ${ error.message }`
      ));
    }
    
    if (!repositoryParts) {
      return Promise.reject(new Error(
        `Wrong GitHub repository identifier - ${ githubRepository }`
      ));
    }
    
    const [ user, repository ] = repositoryParts;
    
    githubRepository = `${ user }/${ repository }`;
  }
  
  // @todo configure it
  const configFile = '.travis.yml';
  
  const dumper = new Dumper(
    path.join(__dirname, '../../templates', configFile),
    path.join(args.path, configFile),
    logger
  );
  
  if (accessKeyId && secretAccessKey) {
    const yaml = configFactory.yaml();
    
    dumper.transformers.push(yamlContent => {
      const githubPromise = githubRepository 
        ? Promise.resolve(githubRepository)
        : pify(ghslug)(args.path)
            .catch(error => {
                return Promise.reject(new Error(
                  `Unable to guess GitHub repository in ${ args.path }.\n` +
                  'Please specify the GitHub repository by using "--github-repository" option'
                ));
            });
      
      return githubPromise
        .then(githubRepository => {          
          return yaml.decode(yamlContent)
            .then(travisConfig => {
              
              // @todo implement encryption...
              console.log('githubRepository', githubRepository);//@todo remove
              console.log('travisConfig', travisConfig);//@todo remove
              
              return Promise.resolve(travisConfig);
            })
            .then(travisConfig => {
              return yaml.encode(travisConfig);
            });
        });
    });
  }
  
  return dumper.dump(options.overwrite);
};
