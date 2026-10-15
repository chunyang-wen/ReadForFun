import * as T from '../../vendor/three.module.js';
import {boundedSearch,assessFit} from '../../realism-workflow/evidence-fit.js';
import {writeFileSync} from 'node:fs';
// Manual image observations; original photograph stays outside distributed assets.
const width=1080,height=651;
const source='https://q6.itc.cn/q_70/images03/20241123/5dbebc229ce1463081131cc2307126d6.jpeg';
const lower=[{id:'lower-left',world:[-36.5,14.2,18],pixel:[86,301]},{id:'lower-right',world:[36.5,14.2,18],pixel:[1003,301]},{id:'porch-left-foot',world:[-32,3.76,14],pixel:[145,408]},{id:'porch-right-foot',world:[32,3.76,14],pixel:[944,408]}];
const upper=[{id:'ridge-left',xz:[-18.5,0],pixel:[340,151]},{id:'ridge-right',xz:[18.5,0],pixel:[737,151]},{id:'upper-left',xz:[-33,14.5],pixel:[130,222]},{id:'upper-right',xz:[33,14.5],pixel:[957,222]},
// Intermediate hip silhouette observations are independent of the lower camera fit.
{id:'hip-left-1',xz:[-22.5,4],pixel:[309,177]},{id:'hip-left-2',xz:[-26.5,8],pixel:[263,198]},{id:'hip-left-3',xz:[-30.5,12],pixel:[190,215]}];
export function project(point,p){const camera=new T.PerspectiveCamera(p.fov,width/height,.1,600);camera.position.set(0,1.8,p.distance);camera.lookAt(0,p.targetY,0);camera.updateMatrixWorld(true);const q=new T.Vector3(...point).project(camera);return [(q.x+1)*width/2+4.5,(1-q.y)*height/2];}
const optimize=boundedSearch;
const err=(a,b)=>a.reduce((s,n,i)=>s+(n-b[i])**2,0);
const fit=optimize(a=>lower.reduce((s,c)=>s+err(project(c.world,{distance:a[0],targetY:a[1],fov:a[2]}),c.pixel),0),[100,14,50],[[65,180],[0,25],[20,80]],[4,1,2]);
const camera={distance:fit.p[0],targetY:fit.p[1],fov:fit.p[2],height:1.8};
export function roofHeight(s,{eave,power}){const t=Math.min(1,Math.max(0,s/14.5));return eave+(29.3-eave)*(1-t)**power+.55*t**10;}
function candidatePoint(c,shape){const[x,z]=c.xz,s=Math.max(Math.abs(z),Math.abs(x)-18.5,0);return[x,roofHeight(s,shape)+(shape.corner||0)*(Math.abs(x)/(18.5+s))**8*(s/14.5)**6,z];}
const shapeFit=optimize(a=>upper.reduce((s,c)=>s+err(project(candidatePoint(c,{eave:a[0],power:a[1],corner:a[2]}),camera),c.pixel),0),[20,1.8,1],[[18,23],[1.1,2.8],[0,2]],[.3,.1,.1]);
const shape={eave:shapeFit.p[0],power:shapeFit.p[1],corner:shapeFit.p[2]};
const observations=upper.map(c=>({...c,baseline:project(candidatePoint(c,{eave:17.5,power:1.13,corner:0}),camera),candidate:project(candidatePoint(c,shape),camera)}));
const rms=key=>Math.sqrt(observations.reduce((s,c)=>s+err(c[key],c.pixel),0)/observations.length);
const report={schema:'architecture-image-fit/v1',source,image:{width,height},status:'图像判读＋比例推定，非摄影测量',limits:['手工像点约±4px；图像有透视与未知裁切','相机眼高1.8m、柱网与下檐尺寸来自推定模型；存在尺度与机位耦合','下檐角上翘1.2m为初始假设','仅在本张照片上拟合；第二张照片尚未独立标定','RMSE只比较这组轮廓点，不能表示整殿还原度'],camera,shape,cameraControls:lower,observations,acceptance:assessFit({rmsPixels:Math.sqrt(fit.score/lower.length),markingUncertainty:4,boundary:shapeFit.boundary,independentViewValidated:false}),metrics:{cameraRms:Math.sqrt(fit.score/lower.length),baselineRoofRms:rms('baseline'),candidateRoofRms:rms('candidate')}};
writeFileSync(new URL('./calibration.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({camera,shape,metrics:report.metrics},null,2));
