import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../../vendor/three.module.js';
import {buildModel,SPEC,ringPoints} from '../model.js';
import {refineModel,faceAngle,roofHeight} from '../study/adapter.js';
import {validateExperiment} from '../../realism-workflow/manifest.js';
const config=validateExperiment(JSON.parse(readFileSync(new URL('../study/experiment.json',import.meta.url))));
const mats={wood:new T.MeshBasicMaterial(),tile:new T.MeshBasicMaterial()},base=buildModel(mats),model=buildModel(mats),original=new Map(model.records.map(r=>[r.id,JSON.stringify(r)])),result=refineModel(model,mats,config.patch);
const refinedRecords=new Map(model.records.map(r=>[r.id,r]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('independent manifest identifies timber pagoda, separate sources and complete contrasts',()=>{assert.equal(config.id,'yingxian');assert.equal(config.modes.length,4);assert.ok(config.sources.some(s=>s.id==='cmu-eaves-photo'));assert.ok(config.checks.some(c=>c.view==='boundary'));});
test('all flat outer bracket assemblies align to the normal of their own octagon face; corners untouched',()=>{
 const c=base.records.filter(r=>r.layer==='brackets'&&/outer-/.test(r.assembly));
 for(const r of c){const n=Number(r.assembly.split('outer-')[1]),changed=refinedRecords.get(r.id);if(n%3===0){assert.equal(JSON.stringify(changed),original.get(r.id));continue;}
  assert.equal(changed.study.side,Math.floor(n/3));const l=r.storey==='C1'?SPEC.buttress:SPEC.levels.find(l=>l.id===r.storey),p=ringPoints(l.top,l.centralTop,l.base+l.height)[n].point;
  near(changed.study.delta,faceAngle(Math.floor(n/3))-Math.atan2(p[0],p[2]));
  near(new T.Vector3(...r.position).distanceTo(new T.Vector3(...p)),new T.Vector3(...changed.position).distanceTo(new T.Vector3(...p)));
 }
 assert.equal(new Set(c.filter(r=>Number(r.assembly.split('outer-')[1])%3!==0).map(r=>r.assembly)).size,160);
});
test('gallery replacement deletes only C1 tile ribs and preserves every unrelated record byte for byte',()=>{assert.ok(result.removed.length>0);const removed=new Set(result.removed),aligned=new Set(result.aligned);for(const r of base.records){if(removed.has(r.id)){assert.equal(r.storey,'C1');assert.equal(r.layer,'roof');assert.ok(r.endpoints);continue;}if(aligned.has(r.id))continue;assert.equal(JSON.stringify(refinedRecords.get(r.id)),original.get(r.id));}});
test('eight face patches stay inside octagonal sectors; same local shape rotated, stable ids unique',()=>{assert.equal(result.samples.length,8);assert.equal(new Set(result.records.map(r=>r.id)).size,result.records.length);const count=result.samples[0].records.length;for(let side=0;side<8;side++){assert.equal(result.samples[side].records.length,count);for(const r of result.samples[side].records){const local=new T.Vector3(...r.position).applyAxisAngle(new T.Vector3(0,1,0),-faceAngle(side));r.localPosition.forEach((v,i)=>near(local.toArray()[i],v));assert.ok(Math.abs(local.x)+config.patch.radius<local.z*Math.tan(Math.PI/8));assert.ok(r.source&&r.storey==='C1'&&r.layer==='roof');}}});
test('roof derivative is finite at eave and all patch matrices and bounds are finite',()=>{for(const z of [15.09,15.1,17.19,17.2,17.21])assert.ok(Number.isFinite(roofHeight(z)));const matrix=new T.Matrix4();for(const sample of result.samples)sample.root.traverse(m=>{if(!m.isInstancedMesh)return;for(let i=0;i<m.count;i++){m.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));}assert.ok(m.boundingBox.min.toArray().every(Number.isFinite));assert.ok(m.boundingBox.max.toArray().every(Number.isFinite));});});
test('roof lift moves all eight samples exactly 2m and leaves support columns in place',()=>{model.root.updateMatrixWorld(true);const before=result.samples.map(s=>s.root.getWorldPosition(new T.Vector3()).y),column=model.layers.get('columns').getWorldPosition(new T.Vector3()).y;model.layers.get('roof').position.y=2;model.root.updateMatrixWorld(true);result.samples.forEach((s,i)=>near(s.root.getWorldPosition(new T.Vector3()).y-before[i],2));near(model.layers.get('columns').getWorldPosition(new T.Vector3()).y,column);model.layers.get('roof').position.y=0;});
test('dark/ming support boundaries and raw table retained after adapter',()=>{for(let i=0;i<8;i++){const a=SPEC.levels[i],b=SPEC.levels[i+1];near(a.base+a.height+a.bracket,b.base);const support=model.records.filter(r=>r.supportsStorey===b.id);assert.equal(support.length,32);for(const r of support)near(r.position[1]+.18,b.base);}near(SPEC.levels[1].centralBottom,4.22);});
test('baseline source snapshot preserved verbatim; adapter never imports another volume',()=>{for(const file of ['model.js','data.js','app.js'])assert.equal(readFileSync(new URL('../'+file,import.meta.url),'utf8'),readFileSync(new URL('../study/history/baseline/'+file,import.meta.url),'utf8'));assert.ok(!readFileSync(new URL('../study/adapter.js',import.meta.url),'utf8').includes('taihe'));});
