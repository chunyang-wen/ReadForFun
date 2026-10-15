import {buildModel} from './model.js';
import {buildEnclosure,ENCLOSURE} from './study/enclosure.js';
import {buildRoofEnvelope,ROOF,isLegacyTile} from './study/roof-envelope.js';
import {splitInstances,activeMeshes} from './study/adapt-model.js';

export const PRODUCTION_REVISION='foguang-production-03';
export const PRODUCTION_PARAMETERS={enclosure:ENCLOSURE,roofEnvelope:ROOF};

// Adopt only the independently supported facade and the existing four-slope adapter.
// The repeated representative front bracket remains an experiment, not a surveyed set.
export function buildProductionModel(materials,options={}){
 const model=buildModel(materials,options);
 if(options.detailOnly)return model;
 for(const predicate of [r=>r.layer==='enclosure',isLegacyTile]){
  const split=splitInstances(model,predicate);split.set(true);
  for(const [original] of split.pairs){original.removeFromParent();original.dispose();}
 }
 const enclosure=buildEnclosure(materials),roof=buildRoofEnvelope(materials.tile||materials.wood);
 model.layers.get('enclosure').add(enclosure.root);model.layers.get('roof').add(roof.root);
 model.root.updateMatrixWorld(true);
 model.meshes=activeMeshes(model.root);
 for(const mesh of model.meshes)for(const r of mesh.userData.records){
  // Keep the viewer's documented type contract as well as the adapter's detailed kind.
  r.type??=r.layer==='roof'?'roof':'enclosure';
 }
 model.records=model.meshes.flatMap(m=>m.userData.records);
 model.enclosure=enclosure;
 return model;
}
