import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {buildModel,surfaceY} from '../model.js';
import {SAMPLE,createRoofSample,replaceSampleRibs,isReplacedRib} from '../study/roof-sample.js';
const material=new T.MeshStandardMaterial();
test('Foguang replacement preserves all structure and other roof slopes',()=>{
 const m=buildModel({wood:material});
 const original=m.meshes.flatMap(mesh=>mesh.userData.records.map(r=>({r,key:mesh.userData.materialKey})));
 const expected=original.filter(({r,key})=>!isReplacedRib(r,key)).map(({r})=>r.id).sort();
 const removed=replaceSampleRibs(m);
 assert.ok(removed>0);
 assert.deepEqual(m.meshes.flatMap(mesh=>mesh.userData.records.map(r=>r.id)).sort(),expected);
 assert.equal(original.length-expected.length,removed);
 for(const {r,key} of original.filter(({r,key})=>isReplacedRib(r,key)))assert.ok(r.layer==='roof'&&r.position[2]>0);
});
test('Foguang patch uses stable IDs, neutral instance color and no unsupported pointed drips',()=>{
 const a=createRoofSample(material),b=createRoofSample(material);
 assert.deepEqual(a.records.map(r=>r.id),b.records.map(r=>r.id));
 assert.equal(new Set(a.records.map(r=>r.id)).size,a.records.length);
 assert.ok(!a.records.some(r=>r.kind==='drip-edge'));
 const c=new T.Color();for(const mesh of a.root.children)for(let i=0;i<mesh.count;i++){
  mesh.getColorAt(i,c);assert.deepEqual(c.toArray(),[1,1,1]);assert.equal(mesh.userData.layer,'roof');
 }
 assert.ok(a.records.every(r=>r.source.includes('photo-eaves-2024')));
});
test('local transforms follow west roof, remain finite and preserve positive overlap',()=>{
 const patch=createRoofSample(material),m=new T.Matrix4(),v=new T.Vector3();
 assert.ok(SAMPLE.length>SAMPLE.step);
 for(const mesh of patch.root.children){
  for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,m);assert.ok(m.determinant()>0);
   const r=mesh.userData.records[i];if(r.kind==='cover-tile'){
    assert.ok(Math.abs(r.position[1]-surfaceY(0,r.position[2])-.06)<1e-9);
    v.set(0,0,1).applyQuaternion(new T.Quaternion().fromArray(r.orientation));assert.ok(v.z>0);
   }
  }
 }
});
test('roof lift moves selected sample while column layer stays at original elevation',()=>{
 const m=buildModel({wood:material}),p=createRoofSample(material);m.layers.get('roof').add(p.root);
 m.root.updateMatrixWorld(true);const v=new T.Vector3();const before=p.root.getWorldPosition(v).y;
 m.layers.get('roof').position.y=2;m.root.updateMatrixWorld(true);
 assert.equal(p.root.getWorldPosition(v).y-before,2);assert.equal(m.layers.get('columns').position.y,0);
});
