'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const emitEvents = require('recink/src/component/emit/events');
const SequentialPromise = require('recink/src/component/helper/sequential-promise');
const CacheFactory = require('recink/src/component/cache/factory');
const Terraform = require('./terraform');
const Reporter = require('./reporter');
const path = require('path');
const Diff = require('./diff');
const { getFilesByPattern } = require('./helper/util');

/**
 * Terraform component
 */
class TerraformComponent extends DependantConfigBasedComponent {
  /**
   * @param {*} args 
   */
  constructor(...args) {
    super(...args);

    this._reporter = null;
    this._noChanges = true;
    this._runStack = {};
    this._diff = new Diff();
    this._caches = {};
  }

  /**
   * @returns {string}
   */
  get name() {
    return 'terraform';
  }
  
  /**
   * Add the components Terraform depends on
   *
   * @returns {string[]}
   */
  get dependencies() {
    return [ 'emit' ];
  }

  /**
   * @param {EmitModule} emitModule 
   *
   * @returns {string}
   *
   * @private
   */
  _moduleRoot(emitModule) {
    return emitModule.container.get('root', null);
  }

  /**
   * @param {EmitModule} emitModule 
   * @returns {Promise}
   * @private
   */
  _isTerraformModule(emitModule) {
    let terraformFiles = getFilesByPattern(this._moduleRoot(emitModule), /.*\.tf$/);

    return Promise.resolve(terraformFiles.length > 0);
  }

  /**
  * @param {Emitter} emitter
  *
  * @returns {Promise}
  */
  init(emitter) {
    this._reporter = new Reporter(emitter, this.logger);

    return Promise.resolve();
  }
  
