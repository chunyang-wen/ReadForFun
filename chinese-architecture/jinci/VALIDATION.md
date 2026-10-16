# 第五卷本地验收 · 2026-10-13

本地预览：[晋祠圣母殿](http://localhost:8765/chinese-architecture/jinci/)。书架有第五卷实际模型封面与入口。未提交、推送或发布。

## 自动模型检查

仓库根目录运行：

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js chinese-architecture/fengxian/tests/model.test.js chinese-architecture/jinci/tests/model.test.js
```

最终54项通过：第一卷7、第二卷7、第三卷9、第四卷13、第五卷18。重新核实前四卷36项，不仅引用先前报告。

第五卷检查范围：

- 外围连续26处柱位、四处梁上柱、内部示意两点；模型ID与位置不重复。柱清单只验证模型拓扑，不确认实物柱数或内部精确坐标。
- 台基顶→础底→柱脚相接；四处梁上柱落在各自斜面深廊梁背中心。
- 主梁下皮与柱头中央承托、教学前槽承托连续；内部承托帽→跨接梁下皮→主梁脚相接。
- 明间两側斜梁高面向中；所有驼峰底面斜率匹配对应下梁截面，不仅检查局部样本。
- 驼峰顶→教学垫座脚相接，垫座高度为正。
- 上下檐局部2/3个教学站位独立，柱头与补间采用不同外端分型，平出外端不误画为长斜昂；承托条落在斗肩以上。
- 端架另建6段丁栿，端部不复制中间高层叉手；全体屋架几何顶点在教学屋面下。
- 第二层三缝五椽栿与前劄牵分件、一缝通栿不分；相接端点连续，通栿长度不同。
- 长坡槫顶与对应站位椽下皮接触；下檐四片裙面不封住内室；两片上屋山花。
- 八组雕刻均映射到真实模型连续柱身host；装饰层可独立隐藏；无移植清式彩画、天花与叉柱。
- 全殿及四局部ID、证据字段、变换、几何与包围盒有效。

在实现过程中发现不同宽高的前后梁截面不能共用驼峰斜底斜率，已分别匹配并新增整体接触回归；内部跨接帽与梁层曾重叠，重排支承层位并加入连续性检查；长坡屋面控制曲线调整为通过教学梁槫椽承接点。测试约束是模型内部空间检查，**不证明这些教学尺度对应真实文物加工尺寸**。

## 实际浏览器检查

Chrome headless / Playwright，真实WebGL渲染。1600×1150桌面、390×844手机触屏模拟、1366×900减少动态设置。最后几何修改后重新执行；没有用静态HTML解析替代实际页面运行。

- 七个步骤、五个预设视角切换成功；观察任务、图层与章节同步。
- 四局部：下檐柱头、上檐柱头、斜面梁栿/驼峰、盘龙柱身。每组切换、合回、最大展开均检查可见模型包围盒八角投影在取景内。
- 全殿最大展开、合回、复位取景通过；无关键模型越出画幅。
- X/Z剖切轴、−100/0/100端点、反向保留可操作；剖切仅视觉裁切，无实体封口。
- 图层显隐、全部显示、淡木色、构造分色、标注、关键构件选择器可用。
- 实际画布射线拾取成功；键盘旋转、缩放与恢复视角成功。
- 手机页面无水平溢出，节点最大展开取景通过；这是触屏模拟，不是实体手机GPU验证。
- 减少动态设置下局部切换成功。
- 前四卷路由逐一实际加载，无模型错误区域；页面标题均对应佛光寺、独乐寺、应县木塔、奉先殿。
- 书架第五卷卡片唯一、模型封面加载、点击进入圣母殿成功。
- 本轮页面脚本异常0、HTTP资源错误0；`git diff --check`通过。

复现运行：

```sh
python3 -m http.server 8765
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' node chinese-architecture/jinci/tests/browser.mjs
```

可用`PREVIEW_URL`更改静态服务地址。网站运行不需要安装Playwright。

## 最终截图

`https://readforfun-img.chunyangwen.com/chinese-architecture/jinci/previews/a47f4df74fec821e/whole.jpg`用于书架；`desktop.jpg`完整桌面页面；`section.jpg`主梁架剖面；`roof-frame.jpg`揭瓦后的梁槫椽；`exploded.jpg`全殿最大展开；`mobile.jpg`手机尺寸页面。

四组局部各有合拢/展开：`lower-assembled/exploded.jpg`、`upper-assembled/exploded.jpg`、`seat-assembled/exploded.jpg`、`dragon-assembled/exploded.jpg`；另有`node-exploded.jpg`。实际查看全貌、桌面、手机、上下铺作、驼峰、盘龙、剖面、屋架与全殿展开图；图像不作为历史证据。

## 精度边界与未验证

全部尺度为教学比例或图像关系重建；原书正文映射、原修缮报告、内部逐柱坐标与完整纵横架、每种铺作、补间差异、转角互锁、真实卯口、端部隐蔽槫椽连接、柱生起侧脚、翼角、琴面和大小头、八龙逐件姿态/拼合/雕刻节点/年代、门窗与历史彩画、专业核验、真实手机与跨浏览器GPU尚未完成。详见[MODEL_NOTES.md](MODEL_NOTES.md)。

前四卷代码保持原状；原先未提交/未跟踪成果保留。任务期间出现的其他卷或计划文件未由本卷改写。本卷的测试通过不等于测绘精度，本模型不能用于修缮与加工。

## 2026-10-16 · 第二轮正式接入

本轮独立目录：[updates/02](updates/02/RESEARCH.md)。保留上轮54项及旧预览记录；没有将历史检查数沿用为本轮通过数。本轮未提交、推送或发布网站，正式本地入口仍为 `jinci/`。其它会话同时修改的第四卷和共享图录内容保留。

### 自动与几何证据

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/jinci/tests/model.test.js chinese-architecture/photos/catalog.test.js
node chinese-architecture/jinci/updates/02/audit.mjs
```

本轮 **39项通过**：第一卷共享模型7、第五卷24、共享图录8；图录断言实际导入 `jinci` 的CHAPTERS/NODES，覆盖9张本卷照片及lower/dragon真实节点，不是默认卷替代验收。[原始输出](updates/02/evidence/tests.txt)。第一卷7项只表示该共享检查未回归，不表示重新验收第一卷全部场景。

本轮新增检查：两根矩形梁的轴位与角色、其上水平驼峰底面；8片屋面基层和16片陶瓦表面全部三角向上且无退化；两片山花向外；覆盖层/椽层拆解归属；上屋椽线全部分段端点连续；长坡槫的有限水平支承范围；实际实例矩阵后完整圆柱顶点包络。

[几何审计](updates/02/evidence/geometry-audit.json)：上屋173,790个足迹内顶点，最大相对覆盖面差−0.124716m；边界外7,498点单列。下屋325,988个足迹内顶点，最大相对基层面差−0.051803m；边界/开口18,236点单列。负值表示在所用教学面下，不能解释为实物净空。外缘圆柱包络伸出、开口点没有伪记为“零穿透已通过”。山坡、下檐隐蔽支承、真实榫接和实际屋面形状仍未认证。

五轮候选原始日志保留于同目录。第二轮发现旧山坡椽最大约2.725m穿面；随后修正山坡高度函数，最终全包络检查通过。矩形梁导致旧“所有梁都斜”的假设检查失败后，按文献例外修正测试，并增加实际底面/梁顶承接检查，没有通过放宽容差隐藏问题。

### 实际UI和版本

使用内置浏览器可见控件操作、原始截图和DOM中本次已渲染状态，非静态HTML解析。正式页最终脚本 `app.js?v=jinci-20261016-02e`；模型使用e版、data使用d版，陶瓦与图录分别使用b/c版。源码与实际HTTP字节SHA256另存 `evidence/version-chain.json`；画面与状态对应的具体URL见各JSON，较早b版截图保留。

- 1600×1150桌面：7章、斜观/前檐/山面/后檐/俯视，四节点各0/50/100%、全殿0/50/100%、两剖切轴−100/0/100及反向、反向光、图层/配色/复位及键盘检查。有效取景投影在画幅内；剖切无封口。梁架步骤不显示围护与瓦面，不以外壳剖面替代结构可见性。
- 真实画布点击选中栌斗；另选择 `local/lower/3/1`，展开前后选择框Y移动1.5m、Z移动0.07m，仍对应同一实例。
- 快速盘龙照片→同章→下檐照片回看，先前旧相机动画造成投影越界的状态与截图保存为 `photo-link-before-fix.*`；取消旧动画后lower节点、章节2和取景均通过。
- 请求390视口时实际仍1600的失败保留于 `viewport-override-rejected.*`。有效窄屏为 `photos/preview.html?book=jinci&device=mobile` 中**实测390×844同源iframe**，scrollWidth=390；整殿、最大局部展开及图录控件均操作。此项是响应式布局检查，不是实体手机/GPU或外层视口覆盖成功。
- 9张高清和展示图、9个缩略图实际加载；初次只有自然尺寸、仍空黑的 `photo-0..8.jpg` 保留。修正共享查看器解码后布局与绘制等待后，9张逐张检查实际画面，最后以 `photo-painted-0..8.jpg` 为准。完整图、400%放大滚动、前后切图、末张禁用、方向键、Esc和焦点回到 `.photo-open` 均检查。400%表示适合窗口倍率，不是原片像素1:1。
- 照片返回实际lower/dragon节点；章节5同章选图保持08/09。不同建筑事件先核building，不触发其它卷。

[UI原始状态](updates/02/evidence/browser-ui.json)、[最终绘制图](updates/02/evidence/photo-painted.json)、[条件机位](updates/02/evidence/comparison.json)。独立条件A/B/C/D/E在固定边界下，实际1280×720；每条件有效截图为 `condition-native-<条件>-<视角>.jpg`；早期裁切和动画被测试点击打断的记录保留，不作通过证据。有效15场景取景通过，同视角相机一致，不和1600×1150正式页混成同一机位组。对照源已冻结；比较没有完成照片标定。

`tests/browser.mjs` 已修正为读取实际渲染状态，避免另import无版本app导致双初始化，并加入照片快速跳转回归。本轮实际UI证据来自内置浏览器操作；未把该独立headless runner记成已执行通过。它可用现有Playwright环境复放，`OUTPUT_DIR`可指定独立输出目录。

### 图录、网络和交付边界

[逐图覆盖与许可](updates/02/RESEARCH.md#实景覆盖与存储)，[原片/衍生完整性](updates/02/evidence/image-integrity.json)，[R2上传读回](updates/02/evidence/upload.json)。9张原作、27个WebP本地默认/备用文件和36个R2对象，各自口径不同。

- 上传和读回：36/36通过SHA256比对。
- 命令行公开GET：36/36为403，[原始结果](updates/02/evidence/public-http.json)。
- 独立浏览器公开探针：无备用回退的27/27 WebP通过decode，[结果](updates/02/evidence/public-browser.json)。不由任一客户端结果断定所有网络均可用或不可用。
- 正式页面本地展示/高清/缩略图全部可用，ICC保留；原片不生成式增强。9张高清已逐张目视。源码、素材和证据存在本地工作区，尚未网页发布。

真实性仍受限于原书/修缮原图、绝对尺寸、前槽及副阶全架、铺作类型/互锁/后尾、隐蔽支承、实际榫接、翼角脊饰、逐龙姿态拼合和现状装饰。缺少纯侧/背面及无遮挡内部梁架、上檐和转角近照。模型和软件检查不等于测绘或历史复原完成。

书架继续使用原入口；`https://readforfun-img.chunyangwen.com/chinese-architecture/jinci/previews/a47f4df74fec821e/whole.jpg`已替换为本轮实际最终模型截图，旧封面保存在第二轮baseline目录。主页面与窄屏浏览器warn/error记录均为0，见 `evidence/browser-logs.json`；工具侧选择器/截图捕获失败已另行保留，不写成页面异常。
