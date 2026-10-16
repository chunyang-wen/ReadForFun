import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { buildModel, SPEC, getColumnGrid } from './model.js?v=qinian-02';
import { LAYERS, CHAPTERS, PARTS, SOURCES, NODES } from './data.js';

import {mountPhotoGallery} from '../photos/gallery.js?v=qinian-02b';
const REVISION='qinian-20261016-02';
const $=id=>document.getElementById(id);
let chapterIndex=0,model,detail,renderer,scene,camera,controls,selectionBox,ground,gridGuide;
let activeModel,details=new Map(),detailNode="square",dirty=true,explode=0,targetExplode=0,animation=null,sectionSign=1;
let mainLight;
let selected=null,pointerStart=null,visible=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clipPlane=new THREE.Plane(new THREE.Vector3(-1,0,0),0);
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
const baseMaterials={},coloredMaterials=new Map();
const layerConfig=new Map(LAYERS.map(l=>[l.id,l]));

$('chapters').innerHTML=CHAPTERS.map((c,i)=>`<button data-chapter="${i}" aria-pressed="${i===0}"><span>${c.n}</span>${c.title}</button>`).join('');
$('layer-list').innerHTML=LAYERS.map(l=>`<label class="layer-item" style="--layer-color:${l.color}"><input type="checkbox" data-layer="${l.id}" checked><i class="layer-dot"></i><span>${l.label}</span></label>`).join('');
$('sources').innerHTML=SOURCES.map(s=>`<article><a href="${s.url}" target="_blank" rel="noopener">${s.title} ↗</a><p>${s.note}</p></article>`).join('');
$('evidence-open').addEventListener('click',()=>$('evidence').scrollIntoView({behavior:reduced?'instant':'smooth'}));

function woodTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#cbb184';ctx.fillRect(0,0,256,512);let seed=23;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<500;i++){const x=random()*256;ctx.strokeStyle=`rgba(68,38,16,${.018+random()*.055})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=512;y+=16)ctx.lineTo(x+Math.sin(y/55+x)*2.2,y);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
function ornamentTexture(kind){
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
 x.fillStyle=kind==='paint'?'#22535b':'#b39651';x.fillRect(0,0,512,256);x.strokeStyle='#d4b566';x.lineWidth=5;
 if(kind==='paint'||kind==='gildedPaint'){
  x.strokeRect(9,20,494,216);x.fillStyle=kind==='paint'?'#243f69':'#b59750';x.beginPath();x.moveTo(160,70);x.lineTo(350,70);x.lineTo(380,128);x.lineTo(350,186);x.lineTo(160,186);x.lineTo(130,128);x.closePath();x.fill();x.stroke();
  for(const a of [66,445]){x.beginPath();x.moveTo(a-35,128);x.bezierCurveTo(a-20,60,a+32,80,a+30,128);x.bezierCurveTo(a+25,180,a-25,180,a-35,128);x.stroke();x.beginPath();x.moveTo(a-20,128);x.lineTo(a+20,128);x.stroke();}

 }else{
  x.strokeStyle='#775822';x.strokeRect(10,10,492,236);x.strokeRect(25,24,462,208);x.translate(256,128);for(let i=0;i<12;i++){x.rotate(Math.PI/6);x.beginPath();x.ellipse(0,-57,18,48,0,0,Math.PI*2);x.stroke();}x.beginPath();x.arc(0,0,19,0,Math.PI*2);x.stroke();
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function plaqueTexture(){const c=document.createElement('canvas');c.width=128;c.height=384;const x=c.getContext('2d');x.fillStyle='#173b59';x.fillRect(0,0,128,384);x.fillStyle='#dfc677';x.font='76px Songti SC, serif';x.textAlign='center';['祈','年','殿'].forEach((t,i)=>x.fillText(t,64,94+i*114));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function createMaterials(){
 const wood=woodTexture();const palette={wood:0xbb965e,darkwood:0x8c6c39,column:0x953b2a,endgrain:0xc3a76b,rafter:0xc8ac74,stone:0x9d9e91,lightstone:0xc4c4b0,ceiling:0xc0a363,ceilingPanel:0xb69b68,roofBoard:0x1c3d65,tile:0x234b79,ridge:0x346789,plaster:0xa44835,door:0x973f32,metal:0x625944,blue:0x365b75,green:0x41786d,gold:0xc7a45e,paint:0xffffff,lotus:0xffffff,gildedPaint:0xffffff,plaque:0xffffff};
 for(const [key,color] of Object.entries(palette)){
   const timber=['wood','darkwood','endgrain','rafter'].includes(key);
   baseMaterials[key]=new THREE.MeshStandardMaterial({color,roughness:key==='gold'?.38:['tile','roofBoard'].includes(key)?.48:key==='metal'?.55:.92,metalness:key==='gold'?.55:key==='metal'?.45:0,map:key==='plaque'?plaqueTexture():['paint','lotus','gildedPaint'].includes(key)?ornamentTexture(key):timber?wood:null,side:['lotus'].includes(key)?THREE.DoubleSide:THREE.FrontSide,shadowSide:['tile','roofBoard'].includes(key)?THREE.FrontSide:null});
 }
}
function initialize(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0xf3eddf,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.localClippingEnabled=true;
  renderer.domElement.setAttribute('aria-hidden','true');$('viewport').prepend(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.05,1200);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.10;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=160;controls.enablePan=true;
  controls.addEventListener('change',()=>dirty=true);controls.addEventListener('start',()=>animation=null);
  scene.add(new THREE.HemisphereLight(0xfff9ea,0x6b705f,2.8));
  const sun=mainLight=new THREE.DirectionalLight(0xfff1d7,3.5);sun.position.set(-40,65,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-50;sun.shadow.camera.near=.5;sun.shadow.camera.far=200;sun.shadow.normalBias=.04;sun.shadow.bias=-.00008;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
  ground=new THREE.Mesh(new THREE.PlaneGeometry(140,140),new THREE.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  createMaterials();model=buildModel(baseMaterials);for(const n of NODES){const d=buildModel(baseMaterials,{detailOnly:true,node:n.id});details.set(n.id,d);scene.add(d.root);d.root.visible=false;}detail=details.get(detailNode);
  scene.add(model.root);
  const segments=[],g=getColumnGrid();
  for(const r of [SPEC.outerRadius,SPEC.goldRadius])for(let k=0;k<96;k++){const a=k*Math.PI/48,b=(k+1)*Math.PI/48;segments.push(r*Math.sin(a),5.41,r*Math.cos(a),r*Math.sin(b),5.41,r*Math.cos(b));}
  for(const x of [-4,4])segments.push(x,5.41,-4,x,5.41,4);for(const z of [-4,4])segments.push(-4,5.41,z,4,5.41,z);
  gridGuide=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(segments,3)),new THREE.LineBasicMaterial({color:0x984839,transparent:true,opacity:.45}));
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
  resize();setChapter(0,false); populateMembers();
  renderer.setAnimationLoop(tick);
 }catch(error){console.error('Architecture viewer initialization failed',error);$('model-loading').hidden=true;$('model-error').hidden=false;updateChapterText(0);document.querySelectorAll('.viewer-controls input,.viewer-controls button,.viewer-toolbar button').forEach(el=>el.disabled=true);}
}
function resize(){if(!renderer)return;const {width,height}=$('viewport').getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;}
function updateChapterText(i){
 const c=CHAPTERS[i];document.querySelectorAll('[data-chapter]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.chapter)===i)));
 $('chapter-number').textContent=`${c.n} / 祈年殿研究`;$('chapter-title').textContent=c.title;$('chapter-subtitle').textContent=c.subtitle;
 $('chapter-text').textContent=c.text;$('chapter-facts').innerHTML=c.facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');$('chapter-question').textContent=c.question;
 $('prev-chapter').disabled=i===0;$('next-chapter').disabled=i===CHAPTERS.length-1;
}
function setChapter(i,animate=true){
 $('viewport').dataset.settled='false';
 chapterIndex=i;updateChapterText(i);document.dispatchEvent(new CustomEvent('architecture:chapter',{detail:{building:'qinian',chapter:i}}));if(!model)return;gridGuide.visible=i===1;
 const c=CHAPTERS[i];const isDetail=c.view==='detail';for(const d of details.values())d.root.visible=false;if(isDetail){detailNode=c.node||detailNode;detail=details.get(detailNode);} $('node-picker').hidden=!isDetail;$('node-select').value=detailNode;activeModel=isDetail?detail:model;model.root.visible=!isDetail;detail.root.visible=isDetail;ground.position.y=isDetail?-2.1:-.3;
 for(const l of LAYERS){const shown=isDetail?true:c.visible.includes(l.id);activeModel.layers.get(l.id).visible=shown;const input=document.querySelector(`[data-layer="${l.id}"]`);input.checked=shown;input.disabled=activeModel.layers.get(l.id).children.length===0;}
 $('explode').value=c.view==='exploded'?65:0;targetExplode=Number($('explode').value)/100;explode=targetExplode;
 $('explode-label').textContent=isDetail?'局部观察拆合':'整殿系统拆解';$('explode-value').value=`${$('explode').value}%`;$('explode-toggle').textContent=targetExplode?'合回':'展开';
 $('section-toggle').checked=c.view==='section';$('section-position').value=c.view==='section'?12:0;$('section-axis').value='x';sectionSign=1;updateClipping();clearSelection();applyExplosion();
 $('model-mode').textContent=isDetail?NODES.find(n=>n.id===detailNode).label:'光绪重建主体 · 现状参考色';
 $('model-stats').textContent=`${isDetail?'局部关系示意 · 加工尺寸为推定':'四柱方井 · 两圈十二柱 · 三重圆檐'} · 米制比例`;
 populateMembers();setView(c.view==='detail'?'detail':c.view==='section'?'side':c.view==='exploded'?'exploded':c.view,animate);setLabels();dirty=true;
}
function currentBounds(){
 activeModel.root.updateMatrixWorld(true);const bounds=new THREE.Box3();
 for(const mesh of activeModel.meshes)if(mesh.parent.visible&&mesh.visible){if(!mesh.boundingBox)mesh.computeBoundingBox();bounds.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));}
 return bounds.isEmpty()?new THREE.Box3(new THREE.Vector3(-1,-1,-1),new THREE.Vector3(1,1,1)):bounds;
}
function viewTarget(){return currentBounds().getCenter(new THREE.Vector3());}
function fittedPosition(direction){
 const bounds=currentBounds(),target=bounds.getCenter(new THREE.Vector3()),dir=direction.clone().normalize();
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize();
 const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let distance=1;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
 const v=new THREE.Vector3(x,y,z).sub(target),depth=v.dot(dir);
 distance=Math.max(distance,depth+Math.abs(v.dot(up))/tan,depth+Math.abs(v.dot(right))/(tan*camera.aspect));}
 return {target,destination:target.clone().add(dir.multiplyScalar(distance*1.14))};
}
function setView(view,animate=true){
 $('viewport').dataset.settled='false';
 if(!camera)return;const detailView=activeModel===detail;let direction;
 switch(view){case 'front':direction=new THREE.Vector3(0,.10,1);break;case 'back':direction=new THREE.Vector3(0,.10,-1);break;case 'side':direction=new THREE.Vector3(1,.12,0);break;case 'top':direction=new THREE.Vector3(0,1,.001);break;default:direction=new THREE.Vector3(1,.52,1.2);}
 controls.minDistance=detailView?1.4:7;controls.maxDistance=detailView?100:800;
 const {target,destination}=fittedPosition(direction);
 if(animate&&!reduced)animation={from:camera.position.clone(),to:destination,fromTarget:controls.target.clone(),toTarget:target,start:performance.now(),duration:450};
 else{camera.position.copy(destination);controls.target.copy(target);camera.lookAt(target);controls.update();}
 document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view===view||el.dataset.view==='iso'&&['detail','exploded'].includes(view))));
 $('view-status').textContent=({front:'正南',back:'北向',side:'东向剖观',top:'柱网俯视',detail:'节点与装饰局部',exploded:'分层观察',iso:'斜向全貌'})[view]||'自由视角';dirty=true;
}
function setLabels(){
 const items=activeModel===detail?(detailNode==='square'?[['方井口梁',[0,.3,4],'roofFrame',0],['四弧梁',[0,.9,5.65],'roofFrame',1],['八短柱',[4,1.65,4],'roofFrame',2]]:detailNode==='bracket'?[['径向向外',[0,.9,.8],'brackets',2],['切向沿檐',[.8,.5,0],'brackets',1]]:detailNode==='joint'?[['通用原理 · 非本殿实测',[.35,.6,.7],'roofFrame',2]]:[['柱身彩画载体',[-3,3,.62],'ceiling',0],['圆藻井下表面',[0,10.1,3.5],'ceiling',0]]):[];
 $('model-labels').replaceChildren();for(const [text,point,layer,tier=0] of items){const el=document.createElement('span');el.className='model-label';el.textContent=text;el._anchor={point:new THREE.Vector3(...point),layer,tier};$('model-labels').append(el);}updateLabels();
}
function updateLabels(){
 if(!camera||!activeModel)return;$('model-labels').hidden=!$('labels-toggle').checked;
 const rect=$('viewport').getBoundingClientRect();for(const el of $('model-labels').children){const a=el._anchor;const point=a.point.clone();point.y+=activeModel===detail?a.tier*explode*.50:layerConfig.get(a.layer).offset*explode;if(activeModel===detail&&detailNode==='joint')point.x+=a.tier*explode*.6;
 const layer=activeModel.layers.get(a.layer);const projected=point.clone().project(camera);const x=(projected.x*.5+.5)*rect.width,y=(-projected.y*.5+.5)*rect.height;
 const clipped=$('section-toggle').checked&&clipPlane.distanceToPoint(point)<0;
 el.hidden=!layer.visible||projected.z>1||projected.z< -1||x<40||x>rect.width-45||y<70||y>rect.height-40||clipped;
 if(!el.hidden){const dir=point.clone().sub(camera.position),dist=dir.length();raycaster.set(camera.position,dir.normalize());const occlusion=raycaster.intersectObjects(activeModel.meshes.filter(m=>m.parent.visible&&m.visible),false).find(h=>(!$('section-toggle').checked||clipPlane.distanceToPoint(h.point)>=0)&&h.distance<dist-.5);if(occlusion)el.hidden=true;} el.style.left=`${x}px`;el.style.top=`${y}px`;}
}
function syncTerrace(){if(!model)return;const full=model.layers.get('terrace').visible;for(const mesh of model.meshes)if(mesh.userData.records.some(r=>r.key==='local/deck'))mesh.visible=!full;}
function applyExplosion(){
 syncTerrace();
 if(!activeModel)return;for(const [id,group] of activeModel.layers){group.position.y=activeModel===detail?0:layerConfig.get(id).offset*explode;}
 if(activeModel===detail)for(const mesh of detail.meshes){mesh.position.y=mesh.userData.tier*explode*.50;mesh.position.x=detailNode==='joint'?mesh.userData.tier*explode*.6:0;mesh.position.z=mesh.userData.tier>2?explode*(mesh.userData.tier-2)*.07:0;}
 activeModel.root.updateMatrixWorld(true);if(selected)updateSelectionBox();dirty=true;
}
function updateClipping(){
 const enabled=$('section-toggle').checked;$('section-controls').hidden=!enabled;const axis=$('section-axis').value;
 const range=activeModel===detail?8:($('layer-list').querySelector('[data-layer=terrace]').checked?46:18);const p=Number($('section-position').value)/100*range;
 clipPlane.normal.set(axis==='x'?-sectionSign:0,0,axis==='z'?-sectionSign:0);clipPlane.constant=p*sectionSign;
 for(const mat of [...Object.values(baseMaterials),...coloredMaterials.values()]){mat.clippingPlanes=enabled?[clipPlane]:[];mat.clipShadows=true;mat.needsUpdate=true;}
 if(selected)clearSelection();dirty=true;
}
function updateColors(){
 for(const m of [...model.meshes,...[...details.values()].flatMap(d=>d.meshes)]){
  const keyMat=m.userData.materialKey;const base=baseMaterials[$('finish-toggle').checked&&['blue','green','gold','paint','gildedPaint','lotus','column','door'].includes(keyMat)?(keyMat==='column'?'wood':keyMat==='lotus'?'ceilingPanel':'wood'):keyMat];if(!$('color-toggle').checked){m.material=base;continue;}
  const key=`${m.userData.layer}/${m.userData.materialKey}/${$('finish-toggle').checked}`;
  if(!coloredMaterials.has(key)){const mat=base.clone();mat.color.set(layerConfig.get(m.userData.layer).color);mat.map=null;coloredMaterials.set(key,mat);}m.material=coloredMaterials.get(key);
 }updateClipping();dirty=true;
}
function clearSelection(){selected=null;if(selectionBox)selectionBox.visible=false;$('selection-chip').hidden=true;$('selected-part').innerHTML='<p class="eyebrow">点选模型中的一件木作</p><p class="selection-placeholder">每根柱、每道梁与每层铺作，都可以查看名称、作用和建模依据。</p>';dirty=true;}
function selectHit(hit){
 const record=hit.object.userData.records[hit.instanceId];if(!record)return;selected={mesh:hit.object,index:hit.instanceId,record};const info=PARTS[record.type]||PARTS[record.layer];
 $('selection-chip').textContent=info.name;$('selection-chip').hidden=false;
 $('selected-part').innerHTML=`<p class="eyebrow">${info.term}</p><h3 class="part-name">${info.name}</h3><p class="part-text">${info.text}</p><p class="part-evidence">${info.evidence}</p><p class="part-id"></p>`;
 $('selected-part').querySelector('.part-id').textContent=`${record.status} · ${record.source} · 位置(${record.position.map(v=>v.toFixed(2)).join(', ')})m · 承接：${(record.support||record.endSupport||'见构件说明')} · ${record.note||''} · ${record.id}`;updateSelectionBox();dirty=true;
}
function updateSelectionBox(){
 if(!selected)return;const {mesh,index}=selected;const matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);matrix.premultiply(mesh.matrixWorld);if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();selectionBox.box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix).expandByScalar(.025);selectionBox.visible=true;
}
function onPick(e){
 if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;
 const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
 const candidates=activeModel.meshes.filter(mesh=>mesh.parent.visible&&mesh.visible);
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
 const changed=controls.update();if(dirty||changed){renderer.render(scene,camera);updateLabels();dirty=false;$('viewport').dataset.settled=String(!animation&&Math.abs(explode-targetExplode)<.001);}
}
for(const button of document.querySelectorAll('[data-chapter]'))button.addEventListener('click',()=>setChapter(Number(button.dataset.chapter)));
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>setView(button.dataset.view));
for(const input of document.querySelectorAll('[data-layer]'))input.addEventListener('change',()=>{if(!activeModel)return;activeModel.layers.get(input.dataset.layer).visible=input.checked;syncTerrace();clearSelection();populateMembers();setView('iso',false);dirty=true;});
$('layers-all').addEventListener('click',()=>{if(!activeModel)return;for(const input of document.querySelectorAll('[data-layer]')){input.checked=!input.disabled;activeModel.layers.get(input.dataset.layer).visible=!input.disabled;}syncTerrace();populateMembers();setView('iso',false);dirty=true;});
function explosionInput(){$('viewport').dataset.settled='false';animation=null;targetExplode=Number($('explode').value)/100;$('explode-value').value=`${$('explode').value}%`;$('explode-toggle').textContent=targetExplode?'合回':'展开';explode=targetExplode;applyExplosion();if(camera){const direction=camera.position.clone().sub(controls.target);const {target,destination}=fittedPosition(direction);camera.position.copy(destination);controls.target.copy(target);camera.lookAt(target);controls.update();}dirty=true;}
$('explode').addEventListener('input',explosionInput);$('explode-toggle').addEventListener('click',()=>{$('explode').value=targetExplode>0?0:100;explosionInput();});
$('section-toggle').addEventListener('change',updateClipping);$('section-axis').addEventListener('change',updateClipping);$('section-position').addEventListener('input',updateClipping);$('section-flip').addEventListener('click',()=>{sectionSign*=-1;updateClipping();});
$('finish-toggle').addEventListener('change',updateColors);
$('light-toggle').addEventListener('change',()=>{mainLight.position.set(...($('light-toggle').checked?[40,45,-45]:[-40,65,45]));dirty=true;});
$('labels-toggle').addEventListener('change',()=>dirty=true);$('color-toggle').addEventListener('change',updateColors);
$('reset-view').addEventListener('click',()=>{$('light-toggle').checked=false;mainLight.position.set(-40,65,45);$('color-toggle').checked=false;$('finish-toggle').checked=false;$('labels-toggle').checked=true;updateColors();setChapter(0);});
$('prev-chapter').addEventListener('click',()=>setChapter(Math.max(0,chapterIndex-1)));$('next-chapter').addEventListener('click',()=>setChapter(Math.min(CHAPTERS.length-1,chapterIndex+1)));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewer-column').requestFullscreen();}catch{$('view-status').textContent='当前浏览器不支持全屏，可放大浏览器面板。';}});
function populateMembers(){if(!activeModel)return;const select=$('member-list');select.replaceChildren(new Option('选择关键构件…',''));for(const m of activeModel.meshes)if(m.parent.visible&&m.visible){const seen=new Set();m.userData.records.forEach((r,index)=>{const key=`${r.type}:${r.level||''}:${r.ring||''}`;if(['roof','rafter','dou'].includes(r.type)||seen.has(key))return;seen.add(key);const opt=new Option(`${PARTS[r.type].name} · ${r.level||r.assembly||r.id}`,`${activeModel.meshes.indexOf(m)}:${index}`);select.add(opt);});}}
$('member-list').addEventListener('change',()=>{const [m,i]=$('member-list').value.split(':').map(Number);if(Number.isFinite(i))selectHit({object:activeModel.meshes[m],instanceId:i});});
$('node-select').innerHTML=NODES.map(n=>`<option value="${n.id}">${n.label}</option>`).join('');
$('node-select').addEventListener('change',()=>{const next=$('node-select').value;details.forEach(d=>d.root.visible=false);detailNode=next;detail=details.get(next);activeModel=detail;detail.root.visible=true;for(const l of LAYERS){const g=detail.layers.get(l.id);g.visible=g.children.length>0;const input=document.querySelector(`[data-layer="${l.id}"]`);input.checked=g.visible;input.disabled=!g.visible;} $('explode').value=0;explode=targetExplode=0;$('explode-value').value='0%';$('explode-toggle').textContent='展开';$('model-mode').textContent=NODES.find(n=>n.id===next).label;$('model-stats').textContent='局部关系示意 · 所有加工尺寸为推定';applyExplosion();clearSelection();updateClipping();populateMembers();setView('detail',false);setLabels();});
document.addEventListener('architecture:photo-model',event=>{const d=event.detail;if(d.building!=='qinian'||!CHAPTERS[d.chapter])return;setChapter(d.chapter,false);if(d.node&&NODES.some(n=>n.id===d.node)){$('node-select').value=d.node;$('node-select').dispatchEvent(new Event('change'));}$('studio').scrollIntoView({behavior:'instant'});});
mountPhotoGallery($('photo-atlas'),'qinian');
initialize();
// Read-only state for reproducible browser validation of fitting and current UI state.
export function getViewerState(){return {architecture:'qinian',revision:REVISION,script:import.meta.url,alternateLight:$('light-toggle').checked,viewport:{width:innerWidth,height:innerHeight},selected:selected?.record.id||null,selectionBounds:selectionBox?.visible?{min:selectionBox.box.min.toArray(),max:selectionBox.box.max.toArray()}:null,chapter:chapterIndex,detail:activeModel===detail,node:detailNode,explode,targetExplode,section:$('section-toggle').checked,layers:[...activeModel.layers].filter(([,g])=>g.visible).map(([id])=>id),bounds:{min:currentBounds().min.toArray(),max:currentBounds().max.toArray()},camera:camera.position.toArray(),target:controls.target.toArray(),projected:(()=>{const b=currentBounds(),ps=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])ps.push(new THREE.Vector3(x,y,z).project(camera).toArray());return ps;})()};}
