import { Selector } from 'testcafe';
import config from '../../config';
import libs from '../../libs';
import Header from '../../poms/components/header.po';
import RequestDemoModal from '../../poms/forms/demo-modal.po';

const header = new Header();
const requestDemoModal = new RequestDemoModal();

fixture`Check valid content is displayed on website header`
  .page`${config.www_base_host}`
  .beforeEach(async t => {
    await t
      .resizeWindowToFitDevice('iPhone 6 Plus', {
        portraitOrientation: true
      });
  });

test('Check "Request a demo" form can be submitted on mobile resolution', async t => {
  await t
    .expect(header.mobileMenuRequestDemoModal.exists).ok()
    .click(header.mobileMenuRequestDemoModal);

  await t
    .typeText(requestDemoModal.emailField, libs.chance.email())
    .typeText(requestDemoModal.nameField, libs.chance.name())
    .click(requestDemoModal.submitButton, { speed: 0.5 });

  await t
    .expect(Selector(requestDemoModal.responseText).with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(
      Selector(requestDemoModal.responseText).innerText)
      .contains('\nThank you for the interest in AdTechMedia WordPress Plugin\nPlease check your inbox to schedule your demo.\n');
});