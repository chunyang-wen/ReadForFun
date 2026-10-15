import * as T from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {LAYERS} from '../data.js';
import {createBaselineMaterials,createStudyMaterials} from './materials.js';
import {createRoofSample,replaceSampleRibs} from './roof-sample.js';
import {buildEnclosure} from './enclosure.js';
import {buildFrontBrackets,isFrontIntermediate} from './brackets.js';
import {buildRoofEnvelope,isLegacyTile} from './roof-envelope.js';
import {splitInstances,activeMeshes,effectivelyVisible} from './adapt-model.js';
import {validateFoguang} from './validate.js';
const $=id=>document.getElementById(id);
const names={a:'A · 原卷基线',b:'B · 仅材料',c:'C · 局部灰瓦',d:'D · 檐下光照',e:'E · 现状围护',f:'F · 前檐补间',g:'G · 四坡瓦作'};
const descriptions={a:'原卷几何、材料与光照；使用实验页统一机位和背景。',b:'相对A只改材料：中性灰瓦与较深木色，未做色卡标定。',c:'相对B只改中央前檐瓦片几何；尺寸推定，素面瓦当为占位。',d:'相对C只改照明：降低均匀补光，保留檐下木构可读性。',e:'相对D只改围护：五间板门、两端直棂窗、上部填充与侧后墙。形制有据，标高/厚度比例推定。',f:'相对E只改前檐七处补间代表形态：按近照表达两层出跳与横栱，未取得逐攒及背尾详图。',g:'相对F只将逐瓦表达扩展到四坡，消除中央样片边界。仍沿用原卷屋面曲线；角部排瓦、瓦径、搭接及吻兽尚非测绘复原。'};
let config,renderer,scene,camera,controls,models,materials,sun,fill,sky,sample,enclosure,brackets,envelope,masks,selectionBox;
let mode='g',view='whole',dirty=true,selected=null,removed=0;
const clip=new T.Plane(new T.Vector3(-1,0,0),0);
function clearSelection(){selected=null;selectionBox.visible=false;$('selection').textContent='点选构件查看名称与证据；选中框跟随拆解、门扇和图层。';dirty=true;}
function active(){return ['a','b'].includes(mode)?models.a:models.c;}
function pickMeshes(){return activeMeshes(active().root);}
function updateSelection(){
 if(!selected)return;
 const {mesh,index}=selected;if(!effectivelyVisible(mesh)){selectionBox.visible=false;return;}
 scene.updateMatrixWorld(true);mesh.geometry.computeBoundingBox();const instance=new T.Matrix4();mesh.getMatrixAt(index,instance);
 selectionBox.box.copy(mesh.geometry.boundingBox).applyMatrix4(instance).applyMatrix4(mesh.matrixWorld);
 const center=selectionBox.box.getCenter(new T.Vector3());selectionBox.visible=!$('section').checked||clip.distanceToPoint(center)>=0;
}
function select(mesh,index){
 const r=mesh.userData.records[index];if(!r)return;
 selected={mesh,index,record:r};
 const types={'head-infill':'门窗上方填充','bracket-backing':'铺作后部填充','door-plank':'板门门板','window-mullion':'直棂窗棂','cover-tile':'筒瓦','pan-tile':'槽形板瓦','eave-disk':'瓦当素面占位','wall-plinth':'墙脚','gable-wall':'山墙'};
 $('selection').textContent=`${types[r.kind]||r.kind||r.type} · ${r.layer||mesh.userData.layer} · ${r.status||r.approximation||'原卷规则化研究构件'}。${r.limits||r.source||'隐蔽节点与逐件尺寸待核定'} [${r.id}]`;
 updateSelection();dirty=true;
}
function setMode(next){
 mode=next;const improved=!['a','b'].includes(mode),newEnclosure=['e','f','g'].includes(mode),newBrackets=['f','g'].includes(mode),wholeRoof=mode==='g';
 models.a.root.visible=!improved;models.c.root.visible=improved;
 masks.enclosure.set(newEnclosure);enclosure.root.visible=newEnclosure;
 masks.brackets.set(newBrackets);brackets.root.visible=newBrackets;
 masks.roof.set(wholeRoof);envelope.root.visible=wholeRoof;sample.root.visible=improved&&!wholeRoof;
 const palette=mode==='a'?materials.a:materials.b;
 active().root.traverse(o=>{if(o.isInstancedMesh)o.material=palette[o.userData.materialKey]||palette.wood;});
 const lighting=config.lighting[['a','b','c'].includes(mode)?'baseline':'d'];
 sky.intensity=lighting.hemisphere;sun.intensity=lighting.sun;fill.intensity=lighting.fill;renderer.toneMappingExposure=lighting.exposure;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 $('mode-label').textContent=names[mode];$('description').textContent=descriptions[mode];
 $('door').disabled=!newEnclosure;clearSelection();applyLayers();
}
function setView(next){
 view=next;const v=config.views[view],t=Number($('separate').value)/100;
 controls.target.fromArray(v.target).add(new T.Vector3(0,9*t,0));
 const offset=new T.Vector3().fromArray(v.position).sub(new T.Vector3().fromArray(v.target));
 offset.multiplyScalar(Math.max(1,2/camera.aspect));camera.position.copy(controls.target).add(offset);
 if(t>0){
  const bounds=visibleBuildingBounds();
  if(!bounds.isEmpty()){
   bounds.getCenter(controls.target);const direction=offset.clone().normalize();
   let near=3,far=350;
   for(let iteration=0;iteration<26;iteration++){
    const distance=(near+far)/2;camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld(true);
    let fits=true;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const projected=new T.Vector3(x,y,z).project(camera);if(Math.abs(projected.x)>.88||Math.abs(projected.y)>.88||projected.z>1||projected.z< -1)fits=false;}
    if(fits)far=distance;else near=distance;
   }
   camera.position.copy(controls.target).addScaledVector(direction,far);
  }
 }
 controls.update();
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));dirty=true;
}
function applyLayers(){
 const t=Number($('separate').value)/100;
 for(const m of Object.values(models))for(const l of LAYERS){const g=m.layers.get(l.id);g.position.y=l.offset*t+(l.id==='roof'&&$('explode').checked?2:0);g.visible=$('layer-'+l.id).checked;}
 enclosure.setDoorOpen($('door').checked);$('separate-value').textContent=Math.round(t*100)+'%';updateSelection();dirty=true;
}
function applyClipping(){
 const axis=$('section-axis').value,p=Number($('section-position').value)/100*(axis==='x'?21:12);
 clip.normal.set(axis==='x'?-1:0,0,axis==='z'?-1:0);clip.constant=p;
 for(const palette of Object.values(materials))for(const mat of Object.values(palette)){mat.clippingPlanes=$('section').checked?[clip]:[];mat.clipShadows=true;mat.needsUpdate=true;}
 updateSelection();dirty=true;
}
function reset(){
 for(const id of ['explode','light','door','section'])$(id).checked=false;
 $('section-position').value=0;$('separate').value=0;document.querySelectorAll('[data-layer]').forEach(i=>i.checked=true);sun.position.x=-22;
 applyLayers();applyClipping();clearSelection();setView(view);
}
function visibleBuildingBounds(){
 scene.updateMatrixWorld(true);const box=new T.Box3();
 for(const mesh of pickMeshes())if(mesh.boundingBox)box.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
 return box;
}
function projectedBuildingBounds(){
 const box=visibleBuildingBounds();
 if(box.isEmpty())return null;
 const xs=[],ys=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);xs.push(p.x);ys.push(p.y);}
 return {min:[Math.min(...xs),Math.min(...ys)],max:[Math.max(...xs),Math.max(...ys)]};
}
function stats(){
 const data={architecture:config.id,revision:config.revision,mode,view,roofLift:$('explode').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),patch:config.patch,fov:camera.fov,selected:selected?.record.id||null,selectionLayer:selected?.record.layer||selected?.mesh.userData.layer||null,selectionBounds:selected&&selectionBox.visible?{min:selectionBox.box.min.toArray(),max:selectionBox.box.max.toArray()}:null,roofWorldY:models.c.layers.get('roof').position.y,anchorWorldY:models.c.layers.get('columns').position.y,sampleRecords:sample.records.length,envelopeRecords:envelope.records.length,removedRibSegments:removed,doorOpen:$('door').checked,totalSplit:Number($('separate').value),section:$('section').checked,sectionAxis:$('section-axis').value,hiddenLayers:LAYERS.filter(l=>!$('layer-'+l.id).checked).map(l=>l.id),projectedBuilding:projectedBuildingBounds(),activeInstances:pickMeshes().reduce((n,m)=>n+m.count,0),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,canvasSize:renderer.getSize(new T.Vector2()).toArray(),parameterBoundary:'未完成照片机位配准；厚度/标高/瓦件为推定'};
 $('stats').textContent=JSON.stringify(data,null,2);
}
function initialize(){
 $('layer-list').innerHTML=LAYERS.map(l=>`<label><input type="checkbox" id="layer-${l.id}" data-layer="${l.id}" checked>${l.short}</label>`).join('');
 renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,config.capture.pixelRatioMax));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.localClippingEnabled=true;
 $('viewport').append(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(config.capture.cameraFov,1,.1,500);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=220;controls.addEventListener('change',()=>dirty=true);
 sky=new T.HemisphereLight(0xfff9ea,0x6b705f,2.8);scene.add(sky);
 sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-22,43,29);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:44,bottom:-32,near:.5,far:150});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;scene.add(sun);
 fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
 materials={a:createBaselineMaterials(),b:createStudyMaterials(config.materials)};models={a:buildModel(materials.a),c:buildModel(materials.b)};
 removed=replaceSampleRibs(models.c,config.patch);
 masks={enclosure:splitInstances(models.c,r=>r.layer==='enclosure'),brackets:splitInstances(models.c,isFrontIntermediate),roof:splitInstances(models.c,isLegacyTile)};
 sample=createRoofSample(materials.b.tile,{parameters:config.patch});enclosure=buildEnclosure(materials.b,config.enclosure);brackets=buildFrontBrackets(materials.b,config.frontBracket);envelope=buildRoofEnvelope(materials.b.tile,config.roofEnvelope);
 models.c.layers.get('roof').add(sample.root,envelope.root);models.c.layers.get('enclosure').add(enclosure.root);models.c.layers.get('brackets').add(brackets.root);
 scene.add(models.a.root,models.c.root);
 selectionBox=new T.Box3Helper(new T.Box3(),0x9e4538);selectionBox.material.depthTest=false;selectionBox.renderOrder=100;selectionBox.visible=false;scene.add(selectionBox);
 const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
 new ResizeObserver(()=>{const r=$('viewport').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);}).observe($('viewport'));
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
 document.querySelectorAll('[data-layer]').forEach(i=>i.addEventListener('change',applyLayers));
 $('explode').addEventListener('change',applyLayers);$('door').addEventListener('change',applyLayers);
 $('separate').addEventListener('input',()=>{applyLayers();setView(view);});
 $('light').addEventListener('change',()=>{sun.position.x=$('light').checked?22:-22;dirty=true;});
 for(const id of ['section','section-axis','section-position'])$(id).addEventListener(id==='section-position'?'input':'change',applyClipping);
 $('reset').addEventListener('click',reset);
 $('pick-sample').addEventListener('click',()=>{if(['a','b'].includes(mode))setMode('c');const matches=pickMeshes().flatMap(mesh=>mesh.userData.records.map((r,i)=>({mesh,i,r}))).find(({r})=>r.kind==='eave-disk'&&r.id.endsWith('/0/0')&&(mode!=='g'||r.side===0));if(matches)select(matches.mesh,matches.i);});
 $('pick-door').addEventListener('click',()=>{if(!['e','f','g'].includes(mode))setMode('g');const matches=pickMeshes().flatMap(mesh=>mesh.userData.records.map((r,i)=>({mesh,i,r}))).find(({r})=>r.id==='foguang/enclosure-v2/front/bay-3/leaf-left/plank-2');if(matches)select(matches.mesh,matches.i);});
 let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(pickMeshes(),false).find(h=>!$('section').checked||clip.distanceToPoint(h.point)>=0);if(hit)select(hit.object,hit.instanceId);else clearSelection();});
 $('viewport').addEventListener('keydown',e=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(e.key==='Escape')clearSelection();else if(['ArrowLeft','ArrowRight'].includes(e.key)){offset.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(offset);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(offset.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
 const query=new URLSearchParams(location.search);$('loading').hidden=true;view=config.views[query.get('view')]?query.get('view'):'whole';setView(view);setMode(config.modes.includes(query.get('mode'))?query.get('mode'):'g');
 renderer.setAnimationLoop(()=>{if(dirty){updateSelection();renderer.render(scene,camera);stats();dirty=false;}});
}
try{config=validateFoguang(await(await fetch('./experiment.json',{cache:'no-store'})).json());await document.fonts.ready;initialize();}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
