import { Selector } from 'testcafe';

export default class SocialLinks {
  constructor() {
    this.wordpressLink = Selector('.wordpress');
    this.drupalLink = Selector('.drupal');
    this.githubLink = Selector('.github');
    this.linkedinLink = Selector('.linkedin');
    this.twitterLink = Selector('.twitter');
    this.facebookLink = Selector('.facebook');
    this.youtubeLink = Selector('.youtube');
  }
};

