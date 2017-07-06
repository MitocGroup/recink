'use strict';

const Container = require('../../../../../src/container');
const ContainerTransformer = require('../../../../../src/component/helper/container-transformer');
const Transformer = require('../../../../../src/component/helper/transformer');
const chai = require('chai');

describe('Test ContainerTransformer', () => {
  const emptyCb = () => {};
  const container = new Container({
    a: '/[a-z]/',
    b: {
      c: 'test',
    },
  });
  
  it('Test create()', () => {
    const containerTransformer = new ContainerTransformer(container);
    const transformer = containerTransformer.create('a', emptyCb);
    
    chai.expect(transformer).to.be.an.instanceof(Transformer);
  });
  
  it('Test add()', () => {
    const containerTransformer = new ContainerTransformer(container);
    const transformer = containerTransformer.create('a', emptyCb);
    
    containerTransformer.add(transformer);
    containerTransformer.add({ path: 'a', transformer: emptyCb });
    
    chai.expect(containerTransformer.transformers).to.have.lengthOf(2);
    chai.expect(containerTransformer.transformers[0]).to.be.eql(transformer);
    chai.expect(containerTransformer.transformers[1]).to.have.property('path', 'a');
    chai.expect(containerTransformer.transformers[1]).to.have.property('transformer', emptyCb);
  });
  
  it('Test transform()', done => {
    const containerTransformer = new ContainerTransformer(container);
    
    containerTransformer.addPattern('a');
    containerTransformer.add({
      path: 'b.c', 
      transformer: value => {
        chai.expect(value).to.be.eql('test');
        
        return Promise.resolve('test-transformed');
      },
    });
    
    containerTransformer.transform()
      .then(container => {
        chai.expect(container.get('a')).to.be.an('array');
        chai.expect(container.get('a')[0]).to.be.an('regexp');
        chai.expect(container.get('a')[0].test('b')).to.be.true;
        chai.expect(container.get('a')[0].test('0')).to.be.false;
        chai.expect(container.get('b.c')).to.be.eql('test-transformed');
        
        done();
      })
      .catch(error => done(error));
  });
});
