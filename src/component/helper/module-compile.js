'use strict';

const Module = require('module');

/**
 * Overwrites original Module to apply compilers
 */
class ModuleCompile {
  /**
   * @param {*} compilers
   */
  constructor(...compilers) {
    this._compilers = compilers;
    this._originalCompile = Module.prototype._compile;
  }
  
  /**
   * @returns {Function}
   */
  get originalCompile() {
    return this._originalCompile;
  }
  
  /**
   * @returns {Function[]}
   */
  get compilers() {
    return this._compilers
      .filter(c => c && c instanceof Function)
      .concat([ this.originalCompile ]);
  }
  
  /**
   * @param {Function} compiler
   *
   * @returns {ModuleCompile}
   */
  add(compiler) {
    this._compilers.push(compiler);
    
    return this;
  }
  
  /**
   * @param {Function} compiler
   *
   * @returns {ModuleCompile}
   */
  remove(compiler) {
    delete this._compilers[this._compilers.indexOf(compiler)];
    
    return this;
  }
  
  /**
   * @param {boolean} clearCache
   * 
   * @returns {ModuleCompile}
   */
  register(clearCache = true) {
    const self = this;
    
    if (clearCache) {
      this.clearCache();
    }
    
    Module.prototype._compile = function(content, filename) {
      return self.compilers
        .reduce((content, compiler) => {
          return compiler.call(this, content, filename);
        }, content);
    };
    
    return this;
  }
  
  /**
   * @param {string} cacheKey
   * 
   * @returns {ModuleCompile}
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      delete require.cache[cacheKey];
      
      return this;
    }
    
    Object.keys(require.cache).map(cacheKey => {
      delete require.cache[cacheKey];
    });
    
    return this;
  }
  
  /**
   * @returns {ModuleCompile}
   */
  restore() {
    Module.prototype._compile = this.originalCompile;
    
    return this;
  }
}

module.exports = ModuleCompile;
