import * as T from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {createBaselineMaterials} from './materials.js';
import {createRoofSample,replaceSampleRibs,SAMPLE} from './roof-sample.js';

const $=id=>document.getElementById(id),viewport=$('viewport');
const labels={a:'A · 原有模型',b:'B · 材料与光照',c:'C · 增加瓦片搭接'};
const descriptions={a:'原卷的几何与材质：连续圆条瓦垄，绝大多数表面粗糙度为 0.92。相机在 A/B/C 间保持不变。',b:'几何与 A 完全相同。区分釉面、朱漆、贴金与石材，降低均匀补光，增加天空反射。只能改善材料感，不能补出真实构件。',c:'沿用 B 的材质与光照，仅替换南面中央瓦口样片。搭接、瓦当轮廓与少量逐瓦色差为试验性表达，尚未按实测参数校准。'};
let renderer,scene,camera,controls,models,materials,environment,sun,fill,sky,sample,mode='a',view='patch',removed=0,dirty=true,lastStats='';

function makeMaterials(){
  const m=createBaselineMaterials();
  for(const key of ['tile','ridge']){
    const old=m[key];m[key]=new T.MeshPhysicalMaterial({color:0xb98a38,roughness:.43,metalness:0,clearcoat:.32,clearcoatRoughness:.24,side:old.side});old.dispose();
  }
  for(const key of ['column','door','plaster']){m[key].roughness=key==='plaster'?.94:.57;m[key].color.set(key==='plaster'?0x914733:0x913a29);}
  m.gold.roughness=.4;m.gold.metalness=.82;
  for(const key of ['blue','green','paint','gildedPaint'])m[key].roughness=.65;
  m.stone.roughness=m.lightstone.roughness=.93;
  return m;
}
function skyEnvironment(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#7a9db7');gradient.addColorStop(.48,'#e2e7e3');gradient.addColorStop(.55,'#c1bca6');gradient.addColorStop(1,'#6b6455');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(t);pmrem.dispose();t.dispose();return target;
}
function setMode(next){
  mode=next;models.a.root.visible=mode!=='c';models.c.root.visible=mode==='c';
  const active=mode==='c'?models.c:models.a,mat=materials[mode==='a'?'a':'b'];
  for(const mesh of active.meshes)mesh.material=mat[mesh.userData.materialKey]||mat.wood;
  scene.environment=mode==='a'?null:environment.texture;scene.environmentIntensity=.65;
  sky.intensity=mode==='a'?2.8:.8;sun.intensity=mode==='a'?3.5:3.0;fill.intensity=mode==='a'?1.15:.18;
  renderer.toneMappingExposure=mode==='a'?1.12:1.02;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-label').textContent=labels[mode];$('description').textContent=descriptions[mode];dirty=true;
}
function setView(next){
  view=next;
  const views={patch:{target:[0,15.1,14.5],position:[0,18,26]},oblique:{target:[0,15.1,14.5],position:[8,18,25]},whole:{target:[0,12.5,0],position:[0,20,120]}};
  const v=views[next];controls.target.fromArray(v.target);
  const offset=new T.Vector3().fromArray(v.position).sub(controls.target).multiplyScalar(Math.max(1,1.5/camera.aspect));
  camera.position.copy(controls.target).add(offset);controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));dirty=true;
}
function stats(){
  const data={mode,view,roofLift:$('explode').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),sampleRecords:sample.records.length,removedRibSegments:removed,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,patch:SAMPLE};
  const value=JSON.stringify(data,null,2);if(value!==lastStats){$('stats').textContent=value;lastStats=value;}
}
function initialize(){
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  viewport.append(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(35,1,.1,500);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=3;controls.maxDistance=200;controls.addEventListener('change',()=>dirty=true);
  sky=new T.HemisphereLight(0xfff9ea,0x6b705f,2.8);scene.add(sky);
  sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-40,65,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-50,near:.5,far:200});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;scene.add(sun);
  fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
  environment=skyEnvironment();materials={a:createBaselineMaterials(),b:makeMaterials()};
  models={a:buildModel(materials.a),c:buildModel(materials.b)};removed=replaceSampleRibs(models.c);sample=createRoofSample(materials.b.tile);models.c.layers.get('roof').add(sample.root);
  scene.add(models.a.root,models.c.root);
  const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({color:0x463f2e,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
  new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);dirty=true;}).observe(viewport);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('explode').addEventListener('change',()=>{for(const m of Object.values(models))m.layers.get('roof').position.y=$('explode').checked?2:0;dirty=true;});
  $('light').addEventListener('change',()=>{sun.position.x=$('light').checked?40:-40;dirty=true;});
  viewport.addEventListener('keydown',e=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(['ArrowLeft','ArrowRight'].includes(e.key)){offset.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(offset);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(offset.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
  $('loading').hidden=true;setView('patch');setMode('a');
  renderer.setAnimationLoop(()=>{if(dirty){renderer.render(scene,camera);stats();dirty=false;}});
}
try{initialize();}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
