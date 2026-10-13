import * as T from '../vendor/three.module.js';
import {LAYERS} from './data.js';
// Metres, +X east, +Z south (courtyard), y=0 pavement datum. All numerical dimensions are model choices.
export const SPEC={xs:[-3.6,-1.2,1.2,3.6],zs:[-4.8,0],floor:.16,foot:.36,head:3.25,ridge:5.5};
export const ROOF={minZ:-5.5,maxZ:1.05,ridgeZ:-2.4,halfX:3.92};
export const roofY=z=>5.67-.55*Math.abs(z+2.4);
export function getColumnGrid(){return {xs:SPEC.xs,zs:SPEC.zs,points:[...SPEC.xs.flatMap((x,i)=>SPEC.zs.map((z,j)=>({x,z,i,j}))),...[-1.2,1.2].map((x,i)=>({x,z:-2.4,i,j:2}))]};}
const V=a=>new T.Vector3(...a),Q=()=>new T.Quaternion(),cache=new Map();
const G=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
const yaw=a=>Q().setFromAxisAngle(V([0,1,0]),a);
function prism(points,d,holes=[]){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();for(const pts of holes){const h=new T.Path();pts.forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return g;}
export function buildModel(materials,{detailOnly=false,node='door'}={}){
 const root=new T.Group(),layers=new Map(LAYERS.map(l=>{const g=new T.Group();root.add(g);return[l.id,g];})),records=[],buckets=new Map(),serial=new Map();
 const cube=G('box',()=>new T.BoxGeometry(1,1,1)),cyl=G('cyl',()=>new T.CylinderGeometry(1,1,1,18));
 function add(l,type,g,p,s=[1,1,1],q=Q(),mat='wood',e={}){const key=e.key||`${l}/${type}`,n=(serial.get(key)||0)+1;serial.set(key,n);const r={id:`${key}/${n}`,layer:l,type,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'2025图1参照；教学尺寸选值',unit:'m',basis:'地坪y=0；柱中心与构件中心线',...e};records.push(r);const tier=detailOnly?(e.tier||0):0,k=`${l}:${g.uuid}:${mat}:${tier}`;if(!buckets.has(k))buckets.set(k,{l,g,mat,tier,items:[]});buckets.get(k).items.push(r);return r;}
 const box=(l,t,p,s,mat='wood',e={},q=Q())=>add(l,t,cube,p,s,q,mat,e);
 function beam(l,t,a,b,w,h,mat='wood',e={}){const d=V(b).sub(V(a)),len=d.length(),dir=d.clone().normalize(),right=V([0,1,0]).cross(dir).normalize(),up=dir.clone().cross(right).normalize(),q=Q().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,dir));return add(l,t,cube,V(a).add(V(b)).multiplyScalar(.5).toArray(),[w,h,len],q,mat,{endpoints:[a,b],width:w,height:h,length:len,...e});}
 function round(l,t,a,b,r,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,cyl,V(a).add(V(b)).multiplyScalar(.5).toArray(),[r,d.length(),r],Q().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],radius:r,...e});}
 function spandrel(x,y,z,sign,key){const g=G('spandrel',()=>prism([[0,0],[.68,0],[.63,-.10],[.47,-.18],[.33,-.28],[.17,-.46],[0,-.46]],.08));add('brackets','spandrel',g,[x,y,z],[1,1,1],sign<0?yaw(Math.PI):Q(),'wood',{key,status:'图像判读',source:'图1-3梁下轮廓；不复制雕纹',support:'梁下皮/柱侧'});}
 function leaf(cx,y,z,w,h,key,{motion=null}={}){
  const e={assembly:key,motion,source:motion?'通用练习，外侧竖轴是明确假设':'图1-2南立面分格概括；逐扇现状待核'},b=.045;
  for(const s of [-1,1])box('enclosure','stile',[cx+s*(w/2-b/2),y+h/2,z],[b,h,.065],'door',{...e,key:key+'/stile/'+s,tier:0});
  const ys=[.025,.24,.89,1.08,h-.18,h-.025];for(const [j,yy] of ys.entries())box('enclosure','rail',[cx,y+yy,z],[w-2*b,.05,.065],'door',{...e,key:key+'/rail/'+j});
  for(const [j,a,c] of [[0,.06,.215],[1,.265,.865],[2,.915,1.055]])box('enclosure','panel',[cx,y+(a+c)/2,z],[w-2*b,c-a,.027],'darkwood',{...e,key:key+'/panel/'+j,tier:1});
  const lo=1.115,hi=h-.225,iw=w-2*b-.03;
  for(let j=0;j<3;j++)box('carving','lattice',[cx+(j-1)*iw/3,y+(lo+hi)/2,z+.012],[.016,hi-lo,.026],'door',{...e,key:key+'/heart/v/'+j,tier:2});
  for(let j=1;j<4;j++)box('carving','lattice',[cx,y+lo+(hi-lo)*j/4,z+.012],[iw,.014,.026],'door',{...e,key:key+'/heart/h/'+j,tier:2});
  // A narrow pierced band; no invented figurative carving.
  for(let j=0;j<4;j++)box('carving','lattice',[cx+(j-1.5)*iw/4,y+h-.118,z+.012],[.014,.105,.026],'door',{...e,key:key+'/band/'+j,tier:2});
 }
 function rearWindows(local=false){const z=local?0:-4.8,y0=local?0:.16;
  box('enclosure','enclosure',[0,y0+.50,z],[7.5,1,.20],'plaster',{key:'rear/sill-wall'});
  box('enclosure','enclosure',[0,y0+3.10,z],[7.5,.80,.20],'plaster',{key:'rear/head-wall'});
  const centers=[-2.4,0,2.4],w=1.28,lo=y0+1,hi=y0+2.7;
  for(const [j,cx] of centers.entries()){
   for(const s of [-1,1])box('enclosure','enclosure',[cx+s*(w/2+.035),(lo+hi)/2,z],[.07,hi-lo+.10,.24],'door',{key:`rear/window/${j}/jamb/${s}`,status:'图像判读',source:'图1-1/1-3后窗洞，尺度推定'});
   for(const yy of [lo,hi])box('enclosure','enclosure',[cx,yy,z],[w,.07,.24],'door',{key:`rear/window/${j}/rail/${yy}`});
   // Border-only rectangular fret, leaving a clear central sight opening.
   for(const s of [-1,1])box('carving','lattice',[cx+s*(w/2-.10),(lo+hi)/2,z+.13],[.015,hi-lo-.20,.025],'door',{key:`rear/window/${j}/fret/${s}`,tier:1,source:'窗边直线分格概括，实物细纹待核'});
   for(const yy of [lo+.10,hi-.10])box('carving','lattice',[cx,yy,z+.13],[w-.2,.015,.025],'door',{key:`rear/window/${j}/fret/${yy}`,tier:1});
  }
  const boundaries=[[-3.75,-3.04],[-1.76,-.64],[.64,1.76],[3.04,3.75]];
  for(const [j,[a,b]] of boundaries.entries())box('enclosure','enclosure',[(a+b)/2,(lo+hi)/2,z],[b-a,hi-lo,.20],'plaster',{key:'rear/pier/'+j});
  scenery(local?-.85:-5.75,y0);
 }
 function scenery(z,y0){
  // Context geometry is deliberately schematic, never a digital survey copy.
  const rock=G('rock',()=>new T.IcosahedronGeometry(1,1));for(const [j,x] of [-2.8,-1.65,.9,2.75].entries())add('context','context',rock,[x,y0+.50+j%2*.25,z-.35],[.5,.7+j%2*.3,.34],yaw(j*.65),'stone',{key:'context/stone/'+j,status:'图像判读',source:'图1后庭叠石语境；轮廓与位置概括'});
  const leafShape=G('banana-leaf',()=>prism([[0,0],[.17,.22],[.25,.52],[.13,.88],[0,1.15],[-.10,.8],[-.17,.4]],.012));
  for(let j=0;j<5;j++){const x=-2.4+j*.12;round('context','context',[x,y0,z],[x+.1,y0+1.6+j*.1,z],.025,'rafter',{key:'context/banana/stem/'+j});add('context','context',leafShape,[x+.1,y0+1.25+j*.12,z],[1,1,1],Q().setFromAxisAngle(V([0,0,1]),(j-2)*.5),'leaf',{key:'context/banana/leaf/'+j});}
  for(let j=0;j<7;j++){const x=-.5+j*.17,ht=2.1+(j%3)*.23;round('context','context',[x,y0,z],[x,y0+ht,z],.013,'leaf',{key:'context/bamboo/'+j});for(let k=0;k<3;k++){const sy=y0+1.1+k*.4;beam('context','context',[x,sy,z],[x+(k%2?-.3:.3),sy+.13,z+.12],.014,.045,'leaf',{key:`context/bamboo/${j}/leaf/${k}`});}}
  for(const [j,[a,b]] of [[[2.1,y0,z],[2.6,y0+2.25,z]],[[2.35,y0+1.1,z],[1.85,y0+2.0,z]],[[2.5,y0+1.7,z],[3.05,y0+2.2,z]]].entries())round('context','context',a,b,.023,'darkwood',{key:'context/plum/'+j});
  box('context','context',[0,y0+1.6,z-1],[8,3.2,.12],'plaster',{key:'context/backdrop'});box('context','context',[0,y0-.04,z-.25],[8,.08,2],'lightstone',{key:'context/ground'});
 }
 function frame(x,key){
  beam('ties','beam',[x,3.40,-4.8],[x,3.40,0],.23,.30,'wood',{key:key+'/main',support:'前后柱头',level:'主横架'});
  for(const s of [-1,1]){const z=-2.4+s*1.35;round('columns','post',[x,3.55,z],[x,4.25,z],.09,'wood',{key:key+'/post/'+s,support:key+'/main',foot:3.55,head:4.25});}
  beam('roofFrame','frame',[x,4.39,-3.9],[x,4.39,-.9],.19,.28,'wood',{key:key+'/upper',support:key+'/post/-1 + 1'});
  round('columns','post',[x,4.53,-2.4],[x,5.25,-2.4],.09,'wood',{key:key+'/ridge-post',support:key+'/upper',foot:4.53,head:5.25});
  box('roofFrame','frame',[x,5.32,-2.4],[.20,.14,.42],'wood',{key:key+'/ridge-seat',support:key+'/ridge-post'});
  for(const z of [-4.8,0])box('roofFrame','frame',[x,3.81,z],[.20,.52,.35],'wood',{key:key+'/eave-seat/'+z,support:key+'/main'});
  for(const z of [-3.75,-1.05])box('roofFrame','frame',[x,4.58875,z],[.2,.1175,.32],'wood',{key:key+'/middle-seat/'+z,support:key+'/upper'});
 }
 if(detailOnly){
  if(node==='door'){leaf(0,0,0,.58,2.55,'detail/long-window');
   for(const s of [-1,1])box('enclosure','enclosure',[s*.38,1.275,-.05],[.07,2.75,.10],'wood',{key:'detail/frame/'+s});
  }else if(node==='opening'){
   for(const [j,cx,pivot,sign] of [[0,-.43,-.86,-1],[1,.43,.86,1]])leaf(cx,0,0,.84,2.55,'practice/leaf/'+j,{motion:{pivot:[pivot,0,0],sign}});
   for(const s of [-1,1])box('enclosure','enclosure',[s*.93,1.3,0],[.10,2.8,.12],'wood',{key:'practice/jamb/'+s});box('enclosure','enclosure',[0,2.70,0],[1.96,.10,.12],'wood',{key:'practice/head'});
  }else if(node==='window')rearWindows(true);
  else{frame(0,'detail/frame');for(const z of [-4.8,-3.75,-2.4,-1.05,0]){const py=roofY(z)-.18;round('purlins','purlin',[-.85,py,z],[.85,py,z],.10,'wood',{key:'detail/purlin/'+z});}for(const x of [-.6,0,.6])for(const [a,b] of [[-4.8,-3.75],[-3.75,-2.4],[-2.4,-1.05],[-1.05,0]])beam('rafters','rafter',[x,roofY(a)-.05,a],[x,roofY(b)-.05,b],.045,.06,'rafter',{key:`detail/rafter/${x}/${a}`});}
 }else{
  box('foundation','foundation',[0,.08,-2.4],[7.65,.16,5.2],'lightstone',{key:'floor/main'});box('foundation','foundation',[0,.02,.70],[7.65,.12,1.2],'stone',{key:'terrace/front'});box('foundation','foundation',[0,-.04,1.50],[3.2,.12,.45],'stone',{key:'step/front'});
  for(const [j,{x,z}] of getColumnGrid().points.entries()){round('foundation','base',[x,.16,z],[x,.36,z],.21,'stone',{key:'base/'+j});round('columns','column',[x,.36,z],[x,3.25,z],.13,'column',{key:'column/'+j,foot:.36,head:3.25,support:'base/'+j,status:'图像判读',source:'图1-1/1-3站位关系；坐标高径推定'});}
  for(const [i,x] of SPEC.xs.entries())frame(x,'frame/'+i);
  for(const z of [-4.8,0])for(let i=0;i<3;i++)beam('ties','beam',[SPEC.xs[i],3.40,z],[SPEC.xs[i+1],3.40,z],.17,.3,'wood',{key:`longitudinal/${z}/${i}`,support:`column at x=${SPEC.xs[i]},${SPEC.xs[i+1]}`});

  for(const x of SPEC.xs)for(const s of [-1,1])if(x+s*.68>=-3.6&&x+s*.68<=3.6)spandrel(x,3.25,0,s,'front/spandrel/'+x+'/'+s);
  const pzs=[-4.8,-3.75,-2.4,-1.05,0];for(const z of pzs){const y=roofY(z)-.18;round('purlins','purlin',[-3.70,y,z],[3.70,y,z],.10,'wood',{key:'purlin/'+z,support:'four transverse frame seats',status:'比例推定'});}
  for(let j=0;j<30;j++){const x=-3.67+j*7.34/29;for(const [k,[a,b]] of [[ROOF.minZ,-4.8],[-4.8,-3.75],[-3.75,-2.4],[-2.4,-1.05],[-1.05,0],[0,ROOF.maxZ]].entries())beam('rafters','rafter',[x,roofY(a)-.05,a],[x,roofY(b)-.05,b],.045,.06,'rafter',{key:`rafter/${j}/${k}`});}
  const g=new T.BufferGeometry(),points=[],idx=[];for(let j=0;j<=40;j++){const z=ROOF.minZ+j*(ROOF.maxZ-ROOF.minZ)/40;points.push(-ROOF.halfX,roofY(z)+.04,z,ROOF.halfX,roofY(z)+.04,z);if(j<40){const i=j*2;idx.push(i,i+1,i+2,i+1,i+3,i+2);}}g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(idx);g.computeVertexNormals();add('roof','roof',g,[0,0,0],[1,1,1],Q(),'tile',{key:'roof/surface'});
  for(let j=0;j<48;j++){const x=-3.87+j*7.74/47;for(const [a,b] of [[ROOF.minZ,-2.4],[-2.4,ROOF.maxZ]])round('roof','roof',[x,roofY(a)+.065,a],[x,roofY(b)+.065,b],.026,'tile',{key:'roof/rib/'+j+'/'+a});}
  box('roof','roof',[0,5.78,-2.4],[7.97,.18,.18],'ridge',{key:'roof/ridge'});
  const gable=G('gable',()=>prism([[ROOF.minZ,.16],[ROOF.maxZ,.16],[ROOF.maxZ,roofY(ROOF.maxZ)],[-2.4,5.67],[ROOF.minZ,roofY(ROOF.minZ)]],.16));for(const s of [-1,1])add('roof','roof',gable,[s*3.80,0,0],[1,1,1],yaw(-Math.PI/2),'plaster',{key:'gable/'+s,note:'山墙边界概括；西复室不扩建'});
  for(let bay=0;bay<3;bay++){const cx=-2.4+bay*2.4;for(let j=0;j<4;j++)leaf(cx+(j-1.5)*.555,.18,.035,.535,2.80,`south/bay/${bay}/leaf/${j}`);box('enclosure','enclosure',[cx,3.06,.04],[2.15,.06,.13],'door',{key:'transom/rail/'+bay});for(let j=0;j<14;j++)box('carving','lattice',[cx+(j-6.5)*.155,3.17,.035],[.025,.16,.05],'door',{key:`transom/${bay}/${j}`});}
  rearWindows();
  box('enclosure','enclosure',[-4.02,1.6,-2.4],[.13,2.9,4.8],'plaster',{key:'west/annex-boundary',note:'西复室仅提示边界，不建完整复室'});
  // Narrow paving joints improve scale reading without pretending to survey every stone.
  for(let x=-3.4;x<3.6;x+=.56)box('foundation','foundation',[x,.162,-2.4],[.012,.005,4.75],'stone',{key:'paving/line-x/'+x});for(let z=-4.6;z<0;z+=.56)box('foundation','foundation',[0,.162,z],[7.1,.005,.012],'stone',{key:'paving/line-z/'+z});
 }
 const meshes=[];for(const b of buckets.values()){if(!b.items.length)continue;const m=new T.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);m.userData={records:b.items,materialKey:b.mat,layer:b.l,tier:b.tier};b.items.forEach((r,i)=>m.setMatrixAt(i,new T.Matrix4().compose(V(r.position),new T.Quaternion(...r.orientation),V(r.scale))));m.castShadow=true;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.l).add(m);meshes.push(m);}
 function setOpening(degrees){for(const m of meshes){let changed=false;m.userData.records.forEach((r,i)=>{if(!r.motion)return;const rot=yaw(r.motion.sign*degrees*Math.PI/180),pivot=V(r.motion.pivot),pos=V(r.position).sub(pivot).applyQuaternion(rot).add(pivot),q=rot.clone().multiply(new T.Quaternion(...r.orientation));m.setMatrixAt(i,new T.Matrix4().compose(pos,q,V(r.scale)));changed=true;});if(changed){m.instanceMatrix.needsUpdate=true;m.computeBoundingBox();m.computeBoundingSphere();}}root.updateMatrixWorld(true);}
 root.updateMatrixWorld(true);return{root,layers,records,meshes,detailOnly,node,setOpening};
}
