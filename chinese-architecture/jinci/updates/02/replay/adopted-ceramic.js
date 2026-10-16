import * as T from '/chinese-architecture/vendor/three.module.js';
// Jinci-only visual surface, not a measured tile inventory. Metres, Y up.
// Rows follow this hall's own roof function. No borrowed palace roof parameters.
export function ceramicField({start,end,halfWidth,height,axis,sign,pitch=.36,course=.48,lift=.18}){
 const fields={body:[],border:[]};
 const point=(cross,run,phase)=>axis==='z'?[cross,height(run)+lift+.075*Math.max(0,Math.cos(cross/pitch*Math.PI*2)),sign*run]:[sign*run,height(run)+lift+.075*Math.max(0,Math.cos(cross/pitch*Math.PI*2)),cross];
 const triangle=(dest,a,b,c)=>{a=a.map(Math.fround);b=b.map(Math.fround);c=c.map(Math.fround);const ab=new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a)),ac=new T.Vector3().fromArray(c).sub(new T.Vector3().fromArray(a)),n=ab.cross(ac);if(n.lengthSq()<1e-14||Math.abs(n.y)<1e-12)return;if(n.y<0)[b,c]=[c,b];dest.push(...a,...b,...c);};
 const max=halfWidth(end),rows=Math.ceil((end-start)/course);
 for(let row=0;row<rows;row++){
  // Keep the profile's own breaks, so a tile never bridges across a kink.
  const a=start+(end-start)*row/rows,b=start+(end-start)*(row+1)/rows;
  const breaks=[a,b,...[0,1.5,3.1,3.5,4.8,6.6,8.8].filter(d=>d>a&&d<b)].sort((x,y)=>x-y);
  for(let lane=Math.floor(-max/pitch);lane<=Math.ceil(max/pitch);lane++)for(let step=0;step<8;step++){
   const ca=(lane+step/8)*pitch,cb=(lane+(step+1)/8)*pitch;
   for(let k=0;k<breaks.length-1;k++){
    const ra=breaks[k]+(k===0?.006:0),rb=breaks[k+1],wa=halfWidth(ra),wb=halfWidth(rb);
    if(ca>=Math.max(wa,wb)||cb<=-Math.max(wa,wb))continue;
    const clamp=(x,w)=>Math.max(-w,Math.min(w,x));
    const p=[point(clamp(ca,wa),ra,step/8),point(clamp(cb,wa),ra,(step+1)/8),point(clamp(ca,wb),rb,step/8),point(clamp(cb,wb),rb,(step+1)/8)];
    const dest=fields[row===rows-1?'border':'body'];triangle(dest,p[0],p[1],p[2]);triangle(dest,p[1],p[3],p[2]);
   }
  }
 }
 return Object.fromEntries(Object.entries(fields).map(([key,values])=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));g.computeVertexNormals();return [key,g];}));
}
