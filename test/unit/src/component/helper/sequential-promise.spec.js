'use strict';

// const SequentialPromise = require('../../../../../src/component/helper/sequential-promise');
const chai = require('chai');

describe('Unit Healthcheck', () => {
  it('Test chai to be an object', () => {
    chai.expect(chai).to.be.an('object');
  });
});


// describe('Test SequentialPromise', () => {
//   it('Test all()', done => {
//     let i = 0;
//
//     SequentialPromise.all([
//       i => {
//         return new Promise(resolve => {
//           setTimeout(() => {
//             chai.expect(i).to.be.eql(0);
//
//             resolve(i + 1);
//           }, 100);
//         });
//       },
//       i => {
//         chai.expect(i).to.be.eql(1);
//
//         return Promise.resolve(i + 1);
//       },
//     ], i)
//     .then(i => {
//       chai.expect(i).to.be.eql(2);
//
//       done();
//     })
//     .catch(error => done(error));
//   });
// });
