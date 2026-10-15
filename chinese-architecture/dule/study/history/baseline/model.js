import * as THREE from '../vendor/three.module.js';
import {LAYERS} from './data.js';
// Dimensions are metres. Survey aggregates are not silently distributed to individual members.
export const SPEC={bays:[3.35,4.32,4.665,4.325,3.34],depths:[3.35,3.69,3.71,3.34],
 levels:[{id:'lower',base:.55,height:4.01,bracket:2.01,reach:1.64,bays:[3.35,4.32,4.665,4.325,3.34],depths:[3.35,3.69,3.71,3.34]},
 {id:'middle',base:6.57,height:2.50,bracket:1.65,reach:1.13,bays:[2.98,4.31,4.54,4.31,2.98],depths:[2.98,3.7,3.7,2.98]},
 {id:'upper',base:10.72,height:2.735,bracket:2.175,reach:1.84,bays:[2.94,4.36,4.46,4.37,2.95],depths:[2.94,3.65,3.63,2.95]}],roofRise:4.78};
const V=a=>new THREE.Vector3(...a),Y=a=>new THREE.Quaternion().setFromAxisAngle(V([0,1,0]),a);
const axis=spans=>{let x=-spans.reduce((a,b)=>a+b,0)/2;return [x,...spans.map(s=>x+=s)];};
export function getColumnGrid(level=0){const l=SPEC.levels[level],xs=axis(l.bays),zs=axis(l.depths),outer=[],inner=[];
 for(let i=0;i<xs.length;i++)for(let j=0;j<zs.length;j++){const p={x:xs[i],z:zs[j],i,j,id:`${l.id}-${i}-${j}`};if(i===0||j===0||i===5||j===4)outer.push(p);else if(j===1||j===3||i===1||i===4)inner.push(p);}
 return {xs,zs,outer,inner};}
