# 本地验收 · 2026-10-13

未发布、未提交、未推送。第一卷路径 `chinese-architecture/` 保留；第二卷路径 `chinese-architecture/dule/`。

## 自动检查

从仓库根目录运行：

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js
```

14 项通过（第一卷 7，第二卷 7）。验证柱圈拓扑、中央留空、各层收退、叉柱脚与横木配合、四跳华栱、记录和变换有效、端架不穿上屋瓦面。不验证真实材料力学、隐蔽榫卯与测绘精度。

## 浏览器检查

Chrome headless + Playwright，WebGL 实际渲染，1600×1150 桌面、390×844 触屏模拟。

- 七个步骤全部加载；前檐、后檐、山面、俯视、斜观切换。
- X / Z 两个剖切轴，滑杆 -100 / 0 / 100，正反保留方向；无实体封口。
- 整体与节点最大展开、合回、复位；自动投影检查所有可见模型包围盒角点均在画幅内。
- 真实画布射线拾取成功；关键构件选择器显示证据与编号。
- 图层隐藏、全部显示、构造分色、标注开关与键盘旋转/缩放/恢复。
- 手机无横向溢出；节点展开能完整取景。属于触屏模拟，未在真实移动设备实测。
- 三维加载失败区域未出现；两卷本次页面脚本错误为零，HTTP 资源失败为零。
- 第一卷仍加载佛光寺东大殿，测试与页面未受破坏。

保存最终预览：`previews/whole.jpg`、`section.jpg`、`exploded.jpg`、`node-exploded.jpg`、`mobile.jpg`。已人工查看全貌、最大整体展开、节点展开和手机长图；模型端部屋架另由顶点约束验证。

执行脚本 `tests/browser.mjs`，需可用的 Playwright 和 Chromium/Chrome。设置 `PLAYWRIGHT_MODULE`、`CHROME_EXECUTABLE`、`PREVIEW_URL` 可覆盖本机依赖和预览地址。先从仓库根目录 `python3 -m http.server 8765`。

## 未验收项

专业测绘逐节点校核、不同浏览器/真实移动GPU表现、恢复WebGL上下文与原始文物加工尺寸。转角、补间、内槽、藻井、壁画、原书页码仍见 `MODEL_NOTES.md` 的未决记录，不因测试通过而升级证据等级。
