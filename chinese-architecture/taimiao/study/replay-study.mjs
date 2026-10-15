// CUA UI replay, including section and geometry ownership checks specific to this study.
export async function replayStudy(tab,config,save,device,{cases=config.checks,previous=[]}={}){
 const f=tab.playwright.frameLocator('iframe'),results=[];
 for(const c of cases){
  await f.getByTestId('view-'+c.view).click();await f.getByTestId('mode-'+c.mode).click();
  await f.getByTestId('section').setChecked(Boolean(c.section));await f.getByTestId('light').setChecked(Boolean(c.light));await f.getByTestId('explode').setChecked(Boolean(c.lift));
  await f.getByTestId('top').click();await tab.getAXState({emit:false});
  const screenshot=await tab.screenshot({fullPage:true});const state=JSON.parse(await f.getByTestId('stats').textContent());
  if(state.mode!==c.mode||state.view!==c.view||state.section!==Boolean(c.section)||state.roofLift!==Boolean(c.lift)||state.alternateLight!==Boolean(c.light))throw Error('Wrong visible control state '+c.id);
  if(JSON.stringify(state.roofSystem)!==JSON.stringify(config.roofSystem)||JSON.stringify(state.finishMaterials)!==JSON.stringify(config.finishMaterials))throw Error('Wrong full-roof/material parameters');
  if(state.architecture!==config.id||state.revision!==config.revision||state.fov!==config.capture.cameraFov||JSON.stringify(state.patch)!==JSON.stringify(config.patch))throw Error('Wrong experiment parameters');
  if(state.layout.width!==config.capture[device].width||state.layout.height!==config.capture[device].height||state.layout.scrollWidth>state.layout.width)throw Error('Wrong inner viewport or overflow');
  if(await f.getByTestId('error').isVisible())throw Error('Viewer error');
  const prior=[...previous,...results].find(r=>r.state.view===state.view);if(prior&&JSON.stringify(prior.state.camera)!==JSON.stringify(state.camera))throw Error('Camera changed across conditions');
  if(c.mode==='f'&&(state.continuousWorldY!==(c.lift?2:0)||state.timberWorldY!==0||state.replacedEaveSegments<=0))throw Error('Roof/timber ownership mismatch');
  await save(c.id+'.jpg',screenshot);results.push({id:c.id,state});
 }
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error('Browser logs: '+JSON.stringify(logs));
 return{schema:'architecture-replay/v2',architecture:config.id,revision:config.revision,device,utc:new Date().toISOString(),captureMethod:'CUA same-origin fixed iframe, original full host screenshot',results,logs};
}
