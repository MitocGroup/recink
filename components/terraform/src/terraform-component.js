'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');
const Terraform = require('./terraform');

/**
 * Terraform component
 */
class TerraformComponent extends DependantConfigBasedComponent {
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
    const plan = this.container.get('plan', true);
    const apply = this.container.get('apply', true);
    const terraform = new Terraform(this.container.get('vars', {}));
  
    return terraform.init()
      .then(() => this._plan(terraform))
      .then(() => this._apply(terraform));
  }

  /**
   * @param {Terraform} terraform 
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _plan(terraform) {
    if (!this.container.get('plan', true)) {
      return Promise.resolve();
    }

    return terraform.plan();
  }

  /**
   * @param {Terraform} terraform 
   * 
   * @returns {Promise}
   * 
   * @private
   */
  _apply(terraform) {
    if (!this.container.get('apply', false)) {
      return Promise.resolve();
    }

    return terraform.apply();
  }
}

module.exports = TerraformComponent;
