import * as T from '../vendor/three.module.js';
import {getColumnGrid} from '../model.js';
export const BRACKET={firstOut:.54,secondOut:1.02,width:1.48,woodWidth:.21,armHeight:.315,baseY:5.58,frontZ:8.83};
export const isFrontIntermediate=r=>r.assembly==='外檐补间（简化）'&&r.position[2]>8.5&&Math.abs(r.position[0])<17;
function armGeometry(){const s=new T.Shape();s.moveTo(-.5,.5);s.lineTo(.5,.5);s.lineTo(.5,.15);s.quadraticCurveTo(.35,-.45,0,-.5);s.quadraticCurveTo(-.35,-.45,-.5,.15);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1});g.translate(0,0,-.5);return g;}
// Repeated front type only. Photographic silhouette test; not all seven historical types.
export function buildFrontBrackets(materials,p=BRACKET){
 const root=new T.Group(),records=[],box=new T.BoxGeometry(1,1,1),arm=armGeometry(),buckets=new Map();
 const {xs}=getColumnGrid();
 function add(bay,kind,local,size,g=box,turn=false){
  const x=(xs[bay]+xs[bay+1])/2,pos=[x+local[0],p.baseY+local[1],p.frontZ+local[2]],q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn?Math.PI/2:0);
  const r={id:`foguang/front-intermediate-v2/bay-${bay}/${kind}`,kind,layer:'brackets',position:pos,scale:size,orientation:q.toArray(),status:'图像判读/比例推定',source:'photo-intermediate-2024',limits:'仅前檐代表形态；无隐蔽榫卯，逐攒尺寸未测'};records.push(r);
  if(!buckets.has(g))buckets.set(g,[]);buckets.get(g).push({r,m:new T.Matrix4().compose(new T.Vector3(...pos),q,new T.Vector3(...size))});
 }
 for(let bay=0;bay<7;bay++){
  add(bay,'seat',[0,.13,0],[.55,.26,.48]);
  add(bay,'mudao',[0,.35,0],[1.10,.26,.21],arm);
  add(bay,'hua-1',[0,.42,p.firstOut/2],[p.firstOut+.40,p.armHeight,p.woodWidth],arm,true);
  add(bay,'dou-1',[0,.65,p.firstOut],[.35,.20,.35]);
  add(bay,'cross-1',[0,.88,p.firstOut],[p.width,p.armHeight,p.woodWidth],arm);
  for(const s of [-1,1])add(bay,'dou-1-'+s,[s*.55,1.12,p.firstOut],[.34,.19,.34]);
  add(bay,'hua-2',[0,1.12,p.secondOut/2],[p.secondOut+.43,p.armHeight,p.woodWidth],arm,true);
  add(bay,'dou-2',[0,1.35,p.secondOut],[.35,.20,.35]);
  add(bay,'cross-2',[0,1.57,p.secondOut],[p.width,p.armHeight,p.woodWidth],arm);
  for(const s of [-1,1])add(bay,'dou-2-'+s,[s*.55,1.81,p.secondOut],[.34,.19,.34]);
  add(bay,'timu',[0,2.02,p.secondOut],[1.76,.20,.31]);
 }
 for(const [g,items]of buckets){const m=new T.InstancedMesh(g,materials.wood,items.length);items.forEach((v,i)=>m.setMatrixAt(i,v.m));m.userData={records:items.map(v=>v.r),layer:'brackets',materialKey:'wood'};m.castShadow=m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();root.add(m);}
 return {root,records};
}
