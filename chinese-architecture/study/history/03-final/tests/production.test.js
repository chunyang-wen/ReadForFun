import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {buildModel} from '../model.js';
import {buildProductionModel} from '../production-model.js';
import {fitCamera,projectedBounds} from '../production-view.js';
import {LAYERS,PARTS} from '../data.js';
import {isLegacyTile} from '../study/roof-envelope.js';
import {assessFit} from '../realism-workflow/evidence-fit.js';
const mat=new T.MeshStandardMaterial(),materials={wood:mat,tile:mat},model=buildProductionModel(materials),config=new Map(LAYERS.map(l=>[l.id,l]));
test('production adopts facade and continuous tiles without replacing unsupported bracket types or timber',()=>{
 const baseline=buildModel(materials),keep=baseline.meshes.flatMap(m=>m.userData.records.filter(r=>r.layer!=='enclosure'&&!isLegacyTile(r,m.userData.materialKey)).map(r=>r.id));
 const ids=new Set(model.records.map(r=>r.id));assert.equal(ids.size,model.records.length);assert.ok(keep.every(id=>ids.has(id)));
 assert.ok(!model.records.some(r=>r.id.includes('front-intermediate-v2')));assert.equal(model.enclosure.leaves.length,10);
 assert.ok(model.records.every(r=>PARTS[r.type]));
 assert.ok(model.meshes.every(m=>m.count===m.userData.records.length));
});
test('production nested enclosure follows layer offsets and roof lift preserves columns and enclosure',()=>{
 model.root.updateMatrixWorld(true);const column=model.layers.get('columns'),enclosure=model.layers.get('enclosure');
 const door=model.meshes.find(m=>m.userData.records.some(r=>r.kind==='door-plank'));
 const before=door.getWorldPosition(new T.Vector3());model.layers.get('roof').position.y=18;model.root.updateMatrixWorld(true);
 assert.deepEqual(door.getWorldPosition(new T.Vector3()).toArray(),before.toArray());assert.equal(column.position.y,0);
 enclosure.position.y=.5;model.root.updateMatrixWorld(true);assert.equal(door.getWorldPosition(new T.Vector3()).y-before.y,.5);
 for(const g of model.layers.values())g.position.y=0;
});
test('production front/side/back/top and maximum split fit real desktop and narrow canvas bounds',()=>{
 for(const aspect of [850/610,358/430])for(const split of [0,.5,1])for(const d of [[0,.12,1],[1,.1,.1],[1,.63,1.1],[-1,.4,-1],[0,1,.001]]){
  const camera=new T.PerspectiveCamera(35,aspect,.05,400);
  for(const [id,g]of model.layers)g.position.y=config.get(id).offset*split;
  const fit=fitCamera(model,camera,new T.Vector3(...d),split,config);camera.position.copy(fit.position);camera.lookAt(fit.target);
  const b=projectedBounds(model,camera);assert.ok(b.min.every(v=>v>=-.861));assert.ok(b.max.every(v=>v<=.861));
  assert.ok(Math.max(...b.max.map((v,i)=>v-b.min[i]))>1.5,JSON.stringify({aspect,split,d,b,fit}));
 }
 for(const g of model.layers.values())g.position.y=0;
});
test('surface face normals agree with transformed slope, including roof boards in all four directions',()=>{
 const base=buildModel(materials),m=new T.Matrix4(),v=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 const boards=base.meshes.filter(m=>m.userData.materialKey==='roofBoard');assert.equal(boards.length,4);
 for(const mesh of boards){const p=mesh.geometry.attributes.position,ix=mesh.geometry.index;let count=0;
  for(let i=0;i<ix.count;i+=3){a.fromBufferAttribute(p,ix.getX(i));b.fromBufferAttribute(p,ix.getX(i+1));c.fromBufferAttribute(p,ix.getX(i+2));v.crossVectors(b.sub(a),c.sub(a));if(v.length()>1e-7){assert.ok(v.y>0);count++;}}
  assert.ok(count>100);
 }
 const roof=model.meshes.filter(m=>m.userData.records[0]?.kind==='cover-tile');
 for(const mesh of roof){const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;const r=mesh.userData.records;
  for(const side of [0,1,2,3]){const i=r.findIndex(r=>r.side===side);assert.ok(i>=0);mesh.getMatrixAt(i,m);
   const normal=new T.Matrix3().getNormalMatrix(m);let tops=0;
   for(let k=0;k<p.count;k++)if(p.getY(k)>.09&&n.getY(k)>.8){assert.ok(v.fromBufferAttribute(n,k).applyNormalMatrix(normal).y>.5);tops++;}assert.ok(tops>0);
  }
 }
});
test('uncalibrated photographs cannot accept a roof shape change',()=>{
 const result=assessFit({rmsPixels:NaN,markingUncertainty:NaN,independentViewValidated:false});assert.equal(result.accepted,false);assert.equal(result.reasons.length,2);
});
