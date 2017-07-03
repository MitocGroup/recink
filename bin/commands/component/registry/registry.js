'use strict';

const os = require('os');
const path = require('path');
const FileStorage = require('./storage/file-storage');
const Component = require('./component');

/**
 * Components Registry
 */
class Registry {
  /**
   * @param {AbstractStorage} storage
   */
  constructor(storage) {
    this._storage = storage;
    this._registry = {};
  }
  
  /**
   * @param {string} component
   *
   * @returns {boolean}
   */
  exists(component) {
    return this._registry.hasOwnProperty(component);
  }
  
  /**
   * @param {string} component
   *
   * @returns {Promise}
   */
  add(component) {
    this._registry[component] = new Component(component);
    
    return this._registry[component].load();
  }
  
  /**
   * @param {string} component
   *
   * @returns {Registry}
   */
  remove(component) {
    if (!this.exists(component)) {
      return this;
    }
    
    delete this._registry[component];
    
    return this;
  }
  
  /**
   * @returns {Promise}
   */
  persist() {
    return this.storage.write(this._registry);
  }
  
  /**
   * @returns {Promise}
   */
  load() {
    return this.storage.exists()
      .then(exists => {
        return exists 
          ? Promise.resolve() 
          : this.storage.write(this._registry);
      })
      .then(() => this.storage.read())
      .then(registry => {
        this._registry = registry;
        
        return Promise.resolve();
      });
  }
  
  /**
   * @returns {AbstractStorage} storage
   */
  get storage() {
    return this._storage;
  }
  
  /**
   * @param {string} storagePath
   *
   * @returns {Registry}
   */
  static create(storagePath = Registry.DEFAULT_STORAGE_PATH) {
    return new Registry(new FileStorage(storagePath));
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_STORAGE_PATH() {
    return path.join(os.homedir(), '.recink');
  }
}

module.exports = Registry;
