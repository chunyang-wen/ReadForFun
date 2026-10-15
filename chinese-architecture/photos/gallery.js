import {PHOTO_STORIES} from './catalog.js?v=yingxian-03';
const assetUrl=new URL('./assets.json',import.meta.url);
function setPhoto(img,item,kind,onFailure=()=>{}){
 const fallback=new URL(`./fallback/${item.id}/${item.sha256.slice(0,16)}/${kind}.webp`,import.meta.url).href;
 img.onerror=()=>{if(img.src!==fallback){img.src=fallback;}else{onFailure();}};img.src=item[kind];
}
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./gallery.css?v=photo-atlas-02',import.meta.url);document.head.append(css);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const link=(text,url)=>{const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener';return a;};
export async function mountPhotoGallery(host,building){
 const story=PHOTO_STORIES[building];if(!host||!story)return;
 host.id='real-photos';host.classList.add('photo-gallery');host.setAttribute('aria-label',`${story.name}实景照片`);
 const heading=el('div','photo-heading');heading.append(el('div','photo-kicker','实景图录 / PHOTOGRAPHIC ATLAS'),el('h2','','模型读结构，照片看细节。'),el('p','',story.intro||`共 ${story.items.length} 张实景，从整体角度到构件细部。点击照片，可展开高清图像。`));host.append(heading);
 try{
  const response=await fetch(assetUrl,{cache:'no-cache'});if(!response.ok)throw Error('catalog unavailable');
  const assets=await response.json();const items=story.items.map(s=>({...s,...assets.find(a=>a.id===s.id)}));
  if(items.some(i=>!i.original))throw Error('asset unavailable');
  let current=0,zoom=1,lastFocus,previousOverflow;
  const body=el('div','photo-body'),figure=el('figure','photo-figure'),open=el('button','photo-open'),image=el('img');image.loading='lazy';image.decoding='async';
  const badge=el('span','photo-enlarge','展开高清 ↗');open.append(image,badge);figure.append(open);
  const caption=el('figcaption','photo-credit');figure.append(caption);
  const aside=el('div','photo-story'),tag=el('p','photo-tag'),title=el('h3'),look=el('p','photo-look'),limit=el('p','photo-limit');
  const model=el('button','photo-model');model.type='button';const count=el('span','photo-count'),paging=el('div','photo-paging'),before=el('button','','←'),after=el('button','','→');before.setAttribute('aria-label','上一张照片');after.setAttribute('aria-label','下一张照片');before.type=after.type='button';paging.append(count,before,after);title.setAttribute('aria-live','polite');before.addEventListener('click',()=>select(current-1));after.addEventListener('click',()=>select(current+1));aside.append(paging,tag,title,look,model,limit);body.append(figure,aside);
  const thumbs=el('div','photo-thumbs');thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','选择实景照片');
  const buttons=items.map((item,i)=>{const b=el('button','photo-thumb');b.type='button';const im=el('img');setPhoto(im,item,'thumb');im.alt='';im.loading='lazy';b.append(im,el('span','',item.tag));b.addEventListener('click',()=>select(i));thumbs.append(b);return b;});
  const dialog=el('dialog','photo-dialog');dialog.setAttribute('aria-label','高清照片查看器');
  const toolbar=el('div','photo-dialog-toolbar'),dialogTitle=el('strong'),close=el('button','','关闭 ×');close.type='button';close.autofocus=true;toolbar.append(dialogTitle,close);
  const zoomBar=el('div','photo-zoom-bar'),prev=el('button','','← 上一张'),next=el('button','','下一张 →'),fit=el('button','','适合窗口'),label=el('label','','放大 '),range=el('input'),output=el('output');
  range.type='range';range.min='100';range.max='400';range.step='25';range.value='100';range.setAttribute('aria-label','照片放大比例');label.append(range,output);zoomBar.append(prev,next,fit,label);
  const scroller=el('div','photo-scroll');scroller.tabIndex=0;scroller.setAttribute('aria-label','高清照片；放大后可滚动查看细节');const high=el('img');high.decoding='async';high.draggable=false;scroller.append(high);
  const status=el('p','photo-load');status.setAttribute('role','status');const credits=el('div','photo-dialog-credit');
  dialog.append(toolbar,zoomBar,status,scroller,credits);const attribution=el('details','photo-attribution'),summary=el('summary','',`全部照片出处与许可（${items.length} 张）`),licenseList=el('div','photo-licenses');attribution.append(summary,el('p','','实景照片与历史扫描分别标明年代；图片仅等比缩小、格式转换或提取原刊整页，原始素材未改动。'),licenseList);for(const item of items){const entry=el('article','photo-credit');entry.append(el('p','',item.sourceFile));const line=el('div');credit(line,item);entry.append(line);licenseList.append(entry);}host.append(body,thumbs,attribution,dialog);if(story.relatedSources?.length){const sources=el('div','photo-related-sources');sources.append(el('h3','','补充影像来源'));for(const source of story.relatedSources){const article=el('article');article.append(link(source.title+' ↗',source.url),el('p','photo-limit',source.note));sources.append(article);}host.append(sources);}
  function credit(node,item,full=false){node.replaceChildren(document.createTextNode(`${item.author} · ${item.date} · ${item.width} × ${item.height}　`),link('出处',item.source),document.createTextNode(' · '),link(item.license,item.licenseUrl));if(full)node.append(document.createTextNode(`。原作：${item.sourceFile}。${item.changes} `),link(item.originalLabel||'原始 JPEG ↗',item.original));}
  function scale(value){zoom=value;range.value=String(value*100);output.textContent=`${Math.round(value*100)}%`;high.style.width=value===1?'100%':`${scroller.clientWidth*value}px`;high.style.height=value===1?'100%':'auto';high.style.maxWidth='none';high.style.objectFit='contain';scroller.scrollTop=Math.max(0,(scroller.scrollHeight-scroller.clientHeight)/2);scroller.scrollLeft=Math.max(0,(scroller.scrollWidth-scroller.clientWidth)/2);}
  function loadHigh(){const item=items[current];dialogTitle.textContent=`${current+1} / ${items.length} · ${story.name} · ${item.title}`;high.alt=`${story.name}：${item.title}`;status.textContent='高清图加载中…';high.hidden=true;setPhoto(high,item,'full',()=>{status.textContent='高清图暂未加载，请使用下方出处或原始 JPEG 链接。';high.hidden=true;});credit(credits,item,true);scale(1);prev.disabled=current===0;next.disabled=current===items.length-1;}
  function select(i){if(i<0||i>=items.length)return;current=i;before.disabled=i===0;after.disabled=i===items.length-1;const item=items[i];setPhoto(image,item,'display',()=>{caption.replaceChildren(document.createTextNode('照片暂未加载，可查看原始出处：'),link('打开来源页',item.source));});badge.textContent=item.sourceType==='commons-pdf-page'?'查看原扫描 ↗':'展开高清 ↗';image.alt=`${story.name}：${item.title}`;image.width=item.width;image.height=item.height;open.setAttribute('aria-label',`展开高清：${item.title}`);tag.textContent=item.tag;title.textContent=item.title;look.textContent=item.look;limit.textContent=item.limit;model.textContent=`${item.modelLabel} ↑`;count.textContent=`${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;credit(caption,item);buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));if(dialog.open)loadHigh();}
  high.addEventListener('load',()=>{high.hidden=false;status.textContent='高清图已载入；放大后可滚动或轻扫查看局部。';});
  open.addEventListener('click',()=>{lastFocus=document.activeElement;dialog.showModal();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';loadHigh();});
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;lastFocus?.focus();});
  range.addEventListener('input',()=>scale(Number(range.value)/100));fit.addEventListener('click',()=>scale(1));prev.addEventListener('click',()=>select(current-1));next.addEventListener('click',()=>select(current+1));
  dialog.addEventListener('keydown',event=>{if(event.target===range)return;if(event.key==='ArrowRight'&&current<items.length-1){event.preventDefault();select(current+1);}if(event.key==='ArrowLeft'&&current>0){event.preventDefault();select(current-1);}if(event.key==='+'||event.key==='='){event.preventDefault();scale(Math.min(4,zoom+.25));}if(event.key==='-'){event.preventDefault();scale(Math.max(1,zoom-.25));}});
  const resize=new ResizeObserver(()=>{if(dialog.open)scale(zoom);});resize.observe(scroller);
  model.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('architecture:photo-model',{detail:{building,chapter:items[current].chapter,node:items[current].node}}));document.getElementById('studio')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  document.addEventListener('architecture:chapter',event=>{if(event.detail.building!==building||items[current].chapter===event.detail.chapter)return;const i=items.findIndex(item=>item.chapter===event.detail.chapter);if(i>=0)select(i);});
  const chapter=Number(document.querySelector('[data-chapter][aria-pressed="true"]')?.dataset.chapter||0);select(Math.max(0,items.findIndex(item=>item.chapter===chapter)));
 }catch(error){host.append(el('p','photo-limit','实景图录暂未加载。三维模型与下方研究资料仍可使用。'));console.warn('Photo gallery unavailable',error);}
}
