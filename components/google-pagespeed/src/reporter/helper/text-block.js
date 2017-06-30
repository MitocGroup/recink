'use strict';

/**
 * Render text block
 */
class TextBlock {
  /**
   * @param {*} metadata
   * @param {Logger} logger
   */
  constructor(metadata, logger) {
    this._metadata = metadata;
    this._logger = logger;
  }
  
  /**
   * @returns {Logger}
   */
  get logger() {
    return this._logger;
  }
  
  /**
   * @returns {*}
   */
  get metadata() {
    return this._metadata;
  }
  
  /**
   * @returns {string}
   */
  render() {
    const { format } = this.metadata;
    
    return format
      .replace(
        TextBlock.SIMPLE_REGEXP, 
        this._simple.bind(this)
      ).replace(
        TextBlock.BLOCK_REGEXP, 
        this._block.bind(this)
      );
  }
  
  /**
   * @param {string} block
   * @param {string} name
   *
   * @returns {string}
   * 
   * @private
   */
  _simple(block, name) {
    const { args } = this.metadata;
    
    const arg = args.filter(arg => arg.key === name)[0];
    
    if (!arg) {
      return block;
    }
    
    return this._print(null, arg.value, arg.type);
  }
  
  /**
   * @param {string} block
   * @param {string} name
   * @param {string} content
   * @param {string} repeatName
   *
   * @returns {string}
   * 
   * @private
   */
  _block(block, name, content, repeatName) {
    if (name !== repeatName) {
      return block;
    }
    
    const { args } = this.metadata;
    
    const arg = args.filter(arg => arg.key === name)[0];
    
    if (!arg) {
      return block;
    }
    
    return this._print(content, arg.value, arg.type);
  }
  
  /**
   * @param {string} content
   * @param {string} replacement
   * @param {string} type
   *
   * @returns {string}
   * 
   * @private
   */
  _print(content, replacement, type) {
    let value;
    
    switch (type.toUpperCase()) {
      case 'BYTES':
      case 'DISTANCE':
      case 'DURATION':
      case 'PERCENTAGE':
      case 'STRING_LITERAL':
      case 'VERBATIM_STRING':
        value = this.logger.chalk.bold.gray(replacement);
        break;
      case 'HYPERLINK':
        value = `${ content } [ ${ this.logger.chalk.underline.blue(replacement) } ]`;
        break;
      case 'URL':
        value = this.logger.chalk.underline.blue(replacement);
        break;
      case 'SNAPSHOT_RECT':
        throw new Error('Google PageSpeed SNAPSHOT_RECT type is not supported');
        break;
      case 'INT_LITERAL':
      default: value = replacement; 
    }
    
    return value;
  }
  
  /**
   * @returns {RegExp}
   */
  static get BLOCK_REGEXP() {
    return /{{\s*BEGIN_([^}]+)\s*}}([^{{]+){{\s*END_([^}]+)\s*}}/g;
  }
  
  /**
   * @returns {RegExp}
   */
  static get SIMPLE_REGEXP() {
    return /{{\s*([^}]+)\s*}}/g;
  }
}

module.exports = TextBlock;
