import { Selector } from 'testcafe';

export default class Footer {
  constructor() {
    this.requestDemoModal = Selector('.demo-footer > button');
    this.requestDemoModalClose = Selector('.close-btn');
    this.company = Selector('a').withText('Mitoc Group');
    this.termsOfUse = Selector('a').withText('Terms of Use');
    this.privacyPolicy = Selector('a').withText('Privacy Policy');
  }
};





