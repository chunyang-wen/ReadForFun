import * as T from '../../vendor/three.module.js';
import {upperHeight,lowerHeight,SPEC} from '../model.js';
// Taimiao-specific geometry hypothesis. No dimensions claimed as a tile survey.
export const ROOF_PARAMETERS={pitch:.32,step:.29,length:.42,radius:.11,thickness:.022,segments:8,panDepth:.045,bedOffset:.055,fasciaDepth:.24};
const UP=new T.Vector3(0,1,0);
export const upperSurface=(x,z)=>upperHeight(Math.max(Math.abs(z),Math.abs(x)-SPEC.ridgeHalf,0));
export const lowerSurface=(x,z)=>lowerHeight(Math.max((Math.abs(x)-28)/8.5,(Math.abs(z)-11)/7));
function stripGeometry(p,pan=false){
 const n=pan?6:p.segments,vertices=[],indices=[],w=pan?p.pitch/2:p.radius;
 // Closed top/bottom ribbon, open at ends; overlaid pieces have real thickness.
 for(const z of [-p.length/2,p.length/2])for(const bottom of [false,true])for(let i=0;i<=n;i++){
  const a=Math.PI*i/n,x=pan?-w+2*w*i/n:Math.cos(a)*w;
  const y=pan?p.panDepth*(x/w)**2:Math.sin(a)*p.radius*.875;
  const taper=pan?1:.88+.12*(z/p.length+.5);
  vertices.push(x*taper,y*taper-(bottom?p.thickness:0),z);
 }
 const stride=n+1;
 for(let i=0;i<n;i++)for(const off of [0,stride]){const a=off+i,b=a+1,c=a+2*stride,d=c+1;if((pan&&off===0)||(!pan&&off===stride))indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);}
 for(const i of [0,n]){indices.push(i,i+stride,i+2*stride,i+stride,i+3*stride,i+2*stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function facePoint(tier,face,sign,cross,run){
 if(tier==='upper')return face==='front'?[cross,upperHeight(run),sign*run]:[sign*(SPEC.ridgeHalf+run),upperHeight(run),cross];
 const t=(run-11)/7,h=lowerHeight(t),extent=28+8.5*t;
 return face==='front'?[cross,h,sign*run]:[sign*extent,h,cross];
}
export function eaveSupport(tier,face,sign,cross){
 const run=tier==='upper'?13.1:face==='front'?14:11+7*4/8.5;
 const core=face==='front'?(tier==='upper'?SPEC.ridgeHalf:28):(tier==='upper'?0:11);
 const outer=face==='front'?(tier==='upper'?33:36.5):(tier==='upper'?14.5:18);
 const inner=face==='front'?(tier==='upper'?SPEC.ridgeHalf+13.1:32):(tier==='upper'?13.1:14);
 const a=Math.abs(cross),tailCross=Math.sign(cross)*(a<=core?a:core+(a-core)*(inner-core)/(outer-core));
 return facePoint(tier,face,sign,tailCross,run);
}
export function buildRoofSystem(materials,{parameters:p=ROOF_PARAMETERS,withEaves=false}={}){
 for(const key of Object.keys(ROOF_PARAMETERS))if(!Number.isFinite(p[key])||p[key]<=0)throw Error('Invalid roof parameter '+key);
 if(!Number.isInteger(p.segments)||p.segments<4||p.segments>32)throw Error('Invalid shell resolution');
 if(p.pitch<=2*p.radius||p.step>=p.length||p.thickness<=0)throw Error('Invalid roof system parameters');
 const root=new T.Group(),timberRoot=new T.Group(),buckets=new Map(),records=[];root.name='taimiao-continuous-roof';
 const geos={cover:stripGeometry(p),pan:stripGeometry(p,true),disk:new T.CylinderGeometry(p.radius+.005,p.radius+.005,.035,16),rim:new T.TorusGeometry(p.radius-.014,.011,4,16),drip:null,fascia:new T.BoxGeometry(1,1,1),rafter:new T.CylinderGeometry(.065,.065,1,8),tip:new T.CylinderGeometry(.067,.067,.025,10)};
 geos.disk.rotateX(Math.PI/2);geos.tip.rotateX(Math.PI/2);
 const sh=new T.Shape();sh.moveTo(-p.pitch/2,.02);sh.lineTo(p.pitch/2,.02);sh.lineTo(p.pitch/2,-.055);sh.quadraticCurveTo(p.pitch*.20,-.075,0,-.145);sh.quadraticCurveTo(-p.pitch*.20,-.075,-p.pitch/2,-.055);sh.closePath();geos.drip=new T.ShapeGeometry(sh,4);
 const add=(kind,tier,face,sign,col,row,pos,q=new T.Quaternion(),scale=[1,1,1],key='tile')=>{
  const id=`taimiao-roof-v2/${tier}/${face}/${sign}/${kind}/${col}/${row}`;
  const r={id,kind,tier,face,sign,col,row,position:pos.toArray(),orientation:q.toArray(),scale,status:'比例推定',source:'vb-eaves / T-fig28: 可见瓦垄与檐下层次；尺寸和截面推定',layer:kind==='rafter'||kind==='tip'?'purlins':'roof',materialKey:key};
  records.push(r);const bucketKey=[kind,key,tier].join('/');if(!buckets.has(bucketKey))buckets.set(bucketKey,{geo:geos[kind],material:materials[key]||materials.tile,records:[]});buckets.get(bucketKey).records.push(r);
 };
 for(const tier of ['upper','lower'])for(const face of ['front','hip'])for(const sign of [-1,1]){
  const start=tier==='upper'?.16:11.1,end=tier==='upper'?14.5:18,steps=Math.ceil((end-start)/p.step),step=(end-start)/steps;
  for(let row=0;row<=steps;row++){
   const run=start+step*row,t=(run-11)/7,extent=tier==='upper'?(face==='front'?SPEC.ridgeHalf+run:run):(face==='front'?28+8.5*t:run);
   const cols=Math.floor((extent-p.radius-.04)/p.pitch);
   for(let col=-cols;col<=cols;col++){
    const cross=col*p.pitch,point=facePoint(tier,face,sign,cross,run),a=new T.Vector3(...facePoint(tier,face,sign,cross,run-.005)),b=new T.Vector3(...facePoint(tier,face,sign,cross,run+.005)),dir=b.sub(a).normalize();
    const xAxis=face==='front'?new T.Vector3(sign,0,0):new T.Vector3(0,0,-sign),yAxis=new T.Vector3().crossVectors(dir,xAxis).normalize();
    const basis=new T.Matrix4().makeBasis(xAxis,yAxis,dir),q=new T.Quaternion().setFromRotationMatrix(basis),pos=new T.Vector3(...point).addScaledVector(yAxis,p.bedOffset);
    add('cover',tier,face,sign,col,row,pos,q);
    // Pan endpoints stay underneath adjacent cover-tile edges.
    if(col<cols){const panPoint=new T.Vector3(...facePoint(tier,face,sign,cross+p.pitch/2,run)).addScaledVector(yAxis,p.bedOffset-.025);add('pan',tier,face,sign,col,row,panPoint,q);}
    if(row===steps){
     const eavePos=pos.clone().addScaledVector(dir,p.length/2),flat=new T.Quaternion().setFromAxisAngle(UP,face==='front'?(sign===1?0:Math.PI):(sign===1?Math.PI/2:-Math.PI/2));
     add('disk',tier,face,sign,col,0,eavePos,flat);add('rim',tier,face,sign,col,0,eavePos.clone().addScaledVector(dir,.025),flat);
     if(col<cols)add('drip',tier,face,sign,col,0,eavePos.clone().addScaledVector(new T.Vector3(...(face==='front'?[1,0,0]:[0,0,1])),p.pitch/2).addScaledVector(UP,-.03),flat);
     if(withEaves){
      const support=eaveSupport(tier,face,sign,cross),tail=new T.Vector3(...support).addScaledVector(UP,-.185),tip=eavePos.clone().addScaledVector(UP,-.36);
      if(tier==='lower')tail.y=13.06; // existing lower purlin: 12.83 centre + .17 radius; 5mm overlap
      const tailRun=tier==='upper'?13.1:face==='front'?14:11+7*4/8.5,midRun=(tailRun+end)/2,tailCross=face==='front'?support[0]:support[2];
      const mid=new T.Vector3(...facePoint(tier,face,sign,(tailCross+cross)/2,midRun)).addScaledVector(UP,-.22);
      // Two straight pieces follow the curved envelope. The joining carpentry remains unverified.
      for(const [piece,a,b] of [[0,tail,mid],[1,mid,tip]]){const rod=b.clone().sub(a),rq=new T.Quaternion().setFromUnitVectors(UP,rod.clone().normalize());add('rafter',tier,face,sign,col,piece,a.clone().add(b).multiplyScalar(.5),rq,[1,rod.length(),1],'eaveRed');}
      add('tip',tier,face,sign,col,0,tip.clone().addScaledVector(dir,.015),flat,[1,1,1],'endWhite');
     }
    }
   }
  }
  if(withEaves){
   // Continuous eave board, not a repeated support block floating between rafters.
   const run=end,half=tier==='upper'?(face==='front'?33:14.5):(face==='front'?36.5:18),pt=facePoint(tier,face,sign,0,run),pos=new T.Vector3(...pt).addScaledVector(UP,-.18);
   const q=new T.Quaternion().setFromAxisAngle(UP,face==='front'?0:Math.PI/2);add('fascia',tier,face,sign,0,0,pos,q,[2*half,p.fasciaDepth,.14],'eaveRed');
  }
 }
 for(const [name,b] of buckets){const mesh=new T.InstancedMesh(b.geo,b.material,b.records.length),matrix=new T.Matrix4();b.records.forEach((r,i)=>{matrix.compose(new T.Vector3(...r.position),new T.Quaternion(...r.orientation),new T.Vector3(...r.scale));mesh.setMatrixAt(i,matrix);if(r.materialKey==='tile'){const v=Math.sin(r.col*19.13+r.row*3.71)*.025;mesh.setColorAt(i,new T.Color().setRGB(.96+v,.94+v,.90+v));}});mesh.userData={records:b.records,name};mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();(b.records[0].layer==='purlins'?timberRoot:root).add(mesh);}
 return{root,timberRoot,records,parameters:p};
}
export function hideOriginalRoofRibs(model){
 let count=0;for(const mesh of model.meshes){const ribs=mesh.userData.records.filter(r=>r.key.startsWith('rib/')||r.key.startsWith('lower/rib/'));if(ribs.length){if(ribs.length!==mesh.count)throw Error('Mixed roof bucket must be split before hiding');mesh.visible=false;count+=ribs.length;}}
 return count;
}

// Split only the outer timber segments being replaced; retain source records for audit.
export function splitEaveRafters(model){
 const replaced=[],matrix=new T.Matrix4();
 const match=r=>r.type==='rafter'&&(r.key.startsWith('rafter/')?Math.max(Math.abs(r.position[2]),Math.abs(r.position[0])-SPEC.ridgeHalf)>13.1:r.key.startsWith('lower/rafter/')&&Math.max((Math.abs(r.position[2])-11)/7,(Math.abs(r.position[0])-28)/8.5)>.43);
 for(const mesh of [...model.meshes]){const drop=mesh.userData.records.map((r,i)=>({r,i})).filter(x=>match(x.r));if(!drop.length)continue;const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(x=>!match(x.r));
  for(const [items,isOld] of [[keep,false],[drop,true]]){if(!items.length)continue;const part=new T.InstancedMesh(mesh.geometry,mesh.material,items.length);items.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);part.setMatrixAt(n,matrix);});part.userData={...mesh.userData,records:items.map(x=>x.r),replacedEave:isOld};part.castShadow=part.receiveShadow=true;part.computeBoundingBox();part.computeBoundingSphere();mesh.parent.add(part);model.meshes.push(part);if(isOld)replaced.push(part);}
  mesh.parent.remove(mesh);model.meshes.splice(model.meshes.indexOf(mesh),1);mesh.dispose();
 }return replaced;
}
