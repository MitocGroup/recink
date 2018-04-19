'use strict';

const fse = require('fs-extra');
const path = require('path');
const Diff = require('./diff');
const https = require('https');
const execa = require('execa');
const uuidv1 = require('uuid/v1');
const Reporter = require('./reporter');
const Terraform = require('./terraform');
const emitEvents = require('recink/src/component/emit/events');
const UnitRunner = require('recink/src/component/test/unit-runner');
const CacheFactory = require('recink/src/component/cache/factory');
const SequentialPromise = require('recink/src/component/helper/sequential-promise');
const { findFilesByPattern } = require('recink/src/helper/util');
const DependencyBasedComponent = require('recink/src/component/dependency-based-component');

/**
 * Terraform component
 */
class TerraformComponent extends DependencyBasedComponent {
  /**
   * @param {*} args 
   */
  constructor(...args) {
    super(...args);

    /**
     * _unit & _e2e formats
     * @type {{
     *  moduleName: {
     *    enabled: true
     *    assets: [],
     *    runner: Runner
     *  },
     *  {...}
     * }}
     */
    this._e2e = {};
    this._unit = {};
    this._reporter = null;
    this._runStack = {};
    this._diff = new Diff();
    this._caches = {};
    this._emitter = null;
    this._E2ERunner = null;
  }

  /**
   * @returns {String}
   */
  get name() {
    return 'terraform';
  }

  /**
   * Terraform component dependencies
   * @returns {String[]}
   */
  get dependencies() {
    return [ 'emit' ];
  }

  /**
   * @param {EmitModule} emitModule 
   * @returns {String}
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
    let terraformFiles = findFilesByPattern(this._moduleRoot(emitModule), /.*\.tf$/);

    return Promise.resolve(terraformFiles.length > 0);
  }

  /**
  * @param {Emitter} emitter
  * @returns {Promise}
  */
  init(emitter) {
    this._reporter = new Reporter(emitter, this.logger);
    this._setDefaults();

    return Promise.resolve();
  }

  /**
   * Configure default values for terraform
   * @private
   */
  _setDefaults() {
    Object.keys(TerraformComponent.GLOBAL_DEFAULTS).forEach(key => {
      if (!this.container.has(key)) {
        this.container.set(key, TerraformComponent.GLOBAL_DEFAULTS[key]);
      }
    })
  }
  
