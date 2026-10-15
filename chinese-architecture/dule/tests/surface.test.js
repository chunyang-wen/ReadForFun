import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {buildModel,roofY} from '../model.js';
import {SAMPLE,createRoofSample,replaceSampleRibs,isReplacedRib} from '../study/roof-sample.js';
import {LOWER_REACH,applyPairedReach} from '../study/structure-sample.js';
const material=new T.MeshStandardMaterial(),make=()=>buildModel({wood:material});
test('adapter removes only south upper central ribs, preserves shaft and structure IDs',()=>{
 const m=make(),before=m.meshes.flatMap(x=>x.userData.records),removed=replaceSampleRibs(m);
 const after=m.meshes.flatMap(x=>x.userData.records);assert.ok(removed>0);assert.equal(removed,before.filter(r=>isReplacedRib(r)).length);
 assert.deepEqual(after.map(r=>r.id),before.filter(r=>!isReplacedRib(r)).map(r=>r.id));
 assert.ok(after.some(r=>r.layer==='roof'&&r.position[2]<0));assert.equal(after.filter(r=>r.type==='fork').length,before.filter(r=>r.type==='fork').length);
});
test('gray roof patch conforms to Dule own slope and retains neutral constant colors',()=>{
 const p=createRoofSample(material);assert.equal(new Set(p.records.map(r=>r.id)).size,p.records.length);
 for(const r of p.records.filter(r=>r.kind==='cover-tile')){assert.ok(Math.abs(r.position[1]-(roofY(r.position[2])+.22))<1e-8);assert.ok(Math.abs(r.position[0])<SAMPLE.halfWidth);assert.equal(r.status,'比例推定');}
 for(const mesh of p.root.children){for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));const c=new T.Color();for(let i=0;i<mesh.count;i++){mesh.getColorAt(i,c);assert.deepEqual(c.toArray(),[1,1,1]);}}
 assert.ok(p.records.some(r=>r.kind==='drip-edge'));assert.ok(p.records.some(r=>r.kind==='pan-tile'));
});
test('roof lift carries tile study while retaining column and enclosure levels',()=>{
 const m=make(),p=createRoofSample(material);m.layers.get('roof').add(p.root);m.layers.get('roof').position.y=2;m.root.updateMatrixWorld(true);
 assert.equal(p.root.getWorldPosition(new T.Vector3()).y,2);assert.equal(m.layers.get('columns').position.y,0);assert.equal(m.layers.get('enclosure').position.y,0);
});
test('paired reach experiment respects published pair totals without presenting individual jumps as measured',()=>{
 assert.equal(LOWER_REACH.trial[1],.84);assert.ok(Math.abs(LOWER_REACH.trial[3]-LOWER_REACH.trial[1]-.80)<1e-8);
 const d=buildModel({wood:material},{detailOnly:true}),old=d.records.map(r=>r.id);assert.ok(applyPairedReach(d)>0);
 assert.deepEqual(d.records.map(r=>r.id),old);
 const hua=d.records.filter(r=>r.type==='hua');hua.forEach((r,i)=>assert.ok(Math.abs(r.position[2]+r.scale[0]/2-LOWER_REACH.trial[i])<1e-6));
 assert.ok(hua[0].note.includes('比例推定'));assert.equal(d.records.find(r=>r.type==='fork').slotWidth,.23);
});
test('eave sample remains outside sacred shaft and does not invent palace ornament',()=>{
 const p=createRoofSample(material);assert.ok(p.records.every(r=>r.position[2]>=5.64));assert.ok(p.records.every(r=>r.id.startsWith('dule/upper-south/')));
 assert.ok(!p.records.some(r=>/plaque|dragon|gold/.test(r.kind)));
});
