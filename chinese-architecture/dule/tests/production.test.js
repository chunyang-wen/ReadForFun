import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../../vendor/three.module.js';
import {buildProductionModel,buildUpperDetail,effectivelyVisible,PRODUCTION_ROOF} from '../production.js';import {buildModel} from '../model.js';import {LAYERS} from '../data.js';
const mat=new T.MeshStandardMaterial(),materials=Object.fromEntries(['wood','darkwood','column','endgrain','rafter','tile','roofBoard','ridge','door','plaster','stone','lightstone','ceiling'].map(k=>[k,mat]));
const model=buildProductionModel(materials);
test('formal roof replaces baseline cover and active records match instances; structural IDs survive',()=>{
 const baseline=buildModel(materials),ids=baseline.meshes.filter(m=>m.userData.layer!=='roof').flatMap(m=>m.userData.records.map(r=>r.id));const active=model.meshes.flatMap(m=>m.userData.records.map(r=>r.id));assert.ok(ids.every(id=>active.includes(id)));assert.equal(new Set(active).size,active.length);assert.equal(model.records.length,active.length);assert.equal(PRODUCTION_ROOF.upperWing,0);assert.equal(PRODUCTION_ROOF.lowerWing,0);
 assert.ok(model.meshes.filter(m=>m.userData.layer==='roof').every(m=>m.userData.records.every(r=>r.id.startsWith('dule/roof02/'))));
});
test('every continuous board triangle faces upward on all slope signs and axes',()=>{
 for(const mesh of model.meshes.filter(m=>m.userData.records[0]?.kind==='board')){const g=mesh.geometry,p=g.attributes.position,idx=g.index;for(let i=0;i<idx.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,idx.getX(i)),b=new T.Vector3().fromBufferAttribute(p,idx.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,idx.getX(i+2));assert.ok(b.sub(a).cross(c.sub(a)).y>0);}}
});
test('hidden grandparent excludes nested roof from picking; bearing remains independent under explosion',()=>{
 const roof=model.meshes.find(m=>m.userData.layer==='roof'),bearing=model.meshes.find(m=>m.userData.layer==='purlins'&&m.userData.records[0]?.id.startsWith('dule/roof02/'));assert.ok(effectivelyVisible(roof));model.layers.get('roof').visible=false;assert.equal(effectivelyVisible(roof),false);assert.ok(effectivelyVisible(bearing));model.layers.get('roof').visible=true;model.layers.get('roof').position.y=15;model.root.updateMatrixWorld(true);assert.equal(bearing.getWorldPosition(new T.Vector3()).y,0);
});
test('upper node has two descending ang and per-tier explosion batches with all viewer layers',()=>{
 const detail=buildUpperDetail(materials,LAYERS.map(l=>l.id));assert.equal(detail.records.filter(r=>r.type==='ang').length,2);assert.equal(detail.layers.size,LAYERS.length);for(const m of detail.meshes)assert.ok(m.userData.records.every(r=>r.tier===m.userData.tier));
});
