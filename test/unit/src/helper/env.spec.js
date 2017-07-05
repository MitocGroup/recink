'use strict';

const Env = require('../../../../src/helper/env');
const chai = require('chai');

describe('Test Env', () => {
  process.env.TEST_KEY = '1';
  
  it('Test exists()', () => {
    chai.expect(Env.exists('TEST_KEY')).to.be.true;
    chai.expect(Env.exists('TEST_KEY_0')).to.be.false;
  });
  
  it('Test read()', () => {
    chai.expect(Env.read('TEST_KEY')).to.be.eql('1');
  });
  
  it('Test read() to return default value', () => {
    chai.expect(Env.read('TEST_KEY_0', '0')).to.be.eql('0');
  });
});
