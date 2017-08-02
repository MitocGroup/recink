import { Selector } from 'testcafe';
import config from '../../config';
import QuickLinks from '../../poms/components/quick-links.po';

const quickLinks = new QuickLinks();

fixture`Check valid links are displayed on "Quick Links" area`
  .page`${config.www_base_host}`
  .beforeEach(async t => {
    await t
      .resizeWindow(1920, 1080);
  });

test('Check "Challenges" quick-link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.challengesQuickLink.exists).ok()
    .hover(quickLinks.challengesQuickLink)
    .click(quickLinks.challengesQuickLink), { speed: 0.5 }

  const pageElementChallenges = await Selector('.main-slide > section > h1');

  await t
    .expect(pageElementChallenges.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementChallenges.innerText).contains('Challenges');
});

test('Check "Solutions" quick-link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.solutionsQuickLink.exists).ok()
    .hover(quickLinks.solutionsQuickLink)
    .click(quickLinks.solutionsQuickLink), { speed: 0.5 }

  const pageElementSolutions = await Selector('.custom-headline');

  await t
    .expect(pageElementSolutions.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementSolutions.innerText).contains('SOLUTIONS');
});

test('Check "API" quick-link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.apiQuickLink.exists).ok()
    .hover(quickLinks.apiQuickLink)
    .click(quickLinks.apiQuickLink), { speed: 0.5 }

  const pageElementApiFirst = await Selector('.flex-item-4:nth-child(1)');

  await t
    .expect(pageElementApiFirst.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementApiFirst.innerText).contains('Want to learn about what you can achieve by integrating with our APIs? The possibilities are endless, but you can find just a few examples')

  const pageElementApiSecond = await Selector('.flex-item-4:nth-child(2)');

  await t
    .expect(pageElementApiSecond.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementApiSecond.innerText).contains('See what APIs we have on offer, including extensive documentation. Sign in to manage your subscriptions, see your current usage, get your API Key, and test against our live API.')

  const pageElementApiThird = await Selector('.flex-item-4:nth-child(3)');

  await t
    .expect(pageElementApiThird.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementApiThird.innerText).contains('Ready to get started? This is the place that answers all your questions. We\'ll have you up and running in no time. Let\'s get started!');
});

test('Check "Team" quick-link link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.teamQuickLink.exists).ok()
    .hover(quickLinks.teamQuickLink)
    .click(quickLinks.teamQuickLink), { speed: 0.5 }

  const pageElementTeam = await Selector('.custom-headline-block');

  await t
    .expect(pageElementTeam.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementTeam.innerText).contains('We are a team of highly skilled and very passioned product engineers who dedicated years of building high quality technical solutions that solve large scale business problems.');
});

test('Check "Contact" quick-link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.contactQuickLink.exists).ok()
    .hover(quickLinks.contactQuickLink)
    .click(quickLinks.contactQuickLink), { speed: 0.5 }

  const pageElementContact = await Selector('#contact:nth-child(1) > form > h1');

  await t
    .expect(pageElementContact.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementContact.innerText).contains('Contact');
});

test('Check "Blog" quick-link is clickable and valid information is displayed on the page', async t => {
  await t
    .expect(quickLinks.blogQuickLink.exists).ok()
    .hover(quickLinks.blogQuickLink)
    .click(quickLinks.blogQuickLink), { speed: 0.5 }

  const pageElementBlog = await Selector('.collectionHeader-blockNav > div > nav > div > li:nth-child(1) > a');

  await t
    .expect(pageElementBlog.with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(pageElementBlog.innerText).contains('AD BLOCKING');
});
