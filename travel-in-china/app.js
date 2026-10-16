import {geographyPanel,cultureLibrary,articleCulture} from './knowledge.js';
import {chengduDivisions} from './geography.js';
import {articles, categories, sources, matchesDestination} from './data.js';
const main=document.querySelector('#main');
if('scrollRestoration' in history)history.scrollRestoration='manual';
const read=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
let state={province:'',city:'',query:'',category:'all',mobile:'list',...read('travel-atlas-v1',{})};
if(!Object.hasOwn(categories,state.category))state.category='all';
let geo=null, geoError=false, currentRoute='', renderVersion=0;
const positions=read('travel-scroll-v1',{});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=(scene,label,extra='')=>`<div class="art scene-${scene} ${scene>=6?'culture-art':''} ${extra}" role="img" aria-label="${esc(label)}，AI 淡彩插画，艺术化呈现"><span class="art-label">艺术化呈现</span></div>`;
const card=a=>`<a class="story-card" href="#/chengdu/${a.id}" data-route>${art(a.scene,a.short)}<p class="card-meta">${a.tags.map(t=>categories[t]).join(' · ')} / 约 ${a.minutes} 分钟</p><h3>${a.title}</h3><p>${a.dek}</p><span class="read-link">读一段地方故事 ↗</span></a>`;
const breadcrumb=(article)=>`<nav class="breadcrumbs" aria-label="当前位置"><a href="#/atlas" data-route>中国旅行图志</a><span aria-hidden="true">/</span>${article?'<a href="#/chengdu" data-route>四川 · 成都</a><span aria-hidden="true">/</span><span>'+esc(article.short)+'</span>':'<span>四川 · 成都</span>'}</nav>`;
function saveState(){write('travel-atlas-v1',state)}
function saveScroll(){if(currentRoute){positions[currentRoute]=window.scrollY;write('travel-scroll-v1',positions)}}
// Equal-angle geographic projection, horizontally scaled at 35°N. Geometry is local DataV data.
function project([lon,lat]){return [30+(lon-73)*11,35+(54-lat)*13.4]}
function geometryPath(g,projection=project){const polys=g.type==='MultiPolygon'?g.coordinates:[g.coordinates];return polys.map(poly=>poly.map(r=>r.map((p,i)=>{const [x,y]=projection(p);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`}).join('')+'Z').join('')).join('')}
function mapMarkup(){
 if(!geo)return `<p class="loading">${geoError?'地图暂时未能载入。仍可使用右侧目的地列表。':'正在铺开地图……'}</p>${geoError?'<button class="text-button" id="retry-map">重新加载地图</button>':''}`;
 const features=geo.features.filter(f=>f.properties.name);
 const paths=features.map(f=>`<path class="province ${state.province===String(f.properties.adcode)?'selected':''}" d="${geometryPath(f.geometry)}" fill-rule="evenodd" role="button" tabindex="0" data-province="${f.properties.adcode}" aria-label="${esc(f.properties.name)}${f.properties.adcode===510000?'，已收录成都':'，内容筹备中'}" aria-pressed="${state.province===String(f.properties.adcode)}"><title>${esc(f.properties.name)}</title></path>`).join('');
 const labels=features.filter(f=>[650000,540000,630000,150000,230000,510000,530000,710000].includes(f.properties.adcode)).map(f=>{const p=f.properties.centroid||f.properties.center;const [x,y]=project(p);return `<text class="map-label" x="${x}" y="${y}" text-anchor="middle">${f.properties.name.replace(/维吾尔自治区|壮族自治区|回族自治区|自治区|省/g,'')}</text>`}).join('');
 const [cx,cy]=project([104.0665,30.5723]);
 const inset=(p)=>[650+(p[0]-106)*3.7,411+(22-p[1])*4.2];
 const southern={type:'MultiPolygon',coordinates:geo.features.flatMap(f=>(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).filter(poly=>poly.some(r=>r.some(p=>p[1]<18))))};
 return `<svg class="map-svg" viewBox="0 0 770 540" role="group" aria-label="中国省级行政区交互地图。可用 Tab 选择省份，回车确认；也可使用上方地区选择框。"><defs><pattern id="map-grain" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".55" fill="#fff" opacity=".3"/></pattern><clipPath id="mainland-clip"><rect x="0" y="0" width="770" height="540"/></clipPath><clipPath id="inset-clip"><rect x="650" y="410" width="99" height="108"/></clipPath></defs><text x="40" y="85" class="inset-label">N</text><path d="M44 105L48 91L52 105L48 101Z" fill="#64897d"/><g clip-path="url(#mainland-clip)">${paths}</g><rect x="10" y="0" width="750" height="530" fill="url(#map-grain)" pointer-events="none"/>${labels}<g class="city-pin" role="button" tabindex="0" aria-label="查看成都预览" aria-pressed="${state.city==='chengdu'}" data-city="chengdu"><circle class="hit-area" cx="${cx}" cy="${cy}" r="48" fill="transparent"/><circle class="halo" cx="${cx}" cy="${cy}" r="17"/><circle class="dot" cx="${cx}" cy="${cy}" r="6"/><text x="${cx+20}" y="${cy+6}">成都</text></g><text class="inset-label" x="685" y="345">东 海</text><rect x="650" y="410" width="99" height="108" fill="#e7eddf" stroke="#64897d" stroke-width=".6"/><g clip-path="url(#inset-clip)"><path d="${geometryPath(southern,inset)}" fill="#c5d4bf" stroke="#64897d" stroke-width=".5"/></g><text class="inset-label" x="699" y="532" text-anchor="middle">南海诸岛</text><text class="inset-label" x="40" y="510">点选省份 · 发现地方故事</text></svg>`;
}
function atlas(){
 const options=geo?.features.filter(f=>f.properties.name).map(f=>`<option value="${f.properties.adcode}" ${state.province===String(f.properties.adcode)?'selected':''}>${f.properties.name}</option>`).join('')||'';
 main.innerHTML=`<section class="hero-intro"><div><p class="eyebrow">TRAVEL IN CHINA · 从成都出发</p><h1 tabindex="-1">中国旅行图志<span class="seal">山河</span></h1></div><p>从一碗面、一条街，<br>读懂一个地方。</p></section><div id="geography-panel"></div><div class="mobile-switch" role="group" aria-label="浏览方式"><button data-mode="list" aria-pressed="${state.mobile==='list'}">目的地列表</button><button data-mode="map" aria-pressed="${state.mobile==='map'}">地图探索</button></div><section class="atlas-layout" data-mobile="${state.mobile}" aria-label="探索目的地"><div class="map-panel"><div class="map-toolbar"><label>探索地区 <select id="province-select" aria-label="选择省级地区"><option value="">全部地区</option>${options}</select></label><button id="reset-region">返回全国 ↗</button></div><div id="map-content">${mapMarkup()}</div><p class="map-note">地理底图：<a href="https://datav.aliyun.com/portal/school/atlas/area_selector" target="_blank" rel="noopener">阿里云 DataV</a> · 省级边界示意<br>地图可用键盘操作，小区域也可通过上方选择框查找。</p></div><aside class="sidebar" aria-label="目的地"><div class="sidebar-title"><h2>想去哪里</h2><span>DESTINATIONS</span></div><label class="search-label" for="destination-search">搜索目的地或主题</label><div class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="destination-search" placeholder="成都、茶馆、杜甫……" value="${esc(state.query)}" autocomplete="off"></div><div class="filter-pills" role="group" aria-label="按主题筛选">${Object.entries(categories).map(([key,label])=>`<button data-category="${key}" aria-pressed="${state.category===key}">${label}</button>`).join('')}</div><p class="region-status" id="region-status" role="status"></p><div id="destination-results"></div><p class="quiet-note">图志正在从成都慢慢展开。<br>其它地区暂未收录，也欢迎在地图上看看。</p></aside></section><section class="atlas-after"><p class="eyebrow">一张地图，许多种相遇</p><p>吃，是一方风味；玩，是走进山水与街巷；人文，是理解生活在这里的人。随意选一个入口，不必急着走完。</p></section>`;
 renderResults();bindAtlas();
}
function renderResults(){
 const region=geo?.features.find(f=>String(f.properties.adcode)===state.province)?.properties.name||'';
 const available=!state.province||state.province==='510000';
 const match=matchesDestination(state.query,state.category);
 const result=document.querySelector('#destination-results');
 document.querySelector('#geography-panel').innerHTML=geographyPanel({province:state.province,name:region,city:state.city==='chengdu',coverage:available?articles.length:0});
 document.querySelector('#region-status').textContent=`${region||'全部地区'} · ${available&&match?'1 个目的地':'0 个目的地'}${state.category!=='all'?' · '+categories[state.category]:''}`;
 if(!available){result.innerHTML=`<div class="empty"><p class="eyebrow">TO BE CONTINUED</p><h3>${esc(region||'这个地方')}</h3><p>内容筹备中<br>先去成都，读几段地方故事。</p><button class="text-button" data-reset>返回全部目的地 →</button></div>`;}
 else if(!match){result.innerHTML='<div class="empty"><h3>还没有找到</h3><p>试试“成都”“四川”或“茶馆”。</p><button class="text-button" data-clear>清除搜索与筛选 →</button></div>';}
 else{const selected=state.city==='chengdu';const count=articles.filter(a=>state.category==='all'||a.tags.includes(state.category)).length;result.innerHTML=`<button class="destination-card" data-city="chengdu" aria-pressed="${selected}" aria-label="${selected?'成都已选中':'查看成都预览'}">${art(1,'树荫下的成都茶馆与竹椅')}<div class="card-copy"><span class="eyebrow">四川 / SICHUAN</span><h3>成都 <span class="muted" style="font:11px var(--sans);letter-spacing:2px">CHENGDU</span></h3><p>在一盏茶里，慢下来。<br>从街头风味，读到日常生活。</p><span class="preview-link">${selected?`${count} 篇${state.category==='all'?'地方':categories[state.category]}故事 · 已选中`:'查看预览 →'}</span></div></button>${selected?'<div class="preview-actions"><a class="primary-link" href="#/chengdu" data-route>探索这里 <span aria-hidden="true">→</span></a></div>':''}`;}
 result.querySelectorAll('[data-city]').forEach(el=>el.addEventListener('click',selectCity));
 result.querySelector('[data-reset]')?.addEventListener('click',resetRegion);
 result.querySelector('[data-clear]')?.addEventListener('click',()=>{state.query='';state.category='all';saveState();atlas();document.querySelector('#destination-search').focus()});
}
function syncMap(){
 document.querySelectorAll('[data-province]').forEach(el=>{const yes=el.dataset.province===state.province;el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes))});
 document.querySelectorAll('[data-city]').forEach(el=>el.setAttribute('aria-pressed',String(state.city==='chengdu')));
 document.querySelector('#province-select').value=state.province;
}
function selectRegion(value){state.province=value;state.city='';saveState();renderResults();syncMap()}
function resetRegion(){selectRegion('')}
function selectCity(){state.province='510000';state.city='chengdu';saveState();renderResults();syncMap();const action=document.querySelector('.preview-actions');if(matchMedia('(max-width:720px)').matches)action?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});action?.querySelector('a')?.focus({preventScroll:true})}
function bindAtlas(){
 document.querySelector('#province-select').addEventListener('change',e=>selectRegion(e.target.value));
 document.querySelector('#reset-region').addEventListener('click',resetRegion);
 document.querySelector('#destination-search').addEventListener('input',e=>{state.query=e.target.value;state.city='';saveState();renderResults();syncMap()});
 document.querySelectorAll('[data-category]').forEach(el=>el.addEventListener('click',()=>{state.category=el.dataset.category;saveState();document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));renderResults()}));
 document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{state.mobile=el.dataset.mode;saveState();document.querySelector('.atlas-layout').dataset.mobile=state.mobile;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)))}));
 document.querySelectorAll('.province').forEach(el=>el.addEventListener('click',()=>selectRegion(el.dataset.province)));
 document.querySelectorAll('[role=button]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}))}}));
 document.querySelectorAll('.city-pin').forEach(el=>el.addEventListener('click',selectCity));
 document.querySelector('#retry-map')?.addEventListener('click',loadGeo);
}
function city(){
 const county=new URLSearchParams(location.hash.split('?')[1]||'').get('county')||'';
 const division=chengduDivisions.find(d=>d.code===county);
 const selection=division?articles.filter(a=>a.county===county):articles;
 main.innerHTML=`${breadcrumb()}<section class="city-hero"><div class="city-copy"><p class="eyebrow">CHENGDU · SICHUAN</p><h1 tabindex="-1">成都</h1><p class="lede">在一盏茶里，慢下来。</p><p>一碗川味，一片树荫，一段经纬。<br>从熟悉的日常出发，认识这座城。</p><span class="eyebrow">${articles.length} 篇地方故事 · 3 种探索方式</span></div>${art(1,'成都茶馆的竹椅、盖碗和树影')}</section>${geographyPanel({city:true,coverage:articles.length})}${division?`<aside class="county-filter"><p>正在看：<strong>${division.name}</strong> · ${selection.length} 篇故事</p><a href="#/chengdu" data-route>返回全成都 →</a></aside>`:''}<nav class="chapter-nav" aria-label="成都章节">${[['eat','一碗川味'],['play','走进山水'],['culture','读懂日常']].map(([tag,sub],i)=>`<a href="#/chengdu?chapter=${tag}" data-chapter="${tag}"><span class="number">0${i+1}</span><div><strong>${categories[tag]}</strong><small>${sub}</small></div></a>`).join('')}</nav>${[['eat','从一碗面，尝到一座城','LOCAL FLAVOURS'],['play','走进山水，也走进日常','WANDER & DISCOVER'],['culture','诗词、人物与地方生活','LIVING CULTURE']].map(([tag,sub,en])=>`<section class="chapter" id="chapter-${tag}"><div class="chapter-header"><div><h2>${categories[tag]}</h2><span class="eyebrow">${en}</span></div><p>${sub}</p></div>${tag==='culture'?cultureLibrary(division?county:''):''}<div class="story-grid ${tag==='culture'?'culture-grid':''}">${selection.filter(a=>a.tags.includes(tag)).map(card).join('')||'<p class="muted">这个区县的本章节尚未收录内容，可以先探索其它章节。</p>'}</div></section>`).join('')}<a class="article-return" href="#/atlas" data-route>← 返回地图，继续探索</a>`;
 document.querySelectorAll('[data-culture]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-culture]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('.poems-section').hidden=button.dataset.culture==='people';document.querySelector('.people-section').hidden=button.dataset.culture==='poems'}));
 document.querySelectorAll('[data-chapter]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();const tag=el.dataset.chapter;history.replaceState(null,'',`#/chengdu?chapter=${tag}${division?'&county='+county:''}`);document.querySelector('#chapter-'+tag).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}));
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
 main.innerHTML=`${breadcrumb(a)}<article><header class="article-header"><p class="eyebrow">${a.en}</p><h1 tabindex="-1">${a.title}</h1><p class="dek">${a.dek}</p><p class="meta">四川 · 成都 &nbsp; / &nbsp; ${a.tags.map(t=>categories[t]).join(' · ')} &nbsp; / &nbsp; 约 ${a.minutes} 分钟</p></header><figure class="article-hero">${art(a.scene,a.short+'主题图')}<figcaption>AI 插画 · 艺术化呈现，非实景或技术复原</figcaption></figure><div class="prose"><p>${a.intro}</p><h2>先看懂这些小细节</h2><div class="detail-grid">${a.details.map(([title,text],i)=>`<section class="detail-item">${a.id==='tea'?teaDiagram(i):''}<span class="eyebrow">0${i+1}</span><h3>${title}</h3><p>${text}</p></section>`).join('')}</div>${articleCulture(a)}<h2>把日常，读成故事</h2><p>${a.story}</p><aside class="observe"><h2>到当地，可以观察什么？</h2><p>${a.observe}</p></aside><details class="family"><summary>${a.question}</summary><p>${a.answer}</p></details><div class="source-list"><p>资料与延伸阅读 · 整理于 2026 年 10 月 16 日</p><ul>${a.refs.map(key=>`<li><a href="${sources[key].url}" target="_blank" rel="noopener">${sources[key].title} ↗</a></li>`).join('')}</ul><p>本篇侧重文化阅读，不提供实时票价、开放时间或预约承诺。出发前请查阅目的地官方公告。</p></div></div></article><section class="related" aria-label="相关篇目"><p class="eyebrow">A LITTLE FURTHER</p><h2>再读一段成都</h2><div class="story-grid">${related.map(card).join('')}</div></section><a class="article-return" href="#/chengdu" data-route>← 返回成都图志</a>`;
}
function render(){
 const version=++renderVersion;
 const raw=(location.hash.slice(1)||'/atlas');const [path,query='']=raw.split('?');
 currentRoute=path;
 if(path==='/atlas'){const params=new URLSearchParams(query);if(params.has('province')){const value=params.get('province');state.province=geo?.features.some(f=>String(f.properties.adcode)===value)?value:'';state.city=params.get('city')==='chengdu'&&state.province==='510000'?'chengdu':'';saveState()}atlas();document.title='中国旅行图志 · Travel in China'}
 else if(path==='/chengdu'){city();document.title='成都 · 中国旅行图志'}
 else{const a=articles.find(a=>path==='/chengdu/'+a.id);if(a){article(a);document.title=a.short+' · 中国旅行图志'}else{main.innerHTML='<section class="error-page"><h1 tabindex="-1">这页还没写到</h1><p>回到地图，从成都重新开始。</p><a href="#/atlas" data-route>返回地图 →</a></section>';document.title='页面未找到 · 中国旅行图志'}}
 const chapter=path==='/chengdu'?new URLSearchParams(query).get('chapter'):null;
 requestAnimationFrame(()=>{if(version!==renderVersion)return;main.querySelector('h1')?.focus({preventScroll:true});if(['eat','play','culture'].includes(chapter)){document.querySelector('#chapter-'+chapter)?.scrollIntoView({behavior:'instant'})}else{window.scrollTo({top:positions[path]||0,behavior:'instant'})}});
}
async function loadGeo(){try{geoError=false;const response=await fetch('assets/china-provinces.geojson');if(!response.ok)throw Error(response.status);geo=await response.json()}catch{geoError=true}if(currentRoute==='/atlas'){saveScroll();render()}}
let scrollTimer;
window.addEventListener('scroll',()=>{if(currentRoute)positions[currentRoute]=window.scrollY;clearTimeout(scrollTimer);scrollTimer=setTimeout(saveScroll,120)},{passive:true});
window.addEventListener('pagehide',saveScroll);
document.addEventListener('click',e=>{if(e.target.closest('.skip-link')){e.preventDefault();main.focus();return}if(e.target.closest('a[data-route]')){saveScroll();clearTimeout(scrollTimer)}});
window.addEventListener('hashchange',()=>{clearTimeout(scrollTimer);render()});
render();loadGeo();
