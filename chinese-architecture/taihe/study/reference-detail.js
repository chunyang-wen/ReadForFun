import * as T from '../../vendor/three.module.js';

function shapeFrom(ring,holes=[],map=([x,y])=>[x,y]){
  const shape=new T.Shape(ring.map(p=>new T.Vector2(...map(p))));
  for(const hole of holes)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(...map(p)))));
  return shape;
}
function geometry(shapes,map,depth){
  const paths=shapes.map(s=>shapeFrom(s.outer,s.holes,map));
  return new T.ExtrudeGeometry(paths,{depth,bevelEnabled:false,curveSegments:3});
}

export function buildReferenceDetail(data){
  const root=new T.Group(),records=[];root.name='photo-derived-detail';root.position.fromArray(data.position);
  const map=([x,y])=>[(x-data.origin[0])*data.scale,(data.origin[1]-y)*data.scale];
  const materials={wood:new T.MeshStandardMaterial({color:0x843c2b,roughness:.7}),blue:new T.MeshStandardMaterial({color:0x123b9d,roughness:.66}),gold:new T.MeshStandardMaterial({color:0xcfb36b,metalness:.62,roughness:.49}),paintBlue:new T.MeshStandardMaterial({color:0x173f78,roughness:.76}),paintGreen:new T.MeshStandardMaterial({color:0x254e48,roughness:.8}),paintGround:new T.MeshStandardMaterial({color:0x182b28,roughness:.85})};
  function add(id,shapes,mat,z,depth,note){
    if(!shapes.length)return;
    const g=geometry(shapes,map,depth),mesh=new T.Mesh(g,mat);mesh.position.z=z;mesh.castShadow=mesh.receiveShadow=true;
    const r={id:'study/reference/'+id,source:data.source,referenceHash:data.sha256,status:'图像判读',note};
    mesh.userData.record=r;records.push(r);root.add(mesh);return mesh;
  }
  add('frame',[{outer:data.frame,holes:[]}],materials.wood,0,.19,'照片逐点轮廓；厚度为推定');
  add('field',[{outer:data.field,holes:[]}],materials.blue,.19,.097,'蓝底边界来自原照；未烘焙照片阴影');
  add('letters',data.glyphs,materials.gold,.290,.007,'原匾笔画轮廓，含字内空白；非字体替代。沥粉高度为推定');
  add('frame-carving',data.trim,materials.gold,.196,.009,'照片可见描金卷草轮廓；浮雕深度推定，非扫描');
  add('paint-backing',data.paintRegions.map(outer=>({outer,holes:[]})),materials.paintGround,-.035,.024,'只补照片可见彩画表面；背后构造不据此推定');
  add('paint-blue',data.paint.blue,materials.paintBlue,-.010,.002,'可见青蓝色地子的边界');
  add('paint-green',data.paint.green,materials.paintGreen,-.007,.002,'可见青绿色地子的边界');
  add('paint-gold',data.paint.gold,materials.gold,-.004,.004,'原照可见金龙及边线轮廓；遮挡部分未补绘');
  return {root,records,materials};
}

export function addRoundelRelief(sample,data,material){
  const {centre,radius,shapes}=data.relief;
  const map=([x,y])=>[(x-centre[0])*.104/radius,(centre[1]-y)*.104/radius];
  if(!shapes.length)throw Error('Roundel contour missing');
  const g=geometry(shapes,map,.004);
  const disks=sample.records.filter(r=>r.kind==='eave-disk'),mesh=new T.InstancedMesh(g,material,disks.length);
  for(let i=0;i<disks.length;i++){
    const p=new T.Vector3(...disks[i].position);p.z+=.023;
    mesh.setMatrixAt(i,new T.Matrix4().compose(p,new T.Quaternion(),new T.Vector3(1,1,1)));
  }
  mesh.castShadow=mesh.receiveShadow=true;mesh.userData={kind:'source-roundel-relief',source:data.source,status:'图像判读',note:'可见亮脊轮廓；凸高推定，不能当原物三维扫描'};
  mesh.computeBoundingBox();mesh.computeBoundingSphere();sample.root.add(mesh);return mesh;
}

export function projectReference(camera,data){
  camera.updateMatrixWorld(true);
  const project=p=>{const v=new T.Vector3(...p).project(camera);return[(v.x+1)*data.imageSize[0]/2,(1-v.y)*data.imageSize[1]/2];};
  const rms=(points,pixels)=>Math.sqrt(points.reduce((sum,p,i)=>sum+project(p).reduce((s,v,k)=>s+(v-pixels[i][k])**2,0),0)/points.length);
  return {fitPixels:rms(data.calibration.fitWorld,data.calibration.fitPixels),holdoutPixels:rms(data.calibration.holdoutWorld,data.calibration.holdoutPixels),projected:data.calibration.fitWorld.map(project),scope:'匾额平面局部，固定FOV；整殿与隐蔽深度未认证'};
}
