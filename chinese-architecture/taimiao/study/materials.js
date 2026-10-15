import * as THREE from '../../vendor/three.module.js';
// Frozen baseline material functions from taimiao/app.js, 2026-10-14.
function woodTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#cbb184';ctx.fillRect(0,0,256,512);let seed=23;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<500;i++){const x=random()*256;ctx.strokeStyle=`rgba(68,38,16,${.018+random()*.055})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=512;y+=16)ctx.lineTo(x+Math.sin(y/55+x)*2.2,y);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
function ornamentTexture(kind){
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
 x.fillStyle=kind==='paint'?'#22535b':'#b39651';x.fillRect(0,0,512,256);x.strokeStyle='#d4b566';x.lineWidth=5;
 if(kind==='paint'||kind==='gildedPaint'){
  x.strokeRect(9,20,494,216);x.fillStyle=kind==='paint'?'#243f69':'#b59750';x.beginPath();x.moveTo(160,70);x.lineTo(350,70);x.lineTo(380,128);x.lineTo(350,186);x.lineTo(160,186);x.lineTo(130,128);x.closePath();x.fill();x.stroke();
  for(const a of [66,445]){x.beginPath();x.moveTo(a-35,128);x.bezierCurveTo(a-20,60,a+32,80,a+30,128);x.bezierCurveTo(a+25,180,a-25,180,a-35,128);x.stroke();x.beginPath();x.moveTo(a-20,128);x.lineTo(a+20,128);x.stroke();}

 }else{
  x.strokeStyle='#775822';x.strokeRect(10,10,492,236);x.strokeRect(25,24,462,208);x.translate(256,128);for(let i=0;i<12;i++){x.rotate(Math.PI/6);x.beginPath();x.ellipse(0,-57,18,48,0,0,Math.PI*2);x.stroke();}x.beginPath();x.arc(0,0,19,0,Math.PI*2);x.stroke();
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function plaqueTexture(){const c=document.createElement('canvas');c.width=128;c.height=384;const x=c.getContext('2d');x.fillStyle='#173b59';x.fillRect(0,0,128,384);x.fillStyle='#dfc677';x.font='76px Songti SC, serif';x.textAlign='center';['太','庙'].forEach((t,i)=>x.fillText(t,64,94+i*114));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function stoneTexture(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#f1eee5';x.fillRect(0,0,256,256);let seed=81;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<2600;i++){x.fillStyle=`rgba(80,76,62,${r()*.16})`;const a=r()*256,b=r()*256;x.fillRect(a,b,.4+r()*1.1,.4+r()*1.1);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
export function createBaselineMaterials(){
 const baseMaterials={};
 const wood=woodTexture(),stone=stoneTexture();const palette={wood:0xbb965e,darkwood:0x8c6c39,column:0x953b2a,endgrain:0xc3a76b,rafter:0xc8ac74,stone:0xa6a395,lightstone:0xc2bdaf,ceiling:0xc0a363,ceilingPanel:0xb69b68,roofBoard:0x8c563c,tile:0xc7a445,ridge:0xb59b43,plaster:0xa44835,door:0x973f32,metal:0x625944,blue:0x365b75,green:0x41786d,gold:0xc7a45e,paint:0xffffff,lotus:0xffffff,gildedPaint:0xffffff,plaque:0xffffff};
 for(const [key,color] of Object.entries(palette)){
   const timber=['wood','darkwood','endgrain','rafter'].includes(key);
   baseMaterials[key]=new THREE.MeshStandardMaterial({color,roughness:key==='metal'?.55:.92,metalness:key==='metal'?.45:0,map:['stone','lightstone'].includes(key)?stone:key==='plaque'?plaqueTexture():['paint','lotus','gildedPaint'].includes(key)?ornamentTexture(key):timber?wood:null,side:['tile','roofBoard','lotus'].includes(key)?THREE.DoubleSide:THREE.FrontSide});
 }
 return baseMaterials;
}
