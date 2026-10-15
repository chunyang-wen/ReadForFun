import * as T from '../vendor/three.module.js';
import {surfaceY} from '../model.js';
import {buildRoofPatch} from '../realism-workflow/roof-patch.js';
export const SAMPLE={halfWidth:2.4,pitch:.32,start:9.2,end:11.84,step:.24,length:.38,radius:.11};
export function isReplacedRib(record,key,p=SAMPLE){
 const [x,y,z]=record.position;
 return record.layer==='roof'&&Math.abs(x)<p.halfWidth&&((key==='tile'&&z>=p.start-.24&&z<=p.end+.24)||(key==='ridge'&&z>11.9&&z<12.02&&Math.abs(y-8.48)<.001));
}
export function replaceSampleRibs(model,p=SAMPLE){
 let removed=0;
 for(const mesh of [...model.meshes]){
  const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(({r})=>!isReplacedRib(r,mesh.userData.materialKey,p));
  if(keep.length===mesh.count)continue;
  removed+=mesh.count-keep.length;
  const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length),matrix=new T.Matrix4();
  keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(n,matrix);});
  replacement.userData={...mesh.userData,records:keep.map(({r})=>r)};
  replacement.castShadow=mesh.castShadow;replacement.receiveShadow=true;
  replacement.computeBoundingBox();replacement.computeBoundingSphere();
  mesh.parent.add(replacement);mesh.parent.remove(mesh);model.meshes[model.meshes.indexOf(mesh)]=replacement;mesh.dispose();
 }
 return removed;
}
export function createRoofSample(material,{parameters=SAMPLE}={}){
 const patch=buildRoofPatch(material,{parameters,height:z=>surfaceY(0,z),namespace:'foguang/west-eave/v1',source:'photo-eaves-2024:轮廓参考；瓦件尺寸比例推定',refined:true});
 // Do not import the Qing palace pointed drip silhouette from the generic trial.
 const drip=patch.root.children.find(m=>m.userData.kind==='drip-edge');
 if(drip){patch.root.remove(drip);drip.geometry.dispose();drip.dispose();}
 patch.records=patch.records.filter(r=>r.kind!=='drip-edge');
 for(const mesh of patch.root.children){
  mesh.userData.layer='roof';mesh.userData.materialKey='tile';
  for(let i=0;i<mesh.count;i++)mesh.setColorAt(i,new T.Color(1,1,1));
 }
 return patch;
}
