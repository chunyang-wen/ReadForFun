import * as T from '../vendor/three.module.js';
// Reversible split: preserve original instances, keep matrices and colors exactly.
export function splitInstances(model,predicate){
 const pairs=[],matrix=new T.Matrix4(),color=new T.Color();let removed=0;
 for(const mesh of [...model.meshes]){
  const records=mesh.userData.records;
  const keep=records.map((r,i)=>({r,i})).filter(({r})=>!predicate(r,mesh.userData.materialKey));
  if(keep.length===records.length)continue;
  const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length);
  keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(n,matrix);if(mesh.instanceColor){mesh.getColorAt(i,color);replacement.setColorAt(n,color);}});
  replacement.userData={...mesh.userData,records:keep.map(({r})=>r)};
  replacement.castShadow=mesh.castShadow;replacement.receiveShadow=mesh.receiveShadow;
  replacement.computeBoundingBox();replacement.computeBoundingSphere();replacement.visible=false;
  mesh.parent.add(replacement);model.meshes.push(replacement);pairs.push([mesh,replacement]);removed+=records.length-keep.length;
 }
 return {removed,pairs,set(enabled){for(const [a,b]of pairs){a.visible=!enabled;b.visible=enabled;}}};
}
export function effectivelyVisible(mesh){for(let o=mesh;o;o=o.parent)if(!o.visible)return false;return true;}
export function activeMeshes(root){const result=[];root.traverse(o=>{if(o.isInstancedMesh&&effectivelyVisible(o))result.push(o);});return result;}
