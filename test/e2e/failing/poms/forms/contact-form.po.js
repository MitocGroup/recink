import { Selector } from 'testcafe';

export default class ContactForm {
  constructor() {
    this.formModal = Selector('.contact-form');
    this.nameField = Selector('#name-field');
    this.phoneField = Selector('#phone-field');
    this.emailField = Selector('#email-field');
    this.messageField = Selector('#message-field');
    this.submitButton = Selector('#contact-button');
  }
};
  
