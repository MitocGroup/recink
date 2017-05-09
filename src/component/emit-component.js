'use strict';

const ConfigBasedComponent = require('./config-based-component');
const EmitModule = require('./emit/emit-module');
const events = require('./emit/events');

class EmitComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
    
    this._modules = [];
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'emit';
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * @param {string} path
   *
   * @returns {Promise|*}
   */
  waitConfig(emitter) {
    return super.waitConfig(emitter)
      .then(container => {
        const emitModules = [];
        
        emitter.container.listKeys()
          .filter(key => key !== ConfigBasedComponent.MAIN_CONFIG_KEY)
          .map(moduleKey => {
            const emitModule = new EmitModule(
              moduleKey, 
              emitter.container.get(moduleKey),
              emitter,
              this.logger
            );
            
            emitModules.push(moduleKey);
            this._modules.push(emitModule);
          });
        
        if (emitModules.length > 0) {
          this.logger.info(
            this.logger.emoji.gift,
            `Modules to emit - ${ emitModules.join(', ') }`
          );
        }
        
        return Promise.resolve(container);
      });
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * 
   * @returns {Promise|*}
   */
  run(emitter) {
    this._registerDebugers(emitter);
    
    return Promise.all(this._modules.map(module => {
      emitter.emit(events.module.process.start, module, this.container);

      return module.process(this.container)
        .then(() => {
          emitter.emit(events.module.process.end, module);
        });
    }));
  }
  
  /**
   * @param {*} config
   *
   * @returns {Container|*}
   */
  prepareConfig(config) {
    const container = super.prepareConfig(config);
    
    if (container.has('pattern')) {
      const patterns = Array.isArray(container.get('pattern')) 
        ? container.get('pattern') 
        : [ container.get('pattern') ];
        
      container.has('pattern');
    }
    
    return container;
  }
  
  /**
   * @param {EventEmitter|*} emitter
   * 
   * @private
   */
  _registerDebugers(emitter) {
    emitter.on(events.module.process.start, (module, container) => {
      this.logger.info(
        this.logger.emoji.diamond, 
        `Start processing module ${ module.name }`
      );
      this.logger.debug(JSON.stringify(container.raw, null, '  '));
    });
    
    emitter.on(events.module.process.end, module => {
      this.logger.info(
        this.logger.emoji.diamond, 
        `End processing module ${ module.name }`
      );
      this.logger.debug(JSON.stringify(module.stats, null, '  '));
    });
  }
}

module.exports = EmitComponent;