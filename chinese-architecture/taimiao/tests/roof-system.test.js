import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';import {buildModel,SPEC,upperHeight} from '../model.js';
import {buildRoofSystem,facePoint,hideOriginalRoofRibs,splitEaveRafters,ROOF_PARAMETERS,upperSurface,lowerSurface} from '../study/roof-system.js';
const material=new T.MeshStandardMaterial(),system=buildRoofSystem({tile:material},{withEaves:true});
test('Four upper faces and four hollow lower faces retain unique IDs and coherent directions',()=>{
 assert.equal(new Set(system.records.map(r=>r.id)).size,system.records.length);
 for(const tier of ['upper','lower'])for(const face of ['front','hip'])for(const sign of [-1,1]){
  const records=system.records.filter(r=>r.tier===tier&&r.face===face&&r.sign===sign&&r.kind==='cover');assert.ok(records.length>100);
  for(const r of records){const z=new T.Vector3(0,0,1).applyQuaternion(new T.Quaternion(...r.orientation));assert.ok((face==='front'?z.z:z.x)*sign>0);const y=new T.Vector3(0,1,0).applyQuaternion(new T.Quaternion(...r.orientation));assert.ok(y.y>0);if(tier==='lower')assert.ok(Math.abs(r.position[0])>=27.9||Math.abs(r.position[2])>=11);}
 }
});
test('Every transformed vertex is finite and stays inside the declared building envelope',()=>{
 const matrix=new T.Matrix4();for(const group of [system.root,system.timberRoot])for(const mesh of group.children){const a=mesh.geometry.attributes.position;for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);for(let j=0;j<a.count;j++){const p=new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(matrix);assert.ok(p.toArray().every(Number.isFinite));assert.ok(Math.abs(p.x)<37&&Math.abs(p.z)<18.5&&p.y>11&&p.y<30);}}}
});
test('Rafters bear within the finite purlin rings and stay beneath the curved roof along their full length',()=>{
 const groups=new Map();for(const r of system.records.filter(r=>r.kind==='rafter')){
  const q=new T.Quaternion(...r.orientation),half=new T.Vector3(0,r.scale[1]/2,0).applyQuaternion(q),c=new T.Vector3(...r.position),a=c.clone().sub(half),b=c.clone().add(half);
  for(let i=0;i<=20;i++){const p=a.clone().lerp(b,i/20),roof=(r.tier==='upper'?upperSurface:lowerSurface)(p.x,p.z);assert.ok(p.y+.065<=roof+1e-8,'Rafter penetrates covering: '+r.id);}
  if(r.row===0){const limit=r.tier==='upper'?(r.face==='front'?31.6:13.1):(r.face==='front'?32:14);assert.ok(Math.abs(r.face==='front'?a.x:a.z)<=limit+1e-8);
   if(r.tier==='upper'){assert.ok(Math.abs((r.face==='front'?Math.abs(a.z):Math.abs(a.x)-SPEC.ridgeHalf)-13.1)<1e-9);assert.ok(Math.abs((a.y-.065)-(upperHeight(13.1)-.25))<.006);}
   else{assert.ok(Math.abs((r.face==='front'?Math.abs(a.z):Math.abs(a.x))-(r.face==='front'?14:32))<1e-9);assert.ok(Math.abs((a.y-.065)-13)<.006);}
  }
  const key=[r.tier,r.face,r.sign,r.col].join('/');if(!groups.has(key))groups.set(key,[]);groups.get(key).push({r,a,b});
 }
 for(const parts of groups.values()){assert.equal(parts.length,2);parts.sort((a,b)=>a.r.row-b.r.row);assert.ok(parts[0].b.distanceTo(parts[1].a)<1e-8);}
});
test('Old roof ribs can be hidden without touching the structural frame or source records',()=>{
 const m=buildModel({wood:material}),before=JSON.stringify(m.records),columns=m.meshes.filter(mesh=>mesh.userData.layer==='columns');assert.ok(hideOriginalRoofRibs(m)>1000);assert.equal(JSON.stringify(m.records),before);assert.ok(columns.every(mesh=>mesh.visible));
 for(const mesh of m.meshes.filter(mesh=>!mesh.visible))assert.ok(mesh.userData.records.every(r=>r.key.startsWith('rib/')||r.key.startsWith('lower/rib/')));
});
test('Replacing eave timber preserves every original matrix and the 68 column records',()=>{
 const m=buildModel({wood:material}),map=new Map(),matrix=new T.Matrix4();for(const mesh of m.meshes)mesh.userData.records.forEach((r,i)=>{mesh.getMatrixAt(i,matrix);map.set(r.id,matrix.toArray());});const old=splitEaveRafters(m);assert.ok(old.length>0);
 const ids=new Set();for(const mesh of m.meshes)mesh.userData.records.forEach((r,i)=>{assert.ok(!ids.has(r.id));ids.add(r.id);mesh.getMatrixAt(i,matrix);assert.deepEqual(matrix.toArray(),map.get(r.id));});assert.equal(ids.size,map.size);assert.equal(m.records.filter(r=>r.type==='column').length,68);
 assert.ok(old.flatMap(mesh=>mesh.userData.records).every(r=>r.type==='rafter'));
});
test('Roof covering lifts independently of new eave timber and column frame',()=>{
 const m=buildModel({wood:material});m.layers.get('roof').add(system.root);m.layers.get('purlins').add(system.timberRoot);m.layers.get('roof').position.y=2;m.root.updateMatrixWorld(true);assert.equal(system.root.getWorldPosition(new T.Vector3()).y,2);assert.equal(system.timberRoot.getWorldPosition(new T.Vector3()).y,0);
});
test('Visible shell and pan surfaces have upward normals rather than inverted lighting',()=>{
 for(const kind of ['cover','pan']){const mesh=system.root.children.find(m=>m.userData.records[0].kind===kind),positions=mesh.geometry.attributes.position,normals=mesh.geometry.attributes.normal;
  const top=kind==='cover'?Math.floor(ROOF_PARAMETERS.segments/2):3;
  assert.ok(normals.getY(top)>.8);assert.ok(normals.getY(top+positions.count/2)>.8);
 }
});
