'use strict';

const Emitter = require('../../../src/emitter');
const chai = require('chai');
const sinon = require('sinon');

describe('Test Emitter', () => {
  it('Test emitBlocking() to trigger both onBlocking() and on()', done => {
    const emitter = new Emitter();
    const cb = sinon.spy();
    
    emitter.onBlocking('test', cb);
    emitter.on('test', cb);
    
    emitter.emitBlocking('test')
      .then(() => {
        chai.expect(cb.calledTwice).to.be.true;
        
        done();
      })
      .catch(e => done(e));
  });
});
