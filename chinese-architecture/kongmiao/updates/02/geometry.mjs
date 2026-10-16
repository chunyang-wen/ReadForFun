import {buildModel} from '../../model.js';
import * as T from '../../../vendor/three.module.js';
const m=buildModel({}),report={roof:[],duplicatePurlins:[]},seen=new Map();
for(const mesh of m.meshes){const rs=mesh.userData.records,geo=mesh.geometry;if(rs[0].key.startsWith('roof/')){const p=geo.attributes.position,idx=geo.index;let down=0,degenerate=0,minArea=Infinity;for(let i=0;i<idx.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,idx.getX(i)),b=new T.Vector3().fromBufferAttribute(p,idx.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,idx.getX(i+2)),n=b.sub(a).cross(c.sub(a));minArea=Math.min(minArea,n.length()/2);if(n.length()<1e-8)degenerate++;if(n.y<0)down++;}report.roof.push({key:rs[0].key,triangles:idx.count/3,down,degenerate,minArea});}
for(const r of rs.filter(r=>r.type==='purlin'&&r.endpoints)){const k=JSON.stringify(r.endpoints);if(seen.has(k))report.duplicatePurlins.push([seen.get(k),r.id]);seen.set(k,r.id);}}
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--assert')&&(report.roof.some(r=>r.down||r.degenerate)||report.duplicatePurlins.length))process.exitCode=1;
