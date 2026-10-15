import * as T from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {buildModel} from '../model.js';
import {createMaterials} from './materials.js';
import {refineModel} from './adapter.js';
import {validateExperiment} from '../../realism-workflow/manifest.js';
const $=id=>document.getElementById(id),viewport=$('viewport');
const experiment=validateExperiment(await(await fetch('experiment.json')).json());
let mode='a',view='patch',dirty=true,renderer,scene,camera,controls,sun,models,detail,materials,enhanced,selected='',box;
const plane=new T.Plane(new T.Vector3(-1,0,0),0),ray=new T.Raycaster();
const descriptions={a:'A：原卷几何与原卷材料。实验页统一相机、背景和原卷照明；照片机位未配准。',b:'B：只改变材料的大类色调与粗糙度，几何、光照、相机与 A 相同。程序木纹沿用基线，未复原逐件风化或彩画。',c:'C：局部几何试件，含固定微小逐瓦色差。平柱铺作对齐各面法向，回廊八面中央加入分段筒瓦、槽形底瓦与无纹瓦当/通用滴水。两项几何同时改变，不分别归因。',d:'D：C 的几何加 B 的材料。灰瓦、露木与残留朱色仅作类别近似。转角铺作互锁、翼角、栏杆与围护仍未精确复原。'};
const active=()=>view==='node'?detail:models[['c','d'].includes(mode)?'c':'a'];
function eachMesh(m,fn){m.root.traverse(o=>{if(o.isInstancedMesh)fn(o);});}
function update(){
 const chosen=active(),mats=materials[['b','d'].includes(mode)?'b':'a'];
 models.a.root.visible=chosen===models.a;models.c.root.visible=chosen===models.c;detail.root.visible=chosen===detail;
 for(const model of [models.a,models.c,detail]){
  model.layers.get('roof').position.y=$('explode').checked?2:0;
  eachMesh(model,mesh=>{
   mesh.material=mats[mesh.userData.materialKey]||mats.wood;
   const s=mesh.userData.storey,layer=mesh.userData.layer;
   mesh.visible=view==='node'||($('storey').value==='all'||s===$('storey').value);
   if(view==='boundary')mesh.visible=mesh.visible&&(['D2','M2'].includes(s)||s==='M1'&&['ming','brackets'].includes(layer))&&!['roof','enclosure','ceiling'].includes(layer);
  });
 }
 for(const set of Object.values(materials))for(const mat of Object.values(set)){mat.clippingPlanes=$('section').checked?[plane]:[];mat.clipShadows=true;}
 sun.position.x=$('light').checked?40:-40;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 $('mode-label').textContent={a:'A · 原卷基线',b:'B · 仅材料',c:'C · 局部试件',d:'D · 几何与材料'}[mode];$('description').textContent=descriptions[mode];
 $('storey').disabled=view==='node';refreshMembers();selected='';$('selection').textContent='选择构件查看稳定编号、证据和所属层位。';box.visible=false;dirty=true;
}
function setView(next){view=next;const v=experiment.views[next];controls.target.fromArray(v.target);const offset=new T.Vector3(...v.position).sub(controls.target).multiplyScalar(Math.max(1,1.5/camera.aspect));camera.position.copy(controls.target).add(offset);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));if(models)update();dirty=true;}
function candidates(){const out=[];eachMesh(active(),m=>{if(m.visible)m.userData.records.forEach((r,index)=>out.push({r,m,index}));});return out;}
function refreshMembers(){const all=candidates(),list=[];for(const type of ['cover-tile','pan-tile','eave-disk','drip-edge','five','corner','hidden','brace','column','insert','landing','beam']){const found=all.find(x=>(x.r.kind||x.r.type)===type);if(found)list.push(found);} $('member').replaceChildren(new Option('点选或选择代表构件',''),...list.map(x=>new Option((x.r.kind||x.r.type)+' · '+(x.r.storey||x.r.assembly||''),x.r.id)));}
function select(entry){if(!entry)return;const {r,m,index}=entry;selected=r.id;$('selection').textContent=`${r.kind||r.type} · ${r.id} ｜ 所属 ${r.layer} / ${r.storey||r.assembly||'局部'} ｜ ${r.study?.status||r.status} ｜ ${r.source} ｜ ${r.note||'规整化关系，非逐件实测'}`;m.geometry.computeBoundingBox();const matrix=new T.Matrix4();m.getMatrixAt(index,matrix);m.updateWorldMatrix(true,false);box.box.copy(m.geometry.boundingBox).applyMatrix4(matrix).applyMatrix4(m.matrixWorld);box.visible=true;dirty=true;}
function stats(){const a=active(),sample=enhanced.samples[7].root;sample.updateWorldMatrix(true,false);return {architecture:experiment.id,revision:experiment.revision,mode,view,roofLift:$('explode').checked,alternateLight:$('light').checked,camera:camera.position.toArray(),target:controls.target.toArray(),patch:experiment.patch,fov:camera.fov,canvasSize:renderer.getSize(new T.Vector2()).toArray(),selected,section:$('section').checked,storey:$('storey').value,visibleStoreys:[...new Set(candidates().map(x=>x.r.storey).filter(Boolean))],sampleLift:sample.getWorldPosition(new T.Vector3()).y,alignedBrackets:enhanced.aligned.length,removedRibs:enhanced.removed.length,sampleRecords:enhanced.records.length,drawCalls:renderer.info.render.calls};}
try{
 renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,experiment.capture.pixelRatioMax));renderer.setClearColor(0xe1dfd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.localClippingEnabled=true;viewport.append(renderer.domElement);
 scene=new T.Scene();camera=new T.PerspectiveCamera(experiment.capture.cameraFov,1,.05,1200);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=2;controls.maxDistance=600;controls.addEventListener('change',()=>dirty=true);
 scene.add(new T.HemisphereLight(0xfff9ea,0x6b705f,2.8));sun=new T.DirectionalLight(0xfff1d7,3.5);sun.position.set(-40,90,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-33,right:33,top:65,bottom:-65,near:.5,far:240});sun.shadow.normalBias=.04;sun.shadow.bias=-.00008;scene.add(sun);
 const fill=new T.DirectionalLight(0xe5eddf,1.15);fill.position.set(26,14,-30);scene.add(fill);
 materials={a:createMaterials(),b:createMaterials(true)};models={a:buildModel(materials.a),c:buildModel(materials.a)};detail=buildModel(materials.a,{detailOnly:true});enhanced=refineModel(models.c,materials.a,experiment.patch);scene.add(models.a.root,models.c.root,detail.root);
 box=new T.Box3Helper(new T.Box3(),0x9e4538);box.material.depthTest=false;box.renderOrder=100;box.visible=false;scene.add(box);
 const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({opacity:.18,color:0x463f2e}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
 new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();setView(view);}).observe(viewport);
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;update();}));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
 for(const id of ['light','explode','section','storey'])$(id).addEventListener('change',update);
 $('member').addEventListener('change',()=>select(candidates().find(x=>x.r.id===$('member').value)));
 let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const meshes=[];eachMesh(active(),m=>{if(m.visible)meshes.push(m);});const hits=ray.intersectObjects(meshes,false);const hit=hits.find(h=>!$('section').checked||plane.distanceToPoint(h.point)>=0);if(hit)select({m:hit.object,index:hit.instanceId,r:hit.object.userData.records[hit.instanceId]});});
 viewport.addEventListener('keydown',e=>{const off=camera.position.clone().sub(controls.target);if(e.key==='0')setView(view);else if(['ArrowLeft','ArrowRight'].includes(e.key)){off.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?.12:-.12);camera.position.copy(controls.target).add(off);}else if(['+','=','-'].includes(e.key))camera.position.copy(controls.target).add(off.multiplyScalar(e.key==='-'?1.1:.9));else return;e.preventDefault();controls.update();dirty=true;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
 const query=new URLSearchParams(location.search);mode=experiment.modes.includes(query.get('mode'))?query.get('mode'):'a';setView(experiment.views[query.get('view')]?query.get('view'):'patch');$('loading').hidden=true;
 renderer.setAnimationLoop(()=>{if(!dirty)return;renderer.render(scene,camera);$('stats').textContent=JSON.stringify(stats(),null,2);dirty=false;});
}catch(e){console.error(e);$('loading').hidden=true;$('error').hidden=false;}
