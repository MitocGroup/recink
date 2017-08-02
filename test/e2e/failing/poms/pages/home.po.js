import { Selector } from 'testcafe';

export default class Home {
  constructor() {
    this.mobileMenu = Selector('.main-nav');
    this.requestDemoModal = Selector('.info-block > .modal__trigger');
    this.requestDemoModalClose = Selector('.close-btn');
    this.watchNowModal = Selector('.video-show');
    this.watchNowModalClose = Selector('.video-close');
    this.laptopPlay = Selector('.play');
  }
};

