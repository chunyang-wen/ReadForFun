import * as T from '../../vendor/three.module.js';
import {buildRoofSystem,eaveSupport,upperSurface,lowerSurface,ROOF_PARAMETERS} from './roof-system.js';
import {writeFileSync} from 'node:fs';
const s=buildRoofSystem({tile:new T.MeshStandardMaterial()},{withEaves:true}),groups=new Map();
function ends(r){const half=new T.Vector3(0,r.scale[1]/2,0).applyQuaternion(new T.Quaternion(...r.orientation)),p=new T.Vector3(...r.position);return[p.clone().sub(half),p.clone().add(half)];}
let currentCollision=0,currentWorst=-Infinity,oldFootprint=0,oldChordCollision=0,oldWorst=-Infinity;
for(const r of s.records.filter(r=>r.kind==='rafter')){const key=[r.tier,r.face,r.sign,r.col].join('/');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
 const [a,b]=ends(r);for(let i=0;i<=20;i++){const p=a.clone().lerp(b,i/20),h=(r.tier==='upper'?upperSurface:lowerSurface)(p.x,p.z),d=p.y+.065-h;currentWorst=Math.max(currentWorst,d);if(d>1e-8)currentCollision++;}}
for(const parts of groups.values()){parts.sort((a,b)=>a.row-b.row);const r=parts[0],cross=r.col*ROOF_PARAMETERS.pitch,limit=r.tier==='upper'?(r.face==='front'?31.6:13.1):(r.face==='front'?32:14);if(Math.abs(cross)>limit)oldFootprint++;
 const a=new T.Vector3(...eaveSupport(r.tier,r.face,r.sign,cross)).add(new T.Vector3(0,-.36,0)),b=ends(parts[1])[1];for(let i=0;i<=20;i++){const p=a.clone().lerp(b,i/20),h=(r.tier==='upper'?upperSurface:lowerSurface)(p.x,p.z),d=p.y+.065-h;oldWorst=Math.max(oldWorst,d);if(d>1e-8)oldChordCollision++;}}
const report={schema:'architecture-geometry-audit/v1',scope:'Software envelope/finite-bearing checks; not as-built carpentry certification',rafterAssemblies:groups.size,records:s.records.length,rejectedAlternatives:{unboundedStraightTail:{unsupportedCornerTails:oldFootprint},singleChordAtOldOffset:{penetratingSamples:oldChordCollision,worstPenetrationM:oldWorst}},current:{penetratingSamples:currentCollision,worstEnvelopeDifferenceM:currentWorst},note:'Counterfactual alternatives reconstructed explicitly by this script; current geometry uses two straight pieces and finite support rings.'};
const path=process.argv[2];if(path)writeFileSync(path,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
