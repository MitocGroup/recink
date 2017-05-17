'use strict';

const print = require('print');
const path = require('path');
const ConfigBasedComponent = require('./config-based-component');
const EmitModule = require('./emit/emit-module');
const events = require('./emit/events');
const ContainerTransformer = require('./helper/container-transformer');
const SequentialPromise = require('./helper/sequential-promise');

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
   * @param {Emitter} emitter
   * 
   * @returns {promise}
   */
  run(emitter) {
    this._registerDebugers(emitter);
    
    emitter.emit(events.modules.process.start, this._modules, this.container);
    
    return SequentialPromise.all(this._modules.map(module => {
      return () => {
        emitter.emit(events.module.process.start, module, this.container);
        
        return module.process(this.container)
          .then(() => {
            emitter.emit(events.module.process.end, module);
          });
      };
    })).then(() => {
      emitter.emit(events.modules.process.end, this._modules, this.container);
    });
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {promise}
   */
  waitConfig(emitter) {
    return super.waitConfig(emitter)
      .then(container => {
        const moduleKeys = emitter.container.listKeys()
          .filter(key => key !== ConfigBasedComponent.MAIN_CONFIG_KEY);
        
        if (moduleKeys.length <= 0) {
          return Promise.resolve(container);
        }
        
        return Promise.all(moduleKeys.map(moduleKey => {
          return this.prepareModuleConfig(
            emitter.container.get(moduleKey),
            container
          ).then(moduleContainer => {
            const emitModule = new EmitModule(
              moduleKey, 
              moduleContainer,
              emitter,
              this.logger
            );
            
            this._modules.push(emitModule);
          });
        })).then(() => {
          this.logger.info(
            this.logger.emoji.gift,
            `Modules to emit - ${ moduleKeys.join(', ') }`
          );
          
          return Promise.resolve(container);
        });
      });
  }
  
  /**
   * @param {*} config
   * @param {string} configFile
   *
   * @returns {Container}
   */
  prepareConfig(config, configFile) {
    return super.prepareConfig(config, configFile)
      .then(container => {
        return (new ContainerTransformer(container))
          .addPattern('pattern')
          .addPattern('ignore')
          .transform();
      });
  }
  
  /**
   * @param {*} moduleConfig
   * @param {Container} mainContainer
   *
   * @returns {Container}
   */
  prepareModuleConfig(moduleConfig, mainContainer) {
    const container = this.createContainer(moduleConfig);
    
    return (new ContainerTransformer(container))
      .add({
        path: 'root',
        transformer: value => {
          if (path.isAbsolute(value)) {
            return Promise.resolve(value);
          }
          
          return Promise.resolve(
            path.join(mainContainer.get('__dir'), value)
          );
        },
      })
      .transform();
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @private
   */
  _registerDebugers(emitter) {
    emitter.on(events.modules.process.start, (modules, container) => {
      this.logger.info(
        this.logger.emoji.diamond, 
        `Start processing modules - ${ modules.map(m => m.name).join(', ') }`
      );

      this.logger.debug(container.dump());
    });
    
    emitter.on(events.modules.process.end, modules => {
      this.logger.info(
        this.logger.emoji.magic, 
        `Finish processing modules - ${ modules.map(m => m.name).join(', ') }`
      );
    });
    
    emitter.on(events.module.process.start, module => {
      this.logger.debug(`Start processing module ${ module.name }`);
      this.logger.debug(module.container.dump());
    });
    
    emitter.on(events.module.process.end, module => {
      this.logger.debug(`Finish processing module ${ module.name }`);
      this.logger.debug(module.dumpStats());
    });
  }
}

module.exports = EmitComponent;
