import * as THREE from './vendor/three.module.js';
import { LAYERS } from './data.js';

// Metres. X = hall width (south to north), Z = depth (east to west), Y = up.
export const SPEC = Object.freeze({
  width:34, depth:17.66, bays:[4.4,5.04,5.04,5.04,5.04,5.04,4.4],
  outerColumns:22, innerColumns:14, columnFoot:.63, columnTop:5.58,
  roofHalfDepth:11.90, roofHalfWidth:20.80, ridgeHalf:8.90,
  bracketJumps:[.5434,.4490,.4902,.4902], angDegrees:24.08,
  // These vertical coordinates are interpretation, not measured elevations.
  roofProfile:[[0,12.15],[2.2075,11.00],[4.415,9.95],[6.6225,8.90],[8.83,8.37],[10.8028,8.07],[11.90,8.20]]
});
export function getColumnGrid(){
  const xs=[-17]; SPEC.bays.forEach(w=>xs.push(Number((xs.at(-1)+w).toFixed(5))));
  const zs=[-8.83,-4.415,0,4.415,8.83]; const outer=[],inner=[];
  for(let ix=0;ix<xs.length;ix++) for(let iz=0;iz<zs.length;iz++) {
    if(ix===0||ix===xs.length-1||iz===0||iz===zs.length-1) outer.push({x:xs[ix],z:zs[iz],ix,iz});
    else if(iz===1||iz===3||ix===1||ix===6) inner.push({x:xs[ix],z:zs[iz],ix,iz});
  }
  return {xs,zs,outer,inner};
}
export function roofY(d){d=Math.max(0,Math.min(SPEC.roofHalfDepth,d));const a=SPEC.roofProfile;for(let i=1;i<a.length;i++)if(d<=a[i][0]){const t=(d-a[i-1][0])/(a[i][0]-a[i-1][0]);return THREE.MathUtils.lerp(a[i-1][1],a[i][1],t);}return a.at(-1)[1];}
export function surfaceY(x,z){return roofY(Math.max(Math.abs(z),Math.abs(x)-SPEC.ridgeHalf))+.25+.18*Math.pow(Math.abs(x)/20.8,8)*Math.pow(Math.abs(z)/11.9,8);}

const geomCache=new Map();
function geometry(key,create){if(!geomCache.has(key))geomCache.set(key,create());return geomCache.get(key);}
function armGeometry(){return geometry('arm',()=>{const s=new THREE.Shape();s.moveTo(-.5,.5);s.lineTo(.5,.5);s.lineTo(.5,.12);s.bezierCurveTo(.40,-.36,.22,-.50,0,-.50);s.bezierCurveTo(-.22,-.50,-.4,-.36,-.5,.12);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:1,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012,curveSegments:8});g.translate(0,0,-.5);return g;});}
function moonGeometry(){return geometry('moon',()=>{const s=new THREE.Shape();s.moveTo(-.5,.32);s.bezierCurveTo(-.35,.48,.3,.48,.5,.32);s.lineTo(.5,-.1);s.bezierCurveTo(.25,-.55,-.25,-.55,-.5,-.1);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelSegments:1,bevelSize:.015,bevelThickness:.015,curveSegments:10});g.translate(0,0,-.5);return g;});}
function douBaseGeometry(){return geometry('doubase',()=>{const g=new THREE.CylinderGeometry(.707,.48,1,4,1,false);g.rotateY(Math.PI/4);return g;});}
function tileGeometry(){return geometry('tile',()=>{const vertices=[],indices=[];for(let row=0;row<2;row++)for(let i=0;i<=10;i++){const a=Math.PI*i/10;vertices.push(Math.cos(a)*.115,Math.sin(a)*.08,(row-.5));}for(let i=0;i<10;i++){indices.push(i,i+1,i+12,i,i+12,i+11);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;});}
function roofSurfaceGeometry(side){const vertices=[],indices=[],uvs=[];const rows=40,cols=64;for(let r=0;r<=rows;r++){const d=11.9*r/rows;for(let c=0;c<=cols;c++){let x,z;if(side<2){x=(c/cols*2-1)*(8.9+d);z=d*(side===0?1:-1);}else{x=(8.9+d)*(side===2?1:-1);z=(c/cols*2-1)*d;}vertices.push(x,surfaceY(x,z),z);uvs.push(c/cols,r/rows);}}for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;const triangles=[a,b,a+1,b,b+1,a+1];if(side===1||side===2)for(let i=0;i<triangles.length;i+=3)[triangles[i+1],triangles[i+2]]=[triangles[i+2],triangles[i+1]];indices.push(...triangles);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}
const v3=a=>new THREE.Vector3(...a);
const qY=a=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a);

