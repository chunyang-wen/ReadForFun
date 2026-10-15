import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three.module.js';import {buildModel,SPEC,getColumnGrid,ringPoints} from '../model.js';
const model=buildModel({wood:new THREE.MeshBasicMaterial()}),detail=buildModel({wood:new THREE.MeshBasicMaterial()},{detailOnly:true});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('nine distinct storeys, four hidden, low gallery independent',()=>{assert.equal(SPEC.levels.length,9);assert.equal(SPEC.levels.filter(l=>l.dark).length,4);assert.equal(new Set(SPEC.levels.map(l=>l.bottom)).size,9);assert.ok(SPEC.buttress.height<SPEC.levels[0].height);});
test('24 outer, eight inner unique columns; side centres follow source spacing',()=>{for(let k=0;k<9;k++){const g=getColumnGrid(k),l=SPEC.levels[k];assert.equal(g.outer.length,24);assert.equal(g.inner.length,8);assert.equal(new Set([...g.outer,...g.inner].map(p=>p.point.join(','))).size,32);near(V(g.outer[1].point).distanceTo(V(g.outer[2].point)),l.centralBottom);assert.equal(g.outer.filter(p=>p.corner).length,8);}});
const V=a=>new THREE.Vector3(...a);
test('diameter is across sides, not vertex circle; raw table retained',()=>{const r=ringPoints(23.69,4.47);near(r[22].point[2]+r[23].point[2],23.69);near(SPEC.levels[1].centralBottom,4.22);near(SPEC.levels[3].centralTop,3.84);});
test('every next column base lies on an explicit supporting ring beam',()=>{for(let k=0;k<8;k++){const l=SPEC.levels[k],next=SPEC.levels[k+1];near(l.base+l.height+l.bracket,next.base);const beams=model.records.filter(r=>r.supportsStorey===next.id);assert.equal(beams.length,32);const columns=model.records.filter(r=>r.storey===next.id&&['column','hidden'].includes(r.type));assert.equal(columns.length,32);for(const c of columns){const foot=c.endpoints[0];assert.ok(beams.some(b=>Math.hypot(b.endpoints[0][0]-foot[0],b.endpoints[0][2]-foot[2])<1e-6&&Math.abs(b.endpoints[0][1]+.18-foot[1])<1e-6));}}});
test('each hidden stage has radial and chord bracing anchored to bottom/top frame',()=>{for(const l of SPEC.levels.filter(l=>l.dark)){const b=model.records.filter(r=>r.type==='brace'&&r.storey===l.id);assert.equal(b.filter(r=>r.direction==='radial').length,16);assert.equal(b.filter(r=>r.direction==='chord').length,48);for(const r of b){near(r.endpoints[0][1],l.base+.10);near(r.endpoints[1][1],l.base+l.height-.15);}}});
test('special five-dou arms limited to second main outer side columns',()=>{const arms=model.records.filter(r=>r.type==='five');assert.equal(arms.length,16);assert.ok(arms.every(r=>r.storey==='M2'&&r.assembly.includes('outer')));const dou=model.records.filter(r=>Number.isInteger(r.fiveIndex));assert.equal(dou.length,16*5*5);});
test('separate insertion and shifted landing, receiving opening admits tongue',()=>{const inserts=detail.records.filter(r=>r.type==='insert');assert.equal(inserts.length,2);const tongue=inserts.find(r=>!r.endpoints);near(tongue.scale[0],.22);near(tongue.scale[2],.22);const beams=detail.records.filter(r=>r.type==='beam'&&r.assembly==='insert');const spans=beams.map(r=>[r.position[2]-r.scale[2]/2,r.position[2]+r.scale[2]/2]);near(spans[0][1],-.13);near(spans[1][0],.13);assert.ok(tongue.position[1]-tongue.scale[1]/2<2.18);const landing=detail.records.find(r=>r.type==='landing');near(landing.endpoints[0][1],2.18);assert.ok(landing.endpoints[0][2]<-.5);assert.ok(!detail.records.some(r=>r.type==='fork'));});
test('five roof skirts leave centre empty; sixth roof converges, top frame stays under roof',()=>{const roofs=model.records.filter(r=>r.type==='roof'&&r.layer==='roof'&&r.scale.every(v=>v===1));assert.equal(new Set(roofs.map(r=>r.storey)).size,6);for(const mesh of model.meshes.filter(m=>m.userData.layer==='roof')){const pos=mesh.geometry.attributes.position;if(!pos)continue;if(mesh.userData.records[0].storey==='M5')continue;if(mesh.geometry.index?.count===6){for(let i=0;i<pos.count;i++)assert.ok(Math.hypot(pos.getX(i),pos.getZ(i))>9);}}
for(const r of model.records.filter(r=>r.type==='frame'&&r.storey==='M5'))for(const p of r.endpoints||[]){const ap=Math.max(...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return p[0]*Math.sin(a)+p[2]*Math.cos(a);}));const t=Math.max(0,Math.min(1,(12.05-ap)/(12.05-.35))),roof=46.868+(SPEC.roofTop-46.868)*Math.pow(t,1.35);assert.ok(p[1]<=roof-.25,`${r.id} penetrates roof`);}});
test('all records, transforms and bounds finite with stable ids and source',()=>{for(const m of [model,detail]){assert.equal(new Set(m.records.map(r=>r.id)).size,m.records.length);for(const r of m.records){assert.ok(r.position.every(Number.isFinite));assert.ok(r.scale.every(v=>Number.isFinite(v)&&v>0));assert.ok(r.orientation.every(Number.isFinite));assert.ok(r.source&&r.status);}const matrix=new THREE.Matrix4();for(const mesh of m.meshes){for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));}assert.ok(mesh.boundingBox.min.toArray().every(Number.isFinite));}}});

// Promote only the validated orientation change; keep the study control reproducible.
test('formal facade alignment equals the study rotation and preserves every unrelated member',async()=>{
 const {alignFaceBrackets}=await import('../study/adapter.js');
 const legacy=buildModel({wood:new THREE.MeshBasicMaterial()},{alignOuterBrackets:false});
 const untouched=new Map(legacy.records.map(r=>[r.id,JSON.stringify(r)]));
 const changed=new Set(alignFaceBrackets(legacy));
 assert.equal(new Set(legacy.records.filter(r=>changed.has(r.id)).map(r=>r.assembly)).size,160);
 assert.deepEqual(model.records.map(r=>r.id),legacy.records.map(r=>r.id));
 for(let i=0;i<model.records.length;i++){
  const a=model.records[i],b=legacy.records[i];
  if(!changed.has(a.id)){assert.equal(JSON.stringify(a),untouched.get(a.id));continue;}
  for(const key of ['position','scale'])a[key].forEach((v,j)=>near(v,b[key][j]));
  near(Math.abs(new THREE.Quaternion(...a.orientation).dot(new THREE.Quaternion(...b.orientation))),1);
  if(a.endpoints)a.endpoints.forEach((p,k)=>p.forEach((v,j)=>near(v,b.endpoints[k][j])));
 }
 const matrix=new THREE.Matrix4();
 for(const mesh of model.meshes)mesh.userData.records.forEach((r,i)=>{
  mesh.getMatrixAt(i,matrix);const expected=new THREE.Matrix4().compose(V(r.position),new THREE.Quaternion(...r.orientation),V(r.scale));
  matrix.elements.forEach((v,j)=>assert.ok(Math.abs(v-expected.elements[j])<1e-5));
 });
});
