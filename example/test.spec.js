const Test = require('./lib/test');
const chai = require('chai');

describe('Suite for Test', () => {
  const instance = new Test();
  
  // it('testMethod()', () => {
  //   chai.expect(instance.testMethod()).to.be.equal(true);
  // });
  
  it('testStaticGetter', done => {
    setTimeout(() => {
      chai.expect(Test.testStaticGetter).to.be.equal(true);
      done();
    }, 300);
  });
});
