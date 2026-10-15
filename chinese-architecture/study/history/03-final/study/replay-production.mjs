// CUA only. All state changes use visible controls. Public diagnostics are read-only.
export async function replayProduction(tab,save,config,device){
 const results=[];
 async function snap(id,{fit=true}={}){
  await tab.playwright.locator('#runtime-state[data-settled="true"]').waitFor({state:'attached'});
  await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:true}));
  const state=JSON.parse(await tab.playwright.locator('#runtime-state').textContent());
  const layout=await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,script:[...document.scripts].map(s=>s.src).find(s=>s.includes('app.js'))}));
  await save(id+'.json',JSON.stringify({state,layout},null,2));
  if(await tab.playwright.locator('#model-error').isVisible())throw Error('Viewer failed '+id);
  if(state.revision!==config.revision||state.architecture!==config.id)throw Error('Wrong revision');
  if(layout.width!==config.capture[device].width||layout.height!==config.capture[device].height||layout.scrollWidth>layout.width)throw Error('Wrong viewport or overflow');
  if(fit&&(state.projected.min.some(v=>v<-.88)||state.projected.max.some(v=>v>.88)))throw Error('Building cropped '+id);
  results.push({id,state,layout});return state;
 }
 const front=tab.playwright.locator('[data-view="front"]');
 await tab.playwright.locator('#reset-view').click();await front.click();const normal=await snap('production-front');
 await tab.playwright.locator('#light-toggle').setChecked(true);const light=await snap('production-reverse-light');
 if(JSON.stringify(normal.camera)!==JSON.stringify(light.camera))throw Error('Light changes camera');
 await tab.playwright.locator('#light-toggle').setChecked(false);
 for(const view of ['iso','side','top']){await tab.playwright.locator(`[data-view="${view}"]`).click();await snap('production-'+view);}
 await tab.playwright.locator('#section-toggle').setChecked(true);await tab.playwright.locator('[data-view="side"]').click();await snap('production-section-x');
 await tab.playwright.locator('#section-axis').selectOption('z');await tab.playwright.locator('#section-flip').click();const cut=await snap('production-section-z');if(!cut.section||cut.axis!=='z')throw Error('Cut failed');
 await tab.playwright.locator('[data-chapter="3"]').click();const beams=await snap('production-beam-section-x');if(!beams.hiddenLayers.includes('enclosure')||!beams.hiddenLayers.includes('roof'))throw Error('Structural section still occluded');
 await tab.playwright.locator('#section-axis').selectOption('z');await front.click();await snap('production-beam-section-z');
 await tab.playwright.locator('#reset-view').click();await tab.playwright.locator('[data-chapter="5"]').click();await tab.playwright.locator('#explode').press('Home');
 for(let i=0;i<5;i++)await tab.playwright.locator('#explode').press('PageUp');const mid=await snap('production-mid-split');if(Math.abs(mid.explode-.5)>.001)throw Error('Mid split failed');
 await tab.playwright.locator('#explode').press('End');const split=await snap('production-maximum-split');if(split.explode!==1)throw Error('Split not settled');
 await tab.playwright.locator('#reset-view').click();await tab.playwright.locator('[data-chapter="2"]').click();await tab.playwright.locator('#viewport canvas').click();const picked=await snap('production-picked');if(!picked.selected||!picked.selectionBounds)throw Error('Canvas pick missed');
 await tab.playwright.locator('#explode').press('End');const moved=await snap('production-picked-exploded');if(moved.selected!==picked.selected||JSON.stringify(moved.selectionBounds)===JSON.stringify(picked.selectionBounds))throw Error('Selection did not follow');
 await tab.playwright.locator('[data-layer="brackets"]').setChecked(false);const hidden=await snap('production-hidden');if(hidden.selected!==null)throw Error('Hidden pick remains');
 await tab.playwright.locator('#reset-view').click();await tab.playwright.locator('#color-toggle').setChecked(true);await snap('production-layer-colors');await tab.playwright.locator('#reset-view').click();
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error(JSON.stringify(logs));
 return{schema:'foguang-production-replay/v1',utc:new Date().toISOString(),device,results,logs};
}
