import { Selector } from 'testcafe';
import config from '../../config';
import Contact from '../../poms/pages/contact.po';

const contact = new Contact();

fixture`Check valid content is displayed on "Contact" page`
  .page`${config.www_base_host}/contact/`
  .beforeEach(async t => {
    await t
      .resizeWindow(1920, 1080);
  });

test('Check "Contact" form is displayed on "Contact" page', async t => {
  await t
    .expect(contact.googleMap.exists).ok();
});  

test('Check "Google Map" is displayed on "Contact" page', async t => {
  await t
    .expect(contact.googleMap.exists).ok();
});
