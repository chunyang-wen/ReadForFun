// Visible-control integration checks; run after the common fixed-camera replay.
export async function replayCompletion(tab,save){
 const results=[];
 async function snapshot(id){
  await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:true}));
  const state=JSON.parse(await tab.playwright.locator('#stats').textContent());
  if(await tab.playwright.locator('#error').isVisible())throw Error('Viewer error '+id);
  const layout=await tab.playwright.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  if(layout.scrollWidth>layout.width)throw Error('Horizontal overflow '+id);
  results.push({id,state,layout});return state;
 }
 await tab.playwright.locator('#reset').click();await tab.playwright.locator('[data-mode="g"]').click();await tab.playwright.locator('[data-view="facade"]').click();
 await tab.playwright.locator('#pick-door').click();const closed=await snapshot('door-closed');
 if(!closed.projectedBuilding||closed.projectedBuilding.min.some(v=>v < -1)||closed.projectedBuilding.max.some(v=>v > 1))throw Error('Facade building cropped');
 if(closed.selected!=='foguang/enclosure-v2/front/bay-3/leaf-left/plank-2'||!closed.selectionBounds)throw Error('Door selection missing');
 await tab.playwright.locator('#door').setChecked(true);const open=await snapshot('door-open');
 if(!open.doorOpen||open.selected!==closed.selected||JSON.stringify(open.selectionBounds)===JSON.stringify(closed.selectionBounds))throw Error('Door/selection did not move');
 await tab.playwright.locator('#layer-enclosure').setChecked(false);const hidden=await snapshot('enclosure-hidden');
 if(!hidden.hiddenLayers.includes('enclosure')||hidden.selectionBounds!==null||hidden.activeInstances>=open.activeInstances)throw Error('Hidden enclosure is still selectable/visible');
 await tab.playwright.locator('#reset').click();await tab.playwright.locator('[data-view="section"]').click();await tab.playwright.locator('#section').setChecked(true);const section=await snapshot('section-x');if(!section.section)throw Error('Section switch failed');
 await tab.playwright.locator('#section-axis').selectOption('z');const sectionZ=await snapshot('section-z');if(sectionZ.sectionAxis!=='z')throw Error('Section axis failed');
 await tab.playwright.locator('#reset').click();await tab.playwright.locator('[data-view="whole"]').click();await tab.playwright.locator('#separate').press('End');const split=await snapshot('maximum-split');
 if(!split.projectedBuilding||split.projectedBuilding.min.some(v=>v < -1)||split.projectedBuilding.max.some(v=>v > 1))throw Error('Exploded building cropped');
 if(Math.max(split.projectedBuilding.max[0]-split.projectedBuilding.min[0],split.projectedBuilding.max[1]-split.projectedBuilding.min[1])<1.5)throw Error('Exploded building too small');
 if(split.totalSplit!==100||split.roofWorldY!==18||split.anchorWorldY!==.5)throw Error('Layer split endpoint failed');
 await tab.playwright.locator('#reset').click();await tab.playwright.locator('[data-view="patch"]').click();await tab.playwright.locator('#pick-sample').click();const roof=await snapshot('whole-roof-selected');
 await tab.playwright.locator('#explode').setChecked(true);const lifted=await snapshot('whole-roof-selected-lift');
 if(roof.selected!==lifted.selected||!lifted.selected.includes('surface-v2')||Math.abs(lifted.selectionBounds.min[1]-roof.selectionBounds.min[1]-2)>1e-6)throw Error('Roof selection failed to follow layer');
 await tab.playwright.locator('#reset').click();await tab.playwright.locator('[data-view="facade"]').click();await tab.playwright.locator('canvas').click();const picked=await snapshot('completed-canvas-pick');
 if(!picked.selected)throw Error('Completed model canvas raycast missed');
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error(JSON.stringify(logs));
 return {schema:'foguang-completion-replay/v1',results,logs};
}
