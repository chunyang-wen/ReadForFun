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


## 第二轮本地验收 · 2026-10-16

正式卷接入，页面未提交、推送或发布。改前源码、研究、失败与修正范围见[第二轮研究](updates/02/RESEARCH.md)。保留2026-10-14历史验收，不将其输出改写成本轮通过。

- `node --test chinese-architecture/kongmiao/tests/model.test.js chinese-architecture/tests/model.test.js`：22项通过。本卷15项、第一卷7项；新增最终Float32屋面绕序、单根脊桁、长坡／戗坡全部共边站位检查。
- `node chinese-architecture/kongmiao/updates/02/geometry.mjs --assert`：8坡无朝下面、无退化面、无重复脊桁。改前报告保留。
- `node chinese-architecture/kongmiao/updates/02/check-envelope.mjs`：2,309,376样点（实际实例圆柱顶点及中间截面），0解析坡面穿透、0所属有限坡域越界。改前83,678越界、初次内收与后续320越界均登记；最终最小竖向净空约0.12186m，不代表实物檐端／榫深或全部有限桁承接已核。
- `node --test chinese-architecture/photos/catalog.test.js`：当前共享14项通过，明确包含kongmiao章节、真实节点、许可与R2记录，保留并行其他卷条目。中间并行保和殿story未就绪导致的失败如实记在研究记录。

本轮真实UI为Codex IAB，桌面固定1280×960前后对照；窄屏实际innerWidth=390、innerHeight=844、scrollWidth=390。证据见[浏览器原始状态](updates/02/browser-final.json)及R2截图清单。实际加载app与model均`kongmiao-20261016-02-final`，源码与localhost响应字节校验见[source-sha256.json](updates/02/source-sha256.json)。

桌面逐步操作七章、五视角、全殿合拢／50%／100%、三节点合拢／中间／100%、局部回整殿，包围盒投影在画幅内。双轴剖切端点与反向、图层全显／屋面显隐、参考色／教学本色／构造分色、键盘与复位、画布真实射线拾取已操作。照片进入dragon、bracket、transition均核实实际节点；同章斜向照片保留当前选图。窄屏整殿、龙柱最大展开、高清弹层与400%滚动、Esc、返回打开按钮焦点通过。当前IAB错误／警告日志为空。

只读DOM记录于绘制后更新。早帧误读保留于`browser-final.json.earlyFrames`，最终逐项等待章节／节点／展开与可见控件一致后再测；不将旧静止帧的animating=false当成本次动作完成。旧browser.mjs改用只读DOM避免二次import初始化，本轮没有冒称完整旧headless runner重跑。未重验触屏真机、跨浏览器、WebGL失败注入或独立换光条件。

图录共11项：7张2012—2017原生高清实景（前檐、斜向两檐、柱廊／台基、龙柱、柱础、两檐脊饰、内景），2页1935测绘、2页1935出版的历史摄影。图注、原生像素、ICC、作者、许可与来源SHA1／SHA256均保留；没有生成增细。四张后补原片依Retry-After等待600秒后取得，见[重试记录](updates/02/photo-retry.json)。当代完整侧背面、完整无遮挡台基、侧后团龙及裸露梁架仍缺；内景照片不等于隐藏节点证据。

新增原片、缩略／展示／高清图与截图共76个对象全存R2，逐对象认证读回SHA256通过；命令行公开HTTP仍403，IAB成功解码显示全部11项图录资源单独记载（browser-final.json的photos与additionalPhotos合计11项），不作“所有客户端CDN可用”结论。上传清单及逐对象公开状态见[upload.json](updates/02/upload.json)；本地仅临时缓存，不作为交付fallback。原有历史媒体未删。

本轮没有完成摄影相机配准、主体比例测绘拟合、1935十二柱与地方志十柱口径统一、暗接／逐科斗拱／逐龙与彩画图谱复原，也未取得原书正文页图；这些边界保持不变。
