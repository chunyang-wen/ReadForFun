import * as T from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {createBaselineMaterials,createStudyMaterials} from './materials.js';
import {createRoofSample,replaceSampleRibs} from './roof-sample.js';
import {applyPairedReach} from './structure-sample.js';
import {buildRoofEnvelope,replaceRoofLayer,refitRoofMembers} from './roof-envelope.js';
import {buildExterior,replaceVisibleEnclosure,addPlaqueLettering} from './exterior.js';
import {buildUpperNode} from './upper-node.js';
import {validateExperiment} from '../../realism-workflow/manifest.js';
let experiment;

const $=id=>document.getElementById(id),viewport=$('viewport');
const labels={a:'A · 原有模型',b:'B · 材料校色',c:'C · 定向光照',d:'D · 灰瓦檐口',e:'E · 全屋面与翼角',f:'F · 现状外观研究'};
const descriptions={a:'原有辽构教学骨架与材质，统一实验机位。不是现状全貌。',b:'仅改材料底色与粗糙度，参考2020照片的灰瓦、暗木与红色围护；未核定历史原色。',c:'保持B几何和材料，仅降低补光与曝光，比较檐下深影。',d:'保持C材料与光照，仅替换上檐南面中央灰瓦试件。槽形底瓦、搭接与檐口有实体；瓦径与搭接尺寸为比例推定，瓦当雕纹未复原。节点视角另测试表四的成对出跳分配；两处独立试件，不归因于单一几何变量。'};
descriptions.e='上下完整屋面统一分段灰瓦，增加九脊轮廓和翼角，同步拟合相关椽段并保留承檐轨迹；曲线与瓦尺寸为推定，脊端陶饰未复原。';
descriptions.f='在E上增加照片可见的南面开口、红围护、上下擎檐柱与匾额轮廓；侧墙推定，匾字用系统字体占位。上檐节点另示两下昂；整阁上檐铺作仍沿用简化骨架，角度和真实卯口待核定。';
let envelope,exterior,upperNode,plaqueMaterial;
let choices=[];
let renderer,scene,camera,controls,models,materials,sun,fill,sky,sample,detail,details,mode='a',view='patch',removed=0,dirty=true,lastStats='';
const clipPlane=new T.Plane(new T.Vector3(-1,0,0),0),raycaster=new T.Raycaster();
function setMode(next){
 mode=next;const isNode=['node','upperNode'].includes(view),enhanced=['d','e','f'].includes(mode),active=mode==='f'?models.f:mode==='e'?models.e:mode==='d'?models.c:models.a;
 detail=view==='upperNode'?upperNode:details[enhanced?'d':'a'];details.a.root.visible=details.d.root.visible=upperNode.root.visible=false;
 for(const m of Object.values(models))m.root.visible=!isNode&&m===active;detail.root.visible=isNode;
 const mat=materials[mode==='a'?'a':'b'];for(const model of [active,detail])for(const mesh of model.meshes)if(mesh.userData.materialKey)mesh.material=mat[mesh.userData.materialKey]||mat.wood;
 const directed=['c','d','e','f'].includes(mode);sky.intensity=directed?1.2:2.8;sun.intensity=3.5;fill.intensity=directed?.28:1.15;renderer.toneMappingExposure=directed?1.15:1.45;
 sample.root.visible=mode==='d';
 for(const m of Object.values(materials))for(const material of Object.values(m))material.clippingPlanes=view==='section'?[clipPlane]:[];
 if(plaqueMaterial)plaqueMaterial.clippingPlanes=view==='section'?[clipPlane]:[];
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 choices=isNode?detail.records.filter(r=>['fork','ang'].includes(r.type)).slice(0,2):mode==='f'?exterior.records.filter(r=>r.kind==='eave-support').slice(0,2):mode==='e'?envelope.records.filter(r=>r.kind==='cover-tile').slice(0,2):[...active.records.filter(r=>r.type==='fork').slice(0,2),...(mode==='d'?sample.records.filter(r=>r.kind==='cover-tile').slice(0,1):[])];
 $('member').innerHTML='<option value="">选择构件…</option>'+choices.map(r=>`<option value="${r.id}">${r.id}</option>`).join('');
 $('mode-label').textContent=labels[mode];$('description').textContent=descriptions[mode];$('selected').textContent='选择构件可查看证据';dirty=true;
}
function setView(next){
  view=next;setMode(mode);
  const views=experiment.views;
  const v=views[next];controls.target.fromArray(v.target);
  const offset=new T.Vector3().fromArray(v.position).sub(controls.target).multiplyScalar(Math.max(1,1.5/camera.aspect));
  camera.position.copy(controls.target).add(offset);controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));dirty=true;
}
function stats(){
  const data={architecture:experiment.id,revision:experiment.revision,mode,view,roofLift:$('explode').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),sampleRecords:sample.records.length,removedRibSegments:removed,fov:camera.fov,pixelRatio:renderer.getPixelRatio(),patch:experiment.patch,clipEnabled:view==='section',sampleWorldY:sample.root.getWorldPosition(new T.Vector3()).y,columnLayerY:models.c.layers.get('columns').position.y,selected:$('selected').textContent,lighting:{sky:sky.intensity,sun:sun.intensity,fill:fill.intensity,exposure:renderer.toneMappingExposure},drawCalls:renderer.info.render.calls,envelopeVisible:['e','f'].includes(mode)&&!['node','upperNode'].includes(view),envelope:experiment.envelope,exteriorVisible:mode==='f'&&!['node','upperNode'].includes(view),supportLayerY:models.f.layers.get('columns').position.y,upperAngCount:upperNode.records.filter(r=>r.type==='ang').length};
  const value=JSON.stringify(data,null,2);if(value!==lastStats){$('stats').textContent=value;lastStats=value;}
}
function initialize(){
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,experiment.capture.pixelRatioMax));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  viewport.append(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(experiment.capture.cameraFov,1,.1,500);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=200;controls.addEventListener('change',()=>dirty=true);
  sky=new T.HemisphereLight(0xfff9ea,0x6b705f,2.8);scene.add(sky);
  sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-40,65,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-50,near:.5,far:200});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;scene.add(sun);
  fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
  materials={a:createBaselineMaterials(),b:createStudyMaterials()};
  models={a:buildModel(materials.a),c:buildModel(materials.b)};removed=replaceSampleRibs(models.c,experiment.patch);sample=createRoofSample(materials.b.tile,{parameters:experiment.patch});models.c.layers.get('roof').add(sample.root);
 models.e=buildModel(materials.b);refitRoofMembers(models.e,experiment.envelope);envelope=buildRoofEnvelope(materials.b,experiment.envelope);replaceRoofLayer(models.e,envelope);
 models.f=buildModel(materials.b);refitRoofMembers(models.f,experiment.envelope);const roofF=buildRoofEnvelope(materials.b,experiment.envelope);replaceRoofLayer(models.f,roofF);exterior=buildExterior(materials.b,experiment.exterior,experiment.envelope);plaqueMaterial=addPlaqueLettering(exterior,materials.b,experiment.exterior);replaceVisibleEnclosure(models.f,exterior);
 upperNode=buildUpperNode(materials.b);scene.add(models.e.root,models.f.root,upperNode.root);
 details={a:buildModel(materials.a,{detailOnly:true}),d:buildModel(materials.b,{detailOnly:true})};applyPairedReach(details.d);detail=details.a;scene.add(models.a.root,models.c.root,details.a.root,details.d.root);
 $('member').addEventListener('change',()=>{const r=choices.find(r=>r.id===$('member').value);$('selected').textContent=r?`${r.id} · ${r.status} · ${r.source} · ${r.note||'灰瓦局部，尺寸推定，无实物纹样'}`:'选择构件可查看证据';dirty=true;});
 let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
 const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
 const active=['node','upperNode'].includes(view)?detail:mode==='f'?models.f:mode==='e'?models.e:mode==='d'?models.c:models.a;const meshes=[...active.meshes,...(mode==='d'&&!['node','upperNode'].includes(view)?sample.root.children:[])];
 active.root.updateMatrixWorld(true);const hit=raycaster.intersectObjects(meshes,false).find(h=>h.object.parent.visible&&(view!=='section'||clipPlane.distanceToPoint(h.point)>=0));
 if(hit){const r=hit.object.userData.records[hit.instanceId??0];$('selected').textContent=`${r.id} · ${r.status} · ${r.source} · ${r.note||'构件加工及真实装饰待核定'}`;dirty=true;}
 });
  const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);dirty=true;}).observe(viewport);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('explode').addEventListener('change',()=>{for(const m of Object.values(models))m.layers.get('roof').position.y=$('explode').checked?2:0;for(const dm of Object.values(details))for(const mesh of dm.meshes)mesh.position.y=$('explode').checked?mesh.userData.tier*.50:0;for(const mesh of upperNode.meshes){const base=mesh.userData.baseMatrices,matrix=new T.Matrix4();mesh.userData.records.forEach((r,i)=>{matrix.fromArray(base,i*16);matrix.elements[13]+=$('explode').checked?r.tier*.50:0;mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}dirty=true;});
  $('light').addEventListener('change',()=>{sun.position.x=$('light').checked?40:-40;dirty=true;});
  viewport.addEventListener('keydown',e=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(['ArrowLeft','ArrowRight'].includes(e.key)){offset.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(offset);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(offset.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
  $('loading').hidden=true;
  const query=new URLSearchParams(location.search);const requestedView=query.get('view'),requestedMode=query.get('mode');
  setView(experiment.views[requestedView]?requestedView:'patch');setMode(experiment.modes.includes(requestedMode)?requestedMode:'a');
  renderer.setAnimationLoop(()=>{if(dirty){renderer.render(scene,camera);stats();dirty=false;}});
}
try{experiment=validateExperiment(await (await fetch('./experiment.json')).json());await document.fonts.ready;initialize();}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
