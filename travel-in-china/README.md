# Travel in China · 中国旅行图志

成都首版：一套六张视觉概念样例，以及可以在 wonder 中直接打开的静态交互原型。暖白纸色、青绿与赭色、淡彩插画、文楷标题与宋体正文。面向中文大众及亲子读者，侧重文化阅读。

后续增加城市前，阅读 [城市制作指南](PRODUCTION_GUIDE.md)：包含内容标准、诗词人物关系、统计口径、视觉与 R2 流程、成都经验教训及可填写的工作单。

## 浏览

在仓库根目录启动任意静态服务器，例如 `python3 -m http.server 8873 --bind 127.0.0.1`，然后打开：

- `/travel-in-china/`：地图与目的地列表。
- `/travel-in-china/#/atlas?province=510000&city=chengdu`：四川与成都选中预览。
- `/travel-in-china/#/chengdu`：成都专题。
- `/travel-in-china/#/chengdu?chapter=eat`：“吃”章节。
- `/travel-in-china/#/chengdu/tea`：茶馆详情。其它文章使用 noodles、park、dujiangyan、opera、silk。
- `/travel-in-china/mockups/`：六张概念图，可跳到对应交互页面。

使用 hash 路由，因此 GitHub Pages 无需服务器重写或额外构建。直接以 file:// 打开不能加载本地 GeoJSON，请使用静态服务器。页面代码、字体子集和 GeoJSON 保存在本合集目录；所有图片由 Cloudflare R2 的 CDN 域名提供。图片 URL、字节数与 SHA-256 见仓库根目录 `media-assets.json`。

## 诗词、人物与地理数字

成都新增杜甫与草堂、薛涛与望江楼、诸葛亮与武侯祠三篇图文故事，共九篇。人文章节提供三首杜诗（含一首节选）的原文、原创白话解释、地方关联与三位人物卡片，支持按诗词/人物切换；搜索可匹配人物名和诗句。作品、人物、县级行政区与故事使用显式关系连接。诗人生活地、诗中提及地点与后世纪念地分别标注，避免把后世建筑当成唐代原貌。

- 全国：34 个省级行政区，分解为 23 省、5 自治区、4 直辖市、2 特别行政区。
- 省级选择：内地 31 个省级地区均提供《全国行政区划（2024 年底）》的地级/县级数量。地级市作为地级区划的子集显示，不能将两项再次相加。全国内地汇总为 333 个地级区划、293 个地级市、2846 个县级区划。来源年份始终注明，不将历史快照称为实时统计。原表备份为 `https://readforfun-img.chunyangwen.com/travel-in-china/assets/sources/002f3ad6683b4bea/nbs-divisions-2024.jpg`。
- 直辖市：直接解释县级区划，不把年鉴空白地级栏误认为“0 个城市”。香港十八区、澳门传统堂区、台湾地区县市制度采用各自来源和说明，不纳入内地地级/县级总数。澳门数字来自 2014 年文化地图，明确为文化地理线索，非当前行政区划统计。
- 成都：20 个县级行政区，分解为 12 区、5 个县级市、3 县。名称、代码与本地 `assets/chengdu-counties.geojson` 核对；数据源未给出统计生效年份，故仅注明 2026-10-16 核对日期。功能区不重复计算。展开目录可按区县筛选文章与诗人；未收录有空状态。
- 统计卡随地图省份与成都预览切换，在手机列表模式中也可阅读。来源与口径按需展开，图志收录量单独展示。

新增浏览入口：`#/chengdu/dufu`、`#/chengdu/xuetao`、`#/chengdu/wuhou`；`#/chengdu?county=510105&chapter=culture` 查看青羊区文化内容。

## 页面与状态

