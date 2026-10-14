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
      assert.ok(p.z>10.8&&p.z<16.8);assert.ok(p.y>upperHeight(Math.min(p.z,16.5))-.12);
    }}
  }
});
test('Replacing sample ribs preserves all columns, framing, north and side roofs',()=>{
  const before=model.meshes.flatMap(m=>m.userData.records),removed=replaceSampleRibs(model),after=model.meshes.flatMap(m=>m.userData.records),ids=new Set(after.map(r=>r.id));
  assert.ok(removed>0);assert.equal(before.length-after.length,removed);
  for(const r of before.filter(r=>!ids.has(r.id))){assert.ok(r.key.startsWith('upper-rib/1/'));assert.ok(Math.abs(r.position[0])<SAMPLE.halfWidth);assert.ok(r.position[2]>=10.8);}
  assert.equal(after.filter(r=>r.type==='column').length,72);
});
test('Sample follows the roof layer when lifted and has shared instance batches',()=>{
  const roof=model.layers.get('roof');roof.add(sample.root);roof.position.y=2;model.root.updateMatrixWorld(true);
  assert.equal(sample.root.getWorldPosition(new T.Vector3()).y,2);
  assert.equal(sample.root.children.length,4);assert.ok(sample.root.children.every(m=>m.isInstancedMesh&&m.count>0));
});
