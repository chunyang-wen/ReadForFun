# 建筑真实性迭代：记录与重放

此流程将“找到照片 → 对照模型 → 小范围修改 → 验证 → 留下证据”变成可重复的制作步骤。太和殿是当前样例。复用流程、查看器契约与几何工具；每座建筑独立建立尺寸、构造、材质和证据。禁止用软件测试通过或几何数量作为真实性证明。

## 必须保留的六步

| 步骤 | 输入与操作 | 保存的结果 | 进入下一步的条件 |
| --- | --- | --- | --- |
| 1. 明确对象 | 建筑、采用阶段、视角、需要解释的部位 | manifest 的 id、referenceState；待核项目 | 不能混用不同建筑或修缮状态而不说明 |
| 2. 建证据表 | 实测/论文/照片/第三方模型分别核对 | sources：稳定 ID、URL、证据等级、用途、使用范围、局限 | 图像日期、尺度和授权未知时保留未知 |
| 3. 留基线 | 保存现有源码/版本与截图；固定机位 | revision、源码 SHA-256、A 条件截图 | 相机与尺度可复现；未校准机位不能做像素精度结论 |
| 4. 分条件试验 | 一次处理一个部位；区分几何、材料、光照 | 命名条件、参数、稳定构件 ID、预设视角 | 多变量同时改变时写明，不假装单变量归因 |
| 5. 自动和目视验证 | 原有结构回归、参数/边界、方向、拆解；正面/斜面/反向光/窄屏 | tests.txt、verification.json、浏览器 JSON、同名截图 | 结构无回归、无异常；还必须亲看截图 |
| 6. 记录结论 | 哪些变化有用、哪些仍失败、何处缺资料 | 每轮研究记录、未决问题、下一轮优先级 | 仅完成试件时不能写成整殿已复原或已上线 |

## 当前目录与责任

- `roof-patch.js`：可复用局部瓦片生成器，调用者提供屋面高度函数、宽度、瓦距、长度、命名空间、证据。当前只支持沿 +Z 的局部坡面；不同坡向需先建立局部坐标变换。转角和脊线不能机械套用。
- `manifest.js`：检查参数、证据、相机、截图尺寸与重放用例是否完整。
- `verify.mjs`：用 Node 运行 manifest 列出的测试，保存源码校验值、原始日志、完整配置及运行环境。默认使用新的时间戳目录，保留之前结果。
- `replay.mjs`：在 Codex 的 `cua_repl` 中使用已经打开的浏览器页，通过可见控件重放场景。没有隐藏的页面状态注入，没有另起浏览器驱动。
- `workflow.test.js`：参数拒绝、槽形几何、匾额归属、不同坡面迁移等回归。
- `../taihe/study/experiment.json`：太和殿配置样本。
- `../taihe/study/runs/02/`：本轮实际运行证据。
- `../taihe/study/history/01/`：第一轮源码片段和截图快照；不是可直接访问的独立网站。历史代码需要放回对应原路径并使用匹配的依赖版本才能运行。

## 重放太和殿

从 ReadForFun 仓库根目录运行：

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/taihe/study/experiment.json
python3 -m http.server 8765
```

第一条命令打印新的证据目录；第二条只在本地没有静态服务时运行。验证失败也保存原始输出，不要将失败记录改写为通过。

打开 `http://localhost:8765/chinese-architecture/taihe/study/?mode=d&view=plaque`。页面的 A/B/C/D、四个预设视角、换光与屋面抬升都来自显式状态；可见的“运行状态”是重放脚本读取的契约。

在 `cua_repl` 中先按其工具说明取得 `tab` 和对应浏览器 `browser`，阅读 viewport capability 文档。下列脚本使用这些已选择的绑定；将 `repo` 与 `out` 换成当前绝对目录和上一条验证命令打印的新目录：

```js
{
  const fs = await import('node:fs/promises');
  const repo = '/absolute/path/to/ReadForFun';
  const out = repo + '/chinese-architecture/taihe/study/runs/NEW_RUN';
  const config = JSON.parse(await fs.readFile(repo + '/chinese-architecture/taihe/study/experiment.json', 'utf8'));
  const {replay} = await import('file://' + repo + '/chinese-architecture/realism-workflow/replay.mjs');
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
  } finally {
    await viewport.reset();
  }
}
```

代码更新后重新加载页面。若在同一 REPL 改过 replay.mjs，需要用新的导入 URL 查询参数或新 REPL，避免模块缓存仍使用旧脚本。源文件 SHA-256 在验证后若发生变化，应重新验证并重放受影响场景。

重放检查实际 mode/view、光照与抬升状态、建筑/参数版本、视口尺寸、相机一致性、页面错误与溢出，并保存每个场景的 JPEG。日志检查包括当前 tab 已发生的异常；排查过故障后应在新 tab 运行正式重放。重复截图可能因 GPU、抗锯齿、设备像素比和字体不同产生像素差，不能仅以图片字节相同与否判断正确。帧率、真实触屏和摄影测量精度需要另做测试。

## 在另一座建筑复用

1. 在对应卷建立 study 目录，复制配置结构，改 id、route、referenceState、sources、views、checks、sourceFiles、tests。取景重新按该建筑设定，不复制太和殿数值。
2. 用该建筑自己的 roof height/表面函数调用 `buildRoofPatch`。局部瓦片参数必须来自该建筑资料或明确标记推定。传入不同 namespace，避免 ID 混淆。
3. 替换旧几何的筛选逻辑必须写成该卷适配器；`taihe/study/roof-sample.js` 的 `upper-rib/1/` 命名仅适用于太和殿。新增“未误删其他构件”的回归检查。
4. 复用网页重放契约：`[data-mode]`、`[data-view]`、`#light`、`#explode`、`#stats`、`#error`。`#stats` 输出 architecture、revision、mode、view、camera、target、patch、fov、roofLift、alternateLight。改了契约就明确升级 runner 和 schema。
5. 运行相同验证命令，传该卷配置。按上述 CUA 步骤对新的 route 重放，保留独立 run 目录。
6. 人工核对不同视角下的体量、遮挡、支承及装饰证据，完成后才考虑接入正式卷。

本轮已用合成斜坡及奉先殿已有 `surfaceY` 函数运行同一生成器的测试。它证明代码没有依赖太和殿高度，**不是奉先殿写实改造已完成**。匾额造型、金色琉璃、宫殿纹样绝不是全系列通用模板。