  /**
   * @param {Emitter} emitter
   * @returns {Promise}
   */
  run(emitter) {
    this._emitter = emitter;
    const terraformModules = [];

    return new Promise((resolve, reject) => {
      emitter.onBlocking(emitEvents.module.process.start, emitModule => {
        return this._isTerraformModule(emitModule).then(isTerraform => {
          if (!isTerraform) {
            return Promise.resolve();
          }

          terraformModules.push(emitModule);

          return this._updateTestsList(emitModule);
        });
      });

      emitter.on(emitEvents.modules.process.end, () => {
        this._diff.load()
          .then(() => this._initCaches(terraformModules))
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
            return SequentialPromise.all(this._normalizedRunStack.map(item => {
              const { emitModule, changed } = item;

              return () => {
                if (changed) {
                  this.logger.info(this.logger.emoji.check, `Starting Terraform in module "${ emitModule.name }"`);

                  return this._dispatchModule(emitModule)
                    .then(() => {
                      return this._uploadCache(emitModule).catch(error => {
                        this.logger.warn(
                          this.logger.emoji.cross,
                          `Failed to upload caches for Terraform module "${ emitModule.name }": ${ error }`
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
                            `Failed to upload caches for Terraform module "${ emitModule.name }": ${ cacheError }`
                          );

                          return Promise.reject(error);
                        })
                        .then(() => Promise.reject(error));
                    });
                } else {
                  this.logger.info(
                    this.logger.emoji.cross,
                    `Skip running Terraform in module "${ emitModule.name }". No changes Detected`
                  );

                  return Promise.resolve();
                }
              };
            }));
          })
          .then(() => resolve())
          .catch(error => {
            this.logger.warn(this.logger.emoji.cross, `Failed with error: ${ error }`);
            return reject(error);
          });
      });
    });
  }

  /**
   * @param {EmitModule[]} terraformModules
   * @returns {Promise}
   * @private
   */
  _initCaches(terraformModules) {
    terraformModules.forEach(emitModule => {
      const isCacheEnabled = this._parameterFromConfig(emitModule, 'cache', true);

      if (isCacheEnabled) {
        const options = this._parameterFromConfig(emitModule, 'cache.options', []);
        const modulePath = this._moduleRoot(emitModule);
        const resource = this._parameterFromConfig(emitModule, 'resource', Terraform.RESOURCE);

        if (options.length >= 1) {
          options[0] = `${ options[0] }/${ emitModule.name }`;
        }

        this._caches[emitModule.name] = CacheFactory.create(
          's3-unpacked',
          path.join(modulePath, resource),
          path.dirname(this.configFileRealPath),
          ...options
        );
      }
    });

    return Promise.resolve();
  }

  /**
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _loadCache(emitModule) {
    if (!this._caches.hasOwnProperty(emitModule.name)) {
      return Promise.resolve();
    }

    this.logger.info(this.logger.emoji.check, `Downloading caches for Terraform module "${ emitModule.name }"`);

    return this._caches[emitModule.name].download().then(debug => {
      this.logger.debug(JSON.stringify(debug));
      return Promise.resolve();
    });
  }

  /**
   * Check if dependencies are installed
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _checkDependencies(emitModule) {
    return new Promise((resolve, reject) => {
      if (!this._parameterFromConfig(emitModule, 'test.apply', false)) {
        return resolve();
      }

      try {
        require.resolve('recink-e2e');
        this._E2ERunner = require('recink-e2e/src/e2e-runner');

        return resolve();
      } catch (e) {
        this.logger.info(this.logger.emoji.check, 'Installing e2e component...');

        return execa('npm', ['install', 'recink-e2e'], {
          env: { CI: true },
          cwd: process.cwd()
        }).then(result => {
          this._E2ERunner = require('recink-e2e/src/e2e-runner');

          return resolve();
        }).catch(err => reject(err));
      }
    }).then(() => {
      return Promise.resolve();
    });
  }

  /**
   * Handle unit/e2e tests
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _updateTestsList(emitModule) {
    return this._checkDependencies(emitModule).then(() => {
      const testcafePath = 'test.e2e.testcafe';
      const mochaOptions = this._parameterFromConfig(emitModule, 'test.unit.mocha.options', {});
      const screenShotPath = this._parameterFromConfig(emitModule, `${testcafePath}.screenshot.path`, process.cwd());
      const { plan, apply } = this._parameterFromConfig(emitModule, 'test', {});
      const testcafeOptions = {
        browsers: this._parameterFromConfig(emitModule, `${testcafePath}.browsers`, ['puppeteer']),
        screenshotsPath: path.resolve(screenShotPath),
        takeOnFail: this._parameterFromConfig(emitModule, `${testcafePath}.screenshot.take-on-fail`, false)
      };

      if (plan) {
        const units = (fse.existsSync(plan) && fse.lstatSync(plan).isFile())
          ? [plan]
          : findFilesByPattern(plan, /.*\.spec.\js/);

        this._unit[emitModule.name] = { assets: units, enabled: true, runner: new UnitRunner(mochaOptions)};
      }

      if (apply) {
        const e2es = (fse.existsSync(apply) && fse.lstatSync(apply).isFile())
          ? [apply]
          : findFilesByPattern(apply, /.*\.e2e.\js/);

        this._e2e[emitModule.name] = { assets: e2es, enabled: true, runner: new this._E2ERunner(testcafeOptions)};
      }

      return Promise.resolve();
    });
  }

  /**
   * @param {EmitModule} emitModule
   * @returns {*}
   * @private
   */
  _uploadCache(emitModule) {
    if (!this._caches.hasOwnProperty(emitModule.name)) {
      return Promise.resolve();
    }

    this.logger.info(this.logger.emoji.check, `Uploading caches for Terraform module "${ emitModule.name }"`);

    return this._caches[emitModule.name].upload();
  }

  /**
  * @param {Emitter} emitter
  * @returns {Promise}
  */
  teardown(emitter) {
    this._runStack = {};
    this._caches = {};
    this._unit = {};
    this._e2e = {};

    return Promise.resolve();
  }

  /**
   * @returns {Function[]}
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
      throw new Error(`Maximum stack of ${ maxIt } exceeded while normalizing Terraform dependencies vector`);
    }

    return modulesNames.map(moduleName => this._runStack[moduleName]);
  }

  /**
   * Validate terraform modules run-stack
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

    const extraneousModules = Object.keys(extraneous);

    if (extraneousModules.length > 0) {
      extraneousModules.map(name => {
        delete this._runStack[name];

        const deps = extraneous[name];
        const errMsg = `Skipping '${name}' because '${deps.join(', ')}' is/are not configured or explicitly excluded`;
        this.logger.warn(this.logger.emoji.cross, errMsg);
      });
    }
  }

  /**
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _terraformate(emitModule) {
    return this._hasChanges(emitModule).then(changed => {
      const after = this._parameterFromConfig(emitModule, 'run-after', []);

      this._runStack[emitModule.name] = { emitModule, after, changed };

      return Promise.resolve();
    });
  }

  /**
   * Get main or extended by module parameter
   * @param {EmitModule} module
   * @param {String} parameter
   * @param {String|Object|Array|Boolean} defaultValue
   * @return {*}
   * @private
   */
  _parameterFromConfig(module, parameter, defaultValue) {
    let tree = [];
    let result = defaultValue;
    let mainCfg = this.container.get(parameter, defaultValue);
    let moduleCfg = module.container.get(`terraform.${parameter}`);

    switch ((defaultValue).constructor) {
      case String:
      case Boolean:
        tree.push({x: mainCfg});
        if (moduleCfg !== null) { tree.push({x: moduleCfg}); }

        result = (Object.assign(...tree)).x;
        break;
      case Object:
        tree.push(mainCfg);
        if (moduleCfg !== null) { tree.push(moduleCfg); }

        result = Object.assign(...tree);
        break;
      case Array:
        result = (moduleCfg !== null) ? moduleCfg : mainCfg;
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
      this._parameterFromConfig(emitModule, 'binary', Terraform.BINARY),
      this._parameterFromConfig(emitModule, 'resource', Terraform.RESOURCE),
      this._parameterFromConfig(emitModule, 'vars', {}),
      this._parameterFromConfig(emitModule, 'var-files', [])
    );

    this.logger.debug(`Terraform version - '${ version }'`);

    return terraform.ensure(version)
      .then(() => this._init(terraform, emitModule))
      .then(() => this._workspace(terraform, emitModule))
      .then(() => this._plan(terraform, emitModule))
      .then(requestId => this._getResources(requestId))
      .then(() => this._runTests(TerraformComponent.UNIT, emitModule))
      .then(() => this._apply(terraform, emitModule))
      .then(requestId => this._getResources(requestId))
      .then(() => this._runTests(TerraformComponent.E2E, emitModule))
      .then(() => this._destroy(terraform, emitModule))
      .then(requestId => this._getResources(requestId));
  }

  /**
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _hasChanges(emitModule) {
    const rootPath = this._moduleRoot(emitModule);
    const dependencies = this._parameterFromConfig(emitModule, 'dependencies', [])
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
   * @returns {Promise}
   * @private
   */
  _workspace(terraform, emitModule) {
    if (!terraform.isWorkspaceSupported) {
      return this._handleSkip(emitModule, 'workspace', `'terraform workspace' requires version 0.11.0 (or higher)`);
    }

    const workspace = this._parameterFromConfig(emitModule, 'current-workspace', 'default');

    return terraform
      .workspace(this._moduleRoot(emitModule), workspace)
      .catch(error => this._handleError(emitModule, 'workspace', error));
  }

  /**
   * @param {Terraform} terraform 
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _plan(terraform, emitModule) {
    if (!this._parameterFromConfig(emitModule, 'plan', true)) {
      if (this._unit.hasOwnProperty(emitModule.name)) {
        this._unit[emitModule.name].enabled = false;
      }

      return this._handleSkip(emitModule, 'plan');
    }

    const requestId = uuidv1();

    return terraform
      .plan(this._moduleRoot(emitModule))
      .then(plan => {
        return this._emitter
          .emitBlocking('cnci.upload.plan', { plans: [plan], requestId: requestId, action: 'plan' })
          .then(() => Promise.resolve(plan))
        ;
      })
      .then(plan => this._handlePlan(terraform, emitModule, plan))
      .then(() => Promise.resolve(requestId))
      .catch(error => this._handleError(emitModule, 'plan', error));
  }

  /**
   * Run test if configured
   * @param {String} type
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _runTests(type, emitModule) {
    return new Promise((resolve, reject) => {
      const tests = type === TerraformComponent.UNIT ? this._unit : this._e2e;
      const module = tests[emitModule.name];

      if (!module || !module.enabled) {
        return resolve();
      }

      if (module.assets.length <= 0) {
        this.logger.info(this.logger.emoji.check, `No ${type}-test found for ${ emitModule.name } module`)
        return resolve();
      }

      module.runner.run(module.assets)
        .then(() => module.runner.cleanup())
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  /**
   * @param {Terraform} terraform 
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _apply(terraform, emitModule) {
    if (!this._parameterFromConfig(emitModule, 'apply', false)) {
      if (this._e2e.hasOwnProperty(emitModule.name)) {
        this._e2e[emitModule.name].enabled = false;
      }

      return this._handleSkip(emitModule, 'apply');
    }

    const requestId = uuidv1();

    return terraform
      .apply(this._moduleRoot(emitModule))
      .then(state => {
        return this._emitter
          .emitBlocking('cnci.upload.state', { states: [state.path], requestId: requestId, action: 'apply' })
          .then(() => Promise.resolve(state))
        ;
      })
      .then(state => this._handleApply(terraform, emitModule, state))
      .then(() => Promise.resolve(requestId))
      .catch(error => this._handleError(emitModule, 'apply', error));
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @returns {Promise}
   * @private
   */
  _destroy(terraform, emitModule) {
    if (!this._parameterFromConfig(emitModule, 'destroy', false)) {
      return this._handleSkip(emitModule, 'destroy');
    }

    const requestId = uuidv1();

    return terraform
      .destroy(this._moduleRoot(emitModule))
      .then(state => {
        return this._emitter
          .emitBlocking('cnci.upload.state', { states: [state.path], requestId: requestId, action: 'destroy' })
          .then(() => Promise.resolve(state))
        ;
      })
      .then(state => Promise.resolve())
      .then(() => Promise.resolve(requestId))
      .catch(error => this._handleError(emitModule, 'destroy', error));
  }

  /**
   * Get parsed resources
   * @param {String|Number} requestId
   * @returns {Promise}
   * @private
   */
  _getResources(requestId) {
    const endpoint = `https://api-dev.cloudnativeci.com/v1/cnci/terraform/resource-retrieve?RequestId=${requestId}`;

    return this._callApiWithRetry(endpoint, 3).then(resources => {
      // @todo remove after debugging
      this.logger.debug(this.logger.emoji.diamond, JSON.stringify(resources, null, 2));

      return Promise.resolve();
    });
  }

  /**
   * Call API with retries
   * @param {String} endpoint
   * @param {Number} times
   * @returns {Promise}
   * @private
   */
  _callApiWithRetry(endpoint, times) {
    if (times === 1) {
      return this._callApi(endpoint);
    } else {
      return new Promise(resolve => {
        this._callApi(endpoint).then(res => {
          if (res.length < 1) {
            throw new Error('No data found.')
          }

          resolve(res);
        }).catch(err => {
          setTimeout(() => {
            this.logger.debug(`${err.message} Retrying...`);

            resolve(this._callApiWithRetry(endpoint, times - 1));
          }, TerraformComponent.RETRY_DELAY);
        });
      });
    }
  }

  /**
   * Call API
   * @param {String} endpoint
   * @returns {Promise}
   */
  _callApi(endpoint) {
    return new Promise((resolve, reject) => {
      https.get(endpoint, res => {
        let buffers = [];
        res.on('data', data => { buffers.push(data); });
        res.on('end', () => {
          let result = Buffer.concat(buffers).toString();

          resolve(JSON.parse(result));
        });
      }).on('error', err => {
        reject(err);
      });
    });
  }

  /**
   * @param {EmitModule} emitModule
   * @param {String} command
   * @param {Error} error
   * @returns {Promise}
   * @private
   */
  _handleError(emitModule, command, error) {
    return this._reporter.report(`
### '${ emitModule.name }' returned an error executing 'terraform ${ command }'

\`\`\`
${ error.toString().trim() }
\`\`\`
    `).then(() => Promise.reject(error));
  }

  /**
   * @param {EmitModule} emitModule
   * @param {String} command
   * @param {String} reason
   * @returns {Promise}
   * @private
   */
  _handleSkip(emitModule, command, reason = null) {
    const reasonMsg = reason ? `Reason - "${ reason }" ...` : '';

    return this._reporter.report(`
### '${ emitModule.name }' skipped executing 'terraform ${ command }'

${ reasonMsg }
    `);
  }

  /**
   * @param {Terraform} terraform
   * @param {EmitModule} emitModule
   * @param {Plan} plan
   * @returns {Promise}
   * @private
   */
  _handlePlan(terraform, emitModule, plan) {
    const resourceFolder = this._parameterFromConfig(emitModule, 'resource', '');
    const saveShowOutput = this._parameterFromConfig(emitModule, 'save-show-output', '');

    return terraform.show(plan).then(output => {
      if (saveShowOutput) {
        fse.outputFileSync(path.resolve(this._moduleRoot(emitModule), resourceFolder, saveShowOutput), output);
      }

      return this._reporter.report(`
### '${ emitModule.name }' returned below output while executing 'terraform plan'

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
   * @returns {Promise}
   * @private
   */
  _handleApply(terraform, emitModule, state) {
    return terraform.show(state).then(output => {
      return this._reporter.report(`
### '${ emitModule.name }' returned below output while executing 'terraform apply'

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
   * @returns {Promise}
   * @private
   */
  _handleDestroy(terraform, emitModule, state) {
    return terraform.show(state).then(output => {
      return this._reporter.report(`
### '${ emitModule.name }' returned below output while executing 'terraform destroy'

\`\`\`
${ output }
\`\`\`
      `);
    });
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get UNIT() {
    return 'unit';
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get E2E() {
    return 'e2e';
  }

  /**
   * @returns {Object}
   * @constructor
   */
  static get GLOBAL_DEFAULTS() {
    return {
      'version': Terraform.VERSION,
      'current-workspace': 'default'
    };
  }

  /**
   * @returns {Number}
   * @constructor
   */
  static get RETRY_DELAY() {
    return 10000;
  }
}

module.exports = TerraformComponent;
