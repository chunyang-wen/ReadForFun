import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../../vendor/three.module.js';
import {buildModel,ROOF} from '../model.js';import {buildRoofEnvelope,replaceRoofLayer,refitRoofMembers,upperSurface,lowerSurface,upperWing,LOW,ENVELOPE} from '../study/roof-envelope.js';import {buildExterior,replaceVisibleEnclosure,EXTERIOR} from '../study/exterior.js';import {buildUpperNode} from '../study/upper-node.js';
const m=new T.MeshStandardMaterial(),materials=Object.fromEntries(['wood','darkwood','column','endgrain','rafter','tile','roofBoard','ridge','door','plaster','stone','lightstone','ceiling'].map(k=>[k,m]));
const envelope=buildRoofEnvelope(materials);
test('full roof has finite transforms and stable unique IDs on all four directions and both tiers',()=>{
 assert.equal(new Set(envelope.records.map(r=>r.id)).size,envelope.records.length);for(const tier of ['upper','lower'])for(const axis of ['x','z'])for(const sign of [-1,1])assert.ok(envelope.records.some(r=>r.id.includes(`${tier}/${axis}/${sign}/cover/`)));
 const matrix=new T.Matrix4();for(const mesh of envelope.meshes){assert.equal(mesh.count,mesh.userData.records.length);for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.determinant()>0);}}
});
test('roof boards and tiles share a continuous corner-height function, without closing the lower central void',()=>{
 assert.equal(upperWing(0,ROOF.halfZ),0);assert.ok(Math.abs(upperWing(ROOF.halfX,ROOF.halfZ)-ENVELOPE.upperWing)<1e-8);
 for(const r of envelope.records.filter(r=>r.kind==='cover-tile')){const H=r.tier==='upper'?upperSurface:lowerSurface;assert.ok(Math.abs(r.position[1]-H(r.position[0],r.position[2])-.07)<1e-8);if(r.tier==='lower')assert.ok(Math.abs(r.position[0])>=LOW.innerX-1e-5||Math.abs(r.position[2])>=LOW.innerZ-1e-5);}
 assert.ok(Math.abs(upperSurface(ROOF.halfX,ROOF.halfZ)-upperSurface(-ROOF.halfX,ROOF.halfZ))<1e-8);
});
test('nine-ridge outline and curved eave-bearing rails have explicit separate IDs and support ownership',()=>{
 assert.ok(envelope.records.some(r=>r.id.includes('ridge/main/')));for(const sx of [-1,1])for(const sz of [-1,1])for(const name of ['verge','upper-hip'])assert.ok(envelope.records.some(r=>r.id.includes(`ridge/${name}/${sx}/${sz}/`)));
 assert.ok(envelope.supportRoot.children.length>0);assert.ok(envelope.supportRoot.children.every(m=>m.userData.layer==='purlins'));
});
test('full roof replacement preserves columns, floors, brackets and frame IDs; lifted roof leaves bearings and supports fixed',()=>{
 const model=buildModel(materials),before=model.meshes.filter(m=>!['roof','rafters'].includes(m.userData.layer)).map(m=>Array.from(m.instanceMatrix.array));const ids=model.meshes.filter(m=>!['roof','rafters'].includes(m.userData.layer)).flatMap(m=>m.userData.records.map(r=>r.id));
 assert.ok(refitRoofMembers(model)>0);replaceRoofLayer(model,buildRoofEnvelope(materials));assert.deepEqual(model.meshes.filter(m=>!['roof','rafters'].includes(m.userData.layer)&&!m.userData.records[0]?.id.startsWith('dule/roof02/')).map(m=>Array.from(m.instanceMatrix.array)),before);
 const surviving=model.meshes.flatMap(m=>m.userData.records.map(r=>r.id));assert.ok(ids.every(id=>surviving.includes(id)));model.layers.get('roof').position.y=2;model.root.updateMatrixWorld(true);assert.equal(model.layers.get('purlins').position.y,0);assert.equal(model.layers.get('columns').position.y,0);
});
test('present-state exterior uses eight independent corner supports without merging them into historical column grids',()=>{
 const e=buildExterior(materials),supports=e.records.filter(r=>r.kind==='eave-support');assert.equal(supports.length,8);assert.equal(supports.filter(r=>r.tier==='upper').length,4);
 for(const r of supports){assert.equal(r.layer,'columns');assert.ok(r.scale[1]>0);assert.ok(r.note.includes('非辽构柱网'));const top=r.position[1]+r.scale[1]/2,H=r.tier==='upper'?upperSurface:lowerSurface;assert.ok(Math.abs(top-(H(r.position[0],r.position[2])-.34))<.021);}
});
test('enclosure adapter retains roof gables and north elevation; no door panel fills the southern central aperture',()=>{
 const model=buildModel(materials),north=model.meshes.filter(m=>m.userData.layer==='enclosure').flatMap(m=>m.userData.records).filter(r=>r.position[2]<0).map(r=>r.id),e=buildExterior(materials);assert.ok(replaceVisibleEnclosure(model,e).length>0);
 const ids=model.meshes.flatMap(m=>m.userData.records.map(r=>r.id));assert.ok(north.every(id=>ids.includes(id)));assert.ok(model.meshes.some(m=>m.userData.records.some(r=>r.note==='山墙轮廓，不复原雕饰')));
 const opening=e.records.filter(r=>r.id.includes('/0/2/')&&r.kind==='wall');assert.ok(!opening.some(r=>Math.abs(r.position[0])<.5&&r.scale[1]>1));
});
test('upper diagnostic distinguishes two horizontal hua from two descending ang and discloses unknown profiles',()=>{
 const n=buildUpperNode(materials);assert.equal(n.records.filter(r=>r.type==='ang').length,2);assert.equal(n.records.filter(r=>r.type==='hua').length,2);
 for(const r of n.records.filter(r=>r.type==='ang')){const q=new T.Quaternion().fromArray(r.orientation),dir=new T.Vector3(0,0,1).applyQuaternion(q);assert.ok(dir.y<0);assert.ok(r.note.includes('不复原'));assert.ok(r.source.includes('两下昂'));}
});
