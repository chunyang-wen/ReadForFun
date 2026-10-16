import * as T from '../vendor/three.module.js';
import {LAYERS} from './data.js';
// Metres are a teaching scale, never surveyed dimensions. +Z is the drawing's facing side.
export const SPEC={floor:.45,foot:.63,x:[-2.4,-1.2,1.2,2.4],width:6.05,depth:3.65,columnRadius:.115,beamY:3.76,beamHeight:.28,hangerTop:3.62,hangerBottom:2.92};
export const PROFILE=[[-1.83,4.15],[-1.57,4.34],[-1.22,4.69],[-.98,4.78],[-.74,4.65],[-.47,4.64],[-.25,4.93],[0,5.31],[.25,4.93],[.47,4.64],[.74,4.65],[.98,4.78],[1.22,4.69],[1.57,4.34],[1.83,4.15]];
// Smooth cubic Hermite interpolation; zero slope at local extrema and centre cusp kept explicit.
export function roofY(z){z=T.MathUtils.clamp(z,PROFILE[0][0],PROFILE.at(-1)[0]);let i=PROFILE.findIndex((p,j)=>j<PROFILE.length-1&&z>=p[0]&&z<=PROFILE[j+1][0]);if(i<0)i=PROFILE.length-2;const [a,b]=[PROFILE[i],PROFILE[i+1]],h=b[0]-a[0],u=(z-a[0])/h;const slope=j=>{if(j===0)return(PROFILE[1][1]-PROFILE[0][1])/(PROFILE[1][0]-PROFILE[0][0]);if(j===PROFILE.length-1)return(PROFILE[j][1]-PROFILE[j-1][1])/(PROFILE[j][0]-PROFILE[j-1][0]);const d0=(PROFILE[j][1]-PROFILE[j-1][1])/(PROFILE[j][0]-PROFILE[j-1][0]),d1=(PROFILE[j+1][1]-PROFILE[j][1])/(PROFILE[j+1][0]-PROFILE[j][0]);return d0*d1<=0?0:(d0+d1)/2;};return(2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*h*slope(i)+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*h*slope(i+1);}
// Finite 72-segment rafter envelope in the local YZ plane. Conservative capsule
// endpoints avoid a false contact at a segment seam; dimensions remain teaching values.
export const PURLIN_Z=[-1.73,-1.42,-.98,-.63,0,.63,.98,1.42,1.73];
export function purlinY(z){
 const radius=.09+.035;let y=Infinity;
 for(let j=0;j<72;j++){
  const a=-1.83+j*3.66/72,b=-1.83+(j+1)*3.66/72,ya=roofY(a)-.185,yb=roofY(b)-.185,s=(yb-ya)/(b-a);
  const foot=z-radius*s/Math.sqrt(1+s*s);
  if(foot>=a&&foot<=b)y=Math.min(y,ya+s*(z-a)-radius*Math.sqrt(1+s*s));
  for(const [zz,yy] of [[a,ya],[b,yb]])if(Math.abs(z-zz)<=radius)y=Math.min(y,yy-Math.sqrt(Math.max(0,radius*radius-(z-zz)**2)));
 }
 return y;
}
export const frameTop=z=>purlinY(z)-.09;
export function getColumnGrid(){return {all:SPEC.x.map((x,i)=>({id:`column/${i}`,x,z:0}))};}
export function hangerGrid(){return SPEC.x.flatMap((x,i)=>(i===0||i===3?[-1.42,1.42]:[-1.42,-.63,.63,1.42]).map((z,j)=>({x,z,frame:i,id:`hanger/${i}/${j}`})));}
const V=a=>new T.Vector3(...a),Q=()=>new T.Quaternion(),Y=a=>new T.Quaternion().setFromAxisAngle(V([0,1,0]),a);
function prism(points){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);
 // ExtrudeGeometry is Float32: near-coincident section stations may collapse
 // after quantization. Keep only real faces, retaining component IDs.
 const p=g.attributes.position,indices=[];
 for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);if(b.sub(a).cross(c.sub(a)).length()>1e-10)indices.push(i,i+1,i+2);}
 g.setIndex(indices);return g;}
