import * as T from '../../vendor/three.module.js';

// Silhouette study only. Font and scroll moulding are explicitly provisional.
export function buildPlaque(materials,config,letteringTexture=null){
  const root=new T.Group(),records=[];root.name='plaque-study';root.position.fromArray(config.position);
  function add(id,geometry,material,z=0){
    const m=new T.Mesh(geometry,material);m.position.z=z;m.castShadow=m.receiveShadow=true;
    const record={id:`study/plaque/${id}`,status:config.status,source:config.source,supportLayer:config.supportLayer,note:config.lettering};
    m.userData.record=record;records.push(record);root.add(m);return m;
  }
  const w=config.width/2,h=config.height/2;
  const s=new T.Shape();s.moveTo(-w,h);s.quadraticCurveTo(-w*.4,h*1.15,0,h*1.06);s.quadraticCurveTo(w*.4,h*1.15,w,h);s.lineTo(w,h*.65);s.quadraticCurveTo(w*1.32,h*.2,w,h*.08);s.lineTo(w,-h*.6);s.quadraticCurveTo(w*1.1,-h*.87,w*.7,-h);s.quadraticCurveTo(0,-h*.9,-w*.7,-h);s.quadraticCurveTo(-w*1.1,-h*.87,-w,-h*.6);s.lineTo(-w,h*.08);s.quadraticCurveTo(-w*1.32,h*.2,-w,h*.65);s.closePath();
  add('outer-frame',new T.ExtrudeGeometry(s,{depth:config.depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3}),materials.door);
  const trim=new T.MeshStandardMaterial({color:0xb9954e,roughness:.56,metalness:.35});
  const board=new T.MeshStandardMaterial({color:0x19336f,roughness:.72});
  add('gold-border',new T.BoxGeometry(config.width*.86,config.height*.88,.06),trim,config.depth+.015);
  add('blue-field',new T.BoxGeometry(config.width*.77,config.height*.81,.06),board,config.depth+.05);
  if(letteringTexture){
    const face=new T.MeshStandardMaterial({map:letteringTexture,transparent:true,roughness:.62,depthWrite:false});
    add('lettering',new T.PlaneGeometry(config.width*.68,config.height*.74),face,config.depth+.087);
  }
  return {root,records};
}

export function plaqueLettering(text){
  const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#dbc47e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='112px "Songti SC", serif';
  Array.from(text).forEach((ch,i)=>ctx.fillText(ch,128,(i+.5)*512/Array.from(text).length));
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
