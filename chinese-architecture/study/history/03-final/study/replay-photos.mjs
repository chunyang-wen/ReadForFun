export async function replayPhotos(tab,save,{count=4}={}){
 const results=[];
 async function snap(id){
  await tab.getAXState({emit:false});await save(id+'.jpg',await tab.screenshot({fullPage:false}));
  const state=await tab.playwright.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},title:document.querySelector('.photo-story h3').textContent,chapter:document.querySelector('#chapter-title').textContent,dialogOpen:document.querySelector('.photo-dialog').open,focus:document.activeElement.className,images:[...document.querySelectorAll('.photo-figure img,.photo-dialog img')].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),zoom:document.querySelector('.photo-zoom-bar input').value,scroll:{height:document.querySelector('.photo-scroll').scrollHeight,clientHeight:document.querySelector('.photo-scroll').clientHeight,top:document.querySelector('.photo-scroll').scrollTop}}));
  await save(id+'.json',JSON.stringify(state,null,2));results.push({id,state});if(state.viewport.scrollWidth>state.viewport.width)throw Error('Gallery overflow');return state;
 }
 const thumbs=tab.playwright.locator('.photo-thumb');if(await thumbs.count()!==count)throw Error('Wrong photo count');
 for(let i=0;i<count;i++){
  await thumbs.nth(i).click();await tab.playwright.locator('.photo-open').click();
  await tab.playwright.getByText('高清图已载入；放大后可滚动或轻扫查看局部。',{exact:true}).waitFor({state:'visible'});
  const s=await snap('photo-'+i+'-full');if(!s.dialogOpen||s.images.some(i=>!i.complete||!i.width))throw Error('Image decoding failed');
  if(i===2){await tab.playwright.locator('.photo-zoom-bar input').press('End');await tab.playwright.locator('.photo-scroll').press('End');const zoom=await snap('photo-zoom');if(zoom.zoom!=='400'||zoom.scroll.height<=zoom.scroll.clientHeight)throw Error('Photo zoom failed');}
  await tab.playwright.getByRole('button',{name:'关闭 ×',exact:true}).press('Escape');const closed=await snap('photo-'+i+'-closed');if(closed.dialogOpen||closed.focus!=='photo-open')throw Error('Dialog focus return failed');
 }
 await thumbs.nth(2).click();await tab.playwright.locator('.photo-model').click();const mapped=await snap('photo-to-roof');if(mapped.chapter!=='循屋架')throw Error('Photo chapter mapping failed');
 await thumbs.nth(3).click();await tab.playwright.locator('.photo-model').click();const kept=await snap('photo-to-whole');if(kept.chapter!=='观全貌'||!kept.title.includes('补间'))throw Error('Same chapter photo lost');
 const logs=await tab.dev.logs({levels:['error','warn'],limit:100});if(logs.length)throw Error(JSON.stringify(logs));return{schema:'foguang-photo-replay/v1',utc:new Date().toISOString(),results,logs};
}
