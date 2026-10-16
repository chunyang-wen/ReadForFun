import * as T from '../vendor/three.module.js';
// Fengxian-only rendering approximation. NOT a measured tile catalogue.
// Cross/run coordinates are supplied per slope, never borrowed from another hall.
export const TILE={pitch:.30,capRadius:.065,lapStep:.40,lapRise:.012};
export function glazedSkin({width,point,runLength,rows=48}){
 const pos=[],indices=[],pitch=TILE.pitch,step=pitch/6,extent=width(1);
 const clip=(poly,sign)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=width(a[1])-sign*a[0],fb=width(b[1])-sign*b[0];if(fa>=-1e-9)out.push(a);if((fa<0)!==(fb<0)){const t=fa/(fa-fb);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;};
 const lift=(cross,t)=>{const v=((cross/pitch%1)+1)%1,d=Math.min(v,1-v)*pitch;const cap=d<TILE.capRadius?Math.sqrt(Math.max(0,TILE.capRadius**2-d*d)):0;const lap=((t*runLength/TILE.lapStep)%1)*TILE.lapRise;return .185+cap+lap;};
 for(let row=0;row<rows;row++)for(let col=Math.floor(-extent/step);col<Math.ceil(extent/step);col++){
  const a=row/rows,b=(row+1)/rows;let poly=[[col*step,a],[(col+1)*step,a],[(col+1)*step,b],[col*step,b]];
  poly=clip(clip(poly,1),-1);if(poly.length<3)continue;
  const vs=poly.map(([c,t])=>new T.Vector3(...point(c,t,lift(c,t)).map(Math.fround)));
  for(let k=1;k<vs.length-1;k++){const tri=[vs[0],vs[k],vs[k+1]],n=tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0]));if(n.lengthSq()<1e-14)continue;if(n.y<0)[tri[1],tri[2]]=[tri[2],tri[1]];for(const v of tri){indices.push(pos.length/3);pos.push(...v.toArray());}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
