import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.PHOTO_OUTPUT||'../updates/03/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const results=[],errors=[],failures=[];
try{
 for(const [device,viewport] of Object.entries({desktop:{width:1280,height:900},mobile:{width:390,height:844}})){
  const page=await browser.newPage({viewport,reducedMotion:'reduce',...(device==='mobile'?{isMobile:true,hasTouch:true}:{})});
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(process.env.PREVIEW_URL||'http://localhost:8765').origin)failures.push(r.url());});
  await page.route('https://www.googletagmanager.com/**',r=>r.abort());
  await page.goto((process.env.PREVIEW_URL||'http://localhost:8765')+'/chinese-architecture/yingxian/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#model-loading').hidden&&document.querySelectorAll('.photo-thumb').length===7);
  const chapter=()=>page.evaluate(async()=>(await import(document.querySelector('script[type=module][src]').src)).getViewerState().chapter);
  for(let i=0;i<7;i++){
   await page.locator('.photo-thumb').nth(i).click();
   await page.waitForFunction(()=>{const im=document.querySelector('.photo-open img');return im.complete&&im.naturalWidth>0;});
   await page.locator('.photo-open').click();
   await page.waitForFunction(()=>{const im=document.querySelector('.photo-scroll img');return im.complete&&im.naturalWidth>0&&!im.hidden;});
   await page.locator('.photo-zoom-bar input').evaluate(e=>{e.value='200';e.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator('.photo-dialog').screenshot({path:new URL(device+'-photo-'+i+'.jpg',out).pathname});
   await page.keyboard.press('Escape');assert.equal(await page.locator('.photo-open').evaluate(e=>e===document.activeElement),true);
   await page.locator('.photo-model').click();assert.equal(await chapter(),[0,4,5,5,3,5,0][i]);
   assert.equal(await page.locator('.photo-thumb').nth(i).getAttribute('aria-pressed'),'true');
   results.push({device,photo:i,decoded:true,source:await page.locator('.photo-scroll img').getAttribute('src'),modelChapter:await chapter(),focusRestored:true});
  }
  await page.locator('[data-chapter="4"]').click();assert.equal(await page.locator('.photo-thumb').nth(1).getAttribute('aria-pressed'),'true');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#real-photos').screenshot({path:new URL(device+'-atlas.jpg',out).pathname});
  await page.goto((process.env.PREVIEW_URL||'http://localhost:8765')+'/chinese-architecture/yingxian/study/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#stats').textContent).architecture==='yingxian';}catch{return false;}});
  assert.equal(await page.locator('#error').isVisible(),false);
  results.push({device,studyBaselineLoads:true});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 await writeFile(new URL('photos-browser.json',out),JSON.stringify({results,errors,failures,analytics:'blocked; excluded from architecture checks'},null,2));
 console.log('PASS: 7 photos × desktop/mobile; full decode, zoom, Esc/focus, both model directions, study loading.');
}finally{await browser.close();}
