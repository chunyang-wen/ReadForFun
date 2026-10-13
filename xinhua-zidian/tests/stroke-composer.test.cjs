const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/stroke-compositions.json')));
const context={window:{},AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>manifest})};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js/stroke-composer.js'),'utf8'),context);
const composer=context.window.StrokeComposer;
const original={strokes:['M 0 0 L 100 0 L 100 100 L 0 100 Z'],medians:[[[0,0],[100,100]]]};
const snapshot=JSON.stringify(original);
(async()=>{
  let calls=0;
  const result=await composer.composeTree(['⿰','甲',['⿱','甲','乙']],async()=>{calls++;return original;});
  assert.equal(calls,2,'Repeated components load once');
  assert.equal(result.strokes.length,3);
  assert.equal(result.source,'component-simulation');
  assert.equal(JSON.stringify(original),snapshot,'Composition must not alter cached source data');
  const points=result.medians.flat();
  assert(points.every(p=>p[0]>=72&&p[0]<=952&&p[1]>=40&&p[1]<=860));
  assert(result.medians[0][0][0]<result.medians[1][0][0],'Left component first');
  assert(result.medians[1][0][1]>result.medians[2][0][1],'Top component above bottom');
  await assert.rejects(()=>composer.composeTree(['⿻','甲','乙'],async()=>original));
  await assert.rejects(()=>composer.compose('毮',async()=>original,{strokes:11}));
  await assert.rejects(()=>composer.composeTree(['⿰','甲','乙'],async()=>({strokes:['M 0 0 A 10 10 0 0 0 20 20'],medians:original.medians})));
  // Optional integration checks against downloaded real component trajectories.
  if(process.argv[2]){
    const dir=process.argv[2];
    const indexScript=fs.readFileSync(path.join(root,'data/dict-index.js'),'utf8');
    vm.runInContext(indexScript,context);
    const index=context.window.DICT_INDEX;
    const loader=async c=>JSON.parse(fs.readFileSync(c==='龠'?path.join(root,'data/strokes/龠.json'):path.join(dir,c+'.json')));
    for(const c of ['毮','籥','蔱']){
      const data=await composer.compose(c,loader,{strokes:index[c].s});
      assert.equal(data.strokes.length,index[c].s);
      assert(data.medians.every(line=>line.every(p=>p.every(Number.isFinite))));
      console.log(`${c}: ${data.strokes.length} simulated strokes from ${data.components.join(' + ')}`);
    }
  }
  console.log('Unified composition geometry, ordering, deduplication and rejection checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
