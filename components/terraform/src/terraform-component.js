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
    return this._terraformate('./example');
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
    const terraform = new Terraform(vars, binary);
  
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
      return Promise.resolve();
    }

    return terraform.init(dir);
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
      return Promise.resolve();
    }

    return terraform.plan(dir)
      .then(plan => {
        console.log('plan', plan);
      });
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
      return Promise.resolve();
    }

    return terraform.apply(dir)
      .then(state => {
        console.log('state', state);
      });
  }
}

module.exports = TerraformComponent;