- 全国地图有 34 个可选择省级地区和 34 个省会、首府、直辖市与港澳台代表城市坐标，四川已收录成都。选择省份更新侧栏，选择城市出现预览，再点击“探索这里”进入。
- 地图已移除地区下拉框。所有省级地名与代表城市名均可点选，密集地名避让并以引线连接坐标；直辖市、港澳以城市名兼作地区名。
- “山河来信”随机打乱城市，每 8.5 秒换一封，同轮不重复。成都提供小吃、茶馆、杜甫故事直达，北京、南京、杭州、广州提供带官方资料来源的文化线索，其余为普通话问候。尚未收录城市进入地区预览，不冒充已有专题。
- 来信支持暂停、下一封、收起；地图悬停、焦点停留、页面隐藏或地图不在视口时停止自动更新。选择地区或成都时收起来信并暂停，返回城市阅读页时清理计时器。减少动态效果时默认暂停且无入场动画。没有新增图片或音频。
- 搜索可匹配中文/英文城市名、四川及文章主题。吃、玩、人文按文章标签筛选；茶馆同时属于吃与人文。
- 手机默认列表，可以切换地图。预览在地图之后的正常文档流中展开。地图在手机上可左右滑动，地名保持可读；小地区可通过名称选择。
- 地图路径、城市点支持 Tab 和 Enter/Space；区域、筛选、选中状态有相应的无障碍语义。空状态与地图加载失败有可执行的恢复入口。
- 地图选择、搜索、筛选和手机显示方式存储于 sessionStorage；每个页面的阅读位置在返回时恢复。禁用存储时仍可浏览，刷新后的状态不会持久化。
- 章节是连续正文中的锚点；三类存在交叉标签，因此九篇独立文章在不同章节重复出现。详情含图解小知识、故事、观察提示、亲子折叠问题、相关内容与来源。
- 动画遵循 prefers-reduced-motion；不需要账户或后端。未提供实时价格、按天行程或商家排名。

## 图片、字体与地理来源

- 六张概念样例与一张六格插画素材表使用 **内置 image_gen** 生成。完整提示词保存在 [mockups/prompts.json](mockups/prompts.json)。新增的人文三联画素材为 `https://readforfun-img.chunyangwen.com/travel-in-china/assets/56a99d4f2af00cab/chengdu-culture.png`，内置 image_gen 的完整提示词保存在 `assets/culture-prompt.json`。原始生成文件另留于 Codex 的 generated_images 目录，项目不引用该目录。
- 正文使用 `https://readforfun-img.chunyangwen.com/travel-in-china/assets/692246137f50a03d/chengdu-scenes.png`：三列两行，依次是担担面、茶馆、公园、都江堰主题河流景观、川剧、蜀锦。以 CSS 定位和裁切显示，页面文字与按钮独立实现。插画不作为历史建筑、工程或设备的精确复原依据。
- 概念图中的地图、文案和少量装饰存在生成误差；正式交互地图使用 GeoJSON，正文标注“AI 插画 · 艺术化呈现”。概念图中的额外导航、装饰及地点不表示本版已实现功能。
- 地理数据：阿里云 DataV，下载于 2026-10-16，原始地址 `https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json`，说明入口 `https://datav.aliyun.com/portal/school/atlas/area_selector`。本地保存原始 GeoJSON，省级边界按经纬度绘制，并含南海诸岛附图。为识别和探索提供方位示意，不用于精密测量。
- 字体：Google Fonts 分发的 LXGW WenKai TC、Noto Serif SC、Noto Sans SC，均为 SIL OFL 1.1。根据当前界面、区划名称与内容使用 fontTools 生成字符子集并保存在 `assets/fonts/`，许可证一并保留。浏览器字体回退补足后续新增字符。
- 文化资料链接集中于 [data.js](data.js)，并在每篇详情末尾显示。担担面来自四川省政府专题；茶馆来自中国供销合作网与央广网；川剧、蜀锦来自中国非物质文化遗产网；都江堰来自国家民委；公园活动来自成都本地报道。整理日期为 2026-10-16。

## 验证

浏览器测试为 `tests/browser.mjs`，依赖 Playwright 和 Chromium。默认测试地址为 `http://127.0.0.1:8873/travel-in-china/`，可通过 `TRAVEL_BASE_URL` 更改。

```sh
node travel-in-china/tests/browser.mjs
node travel-in-china/tests/map-motion.mjs
```

如果 Playwright 不在本项目的模块查找路径中，可通过 `PLAYWRIGHT_MODULE` 指定已安装模块的绝对路径；通过 `PLAYWRIGHT_EXECUTABLE` 指定现有 Chromium 可执行文件。

另运行 `node --test travel-in-china/tests/knowledge.test.mjs travel-in-china/tests/map-discovery.test.mjs` 验证全国合计、省级行数、成都区县与源几何一致性、诗词人物关系与来源完整性。

覆盖：34 个省级地区、地图与侧栏同步、键盘城市选择、二次确认、交叉分类与主题搜索、无结果和未收录状态、城市与文章直达、章节定位、浏览器历史和滚动恢复、390px 手机布局、折叠问题、地图加载失败后仍可选城市及重试，以及运行时 JS 错误。

测试截图输出于 `previews/`，不纳入版本控制；六张用于讨论的概念图存放于 R2，`mockups/` 仅保存展示页面和提示词。本地图片只作被 Git 忽略的工作缓存。
