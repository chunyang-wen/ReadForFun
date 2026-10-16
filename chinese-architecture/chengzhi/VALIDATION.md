# 第八卷本地验收 · 2026-10-13

本地预览：[承志堂前厅](http://localhost:8765/chinese-architecture/chengzhi/)。已加入书架，封面为本卷实际渲染。未提交、推送或发布。

## 模型检查

最终执行：

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js chinese-architecture/fengxian/tests/model.test.js chinese-architecture/jinci/tests/model.test.js chinese-architecture/qinian/tests/model.test.js chinese-architecture/chengzhi/tests/model.test.js
```

**82项通过**：本卷14项，第一至六卷既有检查68项。第七卷及后来并行出现的工作目录没有由本卷编辑或独立验收。

本卷检查内容：

- 全厅与四节点的ID唯一、正尺度、有限几何及变换、有效证据字段。
- 展开立面三段1.52/3.22/1.52m的坐标读取；教学进深4.8m与资料中的5.2×7.8m单独处理，不用全宅尺寸反算厅。
- 台面→础底→础顶→下柱脚，所有下柱各自有柱础；规则化12处下柱仅为模型拓扑，不当作实物柱数结论。
- 横梁几何朝向、上下皮与柱头相接；上柱脚在帽顶，帽底落梁顶。
- 雀替梁底/柱侧接触边与实体开孔；不把雕刻纹样当作承重结构。
- 拱棚与隐藏屋架分层，六处教学棚托垫座高度为正。
- 檩下表面分别落在基梁、收短梁或专用短柱；短柱不穿过收短梁。整体与屋架节点的基梁、檩均有能解析到真实模型构件的support ID。
- 屋架/檩的几何顶点不穿出教学屋面，且在本厅屋面边界内；椽顺坡跨接、椽下皮接檩冠。
- 宴官图贴在真实厅口梁的+Z侧面；雕刻几何外包不超2×0.33×0.055m，八深度站位与四桌分别记录。层数与厚度选值自洽，不证明逐层实物尺度。
- 隔扇上部透雕关联门框、下部浮雕关联实板。射线穿过上部空隙，确认没有透明贴图或整片实板假装透雕。

验收中发现收短梁端长柱会与上梁重叠，改为独立梁下支柱；又校正椽的垂直截面距离，使椽底与檩冠接触。后续补查局部屋架的support引用，统一为能定位的构件ID。几何支承测试只证明教学模型内部关系，不等于文物构造确认。

## 实际浏览器验证

Chrome / Playwright，真实WebGL运行；1600×1150桌面、390×844触屏手机尺寸、1366×900减少动态。最后节点接触边及支承元数据修订后重新执行。复现：

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' CHECK_BOOKSHELF=1 node chinese-architecture/chengzhi/tests/browser.mjs
```

服务地址默认`http://localhost:8765`，可通过`PREVIEW_URL`指定。不需要为网站运行安装Playwright。

- 七步骤的图层、文字和观察任务同步，五个相机预设均可用。
- 四组节点：雀替、宴官梁面、厢房隔扇、推定屋架，均验证合拢、最大展开与合回，包围盒八角投影不越界。
- 修复快速切节点后旧相机动画仍覆盖新取景的问题；专门检查立即切换到屋架节点后仍完整可见。
- 全厅最大展开自动取景；局部“回到前厅”和复位可用，复位清除展开、剖切与教学颜色状态。
- X/Z剖切轴、−100/0/100端点和反向保留均实际操作；裁切参数有限。此为视觉裁切，未做实体封口。
- 图层隐藏/全显、材料淡木色、教学分色、标注开关可用。选中框跟随展开中的构件，图层变化清理选择。
- 实际画布射线拾取成功，关键构件下拉返回ID、基准与证据说明。
- 键盘旋转、缩放、复位，鼠标拖转、滚轮缩放，以及CDP触摸拖转实际改变相机。
- 手机页面无横向溢出；整体、四节点最大展开投影都在画幅内。触屏模拟不等于实体手机GPU测试。
- 减少动态模式切换局部成功。
- 第一至六卷地址逐一实际加载，模型错误区域未出现，标题正确；未改其代码。
- 书架第八卷卡片唯一，实际模型封面加载，点击进入承志堂前厅成功；新增前重新读取共享文件，保留已有第七卷卡片和其他条目。
- 本轮脚本异常0、HTTP资源错误0；`git diff --check`通过。

## 最终预览

`https://readforfun-img.chunyangwen.com/chinese-architecture/chengzhi/previews/c38988ffae172483/whole.jpg`书架全貌；`desktop.jpg`桌面完整页面；`front.jpg`厅口；`section.jpg`侧向剖切；`roof-frame.jpg`揭去拱棚与瓦面的骨架；`exploded.jpg`整体最大展开；`mobile-whole.jpg`手机整体；`mobile.jpg`手机尺寸完整页面。

四局部各有`spandrel/banquet/door/roof-assembled.jpg`和`-exploded.jpg`；另存`door-back.jpg`观察真实透空。人工查看最终全貌、手机整体、节点、剖面、屋架和最大展开截图；图片只证明渲染结果，不作为历史证据。

## 验证边界

完整2016测绘未取得，柱网中心距、进深、柱径高、拱棚尺寸、隐藏屋架的实际分类和层位、全部暗榫及加工方式未核。雀替、宴官图、门雕刻为有据轮廓与层次概括，未复制人物面貌、衣褶、刀痕或原件逐层深度。倒立双狮细刻没有充足证据，没有用通用狮子填补。材料色与分色不是已核历史颜色。

原规划冯亭亭原刊未取得；改用直接审读的2024原论文核对本厅雕刻。原书正文、章节页码图号、实例收录映射仍待补。测绘级准确性、专业结构审查、实体手机和其他浏览器GPU未验证。详见[MODEL_NOTES.md](MODEL_NOTES.md)及[来源指纹](research/SOURCES.json)。


## 第二轮独立验收 · 2026-10-16

记录与边界见 [updates/02/RESEARCH.md](updates/02/RESEARCH.md)。本节不覆盖上一轮验收，也不沿用其触屏/减少动态和其它卷通过结论。

- `node --test chinese-architecture/chengzhi/tests/model.test.js chinese-architecture/photos/catalog.test.js`：29/29（本卷18，图录11），原始输出 [tests.txt](updates/02/tests.txt)。新检查覆盖双坡及拱棚闭合/非退化/正向表面、脊缝、棚托接触、椽完整顶点包络与有限檩范围、梁冠和宴官图轮廓方向；原支承、透孔、载体与稳定ID检查保留。
- CUA真实IAB：桌面1246×890与窄屏390×844，五机位、七章节、四节点拆合、整厅最大展开、两轴剖切/反向、图层、反向光、复位、真实画布拾取；窄屏无横溢。照片实际返回spandrel、banquet及拱棚步骤，同一步保留当前图。
- 选框追踪：`local-banquet/figure/0-3/1` 最大展开保持ID，Z移动0.84m；点选说明引起的画布比例变化已复验不裁梁端。两次初始失败原样保留，原因和复验场景见研究记录。
- 四张R2高清原像素解码、实际图像绘制、方向键/前后端点、400%放大与滚动、Esc与焦点返回通过；原片与全部12个WebP的哈希/ICC状态核查通过。
- 照片16对象和82张本轮截图，共98个R2对象防覆盖上传及S3读回SHA256一致；98项命令行公开GET仍403，IAB四张高清成功解码分别登记。没有本轮本地备用图，不把只有本机的副本算交付。
- [browser.json](updates/02/browser.json)保留73个状态（含失败）；截图及URL/SHA256在 [upload.json](updates/02/upload.json)，[source-hashes.json](updates/02/source-hashes.json)记录受检源码与三个HTTP实际模块字节一致。当前页面模型revision为chengzhi-20261016-02，本轮localhost脚本错误0；Commons页面旧jquery.ui警告保留并按来源区分。

旧browser.mjs改读DOM状态、截图写临时目录，本轮未执行旧runner，避免把历史结果冒充新版全范围测试。未验实体手机GPU/真实触摸、其它浏览器GPU、减少动态；没有可接受摄影测量拟合或测绘级精度。原书、完整柱网/屋架、细雕仍待核。网站未提交、推送或发布。
