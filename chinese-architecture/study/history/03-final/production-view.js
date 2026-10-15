import * as T from './vendor/three.module.js';
import {effectivelyVisible} from './study/adapt-model.js';
// Visual hypotheses from this hall's study, never measured reflectance or historical pigment.
export const PRODUCTION_MATERIALS={
 tile:{color:'#686764',roughness:.98,metalness:0},ridge:{color:'#686764',roughness:.98,metalness:0},roofBoard:{color:'#686764',roughness:.98,metalness:0},
 wood:{color:'#82674f',roughness:.92,metalness:0},darkwood:{color:'#66513f',roughness:.92,metalness:0},endgrain:{color:'#82674f',roughness:.92,metalness:0},rafter:{color:'#82674f',roughness:.92,metalness:0},column:{color:'#916448',roughness:.92,metalness:0},door:{color:'#97573a',roughness:.92,metalness:0},plaster:{color:'#c6b99d',roughness:.92,metalness:0},wallRed:{color:'#9a4b35',roughness:.96,metalness:0},backing:{color:'#89745c',roughness:.96,metalness:0}
};
function bounds(model,split,config,detail){
 model.root.updateMatrixWorld(true);const box=new T.Box3(),matrix=new T.Matrix4();
 for(const mesh of model.meshes){if(!effectivelyVisible(mesh)||!mesh.count)continue;
  if(!mesh.boundingBox)mesh.computeBoundingBox();matrix.copy(mesh.matrixWorld);
  if(split!==undefined){
   if(detail){const tier=mesh.userData.tier||0;matrix.elements[13]+=tier*split*.5-mesh.position.y;matrix.elements[14]+=(tier>2?split*(tier-2)*.07:0)-mesh.position.z;}
   else{const layer=model.layers.get(mesh.userData.layer);matrix.elements[13]+=config.get(mesh.userData.layer).offset*split-layer.position.y;}
  }
  box.union(mesh.boundingBox.clone().applyMatrix4(matrix));
 }
 return box;
}
export function boxCorners(box){return [box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new T.Vector3(x,y,z))));}
export function fitCamera(model,camera,direction,split,config,detail=false){
 const box=bounds(model,split,config,detail),target=box.getCenter(new T.Vector3()),points=boxCorners(box),probe=camera.clone(),unit=direction.clone().normalize();
 let hi=220;
 // A world-box centre is not its perspective screen centre. Recenter in camera space,
 // then solve distance again so oblique views retain both margin and useful scale.
 for(let pass=0;pass<8;pass++){
  let lo=.1;hi=220;
  for(let i=0;i<40;i++){const d=(lo+hi)/2;probe.position.copy(target).addScaledVector(unit,d);probe.lookAt(target);probe.updateMatrixWorld(true);
   const fits=points.every(p=>{const q=p.clone().project(probe);return q.z>-1&&q.z<1&&Math.abs(q.x)<=.86&&Math.abs(q.y)<=.86;});if(fits)hi=d;else lo=d;
  }
  if(pass===7)break;
  probe.position.copy(target).addScaledVector(unit,hi);probe.lookAt(target);probe.updateMatrixWorld(true);
  const projected=points.map(p=>p.clone().project(probe));
  const mid=axis=>(Math.max(...projected.map(p=>p[axis]))+Math.min(...projected.map(p=>p[axis])))/2;
  const scale=hi*Math.tan(T.MathUtils.degToRad(camera.fov/2));
  target.addScaledVector(new T.Vector3().setFromMatrixColumn(probe.matrixWorld,0),mid('x')*scale*camera.aspect);
  target.addScaledVector(new T.Vector3().setFromMatrixColumn(probe.matrixWorld,1),mid('y')*scale);
 }
 return{target,position:target.clone().addScaledVector(unit,hi)};
}
export function projectedBounds(model,camera){
 camera.updateMatrixWorld(true);const points=boxCorners(bounds(model)).map(p=>p.project(camera));
 return{min:[0,1].map(i=>Math.min(...points.map(p=>i?p.y:p.x))),max:[0,1].map(i=>Math.max(...points.map(p=>i?p.y:p.x)))};
}
