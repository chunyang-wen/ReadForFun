import * as T from '../../../vendor/three.module.js';
import {buildModel,surfaceY,lowerY} from '../../model.js';
import fs from 'node:fs';
const here=new URL('./',import.meta.url),source=process.argv[2]==='baseline'?'baseline':'current';
let build=buildModel;
if(source==='baseline'){let s=fs.readFileSync(new URL('baseline/model.js',here),'utf8').replace("'../vendor/three.module.js'",JSON.stringify(new URL('../../../vendor/three.module.js',import.meta.url).href)).replace("'./data.js'",JSON.stringify(new URL('../../data.js',import.meta.url).href));build=(await import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'))).buildModel;}
const m=build({wood:new T.MeshBasicMaterial()}),out={source,roofTriangles:{up:0,down:0,degenerate:0},rafters:{instances:0,vertices:0,outside:0,penetrating:0,worst:0,worstID:null},chainGaps:0};
for(const mesh of m.meshes){const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index,mat=new T.Matrix4();if(mesh.userData.records.some(r=>r.id.startsWith('roof/')||r.surfaceRole))for(let k=0;k<idx.count;k+=3){const a=new T.Vector3().fromBufferAttribute(pos,idx.getX(k)),b=new T.Vector3().fromBufferAttribute(pos,idx.getX(k+1)),c=new T.Vector3().fromBufferAttribute(pos,idx.getX(k+2)),n=b.sub(a).cross(c.sub(a));out.roofTriangles[n.lengthSq()<1e-14?'degenerate':n.y>0?'up':'down']++;}
if(mesh.userData.records[0].type!=='rafter')continue;
for(let k=0;k<mesh.count;k++){const r=mesh.userData.records[k];mesh.getMatrixAt(k,mat);out.rafters.instances++;for(let j=0;j<pos.count;j++){const p=new T.Vector3().fromBufferAttribute(pos,j).applyMatrix4(mat),lower=r.key.startsWith('lower'),t=lower?Math.max((Math.abs(p.x)-19.46)/5.14,(Math.abs(p.z)-8.445)/5.155):Math.max(Math.abs(p.z)/10.1,(Math.abs(p.x)-12.65)/8.5);out.rafters.vertices++;if(t<0||t>1){out.rafters.outside++;continue;}const d=p.y-(lower?lowerY(t):surfaceY(p.x,p.z))-.16;if(d>1e-5)out.rafters.penetrating++;if(d>out.rafters.worst){out.rafters.worst=d;out.rafters.worstID=r.id;}}}}
for(const chain of Map.groupBy(m.records.filter(r=>r.type==='rafter'),r=>r.key).values())for(let k=1;k<chain.length;k++)if(new T.Vector3(...chain[k-1].endpoints[1]).distanceTo(new T.Vector3(...chain[k].endpoints[0]))>1e-5)out.chainGaps++;
console.log(JSON.stringify(out,null,2));
