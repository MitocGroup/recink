import { Selector } from 'testcafe';

export default class RequestDemoModal {
  constructor() {
    this.emailField = Selector('#mce-EMAIL');
    this.nameField = Selector('#mce-FNAME');
    this.submitButton = Selector('#mc-embedded-subscribe');
    this.responseText = Selector('.demo-confirm');
  }
};
