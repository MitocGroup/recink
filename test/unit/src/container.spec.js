'use strict';

const Container = require('../../../src/container');
const chai = require('chai');

describe('Test Container', () => {
  const container = new Container({
    a: 1,
    b: {
      c: 2,
    },
  });
  
  it('Test get() with one level key', () => {
    chai.expect(container.get('a')).to.be.equal(1);
  });
  
  it('Test get() with multi level key', () => {
    chai.expect(container.get('b.c')).to.be.equal(2);
  });
  
  it('Test get() to return default value', () => {
    chai.expect(container.get('x', 'default')).to.be.equal('default');
  });
});
