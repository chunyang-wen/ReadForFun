import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.goto(process.env.TRAVEL_BASE_URL||'http://127.0.0.1:8873/travel-in-china/');
 await page.locator('.discovery-bubble').waitFor();
 await page.locator('.map-panel').scrollIntoViewIfNeeded();
 await page.mouse.move(1400,900);await page.waitForTimeout(250);
 let href=await page.locator('.discovery-bubble').getAttribute('href');
 await page.clock.runFor(9000);
 assert.notEqual(await page.locator('.discovery-bubble').getAttribute('href'),href,'rotates while visible');
 await page.locator('#discovery-pause').click();await page.mouse.move(1400,900);
 href=await page.locator('.discovery-bubble').getAttribute('href');
 await page.clock.runFor(18000);
 assert.equal(await page.locator('.discovery-bubble').getAttribute('href'),href,'explicit pause');
 await page.locator('#discovery-next').click();
 assert.notEqual(await page.locator('.discovery-bubble').getAttribute('href'),href);
 await page.locator('.discovery-close').click();
 assert(await page.locator('#map-discovery').isHidden());
 await page.locator('[data-waypoint="820000"] .city-target').click();
 assert.equal(await page.locator('.province.selected').getAttribute('data-province'),'820000');
 await page.locator('#reset-region').click();await page.locator('#discovery-next').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('#discovery-pause').getAttribute('aria-pressed'),'true');
 await page.locator('.discovery-close').click();
 // Clicking a label uses its dedicated rectangle, rather than the leader-line group's bounding box.
 for(const code of ['110000','120000','810000','820000']){
  await page.locator('[data-waypoint="'+code+'"] .city-target').click();
  assert.equal(await page.locator('.province.selected').getAttribute('data-province'),code);
 }
 // A complete shuffled round must visit all 34 cities exactly once.
 await page.goto((process.env.TRAVEL_BASE_URL||'http://127.0.0.1:8873/travel-in-china/')+'#/atlas');
 await page.locator('.discovery-bubble').waitFor();
 const seen=new Set();
 for(let i=0;i<34;i++){
  const name=(await page.locator('.discovery-meta').textContent()).split(' · ')[0];
  assert(!seen.has(name),'city must not repeat in a round: '+name);seen.add(name);
  await page.locator('#discovery-next').click();
 }
 assert.equal(seen.size,34);assert.deepEqual(errors,[]);
 console.log('PASS: timed rotation, pause, next, dismissal, small-region labels, reduced motion, 34-city shuffle.');
}finally{await browser.close()}
