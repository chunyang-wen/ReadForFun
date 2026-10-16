# 真实性工具运行说明

需求、经验教训、跨卷更新流程与验收统一维护于 [PRODUCTION_GUIDE.md](../PRODUCTION_GUIDE.md)。本文件只保留已有工具职责及太和殿的实际调用示例，不维护另一套要求。单独引用统一文件即可开始其他卷的工作。

## 必须保留的六步

统一流程、记录要求和适用边界见主文件[第12节](../PRODUCTION_GUIDE.md#12-外观真实性的迭代和重放)及[第15节](../PRODUCTION_GUIDE.md#15-验证版本链与交付)。

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


从 wonder 仓库根目录运行：

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


以上是现有太和殿配置的工具调用示例。实际视口、脚本版本、源码校验、错误归属及受影响场景的重验要求，统一执行主文件第15节；不能仅凭示例中的设置命令认定实际状态正确。

## 在另一座建筑复用

按统一文件[第12节](../PRODUCTION_GUIDE.md#12-外观真实性的迭代和重放)、[配图接入约定](../PRODUCTION_GUIDE.md#配图组件与模型联动的接入约定)与第15节适配本卷参数、来源、route和检查；不再在本文件复制跨卷流程。

## 更新已有卷时的交付对照

模型、图录、验证与正式卷接入的统一交付表见主文件[第15节](../PRODUCTION_GUIDE.md#15-验证版本链与交付)。各卷实际结果留在自己的运行记录中。

## 迭代经验与跨项目迁移

全部经验案例已迁入主文件[第14节](../PRODUCTION_GUIDE.md#14-实际经验教训与适用边界)，新经验也只在那里维护。
