import * as T from '../vendor/three.module.js';
import {surfaceY,SPEC} from '../model.js';
import {createRoofSample,SAMPLE} from './roof-sample.js';
export const ROOF={pitch:.32,step:.24,length:.38,radius:.11,start:.08,end:11.84,edgeMargin:.12};
export const isLegacyTile=(r,key)=>r.layer==='roof'&&(key==='tile'||(key==='ridge'&&Math.abs(r.position[1]-8.48)<.001&&Math.abs(r.position[2])>11.9&&Math.abs(r.position[2])<12.02));
export function surfacePoint(side,u,v){
 const angle=[0,Math.PI,Math.PI/2,-Math.PI/2][side];
 const pos=new T.Vector3(u,0,v).applyAxisAngle(new T.Vector3(0,1,0),angle);
 if(side===2)pos.x+=SPEC.ridgeHalf;if(side===3)pos.x-=SPEC.ridgeHalf;
 pos.y=surfaceY(pos.x,pos.z);return pos;
}
export function surfaceOrientation(side,u,v){
 const t=surfacePoint(side,u,v+.005).sub(surfacePoint(side,u,v-.005)).normalize();
 const lateral=surfacePoint(side,u+.005,v).sub(surfacePoint(side,u-.005,v)).normalize();
 const normal=t.clone().cross(lateral).normalize();const x=normal.clone().cross(t).normalize();
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,normal,t));
}
// General patch generator provides tile shells; this adapter owns four-slope clipping/orientation.
export function buildRoofEnvelope(material,p=ROOF){
 const prototype=createRoofSample(material,{parameters:{...SAMPLE,pitch:p.pitch,step:p.step,length:p.length,radius:p.radius}});
 const geometries=new Map(prototype.root.children.map(m=>[m.userData.kind,m.geometry]));
 const root=new T.Group(),records=[],buckets=new Map();
 function add(side,kind,row,col,u,v){
  const disk=kind.startsWith('eave-'),pos=surfacePoint(side,u,disk?p.end:v);
  if(disk){const ahead=surfacePoint(side,u,p.end+.2);pos.x=ahead.x;pos.z=ahead.z;pos.y+=.075;if(kind==='eave-rim'){const ahead2=surfacePoint(side,u,p.end+.22);pos.x=ahead2.x;pos.z=ahead2.z;}}
  else pos.y+=kind==='cover-tile'?.06:.025;
  const q=disk?new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),[0,Math.PI,Math.PI/2,-Math.PI/2][side]):surfaceOrientation(side,u,v);
  const r={id:`foguang/surface-v2/side-${side}/${kind}/${row}/${col}`,kind,layer:'roof',position:pos.toArray(),orientation:q.toArray(),side,u,v,status:'比例推定',source:'zhang-survey:四阿形制；photo-eaves-2024:轮廓；瓦件参数未实测'};records.push(r);
  if(!buckets.has(kind))buckets.set(kind,[]);buckets.get(kind).push({r,m:new T.Matrix4().compose(pos,q,new T.Vector3(1,1,1))});
 }
 const rows=Math.round((p.end-p.start)/p.step);
 for(let side=0;side<4;side++){
  for(let row=0;row<=rows;row++){
   const v=p.start+row*p.step,half=(side<2?SPEC.ridgeHalf:0)+v-p.edgeMargin;
   const cols=Math.floor(half/p.pitch);
   for(let col=-cols;col<=cols;col++){
    const u=col*p.pitch;add(side,'cover-tile',row,col,u,v);
    if(u+p.pitch<half)add(side,'pan-tile',row,col,u+p.pitch/2,v);
    if(row===rows){add(side,'eave-disk',0,col,u,v);add(side,'eave-rim',0,col,u,v);}
   }
  }
 }
 for(const [kind,items]of buckets){const mesh=new T.InstancedMesh(geometries.get(kind),material,items.length);items.forEach(({m},i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.userData={records:items.map(v=>v.r),materialKey:'tile',layer:'roof'};mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);}
 for(const mesh of prototype.root.children)mesh.dispose();
 return {root,records};
}