export const ROOF={eaveY:15.63,ridgeY:20.41,halfX:11.70,halfZ:8.84,ridgeHalf:6.75,breakZ:3.89};
export function roofY(d){const t=Math.min(1,Math.abs(d)/ROOF.halfZ);return ROOF.ridgeY-(ROOF.ridgeY-ROOF.eaveY)*Math.pow(t,.77);}
export function surfaceY(x,z){const endD=ROOF.breakZ+Math.max(0,Math.abs(x)-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ);return roofY(Math.max(Math.abs(z),Math.abs(x)>ROOF.ridgeHalf?endD:0));}
const cached=new Map();const G=(key,f)=>{if(!cached.has(key))cached.set(key,f());return cached.get(key);};
function prism(points,depth){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;}
const arm=()=>G('arm',()=>prism([[-.5,.13],[-.5,-.03],[-.38,-.05],[-.26,-.16],[.26,-.16],[.38,-.05],[.5,-.03],[.5,.13]],1));
const douGeo=()=>G('dou',()=>{const g=new THREE.CylinderGeometry(.707,.46,1,4,1);g.rotateY(Math.PI/4);return g;});
function footGeo(side){return G(`foot-${side}`,()=>{const pts=[];const r=.255;const angle=Math.acos(.115/r);for(let i=0;i<=20;i++){let a=-angle+2*angle*i/20;pts.push([side*r*Math.cos(a),r*Math.sin(a)]);}const g=prism(pts,.42);g.rotateX(-Math.PI/2);return g;});}
function patch(points){const positions=[],indices=[];for(const p of points)positions.push(...p);for(let i=0;i<points.length/2-1;i++){let a=2*i;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;}
export function buildModel(materials,{detailOnly=false}={}){
 const root=new THREE.Group(),layers=new Map(LAYERS.map(l=>{const g=new THREE.Group();g.userData.layer=l.id;root.add(g);return [l.id,g];}));
 const records=[],bucket=new Map(),counts=new Map();const boxGeo=G('box',()=>new THREE.BoxGeometry(1,1,1)),cyl=G('cyl',()=>new THREE.CylinderGeometry(1,1,1,20));
 function add(layer,type,g,p,s=[1,1,1],q=new THREE.Quaternion(),mat='wood',extra={}){const prefix=extra.key||`${layer}/${type}`,n=(counts.get(prefix)||0)+1;counts.set(prefix,n);const record={id:`${prefix}/${n}`,layer,type,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'scale:图六、七',...extra};records.push(record);
 const tier=detailOnly?(extra.tier||0):0,k=`${layer}:${g.uuid}:${mat}:${tier}`;if(!bucket.has(k))bucket.set(k,{layer,g,mat,tier,items:[]});bucket.get(k).items.push({record,m:new THREE.Matrix4().compose(V(p),q,V(s))});return record;}
 const box=(l,t,p,s,mat='wood',e={},q=new THREE.Quaternion())=>add(l,t,boxGeo,p,s,q,mat,e);
 function beam(l,t,a,b,w,h,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,boxGeo,V(a).add(V(b)).multiplyScalar(.5).toArray(),[w,d.length(),h],new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],...e});}
 function round(l,t,a,b,r,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,cyl,V(a).add(V(b)).multiplyScalar(.5).toArray(),[r,d.length(),r],new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],...e});}
 function dou(p,w,h,q,e){add('brackets','dou',douGeo(),[p[0],p[1]-h*.15,p[2]],[w,h*.7,w],q,'endgrain',e);for(const a of [-1,1])for(const b of [-1,1]){const v=V([a*w*.34,h*.33,b*w*.34]).applyQuaternion(q).add(V(p));box('brackets','dou',v.toArray(),[w*.32,h*.3,w*.32],'wood',e,q);}}
 function bracket(x,y,z,angle,{reach=1.64,total=2.01,kind='lower',tag='',inner=false}={}){const q=Y(angle),P=a=>V(a).applyQuaternion(q).add(V([x,y,z])).toArray(),h=total/5.6,w=kind==='middle'?.235:.27,meta=tier=>({tier,assembly:tag,key:`${tag}/tier-${tier}`,note:inner?'内槽跳数与槽位简化':'合计出跳据表四；逐跳等分，非逐件测绘'});
 dou(P([0,.13,0]),.68,.30,q,meta(0));
 for(let k=0;k<4;k++){const out=reach*(k+1)/4,hy=.32+k*h,back=inner?.5:kind==='lower'?3.35:1.15;
 add('brackets','hua',arm(),P([0,hy,(out-back)/2]),[out+back,.27,w],q.clone().multiply(Y(Math.PI/2)),'wood',meta(k+1));
 for(const d of [out,-Math.min(back,.7+k*.16)]){dou(P([0,hy+.23,d]),.33,.22,q,meta(k+1));add('brackets','gong',arm(),P([0,hy+.43,d]),[1.2+k*.11,.27,w],q,'wood',meta(k+1));for(const a of [-1,1])dou(P([a*(.44+k*.045),hy+.64,d]),.29,.20,q,meta(k+1));}}
 box('brackets','beam',P([0,total-.07,reach]),[1.8,.22,.32],'wood',meta(5),q);
 }
 function column(p,base,height,level,ring,fork=false){const e={key:`${level}/${ring}/${p.i}-${p.j}`,level,ring,grid:[p.i,p.j],status:'图像判读',support:level==='lower'?'柱础':'下层铺作',note:'柱头坐标控制；未表达侧脚、生起和不规则截面'};const r=level==='lower'?.255:.245;
 if(fork){const seatQ=Y(p.j===0||p.j===4?0:Math.PI/2);box('brackets','beam',[p.x,base+.21,p.z],[.22,.42,1.15],'darkwood',{...e,tier:5,key:`${e.key}/fork-seat`,note:'槽宽 0.23、横木宽 0.22 均为配合演示；非实测'},seatQ);for(const side of [-1,1])add('columns','fork',footGeo(side),[p.x,base+.21,p.z],[1,1,1],seatQ,'column',{...e,source:'scale:图三',tier:6,slotWidth:.23,slotDepth:.42});add('columns','column',cyl,[p.x,base+.42+(height-.42)/2,p.z],[r,height-.42,r],new THREE.Quaternion(),'column',{...e,tier:6});}
 else add('columns','column',cyl,[p.x,base+height/2,p.z],[r,height,r],new THREE.Quaternion(),'column',e);
 }
 function ringTies(points,y,level,inner=false){for(const p of points)for(const d of [[1,0],[0,1]]){const b=points.find(b=>b.i===p.i+d[0]&&b.j===p.j+d[1]);if(!b)continue;
 if(level==='upper'&&inner&&p.j===3&&p.i===2&&b.i===3)continue;
 const e={key:`${level}/tie/${p.i}-${p.j}/${b.i}-${b.j}`,level,support:'柱头',status:'图像判读'};
 beam('ties','tie',[p.x,y-.19,p.z],[b.x,y-.19,b.z],.22,.38,'wood',e);if(inner)beam('ties','tie',[p.x,y+.055,p.z],[b.x,y+.055,b.z],.46,.12,'darkwood',e);}}
 function floorBand(y,grid,level){const {xs,zs}=grid,x0=xs[0],x1=xs[1],x4=xs[4],x5=xs[5],z0=zs[0],z1=zs[1],z3=zs[3],z4=zs[4];
 // Individual floor boards avoid closing the central void. Western stair openings are explicit.
 for(let x=x0+.12;x<x5;x+=.25)for(const [a,b] of [[z0,z1],[z3,z4]])box('ming','floor',[x,y,(a+b)/2],[.245,.16,b-a],'ceiling',{level,key:`${level}/floor/north-south`});
 for(let z=z1+.12;z<z3;z+=.25){box('ming','floor',[(x4+x5)/2,y,z],[x5-x4,.16,.245],'ceiling',{level,key:`${level}/floor/east`});if(Math.abs(z)>2.6)box('ming','floor',[(x0+x1)/2,y,z],[x1-x0,.16,.245],'ceiling',{level,key:`${level}/floor/west`});}
 }
 function rail(a,b,y,level){const len=V(b).sub(V(a)).length(),n=Math.ceil(len/.9);for(let i=0;i<=n;i++){const p=V(a).lerp(V(b),i/n);round('ceiling','railing',[p.x,y,p.z],[p.x,y+1,p.z],.055,'darkwood',{level});}
 for(const h of [.28,.75,1])beam('ceiling','railing',[a[0],y+h,a[2]],[b[0],y+h,b[2]],.07,.08,'wood',{level});}
 function surface(l,t,points,mat='roofBoard',e={}){add(l,t,patch(points),[0,0,0],[1,1,1],new THREE.Quaternion(),mat,e);}
 function roofLong(sign){const pts=[];for(let k=0;k<=36;k++){const z=sign*ROOF.halfZ*k/36,d=Math.abs(z),hx=d<ROOF.breakZ?ROOF.ridgeHalf:ROOF.ridgeHalf+(d-ROOF.breakZ)/(ROOF.halfZ-ROOF.breakZ)*(ROOF.halfX-ROOF.ridgeHalf);pts.push([-hx,roofY(d)+.16,z],[hx,roofY(d)+.16,z]);}surface('roof','roof',pts);}
 function roofEnd(sign){const pts=[];for(let k=0;k<=24;k++){const t=k/24,x=sign*(ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*t),z=ROOF.breakZ+(ROOF.halfZ-ROOF.breakZ)*t;pts.push([x,roofY(z)+.16,-z],[x,roofY(z)+.16,z]);}surface('roof','roof',pts);}
 if(detailOnly){column({x:0,z:0,i:2,j:4},-1.6,1.6,'lower','outer');bracket(0,0,0,0,{tag:'南檐局部'});
 column({x:0,z:-.37,i:2,j:4},1.57,1.8,'middle','outer',true);
 round('brackets','purlin',[-1.1,2.13,1.64],[1.1,2.13,1.64],.14,'wood',{tier:5});
 }else{
 box('foundation','foundation',[0,.20,0],[23.2,.4,17.2],'stone');for(let i=0;i<3;i++)box('foundation','foundation',[0,.07+i*.13,8.6+(2-i)*.35],[5,.14,.55],'lightstone');
 for(let level=0;level<3;level++){const l=SPEC.levels[level],g=getColumnGrid(level),y=l.base+l.height,all=[...g.outer,...g.inner];
 for(const p of all){if(level===0){add('foundation','base',cyl,[p.x,.475,p.z],[.49,.15,.49],new THREE.Quaternion(),'lightstone',{key:`base/${p.i}-${p.j}`});add('foundation','base',douGeo(),[p.x,.34,p.z],[.85,.15,.85],new THREE.Quaternion(),'stone',{key:`base/${p.i}-${p.j}`});}
 column(p,l.base,l.height,l.id,g.outer.includes(p)?'outer':'inner',level>0);}
 ringTies(g.outer,y,l.id);ringTies(g.inner,y+.10,l.id,true);
 for(const p of g.outer){const corner=(p.i===0||p.i===5)&&(p.j===0||p.j===4),angle=p.j===4?0:p.j===0?Math.PI:p.i===5?Math.PI/2:-Math.PI/2;
 if(!corner)bracket(p.x,y,p.z,angle,{reach:l.reach,total:l.bracket,kind:l.id,tag:`${l.id}/outer/${p.i}-${p.j}`});
 else{const sx=p.x>0?1:-1,sz=p.z>0?1:-1,q=Y(0);dou([p.x,y+.15,p.z],.7,.3,q,{key:`${l.id}/corner-root/${p.i}-${p.j}`});for(let k=0;k<4;k++){const out=l.reach*(k+1)/4,hy=y+.42+k*.36,e={status:'待核定',key:`${l.id}/corner/${p.i}-${p.j}`,note:'独立方向骨架；未复原抹角互锁'};
 beam('brackets','corner',[p.x-sx*.55,hy,p.z],[p.x+sx*out,hy,p.z],.23,.27,'wood',e);beam('brackets','corner',[p.x,hy+.12,p.z-sz*.55],[p.x,hy+.12,p.z+sz*out],.23,.27,'wood',e);beam('brackets','corner',[p.x,hy+.26,p.z],[p.x+sx*out*.72,hy+.26,p.z+sz*out*.72],.22,.27,'darkwood',e);}}
 }
 for(const p of g.inner){const a=p.j===3?Math.PI:p.j===1?0:p.i===1?Math.PI/2:-Math.PI/2;bracket(p.x,y+.10,p.z,a,{reach:.84,total:l.bracket-.27,kind:l.id,tag:`${l.id}/inner/${p.i}-${p.j}`,inner:true});}
 // Sparse, explicitly unresolved intermediate silhouettes, distinct from column-head assemblies.
 for(let i=0;i<5;i++)for(const j of [0,4]){const x=(g.xs[i]+g.xs[i+1])/2,z=g.zs[j];dou([x,y+.25,z],.46,.25,Y(0),{status:'待核定'});add('brackets','intermediate',arm(),[x,y+.65,z],[1.4,.27,.23],Y(0),'wood',{level:l.id,status:'待核定'});}
 // Cross-links stop at inner ring; no beams fill the sacred central void.
 for(const p of g.inner){const outer=g.outer.find(o=>o.i===p.i&&(p.j===1?o.j===0:p.j===3?o.j===4:false))||g.outer.find(o=>o.j===p.j&&(p.i===1?o.i===0:p.i===4?o.i===5:false));if(outer)beam('ming','beam',[p.x,y+l.bracket-.26,p.z],[outer.x,y+l.bracket-.26,outer.z],.29,.5,'wood',{level:l.id,support:'内外圈铺作'});}
 if(level<2){floorBand(y+l.bracket+.01,g,l.id);}
 if(level===1){for(const p of g.inner.filter(p=>p.j===1||p.j===3)){const a=g.outer.find(o=>o.i===p.i&&o.j===(p.j===1?0:4));if(a)beam('roofFrame','brace',[a.x,l.base+.25,a.z],[p.x,y-.2,p.z],.16,.19,'darkwood',{status:'图像判读',level:l.id});}}
 if(level===2){const xx=g.xs[0]-.95,xx2=g.xs[5]+.95,zz=g.zs[0]-.9,zz2=g.zs[4]+.9;
 // Exterior upper balcony. Four strips do not cross the open interior.
 for(const z of [zz,zz2])box('ming','floor',[(xx+xx2)/2,l.base,z+.45*(z<0?1:-1)],[xx2-xx,.16,.9],'ceiling');for(const x of [xx,xx2])box('ming','floor',[x+.45*(x<0?1:-1),l.base,0],[.9,.16,zz2-zz-1.8],'ceiling');
 for(const [a,b] of [[[xx,0,zz],[xx2,0,zz]],[[xx,0,zz2],[xx2,0,zz2]],[[xx,0,zz],[xx,0,zz2]],[[xx2,0,zz],[xx2,0,zz2]]])rail(a,b,l.base+.1,l.id);
 }
 }
 // Two western stair flights through explicitly open floor strips.
 for(const [a,b,y0,y1] of [[-2.6,2.6,.55,6.57],[2.6,-2.6,6.57,10.72]]){const n=24,x=-8.15;beam('ming','stair',[x-.48,y0,a],[x-.48,y1,b],.16,.22);beam('ming','stair',[x+.48,y0,a],[x+.48,y1,b],.16,.22);for(let k=0;k<n;k++)box('ming','stair',[x,y0+(y1-y0)*(k+.5)/n,a+(b-a)*(k+.5)/n],[1.15,.11,Math.abs(b-a)/n],'wood');}
 // Upper transverse frame. End frames have a lower ceiling under the hip skirt.
 for(const x of getColumnGrid(2).xs){const end=Math.abs(x)>ROOF.ridgeHalf,half=end?4.0:6.0,top=end?surfaceY(x,0)-.5:roofY(half)-.30;
 beam('roofFrame','frame',[x,15.40,-half],[x,15.40,half],.32,.48);
 if(end){beam('roofFrame','frame',[x,top,-2.7],[x,top,2.7],.27,.36);for(const z of [-2.7,2.7])beam('roofFrame','frame',[x,15.66,z],[x,top-.18,z],.26,.26);continue;}
 for(const d of [3.6,1.8]){const yy=roofY(d)-.45;beam('roofFrame','frame',[x,yy,-d],[x,yy,d],.28,.38);for(const z of [-d,d])beam('roofFrame','frame',[x,d===3.6?15.65:roofY(3.6)-.24,z],[x,yy-.19,z],.24,.24);}
 for(const s of [-1,1])beam('roofFrame','frame',[x,roofY(1.8)-.22,s*1.5],[x,ROOF.ridgeY-.32,0],.18,.22);
 }
 // Long purlins extend only as far as the roof geometry permits at each slope station.
 for(const d of [0,1.8,3.6,5.4,7.1,8.54])for(const s of d===0?[1]:[-1,1]){const z=d*s,hx=d<ROOF.breakZ?ROOF.ridgeHalf:ROOF.ridgeHalf+(d-ROOF.breakZ)/(ROOF.halfZ-ROOF.breakZ)*(ROOF.halfX-ROOF.ridgeHalf);round('purlins','purlin',[-hx,roofY(d)-.19,z],[hx,roofY(d)-.19,z],.14);}
 for(const s of [-1,1])for(let k=0;k<=5;k++){const t=k/5,x=s*(ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*t),z=ROOF.breakZ+(ROOF.halfZ-ROOF.breakZ)*t;round('purlins','purlin',[x,roofY(z)-.19,-z],[x,roofY(z)-.19,z],.13);}
 // Long slope rafters, with no rafters beyond the recessed upper gable edge.
 for(let x=-ROOF.halfX+.18;x<ROOF.halfX;x+=.32)for(const s of [-1,1])for(let k=0;k<28;k++){const d0=ROOF.halfZ*k/28,d1=ROOF.halfZ*(k+1)/28;if(surfaceY(x,d0)<roofY(d0)-.01)continue;round('rafters','rafter',[x,roofY(d0)+.03,s*d0],[x,roofY(d1)+.03,s*d1],.045,'rafter');}
 for(const s of [-1,1])for(let z=-ROOF.halfZ+.18;z<ROOF.halfZ;z+=.32)for(let k=0;k<16;k++){const x0=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*k/16,x1=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*(k+1)/16;if(Math.abs(z)>ROOF.breakZ+(x0-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ))continue;round('rafters','rafter',[s*x0,surfaceY(x0,z)+.03,z],[s*x1,surfaceY(x1,z)+.03,z],.045,'rafter');}
 for(const sx of [-1,1])for(const sz of [-1,1]){beam('rafters','hip',[sx*ROOF.ridgeHalf,roofY(ROOF.breakZ)-.13,sz*ROOF.breakZ],[sx*ROOF.halfX,roofY(ROOF.halfZ)-.13,sz*ROOF.halfZ],.25,.30);}
 for(const sx of [-1,1]){for(const sz of [-1,1])for(let k=0;k<16;k++){let d0=ROOF.breakZ*k/16,d1=ROOF.breakZ*(k+1)/16;beam('rafters','barge',[sx*ROOF.ridgeHalf,roofY(d0)+.13,sz*d0],[sx*ROOF.ridgeHalf,roofY(d1)+.13,sz*d1],.13,.27,'darkwood');}
 const pts=[[sx*ROOF.ridgeHalf,roofY(ROOF.breakZ)-.12,-ROOF.breakZ],[sx*ROOF.ridgeHalf,roofY(ROOF.breakZ)-.12,ROOF.breakZ],[sx*ROOF.ridgeHalf,ROOF.ridgeY-.10,0]];const gg=new THREE.BufferGeometry().setFromPoints(pts.map(V));gg.setIndex([0,1,2]);gg.computeVertexNormals();add('enclosure','enclosure',gg,[0,0,0],[1,1,1],new THREE.Quaternion(),'roofBoard',{note:'山墙轮廓，不复原雕饰'});}
 roofLong(1);roofLong(-1);roofEnd(1);roofEnd(-1);
 round('roof','roof',[-ROOF.ridgeHalf,ROOF.ridgeY+.26,0],[ROOF.ridgeHalf,ROOF.ridgeY+.26,0],.19,'ridge');
 // Tile ribs give a material reading; not a count of historical tiles.
 for(let x=-11.5;x<11.6;x+=.25)for(const s of [-1,1])for(let k=0;k<24;k++){const d0=ROOF.halfZ*k/24,d1=ROOF.halfZ*(k+1)/24;if(surfaceY(x,d0)<roofY(d0)-.01)continue;round('roof','roof',[x,roofY(d0)+.21,s*d0],[x,roofY(d1)+.21,s*d1],.035,'tile');}
 for(const s of [-1,1])for(let z=-8.6;z<8.7;z+=.25)for(let k=0;k<12;k++){let x0=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*k/12,x1=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*(k+1)/12;if(Math.abs(z)>ROOF.breakZ+(x0-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ))continue;round('roof','roof',[s*x0,surfaceY(x0,z)+.21,z],[s*x1,surfaceY(x1,z)+.21,z],.035,'tile');}
 // Lower eave is an annular skirt, never a second complete roof across the void.
 const low=getColumnGrid(0),hx=11.80,hz=8.94,ix=-getColumnGrid(1).xs[0],iz=getColumnGrid(1).zs[4],ey=6.61;
 for(const s of [-1,1]){const pts=[];for(let k=0;k<=12;k++){let t=k/12,x=ix+(hx-ix)*t,z=iz+(hz-iz)*t,y=9.05-(9.05-ey)*Math.pow(t,.8);pts.push([-x,y,s*z],[x,y,s*z]);}surface('roof','roof',pts);const end=[];for(let k=0;k<=12;k++){let t=k/12,x=ix+(hx-ix)*t,z=iz+(hz-iz)*t,y=9.05-(9.05-ey)*Math.pow(t,.8);end.push([s*x,y,-z],[s*x,y,z]);}surface('roof','roof',end);
 for(let x=-hx+.16;x<hx;x+=.30)for(let k=0;k<12;k++){let t=k/12,t2=(k+1)/12,xx=ix+(hx-ix)*t;if(Math.abs(x)>xx)continue;round('rafters','rafter',[x,9.05-(9.05-ey)*Math.pow(t,.8)-.13,s*(iz+(hz-iz)*t)],[x,9.05-(9.05-ey)*Math.pow(t2,.8)-.13,s*(iz+(hz-iz)*t2)],.044,'rafter');round('roof','roof',[x,9.05-(9.05-ey)*Math.pow(t,.8)+.05,s*(iz+(hz-iz)*t)],[x,9.05-(9.05-ey)*Math.pow(t2,.8)+.05,s*(iz+(hz-iz)*t2)],.034,'tile');}
 for(let z=-hz+.16;z<hz;z+=.30)for(let k=0;k<12;k++){let t=k/12,t2=(k+1)/12,zz=iz+(hz-iz)*t;if(Math.abs(z)>zz)continue;round('rafters','rafter',[s*(ix+(hx-ix)*t),9.05-(9.05-ey)*Math.pow(t,.8)-.13,z],[s*(ix+(hx-ix)*t2),9.05-(9.05-ey)*Math.pow(t2,.8)-.13,z],.044,'rafter');round('roof','roof',[s*(ix+(hx-ix)*t),9.05-(9.05-ey)*Math.pow(t,.8)+.05,z],[s*(ix+(hx-ix)*t2),9.05-(9.05-ey)*Math.pow(t2,.8)+.05,z],.034,'tile');}}
 for(const s of [-1,1]){
 for(const [x,z,y] of [[hx,hz,ey-.25],[ix,iz,8.80]]){round('purlins','purlin',[-x,y,s*z],[x,y,s*z],.14);round('purlins','purlin',[s*x,y,-z],[s*x,y,z],.14);}
 for(const x of low.xs)beam('roofFrame','frame',[x,6.45,s*hz],[x,8.82,s*iz],.17,.22,'wood',{note:'下檐承椽支撑为剖面关系推定'});
 }
 for(const sx of [-1,1])for(const sz of [-1,1])beam('rafters','hip',[sx*ix,8.90,sz*iz],[sx*hx,ey-.15,sz*hz],.25,.30);
 // Plain caisson outline only: decorative pattern and plan geometry remain unresolved.
 for(let k=0;k<3;k++){let r=2.7-k*.4,y=16.4+k*.45;for(let i=0;i<8;i++){let a=i*Math.PI/4,b=(i+1)*Math.PI/4;beam('ceiling','caisson',[r*Math.cos(a),y,r*Math.sin(a)],[r*Math.cos(b),y,r*Math.sin(b)],.12,.12,'darkwood',{status:'待核定',note:'八边轮廓为教学占位；非已核实藻井平面'});}}
 // Enclosure divided by bays; front central apertures remain open for looking into the void.
 for(const level of [0,2]){const l=SPEC.levels[level],g=getColumnGrid(level),yy=l.base+l.height/2;for(let i=0;i<5;i++)for(const j of [0,4]){const x=(g.xs[i]+g.xs[i+1])/2,w=g.xs[i+1]-g.xs[i]-.52,z=g.zs[j];if((j===4&&i>=1&&i<=3)||(j===0&&i===2)){for(let xx=x-w/2;xx<x+w/2;xx+=.21)box('enclosure','enclosure',[xx,yy,z],[.045,l.height*.72,.07],'door');box('enclosure','enclosure',[x,l.base+.25,z],[w,.5,.16],'door');}else box('enclosure','enclosure',[x,yy,z],[w,l.height,.18],'plaster');}
 for(const s of [-1,1])box('enclosure','enclosure',[s*(g.xs[5]+.03),yy,0],[.18,l.height,g.zs[4]-g.zs[0]],'plaster');}
 }
 const meshes=[];for(const b of bucket.values()){const m=new THREE.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);m.userData={records:b.items.map(i=>i.record),materialKey:b.mat,layer:b.layer,tier:b.tier};b.items.forEach((i,n)=>m.setMatrixAt(n,i.m));m.castShadow=true;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.layer).add(m);meshes.push(m);}root.updateMatrixWorld(true);return {root,layers,records,meshes,detailOnly};
}
