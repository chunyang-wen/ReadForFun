import * as T from '../vendor/three.module.js';
// Generic rendering experiment. The caller supplies all building evidence and roof height.
export function validatePatch(p){
  for(const key of ['halfWidth','pitch','start','end','step','length','radius'])if(!Number.isFinite(p[key]))throw Error(`Invalid patch ${key}`);
  if(p.halfWidth<=p.radius||p.radius<=.03||p.pitch<=2*p.radius||p.step<=0||p.length<=p.step||p.end<=p.start)throw Error('Invalid patch spacing or overlap');
  if(Math.abs((p.end-p.start)/p.step-Math.round((p.end-p.start)/p.step))>1e-6)throw Error('Patch end must match a full row');
}
function channel(width,length){
  const shape=new T.Shape(),half=width/2;
  for(let i=0;i<=16;i++){const x=-half+i*width/16,y=.045*(x/half)**2;i?shape.lineTo(x,y):shape.moveTo(x,y);}
  for(let i=16;i>=0;i--){const x=-half+i*width/16;shape.lineTo(x,.045*(x/half)**2-.022);}
  shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false});g.translate(0,0,-length/2);return g;
}
function dripGeometry(width){
  const s=new T.Shape();s.moveTo(-width/2,.025);s.lineTo(width/2,.025);s.lineTo(width/2,-.07);s.quadraticCurveTo(width*.28,-.1,0,-.22);s.quadraticCurveTo(-width*.28,-.1,-width/2,-.07);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2});return g;
}
function tileShell(SAMPLE){
  const shape=new T.Shape();
  for(let i=0;i<=16;i++){const a=i*Math.PI/16;const x=Math.cos(a)*SAMPLE.radius,y=Math.sin(a)*SAMPLE.radius*.875;i?shape.lineTo(x,y):shape.moveTo(x,y);}
  for(let i=16;i>=0;i--){const a=i*Math.PI/16;shape.lineTo(Math.cos(a)*(SAMPLE.radius-.022),Math.sin(a)*(SAMPLE.radius*.875-.022));}
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

export function buildRoofPatch(material,{parameters:SAMPLE,height:upperHeight,namespace,source,refined=false}){
  validatePatch(SAMPLE);
  if(typeof upperHeight!=='function'||!namespace||!source)throw new Error('Patch requires height function, namespace and evidence source');
  const root=new T.Group(),records=[],buckets=new Map();root.name='roof-surface-study';
  const cap=tileShell(SAMPLE),pan=refined?channel(SAMPLE.pitch,SAMPLE.length):new T.BoxGeometry(SAMPLE.pitch,.025,SAMPLE.length),disk=new T.CylinderGeometry(SAMPLE.radius+.005,SAMPLE.radius+.005,.035,24),rim=new T.TorusGeometry(SAMPLE.radius-.018,.014,6,24);
  const drip=refined?dripGeometry(SAMPLE.pitch):null;
  disk.rotateX(Math.PI/2);
  const pv=pan.attributes.position;
  for(let i=0;i<pv.count;i++)pv.setY(i,pv.getY(i)+.03*pv.getZ(i)/SAMPLE.length);
  pan.computeVertexNormals();
  function add(kind,geo,p,q,row,col){
    if(!buckets.has(kind))buckets.set(kind,{geo,items:[]});
    const record={id:`${namespace}/${kind}/${row}/${col}`,kind,position:p.toArray(),orientation:q.toArray(),status:'比例推定',source};
    records.push(record);buckets.get(kind).items.push({record,matrix:new T.Matrix4().compose(p,q,new T.Vector3(1,1,1)),row,col});
  }
  const columns=Math.floor((SAMPLE.halfWidth-SAMPLE.radius)/SAMPLE.pitch);
  const rows=Math.round((SAMPLE.end-SAMPLE.start)/SAMPLE.step);
  for(let col=-columns;col<=columns;col++){
    const x=col*SAMPLE.pitch;
    for(let row=0;row<=rows;row++){
      const z=SAMPLE.start+row*SAMPLE.step,slope=(upperHeight(z+.01)-upperHeight(z-.01))/.02;
      const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.atan(slope));
      // Slightly raised downstream lip creates a real joint; no photographed shadow baked in.
      add('cover-tile',cap,new T.Vector3(x,upperHeight(z)+.06,z),q,row,col);
      if(col<columns)add('pan-tile',pan,new T.Vector3(x+SAMPLE.pitch/2,upperHeight(z)+.025,z),q,row,col);
    }
    const z=SAMPLE.end+.20,y=upperHeight(SAMPLE.end)+.075;
    add('eave-disk',disk,new T.Vector3(x,y,z),new T.Quaternion(),0,col);
    add('eave-rim',rim,new T.Vector3(x,y,z+.02),new T.Quaternion(),0,col);
    if(refined&&col<columns)add('drip-edge',drip,new T.Vector3(x+SAMPLE.pitch/2,y-.03,z),new T.Quaternion(),0,col);
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

