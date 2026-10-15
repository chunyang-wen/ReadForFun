import * as T from '../../vendor/three.module.js';
// Table 4, p30 gives paired jump totals, not each individual jump.
// Restrict this experiment to the southern lower-eave local assembly.
export const LOWER_REACH={old:[.410,.820,1.230,1.640],trial:[.420,.840,1.240,1.640],status:'文献明确：一二跳合计0.840m、三四跳合计0.800m；各对内等分为比例推定'};
export function applyPairedReach(detail){
 let changed=0;const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
 for(const mesh of detail.meshes)for(let i=0;i<mesh.count;i++){
  const r=mesh.userData.records[i];if(r.assembly!=='南檐局部'||r.tier<1||r.tier>4)continue;
  const delta=LOWER_REACH.trial[r.tier-1]-LOWER_REACH.old[r.tier-1];
  if(!delta)continue;mesh.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  if(r.type==='hua'){position.z+=delta/2;scale.x+=delta;}
  else if(position.z>0)position.z+=delta;else continue;
  mesh.setMatrixAt(i,new T.Matrix4().compose(position,rotation,scale));
  r.position=position.toArray();r.scale=scale.toArray();r.source='dpm-scale:页30表四';r.note=LOWER_REACH.status;r.parameterRevision='paired-reach-01';changed++;
 }
 for(const mesh of detail.meshes){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}
 return changed;
}
