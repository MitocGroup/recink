'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const emitEvents = require('recink/src/component/emit/events');
const Terraform = require('./terraform');
const Reporter = require('./reporter');
const fse = require('fs-extra');
const path = require('path');

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
  run(emitter) {
    this._reporter = new Reporter(emitter, this.logger);

    emitter.onBlocking(emitEvents.module.process.start, emitModule => {
      return this._isTerraformModule(emitModule)
        .then(isTerraform => {
          if (!isTerraform) {
            return Promise.resolve();
          }

          return this._terraformate(emitModule);
        });
    });
  }

  /**
   * @param {EmitModule} emitModule
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _terraformate(emitModule) {
    const vars = Object.assign(
      this.container.get('vars', {}), 
      emitModule.container.get('vars', {})
    );
    const binary = emitModule.container.get('binary', Terraform.DEFAULT_BINARY_PATH) 
      || this.container.get('binary', Terraform.DEFAULT_BINARY_PATH);
    const resourceDirname = emitModule.container.get('resource-dirname', Terraform.RESOURCE_DIRNAME)
      || this.container.get('resource-dirname', Terraform.RESOURCE_DIRNAME);
    const terraform = new Terraform(vars, binary, resourceDirname);
  
    return terraform.ensure()
      .then(() => this._init(terraform, emitModule))
      .then(() => this._plan(terraform, emitModule))
      .then(() => this._apply(terraform, emitModule));
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
    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('init') 
      ? emitModule.container.get('init')
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
    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('plan') 
      ? emitModule.container.get('plan')
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
    const dir = this._moduleRoot(emitModule);
    const enabled = emitModule.container.has('apply') 
      ? emitModule.container.get('apply')
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
