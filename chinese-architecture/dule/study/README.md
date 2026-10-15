# 观音阁局部真实性实验：重放入口

本地预览：`http://localhost:8765/chinese-architecture/dule/study/?mode=f&view=street`。当前复用仓库已有静态服务；若服务停止，从仓库根运行 `python3 -m http.server 8765`。原卷地址不变。

阅读 RESEARCH.md 的阶段/来源边界。experiment.json 固定建筑ID、修缮资料身份、参数、机位、视口与场景。历史快照不是独立可运行网站，最终网页仍导入正式卷的model/data，必须核对其哈希。

先执行通用验证，默认产生新目录，不覆盖本轮证据：

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/dule/study/experiment.json
```

然后在CUA获得新干净页签（避免参考站点历史日志），读取browser viewport文档。使用验证命令输出的实际目录，执行以下代码：

```js
const fs = await import('node:fs/promises');
const repo = '/Users/chunyangwen/Documents/Ideas/Video2Book/ReadForFun';
const out = repo + '/chinese-architecture/dule/study/runs/替换为新运行目录';
const config = JSON.parse(await fs.readFile(repo + '/chinese-architecture/dule/study/experiment.json', 'utf8'));
const {replay} = await import('file://' + repo + '/chinese-architecture/dule/study/replay.mjs');
const viewport = await browser.capabilities.get('viewport');
try {
  for (const device of ['desktop', 'mobile']) {
    await viewport.set(config.capture[device]);
    await tab.reload();
    await tab.getAXState();
    await fs.mkdir(out + '/' + device, {recursive:true});
    const report = await replay(tab, config,
      (name, bytes) => fs.writeFile(out + '/' + device + '/' + name, bytes),
      {viewport:device});
    await fs.writeFile(out + '/' + device + '.json', JSON.stringify(report, null, 2));
  }
} finally { await viewport.reset(); }
```

每种视口运行通常约30秒，可分为两次工具调用；不需要隐藏页面状态注入。当前replay包装器继续实际调用共用runner，并加本卷归属/剖切/选择器验证。必须检查实际视口；浏览器设置可能只作用于当前选择页签。源码变动后新导入URL或新REPL，避免缓存旧模块。第二轮页面使用build=02b加载脚本，并由重放逐场景校验viewerBuild。

原卷回归使用独立original-replay.mjs，同样通过可见控件；获得指向`/chinese-architecture/dule/`的干净tab后，调用`replayOriginal(tab, screenshotSink)`，分别设置两种视口。范围滑杆使用Home/End键，未写入隐藏状态。画布真实拾取另按当前截图选择坐标，保存返回ID与截图；不得盲复用旧截图坐标。

重放完成须亲看截图，检查节点最大展开、全阁、剖切和窄屏。第二轮最终结果在runs/02-delivery（24项测试、每视口22场景），第一轮结果在runs/01-delivery，原卷24×2步骤在runs/01-reviewed。目录内保留失败与中间记录，请按verification源校验值识别版本，不使用上次测试数量证明本次真实性。

迁移到下一建筑只复用共用工具和流程，重新写sources、roof height、筛选器、局部参数和相机。灰瓦与铺作成对控制值也不是所有辽构模板。

## 正式接入04 · 当前入口

2026-10-15的正式卷更新在 `../`，不是把本研究页改名为第二卷。采用原曲面的连续瓦面、成对下檐出跳、可切换的上檐方向诊断及实景图录；翼角改形和现状外观F仍保留在本页比较。当前正式源码已不同于01/02原卷回归快照，不再用历史“原卷未改”结论描述现状。

新基线：`history/04-baseline/`；最终证据：`runs/04-delivery/`；中间结果：`04-formal/`、`04-final/`；原始来源及衍生资产：`04-sources/`。最终SHA256、34项测试、真实视口/节点状态、逐图/R2/本地备用解码和缺口说明见 `../VALIDATION.md`。研究verify本轮另存`02-2026-10-15T14-40-20-737Z`，其24项与正式34项有重复，不作相加。


## 图像补充05

`runs/05-photo-search/`保存英文子分类与1932年原刊获取、原始图版及上传读回报告。`runs/05-delivery/`保存6项新增图片的实际浏览器像素、竖图截图、手机放大、模型联动及18个本地备用图解码。04记录不覆盖。具体来源及缺口见../MODEL_NOTES.md。
