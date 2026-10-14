import {validatePatch} from './roof-patch.js';
export function validateExperiment(c){
  const check=(value,message)=>{if(!value)throw Error(message);};
  check(c.schema==='architecture-realism/v1','Unsupported manifest schema');
  check(/^[a-z0-9-]+$/.test(c.id),'Invalid architecture id');
  check(typeof c.revision==='string'&&c.revision.length>0,'Missing revision');
  check(typeof c.route==='string'&&c.route.startsWith('/')&&!c.route.includes('..'),'Invalid route');
  check(Array.isArray(c.sources)&&c.sources.length>0,'Missing evidence sources');
  const ids=new Set(c.sources.map(s=>s.id));check(ids.size===c.sources.length,'Duplicate source id');
  for(const s of c.sources)check(s.url?.startsWith('https://')&&s.status&&s.rights&&s.limits,'Incomplete source evidence');
  validatePatch(c.patch);
  check(c.views&&Object.keys(c.views).length>1,'Need independent views');
  check(c.capture&&Number.isFinite(c.capture.cameraFov)&&c.capture.cameraFov>0&&c.capture.cameraFov<120&&Number.isFinite(c.capture.pixelRatioMax)&&c.capture.pixelRatioMax>0,'Missing capture settings');
  for(const name of ['desktop','mobile'])for(const key of ['width','height'])check(Number.isInteger(c.capture[name]?.[key])&&c.capture[name][key]>0,'Invalid capture viewport');
  for(const v of Object.values(c.views)){
    for(const key of ['position','target'])check(Array.isArray(v[key])&&v[key].length===3&&v[key].every(Number.isFinite),'Invalid camera vector');
    check(v.position.some((n,i)=>n!==v.target[i]),'Camera cannot coincide with target');
  }
  check(Array.isArray(c.modes)&&c.modes.length>=2&&new Set(c.modes).size===c.modes.length,'Invalid mode list');
  check(Array.isArray(c.checks)&&c.checks.length>0,'No replay cases');
  check(new Set(c.checks.map(s=>s.id)).size===c.checks.length,'Duplicate replay case');
  for(const s of c.checks)check(/^[a-z0-9-]+$/.test(s.id)&&c.modes.includes(s.mode)&&c.views[s.view],'Unknown replay mode/view');
  if(c.plaque){check(ids.has(c.plaque.source)&&c.plaque.status&&c.plaque.lettering&&c.plaque.supportLayer,'Plaque lacks evidence boundary');for(const k of ['width','height','depth'])check(Number.isFinite(c.plaque[k])&&c.plaque[k]>0,'Invalid plaque size');}
  return c;
}
