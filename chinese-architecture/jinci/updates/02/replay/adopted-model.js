import * as T from '/chinese-architecture/vendor/three.module.js';
import {ceramicField} from './adopted-ceramic.js';
import {LAYERS} from './adopted-data.js';
// Metres. Absolute dimensions below are teaching proportions, never surveyed coordinates.
export const SPEC={bays:[3.0,3.6,3.9,5.7,3.9,3.6,3.0],depths:[3.0,3.3,3.3,3.3,3.3,3.0],base:.8,lowHead:5.6,highHead:9.5,slot:1.8};
const axes=a=>{let x=-a.reduce((s,v)=>s+v,0)/2;return [x,...a.map(v=>x+=v)];};
export function getColumnGrid(){const xs=axes(SPEC.bays),zs=axes(SPEC.depths),outer=[],inner=[],short=[];
 for(let i=0;i<8;i++)for(let j=0;j<7;j++){const p={x:xs[i],z:zs[j],i,j};if(i===0||i===7||j===0||j===6)outer.push(p);else if((i===1||i===6)&&(j>=1&&j<=5)||((j===1||j===5)&&i>=1&&i<=6)){if(j===5&&i>=2&&i<=5)short.push(p);else inner.push(p);}}
 // Two interior support points are a schematic reading; not a coordinate transcription.
 for(const i of [2,5])inner.push({x:xs[i],z:SPEC.slot,i,j:3,slot:true});return {xs,zs,outer,inner,short};}
