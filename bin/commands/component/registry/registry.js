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
    return this.registry.hasOwnProperty(component);
  }
  
  /**
   * @returns {*}
   */
  get registry() {
    return this._registry;
  }
  
  /**
   * @returns {Component[]}
   */
  list() {
    return this.listKeys().map(component => this.registry[component]);
  }
  
  /**
   * @returns {string[]}
   */
  listKeys() {
    return Object.keys(this.registry);
  }
  
  /**
   * @param {string} component
   * 
   * @returns {Component}
   */
  component(component) {
    if (!this.exists(component)) {
      return null;
    }
    
    return this.registry[component];
  }
  
  /**
   * @param {string} component
   *
   * @returns {Promise}
   */
  add(component) {
    this.registry[component] = new Component(component);
    
    return this.registry[component].load();
  }
  
  /**
   * @returns {string[]}
   */
  get configs() {
    return this.list()
      .map(component => component.configPath)
      .filter(Boolean);
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
    
    delete this.registry[component];
    
    return this;
  }
  
  /**
   * @returns {Promise}
   */
  persist() {
    return this.storage.write(this.registry);
  }
  
  /**
   * @returns {Promise}
   */
  load() {
    return this.storage.exists()
      .then(exists => {
        return exists 
          ? Promise.resolve() 
          : this.storage.write(this.registry);
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
   * @param {string} namespace
   *
   * @returns {Registry}
   */
  static create(storagePath = Registry.DEFAULT_STORAGE_PATH, namespace = null) {
    return new Registry(new FileStorage(storagePath, namespace));
  }
  
  /**
   * @returns {string}
   */
  static get DEFAULT_STORAGE_PATH() {
    return path.join(os.homedir(), '.recink');
  }
}

module.exports = Registry;
