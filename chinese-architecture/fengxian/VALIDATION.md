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

`previews/whole.jpg`为书架封面；`desktop.jpg`为完整桌面页面；`section.jpg`为主梁架剖面；`roof-frame.jpg`为揭瓦后的椽檩与两层骨架；`exploded.jpg`为最大系统展开；`mobile.jpg`为手机尺寸完整页面。另存`liujin-assembled/exploded.jpg`、`upper-assembled/exploded.jpg`、`joint-assembled/exploded.jpg`、`decoration-assembled/exploded.jpg`四组局部合拢/展开及`node-exploded.jpg`。

实际查看全貌、桌面、手机、剖面、屋架、系统展开、七踩/九踩节点、插入与装饰局部截图。截图不构成历史证据。

## 未验证及精度限制

原书合法正文、章节页码与图号映射；逐柱侧脚与变形；外檐6型/内檐4型逐科目录；转角鸳鸯交首互锁；真实卯口、铁活、后尾雕刻；包镶拼合木材；逐檩实测举折与推山；翼角与山面隐蔽交接；天花挂接；真实三交六椀曲棂、雕刻纹样、逐件瓦兽及历史配色；专业人员逐节点校核；真机与跨浏览器GPU；WebGL上下文恢复实测。详见[MODEL_NOTES.md](MODEL_NOTES.md)。本卷是有证据边界的交互研究模型，未达到修缮或加工精度。
