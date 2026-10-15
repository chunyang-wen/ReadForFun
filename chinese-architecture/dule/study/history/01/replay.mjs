import {replay as sharedReplay} from '../../realism-workflow/replay.mjs';
export async function replay(tab,config,save,options){
 const report=await sharedReplay(tab,config,save,options);
 for(const r of report.results){
  if(r.state.columnLayerY!==0||r.state.sampleWorldY!==(r.state.roofLift?2:0))throw Error('Roof ownership regression');
  if(r.state.clipEnabled!==(r.state.view==='section'))throw Error('Section mismatch');
 }
 await tab.playwright.locator('[data-view="patch"]').click();await tab.playwright.locator('[data-mode="d"]').click();
 await tab.playwright.locator('#member').selectOption('dule/upper-south/cover-tile/0/-7');await tab.getAXState({emit:false});
 if(!(await tab.playwright.locator('#selected').textContent()).includes('比例推定'))throw Error('Evidence selection mismatch');
 await save('selected-evidence.jpg',await tab.screenshot({fullPage:true}));
 report.selection=await tab.playwright.locator('#selected').textContent();return report;
}
