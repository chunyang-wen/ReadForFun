import * as T from '../vendor/three.module.js';
import {getColumnGrid} from '../model.js';
export const ENCLOSURE={frontZ:8.78,backZ:-8.84,sideX:17.03,wallThickness:.34,base:.53,doorTop:4.65,lintelTop:4.96,headTop:5.58,infillTop:7.62,plasterInset:.16,doorOpenDegrees:78};
// Visible 2024 facade. Heights/thickness remain proportional; no concealed joinery invented.
export function buildEnclosure(materials,p=ENCLOSURE){
 const root=new T.Group(),records=[],leaves=[],buckets=new Map(),box=new T.BoxGeometry(1,1,1);
 function add(kind,id,pos,size,mat='plaster',parent=root,extra={}){
  const key=parent.uuid+'|'+mat;
  if(!buckets.has(key))buckets.set(key,{parent,mat,items:[]});
  const r={id:'foguang/enclosure-v2/'+id,kind,layer:'enclosure',position:pos,scale:size,status:'比例推定',source:'edb-facade:五门两窗；photo-front-2024/photo-intermediate-2024:形态；尺寸推定',...extra};records.push(r);buckets.get(key).items.push({r,m:new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion(),new T.Vector3(...size))});return r;
 }
 const {xs,zs}=getColumnGrid(),height=p.headTop-p.base;
 // Rear and gable bodies reach the head tie; render red wall coat separately from pale base.
 for(const side of [-1,1]){
  add('gable-wall',`side-${side}/body`,[side*p.sideX,(p.base+p.headTop)/2,0],[p.wallThickness,height,17.4],'wallRed');
  add('wall-plinth',`side-${side}/plinth`,[side*(p.sideX+.02),.94,0],[p.wallThickness+.025,.82,17.4],'lightstone');
 }
 add('rear-wall','rear/body',[0,(p.base+p.headTop)/2,p.backZ],[33.7,height,p.wallThickness],'wallRed');
 add('wall-plinth','rear/plinth',[0,.94,p.backZ-.02],[33.7,.82,p.wallThickness+.025],'lightstone');
 for(let bay=0;bay<7;bay++){
  const left=xs[bay]+.34,right=xs[bay+1]-.34,w=right-left,mid=(left+right)/2,id=`front/bay-${bay}`;
  add('door-lintel',id+'/lintel',[mid,(p.doorTop+p.lintelTop)/2,p.frontZ],[w,p.lintelTop-p.doorTop,.22],'door');
  add('head-infill',id+'/head-infill',[mid,(p.lintelTop+p.headTop)/2,p.frontZ-.035],[w,p.headTop-p.lintelTop,.18]);
  for(const x of [left+.055,right-.055])add('jamb',id+'/jamb-'+(x<mid?'left':'right'),[x,(p.base+p.doorTop)/2,p.frontZ+.01],[.11,p.doorTop-p.base,.19],'door');
  if(bay===0||bay===6){
   add('window-sill-wall',id+'/sill-wall',[mid,1.18,p.frontZ-.02],[w,1.30,.25],'lightstone');
   const bottom=1.87,top=4.49;const count=Math.round(w/.18);
   for(let k=0;k<count;k++)add('window-mullion',id+`/mullion-${k}`,[left+(k+.5)*w/count,(bottom+top)/2,p.frontZ+.03],[.055,top-bottom,.065],'darkwood');
   for(const y of [bottom,3.05,top])add('window-rail',id+'/rail-'+y,[mid,y,p.frontZ+.02],[w,.11,.14],'door');
  }else{
   add('threshold',id+'/threshold',[mid,.61,p.frontZ],[w,.17,.27],'darkwood');
   const leafWidth=(w-.20)/2;
   for(const sign of [-1,1]){
    const group=new T.Group();group.position.set(sign<0?left+.10:right-.10,0,p.frontZ);root.add(group);
    leaves.push({group,sign,bay});
    const prefix=id+`/leaf-${sign<0?'left':'right'}`;
    for(let plank=0;plank<5;plank++)add('door-plank',prefix+`/plank-${plank}`,[-sign*(plank+.5)*leafWidth/5,(.71+p.doorTop)/2,0],[leafWidth/5-.009,p.doorTop-.71,.12],'door',group,{bay,leaf:sign<0?'left':'right',coordinateSpace:'hinge-local'});
    for(const y of [1.08,2.20,3.48,4.35]){
     add('door-batten',prefix+'/batten-'+y,[-sign*leafWidth/2,y,-.08],[leafWidth,.085,.075],'darkwood',group);
     // Plain fasteners, no unverified nail count or decorative iconography claimed.
    }
   }
  }
 }
 // Backing around front bracket assemblies. Each bay split around the midpoint bracket;
 // panels sit behind the visible wood, not an opaque shell in front of it.
 function infill(side,coords,axis,plane){
  for(let i=0;i<coords.length-1;i++){
   const a=coords[i]+.43,b=coords[i+1]-.43,mid=(a+b)/2;
   for(const [j,l,r]of [[0,a,mid-.24],[1,mid+.24,b]]){
    const pos=axis==='x'?[(l+r)/2,(p.headTop+p.infillTop)/2,plane]:[plane,(p.headTop+p.infillTop)/2,(l+r)/2];
    const size=axis==='x'?[r-l,p.infillTop-p.headTop,.13]:[.13,p.infillTop-p.headTop,r-l];
    add('bracket-backing',`${side}/bay-${i}/backing-${j}`,pos,size,'backing');
   }
  }
 }
 infill('front',xs,'x',p.frontZ-p.plasterInset);
 infill('rear',xs,'x',p.backZ+.17);
 infill('north',zs,'z',p.sideX-.17);infill('south',zs,'z',-p.sideX+.17);
 for(const b of buckets.values()){
  const m=new T.InstancedMesh(box,materials[b.mat]||materials.wood,b.items.length);
  b.items.forEach(({r,m:matrix},i)=>m.setMatrixAt(i,matrix));
  m.userData={records:b.items.map(i=>i.r),materialKey:b.mat,layer:'enclosure'};m.castShadow=m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();b.parent.add(m);
 }
 return {root,records,leaves,setDoorOpen(open){for(const {group,sign,bay}of leaves)group.rotation.y=bay===3&&open?sign*p.doorOpenDegrees*Math.PI/180:0;}};
}
