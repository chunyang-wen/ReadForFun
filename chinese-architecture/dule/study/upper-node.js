import * as T from '../../vendor/three.module.js';
// DPM paper PDF12/printed35 footnote2 establishes two descending ang sharing one jump height.
// Ang angle, rear tails, individual jump division and sections remain a diagnostic hypothesis.
export const UPPER_NODE={revision:'upper-node-02',reach:[.425,.850,1.345,1.840],angle:.20,columnHeight:1.8,source:'dpm-scale:印刷35页注2：两下昂；印刷30页表四：出跳对合计0.85/0.99m；逐跳等分、倾角及截面推定'};
export function buildUpperNode(materials,p=UPPER_NODE){
 const root=new T.Group(),layers=new Map(['columns','brackets','purlins'].map(id=>{const g=new T.Group();root.add(g);return [id,g];})),records=[],meshes=[],buckets=new Map();const box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,16),dou=new T.CylinderGeometry(.50,.33,1,4);dou.rotateY(Math.PI/4);
 function add(kind,g,pos,scale,key,layer='brackets',mat='wood',q=new T.Quaternion(),extra={}){const r={id:`dule/upper-node02/${key}`,type:kind,layer,position:pos,scale,orientation:q.toArray(),status:'比例推定',source:p.source,parameterRevision:p.revision,tier:Number(key.split('/')[1])||(['bearing','purlin'].includes(kind)?5:0),...extra};records.push(r);const k=layer+mat+g.uuid;if(!buckets.has(k))buckets.set(k,{g,layer,mat,items:[]});buckets.get(k).items.push({r,m:new T.Matrix4().compose(new T.Vector3(...pos),q,new T.Vector3(...scale))});}
 add('column',cyl,[0,-.9,0],[.245,1.8,.245],'column','columns','column');add('dou',dou,[0,.13,0],[.70,.29,.70],'root-dou');
 const stations=[.44,.85,1.23,1.44];
 for(let i=0;i<4;i++){const reach=p.reach[i],y=stations[i],back=i<2?.8:1.25,descending=i>=2,angle=descending?p.angle:0,length=reach+back,centerZ=(reach-back)/2,centerY=y+(descending?(reach-centerZ)*Math.tan(angle):0),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle);
 add(descending?'ang':'hua',box,[0,centerY,centerZ],[.245,.22,length/Math.cos(angle)],`jump/${i+1}`,undefined,'wood',q,{tier:i+1,shapeEvidence:descending?'文献明确：两下昂存在；斜率及端头推定':'出跳对内等分推定',note:'矩形段表达昂身方向，不复原实物昂嘴、后尾卯口'});
 add('dou',dou,[0,y+.19,reach],[.33,.22,.33],`outer-dou/${i+1}`);add('gong',box,[0,y+.34,reach],[1.35,.18,.23],`transverse/${i+1}`);
 for(const sx of [-1,1])add('dou',dou,[sx*.47,y+.48,reach],[.28,.18,.28],`cross-dou/${i+1}/${sx}`);
 }
 add('bearing',box,[0,2.08,p.reach[3]],[1.8,.24,.30],'bearing');const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2);add('purlin',cyl,[0,2.28,p.reach[3]],[.14,2.4,.14],'purlin','purlins','wood',q);
 for(const b of buckets.values()){const m=new T.InstancedMesh(b.g,materials[b.mat],b.items.length);m.userData={layer:b.layer,materialKey:b.mat,records:b.items.map(x=>x.r),tier:0};b.items.forEach((x,i)=>m.setMatrixAt(i,x.m));m.castShadow=m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();m.userData.baseMatrices=m.instanceMatrix.array.slice();layers.get(b.layer).add(m);meshes.push(m);}return {root,layers,records,meshes};
}
