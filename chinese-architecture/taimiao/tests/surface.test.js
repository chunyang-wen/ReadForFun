import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {buildModel,upperHeight} from '../model.js';
import {createRoofSample,replaceSampleRibs,SAMPLE} from '../study/roof-sample.js';
const mat=new T.MeshStandardMaterial(),sample=createRoofSample(mat),model=buildModel({wood:mat});
test('Sample stays on the southern centre bay; every transformed vertex is finite',()=>{
  assert.equal(new Set(sample.records.map(r=>r.id)).size,sample.records.length);
  for(const mesh of sample.root.children){
    const v=mesh.geometry.attributes.position,m=new T.Matrix4();
    for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);for(let j=0;j<v.count;j++){
      const p=new T.Vector3().fromBufferAttribute(v,j).applyMatrix4(m);
      assert.ok(p.toArray().every(Number.isFinite));assert.ok(Math.abs(p.x)<SAMPLE.halfWidth);
      assert.ok(p.z>11.3&&p.z<14.8);assert.ok(p.y>upperHeight(Math.min(p.z,14.5))-.12);
    }}
  }
});
test('Replacing sample ribs preserves all columns, framing, north and side roofs',()=>{
  const before=model.meshes.flatMap(m=>m.userData.records),removed=replaceSampleRibs(model),after=model.meshes.flatMap(m=>m.userData.records),ids=new Set(after.map(r=>r.id));
  assert.ok(removed>0);assert.equal(before.length-after.length,removed);
  for(const r of before.filter(r=>!ids.has(r.id))){assert.ok(r.key.startsWith('rib/front/1/'));assert.ok(Math.abs(r.position[0])<SAMPLE.halfWidth);assert.ok(r.position[2]>=11.3);}
  assert.equal(after.filter(r=>r.type==='column').length,68);
});
test('Sample follows the roof layer when lifted and has shared instance batches',()=>{
  const roof=model.layers.get('roof');roof.add(sample.root);roof.position.y=2;model.root.updateMatrixWorld(true);
  assert.equal(sample.root.getWorldPosition(new T.Vector3()).y,2);
  assert.equal(sample.root.children.length,4);assert.ok(sample.root.children.every(m=>m.isInstancedMesh&&m.count>0));
});
test('Taimiao refined patch has its own IDs, southern envelope and unmoved timber supports',()=>{
 const d=createRoofSample(mat,{refined:true}),m=buildModel({wood:mat});
 assert.ok(d.records.every(r=>r.id.startsWith('taimiao-study/')&&r.source.includes('vb-eaves')));
 assert.equal(d.root.children.length,5);
 for(const mesh of d.root.children){const vertices=mesh.geometry.attributes.position,matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);for(let j=0;j<vertices.count;j++){const p=new T.Vector3().fromBufferAttribute(vertices,j).applyMatrix4(matrix);assert.ok(p.toArray().every(Number.isFinite));assert.ok(Math.abs(p.x)<SAMPLE.halfWidth);assert.ok(p.z>11.3&&p.z<14.8);}}}
 const timber=m.layers.get('purlins'),before=timber.getWorldPosition(new T.Vector3()).clone();m.layers.get('roof').add(d.root);m.layers.get('roof').position.y=2;m.root.updateMatrixWorld(true);
 assert.equal(d.root.getWorldPosition(new T.Vector3()).y,2);assert.deepEqual(timber.getWorldPosition(new T.Vector3()),before);
});
test('Only the declared patch is removed; source records and every other instance matrix remain unchanged',()=>{
 const m=buildModel({wood:mat}),before=new Map(),matrix=new T.Matrix4(),source=JSON.stringify(m.records);
 for(const mesh of m.meshes)mesh.userData.records.forEach((r,i)=>{mesh.getMatrixAt(i,matrix);before.set(r.id,{r,matrix:matrix.toArray()});});
 const removed=replaceSampleRibs(m);assert.ok(removed>0);assert.equal(JSON.stringify(m.records),source);
 const retained=new Set();for(const mesh of m.meshes)mesh.userData.records.forEach((r,i)=>{retained.add(r.id);mesh.getMatrixAt(i,matrix);assert.deepEqual(matrix.toArray(),before.get(r.id).matrix);});
 for(const [id,{r}] of before)if(!retained.has(id)){assert.ok(r.key.startsWith('rib/front/1/'));assert.ok(Math.abs(r.position[0])<SAMPLE.halfWidth);assert.ok(r.position[2]>=SAMPLE.start-.3&&r.position[2]<=SAMPLE.end);}
});
