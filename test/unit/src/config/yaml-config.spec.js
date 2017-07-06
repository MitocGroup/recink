'use strict';

const YamlConfig = require('../../../../src/config/yaml-config');
const chai = require('chai');

describe('Test YamlConfig', () => {
  const config = new YamlConfig();
  const yamlObj = { a: Array('b', 'c', 'd') };
  const yaml = 'a:\n  - b\n  - c\n  - d\n';
  
  it('Test decode()', done => {
    config.decode(yaml)
      .then(result => {
        chai.expect(result).to.be.eql(yamlObj);
        
        done();
      })
      .catch(error => done(error));
  });
  
  it('Test encode()', done => {    
    config.encode(yamlObj)
      .then(result => {
        chai.expect(result).to.be.eql(yaml);
        
        done();
      })
      .catch(error => done(error));
  });
});
