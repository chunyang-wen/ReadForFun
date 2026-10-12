import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { buildModel, getColumnGrid, SPEC, roofY, surfaceY } from '../model.js';
import { LAYERS, PARTS } from '../data.js';
const materials={wood:new THREE.MeshStandardMaterial()};
const whole=buildModel(materials),detail=buildModel(materials,{detailOnly:true});
test('column topology is 22 outer + 14 inner, with seven unequal bays',()=>{
 const grid=getColumnGrid();assert.equal(grid.outer.length,22);assert.equal(grid.inner.length,14);
 assert.equal(new Set([...grid.outer,...grid.inner].map(p=>`${p.x},${p.z}`)).size,36);
 assert.equal(grid.xs.at(-1)-grid.xs[0],34);assert.equal(grid.zs.at(-1)-grid.zs[0],17.66);
 assert.deepEqual(SPEC.bays,[4.4,5.04,5.04,5.04,5.04,5.04,4.4]);
 assert.equal(whole.records.filter(p=>p.type==='outerColumn').length,22);
 assert.equal(whole.records.filter(p=>p.type==='innerColumn').length,14);
});
test('every selectable member has a documented type and valid layer',()=>{
 for(const m of [whole,detail])for(const r of m.records){assert.ok(PARTS[r.type],r.type);assert.ok(LAYERS.some(l=>l.id===r.layer));assert.ok(r.position.every(Number.isFinite));}
});
test('all rendered geometry and instance transforms are finite and nondegenerate',()=>{
 const matrix=new THREE.Matrix4();for(const model of [whole,detail])for(const mesh of model.meshes){
  for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(Math.abs(matrix.determinant())>1e-9,mesh.name);}
 }
});
test('structural layers remain independently inspectable and whole model fits metre bounds',()=>{
 assert.equal(whole.layers.size,11);for(const [id,group] of whole.layers)assert.ok(group.children.length>0,id);
 whole.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(whole.root);const size=bounds.getSize(new THREE.Vector3());
 assert.ok(size.x>41&&size.x<44,size.x);assert.ok(size.z>23&&size.z<26,size.z);assert.ok(size.y>13&&size.y<16,size.y);
});
test('roof members and fork struts are explicit, not a single solid shell',()=>{
 assert.ok(whole.records.filter(p=>p.type==='rafter').length>700);
 assert.ok(whole.records.filter(p=>p.type==='roof').length>3000);
 assert.equal(whole.records.filter(p=>p.type==='chashou').length,8);
 assert.ok(roofY(0)>roofY(4.415));assert.ok(roofY(4.415)>roofY(8.83));
});
test('local bracket has two sloped ang timbers and two outward hua arms',()=>{
 assert.equal(detail.records.filter(p=>p.type==='ang').length,2);
 assert.equal(detail.records.filter(p=>p.type==='huagong').length,2);
 const tiers=new Set(detail.meshes.map(m=>m.userData.tier));assert.ok(tiers.has(0)&&tiers.has(7));
 const high=detail.meshes.filter(m=>m.userData.tier===7);assert.ok(high.length>0);
});

test('upper frame does not protrude through the hip roof',()=>{
 const m=new THREE.Matrix4(),p=new THREE.Vector3();
 for(const mesh of whole.meshes.filter(mesh=>mesh.userData.layer==='roofFrame')) {
  const vertices=mesh.geometry.getAttribute('position');
  for(let i=0;i<mesh.count;i++) {
   mesh.getMatrixAt(i,m);
   for(let j=0;j<vertices.count;j++) {
    p.fromBufferAttribute(vertices,j).applyMatrix4(m);
    assert.ok(p.y<=surfaceY(p.x,p.z)+.06,`${mesh.userData.records[i].type} at ${p.toArray()}`);
   }
  }
 }
});
