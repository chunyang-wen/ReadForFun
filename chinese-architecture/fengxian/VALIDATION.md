# 第四卷本地验收 · 2026-10-13

状态：本地运行；未提交、推送、发布。预览：[第四卷奉先殿前殿](http://localhost:8765/chinese-architecture/fengxian/)。书架已新增本卷实际模型封面与入口。前三卷路由保持原址。

## 模型检查

从仓库根目录执行：

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js chinese-architecture/fengxian/tests/model.test.js
```

最终 **36项通过**：第一卷7、第二卷7、第三卷9、第四卷13。

第四卷验证：

- 九段不等开间、45.44×23.41m基准、五排50个不重复柱位，中心排保留实柱。
- 檐柱/金柱两种高径，柱脚与莲瓣础对应；台基上皮→柱顶下皮→柱脚承托面无间隙。
- 七踩/九踩的3/4个外出站位、下檐三个斜抬内尾、上檐不机械复制溜金后尾。
- 表三平身科数量独立于柱头和转角；推定山面科单独标识。
- 16.89m主梁、下梁顶与短柱脚、上梁顶与檩下皮承接；外挑承托条落在末排斗肩之上。
- 端部独立太平梁/雷公柱；靠山面两横架缩短；全部屋架顶点在所建瓦面下，不仅核查中心端点。
- 下檐四片裙面留矩形中孔，上屋四坡边界一致。
- 局部观察口0.11m容纳0.09m后尾，区别于前卷叉柱；观察口仍是教学推定。
- 旋子落枋面、天花落内檐、棂心及铜叶落门窗，内外檐材质分开；无移植藻井。
- 全殿及四组局部记录/ID/实例矩阵/几何顶点/边界均有效。

曾发现靠山面两横架高层伸出坡面，改用独立缩短范围并新增完整顶点检查；外挑承托条初始层位低于末排斗肩，重排局部层位并新增承托回归。台基最后层曾距柱顶下皮4cm，修正为1.6m上皮并检查柱脚连续性。测试不把这些教学空间约束升级为真实文物加工精度。

## 浏览器验证

Chrome headless + Playwright，实际WebGL渲染。1600×1150桌面；390×844手机触屏模拟；1366×900减少动态设置。最后模型修改后重跑。

- 七步骤与五预设视角全部切换，章文、观察任务、节点菜单和开关同步。
- 四个局部逐一切换：七踩溜金、九踩正身、溜金插入、装饰。每个合拢与最大展开均检查可见包围盒八个角点投影在画幅内。
- 整殿最大展开、合回、复位，取景检查通过。
- X/Z剖切轴、−100/0/100端点与反向保留，剖面可渲染；没有生成实体封口。
- 层显隐、全部显示、教学木色/构造分色、标注和键盘方向/缩放/恢复通过。
- 关键构件选择器显示证据，画布实际射线拾取成功断言。
- 手机无水平溢出，局部最大展开完整取景。属于触屏模拟，未在真实手机GPU验证。
- 减少动态设置下节点切换通过。
- 前三卷页面仍加载各自建筑，无三维失败区域；四卷本轮页面脚本异常0，HTTP资源错误0。
- 书架第四卷卡片唯一，实际封面加载成功，点击进入奉先殿成功。
- `git diff --check`通过；原有README、书架和第一卷笔记改动保留；未覆盖第二、三卷及既有未跟踪文件。

复现：先在仓库根目录运行静态HTTP服务，本次复用既有8765服务：

```sh
python3 -m http.server 8765
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' node chinese-architecture/fengxian/tests/browser.mjs
```

可用`PREVIEW_URL`覆盖地址。网站本身不需Playwright或安装依赖，Three.js/OrbitControls已本地分发。

## 最终截图

`https://readforfun-img.chunyangwen.com/chinese-architecture/fengxian/previews/5088d22f33bc0219/whole.jpg`为书架封面；`desktop.jpg`为完整桌面页面；`section.jpg`为主梁架剖面；`roof-frame.jpg`为揭瓦后的椽檩与两层骨架；`exploded.jpg`为最大系统展开；`mobile.jpg`为手机尺寸完整页面。另存`liujin-assembled/exploded.jpg`、`upper-assembled/exploded.jpg`、`joint-assembled/exploded.jpg`、`decoration-assembled/exploded.jpg`四组局部合拢/展开及`node-exploded.jpg`。

实际查看全貌、桌面、手机、剖面、屋架、系统展开、七踩/九踩节点、插入与装饰局部截图。截图不构成历史证据。

## 未验证及精度限制

原书合法正文、章节页码与图号映射；逐柱侧脚与变形；外檐6型/内檐4型逐科目录；转角鸳鸯交首互锁；真实卯口、铁活、后尾雕刻；包镶拼合木材；逐檩实测举折与推山；翼角与山面隐蔽交接；天花挂接；真实三交六椀曲棂、雕刻纹样、逐件瓦兽及历史配色；专业人员逐节点校核；真机与跨浏览器GPU；WebGL上下文恢复实测。详见[MODEL_NOTES.md](MODEL_NOTES.md)。本卷是有证据边界的交互研究模型，未达到修缮或加工精度。

## 第二轮本地验收 · 2026-10-16

状态：正式第四卷本地已接入本轮几何、材质、光照和实景图录；未提交、推送或发布网站。起始工作区干净，工作期间出现的晋祠卷与该卷共享增量保留。本卷历史previews及2026-10-13验收不覆盖。独立原始证据：[updates/02/](updates/02/research.md)。

### 几何与组件

执行 `node --test chinese-architecture/tests/model.test.js chinese-architecture/fengxian/tests/*.test.js chinese-architecture/photos/catalog.test.js`，本轮35项通过：第一卷7、奉先殿原13及新增7、共享图录8。共享测试已明确导入fengxian章节与节点，不再误验其他默认建筑。

新增检查覆盖八坡望板/琉璃表面朝上且非退化、屋面内边与角脊缝配对、椽链从坡界起步并连续到檐口、全圆柱顶点与教学屋面包络、每个有限檩站位端点的支承包络交叠、后檐中五间通口/其余及山面槛窗、局部溜金接收木不重复。支承包络相交不证明真实承压面、榫口或结构安全；全顶点检查仅覆盖本轮椽体及原有梁架范围，不声称已完成全部杆件实体碰撞检查。

基线与候选日志分别保存：baseline-audit.json、candidate-audit.json、final-audit.json。旧望板159面朝下、2个退化面；最终八坡望板与外观覆盖共425790个有效三角面朝上、反向/退化均0。20878段椽体、2087800顶点中21308个位于屋缘/敞口外，单列不算已遮盖；有覆盖范围顶点穿出0，椽链间隙0。初候选8点微穿面、Float32后4个退化面已保留，修正后复验。数量表示软件几何，非文物件数或精度成绩。

### 浏览器与版本链

`updates/02/browser.mjs`通过当前卷可见控件验收。Chrome真实WebGL，桌面1600×1150、窄视口实际390×844（触屏模拟，非真机）。40个状态和原始截图保存在本轮目录，完整状态见browser.json。

- 五视角、七步骤、四个局部各0/50/100%展开，整殿0/50/100%展开；两轴剖切−100/0/100及反向；有围护全貌与无遮围护梁架剖切分别检查。
- 实际画布射线拾取、关键构件下拉、显隐、复位、教学木色、分色、键盘；同一ID展开后世界选中框变化，当前坐标随实例移动。
- 修正局部→整殿取景时旧maxDistance100钳制：先更新整殿上限再放置相机。失败状态及原图保存在browser-limit-failure.json、chapter-6-limit-failure.png；不是通过放松投影断言解决。验收脚本的响应正文捕获曾遇304/重定向无正文，原始日志browser-cache-failure.txt保留，最终只对200响应保存正文SHA256。
- 当前实际加载app/model/roof-skin均为`?v=fengxian-02-delivery`，共享gallery及catalog实际URL和响应字节SHA256保存在browser.json；与本地受检源码逐项核对。状态查询导入真实页面script src，避免多次初始化不同查询串的app。
- 图录三张高清逐张实际绘制；前后按钮、左右键、400%滚动、Esc/焦点返回、梁架步骤及decoration实际节点、同一步保留当前选图均检查。窄屏无横向溢出。首张窄屏高清截图曾在解码后、绘制前保存为空黑，保留mobile-photo-before-paint.png；等待可见/解码及绘制后另存最终mobile-photo.png，软件尺寸不能替代目视。
- 几何/材质/光照分别保留geometry-only、geometry-material、geometry-light与正式组合，另有reverse-light换光；全貌、后檐通口、梁架剖面、局部和最大拆解均目视检查。
- 最终页面脚本异常0，资源HTTP错误0（本地素材为主地址）。这不抹去命令行公开图片域名403的独立网络结果。真机、跨浏览器GPU、上下文恢复和全部杆件碰撞仍未验证。

运行：复用8765静态服务，`PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node chinese-architecture/fengxian/updates/02/browser.mjs`。截图为原始PNG，本目录.gitignore给本轮PNG限定例外，确保可交付，不只存在本机。

### 照片、存储与缺口

三张均为CC BY-SA3.0；Martin Wehrle，2010-12-27，3872×2592内景；蒋亦炯，2010-07-13，2832×4178梁枋天花仰视及2832×4256展陈上下文。作者未逐图注明前/后殿，按前殿浑金、柱列、同一钟表展陈和故宫调查图交叉判读。第三张以前景钟表为主，背景可能是展览围护，不计无遮挡装修特写。逐图来源、许可、原始SHA1/SHA256、ICC比对与衍生图像素/哈希见photo-evidence.json、sources.json。

- 当前12个R2对象（每图原片+三种WebP）防覆盖上传，S3读回SHA256全部通过；upload.json为当前活动ID结果。初次导入误用2009的两个ID已修正为2010，upload-initial.json保留；未删除此前独立哈希对象。
- 命令行公开HTTP：12项全部403，见public-http.json。
- 本轮Chrome网络：三张R2高清URL全部实际解码成功；与命令行403分开报告，不声称所有用户CDN已恢复，见photo-browser.json。
- 三种尺寸本地WebP共9个全部解码、ICC与原片一致。页面使用本地衍生图为主地址，原JPEG链接Commons，R2地址另存。原始字节未改动，未做生成式增细、改色或裁切。
- 无遮挡全貌、正/侧/背立面、外檐七/九踩科、屋角、裸露屋架、真实棂花/面叶近照和溜金隐藏后尾尚缺。远景5184×3456原片429，保存600秒Retry-After，未接入或计数；未以缩图替代高清。

模型仍是有明确边界的研究展卷，逐檩举折、转角互锁、真实卯口、天花挂接、三交六椀曲棂、逐纹样、瓦兽目录、历史颜色与原书正文未解决。未做照片数值拟合，不报告还原度百分比。统一经验新增于PRODUCTION_GUIDE.md，无新增平行规范。

验收收尾期间，另一会话更新共享gallery的高清decode/绘制同步。保留该更改，以`gallery.js?v=fengxian-02-gallery-sync`重新执行本卷40场景，高清检查等待本次图片ready标记；旧browser-before-shared-gallery.json保留，最终browser.json记录当前依赖响应。不是将另一卷的通过结果当作第四卷验收。
