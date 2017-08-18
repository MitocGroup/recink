'use strict';

const Container = require('../../../../../src/container');
const Emitter = require('../../../../../src/emitter');
const events = require('../../../../../src/component/emit/events');
const chai = require('chai');
const path = require('path');
const sinon = require('sinon');
const { PassThrough } = require('stream');
const ModuleCompile = require('../../../../../src/component/helper/module-compile');

describe('Test EmitModule', () => {
  const emptyCb = () => {};
  const logger = { warn: emptyCb, debug: emptyCb, emoji: {} };
  const emitter = new Emitter();
  const container = new Container({ root: '.' });
  
  let pathExists = true;
  
  const stream = new PassThrough();
  const EmitModule = ModuleCompile.require(
    path.join(__dirname, '../../../../../src/component/emit/emit-module'),
    {
      'fs-extra': { pathExists () { return Promise.resolve(pathExists) } },
      'readdir-enhanced': { stream() { return stream } },
    }
  );
  
  it('Test check()', done => {
    const emitModule = new EmitModule('test', container, emitter, logger);
    
    emitModule.check()
      .catch(error => Promise.resolve(error))
      .then(result => {
        chai.expect(result).to.be.undefined;
        
        done();
      })
      .catch(error => done(error));
  });
  
  it('Test check() with missing module root', done => {
    pathExists = false;
    const emitModule = new EmitModule('test', container, emitter, logger);
    
    emitModule.check()
      .catch(error => Promise.resolve(error))
      .then(result => {
        chai.expect(result).to.not.be.undefined;
        
        done();
      })
      .catch(error => done(error));
  });
  
  it('Test process()', done => {
    const emitModule = new EmitModule('test', container, emitter, logger);
    const assets = [
      'lib/test.js',
      'bin/cli.js',
    ];
    const cb = sinon.spy();
    
    emitter.onBlocking(events.module.emit.asset, cb);
    
    const promise = emitModule.process(container);
    
    assets.map(asset => stream.write(asset));
    
    stream.end();
    
    promise
      .then(() => {
        chai.expect(cb.calledTwice).to.be.true;
        
        done();
      })
      .catch(error => done(error));
  });
});
