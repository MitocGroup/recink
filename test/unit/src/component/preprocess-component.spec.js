'use strict';

const PreprocessComponent = require('../../../../src/component/preprocess-component');
const Emitter = require('../../../../src/emitter');
const chai = require('chai');

describe('Test PreprocessComponent', () => {
  const component = new PreprocessComponent();
  const emitter = new Emitter();
  const config = {
    $: {
      preprocess: {
        '$.cool.name': 'eval',
      },
      cool: {
        name: 'global.process.pid',
      },
    },
  };
  
  // hook to avoid exceptions
  component.logger.debug = (() => {});
  
  it('Test subscribe()', done => {
    component.subscribe(emitter)
      .then(() => emitter.emitBlocking(component.events.config.preprocess, config))
      .then(() => {
        chai.expect(component.isActive).to.be.true;
        chai.expect(config.$.cool.name).to.be.eql(global.process.pid);
        
        done();
      })
      .catch(error => done(error));
  });
});
