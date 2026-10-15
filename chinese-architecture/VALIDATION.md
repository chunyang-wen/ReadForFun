# 第一卷真实性迭代与正式卷接入 · 03

2026-10-15（北京时间）。只处理第一卷佛光寺东大殿，原地址 `chinese-architecture/` 保留。正式版本 `foguang-production-03`，最终模型/图录验收在 [study/runs/03d](study/runs/03d/verification.json)。本地完成，未提交、推送、部署或上传R2。

## 结果与证据边界

| 验收线 | 有效改进 / 核验 | 仍未完成 |
| --- | --- | --- |
| 历史与身份 | 采用现存外观；2024照片与2013檐角照片分别署期。重新核对香港教育局PDF第2页的五门两窗与围护描述 | 原书版本、章节、页图仍未取得；逐件修缮分期、唐代门廊与历史原色未复原 |
| 空间构造 | 正式卷接入五间板门、两端直棂窗与围护；保留柱梁、原铺作、屋脊；四坡瓦面按本卷屋面函数生成。检查替换不误删、实际面法线、坡向、稳定ID、层归属和有限变换 | 围护厚度/标高、瓦距/搭接和屋面曲线仍推定；完整有限支承与逐椽全长包络尚未逐件核验；转角、内槽及补间互锁待详图 |
| 外观 | 采用研究页的灰瓦、木色与研究光照；四坡连续排瓦；新增4张授权照片，木构、墙带、真实瓦口与模型占位细部可对读 | 没有照片控制点配准；未修改柱网、屋面曲率或给出还原率。瓦当面纹、鸱尾、风化与内殿陈设仍未复原 |
| 软件 | 最终34项Node检查通过；桌面1280×900、窄屏390×844各15项模型及11项图录场景通过，日志错误/警告为空 | 不是实机触控、FPS、结构分析或测绘精度认证 |

正式模型由 `production-model.js` 适配原 `model.js`，不覆盖研究页A条件的几何。采用围护和全屋面适配器，**没有采用F条件的七处同型代表补间**。资料明确提示补间类型随位置变化；不能将单攒近照扩成逐攒事实。启动时已有的 `model.js` 四坡望板绕序修正和生产适配草稿均保留；本轮为实际面法线补回归，没有把既有修改另记为新发现。

原书对应表：

| 原书位置 | 第一卷问题 | 交互 | 补充证据 | 状态 |
| --- | --- | --- | --- | --- |
| 《美轮美奂》版次/章节/页码/图号待核 | 东大殿柱网、铺作、梁架、四阿屋面与围护 | 六步骤、图层、剖切、拆合、拾取、实景对读 | 本卷MODEL_NOTES和实验来源表；教育局PDF2；Commons逐图元数据 | 补充研究，未声称按原书逐页完成 |

## 分条件和固定观察

研究页保留A原版、B材料、C局部瓦片、D照明、E围护、F代表补间、G四坡瓦作。参数与变量见 [study/experiment.json](study/experiment.json)。本轮重新执行其23项检查，并经共享 `replay.mjs` 保存桌面/窄屏各20个场景（18个原用例，加A整殿与前檐基线），位于 `study/runs/03b/study-*`。研究页及依赖在该目录的 `study-verification/verification.json` 校验；没有引用旧轮通过记录充当本轮验收。

研究页A→G为多变量累积比较，正式卷又选择性采用了其中部分改动，二者不能写成同一个条件。正式卷改了照明与相机适配，与旧版正式截图也不构成单变量因果对照。

正式卷的机位由可见实例边界、画布宽高比与请求拆解量确定，透视居中后以±0.86 NDC留边；反向光前后相机数值一致。所有记录读取实际innerWidth/innerHeight及加载的app.js版本。世界坐标采用米、Y向上、X正北、Z正西前檐。显式状态在页面“可重放运行状态”；它是软件观测，不是测量结果。

没有可靠3D/2D对应点及独立配准视角，本轮不运行虚假的数值拟合；`evidence-fit.js`的拒绝条件用于守住该边界。未计算像素残差，不修改柱网或屋面高度来追逐一张未配准照片。

## 实景图录与存储

4张图片的逐图作者、日期、原始像素、许可、原作与改动保留在 `photos/assets.json`、`photos/records/commons-metadata.json`；原片SHA1与Commons一致，SHA256及字节数见 [foguang-03-sources.json](photos/records/foguang-03-sources.json)。已亲看原片，未生成式改色、补纹、移除树木或展陈。WebP沿用许可，保留原片ICC（如有）。

| ID | 用途 / 模型步骤 | 来源与许可 |
| --- | --- | --- |
| foguang-corner-context | 斜向台地、檐角与部分瓦面；观全貌 | Zhangzhugang，2013-08-28，CC BY-SA 3.0；树木遮挡，不能当作完整正立面 |
| foguang-facade | 前檐五门两窗的空间上下文；观全貌 | Patrick20242023，2024-05-23，CC BY-SA 4.0；标题“右侧面”不作罗盘方位 |
| foguang-eaves | 瓦口、檐下与铺作；循屋架 | 同上，CC BY-SA 4.0；尺寸、隐蔽支承不能由照片确定 |
| foguang-intermediate | 补间近照；回整殿定位柱间 | 同上，CC BY-SA 4.0；正式卷尚无准确补间局部，因此不跳到柱头冒充该节点 |