const cache=new Map(),G=(key,fn)=>{if(!cache.has(key))cache.set(key,fn());return cache.get(key);};
function strip(z0,z1,x0,x1,delta=0){const g=new T.BufferGeometry(),n=12,p=[],idx=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n,y=roofY(z)+delta;p.push(x0,y,z,x1,y,z);}for(let i=0;i<n;i++)idx.push(2*i,2*i+2,2*i+1,2*i+1,2*i+2,2*i+3);g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);const normals=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n,h=.00001,slope=(roofY(z+h)-roofY(z-h))/(Math.min(1.83,z+h)-Math.max(-1.83,z-h)),v=new T.Vector3(0,1,-slope).normalize();normals.push(...v.toArray(),...v.toArray());}g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;}
export function buildModel(materials,{detailOnly=false,node='beam'}={}){
 const root=new T.Group(),layers=new Map(LAYERS.map(l=>{const g=new T.Group();root.add(g);return[l.id,g];})),records=[],buckets=new Map();
 const boxG=G('box',()=>new T.BoxGeometry(1,1,1)),cyl=G('cylinder',()=>new T.CylinderGeometry(1,1,1,24)),sphere=G('sphere',()=>new T.SphereGeometry(1,16,12)),torus=G('torus',()=>new T.TorusGeometry(1,.08,8,40));
 function add(l,t,g,p,s=[1,1,1],q=Q(),mat='wood',meta={}){const key=meta.key;if(!key)throw Error('stable key required');const r={id:key,key,layer:l,type:t,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'诸葛净图④；尺寸教学推定',support:'见构件说明',...meta};if(records.some(x=>x.id===key))throw Error('Duplicate '+key);records.push(r);if(mat==='wood')mat=({columns:'column',ties:'paint',hangers:'lotus',roofFrame:'paint'})[l]||mat;const tier=detailOnly?r.tier||0:0,k=[l,g.uuid,mat,tier].join(':');if(!buckets.has(k))buckets.set(k,{l,g,mat,tier,items:[]});buckets.get(k).items.push({r,m:new T.Matrix4().compose(V(p),q,V(s))});return r;}
 const box=(l,t,p,s,mat,key,meta={},q=Q())=>add(l,t,boxG,p,s,q,mat,{key,...meta});
 function member(l,t,a,b,w,h,mat,key,meta={},round=false){const d=V(b).sub(V(a)),len=d.length(),v=d.normalize();let z=V([0,1,0]).addScaledVector(v,-v.y);if(z.length()<.01)z=V([0,0,1]);z.normalize();const x=new T.Vector3().crossVectors(v,z).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,v,z));return add(l,t,round?cyl:boxG,V(a).add(V(b)).multiplyScalar(.5).toArray(),round?[w,len,w]:[w,len,h],q,mat,{key,endpoints:[a,b],...meta});}
 const rod=(l,t,a,b,r,mat,key,meta={})=>member(l,t,a,b,r,r,mat,key,meta,true);
 const beam=(l,t,a,b,w,h,mat,key,meta={})=>member(l,t,a,b,w,h,mat,key,meta);
 function curve(l,t,points,r,mat,key,meta={}){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*5),r,7,false);return add(l,t,g,[0,0,0],[1,1,1],Q(),mat,{key,...meta});}
 function flower(x,y,z,key,tier=0,factor=1){
  const points=[[.025,0],[.10,.09],[.17,.22],[.19,.34],[.17,.42],[.20,.46],[.20,.50],[.14,.54]].map(([r,h])=>new T.Vector2(r,h));
  const lathe=G('flower',()=>new T.LatheGeometry(points,40));add('hangers','lotus',lathe,[x,y,z],[factor,factor,factor],Q(),'wood',{key:key+'/core',tier,host:key.replace('/flower',''),role:'flower-core',note:'分瓣雕刻概括，非原物精确纹样'});
  for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++){const a=j*Math.PI/4+ring*Math.PI/8,rr=(ring===0?.128:.12)*factor;add('hangers','lotus',sphere,[x+rr*Math.sin(a),y+(.22+ring*.13)*factor,z+rr*Math.cos(a)],[.052*factor,.12*factor,.04*factor],Y(a),'wood',{key:`${key}/petal/${ring}/${j}`,tier,host:key+'/core',role:'petal',note:'瓣数与交叠为教学轮廓'});}
  for(const [yy,rr] of [[.45,.20],[.51,.17]]){const q=new T.Quaternion().setFromAxisAngle(V([1,0,0]),Math.PI/2);add('hangers','lotus',torus,[x,y+yy*factor,z],[rr*factor,rr*factor,rr*factor],q,'darkwood',{key:key+'/ring/'+yy,tier,host:key+'/core'});}
 }
 function transverse(x,key,dy=0,tier=0){
  // Continuous deep beam with a shaped lower edge and raised terminal noses; oriented along Z.
  const outline=[[-1.62,.14],[-1.62,.04],[-1.53,-.07],[-1.35,-.14],[-.45,-.14],[-.30,-.08],[.30,-.08],[.45,-.14],[1.35,-.14],[1.53,-.07],[1.62,.04],[1.62,.14]];
  const geo=G('transverse',()=>prism(outline));add('ties','beam',geo,[x,SPEC.beamY+dy,0],[1,1,.21],Y(Math.PI/2),'wood',{key,tier,role:'cantilever',endpoints:[[x,SPEC.beamY+dy,-1.62],[x,SPEC.beamY+dy,1.62]],support:'独立柱',bearingY:SPEC.beamY-.14+dy,status:'图像判读',note:'挑梁轮廓概括；内部穿插加工未核'});
 }
 function hang(x,z,key,dy=0,tier=0){const top=SPEC.hangerTop+dy,bottom=SPEC.hangerBottom+dy;box('hangers','hanger',[x,(top+bottom)/2,z],[.135,top-bottom,.135],'wood',key,{tier,role:'hanging-stem',top,bottom,support:'前后挑梁',status:'图像判读'});flower(x,bottom-.54,z,key+'/flower',tier);box('hangers','hanger',[x,top-.055,z],[.23,.11,.23],'darkwood',key+'/collar',{tier,host:key});}
 function volute(x,y,z,key,tier=0,flip=1,mat='wood',layer='decoration',type='carving'){
  const pts=[];for(let k=0;k<=34;k++){const a=k/34*Math.PI*3.5,r=.23*(1-k/42);pts.push([x+flip*(Math.cos(a)*r+.23),y+Math.sin(a)*r,z]);}curve(layer,type,pts,.035,mat,key,{tier,host:key.split('/scroll')[0],note:'卷曲线原创概括'});
 }
 function crossFrame(x,key,dy=0,tier=0){
  for(let k=0;k<PROFILE.length-1;k++){const z0=PROFILE[k][0],z1=PROFILE[k+1][0];for(let j=0;j<5;j++){
   const a=z0+(z1-z0)*j/5,b=z0+(z1-z0)*(j+1)/5;
   const zs=[...new Set([a,b,...Array.from({length:7},(_,i)=>a+(b-a)*(i+1)/8),...PURLIN_Z.filter(z=>z>a&&z<b)])].sort((a,b)=>a-b).filter((z,i,a)=>!i||z-a[i-1]>1e-7);
   const outline=zs.map(z=>[z,frameTop(z)+dy]).concat([...zs].reverse().map(z=>[z,frameTop(z)-.13+dy]));
   add('roofFrame','frame',prism(outline),[x,0,0],[1,1,.16],Y(Math.PI/2),'wood',{key:`${key}/rib/${k}/${j}`,tier,role:'profile-rib',note:'连续竖向截面；曲架为教学补全，非实物接木清单'});
  }}
  for(const z of [-1.42,-.63,0,.63,1.42]){const foot=SPEC.beamY+.14+dy,top=frameTop(z)-.13+dy;box('roofFrame','frame',[x,(foot+top)/2,z],[.13,top-foot,.13],'wood',`${key}/post/${z}`,{tier,role:'purlin-post',foot,top,support:key.startsWith('frame/')?key.replace('frame/','beam/'):key+'/beam',note:'内部承檩短柱为教学补全'});}

 }
 function roofAssembly(x0,x1,key,dy=0,tier=0){
  const zs=PURLIN_Z;
  zs.forEach((z,j)=>{const yy=purlinY(z)+dy;rod('purlins','purlin',[x0,yy,z],[x1,yy,z],.09,'darkwood',`${key}/purlin/${j}`,{tier,role:'purlin',zStation:z,note:'站位按侧面圆端判读后规则化'});});
  const n=detailOnly?7:55;for(let i=0;i<n;i++){const x=x0+(x1-x0)*i/(n-1);for(let j=0;j<72;j++){const z0=-1.83+j*3.66/72,z1=-1.83+(j+1)*3.66/72;rod('purlins','rafter',[x,roofY(z0)-.185+dy,z0],[x,roofY(z1)-.185+dy,z1],.035,'rafter',`${key}/rafter/${i}/${j}`,{tier:tier+1,role:'rafter',direction:'Z',note:'分段为曲线近似；椽数推定'});}}
 }
 function stone(x,key){
  for(const z of [-.27,.27]){box('foundation','base',[x,.57,z],[.42,.24,.43],'stone',key+'/foot/'+z,{support:'门台'});add('foundation','base',cyl,[x,.88,z],[.25,.13,.25],new T.Quaternion().setFromAxisAngle(V([1,0,0]),Math.PI/2),'lightstone',{key:key+'/drum/'+z,role:'drum-stone'});}
  // Side silhouette behind the column follows the drawn rising cloud-shaped backing.
  const contour=[[-.32,0],[-.40,.28],[-.24,.49],[-.32,.63],[-.17,.84],[-.23,1.0],[0,1.37],[.23,1.0],[.17,.84],[.32,.63],[.24,.49],[.40,.28],[.32,0]];
  add('foundation','base',G('stone-back',()=>prism(contour)),[x,SPEC.floor+.12,0],[1,1,.13],Y(Math.PI/2),'stone',{key:key+'/backing',status:'图像判读',note:'门枕侧立面轮廓；非实测工艺'});
  for(const z of [-.342,.342]){add('decoration','stoneCarving',torus,[x,.88,z],[.19,.19,.19],Q(),'lightstone',{key:key+'/medallion/'+z,host:key+'/drum/'+(z<0?-.27:.27)});for(let k=0;k<6;k++){const a=k*Math.PI/3;add('decoration','stoneCarving',sphere,[x+.075*Math.cos(a),.88+.075*Math.sin(a),z],[.055,.045,.018],Q(),'lightstone',{key:key+'/flower/'+z+'/'+k,host:key+'/medallion/'+z});}}
 }
 if(detailOnly){
  if(node==='beam'){const dy=-SPEC.beamY;box('columns','column',[0,-.40,0],[.23,1.40,.23],'wood','local/column',{tier:0,note:'截取柱段，非新增落地柱'});transverse(0,'local/beam',dy,1);[-1.42,-.63,.63,1.42].forEach((z,j)=>hang(0,z,'local/hanger/'+j,dy,2));for(const z of [-1.42,1.42])beam('ties','tie',[-.75,-.12,z],[.75,-.12,z],.11,.18,'darkwood','local/longitudinal/'+z,{tier:3});}
  if(node==='lotus'){box('hangers','hanger',[0,.65,0],[.28,.70,.28],'wood','local/stem',{tier:0,bottom:.3,top:1,role:'hanging-stem'});flower(0,-.78,0,'local/flower',1,2);box('ties','tie',[.7,.78,0],[1.2,.18,.16],'wood','local/flower-tie',{tier:0});volute(.2,.53,.08,'local/scroll',0);}
  if(node==='roof'){const dy=-3.7;transverse(0,'local/roof/beam',dy,0);crossFrame(0,'local/roof',dy,1);roofAssembly(-.7,.7,'local/roof',dy,2);}
  if(node==='joint'){
   // Receiver's four sides are separate solids, showing a real void. Insertion is along Z.
   const meta={source:'通用几何练习，非画中游实测',status:'比例推定',opening:.24,tier:0,role:'receiver'};
   box('ties','joint',[-.26,0,0],[.28,.90,.42],'wood','practice/left',meta);box('ties','joint',[.26,0,0],[.28,.90,.42],'wood','practice/right',meta);box('ties','joint',[0,.285,0],[.24,.33,.42],'wood','practice/top',meta);box('ties','joint',[0,-.285,0],[.24,.33,.42],'wood','practice/bottom',meta);
   box('ties','joint',[0,0,.56],[.38,.32,.70],'darkwood','practice/shoulder',{tier:1,source:meta.source,role:'shoulder'});box('ties','joint',[0,0,.08],[.22,.22,.48],'wood','practice/tenon',{tier:1,source:meta.source,role:'tenon',direction:'−Z'});
   for(const z of [-.5,-.75,-1])add('decoration','joint',G('arrow',()=>new T.ConeGeometry(.07,.18,8)),[0,0,z],[1,1,1],new T.Quaternion().setFromAxisAngle(V([1,0,0]),-Math.PI/2),'gold',{key:'practice/arrow/'+z,tier:0,source:meta.source,role:'insertion-guide'});
  }
 }else{
  box('foundation','foundation',[0,.25,0],[6.8,.4,2.4],'stone','terrace/deck');for(let k=0;k<3;k++)box('foundation','foundation',[0,.075+k*.11,1.5-k*.22],[2.35,.15+k*.1,.40],'lightstone','terrace/step/'+k);
  getColumnGrid().all.forEach((p,i)=>{box('foundation','base',[p.x,.54,0],[.34,.18,.34],'lightstone','base/'+i);rod('columns','column',[p.x,SPEC.foot,0],[p.x,5.00,0],SPEC.columnRadius,'wood',p.id,{status:'图像判读',support:'base/'+i,role:'main-column',foot:SPEC.foot,top:5.0,note:'柱数文献明确；单排判读；高径推定'});transverse(p.x,'beam/'+i);crossFrame(p.x,'frame/'+i);stone(p.x,'stone/'+i);});
  hangerGrid().forEach(p=>hang(p.x,p.z,p.id));
  for(const z of [-1.42,1.42]){beam('ties','tie',[-2.4,3.60,z],[2.4,3.60,z],.14,.20,'wood','tie/eave/'+z,{support:'悬柱上端',status:'图像判读'});beam('ties','tie',[-2.4,3.18,z],[2.4,3.18,z],.10,.13,'wood','tie/flower/'+z,{support:'悬柱下段',status:'图像判读'});for(let i=0;i<3;i++){const a=SPEC.x[i]+.16,b=SPEC.x[i+1]-.16;for(let j=0;j<9;j++){const x=a+(b-a)*(j+.5)/9;volute(x-.18,3.27,z+(z>0?.06:-.06),`carved/flower/${z}/${i}/${j}`);}for(const side of [-1,1]){const x=side<0?a:b;curve('decoration','carving',[[x,3.12,z],[x+side*.09,2.94,z],[x+side*.34,3.08,z],[x+side*.52,3.11,z]],.028,'wood',`carved/spandrel/${z}/${i}/${side}`,{host:'tie/flower/'+z,note:'雀替轮廓概括'});}}
  }
  for(const z of [-.63,.63])beam('ties','tie',[-1.2,3.58,z],[1.2,3.58,z],.13,.16,'wood','tie/inner/'+z);
  beam('ties','tie',[-2.4,3.80,0],[2.4,3.80,0],.13,.19,'wood','tie/centre');roofAssembly(-2.85,2.85,'whole');
  for(let j=0;j<36;j++){const a=-1.83+j*3.66/36,b=-1.83+(j+1)*3.66/36;add('roof','roof',strip(a,b,-3.025,3.025,.04),[0,0,0],[1,1,1],Q(),'tile',{key:'roof/surface/'+j,status:'图像判读',note:'外曲线判读；连续接合与灰背厚度推定'});}
  for(let i=0;i<56;i++){const x=-2.98+5.96*i/55,pts=[];for(let j=0;j<=100;j++){const z=-1.83+3.66*j/100;pts.push([x,roofY(z)+.10,z]);}curve('roof','roof',pts,.032,'tile','roof/tile-rib/'+i);for(const z of [-1.83,1.83]){add('roof','roof',cyl,[x,roofY(z)+.07,z],[.050,.065,.050],new T.Quaternion().setFromAxisAngle(V([1,0,0]),Math.PI/2),'ridge',{key:`roof/end-tile/${i}/${z}`});}}
  for(const z of [-1.83,1.83])beam('purlins','purlin',[-3.025,roofY(z)-.10,z],[3.025,roofY(z)-.10,z],.15,.16,'darkwood','eave/fascia/'+z);
  for(const x of [-3.025,3.025]){const pts=[];for(let j=0;j<=120;j++){const z=-1.83+j*3.66/120;pts.push([x,roofY(z)+.13,z]);}curve('roof','roof',pts,.075,'ridge','roof/verge/'+x);const edge=Array.from({length:433},(_,i)=>-1.83+i*3.66/432);const outline=edge.map(z=>[z,roofY(z)-.01]).concat([...edge].reverse().map(z=>[z,roofY(z)-.43]));add('roof','roof',G('gable-board',()=>prism(outline)),[x,0,0],[1,1,.09],Y(Math.PI/2),'darkwood',{key:'roof/gable/'+x,role:'gable-border',note:'端山边缘独立；隐蔽山面填板待核'});}
  const ridge=[];for(let k=0;k<=32;k++){const x=-3.14+6.28*k/32,y=5.39+Math.pow(Math.max(0,(Math.abs(x)-2.5)/.64),2)*.30;ridge.push([x,y,0]);}curve('roof','roof',ridge,.085,'ridge','roof/ridge');
  // Central two leaves are an explicit teaching interpretation of faint drawing seams.
  for(const side of [-1,1]){const hingeX=side*1.035,cx=side*.52,meta={doorSide:side,hinge:[hingeX,0,0],note:'中心两叶与开门角教学假设，不据此核定实物五金'};box('enclosure','enclosure',[cx,1.69,0],[1.00,2.12,.09],'door','door/'+side,{...meta,role:'door-leaf'});for(const y of [.65,1.1,2.28,2.72])box('enclosure','enclosure',[cx,y,.058],[1.0,.045,.035],'darkwood',`door/${side}/rail/${y}`,meta);for(let i=0;i<5;i++)box('enclosure','enclosure',[cx+(i-2)*.19,1.69,.047],[.008,2.0,.015],'darkwood',`door/${side}/board/${i}`,meta);add('enclosure','enclosure',torus,[side*.12,1.59,.088],[.065,.065,.065],Q(),'metal',{key:'door/'+side+'/handle',...meta});}
  for(const side of [-1,1]){const x=side*1.8;box('enclosure','enclosure',[x,1.76,0],[.93,2.25,.09],'door','side-panel/'+side);for(const y of [.78,1.46,2.60]){box('enclosure','enclosure',[x,y,.058],[.78,.05,.02],'darkwood',`side-panel/${side}/rail/${y}`);}box('enclosure','enclosure',[side*3.34,1.59,0],[1.30,2.28,.30],'plaster','wall/'+side,{note:'园墙局部空间语境；不测绘整院'});for(let k=0;k<12;k++)box('enclosure','enclosure',[side*3.34,.52+k*.185,.17],[1.26,.012,.016],'stone',`wall/${side}/joint/${k}`);}
 }
 const meshes=[];for(const b of buckets.values()){const mesh=new T.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);mesh.userData={layer:b.l,materialKey:b.mat,tier:b.tier,records:b.items.map(i=>i.r),assembled:b.items.map(i=>i.m.clone())};b.items.forEach((i,k)=>mesh.setMatrixAt(k,i.m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();layers.get(b.l).add(mesh);meshes.push(mesh);}root.updateMatrixWorld(true);return {root,layers,meshes,records,detailOnly,node};
}
export function applyDoorOpening(model,degrees){const a=T.MathUtils.degToRad(degrees);for(const m of model.meshes){let changed=false;m.userData.records.forEach((r,i)=>{if(!r.doorSide)return;const h=V(r.hinge),q=Y(-r.doorSide*a),rotate=new T.Matrix4().makeTranslation(...h.toArray()).multiply(new T.Matrix4().makeRotationFromQuaternion(q)).multiply(new T.Matrix4().makeTranslation(...h.clone().negate().toArray()));m.setMatrixAt(i,rotate.multiply(m.userData.assembled[i]));changed=true;});if(changed){m.instanceMatrix.needsUpdate=true;m.computeBoundingBox();m.computeBoundingSphere();}}model.root.updateMatrixWorld(true);}
