# 第十卷本地验收 · 2026-10-13

可运行本地研究展卷：[保和殿与台基雕作](http://localhost:8765/chinese-architecture/baohe/)。本任务未执行提交、推送或发布。书架与建筑合集均已有第十卷入口；没有修改其他卷模型、测试或截图。

## 模型检查

```sh
node --test chinese-architecture/baohe/tests/model.test.js chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js chinese-architecture/fengxian/tests/model.test.js chinese-architecture/jinci/tests/model.test.js chinese-architecture/qinian/tests/model.test.js
```

本次快照 **81项通过**，本卷13项，前六卷合计68项。前卷测试数来自此次实际文件，不据此宣告其他任务完整验收。

本卷核验：

- 九间五间外围、前金列教学减六柱；38个教学主柱位不重复。具体柱站位与总数仍为推定。
- 每柱脚接自己的石础上皮；前列转承教学骨架两端接保留金柱。没有用无解释的悬空柱替代减柱关系；该跨接不代表真实单根大梁。
- 三台层级、共同南裁口和不闭合南缘栏杆；台体占位与完整土字形平面分开。
- 大御路取露明面16.57×3.07m，与整料基准分开；三级斜面上下端接教学台层标高，两側14步为推定。
- 九个龙纹主题依附同一长石面；雕面观察分离不当成独立石件。
- 一栏间包含地栿、两望柱、实板与上部透空承托件；石榫没有虚构。
- 螭首朝北、东、西对应台外，口沿中孔不填黑片；北栏没有重复叠建。外口和头部原位拼合，没有在口前再放阻塞出口的实体。
- 下檐真实中心孔、独立上脊与山面；椽线逐段采样在本教学瓦面下。
- 桁下短柱头接桁下皮，上屋架短柱头接下一梁下皮；没有以节点照片声称隐藏端榫已核。
- 全殿与四局部ID唯一，位置、方向、尺度、矩阵、几何顶点有限；所有显示类型都有拾取说明与来源状态。

测试检查代码中的空间约束；不是文物测绘或结构求解。主殿逐榀梁架、真实石分件、暗榫、内部排水均未达到考证级复原。

## 实际浏览器验收

Chrome headless + Playwright，真实WebGL渲染。1600×1150桌面、390×844手机触屏模拟、1366×900减少动态。最终代码与材质改动后重新运行通过。

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' node chinese-architecture/baohe/tests/browser.mjs
```

复用已有8765静态服务；用`PREVIEW_URL`可替换。网站直接加载本地Three.js，无CDN、构建或Playwright运行依赖。

- 七步全部切换；相机、章节文字、局部菜单、可见层同步。
- 五视角，四局部合拢/最大展开及整体最大展开；可见包围盒8个角点都在画幅内，取景动态适配。
- X/Z剖切轴、位置−100/0/100、反向保留可用；未提供实体剖切封口。
- 显隐、全部显示、参考色/教学本色/系统分色、标注与复位可用。全殿12个实体层；第13层出口阅读线只在螭首局部有辅助几何，空层禁用。
- 关键构件选择器和实际画布射线拾取均成功；鼠标拖动与滚轮分别改变相机；方向键、缩放、复位可用。
- 手机没有横向溢出；CDP触屏拖动实际改变相机，局部最大展开投影全部在画幅内。此为触屏模拟，不代表真实手机GPU验收。
- 减少动态设置下局部切换通过，加载失败区域未出现。
- 前五卷作只读页面加载回归：标题、WebGL初始化通过。模型检查覆盖前六卷；没有运行其他卷截图生成脚本或重做其交付。
- 根书架第十卷卡片唯一、封面加载成功、点击正确；第九卷根入口保留。
- 合集中第十卷卡片唯一、封面和点击通过；第1—8卷原入口仍各一份。当前合集第9卷尚未由其任务归入，本任务保留其根书架入口，不改写其他卷的组织状态。
- 本次页面脚本异常0、HTTP资源错误0；`git diff --check`通过。

## 视觉复核与最终预览

全部截图保存于本卷`previews/`。亲看最终全貌、南向、桌面长图、骨架、剖面、最大展开、四局部合拢/展开与手机画幅/长图。界面保持前卷暖底、石木本色与克制黄朱青绿。

`whole.jpg`为北向斜观与书架封面；`desktop.jpg`桌面全页；`front.jpg`南向；`section.jpg`三台剖观；`roof-frame.jpg`揭瓦木构；`exploded.jpg`整体最大展开；`terrace.jpg`全部实体层最大展开；`mobile-whole.jpg`手机整体；`mobile.jpg`手机御路局部最大展开。`rail-*`、`chi-*`、`ramp-*`、`terrace-*`为四局部合拢/展开；`node-exploded.jpg`为云龙阶石展开。

首轮检查修正了上屋两坡与侧戗坡使用不同曲线的接缝，改用同一全局参数。后续核对桁椽高差与短柱承接，加入支承测试。石雕头部、卷草、海水与流云经细化仍是原创概括，没有将精细外观升级为实测主张。

## 精度边界

原书正文及保和殿实例页码映射待补；官方高29.5m与1240㎡的基准不直接用于推算本模型各尺寸；北端各层抄平、真实柱位/移柱/减柱转承、逐科昂尾、石分件、石榫铁件、地下基础、台内暗沟、大石雕埋入部分、精确雕刻/石种、历史颜色、转角大螭、跨浏览器及真机GPU未核。模型仅表达可追溯的形制、可见载体及明确标记的教学推定。详情见[MODEL_NOTES.md](MODEL_NOTES.md)。


## 第二轮独立验收 · 2026-10-16

本地正式卷已接入，旧记录保留。完整依据、前后变化、拒绝方案、图片覆盖与边界见 [updates/02/RESEARCH.md](updates/02/RESEARCH.md)。未提交、推送或发布网站。

- [最终40项Node检查](updates/02/tests-final.txt)：本卷19、图录14、共享第一卷7。
- [几何检查](updates/02/geometry-report.json)：443520个完整椽顶点/轴向采样无越边或穿瓦；128个有限桁段支承通过；8坡/2山花绕序与共边测试通过；84外皮片闭合正体积；[462件旧望柱ID/位置](updates/02/stable-post-ids.json)一致。软件通过不代表测绘真实性成立。
- 桌面1280×900实际七步、五视角、X/Z剖切端点/反向、展开、换光/材质、复位、实际画布拾取与移动选框；原版局部→木架裁切失败保留，新版同路径通过。状态、脚本与相机见 [browser-checks.json](updates/02/browser-checks.json)，首次失败见 [browser-baseline-failure.json](updates/02/browser-baseline-failure.json)。
- 390视口命令未生效（实际1280），没有记通过。改用同源iframe，内部实际390×844、scrollWidth390，四类局部最大展开与回整体、竖幅高清及节点联动通过；[mobile-browser.json](updates/02/mobile-browser.json)。不是手机真机/GPU验收。
- 5张照片20个对象全部R2上传与S3读回SHA256一致；命令行公开GET20项403，浏览器5张公开高清均成功解码/显示，网络上下文分别记录：[上传](updates/02/upload-photos-final.json)、[浏览器](updates/02/photo-browser.json)、[原片与ICC](updates/02/image-integrity.json)。页面与R2备用映射不依赖新增本地副本。
- 高清400%窗口放大/滚动、切图端点、左右键、Esc/焦点、实际ramp节点、同章保留第5张通过。当前控制台error/warn为空；未捕获全量HTTP，不宣称所有网络资源无误。
- [源码与实际HTTP字节核验](updates/02/source-hashes.json)，实际模块 `app.js?v=baohe-02bearing`、模型 `baohe-02-20261016-final-bearing`。旧Playwright runner已改DOM读取及临时输出，本轮未运行该runner。

新截图全部存R2，逐张URL/SHA256在根media-assets.json及第二轮上传清单；本地图片只是忽略的工作缓存。北立面、纯侧背正射、北端螭首口/逐石雕刻高清、原书合法页图映射、真实减柱转承、石分件、暗榫铁件、台内水路仍未解决。

收尾增加实际实例桁底接触检查，修正.01m半厚基准错误。另有[桁椽接触已知失败](updates/02/timber-contact-unresolved.json)：中排16处抽查6处确定间隙，最大保守下界约.311m。`check-timber-contact.mjs`有意返回非零，原始输出保留；40项通过不含此项，也不能作为全木架通过。页面与MODEL_NOTES已明示，待本殿梁架/角部支承证据进一步修正。

最终承托与资料缓存修正复验见[桌面](updates/02/browser-bearing-closeout.json)与[真实390视口](updates/02/mobile-bearing-closeout.json)。曾出现模型已新、data.js文字仍旧的缓存差异；失败保留并通过资料导入版本解决，最终DOM已显示桁椽接触未闭合。较早记录保留各自revision。
