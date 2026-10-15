import * as T from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {createBaselineMaterials} from './materials.js';
import {createRoofSample,replaceSampleRibs} from './roof-sample.js';
import {buildRoofSystem,hideOriginalRoofRibs,splitEaveRafters} from './roof-system.js';
import {validateExperiment} from '../../realism-workflow/manifest.js';
let experiment;

const $=id=>document.getElementById(id),viewport=$('viewport');
const labels={a:'A · 原有模型',b:'B · 材料与光照',c:'C · 增加瓦片搭接',d:'D · 槽形底瓦与滴水',e:'E · 连续四坡瓦作',f:'F · 檐口承托与材料'};
const descriptions={e:'把局部瓦作扩展到上屋四坡和下檐环带；按太庙自己的屋面函数逐面排瓦，移除旧连续瓦垄。整体曲线仍待测绘校准。',f:'连续瓦作加檐口封檐板、椽尾和椽头，并按实景调整檐下材料明暗。几何截面与釉色仍为推定；未虚构九龙或满文。',a:'原卷的几何与材质：连续圆条瓦垄，绝大多数表面粗糙度为 0.92。相机在 A/B/C 间保持不变。',b:'几何与 A 完全相同。区分釉面、朱漆、贴金与石材，降低均匀补光，增加天空反射。只能改善材料感，不能补出真实构件。',c:'沿用 B 的材质与光照，仅替换南面中央瓦口样片。搭接、瓦当轮廓与少量逐瓦色差为试验性表达，尚未按实测参数校准。',d:'沿用 C 的材料与光照，仅改槽形底瓦并补滴水轮廓。尺寸为比例推定；瓦当纹样、满汉匾额和彩画未复原。'};
let renderer,scene,camera,controls,models,materials,environment,sun,fill,sky,sample,refinedSample,mode='a',view='patch',removed=0,dirty=true,lastStats='',continuous,finished,replacedEaves=[],picked=null,pickBox;

