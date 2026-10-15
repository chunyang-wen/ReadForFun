import * as T from '../../vendor/three.module.js';
import {buildModel} from '../model.js';
import {readFile,writeFile} from 'node:fs/promises';
const baseURL=new URL('../updates/03/baseline/model.js',import.meta.url);
let source=await readFile(baseURL,'utf8');
source=source.replace("'../vendor/three.module.js'",JSON.stringify(new URL('../../vendor/three.module.js',import.meta.url).href)).replace("'./data.js'",JSON.stringify(new URL('../data.js',import.meta.url).href));
const baseline=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function audit(build){
 const model=build({wood:new T.MeshBasicMaterial()}),panels=[];let degenerate=0,worst=-Infinity,penetrating=0,checked=0;
 for(const mesh of model.meshes){const g=mesh.geometry,p=g.attributes.position,ids=g.index?.array;if(!ids||p.count!==4)continue;
  for(let k=0;k<ids.length;k+=3){const a=new T.Vector3().fromBufferAttribute(p,ids[k]),b=new T.Vector3().fromBufferAttribute(p,ids[k+1]),c=new T.Vector3().fromBufferAttribute(p,ids[k+2]);if(b.sub(a).cross(c.sub(a)).length()<1e-7)degenerate++;}
  if(mesh.userData.layer!=='roof')continue;
  const vs=Array.from({length:4},(_,i)=>new T.Vector3().fromBufferAttribute(p,i)),flat=v=>new T.Vector3(v.x,0,v.z);
  panels.push({storey:mesh.userData.storey,plane:new T.Plane().setFromCoplanarPoints(...vs.slice(0,3)),triangles:[[0,1,2],[0,2,3]].map(ids=>new T.Triangle(...ids.map(i=>flat(vs[i]))))});
 }
 const matrix=new T.Matrix4();
 for(const mesh of model.meshes.filter(m=>m.userData.records[0].type==='rafter'))mesh.userData.records.forEach((r,i)=>{const centre=new T.Vector3(r.position[0],0,r.position[2]),panel=panels.find(p=>p.storey===r.storey&&p.triangles.some(t=>t.containsPoint(centre)));if(!panel)throw Error('Missing panel for '+r.id);mesh.getMatrixAt(i,matrix);let maximum=-Infinity;for(let k=0;k<mesh.geometry.attributes.position.count;k++)maximum=Math.max(maximum,panel.plane.distanceToPoint(new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,k).applyMatrix4(matrix)));worst=Math.max(worst,maximum);if(maximum>1e-6)penetrating++;checked++;});
 return {degenerateTriangles:degenerate,checkedRafterSegments:checked,penetratingRafterSegments:penetrating,worstNormalDistanceMetres:worst,scope:'actual cylinder vertices against corresponding finite roof panel plane; mathematical teaching geometry, not surveyed timber'};
}
const report={baseline:audit(baseline.buildModel),current:audit(buildModel)};
await writeFile(new URL('../updates/03/geometry-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
