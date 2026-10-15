import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { SPEC } from './model.js';
import { buildProductionModel as buildModel, PRODUCTION_REVISION } from './production-model.js';
import { effectivelyVisible } from './study/adapt-model.js';
import { createStudyMaterials } from './study/materials.js';
import { mountPhotoGallery } from './photos/gallery.js?v=foguang-03';
import { PRODUCTION_MATERIALS, fitCamera, projectedBounds } from './production-view.js';
import { LAYERS, CHAPTERS, PARTS, SOURCES } from './data.js';

const $=id=>document.getElementById(id);
let chapterIndex=0,model,detail,renderer,scene,camera,controls,selectionBox,ground,gridGuide;
let activeModel,dirty=true,explode=0,targetExplode=0,animation=null,sectionSign=1;
let selected=null,pointerStart=null,visible=true,currentView='iso';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clipPlane=new THREE.Plane(new THREE.Vector3(-1,0,0),0);
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
const baseMaterials={},coloredMaterials=new Map();
const layerConfig=new Map(LAYERS.map(l=>[l.id,l]));

$('chapters').innerHTML=CHAPTERS.map((c,i)=>`<button data-chapter="${i}" aria-pressed="${i===0}"><span>${c.n}</span>${c.title}</button>`).join('');
$('layer-list').innerHTML=LAYERS.map(l=>`<label class="layer-item" style="--layer-color:${l.color}"><input type="checkbox" data-layer="${l.id}" checked><i class="layer-dot"></i><span>${l.label}</span></label>`).join('');
$('sources').innerHTML=SOURCES.map(s=>`<article><a href="${s.url}" target="_blank" rel="noopener">${s.title} ↗</a><p>${s.note}</p></article>`).join('');
$('evidence-open').addEventListener('click',()=>$('evidence').scrollIntoView({behavior:reduced?'instant':'smooth'}));

