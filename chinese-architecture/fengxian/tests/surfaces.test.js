import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {buildModel,surfaceY,lowerY,ROOF} from '../model.js';
const m=buildModel({wood:new T.MeshBasicMaterial()});
function triangles(mesh){const p=mesh.geometry.attributes.position,i=mesh.geometry.index,ns=[];for(let k=0;k<i.count;k+=3){const a=new T.Vector3().fromBufferAttribute(p,i.getX(k)),b=new T.Vector3().fromBufferAttribute(p,i.getX(k+1)),c=new T.Vector3().fromBufferAttribute(p,i.getX(k+2));ns.push(b.sub(a).cross(c.sub(a)));}return ns;}
test('fengxian all eight roof decks and glazed skins have upward nondegenerate faces',()=>{const roofs=m.meshes.filter(m=>m.userData.records.some(r=>r.surfaceRole||r.id.startsWith('roof/')));assert.equal(roofs.length,16);for(const mesh of roofs)for(const n of triangles(mesh)){assert.ok(n.lengthSq()>1e-14,mesh.userData.records[0].id);assert.ok(n.y>0,mesh.userData.records[0].id);}});
test('fengxian upper and lower rafter chains start exactly at hips, include finite purlin stations and remain continuous',()=>{const chains=Map.groupBy(m.records.filter(r=>r.type==='rafter'),r=>r.key);assert.ok(chains.size>250);for(const [key,chain] of chains){for(let i=1;i<chain.length;i++)assert.ok(new T.Vector3(...chain[i-1].endpoints[1]).distanceTo(new T.Vector3(...chain[i].endpoints[0]))<1e-6,key);const r=chain[0],p=r.endpoints[0],end=key.includes('side-'),lower=key.startsWith('lower');const t=r.runStart;const width=lower?(end?8.445+(13.6-8.445)*t:19.46+(24.6-19.46)*t):(end?10.1*t:12.65+(21.15-12.65)*t);if(t>1e-7)assert.ok(Math.abs(Math.abs(p[end?2:0])-width)<1e-6,key);const last=chain.at(-1).endpoints[1];assert.ok(Math.abs(Math.abs(last[end?0:2])-(lower?(end?24.6:13.6):(end?21.15:10.1)))<1e-6,key);}});
test('fengxian complete rafter cylinder vertices stay below local deck, with edge exclusions explicit',()=>{let tested=0,edge=0;const mat=new T.Matrix4();for(const mesh of m.meshes.filter(m=>m.userData.layer==='rafters'&&m.userData.records[0].type==='rafter'))for(let k=0;k<mesh.count;k++){const r=mesh.userData.records[k];mesh.getMatrixAt(k,mat);for(let j=0;j<mesh.geometry.attributes.position.count;j++){const p=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,j).applyMatrix4(mat),lower=r.roofKind==='lower';const t=lower?Math.max((Math.abs(p.x)-19.46)/(24.6-19.46),(Math.abs(p.z)-8.445)/(13.6-8.445)):Math.max(Math.abs(p.z)/10.1,(Math.abs(p.x)-12.65)/(21.15-12.65));if(t<0||t>1){edge++;continue;}const top=(lower?lowerY(t):surfaceY(p.x,p.z))+.16;assert.ok(p.y<top+1e-5,`${r.id}: ${p.y-top}`);tested++;}}assert.ok(tested>500000);assert.ok(edge>0);});
test('fengxian rear middle five bays remain open and remaining bays use correctly oriented sill windows',()=>{assert.ok(!m.records.some(r=>r.id.startsWith('side/wall/')));for(let i=2;i<=6;i++)assert.ok(!m.records.some(r=>r.layer==='enclosure'&&r.id.startsWith(`north/`)&&r.id.includes(`/${i}/`)));for(const s of [-1,1])for(let j=0;j<4;j++){const records=m.records.filter(r=>r.key.startsWith(`side/window/${s}/${j}/`));assert.ok(records.length>100);for(const r of records)assert.ok(Math.abs(r.position[0]-s*22.72)<.09);}});
test('fengxian lower liujin detail contains a single flower and rafter tie, not overlapping duplicate copies',()=>{const d=buildModel({wood:new T.MeshBasicMaterial()},{detailOnly:true,node:'liujin'});assert.equal(d.records.filter(r=>r.source==='survey:图49，花台枋').length,1);assert.equal(d.records.filter(r=>r.source==='survey:图49，承椽枋').length,1);assert.equal(d.records.filter(r=>r.key==='node/flower'||r.key==='node/rafter-tie').length,0);});
test('fengxian purlin station endpoints meet finite support envelopes on all eight slopes',()=>{
 const purlins=m.records.filter(r=>r.type==='purlin'&&/^(upper\/(purlin|eave|side-purlin)|lower\/purlin)/.test(r.key));
 const hips=m.records.filter(r=>r.type==='hip'&&/^(upper|lower)\/hip\//.test(r.key));
 const distance=(p,a,b)=>{const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ap=p.clone().sub(new T.Vector3(...a));return p.distanceTo(new T.Vector3(...a).addScaledVector(ab,T.MathUtils.clamp(ap.dot(ab)/ab.lengthSq(),0,1)));};
 let checks=0;
 for(const chain of Map.groupBy(m.records.filter(r=>r.type==='rafter'),r=>r.key).values())for(let k=0;k<chain.length;k++)for(const end of [0,1]){
  const r=chain[k],adjacent=chain[k+(end?1:-1)];if(adjacent&&JSON.stringify(adjacent.stationSpan)===JSON.stringify(r.stationSpan))continue;
  const p=new T.Vector3(...r.endpoints[end]),lower=r.key.startsWith('lower');const supports=purlins.filter(s=>s.key.startsWith(lower?'lower':'upper'));
  if(!adjacent&&end===0&&r.runStart>1e-7)supports.push(...hips.filter(s=>s.key.startsWith(lower?'lower':'upper')));
  assert.ok(supports.some(s=>distance(p,...s.endpoints)<=(s.type==='hip'?Math.hypot(.30,.32)/2:s.scale[0])+r.scale[0]+1e-5),`${r.id} endpoint ${end}`);checks++;
 }
 assert.ok(checks>1500);
});
test('fengxian roof decks pair every internal and hip seam; only declared inner/outer boundaries remain',()=>{
 for(const lower of [false,true]){const edges=new Map(),key=p=>p.toArray().map(v=>v.toFixed(4)).join(',');for(const mesh of m.meshes.filter(m=>m.userData.records.some(r=>r.id.startsWith(`roof/${lower?'lower':'upper'}/`)))){const p=mesh.geometry.attributes.position,i=mesh.geometry.index;for(let k=0;k<i.count;k+=3)for(const [a,b] of [[0,1],[1,2],[2,0]]){const aa=new T.Vector3().fromBufferAttribute(p,i.getX(k+a)),bb=new T.Vector3().fromBufferAttribute(p,i.getX(k+b)),id=[key(aa),key(bb)].sort().join('|');const e=edges.get(id)||{n:0,aa,bb};e.n++;edges.set(id,e);}}
  const on=(p,x,z)=>Math.abs(Math.abs(p.x)-x)<1e-4||Math.abs(Math.abs(p.z)-z)<1e-4;
  for(const e of edges.values()){assert.ok(e.n<=2);if(e.n===1)assert.ok((on(e.aa,lower?24.6:21.15,lower?13.6:10.1)&&on(e.bb,lower?24.6:21.15,lower?13.6:10.1))||(lower&&on(e.aa,19.46,8.445)&&on(e.bb,19.46,8.445)),`Unpaired seam ${key(e.aa)} / ${key(e.bb)}`);}
 }
});
