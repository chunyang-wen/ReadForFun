import * as THREE from '../vendor/three.module.js';
import {LAYERS} from './data.js';
const V=a=>new THREE.Vector3(...a),Q=a=>new THREE.Quaternion().setFromAxisAngle(V([0,1,0]),a),C=Math.cos(Math.PI/8);
// Table 1 ORIGINAL data, metres, diameter across opposite sides. Never use optimized Table 5.
const raw=[
['M1',2,8.75,23.69,23.36,4.47,4.42,2.00],
['D2',12.75,2.458,22.70,22.44,4.22,4.21,1.40],
['M2',16.608,4.40,22.44,22.34,4.21,4.17,1.70],
['D3',22.708,1.455,21.70,21.56,4.17,3.84,1.30],
['M3',25.463,4.20,21.56,21.30,3.84,3.81,1.60],
['D4',31.263,1.535,20.54,20.44,3.80,3.77,1.30],
['M4',34.098,3.80,20.44,20.40,3.77,3.76,1.50],
['D5',39.398,1.320,19.46,19.34,3.70,3.68,1.20],
['M5',41.918,3.60,19.34,19.22,3.68,3.64,1.35]];
export const SPEC={levels:raw.map(([id,base,height,bottom,top,centralBottom,centralTop,bracket])=>({id,base,height,bottom,top,centralBottom,centralTop,bracket,dark:id[0]==='D',innerBottom:bottom*(13.334/23.69),innerTop:top*(13.334/23.69)})),buttress:{id:'C1',base:2,height:4.3,bottom:30.27,top:30,centralBottom:4.47,centralTop:4.44,bracket:1.7},roofTop:52.665,finialHeight:11.456};
export const STOREYS=[['all','全塔 · 五明四暗'],['C1','首层回廊'],...SPEC.levels.map(l=>[l.id,`${'一二三四五'[Number(l.id[1])-1]}层${l.dark?'暗层':'明层'}`])];
export function octagon(d,y=0){return Array.from({length:8},(_,i)=>{const a=Math.PI/8+i*Math.PI/4;return [d/(2*C)*Math.sin(a),y,d/(2*C)*Math.cos(a)];});}
export function ringPoints(d,central,y=0){const vs=octagon(d,y),out=[];for(let i=0;i<8;i++){const a=V(vs[i]),b=V(vs[(i+1)%8]),mid=a.clone().add(b).multiplyScalar(.5),u=b.clone().sub(a).normalize();out.push({point:a.toArray(),corner:true,side:i},{point:mid.clone().addScaledVector(u,-central/2).toArray(),corner:false,side:i},{point:mid.clone().addScaledVector(u,central/2).toArray(),corner:false,side:i});}return out;}
export function getColumnGrid(level=0){const l=SPEC.levels[level],outer=ringPoints(l.bottom,l.centralBottom,l.base),inner=octagon(l.innerBottom,l.base).map((point,side)=>({point,corner:true,side}));return {outer,inner};}
const cache=new Map(),geo=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
function prism(points,depth){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;}
const arm=()=>geo('arm',()=>prism([[-.5,.5],[-.5,.02],[-.4,-.1],[-.3,-.5],[.3,-.5],[.4,-.1],[.5,.02],[.5,.5]],1));
export function buildModel(materials,{detailOnly=false}={}){
 const root=new THREE.Group(),layers=new Map(LAYERS.map(l=>{const g=new THREE.Group();g.userData.layer=l.id;root.add(g);return [l.id,g];})),records=[],buckets=new Map(),seq=new Map();
 const boxGeo=geo('box',()=>new THREE.BoxGeometry(1,1,1)),cyl=geo('cylinder',()=>new THREE.CylinderGeometry(1,1,1,16)),douGeo=geo('dou',()=>{const g=new THREE.CylinderGeometry(.707,.43,1,4);g.rotateY(Math.PI/4);return g;});
 function add(layer,type,g,p,s=[1,1,1],q=new THREE.Quaternion(),mat='wood',extra={}){const prefix=extra.key||`${extra.storey||'site'}/${extra.assembly||layer}/${type}`,n=(seq.get(prefix)||0)+1;seq.set(prefix,n);const r={id:`${prefix}/${n}`,layer,type,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'param:图2–8',...extra};records.push(r);const tier=detailOnly?(r.tier||0):0,k=`${layer}:${g.uuid}:${mat}:${r.storey||'site'}:${tier}`;if(!buckets.has(k))buckets.set(k,{layer,g,mat,tier,storey:r.storey||'site',items:[]});buckets.get(k).items.push({r,m:new THREE.Matrix4().compose(V(p),q,V(s))});return r;}
 const box=(l,t,p,s,mat='wood',e={},q=new THREE.Quaternion())=>add(l,t,boxGeo,p,s,q,mat,e);
 function beam(l,t,a,b,w,h,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,boxGeo,V(a).add(V(b)).multiplyScalar(.5).toArray(),[w,d.length(),h],beamQ(d),mat,{endpoints:[a,b],...e});}
 function beamQ(d){const dir=d.clone().normalize();if(Math.abs(dir.y)>.999)return new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),dir);const side=dir.clone().cross(V([0,1,0])).normalize(),up=side.clone().cross(dir).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,dir,up));}
 function round(l,t,a,b,r,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,cyl,V(a).add(V(b)).multiplyScalar(.5).toArray(),[r,d.length(),r],new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],...e});}
 function patch(layer,type,pts,e={},mat='roofBoard'){const g=new THREE.BufferGeometry().setFromPoints(pts.map(V));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return add(layer,type,g,[0,0,0],[1,1,1],new THREE.Quaternion(),mat,e);}
 function dou(p,w,h,q,e={}){add('brackets','dou',douGeo,[p[0],p[1]-h*.18,p[2]],[w,h*.64,w],q,'endgrain',e);for(const a of [-1,1])for(const b of [-1,1])box('brackets','dou',V([a*w*.36,h*.32,b*w*.36]).applyQuaternion(q).add(V(p)).toArray(),[w*.28,h*.36,w*.28],'wood',e,q);}
 function bracket(p,angle,l,kind='plain',assembly=''){const q=Q(angle),P=a=>V(a).applyQuaternion(q).add(V(p)).toArray(),h=l.bracket,w=.17,reach=l.id==='C1'?1.45:l.dark?.65:1.35-(Number(l.id[1])||2)*.07,meta=tier=>({storey:l.id,assembly,tier,source:'param:图3–8；表2截面参考',note:'层位与出跳分配推定；非逐攒54型复原'});
 dou(P([0,.17,0]),.65,.34,q,meta(0));
 // Radial brackets retain an inward tail; profile made independently for this pagoda.
 for(let j=0;j<3;j++){const yy=.42+j*(h-.65)/3,z=reach*(j+1)/3,len=2*(z+.18);add('brackets',kind==='corner'?'corner':'gong',arm(),P([0,yy,0]),[len,.255,w],q.clone().multiply(Q(Math.PI/2)),'wood',meta(j+1));
 for(const sign of [-1,1]){const zz=sign*z;dou(P([0,yy+.2,zz]),.32,.23,q,meta(j+1));if(j>0){add('brackets','gong',arm(),P([0,yy+.36,zz]),[1.16,.255,w],q,'wood',meta(j+1));for(const x of [-.45,.45])dou(P([x,yy+.55,zz]),.28,.20,q,meta(j+1));}}
 }
 if(!l.dark){const yy=h-.30;beam('brackets','ang',P([0,yy+.18,-.8]),P([0,yy-.42,reach+.2]),.17,.255,'darkwood',meta(3));}
 if(kind==='corner'){for(const s of [-1,1])beam('brackets','corner',P([0,.6,0]),P([s*.52,h-.18,reach*.8]),.17,.255,'wood',{...meta(3),status:'待核定',note:'135°转角方向骨架；互锁待核定'});}
 if(kind==='five'){add('brackets','five',arm(),P([0,h-.08,reach]),[2.6,.255,w],q,'wood',{...meta(4),source:'param:页19图20(a)',note:'只用于二层明层外圈平柱；长度推定'});for(let i=-2;i<=2;i++)dou(P([i*.52,h+.14,reach]),.28,.22,q,{...meta(4),fiveIndex:i+2,source:'param:页19图20(a)'});}
 }
 if(detailOnly){
 // Two SEPARATE connections from Figure 8; no Guanyin Pavilion fork feet.
 for(const [cx,insert] of [[-2.8,true],[2.8,false]]){const tag=insert?'insert':'landing';const l={id:tag,bracket:1.9,dark:false};round('columns','column',[cx,-1.8,0],[cx,0,0],.29,'column',{assembly:tag,tier:0});bracket([cx,0,0],0,l,'plain',tag);
 // Receiving radial beam: split round the insertion opening, whole under landing.
 if(insert){for(const [z,len] of [[-.87,1.48],[.60,.94]])box('ties','beam',[cx,2.02,z],[.34,.32,len],'wood',{assembly:tag,tier:4,source:'param:页8图8',note:'穿柱处留0.26m贯通口，教学推定'});
 round('columns','insert',[cx,2.18,0],[cx,4.35,0],.28,'column',{assembly:tag,tier:6,source:'param:页8图8',note:'柱肩落在承托上；柱端下伸为关系示意'});box('columns','insert',[cx,1.89,0],[.22,.58,.22],'darkwood',{assembly:tag,tier:6,source:'param:页8图8'});
 }else{box('ties','beam',[cx,2.02,-.7],[.42,.32,3.6],'wood',{assembly:tag,tier:4,source:'param:页8图8',note:'柱脚直接落梁，不在下层柱中心'});round('columns','landing',[cx,2.18,-.75],[cx,4.35,-.85],.28,'column',{assembly:tag,tier:6,source:'param:页8图8'});round('columns','column',[cx,-1,-2.2],[cx,1.86,-2.2],.24,'column',{assembly:tag,tier:0});beam('ties','brace',[cx,2.25,-1.95],[cx,3.9,-.82],.18,.22,'wood',{assembly:tag,tier:6});}
 }
 }else{
 const eSite={storey:'site',source:'param:页4图2',note:'台基与地下基础未实测'};add('foundation','foundation',geo('platform',()=>new THREE.CylinderGeometry(1,1,1,8)),[0,.4,0],[19,.8,19],Q(Math.PI/8),'stone',eSite);add('foundation','foundation',geo('platform',()=>new THREE.CylinderGeometry(1,1,1,8)),[0,1.4,0],[17.8,1.2,17.8],Q(Math.PI/8),'lightstone',eSite);
 for(let i=0;i<6;i++)box('foundation','foundation',[0,.16+i*.3,18.4-i*.65],[5,.32,1.5],'stone',eSite);
 const allLevels=[SPEC.buttress,...SPEC.levels];
 for(const l of allLevels){const layer=l.dark?'roofFrame':'columns',bottom=ringPoints(l.bottom,l.centralBottom,l.base),top=ringPoints(l.top,l.centralTop,l.base+l.height),innerB=octagon(l.innerBottom||0,l.base),innerT=octagon(l.innerTop||0,l.base+l.height),meta={storey:l.id,level:l.id,source:'param:页13表1；页4–8图2–8'};
 // The low buttress ring is not a duplicated full-height storey.
 for(let i=0;i<24;i++){const a=bottom[i].point,b=top[i].point,col=round(layer,l.dark?'hidden':'column',a,b,l.id==='M1'?.40:l.dark?.29:.31,'column',{...meta,ring:'outer',assembly:`${l.id}/outer-${i}`,note:'外圈柱脚/柱头各独立；柱径、标高拆分推定'});if(l.base===2)add('foundation','base',cyl,[a[0],1.88,a[2]],[.65,.24,.65],new THREE.Quaternion(),'lightstone',{...meta,supports:col.id});
 const next=top[(i+1)%24].point;beam('ties','tie',[b[0],b[1]-.25,b[2]],[next[0],next[1]-.25,next[2]],.24,.36,'darkwood',{...meta,ring:'outer',supports:[col.id]});
 const angle=Math.atan2(b[0],b[2]);bracket(b,angle,l,top[i].corner?'corner':l.id==='M2'?'five':'plain',`${l.id}/outer-${i}`);
 }
 if(l.id!=='C1')for(let i=0;i<8;i++){const a=innerB[i],b=innerT[i],n=innerT[(i+1)%8],col=round(layer,l.dark?'hidden':'column',a,b,l.id==='M1'?.46:.34,'column',{...meta,ring:'inner',assembly:`${l.id}/inner-${i}`,note:'内圈坐标随外圈比例推定，非逐层实测'});if(l.base===2)add('foundation','base',cyl,[a[0],1.88,a[2]],[.70,.24,.70],new THREE.Quaternion(),'lightstone',{...meta,supports:col.id});beam('ties','tie',[b[0],b[1]-.25,b[2]],[n[0],n[1]-.25,n[2]],.28,.36,'darkwood',{...meta,ring:'inner'});bracket(b,Math.atan2(b[0],b[2])+Math.PI,l,'plain',`${l.id}/inner-${i}`);}
 if(l.id==='C1')continue;
 // Radial beams end on the outer and inner bracket heads. Upper column feet land on these beams.
 const beamY=l.base+l.height+l.bracket-.18;
 for(let i=0;i<24;i++){const p=top[i].point,inner=V(p).multiplyScalar(l.innerTop/l.top);inner.y=beamY;beam('ming','beam',[p[0],beamY,p[2]],inner.toArray(),.34,.36,'wood',{...meta,ring:'radial',assembly:`${l.id}/radial-${i}`,note:'跨圈梁顶=下一柱脚控制面，截面推定'});}
 // Ring beam under every successive column foot, not a floating stack of towers.
 const nextLevel=SPEC.levels[SPEC.levels.indexOf(l)+1];
 if(nextLevel){for(const [d,c] of [[nextLevel.bottom,nextLevel.centralBottom],[nextLevel.innerBottom,0]]){const pts=c?ringPoints(d,c,beamY).map(x=>x.point):octagon(d,beamY);for(let i=0;i<pts.length;i++)beam('ming','beam',pts[i],pts[(i+1)%pts.length],.34,.36,'wood',{...meta,supportsStorey:nextLevel.id,note:'柱脚下环梁是关系化承托，真实多层梁栱配合待核定'});}}
 if(l.dark){const bs=bottom.map(x=>x.point),ts=top.map(x=>x.point),yy=l.base+.10,upper=l.base+l.height-.15;
 // V bracing along every individual outer bay, plus radial bracing, each anchored to the frame.
 for(let i=0;i<24;i++){const j=(i+1)%24,mid=V(bs[i]).add(V(bs[j])).multiplyScalar(.5);mid.y=yy;for(const k of [i,j])beam('roofFrame','brace',mid.toArray(),[ts[k][0],upper,ts[k][2]],.16,.20,'wood',{...meta,direction:'chord',note:'图2(c)、5判读：V撑规则化；端部卯口未建'});beam('roofFrame','tie',[bs[i][0],yy,bs[i][2]],[bs[j][0],yy,bs[j][2]],.22,.25,'darkwood',meta);}
 for(let i=0;i<8;i++){const p=bs[i*3],b=innerB[i],mid=V(p).add(V(b)).multiplyScalar(.5);mid.y=yy;for(const t of [ts[i*3],innerT[i]])beam('roofFrame','brace',mid.toArray(),[t[0],upper,t[2]],.20,.24,'wood',{...meta,direction:'radial'});beam('roofFrame','beam',[p[0],yy,p[2]],[b[0],yy,b[2]],.30,.28,'wood',meta);}
 }else if(l.id!=='M1'){
 const floorOuter=l.bottom+1.5,po=octagon(floorOuter,l.base-.08),pi=octagon(l.innerBottom,l.base-.08);
 for(let i=0;i<8;i++){patch('ming','floor',[po[i],po[(i+1)%8],pi[(i+1)%8],pi[i]],{...meta,zone:'annulus'},'ceilingPanel');patch('ming','floor',[[0,l.base-.08,0],pi[i],pi[(i+1)%8],[0,l.base-.08,0]],{...meta,zone:'center'},'ceilingPanel');}
 const pr=octagon(floorOuter,l.base);for(let i=0;i<8;i++){const j=(i+1)%8;for(const y of [.40,1.05])beam('ceiling','railing',[pr[i][0],l.base+y,pr[i][2]],[pr[j][0],l.base+y,pr[j][2]],.10,.12,'darkwood',meta);for(let k=0;k<10;k++){const p=V(pr[i]).lerp(V(pr[j]),k/10);beam('ceiling','railing',p.toArray(),[p.x,l.base+1.05,p.z],.075,.075,'wood',meta);}}
 }
 // First-storey inner earthen ring: separate removable shell, central space stays open.
 if(l.id==='M1'){const ps=octagon(l.innerBottom,l.base);for(let i=0;i<8;i++){const a=V(ps[i]),b=V(ps[(i+1)%8]);for(const [u,v] of [[0,.32],[.68,1]])beam('enclosure','enclosure',a.clone().lerp(b,u).setY(l.base+l.height/2).toArray(),a.clone().lerp(b,v).setY(l.base+l.height/2).toArray(),.30,l.height,'plaster',{...meta,ring:'inner',note:'图4内圈土壁；开口尺寸推定，无壁画'});}}
 // Earth enclosure on the first main storey; upper window screens are sparse, reversible.
 if(!l.dark){const pts=octagon(l.bottom,l.base);for(let i=0;i<8;i++){const a=V(pts[i]),b=V(pts[(i+1)%8]),mid=a.clone().lerp(b,.5);if(l.id==='M1'){for(const [u,v] of [[0,.32],[.68,1]])beam('enclosure','enclosure',[...a.clone().lerp(b,u).setY(l.base+l.height/2).toArray()],[...a.clone().lerp(b,v).setY(l.base+l.height/2).toArray()],.24,l.height,'plaster',meta);}else{for(let k=1;k<12;k++){const p=a.clone().lerp(b,k/12);beam('enclosure','enclosure',[p.x,l.base+1.3,p.z],[p.x,l.base+l.height-.5,p.z],.055,.055,'door',meta);}beam('enclosure','enclosure',[a.x,l.base+.8,a.z],[b.x,l.base+.8,b.z],.12,.38,'door',meta);}
 if(i===7&&['M2','M4'].includes(l.id)){const dir=b.clone().sub(a).normalize();beam('ceiling','plaque',mid.clone().addScaledVector(dir,-1.35).setY(l.base+l.height-.65).toArray(),mid.clone().addScaledVector(dir,1.35).setY(l.base+l.height-.65).toArray(),.18,.65,'darkwood',{...meta,status:'待核定',note:'匾额载体，未写书法文字'});}}
 }
 }
 // Independent roof profiles: first gallery, four open skirts, then the top pyramid.
 const roofSpecs=[{id:'C1',low:8,high:11.6,outer:34.4,inner:24.2},...SPEC.levels.filter(l=>!l.dark&&l.id!=='M5').map((l,i)=>({id:l.id,low:l.base+l.height+l.bracket-.32,high:l.base+l.height+l.bracket+2.3,outer:l.top+5.5-i*.35,inner:l.top-1.2})),{id:'M5',low:46.868,high:SPEC.roofTop,outer:24.1,inner:.7}];
 for(const rs of roofSpecs){const top=rs.id==='M5',meta={storey:rs.id,level:rs.id,source:top?'param:页7图7':'param:页4图2；页6图4–5',note:'檐出、曲率、槫道和椽距比例推定'};
 const point=(side,t,u,dy=0)=>{const d=rs.outer+(rs.inner-rs.outer)*t,vs=octagon(d,rs.low+(rs.high-rs.low)*Math.pow(t,1.35)+dy);return V(vs[side]).lerp(V(vs[(side+1)%8]),u).toArray();};
 for(let i=0;i<8;i++){
 for(let k=0;k<12;k++){const t=k/12,tt=(k+1)/12;patch('roof','roof',[point(i,t,0),point(i,t,1),point(i,tt,1),point(i,tt,0)],meta);}
 // Ring purlins set just below the underside of every sloping rafter.
 for(let k=0;k<=4;k++){const t=k/4;round('purlins','purlin',point(i,t,0,-.21),point(i,t,1,-.21),.14,'wood',meta);}
 const cnt=Math.ceil(rs.outer*Math.tan(Math.PI/8)/.40);
 for(let j=1;j<cnt;j++){const u=j/cnt;for(let k=0;k<12;k++){const t=k/12,tt=(k+1)/12;round('rafters','rafter',point(i,t,u,-.055),point(i,tt,u,-.055),.055,'rafter',meta);round('roof','roof',point(i,t,u,.05),point(i,tt,u,.05),.044,'tile',meta);}}
 for(let k=0;k<12;k++)beam('rafters','hip',point(i,k/12,0,-.10),point(i,(k+1)/12,0,-.10),.26,.32,'darkwood',meta);
 // Supporting inclined beams connect inner edge and bracket head; independent from decorative tile ribs.
 for(const u of [0,.5]){for(let k=0;k<4;k++)beam('purlins','frame',point(i,k/4,u,-.4),point(i,(k+1)/4,u,-.4),.24,.30,'wood',meta);}
 for(let k=0;k<12;k++)round('roof','roof',point(i,k/12,0,.08),point(i,(k+1)/12,0,.08),.12,'ridge',meta);
 }
 if(top){const l=SPEC.levels.at(-1),y=l.base+l.height+l.bracket-.18,ir=l.innerTop;const ip=octagon(ir,y);for(let i=0;i<8;i++){beam('purlins','frame',ip[i],ip[(i+1)%8],.4,.55,'wood',meta);beam('purlins','frame',ip[i],[0,y,0],.36,.55,'wood',meta);for(let k=1;k<=3;k++){const t=k/4,p=point(i,t,0,-.55);beam('purlins','frame',[p[0],y,p[2]],p,.24,.24,'wood',meta);}}
 round('purlins','frame',[0,y,0],[0,SPEC.roofTop-.45,0],.32,'wood',meta);
 const start=SPEC.roofTop+.10;add('ceiling','finial',geo('finialbase',()=>new THREE.CylinderGeometry(1.1,1.7,1.7,8)),[0,start+.85,0],[1,1,1],new THREE.Quaternion(),'metal',meta);round('ceiling','finial',[0,start+1.7,0],[0,SPEC.roofTop+SPEC.finialHeight,0],.11,'metal',meta);for(let i=0;i<7;i++)add('ceiling','finial',geo('ring',()=>new THREE.TorusGeometry(1,.075,8,32)),[0,start+2.4+i*.65,0],[1-i*.055,1-i*.055,1],new THREE.Quaternion().setFromAxisAngle(V([1,0,0]),Math.PI/2),'metal',{...meta,note:'相轮数量与装饰细部近似，非原构件统计'});add('ceiling','finial',geo('orb',()=>new THREE.SphereGeometry(1,16,12)),[0,start+8,0],[.65,.75,.65],new THREE.Quaternion(),'metal',meta);
 }
 }
 }
 const meshes=[];for(const b of buckets.values()){const m=new THREE.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);m.userData={records:b.items.map(i=>i.r),materialKey:b.mat,layer:b.layer,tier:b.tier,storey:b.storey};b.items.forEach((v,i)=>m.setMatrixAt(i,v.m));m.castShadow=true;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.layer).add(m);meshes.push(m);}root.updateMatrixWorld(true);return {root,layers,records,meshes,detailOnly};
}
