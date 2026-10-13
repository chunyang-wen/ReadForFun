# 第十二卷本地验收 · 2026-10-14

[本地预览](http://localhost:8765/chinese-architecture/kongmiao/)。第十二卷以曲阜孔庙大成殿为工作假设，独立目录制作。未提交、推送或发布；前卷模型、测试和截图未修改。

## 模型检查

`node --test chinese-architecture/kongmiao/tests/model.test.js chinese-architecture/tests/model.test.js`

本卷12项、第一卷7项，合计19项通过。覆盖：周廊教学柱网唯一/内柱南北区别、每柱接础、石木段原位接触、十前檐起突与侧后团龙分类、七踩三出和九踩四出差别、短柱接上层梁下皮、主横梁上皮低于屋面、全部采样椽位于瓦面下、下檐留孔/上檐戗坡从山花下开始、全殿与三节点ID/矩阵/顶点有限且说明完整、局部转换界面不造暗榫、九层均有实体。

检查教学代码约束，不代表文物测绘、力学求解或隐藏连接考证。56个地面教学站位不是已核实的实物柱目录。

## 真实浏览器

Chrome headless + Playwright，WebGL实际渲染，1600×1150桌面、390×844手机触屏模拟、1366×900减少动态。命令：

`PLAYWRIGHT_MODULE=/Users/chunyangwen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node chinese-architecture/kongmiao/tests/browser.mjs`

- 七步全部切换；文字、局部、图层与相机同步。
- 五视角、全殿最大展开、三局部合拢/最大展开；当前包围盒八角投影均在画幅内。
- X/Z剖切，−100/0/100端点和反向通过；视觉剖切不封口。
- 层显隐、全显、参考色/教学本色/构造分色、标注、复位通过，空节点层禁用。
- 关键构件选择器与实际画布射线拾取通过；拖动、滚轮、方向键、缩放、复位有效。
- 手机无横向溢出；CDP实际触屏拖动改变相机，龙柱最大展开取景通过。这是模拟，不是手机GPU真机验收。
- 减少动态下局部可用；WebGL失败说明未触发。页面脚本异常0、HTTP资源失败0。
- 第一卷、独乐寺、保和殿只读加载回归通过。未运行前卷截图脚本。
- 合集新增第十二卷并按编号排序；第十一卷尚未有卡片时，实际计11卷而非十二卷。根书架仍只有一个合集入口。封面加载、合集到第十二卷、详情顶部/页脚返回合集实际点击检查通过（独立整合检查）。

## 视觉复核

`previews/whole.jpg`（合集封面）、`desktop.jpg`、`front.jpg`、`side.jpg`、`top.jpg`、`section.jpg`、`roof-frame.jpg`、`exploded.jpg`；`dragon-*`、`bracket-*`、`transition-*`为三局部合拢/展开；`mobile-whole.jpg`与`mobile.jpg`保存手机视图。

首轮空间测试查出中层横梁端高过教学屋面，修正标高后加入约束。视觉检查修正下檐山面与前后坡的宽度接缝、上檐戗坡起点、侧坡瓦垄与椽线；端部横梁与桁下承托补齐。最后几何版本重新生成浏览器截图。栱底曲线与斗身收进仅有据轮廓概括，仍非逐件尺寸/卯口复原。

## 精度边界

原书正文、实例页图待补；柱间距与逐柱材料、高度、转角和平身斗科全清单、真实梁端榫、石木暗接、铁件/换料、台内结构与月台栏杆、完整彩画、逐龙纹样、现代与1935材料差异待核。原刊“前面十二柱”和地方志“前檐十柱”保留冲突，模型采用十个现状参考外站。详见 [MODEL_NOTES.md](MODEL_NOTES.md)。
