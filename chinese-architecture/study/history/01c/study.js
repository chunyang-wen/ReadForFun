import * as T from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {createBaselineMaterials,createStudyMaterials} from './materials.js';
import {createRoofSample,replaceSampleRibs} from './roof-sample.js';
import {validateExperiment} from '../realism-workflow/manifest.js';
let experiment;

const $=id=>document.getElementById(id),viewport=$('viewport');
const labels={a:'A · 原有模型',b:'B · 仅材料',c:'C · 灰瓦几何',d:'D · 檐下光照'};
const descriptions={a:'基线：原卷几何、材料与照明；实验页统一背景和固定机位。',b:'只改变材料：灰瓦近中性、无釉高粗糙度；木构降低统一金黄感。尺寸与色彩均未实测。',c:'只改变西前檐中央局部瓦片几何：独立筒瓦、槽形板瓦与素面瓦当，关闭逐瓦色差。不添加无据的宫殿滴水。',d:'只改变照明：降低半球与背面补光，使檐下遮挡可读。几何材料同C；不是照片现场的光度复原。'};
let renderer,scene,camera,controls,models,materials,sun,fill,sky,sample,selected=null,mode='a',view='patch',removed=0,dirty=true,lastStats='';

function setMode(next){
  mode=next;const enhanced=['c','d'].includes(mode);models.a.root.visible=!enhanced;models.c.root.visible=enhanced;sample.root.visible=enhanced;selected=null;$('selection').textContent='点选模型构件，或选择“定位瓦当”。';
  const active=enhanced?models.c:models.a,mat=materials[mode==='a'?'a':'b'];
  for(const mesh of active.meshes)mesh.material=mat[mesh.userData.materialKey]||mat.wood;
  scene.environment=null;
  const lighting=experiment.lighting[mode==='d'?'d':'baseline'];
  sky.intensity=lighting.hemisphere;sun.intensity=lighting.sun;fill.intensity=lighting.fill;
  renderer.toneMappingExposure=lighting.exposure;
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
  const data={architecture:experiment.id,revision:experiment.revision,mode,view,roofLift:$('explode').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),sampleRecords:sample.records.length,selected:selected?.id||null,selectionLayer:selected?.layer||null,roofWorldY:models.c.layers.get('roof').position.y,anchorWorldY:models.c.layers.get('columns').position.y,removedRibSegments:removed,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,fov:camera.fov,pixelRatio:renderer.getPixelRatio(),canvasSize:renderer.getSize(new T.Vector2()).toArray(),lightPosition:sun.position.toArray(),patch:experiment.patch};
  const value=JSON.stringify(data,null,2);if(value!==lastStats){$('stats').textContent=value;lastStats=value;}
}
function initialize(){
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,experiment.capture.pixelRatioMax));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  viewport.append(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(experiment.capture.cameraFov,1,.1,500);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=200;controls.addEventListener('change',()=>dirty=true);
  sky=new T.HemisphereLight(0xfff9ea,0x6b705f,2.8);scene.add(sky);
  sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-22,43,29);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-50,near:.5,far:200});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;scene.add(sun);
  fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
  materials={a:createBaselineMaterials(),b:createStudyMaterials(experiment.materials)};
  models={a:buildModel(materials.a),c:buildModel(materials.b)};removed=replaceSampleRibs(models.c,experiment.patch);sample=createRoofSample(materials.b.tile,{parameters:experiment.patch});models.c.layers.get('roof').add(sample.root);
  scene.add(models.a.root,models.c.root);
  const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);dirty=true;}).observe(viewport);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('explode').addEventListener('change',()=>{for(const m of Object.values(models))m.layers.get('roof').position.y=$('explode').checked?2:0;dirty=true;});
  $('light').addEventListener('change',()=>{sun.position.x=$('light').checked?22:-22;dirty=true;});
  viewport.addEventListener('keydown',e=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(['ArrowLeft','ArrowRight'].includes(e.key)){offset.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(offset);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(offset.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
  const showRecord=r=>{selected={...r,layer:r.layer||'roof'};$('selection').textContent=`${selected.id} · ${selected.kind||selected.type} · ${selected.layer} · ${selected.status||selected.approximation||'原卷研究模型；位置/隐蔽节点待核定'}`;dirty=true;};
  $('pick-sample').addEventListener('click',()=>{if(!['c','d'].includes(mode))setMode('c');showRecord(sample.records.find(r=>r.kind==='eave-disk'&&r.id.endsWith('/0/0')));});
  renderer.domElement.addEventListener('click',e=>{
    const r=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
    const active=['c','d'].includes(mode)?models.c:models.a;
    const meshes=[...active.meshes,...(['c','d'].includes(mode)?sample.root.children:[])];
    const hit=ray.intersectObjects(meshes,false)[0];if(hit)showRecord(hit.object.userData.records[hit.instanceId]);
  });
  $('loading').hidden=true;
  const query=new URLSearchParams(location.search);const requestedView=query.get('view'),requestedMode=query.get('mode');
  setView(experiment.views[requestedView]?requestedView:'patch');setMode(experiment.modes.includes(requestedMode)?requestedMode:'a');
  renderer.setAnimationLoop(()=>{if(dirty){renderer.render(scene,camera);stats();dirty=false;}});
}
try{experiment=validateExperiment(await (await fetch('./experiment.json')).json());await document.fonts.ready;initialize();}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
