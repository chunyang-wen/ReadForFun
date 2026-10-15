// CUA public controls only. No hidden state mutation; preserve formal-volume screenshots.
export async function replayOriginal(tab,save){
 const steps=[];
 const capture=async id=>{await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:true}));if(await tab.playwright.locator('#model-error').isVisible())throw Error(id+' viewer failure');const layout=await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}));if(layout.scrollWidth>layout.width)throw Error(id+' overflow');steps.push({id,layout,heading:await tab.playwright.locator('#chapter-title').textContent(),view:await tab.playwright.locator('#view-status').textContent()});};
 for(let i=0;i<7;i++){await tab.playwright.locator(`[data-chapter="${i}"]`).click();await capture('chapter-'+i);}
 await tab.playwright.locator('[data-chapter="0"]').click();for(const v of ['front','back','side','top','iso']){await tab.playwright.locator(`[data-view="${v}"]`).click();await capture('view-'+v);}
 await tab.playwright.locator('[data-chapter="3"]').click();
 for(const axis of ['x','z']){await tab.playwright.locator('#section-axis').selectOption(axis);for(const key of ['Home','End']){await tab.playwright.locator('#section-position').press(key);await capture('section-'+axis+'-'+key.toLowerCase());}await tab.playwright.locator('#section-flip').click();await capture('section-'+axis+'-flip');}
 await tab.playwright.locator('[data-chapter="2"]').click();await tab.playwright.locator('#member-list').selectOption({index:1});await capture('node-selected');if(!(await tab.playwright.locator('#selected-part').textContent()).match(/推定|判读/))throw Error('Missing evidence');
 await tab.playwright.locator('#explode').press('End');await capture('node-exploded');await tab.playwright.locator('#explode').press('Home');await capture('node-closed');
 await tab.playwright.locator('[data-chapter="6"]').click();await tab.playwright.locator('#explode').press('End');await capture('whole-exploded');
 await tab.playwright.locator('[data-layer="roof"]').uncheck();await tab.playwright.locator('#layers-all').click();await tab.playwright.locator('#reset-view').click();await capture('reset');
 await tab.playwright.locator('#viewport').press('ArrowLeft');await tab.playwright.locator('#viewport').press('+');await tab.playwright.locator('#viewport').press('0');await capture('keyboard-reset');
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error(JSON.stringify(logs));return {schema:'dule-original-replay/v1',utc:new Date().toISOString(),steps,logs};
}
