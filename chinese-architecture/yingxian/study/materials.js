import * as THREE from '../../vendor/three.module.js';
// Baseline copied from this volume, never the palace palette.
function woodTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#cbb184';ctx.fillRect(0,0,256,512);let seed=23;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<500;i++){const x=random()*256;ctx.strokeStyle=`rgba(68,38,16,${.018+random()*.055})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=512;y+=16)ctx.lineTo(x+Math.sin(y/55+x)*2.2,y);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export function createMaterials(refined=false){
 const baseMaterials={};
 const wood=woodTexture();const palette={wood:0xc39b66,darkwood:0x997340,column:0xab794a,endgrain:0xc7a374,rafter:0xc8ac74,stone:0xa4a58f,lightstone:0xb4b49e,seam:0x878c7e,ceiling:0x837d51,ceilingPanel:0x9b926b,roofBoard:0x737b70,tile:0x777f72,ridge:0x5c675e,plaster:0xd0bfa0,door:0x925a3d,metal:0x4f4e3f};
 for(const [key,color] of Object.entries(palette)){
   const timber=['wood','darkwood','column','endgrain','rafter','ceiling','door'].includes(key);
   baseMaterials[key]=new THREE.MeshStandardMaterial({color,roughness:key==='metal'?.55:.92,metalness:key==='metal'?.45:0,map:timber?wood:null,side:['tile','roofBoard'].includes(key)?THREE.DoubleSide:THREE.FrontSide});
 }
 if(refined){
  const colors={wood:0x8c7860,darkwood:0x645746,column:0x8f6750,endgrain:0xa18e72,rafter:0x947e63,tile:0x626760,ridge:0x565c56,roofBoard:0x555c54,door:0x76574a,ceiling:0x775448,plaster:0xb6a88c};
  for(const [key,color] of Object.entries(colors)){baseMaterials[key].color.setHex(color);baseMaterials[key].roughness=key==='tile'?.88:.94;}
 }
 return baseMaterials;
}
