import {validateExperiment} from '../realism-workflow/manifest.js';
import {validatePatch} from '../realism-workflow/roof-patch.js';
export function validateFoguang(c){
 validateExperiment(c);const check=(v,message)=>{if(!v)throw Error(message);};
 const e=c.enclosure,b=c.frontBracket,r=c.roofEnvelope;
 check(e&&b&&r&&c.materials&&c.lighting,'Missing Foguang study parameter family');
 for(const family of [e,b,r])check(Object.values(family).every(Number.isFinite),'Nonfinite model parameter');
 check(e.base>0&&e.base<e.doorTop&&e.doorTop<e.lintelTop&&e.lintelTop<e.headTop&&e.headTop<e.infillTop&&e.infillTop<8,'Invalid enclosure elevation order');
 check(e.wallThickness>0&&e.wallThickness<1&&e.plasterInset>0&&e.frontZ>0&&e.backZ<0&&e.sideX>0&&e.doorOpenDegrees>=0&&e.doorOpenDegrees<=110,'Invalid wall or hinge parameter');
 check(b.firstOut>0&&b.secondOut>b.firstOut&&b.width>0&&b.woodWidth>0&&b.armHeight>0,'Invalid front bracket dimensions');
 validatePatch({...r,halfWidth:2.4});
 check(r.pitch>=.12&&r.step>=.1&&r.start>=0&&r.end<=11.9&&r.edgeMargin>=r.radius,'Unsafe roof sampling or hip margin');
 for(const l of ['baseline','d'])check(c.lighting[l]&&Object.values(c.lighting[l]).every(v=>Number.isFinite(v)&&v>=0),'Invalid light settings');
 for(const [key,m]of Object.entries(c.materials))check(/^#[a-f0-9]{6}$/i.test(m.color)&&m.roughness>=0&&m.roughness<=1&&m.metalness>=0&&m.metalness<=1,'Invalid material '+key);
 return c;
}
