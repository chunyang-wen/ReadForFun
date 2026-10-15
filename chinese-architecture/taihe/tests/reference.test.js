import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../../vendor/three.module.js';
import {buildReferenceDetail,addRoundelRelief,projectReference} from '../study/reference-detail.js';
import {createRoofSample} from '../study/roof-sample.js';
const data=JSON.parse(readFileSync(new URL('../study/assets/reference-vectors.json',import.meta.url)));
const detail=buildReferenceDetail(data);
const area=ring=>Math.abs(ring.reduce((s,p,i)=>{const n=ring[(i+1)%ring.length];return s+p[0]*n[1]-n[0]*p[1];},0)/2);

test('Reference is hash-pinned and each original character is a separate vector region',()=>{
  const bytes=readFileSync(new URL('../study/assets/reference-photo.jpg',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256);
  assert.equal(data.glyphs.length,3);
  const centres=data.glyphs.map(s=>s.outer.reduce((sum,p)=>sum+p[1],0)/s.outer.length).sort((a,b)=>a-b);
  assert.ok(centres[0]<700&&centres[1]>700&&centres[1]<880&&centres[2]>880);
  assert.ok(data.glyphs.some(s=>s.holes.length),'real character counters must survive tracing');
});
test('Extruded lettering preserves traced area including all interior cutouts',()=>{
  const mesh=detail.root.children.find(m=>m.userData.record.id.endsWith('/letters'));
  const pos=mesh.geometry.attributes.position;let front=0;
  for(let i=0;i<pos.count;i+=3){
    const a=new T.Vector3().fromBufferAttribute(pos,i),b=new T.Vector3().fromBufferAttribute(pos,i+1),c=new T.Vector3().fromBufferAttribute(pos,i+2);
    if([a,b,c].every(p=>Math.abs(p.z-.007)<1e-6))front+=Math.abs((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/2;
  }
  const expected=data.glyphs.reduce((sum,s)=>sum+area(s.outer)-s.holes.reduce((n,h)=>n+area(h),0),0)*data.scale**2;
  assert.ok(Math.abs(front-expected)<1e-6,`${front} versus ${expected}`);
});
test('Browser camera convention reproduces the saved local pose fit and independent edge checks',()=>{
  const c=data.calibration,camera=new T.PerspectiveCamera(c.fov,data.imageSize[0]/data.imageSize[1],.1,500);
  camera.position.fromArray(c.position);camera.up.fromArray(c.up);camera.lookAt(new T.Vector3(...c.target));
  const result=projectReference(camera,data);
  assert.ok(result.fitPixels<2&&result.holdoutPixels<2);
  assert.ok(Math.abs(result.fitPixels-c.rmsPixels)<1e-6);
  camera.position.x+=.2;assert.ok(projectReference(camera,data).fitPixels>10,'pose check must detect a shifted camera');
});
test('Photo-derived ornament has finite geometry, evidence IDs and stays with its own layer',()=>{
  const root=new T.Group(),upper=new T.Group(),roof=new T.Group();root.add(upper,roof);upper.add(detail.root);roof.position.y=2;root.updateMatrixWorld(true);
  assert.equal(detail.root.getWorldPosition(new T.Vector3()).y,data.position[1]);
  assert.ok(detail.records.some(r=>r.id.endsWith('/paint-gold')));
  assert.ok(detail.records.some(r=>r.id.endsWith('/frame-carving')));
  for(const m of detail.root.children){assert.ok([...m.geometry.attributes.position.array].every(Number.isFinite));assert.equal(m.userData.record.referenceHash,data.sha256);}
});
test('Source roundel relief follows all sample disks and lifts with the roof',()=>{
  const sample=createRoofSample(new T.MeshStandardMaterial(),{refined:true});
  const mesh=addRoundelRelief(sample,data,new T.MeshStandardMaterial());
  assert.equal(mesh.count,sample.records.filter(r=>r.kind==='eave-disk').length);
  assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  const parent=new T.Group();parent.add(sample.root);parent.position.y=2;parent.updateMatrixWorld(true);
  assert.equal(mesh.getWorldPosition(new T.Vector3()).y,2);
});
