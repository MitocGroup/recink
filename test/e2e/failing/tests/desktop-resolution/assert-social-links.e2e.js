import { Selector } from 'testcafe';
import config from '../../config';
import SocialLinks from '../../poms/components/social-links.po';

const socialLinks = new SocialLinks();

fixture`Check valid links are displayed on "Social Links" area`
  .page`${config.www_base_host}`
  .beforeEach(async t => {
    await t
      .resizeWindow(1920, 1080);
  });

test('Check "WordPress" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.wordpressLink.exists).ok()
    .hover(socialLinks.wordpressLink)
    .click(socialLinks.wordpressLink);
});

test('Check "Drupal" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.drupalLink.exists).ok()
    .hover(socialLinks.drupalLink)
    .click(socialLinks.drupalLink);
});

test('Check "Github" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.githubLink.exists).ok()
    .hover(socialLinks.githubLink)
    .click(socialLinks.githubLink);
});

test('Check "Linkedin" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.linkedinLink.exists).ok()
    .hover(socialLinks.linkedinLink)
    .click(socialLinks.linkedinLink);
});

test('Check "Twitter" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.twitterLink.exists).ok()
    .hover(socialLinks.twitterLink)
    .click(socialLinks.twitterLink);
});

test('Check "Facebook" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.facebookLink.exists).ok()
    .hover(socialLinks.facebookLink)
    .click(socialLinks.facebookLink);
});

test('Check "YouTube" clickable link is displayed on the page', async t => {
  await t
    .expect(socialLinks.youtubeLink.exists).ok()
    .hover(socialLinks.youtubeLink)
    .click(socialLinks.youtubeLink);
});