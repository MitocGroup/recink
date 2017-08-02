import { Selector } from 'testcafe';

export default class Api {
  constructor() {
    this.caseStudies = Selector('.flex-item-4:nth-child(1)');
    this.elementApiDocs = Selector('.flex-item-4:nth-child(2)');
    this.elementUserGuide = Selector('.flex-item-4:nth-child(3)');
    this.elementMoreButton = Selector('.flex-item-4:nth-child(1) > .action > a');
    this.inputApiKey = Selector('#api-key');
    this.apiKeyApply = Selector('#api-key-apply');
    this.notifyMessage = Selector('.noty_bar .noty_type_success');
    this.propertyCreate = Selector('#property_put_atm_admin_property_create');
    this.bodyTextarea = Selector('body-textarea');
  }
};