  /**
   * @param {Emitter} emitter
   *
   * @returns {Promise}
   */
  run(emitter) {
    const terraformModules = [];

    return new Promise((resolve, reject) => {
      emitter.onBlocking(emitEvents.module.process.start, emitModule => {
        return this._isTerraformModule(emitModule)
          .then(isTerraform => {
            if (!isTerraform) {
              return Promise.resolve();
            }

            terraformModules.push(emitModule);
  
            return Promise.resolve();
          });
      });

      emitter.on(emitEvents.modules.process.end, () => {
        this._diff.load()
          .catch(error => {
            this.logger.warn(
              this.logger.emoji.cross,
              `Failed to calculate git diff: ${ error }.`
            );
          })
          .then(() => this._initCaches(emitter, terraformModules))
          .then(() => {
            return Promise.all(
              terraformModules.map(emitModule => {
                return this._loadCache(emitModule).then(() => {
                  this.logger.debug(`Cache for module "${ emitModule.name }" downloaded.`);
                  return this._terraformate(emitModule);
                });
              })
            );
          })
          .then(() => {
            return SequentialPromise.all(
              this._normalizedRunStack.map(item => {
                const { emitModule, changed } = item;
    
                return () => {
                  if (changed) {
                    this.logger.info(this.logger.emoji.check, `Starting Terraform in module "${ emitModule.name }".`);
    
                    return this._dispatchModule(emitModule)
                      .then(() => {
                        return this._uploadCache(emitModule)
                          .catch(error => {
                            this.logger.warn(
                              this.logger.emoji.cross,
                              `Failed to upload caches for Terraform module "${ emitModule.name }": ${ error }.`
                            );

                            return Promise.resolve();
                          });
                      })
                      .catch(error => {

                        // Upload caches even if apply failed
                        return this._uploadCache(emitModule)
                          .catch(cacheError => {
                            this.logger.warn(
                              this.logger.emoji.cross,
                              `Failed to upload caches for Terraform module "${ emitModule.name }": ${ cacheError }.`
                            );

                            return Promise.reject(error);
                          })
                          .then(() => Promise.reject(error));
                      });
                  } else {
                    this.logger.info(
                      this.logger.emoji.cross,
                      `Skip running Terraform in module "${ emitModule.name }". No changes Detected.`
                    );
    
                    return Promise.resolve();
                  }
                };
              })
            );
          })
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }

  /**
   * @param {Emitter} emitter
   * @param {EmitModule[]} terraformModules
   *
   * @returns {Promise}
   *
   * @private
   */
  _initCaches(emitter, terraformModules) {
    if (!this._cacheEnabled(emitter)) {
      return Promise.resolve();
    }

    terraformModules.forEach(emitModule => {
      this._caches[emitModule.name] = this._cache(emitter, emitModule);
    });

    return Promise.resolve();
  }

  /**
   * @param {EmitModule} emitModule 
   *
   * @returns {Promise}
   *
   * @private
   */
  _loadCache(emitModule) {
    if (!this._caches.hasOwnProperty(emitModule.name)) {
      return Promise.resolve();
    }

    this.logger.info(
      this.logger.emoji.check,
      `Downloading caches for Terraform module "${ emitModule.name }".`
    );

    return this._caches[emitModule.name].download().then(debug => {
      this.logger.debug(JSON.stringify(debug));
      return Promise.resolve();
    });
  }

  /**
   * @param {EmitModule} emitModule 
   *
   * @returns {Promise}
   *
   * @private
   */
  _uploadCache(emitModule) {
    if (!this._caches.hasOwnProperty(emitModule.name)) {
      return Promise.resolve();
    }

    this.logger.info(
      this.logger.emoji.check,
      `Uploading caches for Terraform module "${ emitModule.name }".`
    );

    return this._caches[emitModule.name].upload();
  }

  /**
   * @param {Emitter} emitter
   * @param {EmitModule} emitModule 
   *
   * @returns {AbstractDriver|S3Driver}
   *
   * @private
   */
  _cache(emitter, emitModule) {
    const rootPath = this._moduleRoot(emitModule);
    const cacheComponent = emitter.component('cache');
    const options = [].concat(cacheComponent.container.get('options', []));
    const driverName = cacheComponent.container.get('driver');
    const resource = emitModule.container.get('terraform.resource', Terraform.RESOURCE)
      || this.container.get('resource', Terraform.RESOURCE);
    const resourcePath = path.join(rootPath, resource);

    // @todo abstract the way cache behavior hooked
    if (driverName === 's3' && options.length >= 1) {
      options[0] = `${ options[0] }/${ emitModule.name }`;
    }

    const driver = CacheFactory.create(driverName, resourcePath, ...options);

    // @todo abstract the way cache behavior hooked
    if (driverName === 's3') {
      driver._includeNodeVersion = false;
    }

    return driver;
  }

  /**
   * @param {Emitter} emitter
   * @returns {Boolean}
   * @private
   */
  _cacheEnabled(emitter) {
    return this.container.get('use-cache', true) && !!emitter.component('cache');
  }

  /**
  * @param {Emitter} emitter
  * @returns {Promise}
  */
  teardown(emitter) {
    this._noChanges = true;
    this._runStack = {};
    this._caches = {};

    return Promise.resolve();
  }

  /**
   * @returns {Function[]}
   *
   * @private
   */
  get _normalizedRunStack() {
    this._validateRunStack();

    let it;
    const maxIt = 9999999;
    const modulesNames = Object.keys(this._runStack);

    for(it = 0; it < maxIt; it++) {
      let normalized = false;

      for (let i = 0; i < modulesNames.length; i++) {
        const { after } = this._runStack[modulesNames[i]];
        const checkVector = modulesNames.slice(i);
        const moveModuleName = after.filter(m => checkVector.includes(m)).pop();

        if (moveModuleName) {
          normalized = true;
          const moveIndex = modulesNames.indexOf(moveModuleName);
          const originModuleName = modulesNames[i];

          modulesNames[i] = moveModuleName;
          modulesNames[moveIndex] = originModuleName;

          break;
        }
      }

      if (!normalized) {
        break;
      }
    }

    if (it >= maxIt) {
      throw new Error(
        `Maximum stack of ${ maxIt } exceeded while normalizing Terraform dependencies vector`
      );
    }

    return modulesNames.map(moduleName => {
      return this._runStack[moduleName];
    });
  }

  /**
   * @throws {Error}
   *
   * @private
   */
  _validateRunStack() {
    const extraneous = {};
    const available = Object.keys(this._runStack);

    available.forEach(moduleName => {
      const { after } = this._runStack[moduleName];

      const extraneousModules = after.filter(m => !available.includes(m));

      if (extraneousModules.length > 0) {
        extraneous[moduleName] = extraneousModules;
      }
    });

    if (Object.keys(extraneous).length > 0) {
      const extraneousVector = Object.keys(extraneous).map(moduleName => {
        return `<[${ moduleName }]> ${ extraneous[moduleName].join(', ') }`;
      });
      const extraneousInfo = extraneousVector.join('\n\t');

      throw new Error(
        `Terraform detected extraneous modules dependencies:\n\t${ extraneousInfo }`
      );
    }
  }

  /**
   * @param {EmitModule} emitModule
   *
   * @returns {Promise}
   *
   * @private
   */
  _terraformate(emitModule) {
    return this._hasChanges(emitModule).then(changed => {
      const after = emitModule.container.get('terraform.run-after', []);

      this._runStack[emitModule.name] = { emitModule, after, changed };

      return Promise.resolve();
    });
  }

  /**
   * Get main or extended by module parameter
   * @param {EmitModule} module
   * @param {String} parameter
   * @param {String|Object|Array} defaultValue
   * @return {*}
   * @private
   */
  _parameterFromConfig(module, parameter, defaultValue) {
    let result = defaultValue;
    let mainCfg = this.container.get(parameter, defaultValue);
    let moduleCfg = module.container.get(`terraform.${parameter}`, defaultValue);

    switch ((defaultValue).constructor) {
      case String:
        result = (moduleCfg === defaultValue) ? mainCfg : moduleCfg;
        break;
      case Object:
        result = Object.assign({}, mainCfg, moduleCfg);
        break;
      case Array:
        result = moduleCfg.length ? moduleCfg : mainCfg;
        break;
    }

    return result;
  }

  /** 
   * @param {EmitModule} emitModule 
   * @returns {Promise}
   * @private
   */
  _dispatchModule(emitModule) {
    const version = this._parameterFromConfig(emitModule, 'version', Terraform.VERSION);
    const terraform = new Terraform(
      this._parameterFromConfig(emitModule, 'vars', {}),
      this._parameterFromConfig(emitModule, 'binary', Terraform.BINARY),
      this._parameterFromConfig(emitModule, 'resource', Terraform.RESOURCE),
      this._parameterFromConfig(emitModule, 'var-files', [])
    );

    terraform.setLogger(this.logger);
    this.logger.debug(`Terraform version - "${ version }".`);

    return terraform.ensure(version)
      .then(() => this._init(terraform, emitModule))
      .then(() => this._pullState(terraform, emitModule))
      .then(() => this._plan(terraform, emitModule))
      .then(() => this._apply(terraform, emitModule))
      .then(() => this._destroy(terraform, emitModule));
  }

  /**
   * @param {EmitModule} emitModule
   *
   * @returns {Promise}
   *
   * @private 
   */
  _hasChanges(emitModule) {
    const rootPath = this._moduleRoot(emitModule);
    const dependencies = emitModule.container.get('terraform.dependencies', [])
      .map(dep => path.isAbsolute(dep) ? dep : path.resolve(rootPath, dep));

    return Promise.resolve(
      this._diff.match(...[ rootPath ].concat(dependencies))
    );
  }

  /**
   * @param {Terraform} terraform 
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _init(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform init" in "${ emitModule.name }".`
    );

    if (!this._parameterFromConfig(emitModule, 'init', true)) {
      return this._handleSkip(emitModule, 'init');
    }

    return terraform
      .init(this._moduleRoot(emitModule))
      .catch(error => this._handleError(emitModule, 'init', error));
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @return {Promise}
   * @private
   */
  _pullState(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform state pull" in "${ emitModule.name }".`
    );

    return terraform
      .pullState(this._moduleRoot(emitModule))
      .catch(error => this._handleError(emitModule, 'init', error));
  }

  /**
   * @param {Terraform} terraform 
   * @param {EmitModule} emitModule
   *
   * @returns {Promise}
   *
   * @private
   */
  _plan(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform plan" in "${ emitModule.name }".`
    );

    const enabled = emitModule.container.has('terraform.plan') 
      ? emitModule.container.get('terraform.plan')
      : this.container.get('plan', true);

    if (!enabled) {
      return this._handleSkip(emitModule, 'plan');
    }

    return terraform
      .plan(this._moduleRoot(emitModule))
      .then(plan => this._handlePlan(terraform, emitModule, plan))
      .catch(error => this._handleError(emitModule, 'plan', error));
  }

  /**
   * @param {Terraform} terraform 
   * @param {EmitModule} emitModule
   *
   * @returns {Promise}
   *
   * @private
   */
  _apply(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform apply" in "${ emitModule.name }".`
    );

    const enabled = emitModule.container.has('terraform.apply') 
      ? emitModule.container.get('terraform.apply')
      : this.container.get('apply', false);

    if (!enabled) {
      return this._handleSkip(emitModule, 'apply');
    } else if (this._noChanges) {
      return this._handleSkip(emitModule, 'apply', 'No Apply Changes Detected');
    }

    return terraform
      .apply(this._moduleRoot(emitModule))
      .then(state => this._handleApply(terraform, emitModule, state))
      .catch(error => this._handleError(emitModule, 'apply', error));
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   *
   * @returns {Promise}
   *
   * @private
   */
  _destroy(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform destroy" in "${ emitModule.name }".`
    );

    const enabled = emitModule.container.has('terraform.destroy')
      ? emitModule.container.get('terraform.destroy')
      : this.container.get('destroy', false);

    if (!enabled) {
      return this._handleSkip(emitModule, 'destroy');
    }

    return terraform
      .destroy(this._moduleRoot(emitModule))
      .then(state => this._handleDestroy(terraform, emitModule, state))
      .catch(error => this._handleError(emitModule, 'destroy', error));
  }

  /**
   * @param {EmitModule} emitModule
   * @param {string} command
   * @param {Error} error
   *
   * @returns {Promise}
   *
   * @private
   */
  _handleError(emitModule, command, error) {
    return this._reporter.report(`
### \`${ emitModule.name }\` returned an error executing \`terraform ${ command }\`

\`\`\`
${ error.toString().trim() }
\`\`\`
    `).then(() => Promise.reject(error));
  }

  /**
   * @param {EmitModule} emitModule
   * @param {string} command
   * @param {string} reason
   *
   * @returns {Promise}
   *
   * @private
   */
  _handleSkip(emitModule, command, reason = null) {
    const reasonMsg = reason ? `Reason - "${ reason }" ...` : '';

    return this._reporter.report(`
### \`${ emitModule.name }\` skipped executing \`terraform ${ command }\`

${ reasonMsg }
    `);
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @param {Plan} plan
   *
   * @returns {Promise}
   *
   * @private 
   */
  _handlePlan(terraform, emitModule, plan) {
    // @todo move this...
    this._noChanges = !plan.changed;

    return terraform.show(plan)
      .then(output => {
        return this._reporter.report(`
### \`${ emitModule.name }\` returned below output while executing \`terraform plan\`

${ plan.changed ? '' : 'No Plan Changes Detected' }

\`\`\`
${ output }
\`\`\`
        `);
      });
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @param {State} state
   *
   * @returns {Promise}
   *
   * @private 
   */
  _handleApply(terraform, emitModule, state) {
    return terraform.show(state)
      .then(output => {
        return this._reporter.report(`
### \`${ emitModule.name }\` returned below output while executing \`terraform apply\`

\`\`\`
${ output }
\`\`\`
        `);
      });
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @param {State} state
   *
   * @returns {Promise}
   *
   * @private
   */
  _handleDestroy(terraform, emitModule, state) {
    return terraform.show(state)
      .then(output => {
        return this._reporter.report(`
### \`${ emitModule.name }\` returned below output while executing \`terraform destroy\`

\`\`\`
${ output }
\`\`\`
        `);
      });
  }

}

module.exports = TerraformComponent;
