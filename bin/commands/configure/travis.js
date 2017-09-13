'use strict';

/* eslint max-len: 0 */

const travis = require('./helper/travis');
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
  const githubUsername = options.githubUsername;
  const githubPassword = options.githubPassword;
  const githubToken = options.githubToken;
  
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
  
  const dumper = new Dumper(
    path.join(__dirname, '../../templates', travis.file),
    path.join(args.path, travis.file),
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
        .then(repo => {          
          return yaml.decode(yamlContent)
            .then(travisConfig => {              
              const dataVector = [
                travis.dump(travis.vars.AWS_ACCESS_KEY_ID, accessKeyId),
                travis.dump(travis.vars.AWS_SECRET_ACCESS_KEY, secretAccessKey),
              ];
              
              if (region) {
                dataVector.push(travis.dump(travis.vars.AWS_DEFAULT_REGION, region));
              }
              
              const payload = { repo, data: dataVector.join(' ') };
              
              if (githubUsername && githubPassword) {
                payload.username = githubUsername;
                payload.password = githubPassword;
              } else if (githubToken) {
                payload.token = githubToken;
              }

              return pify(encrypt)(payload)
                .then(encryptedData => {                  
                  logger.info(travis.help());
                  
                  travisConfig.env = {
                    global: [
                      { secure: encryptedData },
                    ],
                  };
                  
                  return Promise.resolve(travisConfig);
                })
                .catch(error => {
                  if (error.file && error.file === 'not found') {
                    error = new Error(
                      `GitHub repository ${ repo } is either missing from Travis CI or Travis CI Pro.\n` +
                      'Please note that if you are using Travis CI Pro you have to provide GitHub credentials or access token, ' +
                      'otherwise please do NOT specify credentials or access token options!\n\n' +
                      'For help menu on configuring Travis Pro credentials or access token run: recink configure travis --help.\n\n' +
                      'See how to setup you GitHub repository https://docs.travis-ci.com/user/getting-started#To-get-started-with-Travis-CI%3A'
                    );
                  }
                  
                  return Promise.reject(error);
                });
            })
            .then(travisConfig => {
              return yaml.encode(travisConfig);
            });
        });
    });
  }
  
  return dumper.dump(options.overwrite);
};
