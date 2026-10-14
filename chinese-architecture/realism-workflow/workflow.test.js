import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {buildRoofPatch} from './roof-patch.js';
import {validateExperiment} from './manifest.js';
import {buildPlaque} from '../taihe/study/plaque.js';
import {surfaceY as fengxianHeight} from '../fengxian/model.js';
const config=JSON.parse(readFileSync(new URL('../taihe/study/experiment.json',import.meta.url))),material=new T.MeshStandardMaterial();
test('Manifest rejects unsupported evidence, duplicate cases and unknown camera presets',()=>{
  assert.equal(validateExperiment(config).id,'taihe');
  for(const change of [c=>c.sources=[],c=>c.checks.push(c.checks[0]),c=>c.checks[0].view='unknown',c=>c.plaque.source='missing',c=>c.views.patch.position=c.views.patch.target]){
    const copy=structuredClone(config);change(copy);assert.throws(()=>validateExperiment(copy));
  }
});
test('Generic patch replays on a different slope and tile spacing without Taihe imports',()=>{
  const parameters={halfWidth:2,pitch:.28,start:2,end:5,step:.25,length:.38,radius:.10};
  const height=z=>8-.35*z;
  const patch=buildRoofPatch(material,{parameters,height,namespace:'transfer-fixture',source:'synthetic slope: software test only',refined:true});
  assert.ok(patch.records.every(r=>r.id.startsWith('transfer-fixture/')));
  assert.equal(patch.root.children.length,5);
  const covers=patch.records.filter(r=>r.kind==='cover-tile');
  assert.ok(covers.length>0);for(const r of covers)assert.ok(Math.abs(r.position[1]-(height(r.position[2])+.06))<1e-9);
  assert.throws(()=>buildRoofPatch(material,{parameters:{...parameters,pitch:.1},height,namespace:'invalid',source:'test'}));
});
test('Refined pans are concave; drips are separate from disks, with finite transformed geometry',()=>{
  const patch=buildRoofPatch(material,{parameters:config.patch,height:z=>15-.1*z,namespace:'test',source:'test',refined:true});
  const pan=patch.root.children.find(m=>m.userData.kind==='pan-tile');
  const pos=pan.geometry.attributes.position;
  let centre=-Infinity,edge=-Infinity;
  for(let i=0;i<pos.count;i++){if(Math.abs(pos.getX(i))<.001)centre=Math.max(centre,pos.getY(i));if(Math.abs(pos.getX(i))>.16)edge=Math.max(edge,pos.getY(i));}
  assert.ok(edge-centre>.03,'pan must channel water rather than remain a flat slab');
  assert.ok(patch.records.some(r=>r.kind==='drip-edge'));
  for(const m of patch.root.children){assert.ok([...m.geometry.attributes.position.array].every(Number.isFinite));assert.ok(m.boundingBox.min.toArray().every(Number.isFinite));assert.ok(m.boundingBox.max.toArray().every(Number.isFinite));}
});
test('Same patch generator accepts Fengxian roof envelope without copying Taihe heights',()=>{
  const parameters={halfWidth:2.8,pitch:.32,start:6.8,end:9.8,step:.25,length:.40,radius:.11};
  const patch=buildRoofPatch(material,{parameters,height:z=>fengxianHeight(0,z),namespace:'fengxian-adapter-test',source:'奉先殿现有教学屋面函数；瓦片参数仅用于软件迁移测试',refined:true});
  for(const r of patch.records.filter(r=>r.kind==='cover-tile'))assert.ok(Math.abs(r.position[1]-fengxianHeight(0,r.position[2])-.06)<1e-8);
  assert.equal(patch.root.children.length,5);
});
test('Plaque has thickness, evidence metadata, and stays with bracket layer when roof lifts',()=>{
  const bracketLayer=new T.Group(),roofLayer=new T.Group(),scene=new T.Group();scene.add(bracketLayer,roofLayer);
  const plaque=buildPlaque({door:material},config.plaque);bracketLayer.add(plaque.root);
  roofLayer.position.y=2;scene.updateMatrixWorld(true);
  assert.equal(plaque.root.getWorldPosition(new T.Vector3()).y,config.plaque.position[1]);
  assert.ok(plaque.records.every(r=>r.source===config.plaque.source&&r.status==='比例推定'));
  const b=new T.Box3().setFromObject(plaque.root);assert.ok(b.max.z-b.min.z>=config.plaque.depth);
});
