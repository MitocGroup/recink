import { Selector } from 'testcafe';

fixture `AdTechMedia sample page`
  .page `https://www-dev.adtechmedia.io/api/`;

test('Check "Request a Demo" on FHD', async t => {  
  const demoFooterButton = await Selector('.demo-footer > button');
  
  await t
    .resizeWindow(1920, 1080)
    .expect(demoFooterButton.visible).ok()
    .click(demoFooterButton, { speed: 0.5 })
    .expect(Selector('#modal').with({
      selectorTimeout: 5000, 
      visibilityCheck: true,
    }).visible).ok();
});

test('Check "Request a Demo" on iPhone 6 Plus [portrait=false]', async t => {  
  const demoFooterButton = await Selector('.demo-footer > button');
  
  await t
    .resizeWindowToFitDevice('iPhone 6 Plus', {
      portraitOrientation: false,
    })
    .expect(demoFooterButton.visible).notOk();
});
