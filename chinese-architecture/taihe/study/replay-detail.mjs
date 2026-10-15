import {replay} from '../../realism-workflow/replay.mjs';

// Extends the existing replay without changing the shared runner used by other volumes.
export async function replayDetail(tab,config,save,{viewport='desktop'}={}){
  await tab.playwright.locator('#photo-opacity').fill('0');
  const report=await replay(tab,config,save,{viewport});
  await tab.playwright.locator('[data-mode="e"]').click();
  await tab.playwright.locator('[data-view="photo"]').click();
  const overlays=[];
  for(const opacity of [0,50,100]){
    await tab.playwright.locator('#photo-opacity').fill(String(opacity));await tab.getAXState({emit:false});
    await save(`photo-overlay-${opacity}.jpg`,await tab.screenshot({fullPage:true}));
    const state=JSON.parse(await tab.playwright.locator('#stats').textContent());
    if(state.photoOpacity!==opacity||state.calibration.fitPixels>=2||state.calibration.holdoutPixels>=2)throw Error('Local calibration/overlay mismatch');
    const image=await tab.playwright.locator('#photo-overlay').evaluate(el=>({loaded:el.complete&&el.naturalWidth===1000,opacity:getComputedStyle(el).opacity}));
    if(!image.loaded||Math.abs(Number(image.opacity)-opacity/100)>1e-6)throw Error('Reference overlay missing');
    overlays.push({opacity,state});
  }
  await tab.playwright.locator('#photo-opacity').fill('0');
  return {...report,localRegistration:overlays,scope:'Only plaque plane; edge checks share the same plane, not independent camera/survey certification'};
}
