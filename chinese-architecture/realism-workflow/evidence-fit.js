// No building dimensions or architectural rules: transferable numerical experiment helpers.
export function boundedSearch(objective,initial,bounds,steps,{phases=10,iterations=150}={}){
 if(initial.length!==bounds.length||initial.length!==steps.length||initial.some((v,i)=>!Number.isFinite(v)||v<bounds[i][0]||v>bounds[i][1]))throw Error('Invalid search domain');
 let p=[...initial],score=objective(p);if(!Number.isFinite(score))throw Error('Non-finite initial objective');
 for(let phase=0;phase<phases;phase++){let changed=true;for(let iteration=0;changed&&iteration<iterations;iteration++){changed=false;for(let i=0;i<p.length;i++)for(const sign of [-1,1]){const trial=[...p];trial[i]=Math.max(bounds[i][0],Math.min(bounds[i][1],p[i]+steps[i]*sign));const next=objective(trial);if(Number.isFinite(next)&&next<score-1e-10){p=trial;score=next;changed=true;}}}steps=steps.map(s=>s*.5);}
 const boundary=p.map((v,i)=>Math.min(Math.abs(v-bounds[i][0]),Math.abs(v-bounds[i][1]))<1e-5);
 return{p,score,boundary};
}
export function assessFit({rmsPixels,markingUncertainty,boundary=[],independentViewValidated=false}){
 const reasons=[];if(!Number.isFinite(rmsPixels)||!Number.isFinite(markingUncertainty)||markingUncertainty<=0)reasons.push('Invalid residual/uncertainty');
 else if(rmsPixels>markingUncertainty)reasons.push('Residual exceeds stated marking uncertainty');
 if(boundary.some(Boolean))reasons.push('Optimum reaches a search boundary');
 if(!independentViewValidated)reasons.push('No independent view validation');
 return{accepted:reasons.length===0,reasons};
}
