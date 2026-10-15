# 应县木塔独立研究页验收 · 2026-10-15

本轮最终证据目录：`runs/01-verified/`。此前失败和中间结果原样保留在 `runs/01/`、`runs/01-final/`。正式卷源码未改；其他卷的并发成果保留；未提交、推送或发布。

## 自动检查

从仓库根运行：

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/yingxian/study/experiment.json
```

最终 **22项通过、0失败**：第三卷原模型9项、本轮适配8项、共用流程5项。具体断言及原始输出见 `runs/01-verified/tests.txt`，环境、完整配置、命令与源码SHA-256见同目录 `verification.json`。

本轮增加的检查覆盖平柱铺作沿面朝向、角攒不误旋、非目标记录不改写、八面瓦片扇形边界与方向、端点矩阵有限、屋面抬升归属、明暗层支承控制面、原卷与快照一致。几何件数不作为真实性指标。

## 实际CUA浏览器重放

桌面1280×900、窄屏390×844分别执行：

- 共用 `realism-workflow/replay.mjs` 的12场景：A/B/C/D正面、A/D八角转折、换光、抬升、明暗层边界、A/D全塔、落柱局部。
- 独立 `interactions.mjs` 的11场景：回廊隔离、稳定瓦片ID选择、半剖、抬升归属、暗层与明层隔离、插入/退落两类节点、真实画布拾取、键盘旋转与复位。

每设备的原始结果为 `desktop.json` / `mobile.json` 和 `desktop-interactions.json` / `mobile-interactions.json`；JPEG保存在相应同名子目录。检查配置版本、同视角相机一致、画幅尺寸、横向溢出、错误区域及当前浏览器日志；共用重放无错误或警告。额外交互通过不等于照片配准或文物结构认证。

上轮正式卷烟测结果保留于 `runs/01-final/original-desktop.json`，覆盖7章节、暗层隔离半剖、落柱展开与证据选择，另存原卷截图。这不是对第一、二卷的本轮浏览器全量验收；本任务未修改它们或共用接口。

## 重放方法

本地HTTP服务从仓库根启动；8765已有服务时直接复用：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

CUA中选定浏览器和本卷study页，读取viewport文档。将验证命令输出的新证据目录代入：

```js
var repo='/absolute/path/to/ReadForFun';
var out=repo+'/chinese-architecture/yingxian/study/runs/NEW_RUN';
var runner=await import('file://'+repo+'/chinese-architecture/yingxian/study/run-cua.mjs');
try {
  await runner.runDevice(browser,tab,repo,out,'desktop');
  await runner.runDevice(browser,tab,repo,out,'mobile');
} finally {
  await (await browser.capabilities.get('viewport')).reset();
}
```

页面更新后重新加载。修改runner后用新导入URL或新REPL避免模块缓存。每次使用新run目录，保留失败输出。验证后源码改动须重新生成校验值并重放受影响场景。

## 目视结论与局限

已亲看桌面正面瓦口、八角转折、换光/抬升、明暗层边界、全塔、落柱和窄屏预览。瓦口搭接与平柱方向更易辨认；中央样片边界仍明显，角攒、翼角、栏板和围护仍是主要外观差距。照片机位未配准，全部纹样、现状倾斜、逐件修缮年代、总高口径、54种铺作与真实榫卯仍待核定；不声称照片级、测绘级或修缮级复原。窄屏浏览器视口检查不等于真实手机GPU验收。


2026-10-16补记：03轮对研究适配8项及页面加载、换光重新检查；显式保留旧表面条件，未重写本页历史运行报告。实际新增验证范围与原始证据见[03轮报告](../updates/03/README.md)。不将此次烟测记为重新执行01轮全部场景。
