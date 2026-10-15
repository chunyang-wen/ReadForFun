import {replay as sharedReplay} from '../../realism-workflow/replay.mjs';
export async function replay(tab,config,save,options){
 const report=await sharedReplay(tab,config,save,options);
 for(const r of report.results){
  if(r.state.columnLayerY!==0||r.state.sampleWorldY!==(r.state.roofLift?2:0))throw Error('Roof ownership regression');
  if(JSON.stringify(r.state.envelope)!==JSON.stringify(config.envelope)||r.state.supportLayerY!==0||r.state.upperAngCount!==2)throw Error('Envelope/upper-node regression');
  if(r.state.clipEnabled!==(r.state.view==='section'))throw Error('Section mismatch');
 }
 await tab.playwright.locator('[data-view="patch"]').click();await tab.playwright.locator('[data-mode="d"]').click();
 await tab.playwright.locator('#member').selectOption('dule/upper-south/cover-tile/0/-7');await tab.getAXState({emit:false});
 if(!(await tab.playwright.locator('#selected').textContent()).includes('比例推定'))throw Error('Evidence selection mismatch');
 await save('selected-evidence.jpg',await tab.screenshot({fullPage:true}));
 await tab.playwright.locator('[data-view="street"]').click();await tab.playwright.locator('[data-mode="f"]').click();await tab.playwright.locator('#member').selectOption({index:1});await tab.getAXState({emit:false});
 if(!(await tab.playwright.locator('#selected').textContent()).includes('非辽构柱网'))throw Error('Support evidence missing');await save('support-evidence.jpg',await tab.screenshot({fullPage:true}));
 report.supportSelection=await tab.playwright.locator('#selected').textContent();
 report.selection=await tab.playwright.locator('#selected').textContent();return report;
}
