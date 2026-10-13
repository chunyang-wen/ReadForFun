/* Simulate missing glyphs by combining real component trajectories. No dependency. */
(function () {
  'use strict';
  let manifestPromise;
  function getManifest() {
    if (!manifestPromise) {
      manifestPromise = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch('data/stroke-compositions.json?v=20261014', {signal: controller.signal});
          if (!response.ok) throw new Error('拆字数据未加载');
          return await response.json();
        } finally { clearTimeout(timeout); }
      })().catch(error => { manifestPromise = null; throw error; });
    }
    return manifestPromise;
  }

  // Hanzi Writer paths use absolute M/L/Q/C commands. Reject other commands
  // rather than silently corrupt arcs, relative coordinates or malformed data.
  function pathTokens(path) {
    const tokens = path.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
    const widths = {M:2,L:2,Q:4,C:6,Z:0};
    let command, count = 0;
    for (const token of tokens) {
      if (/^[A-Za-z]$/.test(token)) {
        if (command && count % widths[command]) throw new Error('Invalid SVG path');
        if (!(token in widths)) throw new Error('Unsupported SVG path');
        command = token; count = 0;
      } else {
        if (!command || !widths[command] || !Number.isFinite(Number(token))) throw new Error('Invalid SVG coordinate');
        count++;
      }
    }
    if (!command || count % widths[command]) throw new Error('Invalid SVG path');
    return tokens;
  }
  function bounds(data) {
    const xs = [], ys = [];
    for (const path of data.strokes) {
      let axis = 0;
      for (const token of pathTokens(path)) {
        if (/^[A-Za-z]$/.test(token)) { axis = 0; continue; }
        (axis++ % 2 ? ys : xs).push(Number(token));
      }
    }
    return {x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs), h:Math.max(...ys)-Math.min(...ys)};
  }
  function fit(data, box) {
    const b = bounds(data);
    if (b.w <= 0 || b.h <= 0) throw new Error('Invalid component bounds');
    const point = p => [box.x+(p[0]-b.x)*box.w/b.w, box.y+(p[1]-b.y)*box.h/b.h];
    return {
      strokes:data.strokes.map(path => {
        let axis=0;
        return pathTokens(path).map(token => {
          if (/^[A-Za-z]$/.test(token)) {axis=0; return token;}
          const xAxis=axis++%2===0;
          return Number(((Number(token)-(xAxis?b.x:b.y))*(xAxis?box.w/b.w:box.h/b.h)+(xAxis?box.x:box.y)).toFixed(2));
        }).join(' ');
      }),
      medians:data.medians.map(line => line.map(point)),
      strokeNames:data.strokeNames || data.strokes.map(() => ''),
      components:data.components || []
    };
  }
  function combine(operator, children) {
    const horizontal=operator==='⿰'||operator==='⿲';
    const size=horizontal?880:820, gap=24;
    // Use stroke count only to choose approximate component proportions.
    // It does not determine individual stroke geometry or writing order.
    let weights=children.map(c => c.strokes.length);
    if (children.length===2) {
      const fraction=Math.max(0.25,Math.min(0.75,weights[0]/(weights[0]+weights[1])));
      weights=[fraction,1-fraction];
    }
    const sum=weights.reduce((a,b)=>a+b,0);
    let offset=0;
    const result={strokes:[],medians:[],strokeNames:[],components:[]};
    children.forEach((child,i) => {
      const extent=(size-gap*(children.length-1))*weights[i]/sum;
      // Hanzi coordinates point upward: top components are placed at larger y.
      const box=horizontal?{x:72+offset,y:40,w:extent,h:820}:{x:72,y:860-offset-extent,w:880,h:extent};
      const transformed=fit(child,box);
      for (const key of Object.keys(result)) result[key].push(...transformed[key]);
      offset+=extent+gap;
    });
    return result;
  }
  async function composeTree(tree, loader, entries={}) {
    const loaded=new Map();
    async function build(node,depth=0) {
      if (depth>10) throw new Error('拆字层级过深');
      if (typeof node==='string') {
        if (!loaded.has(node)) loaded.set(node,Promise.resolve().then(()=>loader(node)));
        const data=await loaded.get(node);
        if (!data?.strokes?.length || data.medians?.length!==data.strokes.length) throw new Error('部件轨迹不完整');
        const code=entries[node]?.stroke_code || '';
        const categories={1:'横 / 提',2:'竖 / 竖钩',3:'撇',4:'点 / 捺',5:'折笔'};
        const names=data.strokeNames || (code.length===data.strokes.length&&/^[1-5]+$/.test(code)?[...code].map(c=>categories[c]):undefined);
        return {...data,strokeNames:names,components:[node]};
      }
      const arity={'⿰':2,'⿱':2,'⿲':3,'⿳':3};
      if (!Array.isArray(node)||node.length!==arity[node[0]]+1) throw new Error('不支持该字形结构');
      return combine(node[0],await Promise.all(node.slice(1).map(c=>build(c,depth+1))));
    }
    const result=await build(tree);
    return {...result,source:'component-simulation'};
  }
  async function compose(char, loader, entry, entries) {
    const manifest=await getManifest();
    const tree=manifest[char];
    if (!tree) throw new Error('暂无可组合的部件数据');
    const result=await composeTree(tree,loader,entries);
    if (!entry.strokes||result.strokes.length!==entry.strokes) throw new Error('组合笔数与字典不一致');
    return result;
  }
  window.StrokeComposer={compose,composeTree};
})();
