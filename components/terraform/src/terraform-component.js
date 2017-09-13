'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const emitEvents = require('recink/src/component/emit/events');
const SequentialPromise = require('recink/src/component/helper/sequential-promise');
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
    return new Promise((resolve, reject) => {
      emitter.onBlocking(emitEvents.module.process.start, emitModule => {
        return this._isTerraformModule(emitModule)
          .then(isTerraform => {
            if (!isTerraform) {
              return Promise.resolve();
            }
  
            return this._terraformate(emitModule);
          });
      });

      emitter.on(emitEvents.modules.process.end, () => {
        SequentialPromise.all(
          this._normalizedRunStack.map(item => {
            const { emitModule, changed } = item;

            return () => {
              if (changed) {
                this.logger.info(
                  this.logger.emoji.check,
                  `Starting Terraform in module "${ emitModule.name }".`
                );

                return this._dispatchModule(emitModule);
              } else {
                this.logger.info(
                  this.logger.emoji.cross,
                  `Skip running Terraform in module "${ emitModule.name }". No changes Detected.`
                );

                return Promise.resolve();
              }
            };
          })
        )
          .then(() => resolve())
          .catch(error => reject(error));
      });
    });
  }

  /**
  * @param {Emitter} emitter
  * 
  * @returns {Promise}
  */
  teardown(emitter) {
    this._noChanges = true;
    this._runStack = {};

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
    const diff = new Diff();

    return diff.load()
      .then(() => {
        const rootPath = this._moduleRoot(emitModule);
        const dependencies = emitModule.container.get('terraform.dependencies', [])
          .map(dep => path.isAbsolute(dep) ? dep : path.resolve(rootPath, dep));

        return Promise.resolve(
          diff.match(...[ rootPath ].concat(dependencies))
        );
      });
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
      .then(plan => this._handlePlan(emitModule, plan))
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
      .then(state => this._handleApply(emitModule, state))
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
### Terraform ${ command.toUpperCase() } \`${ emitModule.name }\`

Skip \`terraform ${ command }\`${ reasonMsg }...
    `);
  }

  /**
   * @param {EmitModule} emitModule
   * @param {Plan} plan
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handlePlan(emitModule, plan) {

    // @todo move this...
    this._noChanges = !plan.changed;

    return this._reporter.report(`
### Terraform PLAN \`${ emitModule.name }\` *-> ${ plan.changed ? '' : 'UN' }CHANGED*

\`\`\`json
${ JSON.stringify(plan.diff, null, '  ') }
\`\`\`
    `);
  }

  /**
   * @param {EmitModule} emitModule
   * @param {State} state
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handleApply(emitModule, state) {
    return state.state()
      .then(stateObj => {
        return this._reporter.report(`
### Terraform APPLY \`${ emitModule.name }\`

\`\`\`json
${ JSON.stringify(stateObj, null, '  ') }
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
