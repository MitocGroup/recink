const chai = require('chai');

describe('Unit Healthcheck', () => {
  it('Test chai to be an object', () => {
    chai.expect(chai).to.be.an('object');
  });
});
