'use strict';

const ConfigBasedComponent = require('../../../../src/component/config-based-component');
const Emitter = require('../../../../src/emitter');
const Container = require('../../../../src/container');
const chai = require('chai');

class CoolComponent extends ConfigBasedComponent {
  /**
   * @returns {string}
   */
  get name() {
    return 'cool';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return Promise.resolve(this.container.get('name'));
  }
}

describe('Test ConfigBasedComponent', () => {
  const component = new CoolComponent();
  const emitter = new Emitter();
  const container = new Container({
    $: {
      cool: {
        name: 'John',
      },
    },
  });
  
  it('Test name', () => {
    chai.expect(component.name).to.be.eql('cool');
  });
  
  it('Test subscribe() and run()', done => {
    component.subscribe(emitter)
      .then(() => {
        emitter.emit(component.events.config.load, container, '.recink.yml');
        
        return component.ready();
      })
      .then(() => {
        chai.expect(component.isActive).to.be.true;
        
        return component.run(emitter)
          .then(result => {
            chai.expect(result).to.be.eql('John');
            
            return Promise.resolve();
          });
      })
      .then(() => done())
      .catch(error => done(error));
  });
});
