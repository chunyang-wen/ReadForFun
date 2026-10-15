import * as T from '../../vendor/three.module.js';
import {roofY,ROOF} from '../model.js';
import {buildRoofPatch} from '../../realism-workflow/roof-patch.js';
export const SAMPLE={halfWidth:2.24,pitch:.28,start:5.64,end:8.64,step:.30,length:.43,radius:.08};
export const isReplacedRib=(r,p=SAMPLE)=>r.layer==='roof'&&r.type==='roof'&&r.endpoints&&Math.abs(r.position[0])<=p.halfWidth&&r.position[2]>0&&r.endpoints.every(a=>a[2]>=p.start-.18&&a[2]<=ROOF.halfZ+.01)&&Math.abs(r.endpoints[0][0]-r.endpoints[1][0])<1e-6;
export function createRoofSample(material,{parameters=SAMPLE}={}){
 const patch=buildRoofPatch(material,{parameters,height:z=>roofY(z)+.16,namespace:'dule/upper-south',source:'commons-2020:瓦垄及瓦口形态；无标尺；瓦尺寸比例推定',refined:true});
 // Neutral, constant instance colors isolate geometry from material changes.
 for(const mesh of patch.root.children)for(let i=0;i<mesh.count;i++)mesh.setColorAt(i,new T.Color(0xffffff));
 patch.root.userData.layer='roof';return patch;
}
export function replaceSampleRibs(model,p=SAMPLE){
 let removed=0;
 for(const mesh of [...model.meshes]){
 const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(({r})=>!isReplacedRib(r,p));
 if(keep.length===mesh.count)continue;removed+=mesh.count-keep.length;
 const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length),matrix=new T.Matrix4();
 keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(n,matrix);});
 replacement.userData={...mesh.userData,records:keep.map(({r})=>r)};replacement.castShadow=replacement.receiveShadow=true;
 replacement.computeBoundingBox();replacement.computeBoundingSphere();const parent=mesh.parent;parent.remove(mesh);parent.add(replacement);
 model.meshes[model.meshes.indexOf(mesh)]=replacement;mesh.dispose();
 }return removed;
}
