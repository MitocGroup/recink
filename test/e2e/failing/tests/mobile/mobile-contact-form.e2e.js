import { Selector } from 'testcafe';
import config from '../../config';
import libs from '../../libs';
import ContactForm from '../../poms/forms/contact-form.po';

const contactForm = new ContactForm();

fixture`Check "Contact" form request submit`
  .page`${config.www_base_host}/contact`
  .beforeEach(async t => {
    await t
      .resizeWindowToFitDevice('iPhone 6 Plus', {
        portraitOrientation: true
      });
  });

test('Check "Contact" form request can be submitted by user with valid data', async t => {
  await t
    .expect(contactForm.formModal.exists).ok();

  await t
    .expect(contactForm.nameField.exists).ok()
    .expect(contactForm.phoneField.exists).ok()
    .expect(contactForm.emailField.exists).ok()
    .expect(contactForm.messageField.exists).ok();

  await t
    .typeText(contactForm.nameField, libs.chance.name())
    .typeText(contactForm.phoneField, libs.chance.phone())
    .typeText(contactForm.emailField, libs.chance.email())
    .typeText(contactForm.messageField, libs.chance.word());

  await t
    .hover(contactForm.submitButton)
    .click(contactForm.submitButton, { speed: 0.5 });
});