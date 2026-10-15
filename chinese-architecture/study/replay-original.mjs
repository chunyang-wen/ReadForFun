// Additional production viewer check, via documented visible controls in cua_repl.
export async function replayOriginal(tab,save){
 const results=[];
 const snap=async id=>{await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:true}));
  if(await tab.playwright.locator('#model-error').isVisible())throw Error('Production viewer error');
  const layout=await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}));
  if(layout.scrollWidth>layout.width)throw Error('Production overflow');
  results.push({id,layout,chapter:await tab.playwright.locator('#chapter-title').textContent(),status:await tab.playwright.locator('#view-status').textContent(),selected:await tab.playwright.locator('#selected-part').textContent()});};
 await tab.playwright.locator('[data-view="front"]').click();await snap('original-front');
 await tab.playwright.locator('[data-view="iso"]').click();await snap('original-oblique');
 await tab.playwright.locator('#section-toggle').setChecked(true);
 await tab.playwright.locator('#section-axis').selectOption('z');
 await tab.playwright.locator('#section-flip').click();await tab.playwright.locator('[data-view="side"]').click();await snap('original-section');
 await tab.playwright.locator('#reset-view').click();
 await tab.playwright.locator('[data-chapter="2"]').click();
 await tab.playwright.locator('#explode').press('End');await snap('original-bracket-exploded');
 if((await tab.playwright.locator('#explode-value').textContent())!=='100%')throw Error('Explode endpoint failed');
 await tab.playwright.locator('#explode').press('Home');
 await tab.playwright.locator('#viewport canvas').click();await snap('original-picked');
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error(JSON.stringify(logs));
 return {results,logs};
}
