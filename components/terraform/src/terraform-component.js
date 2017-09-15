'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const emitEvents = require('recink/src/component/emit/events');
const SequentialPromise = require('recink/src/component/helper/sequential-promise');
const CacheFactory = require('recink/src/component/cache/factory');
const Terraform = require('./terraform');
const Reporter = require('./reporter');
const fse = require('fs-extra');
const path = require('path');
const Diff = require('./diff');

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
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _isTerraformModule(emitModule) {
    const terraformEntryPoint = path.join(
      this._moduleRoot(emitModule), 
      TerraformComponent.TERRAFORM_MAIN
    );

    return fse.pathExists(terraformEntryPoint);
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
                return this._loadCache(emitModule)
                  .then(() => this._terraformate(emitModule))
              })
            );
          })
          .then(() => {
            return SequentialPromise.all(
              this._normalizedRunStack.map(item => {
                const { emitModule, changed } = item;
    
                return () => {
                  if (changed) {
                    this.logger.info(
                      this.logger.emoji.check,
                      `Starting Terraform in module "${ emitModule.name }".`
                    );
    
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
    if (!this._cacheEnabled) {
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

    return this._caches[emitModule.name].download();
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
    const resourceDirname = emitModule.container.get('terraform.resource-dirname', Terraform.RESOURCE_DIRNAME)
      || this.container.get('resource-dirname', Terraform.RESOURCE_DIRNAME);
    const resourcesPath = path.join(rootPath, resourceDirname);

    // @todo abstract the way cache behavior hooked
    if (driverName === 's3' && options.length >= 1) {
      options[0] = `${ options[0] }/${ emitModule.name }`;
    }

    const driver = CacheFactory.create(driverName, resourcesPath, ...options);

    // @todo abstract the way cache behavior hooked
    if (driverName === 's3') {
      driver._includeNodeVersion = false;
    }

    return driver;
  }

  /**
   * @param {Emitter} emitter
   * 
   * @returns {boolean}
   * 
   * @private
   */
  _cacheEnabled(emitter) {
    return this.container.get('use-cache', true)
      && !!emitter.component('cache');
  }

  /**
  * @param {Emitter} emitter
  * 
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
    return this._hasChanges(emitModule)
      .then(changed => {
        const after = emitModule.container.get('terraform.run-after', []);

        this._runStack[emitModule.name] = { emitModule, after, changed };

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
  _dispatchModule(emitModule) {
    const vars = Object.assign(
      this.container.get('vars', {}), 
      emitModule.container.get('terraform.vars', {})
    );
    const binary = emitModule.container.get('terraform.binary', Terraform.DEFAULT_BINARY_PATH) 
      || this.container.get('binary', Terraform.DEFAULT_BINARY_PATH);
    const resourceDirname = emitModule.container.get('terraform.resource-dirname', Terraform.RESOURCE_DIRNAME)
      || this.container.get('resource-dirname', Terraform.RESOURCE_DIRNAME);
    const terraform = new Terraform(vars, binary, resourceDirname);
  
    return terraform.ensure()
      .then(() => this._init(terraform, emitModule))
      .then(() => this._plan(terraform, emitModule))
      .then(() => this._apply(terraform, emitModule));
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
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _init(terraform, emitModule) {
    this.logger.info(
      this.logger.emoji.magic,
      `Running "terraform init" in "${ emitModule.name }".`
    );

    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('terraform.init') 
      ? emitModule.container.get('terraform.init')
      : this.container.get('init', true);

    if (!enabled) {
      return this._handleSkip(emitModule, 'init');
    }

    return terraform.init(dir)
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

    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('terraform.plan') 
      ? emitModule.container.get('terraform.plan')
      : this.container.get('plan', true);

    if (!enabled) {
      return this._handleSkip(emitModule, 'plan');
    }

    return terraform.plan(dir)
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

    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('terraform.apply') 
      ? emitModule.container.get('terraform.apply')
      : this.container.get('apply', false);

    if (!enabled) {
      return this._handleSkip(emitModule, 'apply');
    } else if (this._noChanges) {
      return this._handleSkip(emitModule, 'apply', 'No Changes Detected');
    }

    return terraform.apply(dir)
      .then(state => this._handleApply(terraform, emitModule, state))
      .catch(error => this._handleError(emitModule, 'apply', error));
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
### Terraform ${ command.toUpperCase() } \`${ emitModule.name }\` *-> ERROR*

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
    const reasonMsg = reason ? `. Reason - "${ reason }"` : '';

    return this._reporter.report(`
### Terraform ${ command.toUpperCase() } \`${ emitModule.name }\` *-> SKIP*

Skip \`terraform ${ command }\`${ reasonMsg }...
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
### Terraform PLAN \`${ emitModule.name }\` *-> ${ plan.changed ? '' : 'UN' }CHANGED*

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
### Terraform APPLY \`${ emitModule.name }\` *-> SUCCEEDED*

\`\`\`
${ output }
\`\`\`
        `);
      });
  }

  /**
   * @returns {string}
   */
  static get TERRAFORM_MAIN() {
    return 'main.tf';
  }
}

module.exports = TerraformComponent;
