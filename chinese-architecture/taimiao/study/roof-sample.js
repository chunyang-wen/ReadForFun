import * as T from '../../vendor/three.module.js';
import {upperHeight} from '../model.js';
import {buildRoofPatch} from '../../realism-workflow/roof-patch.js';

// Visual hypothesis, not a measured tile schedule. Metres; Y up, +Z south.
export const SAMPLE={halfWidth:3.36,pitch:.32,start:11.6,end:14.5,step:.29,length:.42,radius:.11};
export const isReplacedRib=(r,p=SAMPLE)=>r.key.startsWith('rib/front/1/')&&Math.abs(r.position[0])<p.halfWidth;

export function createRoofSample(material,{parameters=SAMPLE,refined=false}={}){
  return buildRoofPatch(material,{parameters,height:upperHeight,namespace:'taimiao-study',source:'vb-eaves: 太庙照片轮廓参考；尺寸与釉色未实测',refined});
}

// Remove only the same visible patch, keeping the original model instance records intact.
export function replaceSampleRibs(model,p=SAMPLE){
  let removed=0;
  for(const mesh of [...model.meshes]){
    const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(({r})=>!(isReplacedRib(r,p)&&r.position[2]>=p.start-.3&&r.position[2]<=p.end));
    if(keep.length===mesh.count)continue;
    removed+=mesh.count-keep.length;
    const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length),matrix=new T.Matrix4();
    keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(n,matrix);});
    replacement.userData={...mesh.userData,records:keep.map(({r})=>r)};
    replacement.castShadow=replacement.receiveShadow=true;
    replacement.computeBoundingBox();replacement.computeBoundingSphere();
    const parent=mesh.parent;parent.remove(mesh);parent.add(replacement);
    model.meshes[model.meshes.indexOf(mesh)]=replacement;mesh.dispose();
  }
  return removed;
}
