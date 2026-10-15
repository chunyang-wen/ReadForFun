import * as THREE from '../vendor/three.module.js';
function woodTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#cbb184';ctx.fillRect(0,0,256,512);let seed=23;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<500;i++){const x=random()*256;ctx.strokeStyle=`rgba(68,38,16,${.018+random()*.055})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=512;y+=16)ctx.lineTo(x+Math.sin(y/55+x)*2.2,y);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export function createBaselineMaterials(){
 const baseMaterials={};
 const wood=woodTexture();const palette={wood:0xc39b66,darkwood:0x997340,column:0xab794a,endgrain:0xc7a374,rafter:0xc8ac74,stone:0xa4a58f,lightstone:0xb4b49e,seam:0x878c7e,ceiling:0x837d51,ceilingPanel:0x9b926b,roofBoard:0x737b70,tile:0x777f72,ridge:0x5c675e,plaster:0xd0bfa0,door:0x925a3d,metal:0x4f4e3f};
 for(const [key,color] of Object.entries(palette)){
   const timber=['wood','darkwood','column','endgrain','rafter','ceiling','door'].includes(key);
   baseMaterials[key]=new THREE.MeshStandardMaterial({color,roughness:key==='metal'?.55:.92,metalness:key==='metal'?.45:0,map:timber?wood:null,side:['tile','roofBoard'].includes(key)?THREE.DoubleSide:THREE.FrontSide});
 }
 return baseMaterials;
}

export function createStudyMaterials(settings){
 const m=createBaselineMaterials();
 // Neutral, unglazed ceramic and weathered timber: visual hypotheses, not reflectance measurements.
 for(const [key,value] of Object.entries(settings)){m[key].color.set(value.color);m[key].roughness=value.roughness;m[key].metalness=value.metalness;}
 return m;
}
