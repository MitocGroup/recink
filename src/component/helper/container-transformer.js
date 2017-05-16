'use strict';

const Transformer = require('./transformer');
const patternTransformer = require('./pattern-transformer');

class ContainerTransformer {
  /**
   * @param {Container} container
   */
  constructor(container) {
    this._container = container;
    this._transformers = [];
  }
  
  /**
   * @param {string} path
   *
   * @returns {ContainerTransformer}
   */
  addPattern(path) {
    return this.add({ path, transformer: patternTransformer });
  }
  
  /**
   * @param {string} path
   * @param {function} transformer
   *
   * @returns {Transformer}
   */
  create(path, transformer) {
    return new Transformer(path, transformer);
  }
  
  /**
   * @param {Transformer} transformerInstance
   *
   * @returns {ContainerTransformer}
   */
  add(transformerInstance) {
    if (!(transformerInstance instanceof Transformer)) {
      const { path, transformer } = transformerInstance;
      
      transformerInstance = this.create(path, transformer);
    }

    this._transformers.push(transformerInstance);
    
    return this;
  }
  
  /**
   * @returns {Transformer[]}
   */
  get transformers() {
    return this._transformers;
  }
  
  /**
   * @returns {promise}
   */
  transform() {
    return Promise.all(this.transformers.map(transformer => {
      if (this.container.has(transformer.path)) {
        return transformer.transform(this.container.get(transformer.path))
          .then(value => {
            this.container.set(transformer.path, value);
            
            return Promise.resolve();
          });
      }
      
      return Promise.resolve();
    })).then(() => Promise.resolve(this.container));
  }
  
  /**
   * @returns {Container}
   */
  get container() {
    return this._container;
  }
}

module.exports = ContainerTransformer;
