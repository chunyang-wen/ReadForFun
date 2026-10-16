# 第七卷本地验收 · 2026-10-13

本地预览：[画中游垂花门](http://localhost:8765/chinese-architecture/huazhongyou/)。书架使用本卷实际WebGL截图。未提交、推送或发布。

## 模型检查

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js chinese-architecture/fengxian/tests/model.test.js chinese-architecture/jinci/tests/model.test.js chinese-architecture/qinian/tests/model.test.js chinese-architecture/huazhongyou/tests/model.test.js
```

最终 **82项通过**：第1卷7、第2卷7、第3卷9、第4卷13、第5卷18、第6卷14、第7卷14。

本卷14项验证：单排四柱/三间与柱位唯一；柱脚→独立础上皮→台面连续；十二悬垂位置的教学分配；前后挑梁连续跨过柱位且覆盖悬柱轴线；梁底与悬柱头接合、垂花头肩接悬柱脚、悬柱不落地；侧面中央高起及两侧起伏；随形架所有顶点和长边采样在屋面边界内；36片连续瓦面与两个独立端山边缘；短柱从梁顶承接曲架下皮；檩沿X/椽沿Z与名义承接曲线；通用口的四边实体与间隙、−Z进入方向；门扇分别绕两根竖轴转动、矩阵复原、不添加屏门；全体几何/实例矩阵/包围盒/稳定ID/来源有效；门扇0—75°扫掠厚度避让两内柱。

复核发现初始门扇在55°以上轻微碰柱，调整轴X从±1.06为±1.035、门叶宽由1.025为1.00后重新检查0—75°每5°，对每叶厚度和宽度采样。该检查只约束教学门叶与柱，不证明原物铰轴和开启范围。曲架与承檩下皮也重新对齐；曲线分段只是绘制方法，不是实际接木清单。

这些是模型内部空间不变量检查，不证明十二垂头的分配、暗榫、雕刻或绝对尺寸达到文物实测精度。

## 实际浏览器检查

Chrome headless + Playwright，真实WebGL。桌面1600×1150；手机390×844带触屏模拟；1366×900减少动态。最终几何/标签/资料更新后重新运行通过。

- 七步骤分别切换，任务与层位同步；五相机预设取景成功。
- 挑梁、垂花雕刻、屋架、通用穿插口四局部合拢/最大展开包围盒八角投影都在画幅内。
- 整体0/50/100%展开均取景通过；门扇开启后包围盒重新计算，合回与复位恢复整体。
- X/Z移动剖切、−100/0/100端点、正反保留可操作；不提供实体剖面封口。
- 九层逐层隐藏后不进入射线候选，隐藏清除选中框和构件选择器候选；全隐藏时选择器仅剩提示；全部显示与复位成功。
- 实际画布射线拾取、下拉构件选择与证据面板工作；旋转拖动、滚轮缩放、键盘方向/缩放/0视角均断言相机改变或复位。
- 局部标注受遮挡与剖切约束；最终检查发现屋架标签接近，加入屏幕矩形避让后重新截图。
- 手机没有横向溢出；触屏CDP拖动后相机改变，局部最大展开仍取景通过，复位回到整体。手机模拟不等于真机GPU。
- 减少动态设置下节点切换与取景可用，加载错误区域未出现。
- 前六卷页面均只读加载成功，标题对应正确建筑、三维初始化没有错误；六卷模型测试重新执行。没有替前卷宣称专业或全部交互复验。
- 书架第七卷卡片唯一，封面实际加载，点击路由正确；最后一次运行脚本异常0、HTTP资源错误0。
- 并行任务期间后续卷目录、书架卡片与第八卷交付补记出现。重新读取共享文件后按第七卷范围增补，保留这些内容；不改写它们的模型、不据目录出现推断后续交付。
- `git diff --check`通过。

复现：复用8765静态服务；网站运行无需Playwright。

```sh
python3 -m http.server 8765
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' node chinese-architecture/huazhongyou/tests/browser.mjs
```

可设 `PREVIEW_URL` 替换地址。

## 最终截图

`previews/whole.jpg`书架封面；`desktop.jpg`完整桌面；`front.jpg`看面；`back.jpg`背面；`side.jpg`侧面；`top.jpg`单排柱网俯视；`section.jpg`剖面；`roof-frame.jpg`揭瓦骨架；`exploded.jpg`最大展开；`doors-open.jpg`门叶演示；`mobile-whole.jpg`手机整体画幅；`mobile.jpg`手机局部最大展开长图。

四局部各有 `beam-*`、`lotus-*`、`roof-*`、`joint-*` 合拢与最大展开。最终实际查看桌面、整体、剖面、手机整体和局部长图、最大展开、门扇开启、雕刻/挑梁/屋架局部。截图证明本次显示结果，不是文物证据。

## 未验证与精度边界

原书正文、实例收录、比例尺和全部绝对尺寸；本门原始平面、十二垂头分布、隐藏节点、柱身升线、真实梁檩椽加工目录、起伏屋顶谷槽排水与防水层、门扇数量/五金/轴位/实际启闭、真实木材和雕刻刀法/纹样/拼合、历次油饰色谱、完整山地院落；专业逐节点审核、实体手机与跨浏览器GPU、WebGL恢复。见[MODEL_NOTES.md](MODEL_NOTES.md)。本门材料示意不是历史配色，通用穿插口非实例实测，遂初堂对照不冒充主模型。


## 第二轮验收 · 2026-10-16

正式本地卷revision `huazhongyou-20261016-02c` 已接入；未提交、推送、发布。保留上文2026-10-13记录，不借本轮替别卷重新验收。

- `node --test chinese-architecture/tests/model.test.js chinese-architecture/huazhongyou/tests/model.test.js chinese-architecture/photos/catalog.test.js`：**36项通过**（7+19+10），原始输出[tests.txt](updates/02/tests.txt)。本门新增向上法线、零退化、接缝法线、斜椽/檩有限接触、有限架顶射线及完整椽身顶点检查。
- 基线864个屋面三角形朝下→最终864个朝上；椽檩保守胶囊最差重叠约0.04085m→数值零，见[metrics.json](updates/02/metrics.json)。这是教学几何检查，不是实物测绘/受力结论。
- IAB真实可见控件：最终桌面1246×890，七章节/五视角/四节点0、50、100%，24场景状态；390×844整体和四节点最大展开5场景投影不裁切。隐藏清选中，选中柱展开后世界包围盒Y变化0.20，门叶演示、两轴剖切及反向光/淡木/分色操作。照片实际进入chapter4/lotus；同一步选图保留。窄屏scrollWidth=390。未声称真机触摸GPU已验证。
- 共享图录三张othree照片、CC BY2.0、2015-05-24，原片SHA1匹配，三张R2高清在IAB解码显示原生像素。高清缩放/适合窗口/Esc/前后切图实际操作；原图与所有衍生图已上传R2并读回SHA256一致。命令行公开访问403仍存在，不把IAB成功扩为CDN在所有网络恢复。没有新提交本地媒体。
- 基线与最终1280×720初始斜观原始整页截图，以及多角度、剖面、局部、反向光、窄屏、三图弹层均在R2，地址/哈希见[上传记录](updates/02/upload.json)和根media-assets.json。证据JSON见[桌面](updates/02/browser-final-desktop.json)、[拾取等](updates/02/browser-final-extra.json)、[窄屏](updates/02/browser-final-narrow.json)、[图录](updates/02/browser-photos.json)。实际脚本版本与localhost响应字节核对见[source-hashes.json](updates/02/source-hashes.json)。
- 中间02版本淡木材质错误、Float32退化失败及离屏/读上一帧造成的工具断言均在[研究记录](updates/02/RESEARCH.md)说明，最终02c复验。旧headless全站runner未作为本轮通过依据。

照片尚缺纯侧面、背面、完整挑梁后尾与裸架；现有木石雕刻仍为明显简化。尺寸拟合因无标定、原平面与独立第二立面而未采用。绝对尺寸、十二头分布、隐蔽接头、薄承托补全、谷槽排水、真实门轴和逐纹装饰仍待核，详见[本轮研究](updates/02/RESEARCH.md)。
