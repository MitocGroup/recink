'use strict';

const SandboxedModule = require('sandboxed-module');

/**
 * Overwrites original Module to apply compilers
 */
class ModuleCompile {
  /**
   * @param {string} moduleId
   * @param {*} stubs
   * @param {Function[]} compilers
   *
   * @returns {*}
   */
  static require(moduleId, stubs = {}, ...compilers) {
    return SandboxedModule.require(moduleId, {
      requires: stubs,
      sourceTransformers: compilers.map(compiler => {
        return function (source) {
          const { filename } = this;

          return compiler(source, filename);
        };
      }),
    });
  }
}

module.exports = ModuleCompile;
