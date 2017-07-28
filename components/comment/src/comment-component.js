'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const ProviderFactory = require('./provider/factory');
const Tail = require('nodejs-tail');
const pify = require('pify');
const fs = require('fs');

/**
 * Comment component
 */
class CommentComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args 
   */
  constructor(...args) {
    super(...args);

    this._provider = null;
    this._tail = null;
  }

  /**
   * @returns {string}
   */
  get name() {
    return 'comment';
  }
  
  /**
   * Add the components Comment depends on
   *
   * @returns {string[]}
   */
  get dependencies() {
    return [];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return Promise.all([
      this._subscribe(emitter),
      this._subscribeFile()
    ]);
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  teardown(emitter) {
    if (!this._tail) {
      return Promise.resolve();
    }

    this._tail.close();

    return Promise.resolve();
  }

  /**
   * @param {string} body 
   * 
   * @returns {Promise}
   */
  comment(body) {
    return this._provider.comment(body);
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _subscribe(emitter) {
    this._provider = ProviderFactory.multi(this);
    const providers = this.container.get('providers', {});
    
    Object.keys(providers).map(name => {
      const args = [ this ].concat(providers[name] || []);
      const provider = ProviderFactory.create(name, ...args);
      
      this._provider.add(provider);
    });

    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   * 
   * @private
   */
  _subscribeFile() {
    const listenFile = this.container.get('listen');

    if (!listenFile) {
      return Promise.resolve();
    }

    this.logger.debug(`Listen for comments in ${ listenFile }`);

    return this._fileExists(listenFile)
      .then(exists => {
        if (!exists) {
          return pify(fs.writeFile)(listenFile, '');
        }

        return pify(fs.readFile)(listenFile)
          .then(initialMessage => {
            return this.comment(initialMessage.toString())
              .catch(error => {
                this.logger.warn(
                  `${ this.logger.emoji.poop } Error adding comment: ${ error }`
                );

                return Promise.resolve();
              });
          });
      })
      .then(() => {
        this._tail = new Tail(listenFile, { ignoreInitial: true });
        
        this._tail.on('line', line => {
          this.comment(line.toString())
            .catch(error => {
              this.logger.warn(
                `${ this.logger.emoji.poop } Error adding comment: ${ error }`
              );
            });
        });

        this._tail.on('close', () => {
          pify(fs.unlink)(listenFile)
            .catch(error => {
              this.logger.warn(
                `${ this.logger.emoji.poop } Unable to unlink ${ listenFile }: ${ error }`
              );
            });
        });
        
        this._tail.watch();

        return Promise.resolve();
      });
  }

  /**
   * @param {string} path
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _fileExists(path) {
    return new Promise(resolve => {
      fs.exists(path, exists => {
        resolve(exists);
      });
    });
  }
}

module.exports = CommentComponent;