export const ROOF={halfX:14.9,halfZ:9.1,ridgeHalf:8.65,breakZ:3.5,eaveY:11.35,ridgeY:17.2};
export function roofY(d){const a=[[0,17.267],[1.5,15.903],[3.1,14.577],[4.8,13.551],[6.6,12.493],[8.8,11.51],[9.1,11.35]],v=Math.min(9.1,Math.abs(d));for(let i=1;i<a.length;i++)if(v<=a[i][0]){const t=(v-a[i-1][0])/(a[i][0]-a[i-1][0]);return a[i-1][1]+t*(a[i][1]-a[i-1][1]);}return 11.35;}
export function surfaceY(x,z){return roofY(Math.max(Math.abs(z),Math.abs(x)>ROOF.ridgeHalf?ROOF.breakZ+(Math.abs(x)-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ):0));}
const V=a=>new T.Vector3(...a),Y=a=>new T.Quaternion().setFromAxisAngle(V([0,1,0]),a),cache=new Map();
const G=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
function prism(points,depth){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;}
const arm=()=>G('arm',()=>prism([[-.5,.12],[-.5,-.01],[-.38,-.04],[-.24,-.15],[.24,-.15],[.38,-.04],[.5,-.01],[.5,.12]],1));
function patch(points){const p=points.flat(),idx=[];for(let i=0;i<points.length/2-1;i++){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));for(let i=0;i<idx.length;i+=3){const a=V(points[idx[i]]),b=V(points[idx[i+1]]),c=V(points[idx[i+2]]);if(b.sub(a).cross(c.sub(a)).y<0)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];}g.setIndex(idx);g.computeVertexNormals();return g;}
// Beam top falls in X; extruded longitudinally in Z. A high-side direction is metadata.
function slopeGeo(sign=1){return G('slope'+sign,()=>prism([[-.5,-.5],[.5,-.5],[.5,sign===1?.3:.5],[-.5,sign===1?.5:.3]],1));}
function humpGeo(sign=1){return G('hump'+sign,()=>prism([[-.5,sign===1?.1:-.1],[.5,sign===1?-.1:.1],[.5,.24],[.32,.48],[-.32,.48],[-.5,.24]],1));}
export function buildModel(materials,{detailOnly=false,node='lower'}={}){
 const root=new T.Group(),layers=new Map(LAYERS.map(l=>{const g=new T.Group();g.userData.layer=l.id;root.add(g);return [l.id,g];})),records=[],buckets=new Map(),serial=new Map();
 const boxGeo=G('box',()=>new T.BoxGeometry(1,1,1)),cyl=G('cyl',()=>new T.CylinderGeometry(1,1,1,20)),sphere=G('sphere',()=>new T.SphereGeometry(1,14,10));
 function add(l,t,g,p,s=[1,1,1],q=new T.Quaternion(),mat='wood',e={}){const key=e.key||`${l}/${t}`,n=(serial.get(key)||0)+1;serial.set(key,n);const r={id:`${key}/${n}`,layer:l,type:t,position:[...p],scale:[...s],orientation:q.toArray(),status:'比例推定',source:'2018图5 / 教学比例',...e};records.push(r);const tier=detailOnly?e.tier||0:0,k=`${l}:${g.uuid}:${mat}:${tier}`;if(!buckets.has(k))buckets.set(k,{l,g,mat,tier,items:[]});buckets.get(k).items.push({r,m:new T.Matrix4().compose(V(p),q,V(s))});return r;}
 const box=(l,t,p,s,mat='wood',e={},q=new T.Quaternion())=>add(l,t,boxGeo,p,s,q,mat,e);
 function beam(l,t,a,b,w,h,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,boxGeo,V(a).add(V(b)).multiplyScalar(.5).toArray(),[w,d.length(),h],new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],...e});}
 function round(l,t,a,b,r,mat='wood',e={}){const d=V(b).sub(V(a));return add(l,t,cyl,V(a).add(V(b)).multiplyScalar(.5).toArray(),[r,d.length(),r],new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),mat,{endpoints:[a,b],...e});}
 function sloped(l,t,x,y,a,b,w,h,sign,e={}){const flat=e.section==='rectangular';return add(l,t,flat?boxGeo:slopeGeo(sign),[x,y,(a+b)/2],[w,flat?h*.9:h,b-a],new T.Quaternion(),'wood',{endpoints:[[x,y,a],[x,y,b]],highSide:flat?'none':sign===1?'-X':'+X',topAtCenter:y+h*(flat?.45:.4),...e});}
 function dou(p,w=.48,h=.26,q=new T.Quaternion(),e={}){const dg=G('dou',()=>{const g=new T.CylinderGeometry(.707,.43,1,4);g.rotateY(Math.PI/4);return g;});add('brackets','dou',dg,[p[0],p[1]-h*.15,p[2]],[w,h*.7,w],q,'endgrain',e);for(const a of [-1,1])for(const b of [-1,1])box('brackets','dou',V([a*w*.34,h*.34,b*w*.34]).applyQuaternion(q).add(V(p)).toArray(),[w*.32,h*.32,w*.32],'wood',e,q);}
 function bracket(x,y,z,angle,kind='lower',key='local'){const q=Y(angle),P=a=>V(a).applyQuaternion(q).add(V([x,y,z])).toArray(),upper=kind.startsWith('upper'),flat=kind.endsWith('-flat'),n=upper?3:2;
 const meta=k=>({key:`${key}/${k}`,assembly:key,tier:k,kind,status:'图像判读',source:'故宫103页图十之8；尺度推定'});
 dou(P([0,.13,0]),.64,.26,q,meta(0));
 for(let k=1;k<=n;k++){const d=.48*k,hy=.30+(k-1)*.40;add('brackets','gong',arm(),P([0,hy,(d-.65)/2]),[d+.65,.25,.22],q.clone().multiply(Y(Math.PI/2)),'wood',{...meta(k),step:k});
 for(const v of [d,-.55]){dou(P([0,hy+.23,v]),.34,.23,q,meta(k));add('brackets','gong',arm(),P([0,hy+.47,v]),[1.3,.25,.22],q,'wood',meta(k));for(const sx of [-1,1])dou(P([sx*.45,hy+.67,v]),.29,.20,q,meta(k));}
 if((!upper&&!flat)||(upper&&flat&&k>=2)||k===n){const ag=G('ang',()=>prism([[-.5,.12],[.5,.12],[.5,-.05],[.33,-.12],[-.5,-.10]],1));add('brackets','ang',ag,P([0,hy-.04,d*.45]),[d+.9,.32,.22],q.clone().multiply(Y(Math.PI/2)),'darkwood',{...meta(k),horizontal:true,step:k,mouthRole:upper&&!flat||!upper&&flat?'昂形出头':'平出昂',note:upper?'昂形出头：后尾不补造成长斜昂':'平出琴面昂轮廓；加工节点待核'});}}
 const seat=y+.30+(n-1)*.4+.77;box('brackets','gong',P([0,seat-y+.09,n*.48]),[1.8,.18,.30],'wood',{...meta(n+1),bearing:true,seatY:seat},q);
 box('brackets','gong',P([0,seat-y+.09,0]),[1.8,.18,.30],'wood',{...meta(n+1),centralBearing:true,seatY:seat},q);return seat+.18;}
 function col(p,foot,head,type='column',e={}){return round('columns',type,[p.x,foot,p.z],[p.x,head,p.z],type==='short'?.32:.34,'column',{key:`col/${p.i}-${p.j}/${type}`,grid:[p.i,p.j],foot,head,support:type==='short'?`porch/${p.i}`:`base/${p.i}-${p.j}`,status:'图像判读',source:'图19、2018图5；高度/柱径推定',...e});}
 function dragon(x,z,foot,height,r=.34,key='dragon'){const e={key,source:'dragon:图6、7相邻段',status:'图像判读',tier:2,host:key.startsWith('front/')?`col/${key.split('/').at(-1)}-6/column/1`:'col/0-0/column/1',note:'原创盘龙概括；分离动画非实物装配方式'};
 const points=[];for(let i=0;i<=72;i++){const t=i/72,a=t*Math.PI*4.3-.7;points.push([x+(r+.12)*Math.cos(a),foot+.5+t*(height-1.15),z+(r+.12)*Math.sin(a)]);}
 for(let i=0;i<72;i++)round('ceiling','dragon',points[i],points[i+1],.105,'darkwood',e);
 // Scales sit on the outer side of the coil, not floating in the aisle.
 for(let i=1;i<72;i+=2){const a=i/72*Math.PI*4.3-.7,p=points[i];add('ceiling','dragon',sphere,[p[0]+.065*Math.cos(a),p[1],p[2]+.065*Math.sin(a)],[.07,.043,.025],Y(-a),'wood',e);}
 const h=points[68];add('ceiling','dragon',sphere,[h[0],h[1],h[2]+.11],[.23,.18,.31],Y(.25),'darkwood',e);add('ceiling','dragon',sphere,[h[0],h[1]-.03,h[2]+.36],[.16,.10,.20],new T.Quaternion(),'wood',e);
 for(const s of [-1,1]){add('ceiling','dragon',sphere,[h[0]+s*.17,h[1]+.09,h[2]+.29],[.047,.045,.039],new T.Quaternion(),'eye',e);beam('ceiling','dragon',[h[0]+s*.13,h[1]+.10,h[2]],[h[0]+s*.25,h[1]+.47,h[2]-.1],.043,.043,'wood',e);beam('ceiling','dragon',[h[0]+s*.25,h[1]+.42,h[2]-.1],[h[0]+s*.35,h[1]+.53,h[2]-.20],.028,.028,'wood',e);
 const whisk=[];for(let i=0;i<=12;i++)whisk.push([h[0]+s*(.14+i*.028),h[1]-.05+Math.sin(i/12*Math.PI)*.12,h[2]+.43-i*.014]);for(let i=0;i<12;i++)round('ceiling','dragon',whisk[i],whisk[i+1],.013,'wood',e);}
 for(const k of [14,28,43,57]){const a=k/72*Math.PI*4.3-.7,p=points[k],end=[x+(r+.35)*Math.cos(a+.45),p[1]+.13,z+(r+.35)*Math.sin(a+.45)];round('ceiling','dragon',p,end,.045,'wood',e);for(let f=0;f<3;f++)round('ceiling','dragon',end,[end[0]+.1*Math.cos(a+(f-1)*.6),end[1]-.10,end[2]+.1*Math.sin(a+(f-1)*.6)],.020,'wood',e);}
 }
 function hump(x,base,z,w=.46,h=.48,sign=1,e={}){return add('roofFrame','hump',sign===0?G('flat-hump',()=>prism([[-.5,0],[.5,0],[.5,.24],[.32,.48],[-.32,.48],[-.5,.24]],1)):humpGeo(sign),[x,base,z],[w,h,.65],new T.Quaternion(),'darkwood',{...e,contactCenter:base,top:base+h*.48,undersideSlope:sign===0?0:-sign*.2*h/w,status:'图像判读',source:'2018图5及斜底正文；尺寸推定'});}
 if(detailOnly){
 if(node==='lower'||node==='upper'){col({x:0,z:0,i:0,j:0},-1.8,0);const top=bracket(0,0,0,0,node,'local/'+node);round('purlins','purlin',[-1.2,top+.14,node==='upper'?1.44:.96],[1.2,top+.14,node==='upper'?1.44:.96],.14,'wood',{tier:5});}
 if(node==='seat'){const lower=sloped('roofFrame','frame',0,0,-2,2,.8,.9,1,{key:'seat/lower',tier:0});const hp=hump(0,lower.topAtCenter,0,.8,.9,1,{key:'seat/hump',tier:1});dou([0,hp.top+.13,0],.64,.26,new T.Quaternion(),{tier:2});box('roofFrame','frame',[0,hp.top+.26+.25,0],[.65,.50,2.5],'wood',{tier:3,key:'seat/upper',support:'seat/hump'});}
 if(node==='dragon'){col({x:0,z:0,i:0,j:0},-.8,4.2);dragon(0,0,-.8,5,.34,'local/dragon');}
 }else{
 const grid=getColumnGrid(),{xs,zs,outer,inner,short}=grid;
 box('foundation','foundation',[0,.32,0],[29,.64,23],'stone',{key:'platform'});for(let k=0;k<3;k++)box('foundation','foundation',[0,.09+k*.19,11.6+(2-k)*.42],[6,.18,.6],'lightstone',{key:'stairs'});
 for(const p of [...outer,...inner]){round('foundation','base',[p.x,.64,p.z],[p.x,.8,p.z],.60,'lightstone',{key:`base/${p.i}-${p.j}`});col(p,.8,outer.includes(p)?5.6:9.5,'column',{ring:outer.includes(p)?'outer':'inner'});}
 for(const p of short)col(p,7.88,9.5,'short',{ring:'front-upper'});
 // Ties follow actual model rings; the missing lower front row never gets a continuous low tie.
 for(const [points,y,key] of [[outer,5.6,'outer'],[[...inner.filter(p=>!p.slot),...short],9.5,'inner']])for(const a of points)for(const step of [[1,0],[0,1]]){const b=points.find(p=>p.i===a.i+step[0]&&p.j===a.j+step[1]);if(b){beam('ties','tie',[a.x,y-.20,a.z],[b.x,y-.20,b.z],.24,.4,'wood',{key:`${key}/tie/${a.i}-${a.j}/${b.i}-${b.j}`});beam('ties','tie',[a.x,y+.06,a.z],[b.x,y+.06,b.z],.5,.12,'darkwood',{key:`${key}/plate/${a.i}-${a.j}/${b.i}-${b.j}`});}}
 for(const [points,y,kind] of [[outer,5.6,'lower'],[[...inner.filter(p=>!p.slot),...short],9.5,'upper']])for(const p of points){const i0=kind==='lower'?0:1,i1=kind==='lower'?7:6,j0=kind==='lower'?0:1,j1=kind==='lower'?6:5,corner=(p.i===i0||p.i===i1)&&(p.j===j0||p.j===j1),a=p.j===j1?0:p.j===j0?Math.PI:p.i===i1?Math.PI/2:-Math.PI/2;
 if(!corner)bracket(p.x,y,p.z,a,kind,`${kind}/head/${p.i}-${p.j}`);else{dou([p.x,y+.13,p.z],.64,.26);for(let k=1;k<=(kind==='lower'?2:3);k++){const sx=p.x>0?1:-1,sz=p.z>0?1:-1,hy=y+.3+(k-1)*.4,e={key:`${kind}/corner/${p.i}-${p.j}`,kind:'corner',status:'待核定',source:'转角方向教学骨架',note:'未复原真实互锁'};beam('brackets','corner',[p.x-.6*sx,hy,p.z],[p.x+sx*k*.48,hy,p.z],.22,.25,'wood',e);beam('brackets','corner',[p.x,hy+.13,p.z-.6*sz],[p.x,hy+.13,p.z+sz*k*.48],.22,.25,'wood',e);beam('brackets','corner',[p.x,hy+.26,p.z],[p.x+sx*k*.35,hy+.26,p.z+sz*k*.35],.22,.25,'darkwood',e);}}
 }
 // Intermediate assemblies intentionally separate; one per inferred bay, not an asserted census.
 for(const [j,y,kind,a,b] of [[6,5.6,'lower',0,7],[0,5.6,'lower',0,7],[5,9.5,'upper',1,6],[1,9.5,'upper',1,6]])for(let i=a;i<b;i++)bracket((xs[i]+xs[i+1])/2,y,zs[j],j>3?0:Math.PI,kind+'-flat',`${kind}/intermediate-inferred/${i}-${j}`);
 for(const p of inner.filter(p=>p.slot)){for(let k=0;k<3;k++){const y=9.63+k*.48;dou([p.x,y,p.z],.48,.26,new T.Quaternion(),{key:`slot/inner-dou/${p.i}/${k}`,status:'比例推定',source:'内部承托教学补足'});box('brackets','gong',[p.x,y+.31,p.z],[1.10,.36,.45],'wood',{key:`slot/inner-gong/${p.i}/${k}`,status:'比例推定',source:'内部承托教学补足'});}box('brackets','gong',[p.x,11.05,p.z],[1.10,.20,.50],'wood',{key:`slot/inner-bearing/${p.i}`,status:'比例推定',source:'内部承托教学补足'});}
 beam('roofFrame','beam',[xs[2],11.35,SPEC.slot],[xs[5],11.35,SPEC.slot],.48,.40,'wood',{key:'slot/upper-receiving',support:'两处内柱教学承托',status:'比例推定',source:'前槽跨接教学补足；真实交接待核'});
 const front=zs[6],rear=SPEC.slot;
 for(const p of short){sloped('ming','beam',p.x,7.60,rear,front,.60,.7,p.x<0?-1:1,{key:`porch/${p.i}`,bearingY:7.88,support:'副阶柱铺作与内侧水平承托',note:'柱脚7.88落在梁背中心；真实大小头未复原'});}
 // Crosswise receiving beam at the front slot, supported on the two real schematic inner points.
 beam('ming','beam',[xs[2],7.02,rear],[xs[5],7.02,rear],.48,.46,'wood',{key:'slot/receiving',endSupport:'殿内两柱；为教学连续承托'});
 // Interior columns extend above this level; beam/post joint is unresolved, not a fake open mortise.
 for(const x of [xs[1],xs[6]])for(const s of [-1,1])sloped('ming','beam',x,7.15,s>0?zs[4]:zs[0],s>0?front:zs[2],.5,.6,x<0?-1:1,{key:`side/${x}/${s}`});
 for(const x of [xs[2],xs[3],xs[4],xs[5]]){
 const sign=x<0?-1:1,baseY=11.87,back=zs[1],joint=SPEC.slot,frontHigh=zs[5];
 sloped('roofFrame','frame',x,baseY,back,joint,.56,.64,sign,{key:`frame/${x}/six`,role:'six',support:'殿身后柱铺作与前槽承托'});
 sloped('roofFrame','frame',x,baseY,joint,frontHigh,.52,.64,sign,{key:`frame/${x}/milk`,role:'milk',support:'前槽及梁上柱铺作'});
 // Four frame levels, positions constrained below the teaching roof profile.
 for(const [k,d,y,w,h] of [[0,4.8,12.90,.50,.56],[1,3.1,13.95,.46,.50],[2,1.5,15.30,.42,.44]]){
 const previousFlat=(k===1&&x===xs[5])||(k===2&&x===xs[3]);
 const previousY=k===0?baseY:[12.90,13.95][k-1],prevH=k===0?.64:[.56,.50][k-1],foot=previousY+prevH*.4;
 for(const z of [-d,d]){const hp=hump(x,foot,z,.50,prevH/(k===0?(z>joint?.52:.56):[.50,.46][k-1])*.50,previousFlat?0:sign,{key:`frame/${x}/hump/${k}/${z}`});const top=y-h*.5;box('roofFrame','hump',[x,(hp.top+top)/2,z],[.28,top-hp.top,.34],'wood',{key:`frame/${x}/seat/${k}/${z}`,foot:hp.top,head:top,support:'驼峰顶',role:'seat'});}
 const variant=k===0&&x===xs[2],flat=(k===0&&x===xs[5])||(k===1&&x===xs[3]);sloped('roofFrame','frame',x,y-(flat?h*.05:0),-d,k===0&&!variant?3.1:d,w,h,sign,{key:`frame/${x}/upper/${k}`,role:variant?'six-through':['five','four','flat'][k],section:flat?'rectangular':'sloped',status:'图像判读',source:flat?'2018正文：明间南缝四椽栿、北次间北缝五椽栿为矩形断面；尺寸推定':'2018图5、25；一缝通栿变体；尺寸推定'});
 if(k===0&&!variant)sloped('roofFrame','frame',x,y,3.1,d,w,h,sign,{key:`frame/${x}/zha`,role:'zha',status:'图像判读',source:'2018图5：前劄牵与后五椽栿分件；接合细节待核'});
 }
 // Ridge support uses the flat beam top and two diagonal fork arms, no full end-frame copying.
 for(const s of [-1,1])beam('roofFrame','frame',[x,15.52,s*.85],[x,16.86,0],.16,.19,'darkwood',{key:`frame/${x}/ridgefork`});
 }
 // End transverse frames and lateral Ding beams stay below the local mountain roof.
 for(const sx of [-1,1]){const x=sx*ROOF.ridgeHalf;beam('roofFrame','beam',[x,11.13,-5.5],[x,11.13,5.5],.50,.58,'wood',{key:`end/${sx}/cross`,status:'比例推定',note:'端架简化，非中间四层复制'});for(const z of [-3.3,0,3.3])beam('roofFrame','beam',[sx*Math.abs(xs[5]),11.13,z],[x,11.13,z],.46,.58,'wood',{key:`end/${sx}/ding`,role:'ding'});}
 // Purlins at transverse beam ends, with increasing roof distance at the mountain skirt.
 for(const d of [0,1.5,3.1,4.8,6.6,8.8])for(const s of d===0?[1]:[-1,1]){const hx=d<3.5?ROOF.ridgeHalf:ROOF.ridgeHalf+(d-3.5)/(9.1-3.5)*(ROOF.halfX-ROOF.ridgeHalf);const yy=roofY(d)-.257;round('purlins','purlin',[-hx,yy,s*d],[hx,yy,s*d],.17,'wood',{key:`purlin/${d}/${s}`});}
 for(const sx of [-1,1])for(let k=1;k<=5;k++){const t=k/5,x=sx*(8.65+6.25*t),d=3.5+5.6*t;round('purlins','purlin',[x,roofY(d)-.257,-d],[x,roofY(d)-.257,d],.15,'wood',{key:`end/purlin/${sx}/${k}`});}
 function surface(points,key){add('roof','roof',patch(points),[0,0,0],[1,1,1],new T.Quaternion(),'roofBoard',{key,roofKind:key.includes('lower')?'lower':'upper'});}
 for(const s of [-1,1]){const pts=[];for(let k=0;k<=30;k++){const d=9.1*k/30,hx=d<3.5?8.65:8.65+(d-3.5)/5.6*6.25;pts.push([-hx,roofY(d)+.16,s*d],[hx,roofY(d)+.16,s*d]);}surface(pts,'upper/long/'+s);const end=[];for(let k=0;k<=20;k++){const t=k/20,x=s*(8.65+6.25*t),d=3.5+5.6*t;end.push([x,roofY(d)+.16,-d],[x,roofY(d)+.16,d]);}surface(end,'upper/end/'+s);
 const tri=[[s*8.65,roofY(3.5),-3.5],[s*8.65,roofY(3.5),3.5],[s*8.65,17.2,0]];const g=new T.BufferGeometry().setFromPoints(tri.map(V));g.setIndex(s>0?[0,2,1]:[0,1,2]);g.computeVertexNormals();add('enclosure','enclosure',g,[0,0,0],[1,1,1],new T.Quaternion(),'plaster',{key:'gable/'+s});
 for(const zsign of [-1,1])for(let k=0;k<12;k++){const a=3.5*k/12,b=3.5*(k+1)/12;beam('rafters','hip',[s*8.65,roofY(a)+.2,zsign*a],[s*8.65,roofY(b)+.2,zsign*b],.12,.20,'darkwood',{key:'barge/'+s});}
 }
 // Continuous teaching rafter paths split at this roof's profile / purlin stations.
 // The end slope has its own height function: sampling surfaceY exactly on the gable
 // previously picked the high long slope and sent a rafter through the mountain cover.
 const stations=[0,1.5,3.1,3.5,4.8,6.6,8.8,9.1];
 for(let lane=0;lane<=82;lane++){const x=-14.7+lane*.36,start=Math.max(0,Math.abs(x)>8.65?3.5+(Math.abs(x)-8.65)/6.25*5.6:0),ds=[start,...stations.filter(d=>d>start)];
  for(const sign of [-1,1])for(let k=0;k<ds.length-1;k++)round('rafters','rafter',[x,roofY(ds[k])-.035,sign*ds[k]],[x,roofY(ds[k+1])-.035,sign*ds[k+1]],.052,'rafter',{key:`rafter/upper/long/${lane}/${sign}/${k}`,roofRegion:'upper-long',path:`long/${lane}/${sign}`,span:k,note:'槫位与曲线折点处分段示意；不表示实物短椽拼接',support:ds[k]>0&&!stations.includes(ds[k])?'角梁方向骨架，实际搭接待核':'教学槫位，末端为檐出'});
 }
 for(const sx of [-1,1])for(let lane=0;lane<=49;lane++){const z=-8.82+lane*.36,start=Math.max(3.5,Math.abs(z)),ds=[start,...new Set([...stations.filter(d=>d>start),...Array.from({length:5},(_,k)=>3.5+5.6*(k+1)/5).filter(d=>d>start)])].sort((a,b)=>a-b);
  for(let k=0;k<ds.length-1;k++){const x=d=>sx*(8.65+(d-3.5)/5.6*6.25);round('rafters','rafter',[x(ds[k]),roofY(ds[k])-.035,z],[x(ds[k+1]),roofY(ds[k+1])-.035,z],.052,'rafter',{key:`rafter/upper/end/${sx}/${lane}/${k}`,roofRegion:'upper-end',path:`end/${sx}/${lane}`,span:k,note:'独立山坡函数；折点分段为教学连续线，非已核短椽接法',support:'山坡短槫与角梁方向骨架；隐蔽承托待核'});}
 }
 for(const sx of [-1,1])for(const sz of [-1,1])for(let k=0;k<16;k++){const a=k/16,b=(k+1)/16;beam('rafters','hip',[sx*(8.65+6.25*a),roofY(3.5+5.6*a)-.11,sz*(3.5+5.6*a)],[sx*(8.65+6.25*b),roofY(3.5+5.6*b)-.11,sz*(3.5+5.6*b)],.23,.28);round('roof','roof',[sx*(8.65+6.25*a),roofY(3.5+5.6*a)+.26,sz*(3.5+5.6*a)],[sx*(8.65+6.25*b),roofY(3.5+5.6*b)+.26,sz*(3.5+5.6*b)],.13,'ridge');}
 round('roof','roof',[-8.65,17.47,0],[8.65,17.47,0],.17,'ridge');
 // Lower annular roof around the actual inner ring; an opening never closes the hall.
 const ix=Math.abs(xs[6]),iz=zs[5],hx=16,hz=11.9,lowY=t=>9.7-(9.7-7.3)*t**.8;
 for(const s of [-1,1]){const long=[],end=[];for(let k=0;k<=18;k++){const t=k/18,x=ix+(hx-ix)*t,z=iz+(hz-iz)*t,y=lowY(t);long.push([-x,y,s*z],[x,y,s*z]);end.push([s*x,y,-z],[s*x,y,z]);}surface(long,'lower/long/'+s);surface(end,'lower/end/'+s);
 for(let x=-15.8;x<16;x+=.38)for(let k=0;k<12;k++){const a=k/12,b=(k+1)/12;if(Math.abs(x)>ix+(hx-ix)*a)continue;round('rafters','rafter',[x,lowY(a)-.13,s*(iz+(hz-iz)*a)],[x,lowY(b)-.13,s*(iz+(hz-iz)*b)],.05,'rafter');}
 for(let z=-11.7;z<11.8;z+=.38)for(let k=0;k<12;k++){const a=k/12,b=(k+1)/12;if(Math.abs(z)>iz+(hz-iz)*a)continue;round('rafters','rafter',[s*(ix+(hx-ix)*a),lowY(a)-.13,z],[s*(ix+(hx-ix)*b),lowY(b)-.13,z],.05,'rafter');}
 for(const [x,z,y] of [[ix,iz,9.35],[hx,hz,6.95]]){round('purlins','purlin',[-x,y,s*z],[x,y,s*z],.17);round('purlins','purlin',[s*x,y,-z],[s*x,y,z],.17);}}
 for(const sx of [-1,1])for(const sz of [-1,1])beam('rafters','hip',[sx*ix,9.35,sz*iz],[sx*hx,6.95,sz*hz],.23,.28);
 // Eight independent ceramic fields; grey centre and glazed eave border are visible in the licensed site photos.
 for(const sign of [-1,1])for(const axis of ['z','x'])for(const level of ['upper','lower']){
  const upper=level==='upper',long=axis==='z',start=upper?(long?0:8.65):(long?iz:ix),end=upper?(long?9.1:14.9):(long?hz:hx);
  const fields=ceramicField({start,end,axis,sign,lift:upper?.18:.02,pitch:upper?.36:.38,
   halfWidth:r=>upper?(long?(r<3.5?8.65:8.65+(r-3.5)/5.6*6.25):3.5+(r-8.65)/6.25*5.6):(long?ix+(hx-ix)*(r-iz)/(hz-iz):iz+(hz-iz)*(r-ix)/(hx-ix)),
   height:r=>upper?roofY(long?r:3.5+(r-8.65)/6.25*5.6):lowY((r-start)/(end-start))});
  for(const [kind,g] of Object.entries(fields))add('roof','roof',g,[0,0,0],[1,1,1],new T.Quaternion(),kind==='border'?'glazedTile':'tile',{key:`ceramic/${level}/${axis}/${sign}/${kind}`,surfaceRole:'ceramic',status:'图像判读',source:'2024授权实景；灰瓦与绿色琉璃剪边；瓦距、瓦弧、排数比例推定'});
 }
 for(const x of xs)dragon(x,zs[6],.8,4.8,.34,`front/dragon/${xs.indexOf(x)}`);
 for(let i=1;i<6;i++)for(const j of [1,4]){const x=(xs[i]+xs[i+1])/2,w=xs[i+1]-xs[i]-.68,z=zs[j];if(j===4&&i===3)continue;box('enclosure','enclosure',[x,4.55,z],[w,7.5,.16],'plaster');if(j===4&&i>=2&&i<=4)for(let xx=x-w/2;xx<=x+w/2;xx+=.23)box('enclosure','enclosure',[xx,4.35,z+.13],[.045,5.8,.06],'door');}
 for(const x of [xs[1],xs[6]])box('enclosure','enclosure',[x,4.55,(zs[1]+zs[4])/2],[.16,7.5,zs[4]-zs[1]],'plaster');
 }
 const meshes=[];for(const b of buckets.values()){const m=new T.InstancedMesh(b.g,materials[b.mat]||materials.wood,b.items.length);m.userData={records:b.items.map(v=>v.r),materialKey:b.mat,layer:b.l,tier:b.tier};b.items.forEach((v,i)=>m.setMatrixAt(i,v.m));m.castShadow=true;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.l).add(m);meshes.push(m);}root.updateMatrixWorld(true);return {root,layers,records,meshes,detailOnly,node};
}
