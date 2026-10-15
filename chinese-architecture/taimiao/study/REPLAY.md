# 太庙实验重放

从仓库根目录执行（新的验证目录默认带时间戳，不覆盖历史）：

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/taimiao/study/experiment.json
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8765/chinese-architecture/taimiao/study/?mode=d`。

在 CUA 已选择浏览器并按文档取得 tab 后，使用通用 README 的直接viewport重放方式；必须核对实际innerWidth/innerHeight。若override未生效，本轮用以下固定同源iframe方式。不得把尺寸不匹配记录成成功：

```js
const fs = await import('node:fs/promises');
const repo='/Users/chunyangwen/Documents/Ideas/Video2Book/ReadForFun';
const out=repo+'/chinese-architecture/taimiao/study/runs/NEW_RUN';
const config=JSON.parse(await fs.readFile(repo+'/chinese-architecture/taimiao/study/experiment.json','utf8'));
const {replayFrame}=await import('file://'+repo+'/chinese-architecture/taimiao/study/replay-frame.mjs');
// 每种设备分一次工具调用，先导航，再检查已加载的运行状态后执行。
const device='desktop'; // 第二次改mobile
await tab.goto('http://127.0.0.1:8765/chinese-architecture/taimiao/study/capture.html?device='+device);
await tab.getAXState();
// 确认模型加载完成后执行，截图会刷新可见帧。
await fs.mkdir(out+'/'+device,{recursive:true});
const report=await replayFrame(tab,config,(name,bytes)=>fs.writeFile(out+'/'+device+'/'+name,bytes),device);
await fs.writeFile(out+'/'+device+'.json',JSON.stringify(report,null,2));
```

重放使用公开控件与运行状态，不通过隐藏函数注入场景。frame适配器仅转换定位器与读取内窗口DOM公布的layout，不修改共用runner。每场景同时检查条件、相机、参数、错误及布局。结束后重置使用过的浏览器viewport override。

基线来源：本轮开始git status为空；没有执行reset/clean/checkout，没有修改太和殿或共用工具。history/baseline保存太庙开始时的model/app/data/建模与验收记录，SHA-256见baseline-sha256.json。最终受检文件SHA与原始命令输出见runs/01-delivery。研究文档记录非通过尝试及修复；原始浏览器图与JSON位于runs/01-final。

## 第二轮：连续四坡、构件拾取与剖切

当前revision为02，原轮次页面与配置片段在history/01。当前默认F；可用`?mode=f&view=whole-oblique`打开。新屋面和材料参数也在experiment.json中。

第二轮用`replay-study.mjs`，在固定iframe中操作全部可见控件，并检查section、完整屋面参数、材料参数和屋面/木构位移。每个设备21个场景。可分7场景一批，避免单次浏览器操作长时间阻塞；批次间把既有results作为previous传入，仍核对跨条件同机位：

```js
const {replayStudy}=await import('file://'+repo+'/chinese-architecture/taimiao/study/replay-study.mjs');
const collected=[];
// 导航对应device的capture.html，读取AX确认加载后，每次工具调用执行一个批次。
const start=0; // 后两次为7、14
const part=await replayStudy(tab,config,
  (name,bytes)=>fs.writeFile(out+'/'+device+'/'+name,bytes),device,
  {cases:config.checks.slice(start,start+7),previous:collected});
collected.push(...part.results);
await fs.writeFile(out+'/'+device+'-part-'+(start/7+1)+'.json',JSON.stringify(part,null,2));
// 三批完成后保存合计报告，results使用collected。
```

源码更新后浏览器reload；REPL已导入的模块要加新的URL查询参数或重启REPL，避免缓存旧runner。每次都保存全部批次原始JSON。最终运行目录为runs/02-accepted，后续源码校验汇总为runs/02-delivery。

几何反例和当前方案的独立审计：

```sh
node chinese-architecture/taimiao/study/audit-roof.mjs /tmp/taimiao-geometry-audit.json
node chinese-architecture/taimiao/study/calibrate.mjs
```

第二条会重生成calibration.json，当前拟合明确拒绝，不应用到模型。校验后若重跑它，先比较源码/输出hash，再决定是否重新验证。实验检验的是模型内约束，非实物力学或榫卯工艺。
