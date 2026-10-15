import * as T from '../../vendor/three.module.js';
import {SPEC,ringPoints} from '../model.js';
import {buildRoofPatch} from '../../realism-workflow/roof-patch.js';
export const roofHeight=z=>8+3.6*Math.pow(Math.max(0,(17.2-z)/5.1),1.35);
export const faceAngle=side=>(side+1)*Math.PI/4;
export function facePoint(side,p){return new T.Vector3(...p).applyAxisAngle(new T.Vector3(0,1,0),faceAngle(side)).toArray();}
// Only flat-side outer bracket assemblies rotate. Corner assemblies remain explicitly unresolved.
export function alignFaceBrackets(model){
 const changes=[],matrix=new T.Matrix4(),up=new T.Vector3(0,1,0);
 for(const mesh of model.meshes){if(mesh.userData.layer!=='brackets')continue;
  mesh.userData.records.forEach((r,index)=>{
   const match=/^(C1|M[1-5]|D[2-5])\/outer-(\d+)$/.exec(r.assembly||'');if(!match)return;
   const col=Number(match[2]);if(col%3===0)return;
   const l=match[1]==='C1'?SPEC.buttress:SPEC.levels.find(x=>x.id===match[1]);
   const anchor=ringPoints(l.top,l.centralTop,l.base+l.height)[col].point;
   const delta=faceAngle(Math.floor(col/3))-Math.atan2(anchor[0],anchor[2]);
   const q=new T.Quaternion().setFromAxisAngle(up,delta),p=new T.Vector3(...r.position).sub(new T.Vector3(...anchor)).applyQuaternion(q).add(new T.Vector3(...anchor));
   r.position=p.toArray();r.orientation=q.clone().multiply(new T.Quaternion(...r.orientation)).toArray();
   if(r.endpoints)r.endpoints=r.endpoints.map(p=>new T.Vector3(...p).sub(new T.Vector3(...anchor)).applyQuaternion(q).add(new T.Vector3(...anchor)).toArray());
   r.study={operation:'face-normal-alignment',side:Math.floor(col/3),delta,source:'wang2024-fig20',status:'图像判读 / 理想正八边假设'};
   matrix.compose(p,new T.Quaternion(...r.orientation),new T.Vector3(...r.scale));mesh.setMatrixAt(index,matrix);changes.push(r.id);
  });mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
 }
 return changes;
}
export function replaceGalleryRibs(model,p){
 const removed=[],newMeshes=[],matrix=new T.Matrix4();
 const extent=Math.floor((p.halfWidth-p.radius)/p.pitch)*p.pitch+p.radius;
 for(const mesh of model.meshes){
  if(mesh.userData.layer!=='roof'||mesh.userData.materialKey!=='tile'||mesh.userData.storey!=='C1'){newMeshes.push(mesh);continue;}
  const keep=[];mesh.userData.records.forEach((r,i)=>{
   let inside=false;
   for(let side=0;side<8;side++){const v=new T.Vector3(...r.position).applyAxisAngle(new T.Vector3(0,1,0),-faceAngle(side));if(Math.abs(v.x)<=extent&&v.z>=p.start-.05&&v.z<=p.end+.02){inside=true;break;}}
   if(inside)removed.push(r.id);else keep.push(i);
  });
  const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length);replacement.userData={...mesh.userData,records:keep.map(i=>mesh.userData.records[i])};
  keep.forEach((i,j)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(j,matrix);});replacement.castShadow=replacement.receiveShadow=true;replacement.computeBoundingBox();replacement.computeBoundingSphere();
  mesh.parent.add(replacement);mesh.removeFromParent();mesh.dispose();newMeshes.push(replacement);
 }
 model.meshes=newMeshes;const gone=new Set(removed);model.records=model.records.filter(r=>!gone.has(r.id));return removed;
}
export function addGallerySamples(model,material,parameters){
 const samples=[];
 for(let side=0;side<8;side++){
  const sample=buildRoofPatch(material,{parameters,height:roofHeight,namespace:`yingxian/C1/face-${side}`,source:'cmu-eaves-photo;wang2024-fig2',refined:true});
  sample.root.rotation.y=faceAngle(side);sample.root.userData.layer='roof';sample.root.userData.storey='C1';
  for(const r of sample.records){r.localPosition=[...r.position];r.position=facePoint(side,r.position);r.orientation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),faceAngle(side)).multiply(new T.Quaternion(...r.orientation)).toArray();r.layer='roof';r.storey='C1';r.side=side;r.status='比例推定';r.note='灰瓦无釉；瓦当无纹，滴水为通用轮廓，不复原实物纹样';}
  // Records are world coordinates; matrices remain local to the face group.
  sample.root.traverse(mesh=>{if(mesh.isInstancedMesh){mesh.userData.layer='roof';mesh.userData.storey='C1';mesh.userData.materialKey='tile';mesh.userData.studySample=true;}});
  model.layers.get('roof').add(sample.root);samples.push(sample);
 }
 return samples;
}
export function refineModel(model,materials,parameters){const aligned=alignFaceBrackets(model),removed=replaceGalleryRibs(model,parameters),samples=addGallerySamples(model,materials.tile,parameters);return {aligned,removed,samples,records:samples.flatMap(s=>s.records)};}