export function buildModel(materials,{detailOnly=false}={}){
  const root=new THREE.Group();root.name=detailOnly?'外檐柱头铺作研究':'佛光寺东大殿';
  const layers=new Map(LAYERS.map(l=>{const group=new THREE.Group();group.name=l.label;group.userData.layer=l.id;root.add(group);return [l.id,group];}));
  const bucket=new Map(),records=[];let serial=0;
  function add(layer,type,g,position,scale=[1,1,1],rotation=null,material='wood',extra={}){
    const quaternion=rotation||new THREE.Quaternion();
    const matrix=new THREE.Matrix4().compose(v3(position),quaternion,v3(scale));
    const record={id:`${layer}-${String(++serial).padStart(5,'0')}`,layer,type,position:[...position],...extra};records.push(record);
    const tier=detailOnly?(extra.tier||0):0;
    const key=`${layer}|${material}|${g.uuid}|${tier}`;
    if(!bucket.has(key))bucket.set(key,{layer,material,geometry:g,items:[],tier});
    bucket.get(key).items.push({matrix,record});return record;
  }
  const boxG=geometry('box',()=>new THREE.BoxGeometry(1,1,1));
  const cylinderG=geometry('cylinder',()=>new THREE.CylinderGeometry(1,1,1,16));
  const columnG=geometry('column',()=>new THREE.LatheGeometry([new THREE.Vector2(.51,-.5),new THREE.Vector2(.52,-.45),new THREE.Vector2(.515,.15),new THREE.Vector2(.50,.4),new THREE.Vector2(.45,.48),new THREE.Vector2(.42,.5)],24));
  function box(layer,type,p,s,mat='wood',rotation=null,extra={}){return add(layer,type,boxG,p,s,rotation,mat,extra);}
  function beam(layer,type,a,b,width,height,mat='wood',extra={}){
    const va=v3(a),vb=v3(b),dir=vb.clone().sub(va),len=dir.length();
    return add(layer,type,boxG,va.add(vb).multiplyScalar(.5).toArray(),[width,len,height],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()),mat,extra);
  }
  function roundBeam(layer,type,a,b,r,mat='wood',extra={}){
    const va=v3(a),vb=v3(b),dir=vb.clone().sub(va),len=dir.length();
    return add(layer,type,cylinderG,va.add(vb).multiplyScalar(.5).toArray(),[r,len,r],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()),mat,extra);
  }
  function dou(layer,p,w=.42,h=.23,rotation=0,extra={}){
    const q=qY(rotation),world=local=>v3(local).applyQuaternion(q).add(v3(p)).toArray();
    add(layer,extra.type||'dou',douBaseGeometry(),world([0,-h*.22,0]),[w,h*.55,w],q,'endgrain',extra);
    box(layer,extra.type||'dou',world([0,h*.05,0]),[w,h*.2,w],'wood',q,extra);
    for(const a of [-1,1])for(const b of [-1,1])box(layer,extra.type||'dou',world([a*w*.34,h*.30,b*w*.34]),[w*.32,h*.35,w*.32],'wood',q,extra);
  }
  function makeBracket(x,y,z,angle,{kind='outer',skipRoot=false,tag=''}={}){
    const q=qY(angle),P=a=>v3(a).applyQuaternion(q).add(new THREE.Vector3(x,y,z)).toArray();
    const ext=(tier,type)=>({tier,type,assembly:tag||`${x},${z}`,approximation:kind==='outer'?'section-derived':'simplified'});
    const B=(type,p,s,tier=0,mat='wood')=>box('brackets',type,P(p),s,mat,q,ext(tier,type));
    const D=(p,w,h,tier=0,type='dou')=>dou('brackets',P(p),w,h,angle,ext(tier,type));
    const A=(type,p,len,h,w,tier=0,turn=false)=>add('brackets',type,armGeometry(),P(p),[len,h,w],q.clone().multiply(qY(turn?Math.PI/2:0)),'wood',ext(tier,type));
    if(!skipRoot)D([0,.15,0],.78,.34,0,'ludou');
    if(kind==='intermediate'){
      beam('brackets','intermediate',P([-.7,0,0]),P([0,.65,0]),.18,.22,'wood',ext(0,'intermediate'));
      beam('brackets','intermediate',P([.7,0,0]),P([0,.65,0]),.18,.22,'wood',ext(0,'intermediate'));
      D([0,.71,0],.38,.22,1,'intermediate');A('intermediate',[0,.9,0],1.7,.3,.21,1);D([-.62,1.15,0],.36,.2,2,'intermediate');D([.62,1.15,0],.36,.2,2,'intermediate');B('intermediate',[0,1.38,0],[1.8,.21,.30],2);return;
    }
    if(kind==='inner'){
      for(let t=0;t<4;t++){const d=[.5477,.9772,1.4265,1.8664][t],hy=.43+t*.44;
        A('innerBracket',[0,hy,(d-.54)/2],d+.54,.315,.21,t+1,true);D([0,hy+.22,d-.10],.37,.22,t+1,'innerBracket');
        if(t===1||t===3){A('innerBracket',[0,hy+.40,d-.10],1.45,.315,.21,t+1);for(const v of [-.55,.55])D([v,hy+.64,d-.10],.35,.2,t+1,'innerBracket');}
      }B('innerBracket',[0,2.47,1.76],[1.75,.18,.32],5);return;
    }
    A('mudao',[0,.40,0],1.40,.315,.21,1);
    A('huagong',[0,.40,0],1.0868,.315,.21,1,true);
    for(const d of [-.49,.49])D([0,.63,d],.37,.20,1);
    A('huagong',[0,.84,0],1.9848,.315,.21,2,true);
    for(const d of [-.93,.93]){D([0,1.06,d],.37,.20,2);A('linggong',[0,1.28,d],1.50,.315,.21,3);for(const v of [-.57,.57])D([v,1.48,d],.34,.20,3);}
    A('mudao',[0,.86,0],1.82,.315,.21,2);
    D([-.65,1.08,0],.34,.20,2);D([.65,1.08,0],.34,.20,2);
    const slope=Math.tan(SPEC.angDegrees*Math.PI/180);
    for(let t=0;t<2;t++){
      const out=t===0?1.4826:1.9728, tipY=1.18+t*.43,back=-1.48;
      beam('brackets','ang',P([0,tipY,out]),P([0,tipY+(out-back)*slope,back]),.21,.315,'darkwood',ext(3+t,'ang'));
      D([0,tipY+.19,out-.08],.35,.20,3+t);
    }
    A('linggong',[0,2.13,1.9728],1.7,.315,.21,5);
    for(const v of [-.65,.65])D([v,2.34,1.9728],.34,.20,5);
    B('timu',[0,2.46,1.9728],[1.96,.18,.32],6);
    B('timu',[0,2.02,0],[1.82,.21,.3],5);
    if(detailOnly){roundBeam('brackets','purlin',P([-1.30,2.68,1.9728]),P([1.30,2.68,1.9728]),.20,'wood',ext(7,'purlin'));}
  }
  if(detailOnly){
    add('columns','outerColumn',columnG,[0,-1.04,0],[.8,2.08,.8],null,'column');
    box('ties','tie',[0,-.20,0],[3.2,.42,.22],'darkwood');
    makeBracket(0,0,0,0,{tag:'前檐柱头铺作'});
  }else{
    const {xs,zs,outer,inner}=getColumnGrid();
    box('foundation','foundation',[0,.05,0],[39,.5,22],'stone');
    box('foundation','foundation',[0,.35,0],[38,.15,21],'lightstone');
    for(let i=0;i<4;i++)box('foundation','foundation',[0,-.15+i*.115,11.9-i*.55],[7.8,.115,3.1-i*.55],'stone');
    // Visible stone joints are inlaid seams, not structural blocks.
    for(let x=-18;x<=18;x+=2)box('foundation','foundation',[x,.432,0],[.016,.008,20.7],'seam');
    for(let z=-10;z<=10;z+=2)box('foundation','foundation',[0,.433,z],[37.8,.008,.016],'seam');
    for(const [kind,points] of [['outerColumn',outer],['innerColumn',inner]])for(const p of points){
      const tag=`${kind==='outerColumn'?'外':'内'}柱 ${p.ix+1}-${p.iz+1}`;
      box('foundation','base',[p.x,.50,p.z],[1.10,.13,1.1],'stone',null,{tag});
      add('foundation','base',cylinderG,[p.x,.60,p.z],[.52,.14,.52],null,'lightstone',{tag});
      add('columns',kind,columnG,[p.x,(SPEC.columnFoot+SPEC.columnTop)/2,p.z],[.82,SPEC.columnTop-SPEC.columnFoot,.82],null,'column',{tag});
    }
    function ringTies(ring){for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];beam('ties','tie',[a.x,5.36,a.z],[b.x,5.36,b.z],.27,.42,'darkwood');}}
    const outerRing=orderedRing(outer),innerRing=orderedRing(inner);ringTies(outerRing);ringTies(innerRing);
    for(const p of outer){
      const corner=Math.abs(p.x)===17&&Math.abs(p.z)===8.83;
      let angle=Math.abs(p.z)===8.83?(p.z>0?0:Math.PI):(p.x>0?Math.PI/2:-Math.PI/2);
      makeBracket(p.x,5.58,p.z,angle,{tag:`外檐 ${p.ix+1}-${p.iz+1}`});
      if(corner){
        const side=p.x>0?Math.PI/2:-Math.PI/2;makeBracket(p.x,5.58,p.z,side,{skipRoot:true,tag:'转角正交分支（简化）'});
        const diagonal=Math.atan2(Math.sign(p.x),Math.sign(p.z));
        makeBracket(p.x,5.58,p.z,diagonal,{skipRoot:true,tag:'角向铺作（简化）'});
      }
    }
    for(const p of inner){const angle=Math.abs(p.z)===4.415?(p.z>0?Math.PI:0):(p.x>0?-Math.PI/2:Math.PI/2);makeBracket(p.x,5.58,p.z,angle,{kind:'inner',tag:`内槽 ${p.ix+1}-${p.iz+1}`});}
    for(const [ring,kind] of [[outerRing,'outer'],[innerRing,'inner']])for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],x=(a.x+b.x)/2,z=(a.z+b.z)/2;
      const angle=Math.abs(a.z-b.z)<.001?(z>0?0:Math.PI):(x>0?Math.PI/2:-Math.PI/2);
      makeBracket(x,5.58,z,angle,{kind:'intermediate',tag:`${kind==='outer'?'外檐':'内槽'}补间（简化）`});
    }
    // Connect bracket tops along each ring.
    for(const ring of [outerRing,innerRing])for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];beam('ming','dingfu',[a.x,7.80,a.z],[b.x,7.80,b.z],.36,.35);
    }
    function moon(type,a,b,h=.68,w=.45){const va=v3(a),vb=v3(b),d=vb.clone().sub(va);return add('ming',type,moonGeometry(),va.add(vb).multiplyScalar(.5).toArray(),[d.length(),h,w],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),d.normalize()),'wood');}
    for(const x of xs.slice(1,-1)){
      moon('ming',[x,7.62,-4.415],[x,7.62,4.415],.77,.50);
      moon('rufu',[x,7.34,4.415],[x,7.34,8.83],.60,.44);
      moon('rufu',[x,7.34,-8.83],[x,7.34,-4.415],.60,.44);
      // Four-rafter and two-rafter grass beams with independent short posts.
      box('roofFrame','caofu',[x,9.52,0],[.60,.68,9.60],'darkwood');
      for(const z of [-4.415,4.415]){
        box('roofFrame','shuzhu',[x,8.73,z],[.48,.94,.48]);
        box('roofFrame','shuzhu',[x,8.20,z],[.70,.16,.82]);
      }
      if(Math.abs(x)<SPEC.ridgeHalf){
      box('roofFrame','caofu',[x,10.60,0],[.52,.57,5.10],'darkwood');
      for(const z of [-2.2075,2.2075]){box('roofFrame','shuzhu',[x,10.08,z],[.39,.60,.39]);box('roofFrame','shuzhu',[x,9.87,z],[.58,.14,.65]);}
      for(const sign of [-1,1])beam('roofFrame','chashou',[x,10.89,sign*1.45],[x,12.16,0],.24,.28,'wood');
      }else{box('roofFrame','shuzhu',[x,10.02,0],[.40,.28,.40]);}
      for(const sign of [-1,1]){
        beam('roofFrame','caofu',[x,8.15,sign*8.83],[x,9.52,sign*4.415],.38,.40,'darkwood');
        box('roofFrame','shuzhu',[x,8.74,sign*6.6225],[.32,.28,.32]);
      }
    }
    for(const z of [-4.415,0,4.415])for(const sign of [-1,1])moon('dingfu',[sign*12.6,7.45,z],[sign*17,7.45,z],.63,.46);
    for(let x=-12.6;x<=12.601;x+=.84)box('ceiling','ceiling',[x,8.17,0],[.065,.10,8.83],'ceiling');
    for(let z=-4.415;z<=4.416;z+=.80)box('ceiling','ceiling',[0,8.17,z],[25.2,.10,.065],'ceiling');
    box('ceiling','ceiling',[0,8.235,0],[25.2,.035,8.83],'ceilingPanel');
    // Purlins along the long axis. The hip shortens the upper courses.
    for(const [d,hy] of SPEC.roofProfile.slice(0,-1)){
      const ends=d===0?[0]:[-d,d]; const half=Math.min(17.8,8.9+d);
      for(const z of ends)roundBeam('purlins','purlin',[-half,hy,z],[half,hy,z],d===0?.23:.19,'darkwood',{tag:d===0?'脊槫':Math.abs(d-10.8028)<.01?'撩檐槫':`坡道槫 ${d.toFixed(2)}m`});
      if(d>0)for(const s of [-1,1])roundBeam('purlins','purlin',[s*(8.9+d),hy,-d],[s*(8.9+d),hy,d],.17,'darkwood',{tag:'山面承椽横木（重建）'});
    }
    // Curve-segment rafters: actual counts are schematic, not an inventory.
    const bands=SPEC.roofProfile.map(p=>p[0]);
    for(let x=-20.5;x<=20.501;x+=.40)for(const sign of [-1,1]){
      const start=Math.max(0,Math.abs(x)-8.9);const ds=[start,...bands.filter(d=>d>start+.01)];
      for(let j=0;j<ds.length-1;j++){const a=ds[j],b=ds[j+1];roundBeam('rafters','rafter',[x,surfaceY(x,a*sign)-.13,a*sign],[x,surfaceY(x,b*sign)-.13,b*sign],.068,'rafter');}
    }
    for(let z=-11.65;z<=11.651;z+=.40)for(const sign of [-1,1]){
      const start=Math.abs(z);const ds=[start,...bands.filter(d=>d>start+.01)];
      for(let j=0;j<ds.length-1;j++){const a=ds[j],b=ds[j+1];roundBeam('rafters','rafter',[sign*(8.9+a),surfaceY(sign*(8.9+a),z)-.13,z],[sign*(8.9+b),surfaceY(sign*(8.9+b),z)-.13,z],.065,'rafter');}
    }
    for(const sx of [-1,1])for(const sz of [-1,1])for(let i=0;i<bands.length-1;i++){
      const a=bands[i],b=bands[i+1];beam('rafters','hip',[sx*(8.9+a),roofY(a),sz*a],[sx*(8.9+b),roofY(b),sz*b],.30,.34,'darkwood');
      roundBeam('roof','roof',[sx*(8.9+a),surfaceY(sx*(8.9+a),sz*a)+.14,sz*a],[sx*(8.9+b),surfaceY(sx*(8.9+b),sz*b)+.14,sz*b],.16,'ridge');
    }
    // Eave boards, including end grain under exposed tile ends.
    for(const sz of [-1,1])box('rafters','rafter',[0,8.18,sz*11.9],[41.6,.25,.14],'darkwood');
    for(const sx of [-1,1])box('rafters','rafter',[sx*20.8,8.18,0],[.14,.25,23.8],'darkwood');
    for(let side=0;side<4;side++)add('roof','roof',roofSurfaceGeometry(side),[0,0,0],[1,1,1],null,'roofBoard');
    function tile(a,b){const va=v3(a),vb=v3(b),tangent=vb.clone().sub(va),len=tangent.length();tangent.normalize();const side=new THREE.Vector3(0,1,0).cross(tangent).normalize(),normal=tangent.clone().cross(side).normalize();const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,normal,tangent));add('roof','roof',tileGeometry(),va.add(vb).multiplyScalar(.5).toArray(),[1,1,len+.035],q,'tile');}
    for(let x=-20.65;x<=20.651;x+=.32)for(const s of [-1,1]){
      const start=Math.max(.03,Math.abs(x)-8.9);for(let d=start;d<11.88;d+=.48){const e=Math.min(11.9,d+.48);tile([x,surfaceY(x,d*s)+.02,d*s],[x,surfaceY(x,e*s)+.02,e*s]);}
      roundBeam('roof','roof',[x,8.48,s*11.91],[x,8.48,s*12.01],.12,'ridge');
    }
    for(let z=-11.65;z<=11.651;z+=.32)for(const s of [-1,1])for(let d=Math.max(.03,Math.abs(z));d<11.88;d+=.48){const e=Math.min(11.9,d+.48);tile([s*(8.9+d),surfaceY(s*(8.9+d),z)+.02,z],[s*(8.9+e),surfaceY(s*(8.9+e),z)+.02,z]);}
    box('roof','roof',[0,12.49,0],[18.25,.28,.44],'ridge');
    roundBeam('roof','roof',[-9.08,12.65,0],[9.08,12.65,0],.15,'ridge');
    // Simple ridge end silhouettes, explicitly not reconstructed ceramic ornaments.
    for(const s of [-1,1]){
      const path=[[s*8.75,12.5,0],[s*9.15,12.85,0],[s*9.30,13.35,0],[s*9.05,13.80,0]];
      for(let i=0;i<path.length-1;i++)beam('roof','roof',path[i],path[i+1],.30,.38,'ridge');
    }
    // Enclosure is independently removable so it never conceals the column topology.
    box('enclosure','enclosure',[0,2.88,-8.9],[33.7,4.8,.24],'plaster');
    for(const s of [-1,1])box('enclosure','enclosure',[s*17.05,2.88,0],[.24,4.8,17.4],'plaster');
    for(let i=0;i<7;i++){
      const mid=(xs[i]+xs[i+1])/2,w=xs[i+1]-xs[i]-.65;
      box('enclosure','enclosure',[mid,.83,8.80],[w,.45,.16],'darkwood');
      if(i>=2&&i<=4){
        for(let k=0;k<8;k++)box('enclosure','enclosure',[mid-w/2+(k+.5)*w/8,2.77,8.82],[w/8-.025,3.65,.10],'door');
        for(const y of [1.35,2.7,4.12])box('enclosure','enclosure',[mid,y,8.91],[w,.12,.08],'darkwood');
        for(const xx of [mid-.18,mid+.18])add('enclosure','enclosure',geometry('doorRing',()=>new THREE.TorusGeometry(.08,.018,6,16)),[xx,2.65,8.98],[1,1,1],null,'metal');
      }else{
        box('enclosure','enclosure',[mid,1.28,8.82],[w,.55,.13],'door');
        for(let xx=mid-w/2+.12;xx<mid+w/2;xx+=.19)box('enclosure','enclosure',[xx,3.03,8.82],[.055,2.8,.075],'darkwood');
        for(const y of [1.62,4.44])box('enclosure','enclosure',[mid,y,8.82],[w,.12,.14],'darkwood');
      }
    }
  }
  const meshes=[];
  for(const b of bucket.values()){
    const mesh=new THREE.InstancedMesh(b.geometry,materials[b.material]||materials.wood,b.items.length);
    mesh.name=`${b.layer}/${b.items[0].record.type}`;mesh.castShadow=!['tile','ceilingPanel'].includes(b.material);mesh.receiveShadow=true;
    b.items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);const variation=.92+((i*37+13)%17)/100;mesh.setColorAt(i,new THREE.Color(variation,variation,variation));});
    mesh.instanceMatrix.needsUpdate=true;mesh.userData.records=b.items.map(item=>item.record);mesh.userData.materialKey=b.material;mesh.userData.tier=b.tier;mesh.userData.layer=b.layer;
    mesh.computeBoundingBox();mesh.computeBoundingSphere();layers.get(b.layer).add(mesh);meshes.push(mesh);
  }
  return {root,layers,records,meshes,detailOnly};
}
function orderedRing(points){return [...points].sort((a,b)=>Math.atan2(a.z,a.x)-Math.atan2(b.z,b.x));}
