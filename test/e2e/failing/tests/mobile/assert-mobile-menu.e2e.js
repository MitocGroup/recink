import { Selector } from 'testcafe';
import config from '../../config';
import Header from '../../poms/components/header.po';
import Home from '../../poms/pages/home.po';

const header = new Header();
const home = new Home();

fixture`Check menu visibility for mobile resolution`
  .page`${config.www_base_host}`
  .beforeEach(async t => {
    await t
      .resizeWindowToFitDevice('iPhone 6 Plus', {
        portraitOrientation: true
      });
  });

test('Check "Top Menu" with included links is visible for mobile view and can be expanded by the click', async t => {
  await t
    .expect(home.mobileMenu.exists).ok()
    .hover(home.mobileMenu)
    .click(home.mobileMenu, { speed: 0.5 });

    await t
    .expect(header.challengesTopMenuLink.exists).ok()
    .expect(header.challengesTopMenuLink.innerText).contains('CHALLENGES');

    await t
    .expect(header.solutionsTopMenuLink.exists).ok()
    .expect(header.solutionsTopMenuLink.innerText).contains('SOLUTIONS');

    await t
    .expect(header.apiTopMenuLink.exists).ok()
    .expect(header.apiTopMenuLink.innerText).contains('API');

    await t
    .expect(header.teamTopMenuLink.exists).ok()
    .expect(header.teamTopMenuLink.innerText).contains('TEAM');

    await t
    .expect(header.contactTopMenuLink.exists).ok()
    .expect(header.contactTopMenuLink.innerText).contains('CONTACT');
    
    await t
    .expect(header.blogTopMenuLink.exists).ok()
    .expect(header.blogTopMenuLink.innerText).contains('BLOG');
});


