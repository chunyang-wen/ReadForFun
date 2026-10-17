import {placeLabels,discoveryFor,cityLetters} from './map-discovery.js';
import {geographyPanel,cultureLibrary,articleCulture} from './knowledge.js';
import {categories} from './data.js';
import {destinations,atlasDestinations,destinationForProvince,destinationPath,articlePath,resolveDestination,matchesDestination} from './destinations.js';
let destination=destinations.chengdu,articles=destination.articles,sources=destination.sources;
const main=document.querySelector('#main');
if('scrollRestoration' in history)history.scrollRestoration='manual';
const read=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
let state={province:'',city:'',query:'',category:'all',mobile:'list',...read('travel-atlas-v1',{})};
if(!Object.hasOwn(categories,state.category))state.category='all';
if(state.city&&!destinations[state.city])state.city='';
let stopDiscovery=()=>{},dismissDiscovery=()=>{};
let geo=null, geoError=false, currentRoute='', renderVersion=0;
const positions=read('travel-scroll-v1',{});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=(scene,label,extra='')=>typeof scene==='object'?`<div class="art art-sheet ${extra}" style="--scene-url:url('${esc(scene.url)}');--scene-position:${esc(scene.position)};--scene-size:${esc(scene.size)};--scene-ratio:${esc(scene.ratio)}" role="img" aria-label="${esc(label)}，AI 淡彩插画，艺术化呈现"><span class="art-label">艺术化呈现</span></div>`:`<div class="art scene-${scene} ${scene>=6?'culture-art':''} ${extra}" role="img" aria-label="${esc(label)}，AI 淡彩插画，艺术化呈现"><span class="art-label">艺术化呈现</span></div>`;
const card=a=>`<a class="story-card" href="#${articlePath(destination,a)}" data-route>${art(a.scene,a.short)}<p class="card-meta">${a.tags.map(t=>categories[t]).join(' · ')} / 约 ${a.minutes} 分钟</p><h3>${a.title}</h3><p>${a.dek}</p><span class="read-link">读一段地方故事 ↗</span></a>`;
const breadcrumb=(article)=>`<nav class="breadcrumbs" aria-label="当前位置"><a href="#/atlas" data-route>中国旅行图志</a><span aria-hidden="true">/</span>${destination.parent?`<a href="#${destinationPath(destinations[destination.parent])}" data-route>${destinations[destination.parent].name}</a><span aria-hidden="true">/</span>`:''}${article?`<a href="#${destinationPath(destination)}" data-route>${destination.parent?destination.name:destination.label}</a><span aria-hidden="true">/</span><span>${esc(article.short)}</span>`:`<span>${destination.parent?destination.name:destination.label}</span>`}</nav>`;
function provinceDirectory(d){
 const covered=new Set(d.articles.map(a=>a.region).filter(Boolean));
 return `<section class="province-directory" aria-label="云南各州、市阅读目录"><div class="directory-heading"><div><p class="eyebrow">ONE PROVINCE, MANY PLACES</p><h2>一省山河，逐城展开</h2></div><p>${d.divisions.length} 个州、市列入目录<br>${covered.size} 个地区已有选篇 · ${d.articles.length} 篇独立故事</p></div><p class="directory-intro">先认识地方，再深入城市、景点、人物与生活。下列篇数只计算已经可以阅读的文章；后续主题不会计为已收录，单城展开也不代表全省完成。</p><div class="filter-pills directory-filters" role="group" aria-label="按收录状态查看州、市"><button data-coverage="all" aria-pressed="true">全部 ${d.divisions.length}</button><button data-coverage="covered" aria-pressed="false">已有选篇 ${covered.size}</button><button data-coverage="pending" aria-pressed="false">待补 ${d.divisions.length-covered.size}</button></div><div class="prefecture-grid">${d.directory.map((item,i)=>{const region=d.divisions.find(v=>v.code===item.code),stories=d.articles.filter(a=>a.region===item.code),child=item.city&&destinations[item.city];return `<article data-story-count="${stories.length}" class="prefecture-card ${child?'is-expanded':''}"><div class="prefecture-meta"><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${item.en}</span><span class="coverage-badge">${child?'城市专题 · '+stories.length+' 篇':stories.length?'已有选篇 · '+stories.length+' 篇':'专题待补'}</span></div><h3>${item.short}</h3><p class="prefecture-type">${region.name}</p><p>${item.lead}</p><p class="prefecture-places">代表地点：${item.places.join(' · ')}</p><ul>${item.themes.map(t=>`<li>${t}</li>`).join('')}</ul>${child?`<a class="read-link" href="#${destinationPath(child)}" data-route>进入${child.name}专题 →</a>`:stories.length?`<a class="read-link" href="#${destinationPath(d)}?region=${item.code}" data-route>先读现有 ${stories.length} 篇 →</a>`:'<span class="muted coverage-wait">尚无正文，不作为已完成内容</span>'}<details class="directory-next"><summary>后续主题</summary><p>${item.next.join('；')}。逐项查证、制作后再收录。</p></details></article>`}).join('')}</div></section>`;
}
function destinationFacts(d,{directory=true}={}){
 if(d.kind==='city')return geographyPanel({city:true,destination:d,coverage:d.articles.length});
 return geographyPanel({province:d.province,name:d.provinceName,coverage:d.articles.length})+(directory?`<section class="region-directory" aria-label="云南州、市目录"><p class="eyebrow">YUNNAN · A PROVINCIAL ATLAS</p><h2>云南是一省，故事在不同的州、市展开</h2><p>昆明与丽江是地级市；大理与红河是自治州。省级目录向下连接城市专题与地方选篇，当前覆盖与完整目录分别显示。</p><details class="division-directory"><summary>展开 ${d.divisions.length} 个州、市，按地区看现有文章</summary><div class="county-links">${d.divisions.map(v=>`<a href="#${destinationPath(d)}?region=${v.code}" data-route>${v.name}</a>`).join('')}</div><p>名称与代码核对：2026-10-17；数据源未注明生效年份。<a href="${d.sources.divisions.url}" target="_blank" rel="noopener">查看地名来源 ↗</a></p></details></section>`:'');
}
function readingGuide(d){return d.readingGroups?`<section class="city-reading-guide" aria-label="城市阅读线索"><p class="eyebrow">READ THE CITY, ONE THREAD AT A TIME</p><h2>把 ${d.articles.length} 个主题，串成自己的阅读线</h2><div class="reading-guide-grid">${d.readingGroups.map((g,i)=>`<article><span class="eyebrow">0${i+1}</span><h3>${g.title}</h3><p>${g.text}</p><div>${g.ids.map(id=>{const a=d.articles.find(a=>a.id===id);return `<a href="#${articlePath(d,a)}" data-route>${a.short} ↗</a>`}).join('')}</div></article>`).join('')}</div><details class="city-remaining"><summary>昆明的其它代表性地方，还将继续补充</summary><p>${d.pending.join('；')}。当前专题是已完成篇目的集合，不表示区县和景点已经穷尽。</p></details></section>`:'';}
function saveState(){write('travel-atlas-v1',state)}
function saveScroll(){if(currentRoute){positions[currentRoute]=window.scrollY;write('travel-scroll-v1',positions)}}
// Equal-angle geographic projection, horizontally scaled at 35°N. Geometry is local DataV data.
function project([lon,lat]){return [30+(lon-73)*11,35+(54-lat)*13.4]}
function geometryPath(g,projection=project){const polys=g.type==='MultiPolygon'?g.coordinates:[g.coordinates];return polys.map(poly=>poly.map(r=>r.map((p,i)=>{const [x,y]=projection(p);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`}).join('')+'Z').join('')).join('')}
function mapMarkup(){
 if(!geo)return `<p class="loading">${geoError?'地图暂时未能载入。仍可使用右侧目的地列表。':'正在铺开地图……'}</p>${geoError?'<button class="text-button" id="retry-map">重新加载地图</button>':''}`;
 const features=geo.features.filter(f=>f.properties.name);
 const paths=features.map(f=>`<path class="province ${state.province===String(f.properties.adcode)?'selected':''}" d="${geometryPath(f.geometry)}" fill-rule="evenodd" role="button" tabindex="0" data-province="${f.properties.adcode}" aria-label="${esc(f.properties.name)}${destinationForProvince(String(f.properties.adcode))?'，已收录图志':'，内容筹备中'}" aria-pressed="${state.province===String(f.properties.adcode)}"><title>${esc(f.properties.name)}</title></path>`).join('');
 const layout=placeLabels(features,project);
 const labels=layout.provinces.map(({code,name,x,y,box})=>`<g class="province-name" role="button" tabindex="0" data-region="${code}" aria-label="选择${name}"><path class="province-leader" d="M${x},${y}L${box.x+box.w/2},${box.y+box.h/2}"/><rect class="province-target" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="3"/><text class="map-label" x="${box.x+box.w/2}" y="${box.y+13}" text-anchor="middle">${name}</text></g>`).join('');
 const pins=layout.cities.map(({code,name,x,y,box})=>`<g class="map-city ${code==='510000'?'city-pin':code==='530000'?'destination-pin':''}" role="button" tabindex="0" data-waypoint="${code}" ${destinationForProvince(code)?`data-city="${destinationForProvince(code).id}"`:''} aria-label="${destinationForProvince(code)?`查看${destinationForProvince(code).name}预览${code==='530000'?'（昆明坐标，省级图志）':''}`:`选择${name}所在地区`}" aria-pressed="${destinationForProvince(code)?state.city===destinationForProvince(code).id:state.province===code}"><path class="city-leader" d="M${x},${y}L${box.x+box.w/2},${box.y+box.h/2}"/><circle class="dot" cx="${x}" cy="${y}" r="3.4"/><rect class="city-target" x="${box.x-3}" y="${box.y-2}" width="${box.w+6}" height="${box.h+4}" rx="5"/><text class="city-name" x="${box.x+box.w/2}" y="${box.y+15}" text-anchor="middle">${name}</text></g>`).join('');
 const inset=(p)=>[650+(p[0]-106)*3.7,411+(22-p[1])*4.2];
 const southern={type:'MultiPolygon',coordinates:geo.features.flatMap(f=>(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).filter(poly=>poly.some(r=>r.some(p=>p[1]<18))))};
 return `<svg class="map-svg" viewBox="0 0 770 540" role="group" aria-label="中国省级行政区交互地图。可用 Tab 选择省份，回车确认；城市名称与省级地区均可点选。"><defs><pattern id="map-grain" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".55" fill="#fff" opacity=".3"/></pattern><clipPath id="mainland-clip"><rect x="0" y="0" width="770" height="540"/></clipPath><clipPath id="inset-clip"><rect x="650" y="410" width="99" height="108"/></clipPath></defs><text x="40" y="85" class="inset-label">N</text><path d="M44 105L48 91L52 105L48 101Z" fill="#64897d"/><g clip-path="url(#mainland-clip)">${paths}</g><rect x="10" y="0" width="750" height="530" fill="url(#map-grain)" pointer-events="none"/>${labels}${pins}<g id="discovery-connector" aria-hidden="true"></g><text class="inset-label" x="685" y="345">东 海</text><rect x="650" y="410" width="99" height="108" fill="#e7eddf" stroke="#64897d" stroke-width=".6"/><g clip-path="url(#inset-clip)"><path d="${geometryPath(southern,inset)}" fill="#c5d4bf" stroke="#64897d" stroke-width=".5"/></g><text class="inset-label" x="699" y="532" text-anchor="middle">南海诸岛</text><text class="inset-label" x="40" y="510">点选省份 · 发现地方故事</text></svg>`;
}
function atlas(){

 main.innerHTML=`<section class="hero-intro"><div><p class="eyebrow">TRAVEL IN CHINA · 从成都到云南</p><h1 tabindex="-1">中国旅行图志<span class="seal">山河</span></h1></div><p>从一碗面、一条街，<br>读懂一个地方。</p></section><div id="geography-panel"></div><div class="mobile-switch" role="group" aria-label="浏览方式"><button data-mode="list" aria-pressed="${state.mobile==='list'}">目的地列表</button><button data-mode="map" aria-pressed="${state.mobile==='map'}">地图探索</button></div><section class="atlas-layout" data-mobile="${state.mobile}" aria-label="探索目的地"><div class="map-panel"><div class="map-toolbar"><span class="map-caption">山河之间 · 遇见一座城</span><div class="map-controls"><button id="discovery-pause" aria-pressed="false">暂停来信</button><button id="discovery-next">下一封 ↗</button><button id="reset-region">返回全国 ↗</button></div></div><div class="map-viewport"><div id="map-content">${mapMarkup()}<div id="map-discovery"></div></div></div><p class="map-legend"><span>● 城市坐标</span><span>地名均可点选 · 气泡带你随意逛逛</span></p><p class="map-note">地理底图：<a href="https://datav.aliyun.com/portal/school/atlas/area_selector" target="_blank" rel="noopener">阿里云 DataV</a> · 省级边界示意<br>标出 34 个省级地区及省会、首府、直辖市与港澳台代表城市。地名可用 Tab 和回车选择。</p></div><aside class="sidebar" aria-label="目的地"><div class="sidebar-title"><h2>想去哪里</h2><span>DESTINATIONS</span></div><label class="search-label" for="destination-search">搜索目的地或主题</label><div class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="destination-search" placeholder="成都、云南、扎染……" value="${esc(state.query)}" autocomplete="off"></div><div class="filter-pills" role="group" aria-label="按主题筛选">${Object.entries(categories).map(([key,label])=>`<button data-category="${key}" aria-pressed="${state.category===key}">${label}</button>`).join('')}</div><p class="region-status" id="region-status" role="status"></p><div id="destination-results"></div><p class="quiet-note">云南正逐城展开，昆明已有十篇。<br>四川目前仅有成都；重庆将独立制作。</p></aside></section><section class="atlas-after"><p class="eyebrow">一张地图，许多种相遇</p><p>吃，是一方风味；玩，是走进山水与街巷；人文，是理解生活在这里的人。随意选一个入口，不必急着走完。</p></section>`;
 renderResults();bindAtlas();startDiscovery();
}
function renderResults(){
 const region=geo?.features.find(f=>String(f.properties.adcode)===state.province)?.properties.name||destinationForProvince(state.province)?.provinceName||'';
 const letter=cityLetters[state.province];
 const available=atlasDestinations().filter(d=>!state.province||d.province===state.province);
 const matches=available.filter(d=>matchesDestination(d,state.query,state.category));
 const selected=destinations[state.city];
 const result=document.querySelector('#destination-results');
 document.querySelector('#geography-panel').innerHTML=selected?destinationFacts(selected,{directory:false}):geographyPanel({province:state.province,name:region,coverage:available.reduce((n,d)=>n+d.articles.length,0)});
 document.querySelector('#region-status').textContent=`${region||'全部地区'} · ${matches.length} 个目的地${state.category!=='all'?' · '+categories[state.category]:''}`;
 if(!available.length){result.innerHTML=`<div class="empty"><p class="eyebrow">TO BE CONTINUED</p><h3>${esc(region||'这个地方')}</h3>${letter?`<div class="region-letter"><span class="eyebrow">${esc(letter.tag)}</span><h4>${esc(letter.title)}</h4><p>${esc(letter.text)}</p><a href="${letter.source}" target="_blank" rel="noopener">${esc(letter.sourceTitle)} ↗</a></div>`:''}<p>地方图志筹备中<br>先去成都或云南，读几段地方故事。</p><button class="text-button" data-reset>返回全部目的地 →</button></div>`;}
 else if(!matches.length){result.innerHTML='<div class="empty"><h3>还没有找到</h3><p>试试“成都”“云南”或“扎染”。</p><button class="text-button" data-clear>清除搜索与筛选 →</button></div>';}
 else result.innerHTML=matches.map(d=>{const yes=state.city===d.id,count=d.articles.filter(a=>state.category==='all'||a.tags.includes(state.category)).length;return `<button class="destination-card" data-city="${d.id}" aria-pressed="${yes}" aria-label="${yes?d.name+'已选中':'查看'+d.name+'预览'}">${art(d.cover,d.coverAlt)}<div class="card-copy"><span class="eyebrow">${d.kind==='province'?'省级图志 / PROVINCE':d.provinceName+' / '+d.provinceEn}</span><h3>${d.name} <span class="muted" style="font:11px var(--sans);letter-spacing:2px">${d.en}</span></h3><p>${d.lede}<br>${d.kind==='province'?'跨州、市阅读山水与生活。':'从街头风味，读到日常生活。'}</p><span class="preview-link">${yes?`${count} 篇${state.category==='all'?'地方':categories[state.category]}故事 · 已选中`:'查看预览 →'}</span></div></button>${yes?`<div class="preview-actions"><a class="primary-link" href="#${destinationPath(d)}" data-route>探索这里 <span aria-hidden="true">→</span></a></div>`:''}`}).join('');
 result.querySelectorAll('[data-city]').forEach(el=>el.addEventListener('click',selectCity));
 result.querySelector('[data-reset]')?.addEventListener('click',resetRegion);
 result.querySelector('[data-clear]')?.addEventListener('click',()=>{state.query='';state.category='all';saveState();atlas();document.querySelector('#destination-search').focus()});
}
function syncMap(){
 document.querySelectorAll('[data-province]').forEach(el=>{const yes=el.dataset.province===state.province;el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes))});
 document.querySelectorAll('[data-city]').forEach(el=>el.setAttribute('aria-pressed',String(state.city===el.dataset.city)));
 document.querySelectorAll('[data-waypoint]').forEach(el=>el.setAttribute('aria-pressed',String(destinationForProvince(el.dataset.waypoint)?state.city===destinationForProvince(el.dataset.waypoint).id:el.dataset.waypoint===state.province)));
}
function selectRegion(value){dismissDiscovery();state.province=value;state.city='';saveState();renderResults();syncMap()}
function resetRegion(){selectRegion('')}
function selectCity(event){const id=event.currentTarget.dataset.city,d=destinations[id];if(!d)return;dismissDiscovery();state.province=d.province;state.city=id;saveState();renderResults();syncMap();const action=document.querySelector('.preview-actions');if(matchMedia('(max-width:720px)').matches)action?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});action?.querySelector('a')?.focus({preventScroll:true})}
function bindAtlas(){
 document.querySelectorAll('[data-region]').forEach(el=>el.addEventListener('click',()=>selectRegion(el.dataset.region)));
 document.querySelectorAll('[data-waypoint]:not([data-city])').forEach(el=>el.addEventListener('click',()=>selectRegion(el.dataset.waypoint)));
 document.querySelector('#reset-region').addEventListener('click',resetRegion);
 document.querySelector('#destination-search').addEventListener('input',e=>{state.query=e.target.value;state.city='';saveState();renderResults();syncMap()});
 document.querySelectorAll('[data-category]').forEach(el=>el.addEventListener('click',()=>{state.category=el.dataset.category;saveState();document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));renderResults()}));
 document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{state.mobile=el.dataset.mode;saveState();document.querySelector('.atlas-layout').dataset.mobile=state.mobile;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)))}));
 document.querySelectorAll('.province').forEach(el=>el.addEventListener('click',()=>selectRegion(el.dataset.province)));
 document.querySelectorAll('[role=button]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}))}}));
 document.querySelectorAll('.map-city[data-city]').forEach(el=>el.addEventListener('click',selectCity));
 document.querySelector('#retry-map')?.addEventListener('click',loadGeo);
}
function startDiscovery(){
 const panel=document.querySelector('.map-panel'),host=document.querySelector('#map-discovery');
 if(!geo||!host)return;
 const cities=placeLabels(geo.features.filter(f=>f.properties.name),project).cities;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=motion.matches,hovered=false,visible=false,bag=[],last='',turn=0,timer;
 const pause=document.querySelector('#discovery-pause');
 function syncPause(){pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'继续来信':'暂停来信'}
 function next(){
  if(!bag.length){bag=[...cities];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}if(bag.at(-1)?.code===last)bag.unshift(bag.pop())}
  const city=bag.pop(),story=discoveryFor(city,turn++);last=city.code;
  const x=Math.max(145,Math.min(620,city.x)),y=Math.max(235,city.y-32);
  host.hidden=false;
  host.style.left=`${x/770*100}%`;host.style.top=`${y/540*100}%`;
  host.innerHTML=`<a class="discovery-bubble" href="${story.href}" data-route><span class="discovery-meta">${esc(city.name)} · ${esc(story.tag)}</span><strong>${esc(story.title)}</strong><span class="discovery-copy">${esc(story.text)}</span><span class="discovery-action">${esc(story.action)} <span aria-hidden="true">→</span></span></a>`;
  document.querySelector('#discovery-connector').innerHTML=`<path d="M${city.x},${city.y} Q${x},${city.y} ${x},${y}"/><circle cx="${city.x}" cy="${city.y}" r="9"/>`;
  host.insertAdjacentHTML('beforeend','<button class="discovery-close" aria-label="收起来信">×</button>');
  host.querySelector('.discovery-close').addEventListener('click',()=>{dismissDiscovery();pause.focus({preventScroll:true})});
  document.querySelectorAll('.map-city').forEach(el=>el.classList.toggle('is-discovered',el.dataset.waypoint===city.code));
  const viewport=panel.querySelector('.map-viewport');
  viewport.scrollTo({left:x/770*host.parentElement.clientWidth-viewport.clientWidth/2,behavior:turn===1||motion.matches?'instant':'smooth'});
 }
 function schedule(){clearInterval(timer);timer=setInterval(()=>{if(!paused&&!hovered&&!document.hidden&&visible&&!panel.querySelector(':focus-visible'))next()},8500)}
 dismissDiscovery=()=>{host.hidden=true;paused=true;syncPause();document.querySelector('#discovery-connector').innerHTML='';document.querySelectorAll('.is-discovered').forEach(el=>el.classList.remove('is-discovered'))};
 function onEnter(){hovered=true}function onLeave(){hovered=false;schedule()}
 function onMotion(){paused=motion.matches;syncPause()}
 pause.addEventListener('click',()=>{paused=!paused;if(!paused&&host.hidden)next();syncPause();schedule()});
 document.querySelector('#discovery-next').addEventListener('click',()=>{next();schedule()});
 panel.addEventListener('pointerenter',onEnter);panel.addEventListener('pointerleave',onLeave);motion.addEventListener('change',onMotion);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.15});observer.observe(panel);
 syncPause();next();schedule();
 stopDiscovery=()=>{dismissDiscovery=()=>{};clearInterval(timer);observer.disconnect();panel.removeEventListener('pointerenter',onEnter);panel.removeEventListener('pointerleave',onLeave);motion.removeEventListener('change',onMotion)};
}
function city(){
 const returnParams=new URLSearchParams(location.hash.split('?')[1]||'');returnParams.delete('chapter');returnParams.sort();
 currentRoute=`${destinationPath(destination)}${returnParams.size?'?'+returnParams:''}`;write('travel-return-'+destination.id,currentRoute);
 const county=new URLSearchParams(location.hash.split('?')[1]||'').get(destination.divisionParam)||'';
 const division=destination.divisions.find(d=>d.code===county);
 const selection=division?articles.filter(a=>a[destination.divisionParam]===county):articles;
 main.innerHTML=`${breadcrumb()}<section class="city-hero"><div class="city-copy"><p class="eyebrow">${destination.en}${destination.kind==='province'?' · PROVINCIAL ATLAS':' · '+destination.provinceEn}</p><h1 tabindex="-1">${destination.name}</h1><p class="lede">${destination.lede}</p><p>${destination.intro.replace('\n','<br>')}</p><span class="eyebrow">${articles.length} 篇地方故事 · 3 种探索方式</span></div>${art(destination.cover,destination.coverAlt)}</section>${destinationFacts(destination)}${destination.directory&&!division?provinceDirectory(destination):''}${!division?readingGuide(destination):''}${division?`<aside class="county-filter"><p>正在看：<strong>${division.name}</strong> · ${selection.length} 篇故事</p><a href="#${destinationPath(destination)}" data-route>返回全${destination.name} →</a></aside>`:''}<nav class="chapter-nav" aria-label="${destination.name}章节">${['eat','play','culture'].map((tag,i)=>[tag,destination.chapterLabels[i]]).map(([tag,sub],i)=>`<a href="#${destinationPath(destination)}?chapter=${tag}${division?'&'+destination.divisionParam+'='+county:''}" data-chapter="${tag}"><span class="number">0${i+1}</span><div><strong>${categories[tag]}</strong><small>${sub}</small></div></a>`).join('')}</nav>${[['eat','从地方风味，读起','LOCAL FLAVOURS'],['play','走进山水，也走进日常','WANDER & DISCOVER'],['culture','诗文、人物与地方生活','LIVING CULTURE']].map(([tag,sub,en])=>`<section class="chapter" id="chapter-${tag}"><div class="chapter-header"><div><h2>${categories[tag]}</h2><span class="eyebrow">${en}</span></div><p>${sub}</p></div>${tag==='culture'?cultureLibrary(division?county:'',destination):''}<div class="story-grid ${tag==='culture'?'culture-grid':''}">${selection.filter(a=>a.tags.includes(tag)).map(card).join('')||'<p class="muted">这个地区的本章节尚未收录内容，可以先探索其它章节。</p>'}</div></section>`).join('')}<a class="article-return" href="#${destination.parent?destinationPath(destinations[destination.parent]):'/atlas'}" data-route>← ${destination.parent?'返回'+destinations[destination.parent].name+'省级目录':'返回地图，继续探索'}</a>`;
 document.querySelectorAll('[data-coverage]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-coverage]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('.prefecture-card').forEach(card=>{const n=Number(card.dataset.storyCount);card.hidden=button.dataset.coverage==='covered'?!n:button.dataset.coverage==='pending'?n>0:false})}));
 document.querySelectorAll('[data-culture]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-culture]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('.poems-section').hidden=button.dataset.culture==='people';document.querySelector('.people-section').hidden=button.dataset.culture==='poems'}));
 document.querySelectorAll('[data-chapter]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();const tag=el.dataset.chapter;history.replaceState(null,'',`#${destinationPath(destination)}?chapter=${tag}${division?'&'+destination.divisionParam+'='+county:''}`);document.querySelector('#chapter-'+tag).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}));
}
function teaDiagram(index){
 const shapes=[
  '<path d="M22 62 Q80 11 138 62 Q80 77 22 62Z"/><ellipse cx="80" cy="31" rx="9" ry="5"/><path d="M71 31V24Q80 17 89 24V31"/>',
  '<path d="M22 25Q30 65 56 76H104Q130 65 138 25"/><ellipse cx="80" cy="25" rx="58" ry="13"/><path d="M56 76V81H104V76"/>',
  '<path d="M18 45Q28 72 80 72Q132 72 142 45"/><ellipse cx="80" cy="45" rx="62" ry="17"/><ellipse cx="80" cy="45" rx="21" ry="7"/>'
 ];
 return `<svg class="tea-diagram" viewBox="0 0 160 95" aria-hidden="true">${shapes[index]}</svg>`;
}
function article(a){
 const related=articles.filter(b=>b.id!==a.id).sort((b,c)=>Number(c.tags.some(t=>a.tags.includes(t)))-Number(b.tags.some(t=>a.tags.includes(t)))).slice(0,2);
 main.innerHTML=`${breadcrumb(a)}<article><header class="article-header"><p class="eyebrow">${a.en}</p><h1 tabindex="-1">${a.title}</h1><p class="dek">${a.dek}</p><p class="meta">${a.place||destination.label} &nbsp; / &nbsp; ${a.tags.map(t=>categories[t]).join(' · ')} &nbsp; / &nbsp; 约 ${a.minutes} 分钟</p></header><figure class="article-hero">${art(a.scene,a.short+'主题图')}<figcaption>AI 插画 · 艺术化呈现，非实景或技术复原</figcaption></figure><div class="prose"><p>${a.intro}</p><h2>先看懂这些小细节</h2><div class="detail-grid">${a.details.map(([title,text],i)=>`<section class="detail-item">${a.id==='tea'?teaDiagram(i):''}<span class="eyebrow">0${i+1}</span><h3>${title}</h3><p>${text}</p></section>`).join('')}</div>${articleCulture(a,destination)}<h2>把日常，读成故事</h2><p>${a.story}</p>${(a.sections||[]).map(([title,paragraphs])=>`<section class="story-section"><h2>${title}</h2>${paragraphs.map(p=>`<p>${p}</p>`).join('')}</section>`).join('')}<aside class="observe"><h2>到当地，可以观察什么？</h2><p>${a.observe}</p></aside><details class="family"><summary>${a.question}</summary><p>${a.answer}</p></details><div class="source-list"><p>资料与延伸阅读 · 整理于 ${destination.date}</p><ul>${a.refs.map(key=>`<li><a href="${sources[key].url}" target="_blank" rel="noopener">${sources[key].title} ↗</a></li>`).join('')}</ul><p>本篇侧重文化阅读，不提供实时票价、开放时间或预约承诺。出发前请查阅目的地官方公告。</p></div></div></article><section class="related" aria-label="相关篇目"><p class="eyebrow">A LITTLE FURTHER</p><h2>再读一段${destination.name}</h2><div class="story-grid">${related.map(card).join('')}</div></section><a class="article-return" href="#${read('travel-return-'+destination.id,destinationPath(destination))}" data-route>← 返回${destination.name}图志</a>`;
}
function render(){
 stopDiscovery();
 const version=++renderVersion;
 const raw=(location.hash.slice(1)||'/atlas');const [path,query='']=raw.split('?');
 currentRoute=raw;
 destination=resolveDestination(path)||destinations.chengdu;articles=destination.articles;sources=destination.sources;
 if(path==='/atlas'){const params=new URLSearchParams(query);if(params.has('province')){const value=params.get('province');state.province=/^\d{6}$/.test(value)?value:'';const selected=destinations[params.get('city')||params.get('destination')];state.city=selected?.province===state.province?selected.id:'';saveState()}atlas();document.title='中国旅行图志 · Travel in China'}
 else if(resolveDestination(path)&&path===destinationPath(destination)){city();document.title=destination.name+' · 中国旅行图志'}
 else{const a=resolveDestination(path)&&articles.find(a=>path===destinationPath(destination)+'/'+a.id);if(a){if(a.destination){destination=destinations[a.destination];articles=destination.articles;sources=destination.sources;}article(a);document.title=a.short+' · 中国旅行图志'}else{main.innerHTML='<section class="error-page"><h1 tabindex="-1">这页还没写到</h1><p>回到地图，重新发现一个地方。</p><a href="#/atlas" data-route>返回地图 →</a></section>';document.title='页面未找到 · 中国旅行图志'}}
 const chapter=resolveDestination(path)&&path===destinationPath(destination)?new URLSearchParams(query).get('chapter'):null;
 requestAnimationFrame(()=>{if(version!==renderVersion)return;main.querySelector('h1')?.focus({preventScroll:true});if(['eat','play','culture'].includes(chapter)){document.querySelector('#chapter-'+chapter)?.scrollIntoView({behavior:'instant'})}else{window.scrollTo({top:positions[currentRoute]||0,behavior:'instant'})}});
}
async function loadGeo(){try{geoError=false;const response=await fetch('assets/china-provinces.geojson');if(!response.ok)throw Error(response.status);geo=await response.json()}catch{geoError=true}if(currentRoute.split('?')[0]==='/atlas'){saveScroll();render()}}
let scrollTimer;
window.addEventListener('scroll',()=>{if(currentRoute)positions[currentRoute]=window.scrollY;clearTimeout(scrollTimer);scrollTimer=setTimeout(saveScroll,120)},{passive:true});
window.addEventListener('pagehide',saveScroll);
document.addEventListener('click',e=>{if(e.target.closest('.skip-link')){e.preventDefault();main.focus();return}if(e.target.closest('a[data-route]')){saveScroll();clearTimeout(scrollTimer)}});
window.addEventListener('hashchange',()=>{clearTimeout(scrollTimer);render()});
render();loadGeo();