function createMaterials(){Object.assign(baseMaterials,createStudyMaterials(PRODUCTION_MATERIALS));}
function initialize(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0xf3eddf,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.26;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.localClippingEnabled=true;
  renderer.domElement.setAttribute('aria-hidden','true');$('viewport').prepend(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.05,400);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.10;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=160;controls.enablePan=true;
  controls.addEventListener('change',()=>dirty=true);controls.addEventListener('start',()=>animation=null);
  scene.add(new THREE.HemisphereLight(0xfff9ea,0x6b705f,1.65));
  const sun=new THREE.DirectionalLight(0xfff1d7,3.5);sun.position.set(-22,43,29);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-33;sun.shadow.camera.right=33;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-27;sun.shadow.camera.near=.5;sun.shadow.camera.far=110;sun.shadow.normalBias=.04;sun.shadow.bias=-.00008;scene.add(sun);$('light-toggle').addEventListener('change',()=>{sun.position.x=$('light-toggle').checked?22:-22;dirty=true;});
  const fill=new THREE.DirectionalLight(0xe5eddf,.42);fill.position.set(26,14,-30);scene.add(fill);
  ground=new THREE.Mesh(new THREE.PlaneGeometry(140,140),new THREE.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  createMaterials();model=buildModel(baseMaterials);detail=buildModel(baseMaterials,{detailOnly:true});
  scene.add(model.root,detail.root);
  const segments=[];const line=(a,b)=>segments.push(...a,...b);
  line([-17,.7,10.9],[17,.7,10.9]);line([18.7,.7,-8.83],[18.7,.7,8.83]);
  let tickX=-17;for(const width of [0,...SPEC.bays]){tickX+=width;line([tickX,.7,10.65],[tickX,.7,11.15]);}
  for(const z of [-8.83,8.83])line([18.45,.7,z],[18.95,.7,z]);
  gridGuide=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(segments,3)),new THREE.LineBasicMaterial({color:0x984839,transparent:true,opacity:.60}));
  gridGuide.visible=false;scene.add(gridGuide);detail.root.visible=false;activeModel=model;
  selectionBox=new THREE.Box3Helper(new THREE.Box3(),0x9e4538);selectionBox.material.depthTest=false;selectionBox.material.transparent=true;selectionBox.material.opacity=.85;selectionBox.renderOrder=100;selectionBox.visible=false;scene.add(selectionBox);
  new ResizeObserver(resize).observe($('viewport'));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)dirty=true;}).observe($('viewport'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)dirty=true;});
  renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',onPick);
  $('viewport').addEventListener('keydown',keyboardView);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('model-error').hidden=false;$('model-error').querySelector('p').textContent='图形上下文暂时丢失。请重新加载以恢复三维视图。';});
  $('model-loading').hidden=true;
  resize();setChapter(0,false);
  renderer.setAnimationLoop(tick);
 }catch(error){console.error('Architecture viewer initialization failed',error);$('model-loading').hidden=true;$('model-error').hidden=false;updateChapterText(0);document.querySelectorAll('.viewer-controls input,.viewer-controls button,.viewer-toolbar button').forEach(el=>el.disabled=true);}
}
function resize(){if(!renderer)return;const {width,height}=$('viewport').getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(activeModel)setView(currentView,false);dirty=true;}
function updateChapterText(i){
 const c=CHAPTERS[i];document.querySelectorAll('[data-chapter]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.chapter)===i)));
 $('chapter-number').textContent=`${c.n} / 东大殿结构研究`;$('chapter-title').textContent=c.title;$('chapter-subtitle').textContent=c.subtitle;
 $('chapter-text').textContent=c.text;$('chapter-facts').innerHTML=c.facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');$('chapter-question').textContent=c.question;
 $('prev-chapter').disabled=i===0;$('next-chapter').disabled=i===CHAPTERS.length-1;
}
function setChapter(i,animate=true){
 chapterIndex=i;updateChapterText(i);document.dispatchEvent(new CustomEvent('architecture:chapter',{detail:{building:'foguang',chapter:i}}));if(!model)return;gridGuide.visible=i===1;
 const c=CHAPTERS[i];const isDetail=c.view==='detail';activeModel=isDetail?detail:model;model.root.visible=!isDetail;detail.root.visible=isDetail;ground.position.y=isDetail?-2.1:-.3;
 for(const l of LAYERS){const shown=isDetail?['columns','ties','brackets'].includes(l.id):c.visible.includes(l.id);activeModel.layers.get(l.id).visible=shown;const input=document.querySelector(`[data-layer="${l.id}"]`);input.checked=shown;input.disabled=activeModel.layers.get(l.id).children.length===0;}
 $('explode').value=c.view==='exploded'?65:0;targetExplode=Number($('explode').value)/100;explode=targetExplode;
 $('explode-label').textContent=isDetail?'铺作局部拆合':'整殿分层拆解';$('explode-value').value=`${$('explode').value}%`;$('explode-toggle').textContent=targetExplode?'合回':'展开';
 $('section-toggle').checked=c.view==='section';$('section-position').value=c.view==='section'?12:0;$('section-axis').value='x';sectionSign=1;updateClipping();clearSelection();applyExplosion();
 $('model-mode').textContent=isDetail?'外檐柱头铺作 · 局部研究':'构造研究模型';
 $('model-stats').textContent=`${activeModel.records.length.toLocaleString()} 个几何构件 · ${isDetail?'单攒局部':'36 根主柱'} · 米制比例`;
 setView(c.view==='detail'?'detail':c.view==='section'?'side':c.view==='exploded'?'exploded':c.view,animate);setLabels();dirty=true;
}
function viewTarget(){return activeModel===detail?new THREE.Vector3(0,1.1+targetExplode*1.7,.5):new THREE.Vector3(0,5.7+targetExplode*6,0);}
function setView(view,animate=true){
 if(!camera)return;$('runtime-state').dataset.settled='false';currentView=view;const detailView=activeModel===detail;let direction;
 switch(view){case 'front':direction=new THREE.Vector3(0,.12,1);break;case 'side':direction=new THREE.Vector3(1,.10,.10);break;case 'top':direction=new THREE.Vector3(0,1,.001);break;default:direction=new THREE.Vector3(1,.63,1.10);}
 const fitted=fitCamera(activeModel,camera,direction,targetExplode,layerConfig,activeModel===detail);const target=fitted.target;const destination=fitted.position;
 if(animate&&!reduced)animation={from:camera.position.clone(),to:destination,fromTarget:controls.target.clone(),toTarget:target,start:performance.now(),duration:600};
 else{camera.position.copy(destination);controls.target.copy(target);camera.lookAt(target);controls.update();}
 controls.minDistance=detailView?1.7:8;controls.maxDistance=detailView?35:180;
 document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view===view||el.dataset.view==='iso'&&['detail','exploded'].includes(view))));
 $('view-status').textContent=({front:'前檐 · 面西',side:'山面视角',top:'柱网俯视',detail:'柱头铺作局部',exploded:'整殿分层视图',iso:'斜向全貌'})[view]||'自由视角';dirty=true;
}
function setLabels(){
 const items=activeModel===detail?[
  ['栌斗',[.8,.15,0],'brackets',0],['华栱',[.25,.82,.93],'brackets',2],['下昂后尾',[0,2.6,-1.25],'brackets',4],['令栱',[.75,2.13,1.97],'brackets',5],['撩檐槫',[1.2,2.70,1.97],'brackets',7]
 ]:chapterIndex===1?[
  ['外檐柱圈',[-17,5.58,0],'columns'],['内槽柱圈',[-12.6,5.58,0],'columns'],['面阔 34.00 m',[0,.7,11.4],'foundation'],['进深 17.66 m',[19.3,.7,0],'foundation'],['前檐 · 西',[0,.7,8.9],'foundation'],['后檐 · 东',[0,.7,-10],'foundation']
 ]:chapterIndex===0?[
  ['四阿屋面',[5,12.8,1],'roof'],['柱头铺作',[17,7.9,8.83],'brackets'],['前檐柱',[17,3.4,8.83],'columns'],['柱础',[17,.8,8.83],'foundation']
 ]:[
  ['柱网',[-17,3.8,8.83],'columns'],['铺作',[-12.6,7.6,9.5],'brackets'],['明栿',[7.56,7.7,2.5],'ming'],['草架 / 叉手',[2.52,12.2,0],'roofFrame'],['槫与椽',[-6,10.2,4.8],'rafters'],['四阿屋面',[5,12.8,1],'roof']
 ];
 $('model-labels').replaceChildren();for(const [text,point,layer,tier=0] of items){const el=document.createElement('span');el.className='model-label';el.textContent=text;el._anchor={point:new THREE.Vector3(...point),layer,tier};$('model-labels').append(el);}updateLabels();
}
function updateLabels(){
 if(!camera||!activeModel)return;$('model-labels').hidden=!$('labels-toggle').checked;
 const rect=$('viewport').getBoundingClientRect();for(const el of $('model-labels').children){const a=el._anchor;const point=a.point.clone();point.y+=activeModel===detail?a.tier*explode*.50:layerConfig.get(a.layer).offset*explode;
 const layer=activeModel.layers.get(a.layer);const projected=point.clone().project(camera);const x=(projected.x*.5+.5)*rect.width,y=(-projected.y*.5+.5)*rect.height;
 const clipped=$('section-toggle').checked&&clipPlane.distanceToPoint(point)<0;
 el.hidden=!layer.visible||projected.z>1||projected.z< -1||x<40||x>rect.width-45||y<70||y>rect.height-40||clipped;
 el.style.left=`${x}px`;el.style.top=`${y}px`;}
}
function applyExplosion(){
 if(!activeModel)return;for(const [id,group] of activeModel.layers){group.position.y=activeModel===detail?0:layerConfig.get(id).offset*explode;}
 if(activeModel===detail)for(const mesh of detail.meshes){mesh.position.y=mesh.userData.tier*explode*.50;mesh.position.z=mesh.userData.tier>2?explode*(mesh.userData.tier-2)*.07:0;}
 activeModel.root.updateMatrixWorld(true);if(selected)updateSelectionBox();dirty=true;
}
function updateClipping(){
 const enabled=$('section-toggle').checked;$('section-controls').hidden=!enabled;const axis=$('section-axis').value;
 const range=activeModel===detail?3:(axis==='x'?21:12);const p=Number($('section-position').value)/100*range;
 clipPlane.normal.set(axis==='x'?-sectionSign:0,0,axis==='z'?-sectionSign:0);clipPlane.constant=p*sectionSign;
 for(const mat of [...Object.values(baseMaterials),...coloredMaterials.values()]){mat.clippingPlanes=enabled?[clipPlane]:[];mat.clipShadows=true;mat.needsUpdate=true;}
 if(selected)clearSelection();dirty=true;
}
function updateColors(){
 for(const m of [...model.meshes,...detail.meshes]){
  const base=baseMaterials[m.userData.materialKey];if(!$('color-toggle').checked){m.material=base;continue;}
  const key=`${m.userData.layer}/${m.userData.materialKey}`;
  if(!coloredMaterials.has(key)){const mat=base.clone();mat.color.set(layerConfig.get(m.userData.layer).color);mat.map=null;coloredMaterials.set(key,mat);}m.material=coloredMaterials.get(key);
 }updateClipping();dirty=true;
}
function clearSelection(){selected=null;if(selectionBox)selectionBox.visible=false;$('selection-chip').hidden=true;$('selected-part').innerHTML='<p class="eyebrow">点选模型中的一件木作</p><p class="selection-placeholder">每根柱、每道梁与每层铺作，都可以查看名称、作用和建模依据。</p>';dirty=true;}
function selectHit(hit){
 const record=hit.object.userData.records[hit.instanceId];if(!record)return;selected={mesh:hit.object,index:hit.instanceId,record};const info=PARTS[record.type]||PARTS[record.layer];
 $('selection-chip').textContent=info.name;$('selection-chip').hidden=false;
 $('selected-part').innerHTML=`<p class="eyebrow">${info.term}</p><h3 class="part-name">${info.name}</h3><p class="part-text">${info.text}</p><p class="part-evidence">${info.evidence}</p><p class="part-id"></p>`;
 $('selected-part').querySelector('.part-id').textContent=record.tag||record.assembly||record.id;updateSelectionBox();dirty=true;
}
function updateSelectionBox(){
 if(!selected)return;const {mesh,index}=selected;const matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);matrix.premultiply(mesh.matrixWorld);if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();selectionBox.box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix).expandByScalar(.025);selectionBox.visible=effectivelyVisible(mesh);
}
function onPick(e){
 if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;
 const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
 const candidates=activeModel.meshes.filter(effectivelyVisible);
 const hits=raycaster.intersectObjects(candidates,false);const hit=hits.find(h=>!$('section-toggle').checked||clipPlane.distanceToPoint(h.point)>=0);if(hit)selectHit(hit);else clearSelection();
}
function keyboardView(e){
 if(e.target!==$('viewport'))return;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0','Escape'].includes(e.key))return;e.preventDefault();animation=null;
 if(e.key==='Escape'){clearSelection();return;}if(e.key==='0'){setView(activeModel===detail?'detail':'iso');return;}
 const offset=camera.position.clone().sub(controls.target);const sph=new THREE.Spherical().setFromVector3(offset);
 if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi-=.08;if(e.key==='ArrowDown')sph.phi+=.08;
 if(e.key==='+'||e.key==='=')sph.radius*=.9;if(e.key==='-')sph.radius*=1.1;sph.phi=THREE.MathUtils.clamp(sph.phi,.03,Math.PI*.49);sph.radius=THREE.MathUtils.clamp(sph.radius,controls.minDistance,controls.maxDistance);
 camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));camera.lookAt(controls.target);controls.update();dirty=true;
}
function tick(now){
 if(document.hidden||!visible)return;
 if(animation){const a=animation,t=Math.min(1,(now-a.start)/a.duration),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(a.from,a.to,ease);controls.target.lerpVectors(a.fromTarget,a.toTarget,ease);dirty=true;if(t===1)animation=null;}
 if(Math.abs(explode-targetExplode)>.001){explode=reduced?targetExplode:THREE.MathUtils.lerp(explode,targetExplode,.16);if(Math.abs(explode-targetExplode)<.002)explode=targetExplode;applyExplosion();}
 const changed=controls.update();if(dirty||changed){renderer.render(scene,camera);updateLabels();updateDiagnostics();dirty=false;}
}
for(const button of document.querySelectorAll('[data-chapter]'))button.addEventListener('click',()=>setChapter(Number(button.dataset.chapter)));
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>setView(button.dataset.view));
for(const input of document.querySelectorAll('[data-layer]'))input.addEventListener('change',()=>{if(!activeModel)return;activeModel.layers.get(input.dataset.layer).visible=input.checked;clearSelection();dirty=true;});
$('layers-all').addEventListener('click',()=>{if(!activeModel)return;for(const input of document.querySelectorAll('[data-layer]')){input.checked=!input.disabled;activeModel.layers.get(input.dataset.layer).visible=!input.disabled;}dirty=true;});
function explosionInput(){targetExplode=Number($('explode').value)/100;$('explode-value').value=`${$('explode').value}%`;$('explode-toggle').textContent=targetExplode?'合回':'展开';if(camera)setView(currentView);dirty=true;}
$('explode').addEventListener('input',explosionInput);$('explode-toggle').addEventListener('click',()=>{$('explode').value=targetExplode>0?0:100;explosionInput();});
$('section-toggle').addEventListener('change',updateClipping);$('section-axis').addEventListener('change',updateClipping);$('section-position').addEventListener('input',updateClipping);$('section-flip').addEventListener('click',()=>{sectionSign*=-1;updateClipping();});
$('labels-toggle').addEventListener('change',()=>dirty=true);$('color-toggle').addEventListener('change',updateColors);
$('reset-view').addEventListener('click',()=>{$('color-toggle').checked=false;$('labels-toggle').checked=true;updateColors();setChapter(0);});
$('prev-chapter').addEventListener('click',()=>setChapter(Math.max(0,chapterIndex-1)));$('next-chapter').addEventListener('click',()=>setChapter(Math.min(CHAPTERS.length-1,chapterIndex+1)));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewer-column').requestFullscreen();}catch{$('view-status').textContent='当前浏览器不支持全屏，可放大浏览器面板。';}});
function updateDiagnostics(){
 if(!camera||!activeModel)return;
 $('runtime-state').dataset.settled=String(!animation&&Math.abs(explode-targetExplode)<.001);
 $('runtime-state').textContent=JSON.stringify({architecture:'foguang',revision:PRODUCTION_REVISION,chapter:chapterIndex,view:currentView,fov:camera.fov,viewport:{width:innerWidth,height:innerHeight},camera:{position:camera.position.toArray(),target:controls.target.toArray()},explode,requestedExplode:targetExplode,section:$('section-toggle').checked,axis:$('section-axis').value,alternateLight:$('light-toggle').checked,selected:selected?.record.id||null,selectedTier:selected?.mesh.userData.tier??null,selectionBounds:selectionBox.visible?{min:selectionBox.box.min.toArray(),max:selectionBox.box.max.toArray()}:null,hiddenLayers:[...activeModel.layers].filter(([,g])=>!g.visible).map(([id])=>id),projected:projectedBounds(activeModel,camera)});
}
document.addEventListener('architecture:photo-model',event=>{if(event.detail.building==='foguang'){setChapter(event.detail.chapter);$('studio').scrollIntoView({behavior:'instant'});}});
mountPhotoGallery($('photo-atlas'),'foguang');
initialize();
