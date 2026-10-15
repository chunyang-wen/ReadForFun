import * as T from '../../vendor/three.module.js';
import {ROOF,roofY,surfaceY,getColumnGrid} from '../model.js';
// 2014/2020 visible envelope; these are explicit visual hypotheses, not survey measurements.
export const ENVELOPE={revision:'roof-envelope-02',pitch:.28,step:.31,length:.43,radius:.085,upperWing:.78,lowerWing:.58,upperWingStart:8.1,lowerWingStart:8.3,source:'commons-2020 + commons-side-2014:外形图像判读；翼角参数比例推定'};
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const LOW={halfX:11.8,halfZ:8.94,innerX:-getColumnGrid(1).xs[0],innerZ:getColumnGrid(1).zs[4],eaveY:6.61,innerY:9.05};
export function upperWing(x,z,p=ENVELOPE){return p.upperWing*smooth((Math.abs(x)-p.upperWingStart)/(ROOF.halfX-p.upperWingStart))*smooth((Math.abs(z)-5.9)/(ROOF.halfZ-5.9));}
export function upperSurface(x,z,p=ENVELOPE){return surfaceY(x,z)+.16+upperWing(x,z,p);}
export function lowerSurface(x,z,p=ENVELOPE){const t=clamp(Math.max((Math.abs(x)-LOW.innerX)/(LOW.halfX-LOW.innerX),(Math.abs(z)-LOW.innerZ)/(LOW.halfZ-LOW.innerZ)));return LOW.innerY-(LOW.innerY-LOW.eaveY)*Math.pow(t,.8)+p.lowerWing*smooth((Math.abs(x)-p.lowerWingStart)/(LOW.halfX-p.lowerWingStart))*smooth((Math.abs(z)-6.3)/(LOW.halfZ-6.3));}
function strip(points){const g=new T.BufferGeometry(),v=points.flat(),idx=[];for(let i=0;i<points.length/2-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}
export function buildRoofEnvelope(materials,p=ENVELOPE){
 const root=new T.Group(),records=[],buckets=new Map();root.userData.layer='roof';
 const panShape=new T.Shape();for(let i=0;i<=12;i++){const x=-p.pitch/2+i*p.pitch/12,y=.04*(2*x/p.pitch)**2;i?panShape.lineTo(x,y):panShape.moveTo(x,y);}for(let i=12;i>=0;i--){const x=-p.pitch/2+i*p.pitch/12;panShape.lineTo(x,.04*(2*x/p.pitch)**2-.02);}panShape.closePath();
 const pan=new T.ExtrudeGeometry(panShape,{depth:p.length,bevelEnabled:false});pan.translate(0,0,-p.length/2);
 // Half-shell section, independently sampled over this two-dimensional roof envelope.
 const coverShape=new T.Shape();for(let i=0;i<=12;i++){const a=i*Math.PI/12,x=Math.cos(a)*p.radius,y=Math.sin(a)*p.radius*.82;i?coverShape.lineTo(x,y):coverShape.moveTo(x,y);}for(let i=12;i>=0;i--){const a=i*Math.PI/12;coverShape.lineTo(Math.cos(a)*(p.radius-.018),Math.sin(a)*(p.radius*.82-.018));}coverShape.closePath();
 const cover=new T.ExtrudeGeometry(coverShape,{depth:p.length,bevelEnabled:false});cover.translate(0,0,-p.length/2);
 const disk=new T.CylinderGeometry(p.radius,p.radius,.035,18);disk.rotateX(Math.PI/2);
 const dripShape=new T.Shape();dripShape.moveTo(-p.pitch*.45,0);dripShape.lineTo(p.pitch*.45,0);dripShape.lineTo(p.pitch*.43,-.05);dripShape.quadraticCurveTo(.05,-.10,0,-.17);dripShape.quadraticCurveTo(-.05,-.10,-p.pitch*.43,-.05);dripShape.closePath();const drip=new T.ExtrudeGeometry(dripShape,{depth:.025,bevelEnabled:false});
 const cylinder=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry(1,1,1);
 function add(kind,geo,position,q=new T.Quaternion(),scale=[1,1,1],key='',extra={},mat='tile'){
 const record={id:`dule/roof02/${key}`,type:kind,kind,layer:'roof',position:[...position],scale:[...scale],orientation:q.toArray(),source:p.source,status:'比例推定',parameterRevision:p.revision,...extra};records.push(record);
 const layer=extra.layer||'roof';const k=layer+':'+kind+':'+geo.uuid+':'+mat;if(!buckets.has(k))buckets.set(k,{geo,mat,layer,items:[]});buckets.get(k).items.push({record,matrix:new T.Matrix4().compose(new T.Vector3(...position),q,new T.Vector3(...scale))});return record;
 }
 function line(a,b,r,key,kind='ridge',mat='ridge',extra={}){const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va);add(kind,cylinder,va.add(vb).multiplyScalar(.5).toArray(),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),[r,delta.length(),r],key,{endpoints:[a,b],...extra},mat);}
 function pose(x,z,dir,H){const ds=.02,dx=dir[0],dz=dir[1],slope=(H(x+dx*ds,z+dz*ds)-H(x-dx*ds,z-dz*ds))/(2*ds),along=new T.Vector3(dx,slope,dz).normalize(),normal=new T.Vector3(-(H(x+ds,z)-H(x-ds,z))/(2*ds),1,-(H(x,z+ds)-H(x,z-ds))/(2*ds)).normalize(),across=new T.Vector3().crossVectors(normal,along).normalize(),up=new T.Vector3().crossVectors(along,across).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(across,up,along));}
 function tiles(tier,H,start,end,sides,spanAt){
 for(const side of sides){const axis=side.axis,sign=side.sign,rows=Math.ceil((end-start)/p.step),alongAt=k=>start+(end-start)*k/rows;
 for(let row=0;row<=rows;row++){const d=alongAt(row),span=spanAt(d),cols=Math.floor((span-.12)/p.pitch);
 for(let col=-cols;col<=cols;col++){const cross=col*p.pitch,x=axis==='z'?cross:sign*d,z=axis==='z'?sign*d:cross,dir=axis==='z'?[0,sign]:[sign,0],q=pose(x,z,dir,H);add('cover-tile',cover,[x,H(x,z)+.07,z],q,[1,1,1],`${tier}/${axis}/${sign}/cover/${row}/${col}`,{tier,side:axis,sign});
 if(col<cols){const xx=axis==='z'?cross+p.pitch/2:x,zz=axis==='z'?z:cross+p.pitch/2;add('pan-tile',pan,[xx,H(xx,zz)+.035,zz],pose(xx,zz,dir,H),[1,1,1],`${tier}/${axis}/${sign}/pan/${row}/${col}`,{tier});}
 if(row===rows){const eX=x+dir[0]*.18,eZ=z+dir[1]*.18,flat=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(dir[0],dir[1]));add('eave-disk',disk,[eX,H(x,z)+.065,eZ],flat,[1,1,1],`${tier}/${axis}/${sign}/disk/${col}`,{tier});if(col<cols){const xx=axis==='z'?eX+p.pitch/2:eX,zz=axis==='z'?eZ:eZ+p.pitch/2;add('drip-edge',drip,[xx,H(axis==='z'?xx:x,axis==='z'?z:zz)-.01,zz],flat,[1,1,1],`${tier}/${axis}/${sign}/drip/${col}`,{tier});}}
 }
 }
 }
 }
 // Continuous boards follow the same surface as tiles. End slopes are separate and overlap only along hips.
 for(const s of [-1,1]){
  for(let i=0;i<50;i++){const d0=ROOF.halfZ*i/50,d1=ROOF.halfZ*(i+1)/50,hx=d=>d<ROOF.breakZ?ROOF.ridgeHalf:ROOF.ridgeHalf+(d-ROOF.breakZ)/(ROOF.halfZ-ROOF.breakZ)*(ROOF.halfX-ROOF.ridgeHalf);const pts=[];for(let j=0;j<=70;j++){const u=-1+2*j/70,x0=hx(d0)*u,x1=hx(d1)*u;pts.push([x0,upperSurface(x0,s*d0,p),s*d0],[x1,upperSurface(x1,s*d1,p),s*d1]);}add('board',strip(pts),[0,0,0],undefined,undefined,`upper/long-board/${s}/${i}`,{tier:'upper'},'roofBoard');}
  for(let i=0;i<25;i++){const x0=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*i/25,x1=ROOF.ridgeHalf+(ROOF.halfX-ROOF.ridgeHalf)*(i+1)/25,zAt=x=>ROOF.breakZ+(x-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ);const pts=[];for(let j=0;j<=55;j++){const u=-1+2*j/55,z0=zAt(x0)*u,z1=zAt(x1)*u;pts.push([s*x0,upperSurface(s*x0,z0,p),z0],[s*x1,upperSurface(s*x1,z1,p),z1]);}add('board',strip(pts),[0,0,0],undefined,undefined,`upper/end-board/${s}/${i}`,{tier:'upper'},'roofBoard');}
  for(const axis of ['x','z'])for(let i=0;i<14;i++){const a=i/14,b=(i+1)/14,crossAt=t=>axis==='z'?LOW.innerX+(LOW.halfX-LOW.innerX)*t:LOW.innerZ+(LOW.halfZ-LOW.innerZ)*t,alongAt=t=>axis==='z'?LOW.innerZ+(LOW.halfZ-LOW.innerZ)*t:LOW.innerX+(LOW.halfX-LOW.innerX)*t,pts=[];for(let j=0;j<=70;j++){for(const t of [a,b]){const c=(-1+2*j/70)*crossAt(t),d=s*alongAt(t),x=axis==='z'?c:d,z=axis==='z'?d:c;pts.push([x,lowerSurface(x,z,p),z]);}}add('board',strip(pts),[0,0,0],undefined,undefined,`lower/${axis}-board/${s}/${i}`,{tier:'lower'},'roofBoard');}
 }
 const HU=(x,z)=>upperSurface(x,z,p),HL=(x,z)=>lowerSurface(x,z,p);
 tiles('upper',HU,.14,ROOF.halfZ,[{axis:'z',sign:1},{axis:'z',sign:-1}],d=>d<ROOF.breakZ?ROOF.ridgeHalf:ROOF.ridgeHalf+(d-ROOF.breakZ)/(ROOF.halfZ-ROOF.breakZ)*(ROOF.halfX-ROOF.ridgeHalf));
 tiles('upper',HU,ROOF.ridgeHalf+.14,ROOF.halfX,[{axis:'x',sign:1},{axis:'x',sign:-1}],d=>ROOF.breakZ+(d-ROOF.ridgeHalf)/(ROOF.halfX-ROOF.ridgeHalf)*(ROOF.halfZ-ROOF.breakZ)-.18);
 tiles('lower',HL,LOW.innerZ,LOW.halfZ,[{axis:'z',sign:1},{axis:'z',sign:-1}],d=>LOW.innerX+(d-LOW.innerZ)/(LOW.halfZ-LOW.innerZ)*(LOW.halfX-LOW.innerX));
 tiles('lower',HL,LOW.innerX+.12,LOW.halfX,[{axis:'x',sign:1},{axis:'x',sign:-1}],d=>LOW.innerZ+(d-LOW.innerX)/(LOW.halfX-LOW.innerX)*(LOW.halfZ-LOW.innerZ)-.18);
 // Main ridge + four gable verges + four diagonal ridges (the nine-ridge envelope).
 for(let i=0;i<48;i++){const x0=-ROOF.ridgeHalf+2*ROOF.ridgeHalf*i/48,x1=-ROOF.ridgeHalf+2*ROOF.ridgeHalf*(i+1)/48;line([x0,ROOF.ridgeY+.34,0],[x1,ROOF.ridgeY+.34,0],.18,`ridge/main/${i}`);}
 for(const sx of [-1,1])for(const sz of [-1,1]){
 for(let i=0;i<20;i++){const z0=sz*ROOF.breakZ*i/20,z1=sz*ROOF.breakZ*(i+1)/20;line([sx*ROOF.ridgeHalf,HU(sx*ROOF.ridgeHalf,z0)+.15,z0],[sx*ROOF.ridgeHalf,HU(sx*ROOF.ridgeHalf,z1)+.15,z1],.13,`ridge/verge/${sx}/${sz}/${i}`);}
 for(const [tier,H,ix,iz,hx,hz] of [['upper',HU,ROOF.ridgeHalf,ROOF.breakZ,ROOF.halfX,ROOF.halfZ],['lower',HL,LOW.innerX,LOW.innerZ,LOW.halfX,LOW.halfZ]])for(let i=0;i<24;i++){const points=[i/24,(i+1)/24].map(t=>{const x=sx*(ix+(hx-ix)*t),z=sz*(iz+(hz-iz)*t);return [x,H(x,z)+.15,z];});line(points[0],points[1],.125,`ridge/${tier}-hip/${sx}/${sz}/${i}`);}
 }
 // Curved eave bearing rails remain with purlins while the tile shell lifts.
 const supportRoot=new T.Group();supportRoot.userData.layer='purlins';
 for(const [tier,H,hx,hz] of [['upper',HU,ROOF.halfX,ROOF.halfZ],['lower',HL,LOW.halfX,LOW.halfZ]])for(const sign of [-1,1])for(const axis of ['x','z'])for(let i=0;i<70;i++){
 const cross=axis==='z'?hx:hz,along=axis==='z'?hz:hx,points=[i/70,(i+1)/70].map(t=>{const c=-cross+2*cross*t,x=axis==='z'?c:sign*along,z=axis==='z'?sign*along:c;return [x,H(x,z)-.24,z];});
 line(points[0],points[1],.14,`eave-bearing/${tier}/${axis}/${sign}/${i}`,'eave-bearing','wood',{layer:'purlins',tier,note:'同翼角包络的承檐轨迹；分段曲线为推定，非真实构件拼缝'});
 }
 for(const [k,b] of buckets){const m=new T.InstancedMesh(b.geo,materials[b.mat]||materials.tile,b.items.length);m.userData={layer:b.layer,materialKey:b.mat,records:b.items.map(x=>x.record)};b.items.forEach((x,i)=>m.setMatrixAt(i,x.matrix));m.castShadow=m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();(b.layer==='roof'?root:supportRoot).add(m);}
 return {root,supportRoot,records,meshes:[...root.children,...supportRoot.children],parameters:p};
}
export function replaceRoofLayer(model,envelope){const group=model.layers.get('roof'),old=model.meshes.filter(m=>m.userData.layer==='roof');for(const mesh of old){group.remove(mesh);model.meshes.splice(model.meshes.indexOf(mesh),1);mesh.dispose();}group.add(envelope.root);model.layers.get('purlins').add(envelope.supportRoot);model.meshes.push(...envelope.meshes);return old.flatMap(m=>m.userData.records).length;}
// Raising the visible corners without moving supporting rafters would create a false unsupported shell.
// Refit only existing endpoint-based roof members, preserve their IDs and non-roof structural transforms.
export function refitRoofMembers(model,p=ENVELOPE){
 const mat=new T.Matrix4(),pos=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();let changed=0;
 for(const mesh of model.meshes.filter(m=>m.userData.layer==='rafters'))for(let i=0;i<mesh.count;i++){
 const r=mesh.userData.records[i];if(!r.endpoints)continue;const lift=a=>a[1]>12?upperWing(a[0],a[2],p):lowerSurface(a[0],a[2],p)-lowerSurface(a[0],a[2],{...p,lowerWing:0});
 const [a,b]=r.endpoints.map(a=>[a[0],a[1]+lift(a),a[2]]);if(Math.abs(lift(r.endpoints[0]))+Math.abs(lift(r.endpoints[1]))<1e-8)continue;
 const d=new T.Vector3(...b).sub(new T.Vector3(...a));mesh.getMatrixAt(i,mat);mat.decompose(pos,q,scale);scale.y=d.length();pos.fromArray(a).add(new T.Vector3(...b)).multiplyScalar(.5);q.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.setMatrixAt(i,new T.Matrix4().compose(pos,q,scale));r.endpoints=[a,b];r.position=pos.toArray();r.scale=scale.toArray();r.orientation=q.toArray();r.parameterRevision=p.revision;r.note='翼角外形推定，同步拟合椽檩端点；未恢复真实角梁榫卯';changed++;
 }
 for(const mesh of model.meshes){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}return changed;
}
