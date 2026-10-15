import * as T from '../../vendor/three.module.js';
import {getColumnGrid,SPEC} from '../model.js';
import {upperSurface,lowerSurface,ENVELOPE} from './roof-envelope.js';
export const EXTERIOR={revision:'present-envelope-02',supportX:11.15,supportZ:8.25,supportRadius:.12,upperPlaque:{width:1.65,height:2.10,y:14.4,z:8.13,text:'观音之阁'},source:'commons-2020 + commons-side-2014:现状可见轮廓；尺寸、非正面布置为比例推定'};
export function buildExterior(materials,p=EXTERIOR,roof=ENVELOPE){
 const root=new T.Group(),records=[],meshes=[],layers=new Map(['enclosure','columns','ties'].map(id=>{const g=new T.Group();g.userData.layer=id;root.add(g);return [id,g];})),buckets=new Map();
 const box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,14);
 function add(layer,kind,g,pos,scale,key,mat='door',q=new T.Quaternion(),extra={}){const r={id:`dule/exterior02/${key}`,layer,kind,type:kind,position:pos,scale,orientation:q.toArray(),status:'比例推定',source:p.source,parameterRevision:p.revision,...extra};records.push(r);const k=layer+':'+mat+':'+g.uuid;if(!buckets.has(k))buckets.set(k,{layer,mat,g,items:[]});buckets.get(k).items.push({r,m:new T.Matrix4().compose(new T.Vector3(...pos),q,new T.Vector3(...scale))});return r;}
 const panel=(pos,scale,key,mat='plaster',extra={})=>add('enclosure','wall',box,pos,scale,key,mat,undefined,extra);
 function frontOpening(level,i,width,x,z){const l=SPEC.levels[level],base=l.base+.05,h=l.height-.12,w=width-.52,doorH=h*.80,top=base+doorH;
 // The photos show open leaves and transom grilles, not identical opaque vertical-bar walls.
 panel([x,base+.10,z],[w,.20,.19],`${level}/${i}/sill`,'darkwood');
 for(const s of [-1,1])panel([x+s*w/2,base+h/2,z],[.12,h,.16],`${level}/${i}/jamb/${s}`,'door');
 panel([x,base+h-.1,z],[w,.18,.18],`${level}/${i}/head`,'door');panel([x,top,z],[w,.12,.16],`${level}/${i}/transom-rail`,'door');
 for(let c=0;c<12;c++)panel([x-w/2+(c+.5)*w/12,top+(h-doorH)/2,z],[.025,h-doorH,.06],`${level}/${i}/transom-v/${c}`,'door');for(let r=1;r<=2;r++)panel([x,top+(h-doorH)*r/3,z],[w,.025,.06],`${level}/${i}/transom-h/${r}`,'door');
 // Open central doorway; side leaves at both edges carry a simple orthogonal grille.
 const leafW=w*.23;
 for(const s of [-1,1]){const cx=x+s*(w/2-leafW/2);panel([cx,base+doorH*.25,z],[leafW,doorH*.5,.10],`${level}/${i}/leaf-bottom/${s}`,'door');for(let c=0;c<=5;c++)panel([cx-leafW/2+c*leafW/5,base+doorH*.73,z],[.035,doorH*.44,.08],`${level}/${i}/leaf-grille/${s}/${c}`,'door');for(let r=0;r<=5;r++)panel([cx,base+doorH*.5+r*doorH*.46/5,z],[leafW,.035,.08],`${level}/${i}/leaf-cross/${s}/${r}`,'door');}
 }
 for(const level of [0,2]){const l=SPEC.levels[level],g=getColumnGrid(level),z=g.zs[4];for(let i=0;i<5;i++){const w=g.xs[i+1]-g.xs[i],x=(g.xs[i+1]+g.xs[i])/2;if(i>=1&&i<=3)frontOpening(level,i,w,x,z+.025);else panel([x,l.base+l.height/2,z],[w-.52,l.height,.22],`${level}/${i}/south-solid`);}
 // Side-wall layout has not been surveyed; deliberately plain panels, explicitly inferred symmetry.
 for(const s of [-1,1])panel([s*g.xs[5],l.base+l.height/2,0],[.20,l.height,g.zs[4]*2],`${level}/side/${s}`,'plaster',{note:'侧墙连续面为推定；未复原壁画、逐扇侧窗'});
 // Wall band below the brackets is plain. Do not invent historic polychrome motifs.
 panel([0,l.base+l.height+.32,z],[g.xs[5]*2,.60,.15],`${level}/front-band`,'plaster',{note:'檐下围护带的表面无彩画复原；不得作为精确结构封板'});
 }
 // Recessed plain backing below the balcony, distinct from the visible bracket layer.
 const middle=getColumnGrid(1);panel([0,9.77,middle.zs[4]-.10],[middle.xs[5]*2,1.48,.08],'middle/recessed-backing','darkwood',{note:'照片中暗层檐下阴影后衬的体量假设；表面无壁画或真实封板构造复原'});
 for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*p.supportX,z=sz*p.supportZ;
 for(const tier of ['lower','upper']){const y0=tier==='lower'?.48:lowerSurface(x,z,roof)+.14,y1=tier==='lower'?lowerSurface(x,z,roof)-.32:upperSurface(x,z,roof)-.34;
 add('columns','eave-support',cyl,[x,(y0+y1)/2,z],[p.supportRadius,y1-y0,p.supportRadius],`support/${tier}/${sx}/${sz}`,'column',undefined,{tier,note:'现状上下四角擎檐柱；具体坐标、柱径、弹性连接及增加年代未测绘核定，非辽构柱网'});panel([x,y0-.025,z],[.36,.05,.36],`support-foot/${tier}/${sx}/${sz}`,'stone');
 }
 }
 // Two plaques are visible objects. Only upper lettering has been checked; use a disclosed system-font proxy.
 const pp=p.upperPlaque;
 panel([0,pp.y,pp.z],[pp.width,pp.height,.14],'plaque/upper-body','darkwood');
 for(const s of [-1,1]){panel([s*pp.width/2,pp.y,pp.z+.08],[.09,pp.height,.07],`plaque/upper-side/${s}`,'wood');panel([0,pp.y+s*pp.height/2,pp.z+.08],[pp.width,.09,.07],`plaque/upper-end/${s}`,'wood');}
 panel([0,4.70,7.32],[2.65,1.03,.14],'plaque/lower-silhouette','darkwood',{note:'下檐横匾仅轮廓，字迹未核定，不编造文字'});
 for(const b of buckets.values()){const m=new T.InstancedMesh(b.g,materials[b.mat],b.items.length);m.userData={layer:b.layer,materialKey:b.mat,records:b.items.map(x=>x.r)};b.items.forEach((x,i)=>m.setMatrixAt(i,x.m));m.castShadow=m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();layers.get(b.layer).add(m);meshes.push(m);}
 return {root,layers,records,meshes,parameters:p};
}
export function addPlaqueLettering(exterior,materials,p=EXTERIOR){
 const c=document.createElement('canvas');c.width=512;c.height=640;const ctx=c.getContext('2d');ctx.fillStyle='#9fae9e';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#40534b';ctx.font='bold 186px "Songti SC",serif';ctx.textAlign='center';ctx.textBaseline='middle';for(const [text,x,y] of [['观',370,172],['音',370,466],['之',138,172],['阁',138,466]])ctx.fillText(text,x,y);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map:texture,roughness:.94});const pp=p.upperPlaque,m=new T.Mesh(new T.PlaneGeometry(pp.width-.16,pp.height-.16),mat);m.position.set(0,pp.y,pp.z+.081);m.userData={layer:'enclosure',records:[{id:'dule/exterior02/plaque/upper-lettering',status:'占位表达',source:p.source,note:'2×2布局据照片；系统宋体字形占位，非原书法'}]};exterior.layers.get('enclosure').add(m);exterior.meshes.push(m);return mat;
}
export function replaceVisibleEnclosure(model,exterior){
 const removed=[],matrix=new T.Matrix4();for(const mesh of [...model.meshes].filter(m=>m.userData.layer==='enclosure')){
 const keep=mesh.userData.records.map((r,i)=>({r,i})).filter(({r})=>{const drop=r.type==='enclosure'&&r.position[1]>0&&r.position[1]<14&&r.scale[1]>=.4&&r.position[2]>=0; if(drop)removed.push(r.id);return !drop;});if(keep.length===mesh.count)continue;
 const next=new T.InstancedMesh(mesh.geometry,mesh.material,keep.length);keep.forEach(({i},n)=>{mesh.getMatrixAt(i,matrix);next.setMatrixAt(n,matrix);});next.userData={...mesh.userData,records:keep.map(({r})=>r)};next.castShadow=next.receiveShadow=true;next.computeBoundingBox();next.computeBoundingSphere();mesh.parent.add(next);mesh.parent.remove(mesh);model.meshes[model.meshes.indexOf(mesh)]=next;mesh.dispose();
 }
 // Preserve the original northern facade until a matching reference is obtained.
 for(const [id,g] of exterior.layers)model.layers.get(id).add(g);model.meshes.push(...exterior.meshes);return removed;
}
