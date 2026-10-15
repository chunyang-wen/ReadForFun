// Additional CUA-only checks on visible controls and public #stats. No hidden state injection.
export async function checkInteractions(tab,save){
 const results=[];
 const state=async()=>JSON.parse(await tab.playwright.locator('#stats').textContent());
 const record=async id=>{await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:true}));const s=await state();results.push({id,state:s});return s;};
 const check=(v,m)=>{if(!v)throw Error(m);};
 await tab.playwright.locator('[data-view="patch"]').click();await tab.playwright.locator('[data-mode="d"]').click();await tab.playwright.locator('#storey').selectOption('C1');
 let s=await record('isolate-gallery');check(s.visibleStoreys.length===1&&s.visibleStoreys[0]==='C1','Gallery isolation leaks');
 await tab.playwright.locator('#member').selectOption('yingxian/C1/face-0/cover-tile/0/-13');s=await record('select-tile');check(s.selected.startsWith('yingxian/C1/face-0/cover-tile/'),'Missing stable tile selection');
 await tab.playwright.locator('#section').check();s=await record('section-gallery');check(s.section,'Section control failed');
 await tab.playwright.locator('#explode').check();s=await record('lift-gallery');check(s.sampleLift===2&&s.roofLift,'Sample did not follow roof');
 await tab.playwright.locator('#section').uncheck();await tab.playwright.locator('#explode').uncheck();await tab.playwright.locator('#storey').selectOption('all');
 await tab.playwright.locator('[data-view="boundary"]').click();await tab.playwright.locator('#storey').selectOption('D2');s=await record('isolate-dark');check(s.visibleStoreys.length===1&&s.visibleStoreys[0]==='D2','Dark boundary isolation leaks');
 await tab.playwright.locator('#storey').selectOption('M2');s=await record('isolate-ming');check(s.visibleStoreys.length===1&&s.visibleStoreys[0]==='M2','Ming boundary isolation leaks');
 await tab.playwright.locator('#storey').selectOption('all');await tab.playwright.locator('[data-view="node"]').click();check(!await tab.playwright.locator('#storey').isEnabled(),'Node isolation must be disabled');
 const options=await tab.playwright.locator('#member option').all();const values=[];for(const o of options){const text=await o.textContent();if(text.startsWith('insert')||text.startsWith('landing'))values.push(await o.getAttribute('value'));}
 check(values.length===2,'Separate landing and insertion unavailable');for(const v of values){await tab.playwright.locator('#member').selectOption(v);s=await record('node-'+(v.includes('insert')?'insert':'landing'));check(s.selected===v,'Wrong local evidence');}
 await tab.playwright.locator('[data-view="whole"]').click();await tab.playwright.locator('canvas').click();s=await record('canvas-pick');check(s.selected.length>0,'Real canvas pick failed');
 const position=s.camera;await tab.playwright.locator('#viewport').press('ArrowLeft');s=await record('keyboard-rotate');check(JSON.stringify(s.camera)!==JSON.stringify(position),'Keyboard rotation failed');await tab.playwright.locator('#viewport').press('0');s=await record('keyboard-reset');check(JSON.stringify(s.camera)===JSON.stringify(position),'Keyboard reset failed');
 return {schema:'yingxian-interactions/v1',utc:new Date().toISOString(),results};
}
