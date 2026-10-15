import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {buildModel,SPEC} from '../model.js';
import {buildEnclosure,ENCLOSURE} from '../study/enclosure.js';
import {buildFrontBrackets,isFrontIntermediate} from '../study/brackets.js';
import {buildRoofEnvelope,ROOF,surfacePoint,surfaceOrientation,isLegacyTile} from '../study/roof-envelope.js';
import {splitInstances,activeMeshes} from '../study/adapt-model.js';
const mat=new T.MeshStandardMaterial(),materials={wood:mat},enclosure=buildEnclosure(materials),roof=buildRoofEnvelope(mat);
test('visible facade has five paired board doors, only two end lattice windows, and head infill',()=>{
 assert.deepEqual([...new Set(enclosure.leaves.map(r=>r.bay))],[1,2,3,4,5]);assert.equal(enclosure.leaves.length,10);
 const windowBays=[...new Set(enclosure.records.filter(r=>r.kind==='window-mullion').map(r=>Number(r.id.match(/bay-(\d)/)[1])))];assert.deepEqual(windowBays,[0,6]);
 assert.equal(enclosure.records.filter(r=>r.kind==='head-infill').length,7);
 assert.ok(enclosure.records.filter(r=>r.kind==='bracket-backing').every(r=>r.position[1]+r.scale[1]/2<=ENCLOSURE.infillTop+.00001));
});
test('opening the center door moves only its two leaves and keeps the hinge positions',()=>{
 const hinges=enclosure.leaves.map(l=>l.group.position.toArray());enclosure.setDoorOpen(true);
 enclosure.leaves.forEach((l,i)=>{assert.deepEqual(l.group.position.toArray(),hinges[i]);assert.equal(l.group.rotation.y!==0,l.bay===3);});
 enclosure.setDoorOpen(false);assert.ok(enclosure.leaves.every(l=>l.group.rotation.y===0));
});
test('front bracket replacement does not erase column-head, corner, rear or inner brackets; switching restores exact IDs',()=>{
 const m=buildModel(materials),before=activeMeshes(m.root).flatMap(o=>o.userData.records.map(r=>r.id)).sort();
 const expected=m.meshes.flatMap(o=>o.userData.records).filter(isFrontIntermediate);
 const split=splitInstances(m,isFrontIntermediate);assert.ok(expected.length>0);split.set(true);
 const after=activeMeshes(m.root).flatMap(o=>o.userData.records);assert.equal(after.length,before.length-expected.length);
 assert.ok(!after.some(isFrontIntermediate));assert.ok(after.some(r=>r.type==='innerBracket'));assert.ok(after.some(r=>r.assembly==='转角正交分支（简化）'));
 split.set(false);assert.deepEqual(activeMeshes(m.root).flatMap(o=>o.userData.records.map(r=>r.id)).sort(),before);
 const study=buildFrontBrackets(materials);assert.equal(new Set(study.records.map(r=>r.id.split('/')[2])).size,7);assert.ok(study.records.every(r=>r.position[2]>=8.83));
});
test('four-slope tiles stay in their own roof domains and have upward surface normals',()=>{
 assert.equal(new Set(roof.records.map(r=>r.side)).size,4);
 for(const r of roof.records){
  const p=new T.Vector3(...r.position);assert.ok(p.toArray().every(Number.isFinite));
  const localHalf=(r.side<2?SPEC.ridgeHalf:0)+r.v;
  assert.ok(Math.abs(r.u)<=localHalf+.001);
  if(!r.kind.startsWith('eave-')){
   const q=new T.Quaternion().fromArray(r.orientation);const up=new T.Vector3(0,1,0).applyQuaternion(q);assert.ok(up.y>.7);
   assert.ok(r.v>=ROOF.start-.001&&r.v<=ROOF.end+.001);
  }
 }
 for(let side=0;side<4;side++){
  const a=surfacePoint(side,0,8),b=surfacePoint(side,0,9);const axis=b.sub(a).normalize();const q=surfaceOrientation(side,0,8.5);assert.ok(new T.Vector3(0,0,1).applyQuaternion(q).dot(axis)>.99);
 }
});
test('continuous roof replacement keeps ridge silhouettes and all timber, and tile IDs are repeatable',()=>{
 const m=buildModel(materials);const expected=m.meshes.flatMap(o=>o.userData.records.map(r=>({r,key:o.userData.materialKey}))).filter(({r,key})=>!isLegacyTile(r,key)).map(({r})=>r.id).sort();
 splitInstances(m,isLegacyTile).set(true);
 assert.deepEqual(activeMeshes(m.root).flatMap(o=>o.userData.records.map(r=>r.id)).sort(),expected);
 const again=buildRoofEnvelope(mat);assert.deepEqual(roof.records.map(r=>r.id),again.records.map(r=>r.id));
 assert.equal(new Set(roof.records.map(r=>r.id)).size,roof.records.length);
 assert.ok(!roof.records.some(r=>r.kind==='drip-edge'));
});
test('all new facade, bracket and roof instance transforms are finite and positive; no source is unlabeled',()=>{
 for(const assembly of [enclosure,buildFrontBrackets(materials),roof]){
  assert.ok(assembly.records.every(r=>r.status&&r.source));
  const matrix=new T.Matrix4();assembly.root.traverse(mesh=>{if(!mesh.isInstancedMesh)return;
   for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.determinant()>1e-9);}
  });
 }
});

import {readFileSync} from 'node:fs';
import {validateFoguang} from '../study/validate.js';
test('study rejects inverted elevations, impossible overlap, unsafe tessellation and invalid material settings',()=>{
 const c=JSON.parse(readFileSync(new URL('../study/experiment.json',import.meta.url),'utf8'));
 assert.equal(validateFoguang(c).id,'foguang');
 for(const change of [c=>c.enclosure.lintelTop=4,c=>c.roofEnvelope.pitch=0,c=>c.roofEnvelope.length=.1,c=>c.materials.tile.roughness=2]){const bad=structuredClone(c);change(bad);assert.throws(()=>validateFoguang(bad));}
});
