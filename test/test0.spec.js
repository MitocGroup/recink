const Test0 = require('./lib/test0');
const chai = require('chai');

describe('Suite for Test0', () => {
  const instance = new Test0();
  
  it('testMethod()', () => {
    chai.expect(instance.testMethod()).to.be.equal(true);
  });
  
  // it('testStaticGetter', done => {
  //   setTimeout(() => {
  //     chai.expect(Test0.testStaticGetter).to.be.equal(true);
  //     done();
  //   }, 300);
  // });
});
