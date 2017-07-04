import { Selector } from 'testcafe';

fixture `End-to-End Healthcheck`
  .page `http://devexpress.github.io/testcafe/example/`;

test('Check property of element', async t => {
  const developerNameInput = Selector('#developer-name');

  await t
    .expect(developerNameInput.value).eql('', 'input is empty')
    .typeText(developerNameInput, 'Peter Parker')
    .expect(developerNameInput.value).contains('Peter', 'input contains text "Peter"');
});
