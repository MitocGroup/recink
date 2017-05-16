'use strict';

const ConfigBasedComponent = require('./config-based-component');
const istanbul = require('istanbul');
const testEvents = require('./test/events');
const ContainerTransformer = require('./helper/container-transformer');
const md5Hex = require('md5-hex');
const path = require('path');
const fs = require('fs');
const requireHacker = require('require-hacker');

class CoverageComponent extends ConfigBasedComponent {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }
  
  /**
   * @returns {string}
   */
  get name() {
    return 'coverage';
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    return new Promise((resolve, reject) => {
      const collector = new istanbul.Collector();
      const reporter = new istanbul.Reporter();
      const reporters = this.container.get('reporters', {});
      const coverageVariables = [];
      
      Object.keys(reporters).map(reporterName => {
        const report = istanbul.Report.create(
          reporterName, 
          reporters[reporterName] || {}
        );
        
        reporter.reports[reporterName] = report;
      });
      
      emitter.onBlocking(testEvents.asset.test.start, (testAsset, mocha) => {
        const coverageVariable = this._coverageVariable(testAsset);
        const instrumenter = new istanbul.Instrumenter({ coverageVariable });
        
        coverageVariables.push(coverageVariable);

        mocha.loadFiles = (fn => {
          const moduleRoot = testAsset.module.container.get('root');
              
          mocha.files.map(file => {
            file = path.resolve(file);
            mocha.suite.emit('pre-require', global, file, mocha);
            
            // @todo add other extensions to be covered
            const requireHook = requireHacker.hook('js', depPath => {
              if (depPath.indexOf(moduleRoot) === 0
                && this._match(path.relative(moduleRoot, depPath))) {
                
                return instrumenter.instrumentSync(
                  fs.readFileSync(depPath).toString(), 
                  depPath
                );
              }
            });
            mocha.suite.emit('require', require(file), file, mocha);            
            requireHook.unmount();
            
            mocha.suite.emit('post-require', global, file, mocha);
          });
          
          fn && fn();
        });
        
        return Promise.resolve();
      });
      
      emitter.onBlocking(testEvents.assets.test.end, () => {
        return new Promise(resolve => {
          coverageVariables.map(coverageVariable => {
            collector.add(global[coverageVariable] || {});
          });
          
          reporter.write(collector, false, () => resolve());
        });
      });
      
      emitter.on(testEvents.assets.test.end, () => resolve());
    });
  }
  
  /**
   * @param {string} testAsset
   *
   * @returns {string}
   *
   * @private
   */
  _coverageVariable(testAsset) {
    return `__dps_coverage__${ testAsset.module.name }__${ md5Hex(testAsset.file) }__`;
  }
  
  /**
   * @param {string} file
   *
   * @returns {boolean}
   * 
   * @private
   */
  _match(file) {
    const pattern = this.container.get('pattern', []);
    const ignore = this.container.get('ignore', []);

    const result = pattern.filter(p => this._test(p, file)).length > 0
      && ignore.filter(i => this._test(i, file)).length <= 0;
      
    return result;
  }
  
  /**
   * @param {string|RegExp} pattern
   * @param {string} value
   *
   * @returns {boolean}
   *
   * @private
   */
  _test(pattern, value) {
    if (!(pattern instanceof RegExp)) {
      return value.indexOf(pattern.toString()) !== -1;
    }
    
    return pattern.test(value);
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
}

module.exports = CoverageComponent;