本轮未取得无遮挡完整正立面、纯侧面、后檐与带尺度正射控制点。2013与2024图不能据色差直接推断修缮变化。搜索中的 `Wutai 2009 507.jpg`明确是文殊殿，未采用；`Wutai 2009 496.jpg`作者说明做过镜像，未作为方位/节点方向证据或引入本图录。

本轮使用仓库内12个授权WebP（每图thumb/display/full），原始JPEG链接指向Commons。**未上传R2，无新增bucket读回或CDN可读结论**。本地图像浏览器解码、高清放大和滚动通过，备用路径存在且未被忽略规则排除。既有太和殿、太庙资产及URL未替换。首次Python下载返回403，改用curl后成功下载并校验SHA1，未改写失败为成功。

## 实际重放与失败保留

- `runs/03-initial`：29通过/1失败，取景占屏不足，保留原始输出。以世界盒中心取景无法保证透视居中；先居中投影再解距离后，取景回归通过。最终占屏下限为1.5 NDC且完整入框，不以世界中心推定画面中心。
- `runs/03a`：34项自动检查通过；首次桌面UI在局部最大展开时读取了上一帧的“已稳定”属性，重放失败。`setView`现在在开始动画前同步清除该属性，runner等到当前动作收敛；失败JSON和截图保留。
- `runs/03b`：两端12项正式模型检查及研究页40个条件/基线场景。之后只扩充本卷照片与验收场景；研究源码仍与此处hash匹配。
- `runs/03c`：最终四图下的模型与图录中间验收。`desktop/production-front.json`记录一次实际仍为390×844的视口失败；工具设置作用到了另一标签页，不能记为桌面通过。新建本轮目标标签页后检查真实尺寸，结果存 `desktop-final`。另有两端图录前后按钮、方向键与端点记录 `*-navigation.json`。
- **`runs/03d`：最终有效正式卷验收**。34项Node通过；两端各15项模型与11项图录，共52次场景捕获。原始JPEG、每场景JSON、汇总、最终源码hash及目视拼版均保留。两轴梁架剖面特地进入“辨梁架”步骤隐藏屋面/围护，避免整殿侧墙遮住结构却误记为剖面可读。

模型重放覆盖正面、斜面、山面、俯视、反向光、整殿两轴剖切、可读梁架两轴剖切、50%与100%分层、实际画布点选、选中框跟随局部最大拆合、隐藏后取消选择、构造分色。图录重放覆盖4图高清解码、横竖图、400%窗口放大与滚动、Esc/焦点返回、步骤跳转和同章节选图保留。前后按钮和方向键补检详见03c；这些代码至03d未变。

亲看最终正面、斜观、梁架剖面、最大整殿/局部拆解的桌面及窄屏拼版；画面完整，五门两窗、瓦面、木构层次可辨。投影盒只保障相机留边，不证明每个节点正确或标签无遮挡。后续优先取得逐柱标高、真实侧脚生起、逐攒补间/转角详图及实测瓦件，而非继续无据加密纹样。

## 重放入口

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/study/production-experiment.json
```

沿用已有HTTP服务；无服务时从仓库根运行 `python3 -m http.server 8765 --bind 127.0.0.1`。正式卷打开 `/chinese-architecture/?revision=foguang-production-03`，研究页打开 `/chinese-architecture/study/?revision=02e`。

在CUA取得目标 `tab`、`browser` 后，按共享README读取viewport接口，用真实尺寸核对后运行：

```js
const fs = await import('node:fs/promises');
const repo = '/absolute/path/to/ReadForFun';
const out = '/absolute/path/to/new/evidence-directory';
const config = JSON.parse(await fs.readFile(repo+'/chinese-architecture/study/production-experiment.json','utf8'));
const {replayProduction} = await import('file://'+repo+'/chinese-architecture/study/replay-production.mjs');
const {replayPhotos} = await import('file://'+repo+'/chinese-architecture/study/replay-photos.mjs');
const viewport = await browser.capabilities.get('viewport');
try {
 for (const device of ['desktop','mobile']) {
  await viewport.set(config.capture[device]);
  await tab.reload(); await tab.getAXState({emit:false});
  await fs.mkdir(out+'/'+device,{recursive:true});
  const save=(name,bytes)=>fs.writeFile(out+'/'+device+'/'+name,bytes);
  const model=await replayProduction(tab,save,config,device);
  const photos=await replayPhotos(tab,save);
  await fs.writeFile(out+'/'+device+'.json',JSON.stringify({model,photos},null,2));
 }
} finally { await viewport.reset(); }
```

本卷原查看器不是共享study控件契约，所以必须用本卷runner；`production-experiment.json`的patch/modes/conditions/views/checks保留02e研究溯源，正式用例在 `production.checks`。不要将它直接交给共享 `replay.mjs` 运行正式卷。研究页则使用原experiment与共享runner。代码变更后使用新导入版本及新run目录。

源代码、配置、素材与本轮截图最终校验见 [study/runs/03d/delivery-audit.json](study/runs/03d/delivery-audit.json)；文档更新不改写旧测试报告。
