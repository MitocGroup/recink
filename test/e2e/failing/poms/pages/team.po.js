import { Selector } from 'testcafe';

export default class team {
  constructor() {
    this.pageElementChallenges = Selector('.main-slide > section > h1');
    this.challengesRequestDemoModal = Selector('.info-more > button');
    this.challengesRequestDemoModalClose = Selector('.close-btn');
  }
};