function makeMaterials(){
  const m=createBaselineMaterials();
  for(const key of ['tile','ridge']){
    const old=m[key];m[key]=new T.MeshPhysicalMaterial({color:0xc39742,roughness:.48,metalness:0,clearcoat:.25,clearcoatRoughness:.24,side:old.side});old.dispose();
  }
  for(const key of ['column','door','plaster']){m[key].roughness=key==='plaster'?.94:.57;m[key].color.set(key==='plaster'?0x914733:0x913a29);}
  m.gold.roughness=.4;m.gold.metalness=.82;
  for(const key of ['blue','green','paint','gildedPaint'])m[key].roughness=.65;
  m.stone.roughness=m.lightstone.roughness=.93;
  return m;
}
function finishMaterials(){
 const m=makeMaterials(),p=experiment.finishMaterials;m.tile.color.set(p.tileColor);m.tile.roughness=p.tileRoughness;m.tile.clearcoat=p.clearcoat;m.wood.color.set(p.woodColor);m.rafter.color.set(p.rafterColor);m.gold.color.set(p.goldColor);m.gold.roughness=p.goldRoughness;
 m.eaveRed=new T.MeshStandardMaterial({color:p.eaveRed,roughness:.66});m.endWhite=new T.MeshStandardMaterial({color:p.endWhite,roughness:.82});m.bracketPaint=new T.MeshStandardMaterial({color:p.bracketPaint,roughness:.73});return m;
}
function skyEnvironment(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#7a9db7');gradient.addColorStop(.48,'#e2e7e3');gradient.addColorStop(.55,'#c1bca6');gradient.addColorStop(1,'#6b6455');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(t);pmrem.dispose();t.dispose();return target;
}
function setMode(next){
  picked=null;if(pickBox)pickBox.visible=false;$('selection').textContent='单击瓦片、椽尾或木件，查看编号与证据。';
  mode=next;const enhanced=['c','d'].includes(mode),full=['e','f'].includes(mode);
  models.a.root.visible=!enhanced&&!full;models.c.root.visible=enhanced;models.e.root.visible=full;
  sample.root.visible=mode==='c';refinedSample.root.visible=mode==='d';continuous.root.visible=mode==='e';finished.root.visible=finished.timberRoot.visible=mode==='f';
  replacedEaves.forEach(mesh=>mesh.visible=mode!=='f');
  sun.shadow.normalBias=mode==='f'?experiment.finishMaterials.shadowNormalBias:.025;sun.shadow.bias=mode==='f'?experiment.finishMaterials.shadowBias:-.00008;
  const active=full?models.e:enhanced?models.c:models.a,mat=materials[mode==='a'?'a':mode==='f'?'f':'b'];
  for(const mesh of active.meshes){const paint=mode==='f'&&['upper','lower'].includes(mesh.userData.layer)&&mesh.userData.materialKey==='wood';mesh.material=paint?mat.bracketPaint:mat[mesh.userData.materialKey]||mat.wood;}
  scene.environment=mode==='a'?null:environment.texture;scene.environmentIntensity=.65;
  sky.intensity=mode==='a'?2.8:.8;sun.intensity=mode==='a'?3.5:3.0;fill.intensity=mode==='a'?1.15:.18;
  renderer.toneMappingExposure=mode==='a'?1.12:1.02;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-label').textContent=labels[mode];$('description').textContent=descriptions[mode];dirty=true;
}
function setView(next){
  view=next;
  const views=experiment.views;
  const v=views[next];controls.target.fromArray(v.target);
  const offset=new T.Vector3().fromArray(v.position).sub(controls.target).multiplyScalar(Math.max(1,1.5/camera.aspect));
  camera.position.copy(controls.target).add(offset);controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));dirty=true;
}
function stats(){
  let selection=null;if(picked){const matrix=new T.Matrix4();picked.mesh.getMatrixAt(picked.index,matrix);const position=new T.Vector3().setFromMatrixPosition(matrix).applyMatrix4(picked.mesh.matrixWorld);selection={id:picked.record.id,layer:picked.record.layer,kind:picked.record.kind||picked.record.type,world:position.toArray(),status:picked.record.status,source:picked.record.source};}
  const data={roofSystem:experiment.roofSystem,finishMaterials:experiment.finishMaterials,selection,layout:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},architecture:experiment.id,revision:experiment.revision,mode,view,roofLift:$('explode').checked,section:$('section').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),sampleRecords:(mode==='d'?refinedSample:sample).records.length,sampleWorldY:refinedSample.root.getWorldPosition(new T.Vector3()).y,replacedEaveSegments:replacedEaves.reduce((n,m)=>n+m.count,0),continuousRecords:continuous.records.length,finishedRecords:finished.records.length,timberWorldY:finished.timberRoot.getWorldPosition(new T.Vector3()).y,continuousWorldY:finished.root.getWorldPosition(new T.Vector3()).y,removedRibSegments:removed,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,fov:camera.fov,pixelRatio:renderer.getPixelRatio(),canvasSize:renderer.getSize(new T.Vector2()).toArray(),lightPosition:sun.position.toArray(),patch:experiment.patch};
  const value=JSON.stringify(data,null,2);if(value!==lastStats){$('stats').textContent=value;lastStats=value;}
}
function initialize(){
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,experiment.capture.pixelRatioMax));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.localClippingEnabled=true;
  viewport.append(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(experiment.capture.cameraFov,1,.1,500);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=200;controls.addEventListener('change',()=>dirty=true);
  sky=new T.HemisphereLight(0xfff9ea,0x6b705f,2.8);scene.add(sky);
  sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-40,65,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-50,near:.5,far:200});sun.shadow.normalBias=.065;sun.shadow.bias=-.00012;scene.add(sun);
  fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
  environment=skyEnvironment();materials={a:createBaselineMaterials(),b:makeMaterials(),f:finishMaterials()};
  models={a:buildModel(materials.a),c:buildModel(materials.b),e:buildModel(materials.b)};removed=replaceSampleRibs(models.c,experiment.patch);sample=createRoofSample(materials.b.tile,{parameters:experiment.patch});refinedSample=createRoofSample(materials.b.tile,{parameters:experiment.patch,refined:true});models.c.layers.get('roof').add(sample.root,refinedSample.root);
  hideOriginalRoofRibs(models.e);replacedEaves=splitEaveRafters(models.e);
  continuous=buildRoofSystem(materials.b,{parameters:experiment.roofSystem});finished=buildRoofSystem(materials.f,{parameters:experiment.roofSystem,withEaves:true});
  models.e.layers.get('roof').add(continuous.root,finished.root);models.e.layers.get('purlins').add(finished.timberRoot);
  scene.add(models.a.root,models.c.root,models.e.root);
  const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);dirty=true;}).observe(viewport);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('explode').addEventListener('change',()=>{for(const m of Object.values(models))m.layers.get('roof').position.y=$('explode').checked?2:0;dirty=true;});
  $('section').addEventListener('change',()=>{const planes=$('section').checked?[new T.Plane(new T.Vector3(-1,0,0),0)]:[];for(const set of Object.values(materials))for(const m of Object.values(set)){m.clippingPlanes=planes;m.clipShadows=true;m.needsUpdate=true;}dirty=true;});
  $('light').addEventListener('change',()=>{sun.position.x=$('light').checked?40:-40;dirty=true;});
  viewport.addEventListener('keydown',e=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(['ArrowLeft','ArrowRight'].includes(e.key)){offset.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(offset);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(offset.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
  pickBox=new T.Box3Helper(new T.Box3(),0xa13621);pickBox.visible=false;scene.add(pickBox);
  let pointerStart=null;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',e=>{
   if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;
   const rect=renderer.domElement.getBoundingClientRect(),point=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new T.Raycaster();ray.setFromCamera(point,camera);const candidates=[];
   for(const model of Object.values(models))if(model.root.visible)model.root.traverseVisible(o=>{if(o.isInstancedMesh&&o.userData.records)candidates.push(o);});
   const hit=ray.intersectObjects(candidates,false).find(h=>!$('section').checked||h.point.x<=0);
   if(hit){const record=hit.object.userData.records[hit.instanceId];picked={mesh:hit.object,index:hit.instanceId,record};$('selection').textContent=`${record.id} · ${record.kind||record.type} · ${record.status} · ${record.source}`;}else{picked=null;$('selection').textContent='未选中构件。';}dirty=true;
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
  $('loading').hidden=true;
  const query=new URLSearchParams(location.search);const requestedView=query.get('view'),requestedMode=query.get('mode');
  setView(experiment.views[requestedView]?requestedView:'patch');setMode(experiment.modes.includes(requestedMode)?requestedMode:'f');
  renderer.setAnimationLoop(()=>{if(dirty){scene.updateMatrixWorld(true);if(picked){const matrix=new T.Matrix4();picked.mesh.getMatrixAt(picked.index,matrix);matrix.premultiply(picked.mesh.matrixWorld);if(!picked.mesh.geometry.boundingBox)picked.mesh.geometry.computeBoundingBox();pickBox.box.copy(picked.mesh.geometry.boundingBox).applyMatrix4(matrix);pickBox.visible=true;}renderer.render(scene,camera);stats();dirty=false;}});
}
try{experiment=validateExperiment(await (await fetch('./experiment.json')).json());await document.fonts.ready;initialize();}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
