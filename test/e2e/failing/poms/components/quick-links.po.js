import { Selector } from 'testcafe';

export default class QuickLinks {
  constructor() {
    this.challengesQuickLink = Selector('.quick-links .clearfix > li:nth-child(1) > a');
    this.solutionsQuickLink = Selector('.quick-links .clearfix > li:nth-child(3) > a');
    this.apiQuickLink = Selector('.quick-links .clearfix > li:nth-child(5) > a');
    this.teamQuickLink = Selector('.quick-links .clearfix > li:nth-child(2) > a');
    this.contactQuickLink = Selector('.quick-links .clearfix > li:nth-child(4) > a');
    this.blogQuickLink = Selector('.quick-links .clearfix > li:nth-child(6) > a');
  }
};