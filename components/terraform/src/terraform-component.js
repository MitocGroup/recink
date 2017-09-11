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

          return this._terraformate(this._moduleRoot(emitModule));
        });
    });
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
   * @param {string} dir
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _terraformate(dir) {
    const vars = this.container.get('vars', {});
    const binary = this.container.get('binary', Terraform.DEFAULT_BINARY_PATH);
    const resourceDirname = this.container.get('resource-dirname', Terraform.RESOURCE_DIRNAME);
    const terraform = new Terraform(vars, binary, resourceDirname);
  
    return terraform.ensure()
      .then(() => this._init(terraform, dir))
      .then(() => this._plan(terraform, dir))
      .then(() => this._apply(terraform, dir));
  }

  /**
   * @param {Terraform} terraform 
   * @param {string} dir
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _init(terraform, dir) {
    if (!this.container.get('init', true)) {
      return this._handleSkip('init');
    }

    return terraform.init(dir)
      .catch(error => this._handleError('init', error));
  }

  /**
   * @param {Terraform} terraform 
   * @param {string} dir
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _plan(terraform, dir) {
    if (!this.container.get('plan', true)) {
      return this._handleSkip('plan');
    }

    return terraform.plan(dir)
      .then(plan => this._handlePlan(plan))
      .catch(error => this._handleError('plan', error));
  }

  /**
   * @param {Terraform} terraform 
   * @param {string} dir
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _apply(terraform, dir) {
    if (!this.container.get('apply', false)) {
      return this._handleSkip('apply');
    } else if (this._noChanges) {
      return this._handleSkip('apply', 'No Changes Detected');
    }

    return terraform.apply(dir)
      .then(state => this._handleApply(state))
      .catch(error => this._handleError('apply', error));
  }

  /**
   * @param {string} command
   * @param {Error} error
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handleError(command, error) {
    return this._reporter.report(`
### Terraform ${ command.toUpperCase() } -> *ERROR*

\`\`\`
${ error.toString().trim() }
\`\`\`
    `).then(() => Promise.reject(error));
  }

  /**
   * @param {string} command
   * @param {string} reason
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handleSkip(command, reason = null) {
    const reasonMsg = reason ? `. Reason - "${ reason }"` : '';

    return this._reporter.report(`
### Terraform ${ command.toUpperCase() }

Skip \`terraform ${ command }\`${ reasonMsg }...
    `);
  }

  /**
   * @param {Plan} plan
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handlePlan(plan) {

    // @todo move this...
    this._noChanges = !plan.changed;

    return this._reporter.report(`
### Terraform PLAN (${ plan.changed ? '' : 'UN' }CHANGED)

\`\`\`json
${ JSON.stringify(plan.diff, null, '  ') }
\`\`\`
    `);
  }

  /**
   * @param {State} state
   * 
   * @returns {Promise}
   * 
   * @private 
   */
  _handleApply(state) {
    return state.state()
      .then(stateObj => {
        return this._reporter.report(`
### Terraform APPLY

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
