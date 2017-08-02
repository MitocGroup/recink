import { Selector } from 'testcafe';
import config from '../../config';
import Challenges from '../../poms/pages/challenges.po';

const challenges = new Challenges();

fixture`Check valid content is displayed on "Challenges" page`
  .page`${config.www_base_host}/challenges/`
  .beforeEach(async t => {
    await t
      .resizeWindow(1920, 1080);
  });

test('Check "Request a Demo" modal is displayed on "Challenges" page and can be opened by the click', async t => {
  await t
    .expect(challenges.requestDemoModal.exists).ok();

  await t
    .hover(challenges.requestDemoModal)
    .click(challenges.requestDemoModal, { speed: 0.5 })
    .click(challenges.requestDemoModalClose, { speed: 0.5 });
});
