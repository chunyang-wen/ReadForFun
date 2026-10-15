import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const base=process.env.PREVIEW_URL||'http://localhost:8765',out=new URL('../updates/03/',import.meta.url),baseline=await readFile(new URL('baseline/model.js',out)),current=await readFile(new URL('../model.js',import.meta.url));
const report={modelSHA256:{baseline:createHash('sha256').update(baseline).digest('hex'),current:createHash('sha256').update(current).digest('hex')},views:[],errors:[],resources:[]};
const state=p=>p.evaluate(async()=>(await import(document.querySelector('script[type=module][src]').src)).getViewerState());
try{
 for(const device of ['desktop','mobile']){
  const cameras=new Map();
  for(const condition of ['baseline','current']){
   const page=await browser.newPage({viewport:device==='desktop'?{width:1280,height:900}:{width:390,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));
   await page.route('https://www.googletagmanager.com/**',r=>r.abort());
   if(condition==='baseline')await page.route('**/yingxian/model.js*',r=>r.fulfill({contentType:'application/javascript',body:baseline}));
   page.on('response',async r=>{if(r.url().includes('/yingxian/model.js'))report.resources.push({device,condition,url:r.url(),sha256:createHash('sha256').update(await r.body()).digest('hex')});});
   await page.goto(base+'/chinese-architecture/yingxian/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#model-loading').hidden);
   assert.equal((await state(page)).revision,'yingxian-03');
   for(const view of ['front','side','back','top','iso']){
    await page.locator(`[data-view="${view}"]`).click();await page.waitForTimeout(120);const s=await state(page);
    if(condition==='baseline')cameras.set(view,s.camera);else s.camera.forEach((x,i)=>assert.ok(Math.abs(x-cameras.get(view)[i])<1e-6));
    await page.locator('#viewport').screenshot({path:new URL(`${device}-${condition}-${view}.jpg`,out).pathname});report.views.push({device,condition,view,camera:s.camera,target:s.target,matchedCamera:true});
   }
   if(condition==='current'){
    await page.locator('[data-chapter="2"]').click();const opts=await page.locator('#member-list option').evaluateAll(es=>es.map(e=>({label:e.text,value:e.value})));
    const insertion=opts.find(e=>e.label.includes('插入'));assert.ok(insertion);await page.locator('#member-list').selectOption(insertion.value);const before=await state(page);assert.ok(before.selection);
    await page.locator('#explode').evaluate(e=>{e.value='100';e.dispatchEvent(new Event('input'));});await page.waitForFunction(async()=>{const s=(await import(document.querySelector('script[type=module][src]').src)).getViewerState();return s.explode===1;});const after=await state(page);
    assert.equal(after.selection.id,before.selection.id);assert.ok(after.selection.box.min[1]>before.selection.box.min[1]);assert.ok(Math.abs(after.selection.box.min[1]-before.selection.box.min[1]-3)<1e-6);
    await page.locator('#viewport').screenshot({path:new URL(device+'-selection-exploded.jpg',out).pathname});report.views.push({device,selectionFollowsExplosion:{before:before.selection,after:after.selection},actualDeltaY:3});
    await page.goto(base+'/chinese-architecture/photos/preview.html?book=yingxian&device='+device,{waitUntil:'domcontentloaded'});const frame=page.frameLocator('iframe');await frame.locator('.photo-thumb').nth(6).waitFor();assert.ok((await frame.locator('h1').innerText()).includes('应县'));assert.equal(await frame.locator('body').evaluate(()=>innerWidth),device==='desktop'?1280:390);report.views.push({device,sharedPreviewRoutesToYingxian:true});
    await page.goto(base+'/chinese-architecture/yingxian/study/',{waitUntil:'domcontentloaded'});await page.locator('#stats').filter({hasText:'yingxian'}).waitFor({state:'attached'});await page.locator('[data-mode="d"]').click();await page.locator('[data-view="corner"]').click();await page.locator('#light').check();await page.locator('#viewport').screenshot({path:new URL(device+'-study-reverse-light.jpg',out).pathname});
   }
   await page.close();
  }
 }
 assert.deepEqual(report.errors,[]);assert.equal(report.resources.filter(r=>r.condition==='baseline').length,2);assert.ok(report.resources.filter(r=>r.condition==='current').length>=2);for(const r of report.resources)assert.equal(r.sha256,report.modelSHA256[r.condition]);
 await writeFile(new URL('comparison-browser.json',out),JSON.stringify(report,null,2)+'\n');console.log('PASS: fixed cameras × 5 views × desktop/mobile × baseline/current; actual module hashes; selected insertion follows 3m explosion; Yingxian preview route; study reverse light.');
}finally{await browser.close();}
