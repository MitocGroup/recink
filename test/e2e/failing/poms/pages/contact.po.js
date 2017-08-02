import { Selector } from 'testcafe';

export default class Contact {
  constructor() {
    this.pageElementContact = Selector('#contact:nth-child(1) > form > h1');
    this.formModal = Selector('.contact-form');
    this.googleMap = Selector('#googleMap');
  }
};

