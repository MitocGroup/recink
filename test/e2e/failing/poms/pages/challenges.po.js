import { Selector } from 'testcafe';

export default class Challenges {
  constructor() {
    this.pageElementChallenges = Selector('.main-slide > section > h1');
    this.requestDemoModal = Selector('.info-more > button');
    this.requestDemoModalClose = Selector('.close-btn');
  }
};
