import * as T from '../../vendor/three.module.js';
import {upperHeight} from '../model.js';

// Visual hypothesis, not a measured tile schedule. Metres; Y up, +Z south.
export const SAMPLE={halfWidth:4.26,pitch:.34,start:11.1,end:16.5,step:.30,length:.43,radius:.12};
export const isReplacedRib=r=>r.key.startsWith('upper-rib/1/')&&Math.abs(r.position[0])<SAMPLE.halfWidth;

function tileShell(){
  const shape=new T.Shape();
  for(let i=0;i<=16;i++){const a=i*Math.PI/16;const x=Math.cos(a)*.12,y=Math.sin(a)*.105;i?shape.lineTo(x,y):shape.moveTo(x,y);}
  for(let i=16;i>=0;i--){const a=i*Math.PI/16;shape.lineTo(Math.cos(a)*.098,Math.sin(a)*.083);}
  shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:SAMPLE.length,bevelEnabled:false,steps:1});
  g.translate(0,0,-SAMPLE.length/2);
  const position=g.attributes.position;
  for(let i=0;i<position.count;i++){
    const taper=.88+.12*(position.getZ(i)/SAMPLE.length+.5);
    position.setXYZ(i,position.getX(i)*taper,position.getY(i)*taper,position.getZ(i));
  }
  g.computeVertexNormals();return g;
}

export function createRoofSample(material){
  const root=new T.Group(),records=[],buckets=new Map();root.name='roof-surface-study';
  const cap=tileShell(),pan=new T.BoxGeometry(.34,.025,SAMPLE.length),disk=new T.CylinderGeometry(.125,.125,.035,24),rim=new T.TorusGeometry(.102,.014,6,24);
  disk.rotateX(Math.PI/2);
  const pv=pan.attributes.position;
  for(let i=0;i<pv.count;i++)pv.setY(i,pv.getY(i)+.03*pv.getZ(i)/SAMPLE.length);
  pan.computeVertexNormals();
  function add(kind,geo,p,q,row,col){
    if(!buckets.has(kind))buckets.set(kind,{geo,items:[]});
    const record={id:`study/${kind}/${row}/${col}`,kind,position:p.toArray(),orientation:q.toArray(),status:'比例推定',source:'故宫官网2020年匾额近照：形态参考；尺寸、间距、釉色均未实测'};
    records.push(record);buckets.get(kind).items.push({record,matrix:new T.Matrix4().compose(p,q,new T.Vector3(1,1,1)),row,col});
  }
  for(let col=-12;col<=12;col++){
    const x=col*SAMPLE.pitch;
    for(let row=0;row<=18;row++){
      const z=SAMPLE.start+row*SAMPLE.step,slope=(upperHeight(z+.01)-upperHeight(z-.01))/.02;
      const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.atan(slope));
      // Slightly raised downstream lip creates a real joint; no photographed shadow baked in.
      add('cover-tile',cap,new T.Vector3(x,upperHeight(z)+.06,z),q,row,col);
      if(col<12)add('pan-tile',pan,new T.Vector3(x+.17,upperHeight(z)+.025,z),q,row,col);
    }
    const z=SAMPLE.end+.20,y=upperHeight(SAMPLE.end)+.075;
    add('eave-disk',disk,new T.Vector3(x,y,z),new T.Quaternion(),0,col);
    add('eave-rim',rim,new T.Vector3(x,y,z+.02),new T.Quaternion(),0,col);
  }
  for(const [kind,b] of buckets){
    const mesh=new T.InstancedMesh(b.geo,material,b.items.length);
    for(let i=0;i<b.items.length;i++){
      const item=b.items[i];mesh.setMatrixAt(i,item.matrix);
      const variation=Math.sin(item.row*17.31+item.col*71.17)*.035;
      mesh.setColorAt(i,new T.Color().setRGB(.94+variation,.91+variation,.84+variation));
    }
    mesh.castShadow=mesh.receiveShadow=true;mesh.userData={kind,records:b.items.map(i=>i.record)};
    mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);
  }
  return {root,records};
}

// Remove only the same visible patch, keeping the original model instance records intact.
export function replaceSampleRibs(model){
  let removed=0;
  for(const mesh of [...model.meshes]){
    const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(({r})=>!(isReplacedRib(r)&&r.position[2]>=SAMPLE.start-.3));
    if(keep.length===mesh.count)continue;
    removed+=mesh.count-keep.length;
    const replacement=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length),matrix=new T.Matrix4();
    keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);replacement.setMatrixAt(n,matrix);});
    replacement.userData={...mesh.userData,records:keep.map(({r})=>r)};
    replacement.castShadow=replacement.receiveShadow=true;
    replacement.computeBoundingBox();replacement.computeBoundingSphere();
    const parent=mesh.parent;parent.remove(mesh);parent.add(replacement);
    model.meshes[model.meshes.indexOf(mesh)]=replacement;mesh.dispose();
  }
  return removed;
}
