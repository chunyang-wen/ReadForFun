# 第三卷正式接入 · 2026-10-16

本轮在正式 `yingxian/` 页面吸收独立研究的平柱方向修正，并接入四张实景。状态：本地改进，未提交、推送、上传R2或发布。

## 改动与未采用项

- 几何：10段外圈（含低回廊）共160组平柱铺作沿各面法向布置，绕各自柱头定位。稳定ID、柱网、标高和截面不改；角攒、内圈、梁架、瓦面以及落柱局部不改。依据为既有研究图20及理想八边关系，推广至各层仍为规整化假设，并非逐攒实测。
- 材料、光照：本轮均保留正式卷原值，便于归因；不将研究页D条件调色当成历史彩画。
- 未采用：研究页C1八面瓦口试件仍有明显拼接边界、未覆盖翼角，不搬入整塔。总高争议未消除，不进行统一拉伸。
- 对照：`buildModel` 默认使用修正方向；研究页显式采用 `alignOuterBrackets:false` 再运行原适配器，保持A/B原方向和C/D修正方向。历史基线文件及原截图不改；快照检查改为验证已保存SHA-256。
- 图录：复用共享组件，增加正式页面入口与双向章节事件。细部照片回到“装饰依身”的整塔位置，没有与“两种落柱”局部混用。

## 实景覆盖与许可

| ID | 对象 / 作者 / 日期 | 原始像素与许可 | 对应步骤与局限 |
| --- | --- | --- | --- |
| yingxian-whole-2025 | 全塔斜观；Yumeto；2025-06-04 | 3072×4096，CC BY-SA 4.0 | 01五明四暗；有仰拍透视，未经配准 |
| yingxian-aerial-2019 | 顶盖与院落俯瞰；Charlie fong；2019-09-28 | 3823×2150，CC BY-SA 4.0 | 05檐由架生；下层被遮挡，未经正射校正 |
| yingxian-corner-2007 | 转角铺作；Gisling；2007年10月 | 1500×998，CC BY 3.0 | 06装饰依身；所在层位未核，模型转角仍简化 |
| yingxian-ang-2007 | 昂与檐下木作；Gisling；2007年10月 | 1500×998，CC BY 3.0 | 06装饰依身；不能由表面照片推定暗卯 |

逐图原作链接、日期、作者、许可、原始SHA-256及Commons原始元数据位于 `../../photos/assets.json` 和 `../../photos/records/commons-metadata.json`。已目视四张完整画面，没有以类别名称替代对象核验。图片只缩小及转WebP，保留ICC（如有），不裁切、不增细、不改色；两张细部不放大冒充高清原片。

四图三种尺寸共12个WebP随站点本地交付（约4.6 MiB），原始JPEG链接直接指向Commons。没有上传R2，因此本轮不声明R2读回或CDN验收。准备工具扩充已核验的CC BY 3.0许可支持；其余照片和原上传记录保留。尚缺经核定的纯侧、背立面、暗层内景和节点测绘。

## 复现与证据

从仓库根运行：

```sh
node --test chinese-architecture/yingxian/tests/model.test.js chinese-architecture/yingxian/tests/study.test.js chinese-architecture/photos/catalog.test.js
python3 -m http.server 8765 --bind 127.0.0.1
```

浏览器需Playwright与Chrome，通过 `PLAYWRIGHT_MODULE`、`CHROME_EXECUTABLE` 指定本机安装位置；可用 `PREVIEW_URL` 改地址。

```sh
PREVIEW_OUTPUT=chinese-architecture/yingxian/updates/02/ node chinese-architecture/yingxian/tests/browser.mjs
node chinese-architecture/yingxian/tests/photos.mjs
```

`tests.txt` 保存24项全部通过的结构/研究/图录检查原始输出；新增检查逐件验证正式几何与研究适配器等价、非目标记录不改、全部实例矩阵与记录对应。`browser.txt` 保存七步骤、十层隔离、五视角、双轴剖切、拆合、拾取、键盘与窄屏检查，以及第一/二卷加载烟测。`photos-browser.json` 保存四图在1280×900和390×844两设备尺寸的高清解码、放大、Esc/焦点返回、双向步骤联动与研究页加载检查；该检查屏蔽Google Analytics请求，不把统计服务列为建筑测试对象。

本轮全貌、剖面、暗层、顶架、落柱合/拆、全塔最大拆解、桌面和窄屏截图均保存在本目录。图录另有 `desktop-atlas.jpg`、`mobile-atlas.jpg` 与每张高清弹层截图。已目视全貌、暗层和桌面/窄屏图录；软件检查不替代现状测绘与专业校核，窄屏模拟不等于真实手机GPU验收。

源码与资产清单校验见 `source-hashes.json`；历史 `study/runs/01-verified/` 不改写。本轮不重跑研究页全部12场景，研究页仅重新验证模型不变量、原A/C方向差异与页面加载；原有研究截图仍为上一轮记录。
