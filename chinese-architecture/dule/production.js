import * as T from '../vendor/three.module.js';
import {buildUpperNode} from './study/upper-node.js';
import {buildModel} from './model.js';
import {buildRoofEnvelope,replaceRoofLayer,ENVELOPE} from './study/roof-envelope.js';
export const REVISION='dule-04';
// Preserve the existing silhouette. Raised-wing condition E remains a research hypothesis.
export const PRODUCTION_ROOF={...ENVELOPE,revision:REVISION,upperWing:0,lowerWing:0,source:'观音阁2013/2014/2020实景：灰瓦搭接与瓦口图像判读；原屋面曲线、瓦距与截面比例推定；未采用翼角改形'};
export function buildProductionModel(materials){
 const model=buildModel(materials),envelope=buildRoofEnvelope(materials,PRODUCTION_ROOF);
 replaceRoofLayer(model,envelope);
 for(const r of envelope.records){r.type=r.layer==='purlins'?'purlin':'roof';r.note=(r.note||'')+' 连续覆盖试件正式接入；非逐瓦测绘，未复原瓦当纹样。';}
 // Active records must match rendered instances, excluding the replaced baseline cover.
 model.records=model.meshes.flatMap(m=>m.userData.records);
 return model;
}
export function effectivelyVisible(object){for(let p=object;p;p=p.parent)if(!p.visible)return false;return true;}

export function buildUpperDetail(materials,layerIds){
 const detail=buildUpperNode(materials),meshes=[];
 for(const id of layerIds)if(!detail.layers.has(id)){const g=new T.Group();detail.root.add(g);detail.layers.set(id,g);}
 // Split diagnostic instances by tier so disassembly follows each member, not the generator batch.
 for(const old of detail.meshes){
  const tiers=new Set(old.userData.records.map(r=>r.tier));
  for(const tier of tiers){const indices=old.userData.records.map((r,i)=>r.tier===tier?i:-1).filter(i=>i>=0),mesh=new T.InstancedMesh(old.geometry,old.material,indices.length),matrix=new T.Matrix4();mesh.userData={...old.userData,tier,records:indices.map(i=>old.userData.records[i])};indices.forEach((i,j)=>{old.getMatrixAt(i,matrix);mesh.setMatrixAt(j,matrix);});mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();detail.layers.get(mesh.userData.layer).add(mesh);meshes.push(mesh);}
  old.removeFromParent();old.dispose();
 }
 detail.meshes=meshes;return detail;
}
