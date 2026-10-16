// A conservative capsule/finite-box diagnostic, not a reconstruction or structural solver.
import * as T from '../../../vendor/three.module.js';
import {buildModel} from '../../model.js';
import {writeFileSync} from 'node:fs';
const m=buildModel({}),rows=[];
const pointDistance=(p,b)=>p.distanceTo(b.clampPoint(p,new T.Vector3()));
function segmentDistance(a,b,box){let l=0,h=1;for(let i=0;i<70;i++){const t1=l+(h-l)/3,t2=h-(h-l)/3;if(pointDistance(a.clone().lerp(b,t1),box)<pointDistance(a.clone().lerp(b,t2),box))h=t2;else l=t1;}return Math.min(pointDistance(a,box),pointDistance(b,box),pointDistance(a.clone().lerp(b,(l+h)/2),box));}
for(const p of m.records.filter(r=>/^purlin\/(true|false)\//.test(r.key))){
 const mesh=m.meshes.find(s=>s.userData.records.some(r=>r.id===p.id)),idx=mesh.userData.records.findIndex(r=>r.id===p.id),mat=new T.Matrix4();mesh.getMatrixAt(idx,mat);mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox.clone().applyMatrix4(mat);
 const [,upper,sign]=p.key.split('/'),rafters=m.records.filter(r=>r.key.startsWith(`rafter/${upper}/${sign}/17/`));let min=Infinity,nearest=null;
 for(const r of rafters){const distance=segmentDistance(new T.Vector3(...r.endpoints[0]),new T.Vector3(...r.endpoints[1]),box);if(distance<min){min=distance;nearest=r.id;}}
 rows.push({purlin:p.id,rafter:nearest,sampledRafterRow:17,conservativeGapLowerBound:Math.max(0,min-.045),possibleContact:min<=.045+1e-5});
}
const report={method:'Middle-row actual axis segments versus actual finite purlin AABBs, expanded by .045m rafter capsule radius. Positive gap is a conservative software gap; zero does not prove finite cylinder contact. No physical measurement is implied.',samples:rows.length,positiveGaps:rows.filter(r=>r.conservativeGapLowerBound>1e-4).length,maxGapLowerBound:Math.max(...rows.map(r=>r.conservativeGapLowerBound)),rows};
writeFileSync(new URL('./timber-contact-unresolved.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log({samples:report.samples,positiveGaps:report.positiveGaps,maxGapLowerBound:report.maxGapLowerBound});

if(report.positiveGaps)process.exitCode=1; // Preserve the known failure independently of passing checks.
