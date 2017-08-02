import { Selector } from 'testcafe';
import config from '../../config';
import Header from '../../poms/components/header.po';

const header = new Header();

fixture`Check valid content is displayed on website header`
  .page`${config.www_base_host}`
  .beforeEach(async t => {
    await t
      .resizeWindow(1920, 1080);
  });

test('Check "Logo" image is displayed on website header', async t => {
  await t
    .expect(header.logoImage.exists).ok();
});

test('Check "CHALLENGES" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.challengesTopMenuLink.exists).ok()
    .expect(header.challengesTopMenuLink.innerText).contains('CHALLENGES');
});

test('Check "SOLUTIONS" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.solutionsTopMenuLink.exists).ok()
    .expect(header.solutionsTopMenuLink.innerText).contains('SOLUTIONS');
});

test('Check "API" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.apiTopMenuLink.exists).ok()
    .expect(header.apiTopMenuLink.innerText).contains('API');
});

test('Check "TEAM" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.teamTopMenuLink.exists).ok()
    .expect(header.teamTopMenuLink.innerText).contains('TEAM');
});

test('Check "CONTACT" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.contactTopMenuLink.exists).ok()
    .expect(header.contactTopMenuLink.innerText).contains('CONTACT');
});

test('Check "BLOG" top-menu link is displayed on website header', async t => {
  await t
    .expect(header.blogTopMenuLink.exists).ok()
    .expect(header.blogTopMenuLink.innerText).contains('BLOG');
});

test('Check "Request a Demo" modal is displayed on website header', async t => {
  await t
    .expect(header.topMenuRequestDemoModal.exists).ok()
    .click(header.topMenuRequestDemoModal);
});
