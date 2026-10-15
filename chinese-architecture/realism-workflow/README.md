# 建筑真实性迭代：记录与重放

此流程将“找到照片 → 对照模型 → 小范围修改 → 验证 → 留下证据”变成可重复的制作步骤，并与实景图录共同用于新卷和已有卷更新。太和殿与太庙是当前样例。复用流程、查看器契约与几何工具；每座建筑独立建立尺寸、构造、材质和证据。禁止用软件测试通过或几何数量作为真实性证明。

规范入口为 [制作规范第12—13节](../PRODUCTION_GUIDE.md#12-外观真实性的迭代和重放)。具体修正经验见 [LESSONS.md](LESSONS.md)，配图接入见 [实景图录](../photos/README.md#其他卷接入清单)。模型试验与图片展示分别保留证据，再共同验收；增加照片不替代模型修正。

## 必须保留的六步

| 步骤 | 输入与操作 | 保存的结果 | 进入下一步的条件 |
| --- | --- | --- | --- |
| 1. 明确对象 | 建筑、采用阶段、视角、需要解释的部位 | manifest 的 id、referenceState；待核项目 | 不能混用不同建筑或修缮状态而不说明 |
| 2. 建证据表 | 实测/论文/照片/第三方模型分别核对；区分研究参考与可展示图片 | sources及逐图记录：稳定 ID、URL、对象/日期/方位、等级、许可、用途、局限 | 图像日期、尺度和授权未知时保留未知；无再分发许可不上传展示 |
| 3. 留基线 | 保存现有源码/版本与截图；固定机位 | revision、源码 SHA-256、A 条件截图 | 相机与尺度可复现；未校准机位不能做像素精度结论 |
| 4. 分条件试验 | 一次处理一个部位；区分几何、材料、光照；为相应部位配置图录 | 命名条件、参数、稳定构件 ID、预设视角、照片到本卷步骤/节点的映射 | 多变量同时改变时写明；照片细部不自动变成有据模型细部 |
| 5. 自动和目视验证 | 结构回归、方向/法线/全长包络/拆解/拾取；多视角/换光/窄屏；图录加载与回看 | tests.txt、verification.json、浏览器 JSON、截图；图片校验与分层可用性记录 | 亲看截图；实际视口、脚本、节点与配置一致；已知网络失败单列 |
| 6. 记录结论 | 哪些变化有用、哪些仍失败、何处缺资料及照片 | 每轮研究记录、未决问题、视角缺口、下一轮优先级、研究/正式卷/存储/发布状态 | 试件完成、R2上传、CDN可读、正式卷更新与页面上线分别报告 |

## 当前目录与责任

- `roof-patch.js`：可复用局部瓦片生成器，调用者提供屋面高度函数、宽度、瓦距、长度、命名空间、证据。当前只支持沿 +Z 的局部坡面；不同坡向需先建立局部坐标变换。转角和脊线不能机械套用。
- `manifest.js`：检查参数、证据、相机、截图尺寸与重放用例是否完整。
- `verify.mjs`：用 Node 运行 manifest 列出的测试，保存源码校验值、原始日志、完整配置及运行环境。默认使用新的时间戳目录，保留之前结果。
- `replay.mjs`：在 Codex 的 `cua_repl` 中使用已经打开的浏览器页，通过可见控件重放场景。没有隐藏的页面状态注入，没有另起浏览器驱动。
- `workflow.test.js`：参数拒绝、槽形几何、匾额归属、不同坡面迁移等回归。
- `../taihe/study/experiment.json`：太和殿配置样本。
- `../taihe/study/runs/02/`：本轮实际运行证据。
- `../taihe/study/history/01/`：第一轮源码片段和截图快照；不是可直接访问的独立网站。历史代码需要放回对应原路径并使用匹配的依赖版本才能运行。
- `../taimiao/study/roof-system.js`：连续屋面、檐板与椽件的太庙适配实例；有限支承、法线及全长包络检查见该卷测试。不是跨建筑的尺寸或接法模板。
- `evidence-fit.js`：通用有界拟合和拒绝规则，不携带建筑尺寸；是否接受仍依赖本卷证据、定位误差与独立视角。
- `../photos/`：共享实景图录、逐图来源、R2素材处理与本地备用；图片资产与模型条件配置分别维护。

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

视口设置命令成功后，仍须读取页面实际 `innerWidth/innerHeight`；不符则该场景不能记为通过。工具无法落实视口时，可使用明确宽高的同源iframe重放，并记录内层实际尺寸，注明只是布局检查。太庙 `study/capture.html` 和图录 `photos/preview.html` 是已用实例；不同建筑需核对实际route，不能误测默认返回的太和殿。还须核对实际脚本URL/版本和当前节点值；刷新动作本身不证明缓存已更新。

重放检查实际 mode/view、光照与抬升状态、建筑/参数版本、视口尺寸、相机一致性、页面错误与溢出，并保存每个场景的 JPEG。日志检查包括当前 tab 已发生的异常；排查过故障后应在新 tab 运行正式重放。重复截图可能因 GPU、抗锯齿、设备像素比和字体不同产生像素差，不能仅以图片字节相同与否判断正确。帧率、真实触屏和摄影测量精度需要另做测试。

## 在另一座建筑复用

1. 在对应卷建立 study 目录，复制配置结构，改 id、route、referenceState、sources、views、checks、sourceFiles、tests。取景重新按该建筑设定，不复制太和殿数值。
2. 用该建筑自己的 roof height/表面函数调用 `buildRoofPatch`。局部瓦片参数必须来自该建筑资料或明确标记推定。传入不同 namespace，避免 ID 混淆。
3. 替换旧几何的筛选逻辑必须写成该卷适配器；`taihe/study/roof-sample.js` 的 `upper-rib/1/` 命名仅适用于太和殿。新增“未误删其他构件”的回归检查。
4. 复用网页重放契约：`[data-mode]`、`[data-view]`、`#light`、`#explode`、`#stats`、`#error`。`#stats` 输出 architecture、revision、mode、view、camera、target、patch、fov、roofLift、alternateLight。改了契约就明确升级 runner 和 schema。
5. 运行相同验证命令，传该卷配置。按上述 CUA 步骤对新的 route 重放，保留独立 run 目录。
6. 人工核对不同视角下的体量、遮挡、支承及装饰证据，完成后才考虑接入正式卷。
7. 按 [图录接入清单](../photos/README.md#其他卷接入清单) 配置本建筑的照片、步骤和可选节点；核验作者、许可、方位、原始像素及色彩配置。复用组件和存储方法，不复制其他殿的照片、文字或步骤编号。
8. 重放图片切换、高清加载、最大放大、关闭/焦点返回及照片到模型的跳转。分别记录R2读回、公开HTTP、浏览器解码、备用图与正式页面状态；有缺图或来源站限流时保留事实与下一步。

本轮已用合成斜坡及奉先殿已有 `surfaceY` 函数运行同一生成器的测试。它证明代码没有依赖太和殿高度，**不是奉先殿写实改造已完成**。匾额造型、金色琉璃、宫殿纹样绝不是全系列通用模板。

## 更新已有卷时的交付对照

| 本轮工作 | 至少核验 | 卷内留下什么 |
| --- | --- | --- |
| 体量与机位 | 尺度基准、轮廓控制点、独立视角；拒绝不可靠拟合 | 原版/候选/采用值、依据、拒绝理由 |
| 连续几何与支承 | 所有坡向、法线、搭接、有限支承面、全长包络与未误删旧件 | 本卷适配参数、回归输出、剖面与换光图 |
| 材料与装饰 | 原载体、历史/现状/推定区分；拆解归属、实例拾取与选中框 | 独立或组合条件、证据边界、交互截图 |
| 多角度图录 | 对象、方位、许可、色彩、解码、切图、节点跳转及备用 | 逐图清单、缺口、素材校验、真实UI记录 |
| 正式卷接入 | 受影响的原有控件、桌面/窄屏、实际版本、源码校验 | 更新过的MODEL_NOTES/VALIDATION及发布状态 |

现有 `architecture-realism/v1` manifest主要描述模型试验，不自动验证图录、R2或章节映射。图录当前另有 `photos/catalog.test.js` 与 `photos/records/`；迁移时补充本卷检查和独立运行记录，不把太和殿/太庙通过的数量填成新卷结果。未改受检代码的文档维护只需文档检查。

## 迭代经验与跨项目迁移

见 [LESSONS.md](LESSONS.md)：分开核验历史、构造、外观与软件；包含太庙的相机拟合拒绝、表面法线、四坡排瓦、有限檩圈支承、分段椽身包络及真实视口重放经验。新增 `evidence-fit.js` 仅提供通用有界搜索和拟合拒绝规则，不携带任何建筑尺寸。太庙的建筑适配器保留在其study目录。
