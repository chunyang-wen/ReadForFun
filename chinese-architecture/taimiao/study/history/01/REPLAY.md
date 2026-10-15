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
