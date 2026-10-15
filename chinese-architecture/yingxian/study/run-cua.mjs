// Import in cua_repl, after selecting the browser/tab and reading viewport docs.
import {replay} from '../../realism-workflow/replay.mjs';
import {checkInteractions} from './interactions.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
export async function runDevice(browser,tab,repo,out,device){
 const config=JSON.parse(await readFile(repo+'/chinese-architecture/yingxian/study/experiment.json','utf8'));
 const viewport=await browser.capabilities.get('viewport');await viewport.set(config.capture[device]);await tab.reload();await tab.getAXState({emit:false});
 for(const suffix of ['', '-interactions'])await mkdir(out+'/'+device+suffix,{recursive:true});
 const report=await replay(tab,config,(name,bytes)=>writeFile(out+'/'+device+'/'+name,bytes),{viewport:device});
 await writeFile(out+'/'+device+'.json',JSON.stringify(report,null,2));
 const interactions=await checkInteractions(tab,(name,bytes)=>writeFile(out+'/'+device+'-interactions/'+name,bytes));
 await writeFile(out+'/'+device+'-interactions.json',JSON.stringify(interactions,null,2));
 return {device,scenes:report.results.length,interactions:interactions.results.length,logs:report.logs};
}
