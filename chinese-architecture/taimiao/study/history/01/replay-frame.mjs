// CUA-only fallback when browser viewport override does not change innerWidth/innerHeight.
// capture.html provides a real same-origin browsing context of the requested size.
import {replay} from '../../realism-workflow/replay.mjs';
export async function replayFrame(tab,config,save,device){
 const frame=tab.playwright.frameLocator('iframe');
 const adapt={
  playwright:{
   locator(selector){const match=selector.match(/^\[data-(mode|view)="([^"]+)"\]$/);return frame.getByTestId(match?match[1]+'-'+match[2]:selector.slice(1));},
   async evaluate(){return JSON.parse(await frame.getByTestId('stats').textContent()).layout;}
  },
  getAXState:opts=>tab.getAXState(opts),
  async screenshot(){await frame.getByTestId('top').click();await tab.getAXState({emit:false});return tab.screenshot({fullPage:true});},
  dev:tab.dev
 };
 const result=await replay(adapt,config,save,{viewport:device});
 return {...result,captureMethod:'CUA fixed-size same-origin iframe; screenshots include host canvas, not device emulation',hostLayout:await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight}))};
}
