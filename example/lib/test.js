class Test {
  constructor() {}
  
  static get testStaticGetter() {
    return true;
  }
  
  testMethod() {
    return true;
  }
  
  notTestedMethod() {
    return false;
  }
}

module.exports = Test;
