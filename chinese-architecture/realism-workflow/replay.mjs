// Run inside cua_repl with an already selected tab. No browser launcher or hidden page mutation.
// screenshot sink: async (fileName, jpegBytes) => save bytes under this run's output directory.
export async function replay(tab,config,save,{cases=config.checks,viewport='desktop'}={}){
  const results=[];
  for(const c of cases){
    await tab.playwright.locator(`[data-view="${c.view}"]`).click();
    await tab.playwright.locator(`[data-mode="${c.mode}"]`).click();
    await tab.playwright.locator('#light').setChecked(Boolean(c.light));
    await tab.playwright.locator('#explode').setChecked(Boolean(c.lift));
    await tab.getAXState({emit:false});
    // Screenshot flushes a visible frame before reading the public diagnostics.
    await save(c.id+'.jpg',await tab.screenshot({fullPage:true}));
    const state=JSON.parse(await tab.playwright.locator('#stats').textContent());
    if(state.mode!==c.mode||state.view!==c.view||state.alternateLight!==Boolean(c.light)||state.roofLift!==Boolean(c.lift))throw Error('Replay state mismatch: '+c.id);
    if(state.revision!==config.revision||state.architecture!==config.id)throw Error('Wrong page revision');
    if(JSON.stringify(state.patch)!==JSON.stringify(config.patch)||state.fov!==config.capture.cameraFov)throw Error('Page parameters differ from replay manifest');
    if(await tab.playwright.locator('#error').isVisible())throw Error('Viewer failed: '+c.id);
    const layout=await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}));
    if(layout.scrollWidth>layout.width)throw Error('Horizontal overflow: '+c.id);
    if(layout.width!==config.capture[viewport].width||layout.height!==config.capture[viewport].height)throw Error('Wrong capture viewport: '+viewport);
    const sameView=results.find(r=>r.state.view===state.view);
    if(sameView&&JSON.stringify(sameView.state.camera)!==JSON.stringify(state.camera))throw Error('Camera differs between conditions');
    results.push({id:c.id,state,layout});
  }
  const logs=await tab.dev.logs({levels:['error','warn'],limit:100});
  if(logs.length)throw Error('Browser errors/warnings: '+JSON.stringify(logs));
  return {schema:'architecture-replay/v1',architecture:config.id,revision:config.revision,viewport,utc:new Date().toISOString(),results,logs};
}
