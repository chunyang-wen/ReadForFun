import * as T from '../vendor/three.module.js';
import {LAYERS} from './data.js';
export const MODEL_REVISION='chengzhi-20261016-02';
// Local frame, metres: +Z faces the courtyard; geographic north remains unresolved.
export const SPEC={xs:[-3.13,-1.61,1.61,3.13],zs:[-4.8,-2.4,0],floor:.18,foot:.42,head:3.8,upperHead:6.2,depth:4.8};
export const ROOF={halfX:3.4,minZ:-5.05,maxZ:.25,ridgeZ:-2.4};
export const roofY=z=>8.182-.48*Math.abs(z+2.4);
export function getColumnGrid(){return {xs:SPEC.xs,zs:SPEC.zs,points:SPEC.xs.flatMap((x,i)=>SPEC.zs.map((z,j)=>({x,z,i,j})))};}
const V=a=>new T.Vector3(...a),Q=()=>new T.Quaternion(),Y=a=>Q().setFromAxisAngle(V([0,1,0]),a),cache=new Map();
const G=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
function prism(points,depth,holes=[]){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();for(const points of holes){const h=new T.Path();points.forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;}
// Closed strip shell: consistently upward top, downward underside and outward edges.
export function patch(points,thickness=.035){
 const n=points.length,idx=[];for(let k=0;k<n/2-1;k++){const j=k*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}
 const va=V(points[idx[0]]),vb=V(points[idx[1]]),vc=V(points[idx[2]]);
 if(vb.sub(va).cross(vc.sub(va)).y<0)for(let k=0;k<idx.length;k+=3)[idx[k+1],idx[k+2]]=[idx[k+2],idx[k+1]];
 const top=[...idx],edges=new Map();for(let k=0;k<top.length;k+=3)for(const [a,b] of [[top[k],top[k+1]],[top[k+1],top[k+2]],[top[k+2],top[k]]]){const key=[a,b].sort((a,b)=>a-b).join(':');if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
 for(let k=0;k<top.length;k+=3)idx.push(top[k]+n,top[k+2]+n,top[k+1]+n);
 for(const [a,b] of edges.values())idx.push(b,a,a+n,b,a+n,b+n);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...points,...points.map(([x,y,z])=>[x,y-thickness,z])].flat(),3));g.setIndex(idx);const flat=g.toNonIndexed();flat.computeVertexNormals();return flat;
}
export const ceilingY=x=>4.5+.58*(1-(x/1.61)**2);
export function buildModel(materials,{detailOnly=false,node='spandrel'}={}){
 const root=new T.Group(),layers=new Map(LAYERS.map(l=>{const g=new T.Group();root.add(g);return[l.id,g];})),records=[],buckets=new Map(),serial=new Map();
 const boxGeo=G('box',()=>new T.BoxGeometry(1,1,1)),cyl=G('cyl',()=>new T.CylinderGeometry(1,1,1,20));
 function add(l,type,g,p,s=[1,1,1],q=Q(),mat='wood',e={}){const key=e.key||`${l}/${type}`,n=(serial.get(key)||0)+1;serial.set(key,n);const r={id:`${key}/${n}`,key,layer:l,type,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'教学比例；完整前厅剖面待核',unit:'m',basis:'本厅地坪及局部参照线',...e};records.push(r);const tier=detailOnly?e.tier||0:0,k=`${l}:${g.uuid}:${mat}:${tier}`;if(!buckets.has(k))buckets.set(k,{l,g,mat,tier,items:[]});buckets.get(k).items.push({r,m:new T.Matrix4().compose(V(p),q,V(s))});return r;}
 const box=(l,t,p,s,mat='wood',e={},q=Q())=>add(l,t,boxGeo,p,s,q,mat,e);
 function beam(l,t,a,b,w,h,mat='wood',e={}){const d=V(b).sub(V(a)),length=d.length(),dir=d.clone().normalize(),right=V([0,1,0]).cross(dir).normalize(),up=dir.clone().cross(right).normalize(),q=Q().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,dir));return add(l,t,boxGeo,V(a).add(V(b)).multiplyScalar(.5).toArray(),[w,h,length],q,mat,{endpoints:[a,b],width:w,height:h,length,...e});}
 function round(l,t,a,b,r,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,cyl,V(a).add(V(b)).multiplyScalar(.5).toArray(),[r,d.length(),r],Q().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],radius:r,...e});}
 function column(x,z,foot,head,key,type='column',support=''){return round('columns',type,[x,foot,z],[x,head,z],type==='post'?.11:.145,'column',{key,foot,head,support,source:type==='column'?'Fang2024 图8f、11；柱径高推定':'隐藏支承教学补足',status:type==='column'?'图像判读':'比例推定'});}
 function spandrel(x,y,z,s,key,host,tier=1){
  // Curved outer boundary with a real inner opening; no invented floral relief.
  const outline=[[0,0],[.86,0],[.84,-.1],[.72,-.2],[.57,-.27],[.44,-.4],[.28,-.57],[.12,-.65],[0,-.65]],hole=[[.13,-.14],[.57,-.14],[.46,-.24],[.3,-.4],[.13,-.48]];
  const g=G('spandrel'+s,()=>prism(outline.map(([a,b])=>[s*a,b]),.095,[hole.map(([a,b])=>[s*a,b])]));
  add('brackets','spandrel',g,[x,y,z],[1,1,1],Q(),'wood',{key,host,tier,status:'图像判读',source:'Fang2024 图8f、图11北立面：只取可见轮廓；厚度推定',contactTop:y,contactSide:x,note:'细刻纹样、隐蔽榫卯未复原；透孔为轮廓概括'});
 }
 // Sculptural silhouettes use source-readable contours, never painted planar textures.
 function silhouette(x,y,z,w,h,depth,l,t,shape,meta,q=Q()){
  const forms={person:[[-.32,-.5],[.29,-.5],[.38,-.29],[.28,.08],[.17,.24],[.2,.37],[.1,.5],[-.07,.5],[-.17,.4],[-.15,.25],[-.3,.14],[-.37,-.08]],seated:[[-.45,-.5],[.35,-.5],[.32,-.32],[.17,-.16],[.2,.13],[.12,.24],[.18,.37],[.08,.5],[-.07,.5],[-.16,.38],[-.1,.23],[-.27,.08],[-.4,-.14]],rock:[[-.5,-.5],[.5,-.5],[.4,-.18],[.47,.13],[.27,.23],[.15,.5],[-.18,.4],[-.32,.07],[-.5,-.06]]};
  return add(l,t,G(`silhouette/${shape}/${depth}`,()=>prism(forms[shape],depth)),[x,y,z],[w,h,1],q,'carved',meta);
 }
 function banquet(x,y,z,key,host){
  const h=.33,w=2,depth=.055,back=z;const evidence={host,status:'图像判读',source:'Fang2024 第15页及图8e；轮廓概括、八站位非逐层实测',note:'四桌与人物群为照片可辨的抽象轮廓；不复刻脸部、衣褶、刀痕',tier:0};
  // Source Fig8e and 2022 front photo: arched upper edge, straight lower edge; backside on host face.
  const outline=[[-1,.165],[1,.165],[.98,.055],[.93,-.02],[.82,-.105],[.63,-.15],[.36,-.165],[-.36,-.165],[-.63,-.15],[-.82,-.105],[-.93,-.02],[-.98,.055]];
  add('carving','relief',G('banquet/bed',()=>prism(outline.map(([x,y])=>[x,-y]),.006)),[x,y,back+.003],[1,1,1],Q(),'darkwood',{...evidence,key:key+'/bed',depthIndex:0,front:back+.006,back,source:'Fang2024 图8e；约2×0.33m，轮廓判读',documentedExtent:[w,h,depth]});
  const surface=d=>back+.006+d*((.055-.009)/7);
  // Eight depth stations from background to foreground: architectural silhouettes, tables, people.
  for(const [a,b,c] of [[-.73,-.4,.26],[-.28,.23,.48],[.3,.87,.36]]){
   box('carving','relief',[x+(a+b)/2,y+.085,surface(1)],[b-a,.018,.006],'carved',{...evidence,key:key+'/roofline',tier:1,depthIndex:1,back:surface(1)-.003,front:surface(1)+.003});
   for(const xx of [a,b])box('carving','relief',[x+xx,y+.025,surface(1)],[.015,.12,.006],'carved',{...evidence,key:key+'/pavilion',tier:1,depthIndex:1});
  }
  for(const [i,xx] of [-.59,-.18,.23,.63].entries()){
   box('carving','relief',[x+xx,y-.041,surface(3)],[.18,.018,.006],'carved',{...evidence,key:key+'/table/'+i,tier:3,depthIndex:3,role:'table'});
   for(const s of [-1,1])box('carving','relief',[x+xx+s*.07,y-.085,surface(3)],[.015,.075,.006],'carved',{...evidence,key:key+'/table-leg/'+i,tier:3,depthIndex:3});
  }
  // Positions are a sparse contour reading of groups, not a catalogue of the original figures.
  const groups=[[-.88,-.79,-.69,-.51,-.4],[-.31,-.22,-.11,.01],[.11,.23,.33,.43],[.52,.62,.72,.82,.89]];
  groups.forEach((group,j)=>group.forEach((xx,k)=>{const d=4+(j+k)%4,hh=.11+(k%2)*.015,yy=y-.033+(k%2)*.04;silhouette(x+xx,yy,surface(d),.055,hh,.006,'carving','figure',k%2?'seated':'person',{...evidence,key:key+'/figure/'+j+'-'+k,tier:d,depthIndex:d,back:surface(d)-.003,front:surface(d)+.003});}));
  for(const [i,xx] of [-.9,-.47,.05,.93].entries())silhouette(x+xx,y-.085,surface(2),.08,.08,.006,'carving','relief','rock',{...evidence,key:key+'/ground/'+i,tier:2,depthIndex:2});
  // Defined layer 0..7 metadata is deliberately distinct from historical carving cuts.
 }
 function door(cx,y,z,w,key,angle=0){
  const q=Y(angle),P=a=>V(a).applyQuaternion(q).add(V([cx,y,z])).toArray(),host=key+'/panel/1',e={key,status:'图像判读',source:'Fang2024 第15页 图9a/b；实板、透空位置有据，尺寸推定',tier:0};
  const B=(l,t,p,s,mat,meta)=>box(l,t,P(p),s,mat,{...e,...meta},q);
  // A pair of leaves, each with structural stiles and rails, a solid lower panel and open upper field.
  for(const leaf of [-1,1]){const a=leaf*w/4,lw=w/2;
   for(const sx of [-1,1])B('enclosure','enclosure',[a+sx*(lw/2-.026),0,0],[.052,2.6,.08],'door',{key:key+'/stile/'+leaf});
   for(const yy of [-1.3,-.42,1.02,1.3])B('enclosure','enclosure',[a,yy,0],[lw,.055,.08],'door',{key:key+'/rail/'+leaf});
   const panel=B('enclosure','enclosure',[a,-.84,0],[lw-.10,.79,.044],'darkwood',{key:key+'/panel/'+leaf,role:'solidPanel'});
   // Source shows a rectangular portrait frame nested in the open carved lattice.
   for(const sx of [-1,1])B('carving','openwork',[a+sx*lw*.22,.31,.037],[.027,1.02,.026],'carved',{key:key+'/portrait-frame/'+leaf,host:key+'/stile/'+leaf+'/1',tier:1});
   for(const yy of [-.2,.82])B('carving','openwork',[a,yy,.037],[lw*.47,.027,.026],'carved',{key:key+'/portrait-frame/'+leaf,host:key+'/stile/'+leaf+'/1',tier:1});
   // Broken geometric perimeter, simplified from Fig9; no fabricated detailed pattern.
   for(const sx of [-1,1])for(let k=0;k<7;k++){const xx=a+sx*(lw*.37),yy=-.31+k*.18;B('carving','openwork',[xx,yy,.035],[.10,.026,.022],'carved',{key:key+'/open-border/'+leaf,host:key+'/stile/'+leaf+'/1',tier:1});B('carving','openwork',[xx+sx*.034,yy+.052,.035],[.023,.10,.022],'carved',{key:key+'/open-border/'+leaf,host:key+'/stile/'+leaf+'/1',tier:1});}
   for(const yy of [1.12])for(let k=0;k<5;k++)B('enclosure','enclosure',[a+(k-2)*(lw-.13)/5,yy,0],[.02,.14,.026],'wood',{key:key+'/transom/'+leaf});
   for(const [sx,hh,yy] of [[-.12,.46,.22],[.14,.31,.1]])silhouette(...P([a+sx*lw,yy,.054]),lw*.21,hh,.017,'carving','figure','person',{...e,key:key+'/open-figure/'+leaf,host:key+'/stile/'+leaf+'/1',tier:2},q);
   for(const [sx,hh,yy] of [[-.15,.40,-.83],[.15,.27,-.90]])silhouette(...P([a+sx*lw,yy,.032]),lw*.22,hh,.02,'carving','doorrelief','person',{...e,key:key+'/lower-relief/'+leaf,host:panel.id,tier:1},q);
   B('carving','doorrelief',[a,-1.08,.032],[lw*.6,.035,.02],'carved',{key:key+'/lower-ground/'+leaf,host:panel.id,tier:1});
  }
 }
 function roofAssembly(xs,z0=-4.8,z1=0,prefix='frame',detail=false){
  // Seven purlin stations; every underside is supported by a beam or a post on a beam.
  const zs=[z0,z0+.8,z0+1.6,z0+2.4,z0+3.2,z0+4,z1];
  for(const [i,x] of xs.entries()){
   const b=beam('roofFrame','frame',[x,6.54,z0],[x,6.54,z1],.23,.36,'wood',{key:`${prefix}/${i}/base`,support:detail?`local-cap/${x}/${z0}/1 + local-cap/${x}/${z1}/1`:`uppercap/${i}/0/1 + uppercap/${i}/2/1`,foot:6.36,top:6.72,tier:0});
   // Reduced-length raised tie connects the two level-2 seats; a central ridge post bears on it.
   const levelY=roofY(zs[2])-.31;const upper=beam('roofFrame','frame',[x,levelY-.10,zs[2]],[x,levelY-.10,zs[4]],.18,.20,'wood',{key:`${prefix}/${i}/raised`,foot:levelY-.20,top:levelY,tier:1});
   for(const [k,z] of zs.entries()){
    const py=roofY(z)-.20,foot=k===3?upper.top:b.top,head=py-.11;
    if(![0,2,4,6].includes(k))column(x,z,foot,head,`${prefix}/${i}/seat/${k}`,'post',k===3?upper.id:b.id);
   }
   // Separate raised-beam supports meet its underside rather than intersecting the purlin seats.
   for(const z of [zs[2],zs[4]])column(x,z,b.top,upper.foot,`${prefix}/${i}/raised-support/${z}`,'post',b.id);
  }
  for(const [k,z] of zs.entries())round('purlins','purlin',[xs[0]-.16,roofY(z)-.20,z],[xs.at(-1)+.16,roofY(z)-.20,z],.11,'wood',{key:`${prefix}/purlin/${k}`,tier:2,station:k,support:xs.map((x,i)=>`${prefix}/${i}/${k===0||k===6?'base':k===2||k===4?'raised':'seat/'+k}/1`).join(' + ')});
  for(let x=xs[0]-.10;x<=xs.at(-1)+.1;x+=.22)for(let k=0;k<6;k++)round('rafters','rafter',[x,roofY(zs[k])-.09+.045/Math.sqrt(1+.48**2),zs[k]],[x,roofY(zs[k+1])-.09+.045/Math.sqrt(1+.48**2),zs[k+1]],.045,'rafter',{key:`${prefix}/rafter/${x.toFixed(2)}/${k}`,tier:3,support:`${prefix}/purlin/${k}/1 + ${prefix}/purlin/${k+1}/1`});
 }
 if(detailOnly){
  if(node==='spandrel'){
   column(-1.61,0,.42,3.8,'local-column','column','local-base/1');round('foundation','base',[-1.61,.18,0],[-1.61,.42,0],.23,'stone',{key:'local-base',foot:.18,head:.42});
   const b=beam('ties','beam',[-1.61,3.98,0],[1.61,3.98,0],.28,.36,'wood',{key:'local-beam',tier:0,foot:3.8,top:4.16});spandrel(-1.465,3.8,0,1,'local-spandrel',b.id,1);
  }else if(node==='banquet'){
   const b=beam('ties','beam',[-1.35,0,0],[1.35,0,0],.28,.42,'wood',{key:'local-banquet-beam',tier:0});banquet(0,0,.14,'local-banquet',b.id);
  }else if(node==='door')door(0,1.3,0,1.32,'local-door');
  else if(node==='roof'){
   for(const x of [0,.8])for(const z of [-4.8,0]){column(x,z,5.4,6.2,'local-roof-column/'+x+'/'+z,'post');box('ties','beam',[x,6.28,z],[.35,.16,.35],'wood',{key:'local-cap/'+x+'/'+z,tier:0,foot:6.2,top:6.36});}
   roofAssembly([0,.8],-4.8,0,'local-roof',true);
  }
 }else{
  box('foundation','foundation',[0,.07,-2.4],[6.65,.22,5.05],'stone',{key:'floor',foot:-.04,top:.18});
  box('foundation','context',[0,.035,1.25],[6.65,.15,2.5],'lightstone',{key:'context',status:'比例推定',source:'天井仅地坪语境，另三面不建',top:.11});
  // Pavement joints are geometry; there is no imitation relief texture.
  for(let x=-3;x<=3;x+=.6)box('foundation','foundation',[x,.182,-2.4],[.009,.004,4.95],'joint',{key:'paving/x'});
  for(let z=-4.6;z<.1;z+=.6)box('foundation','foundation',[0,.182,z],[6.5,.004,.009],'joint',{key:'paving/z'});
  for(const p of getColumnGrid().points){
   const base=round('foundation','base',[p.x,.18,p.z],[p.x,.42,p.z],.235,'stone',{key:`base/${p.i}/${p.j}`,foot:.18,head:.42,status:'图像判读',source:'图8f可见柱础；后部位置及尺寸推定'});
   column(p.x,p.z,.42,3.8,`column/${p.i}/${p.j}`,'column',base.id);
   const cap=box('ties','beam',[p.x,4.22,p.z],[.33,.12,.33],'wood',{key:`cap/${p.i}/${p.j}`,foot:4.16,top:4.28});
   column(p.x,p.z,4.28,6.2,`upper/${p.i}/${p.j}`,'post',cap.id);
   box('ties','beam',[p.x,6.28,p.z],[.35,.16,.35],'wood',{key:`uppercap/${p.i}/${p.j}`,foot:6.2,top:6.36});
  }
  for(const [j,z] of SPEC.zs.entries())for(let i=0;i<3;i++){
   const b=beam('ties','beam',[SPEC.xs[i],3.98,z],[SPEC.xs[i+1],3.98,z],.28,.36,'wood',{key:`cross/${i}/${j}`,foot:3.8,top:4.16,support:`column/${i}/${j}/1 + column/${i+1}/${j}/1`,status:j===2?'图像判读':'比例推定',source:j===2?'Fang2024 图11北立面与8f；截面推定':'后部跨接教学推定'});
   if(j===2&&i===1){
    const outline=[[-1.61,3.8],[1.61,3.8],...Array.from({length:33},(_,k)=>{const x=1.61-3.22*k/32;return [x,4.16+.09*(1-(x/1.61)**2)];})];
    // Same ID, same supports; end seats stay at 4.16. Crown rise is a proportion, not survey data.
    for(const bucket of buckets.values()){const item=bucket.items.find(v=>v.r===b);if(item){bucket.items.splice(bucket.items.indexOf(item),1);break;}}
    b.top=4.25;b.crownRise=.09;b.position=[0,3.98,z];b.scale=[1,1,1];b.orientation=Q().toArray();b.profileExtent=[3.22,.45,.28];b.source='Fang2024 图8e/f、2022承志堂正向照片；梁冠起拱轮廓判读，起拱量推定';
    const g=G('front/crowned-beam',()=>prism(outline.map(([x,y])=>[x,y-3.98]),.28)),k='ties:'+g.uuid+':wood:0';buckets.set(k,{l:'ties',g,mat:'wood',tier:0,items:[{r:b,m:new T.Matrix4().makeTranslation(0,3.98,z)}]});
    banquet(0,3.98,z+.14,'front/banquet',b.id);for(const s of [-1,1])spandrel(s*1.465,3.8,z,-s,`front/spandrel/${s}`,b.id);}
   beam('ties','beam',[SPEC.xs[i],6.05,z],[SPEC.xs[i+1],6.05,z],.17,.22,'wood',{key:`upper-tie/${i}/${j}`});
  }
  for(const [i,x] of SPEC.xs.entries())for(let j=0;j<2;j++)beam('ties','beam',[x,3.98,SPEC.zs[j]],[x,3.98,SPEC.zs[j+1]],.23,.36,'wood',{key:`longitudinal/${i}/${j}`,support:`column/${i}/${j}/1 + column/${i}/${j+1}/1`,foot:3.8,top:4.16});
  // Barrel-shaped visible ceiling and transverse curving bearers, not a fictitious caisson.
  const curve=ceilingY;
  for(const z of [-.24,-2.4,-4.56])for(const x of [-1.61,1.61])box('ceiling','ceiling',[x,4.305,z],[.13,.29,.14],'wood',{key:'ceiling/seat/'+x+'/'+z,foot:4.16,top:4.45,support:`longitudinal/${x<0?1:2}/${z>=-2.4?1:0}/1`,source:'棚托接触教学补足；非实测节点'});
  for(const z of [-.24,-2.4,-4.56]){
   const xs=Array.from({length:33},(_,k)=>-1.61+3.22*k/32),outline=[...xs.map(x=>[x,curve(x)+.05]),...xs.toReversed().map(x=>[x,curve(x)-.05])];
   add('ceiling','ceiling',G('ceiling/bearer',()=>prism(outline,.075)),[0,0,z],[1,1,1],Q(),'darkwood',{key:'ceiling/curve/'+z,source:'图11北立面可见曲线棚托；连续轮廓、曲率和截面推定',status:'图像判读',support:[-1.61,1.61].map(x=>'ceiling/seat/'+x+'/'+z+'/1').join(' + ')});
  }
  const shell=[];for(let k=0;k<=32;k++){const x=-1.61+3.22*k/32;shell.push([x,curve(x)+.085,-4.65],[x,curve(x)+.085,-.15]);}
  add('ceiling','ceiling',patch(shell),[0,0,0],[1,1,1],Q(),'ceilingPanel',{key:'ceiling/shell',status:'图像判读',source:'图5b、8f 拱棚；棚板深度推定'});
  for(let x=-1.5;x<1.61;x+=.15)round('ceiling','ceiling',[x,curve(x)+.093,-4.65],[x,curve(x)+.093,-.15],.008,'darkwood',{key:'ceiling/seam'});
  roofAssembly(SPEC.xs);
  for(const s of [-1,1]){const z1=s<0?ROOF.minZ:ROOF.maxZ;add('roof','roof',patch([[-3.4,roofY(-2.4)+.06,-2.4],[3.4,roofY(-2.4)+.06,-2.4],[-3.4,roofY(z1)+.06,z1],[3.4,roofY(z1)+.06,z1]]),[0,0,0],[1,1,1],Q(),'roofBoard',{key:'roof/slope/'+s});for(let x=-3.3;x<=3.3;x+=.2)round('roof','roof',[x,roofY(-2.4)+.10,-2.4],[x,roofY(z1)+.10,z1],.026,'tile',{key:'roof/tile'});}
  round('roof','roof',[-3.4,8.33,-2.4],[3.4,8.33,-2.4],.085,'ridge',{key:'roof/ridge'});
  // Side-room boundary doors only: no additional courtyard wings or rear hall.
  for(const s of [-1,1]){
   for(const [j,z] of [-1.2,-3.6].entries())door(s*1.61,1.73,z,1.32,`side-door/${s}/${j}`,s*Math.PI/2);
   box('enclosure','enclosure',[s*3.24,3.35,-2.4],[.13,6.34,4.85],'plaster',{key:'side/wall/'+s,source:'裁取本厅厢房界面；截段墙体推定'});
   // Upper boards leave central hall open; no continuous floor sealing the barrel ceiling.
   box('enclosure','enclosure',[s*2.37,4.29,-2.4],[1.52,.11,4.8],'darkwood',{key:'side/floor/'+s});
   for(let j=0;j<2;j++){const z=-1.2-j*2.4;box('enclosure','enclosure',[s*1.61,4.84,z],[.07,.86,2.22],'door',{key:'upper/panel/'+s+'/'+j});for(let k=0;k<11;k++)box('enclosure','enclosure',[s*1.61,5.46,z+(k-5)*.18],[.05,.30,.024],'wood',{key:'upper/lattice/'+s+'/'+j});for(const yy of [5.28,5.65])box('enclosure','enclosure',[s*1.61,yy,z],[.09,.055,2.3],'wood',{key:'upper/rail/'+s+'/'+j});}
  }
  box('enclosure','enclosure',[0,2.02,-4.83],[6.28,3.68,.10],'darkwood',{key:'rear/panel',source:'后边界为教学围护；不建后厅'});
  box('enclosure','enclosure',[0,4.56,-4.74],[1.6,.43,.08],'wood',{key:'plaque/carrier',status:'图像判读',source:'图5b 承志堂匾载体；字形不造'});
  for(const s of [-1,1])box('enclosure','enclosure',[s*2.37,4.84,0],[1.4,.95,.07],'door',{key:'front/upper-side/'+s});
  // Front upper enclosure is visible in the 2022 photos; no bare invented gallery opening.
  box('enclosure','enclosure',[0,4.84,0],[2.93,.95,.07],'door',{key:'front/upper-center',status:'图像判读',source:'EditQ2022 Cheng Zhi Tang.jpg 上层木作；范围判读、板宽高推定'});
  for(const x of [-1.61,0,1.61])box('enclosure','enclosure',[x,5.33,0],[.055,1.8,.085],'wood',{key:'front/upper-stile',source:'2022上层竖框可见；分格与尺寸推定'});
  for(const yy of [5.35,5.70])box('enclosure','enclosure',[0,yy,0],[3.22,.055,.085],'wood',{key:'front/upper-rail',status:'图像判读',source:'2022上层横向透空带；尺寸推定'});
  for(let k=0;k<17;k++)box('enclosure','enclosure',[(k-8)*.18,5.525,0],[.025,.30,.026],'wood',{key:'front/upper-lattice',source:'2022上层格心位置；疏格教学概括，非原纹样'});
  box('enclosure','enclosure',[0,5.93,0],[2.93,.40,.07],'darkwood',{key:'front/upper-board',status:'图像判读',source:'2022上层实板与檐下木作；分格尺寸推定'});

 }
 const meshes=[];for(const b of buckets.values()){if(!b.items.length)continue;const m=new T.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);m.userData={records:b.items.map(v=>v.r),materialKey:b.mat,layer:b.l,tier:b.tier};b.items.forEach((v,i)=>m.setMatrixAt(i,v.m));m.castShadow=true;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.l).add(m);meshes.push(m);}root.updateMatrixWorld(true);return{root,layers,records,meshes,detailOnly,node};
}
