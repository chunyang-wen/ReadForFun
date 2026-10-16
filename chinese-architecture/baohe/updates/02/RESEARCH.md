# 第十卷第二轮：保和殿与直接相连台基

2026-10-16，本地正式卷已接入；没有提交、推送或发布网站。保留原版于 `baseline/`。本轮仅研究保和殿及共用三台北端裁域；没有增加太和殿、中和殿模型。历史首轮记录不改写。

## 证据与范围

杨乃济《保和殿后大石雕》印刷15页、曹振卿《云龙阶石》印刷94页重新取得，SHA256与首轮研究缓存逐字节一致；已目视复核两页。杨文区分露明16.57×3.07m与整料17.18×3.2×2.08m，1760重雕；曹文近似16.7m及九龙、卷草、江崖海水。保持两个口径，不平均、不把薄壳厚度当石料厚度。原页版权未授权再分发，PDF与研究图片只在临时研究目录，网站只链接来源。

故宫保和殿正文重新取得，字节与首轮一致，支持九间五间、重檐歇山、减前金柱六根及上下檐各角九兽。官方螭首网页本次字节不同，但标题和1080×1920原图地址一致；仅作研究，不上传其壁纸。独立来源状态及哈希见 [official-sources.json](official-sources.json)。原书合法正文、实例页码、逐柱测绘、石分件和内部水路仍待核。

## 实际改进与证据等级

| 项目 | 原版问题 / 本轮改动 | 等级与边界 |
| --- | --- | --- |
| 屋面与山花 | 8片瓦面有4片反向，共5120反向三角形；逐坡修正绕序，瓦面与山花改用正面材质、正面投影。山花改为跟随长坡边界的分段面，长坡/戗坡共享离散站位 | 几何修复；屋面曲线、收山、屋架标高仍为本卷推定，不是测绘曲面 |
| 椽包络 | 旧轴线检查遗漏3734个越边实体顶点；边列s收至±.995，下檐起止t=.01/.99、上檐=.004/.99。所有实体顶点及11个轴向中间截面检查 | 软件净空修正，不能称实物檐出、椽槽或传统构造尺寸 |
| 御路落位 | 旧测试将薄壳中线端点当台面；现在以薄壳局部Y=.12的可见上面端点对接三级教学台面，厚壳中心沿法线回退 | 露明长宽文献明确；薄壳厚.24、三层等高、坡角与踏级仍推定，未补石料埋入边界 |
| 栏间 | 相邻栏间408个望柱部件重复；去重并保留462个剩余望柱部件原ID与位置。重复部件仍预留旧序号，避免后续构件悄悄换号。直筒承托小柱改为瓶形连续轮廓 | 瓶形见官方图及2016相连台域照；曲率、尺寸和重复节距推定。未造暗榫 |
| 须弥座 | 硬折箱体改为上/下枭连续凹凸外皮，保持7带分层与同一转角边界，84个闭合外皮片检查非退化、闭合与正体积 | 可见轮廓判读；截面高宽、圆滑度、转角对称推定；不是逐石分块、内部空腔或加工图 |
| 殿体围护 | 按2012斜向原片补山面实心朱红围护，消除原来山面全敞的错误外观 | 一侧可见；对侧对称、.30m厚与8.40m高为教学推定。未推成砖墙修缮测绘 |
| 戗脊与小兽 | 补上下檐8角的随面戗脊；原只上檐36兽，现上下檐各角9个，共72个示意体，沿各自戗脊落位，保留上檐原ID | 数量文献明确；动物形态、距离与脊截面未复原 |
| 材质 / 光照 | 浅石由偏褐改为较中性的参考色，瓦粗糙度.64；保留旧材质条件，增加反方向光观察 | 摄影参考，不是色度测量、石种鉴定、风化采样或历史原色复原。默认灯位/强度保持基线 |
| 相机与拾取 | 新模式距离限幅提前设置；立即取景和拖动拆解都中止旧动画；画布尺寸变化按当前方向重解取景。公开只读DOM状态供验收 | 原版“须弥座局部→整殿木架”裁切失败实际复现；修正版同路径、实际拾取与选框随拆解通过 |

完整检查见 [geometry-report.json](geometry-report.json)、[stable-post-ids.json](stable-post-ids.json) 和 [tests-final.txt](tests-final.txt)。这些检查仅支持软件几何关系，不证明文物还原精度。

## 条件、固定视角与拒绝

- C0：原版模型/材质/默认光，`baseline/` 固定源；`serve-baseline.py` 只对预览加入减少动态与只读DOM报告，不修改旧模型字节。8767端口可复放。
- C1：新几何/旧材质/默认光，正式卷加 `?appearance=baseline`。
- C2：新几何/参考材质/默认光，正式卷默认条件。
- C3：C2勾选“换光”，反向灯位检查；没有把换光截图说成真实时刻日照。

1280×900桌面使用斜观、前檐、东向、北向、俯视与栏间、须弥座、木架预设。相机/target/投影与实际脚本URL保存在 [browser-checks.json](browser-checks.json)；交付脚本为 `app.js?v=baohe-02bearing`，模型revision为 `baohe-02-20261016-final-bearing`。最早未稳定/缓存待核截图保留，但只将 `before-fixed-*`、明确条件与交付截图用于对照。原版木架取景失败亦保留，未将其改写为通过。

没有执行数值摄影拟合。强制把当前总轮廓缩到29.5m、由1240㎡反推45×22柱网，均在优化前拒绝：量取基准未明，会让相机/台高/屋顶和柱距互相补偿，也缺独立北立面控制点。具体候选、拒绝理由及原片身份冲突见 [candidates.json](candidates.json)。不报还原度百分比。

## 五张授权原生高清照片

| ID | 内容与方位 | 原片像素 / 摄影者 / 日期 | 回看 |
| --- | --- | --- | --- |
| baohe-front-2012 | 南面，前景游客遮柱脚 | 5184×3235 / Gerd Eichmann / 2012-10-28 | 第1步整体 |
| baohe-oblique-2012 | 山面与两檐，斜观罗盘方向未核 | 4992×2679 / Gerd Eichmann / 2012-10-28 | 第1步整体 |
| baohe-front-terraces-2016 | 保和殿南侧直接相连台域；右前中和殿只作定位背景 | 4000×3000 / Another Believer / 2016-11-22 | 第2步层次 |
| baohe-north-ramp-up-2012 | 北侧独石，沿阶向上 | 3456×5054 / Gerd Eichmann / 2012-10-28 | 第3步实际ramp节点 |
| baohe-north-ramp-down-2012 | 北侧独石，从阶顶向下；远处乾清门不计本卷 | 3456×5184 / Gerd Eichmann / 2012-10-28 | 第3步实际ramp节点 |

均选用 **CC BY-SA4.0**；逐图原作链接、完整元数据与许可见 [sources.json](sources.json)。五原片SHA1均与Commons一致，原JPEG字节不改；5张高清、展示、缩略图等比处理，不增细、不AI补画。4张原片有3144字节ICC，衍生WebP逐字节保留；另1张无ICC，不伪造配置。见 [image-integrity.json](image-integrity.json)。

2016台域图早期候选曾按“north”暂记，原片检查见中和殿前景后，在首次正式导入/上传前改为 **front-terraces**。它不能证明北端栏间或北端螭首。其它分类候选也未以中和殿、太和殿补位；文件名/说明冲突的“North stair of Hall of Union”未采用。说明牌只作研究，雪景与重复御路未充作缺失新角度。

尚缺无遮挡北立面、纯侧背正射、北端螭首口和逐石须弥座雕刻专属高清、裸架与隐蔽节点。图录如实声明缺口，官方壁纸只有原站研究链接。

## 存储与公开可用性分开记载

20个照片对象（5原片+15WebP）全部使用独立 `chinese-architecture/photos/baohe-*/<原片SHA256前16位>/` 前缀，防覆盖写入、S3 API读回SHA256一致；页面各尺寸及原片链接均为R2，不把新本地备用当交付。工作缓存被Git忽略。R2失败备用映射同样指向R2，不静默依赖本机。见 [upload-photos-final.json](upload-photos-final.json)。

本轮命令行20个公开GET仍403；IAB真实显示5张R2高清，`currentSrc`均为公开域名，尺寸与原片一致，`data-ready=true`，其中第5张在真实390×844内部视口显示。见 [photo-browser.json](photo-browser.json)。这支持该浏览器上下文的公开可用，不表示域名在所有网络都已恢复，也不把S3成功当CDN恢复。来源站429/600秒等待和后续原片成功保存于 [download-history.json](download-history.json)。

新截图也上传R2，路径/哈希在根 `media-assets.json`，独立清单见 `upload-screenshots-final.json` / `upload-stable-id-final.json`。截图中的授权照片部分沿用CC BY-SA4.0及上述作者署名；原刊/官方研究图没有加入截图展示或R2。

## 本轮真实UI与限制

40项Node检查通过：本卷19、图录14、共享第一卷7；不借此宣告其它卷完整验收。完整椽包络443520点：越边0、穿瓦0；128个桁下支承顶位于有限桁段内，并按实际实例包围面修正旧检查误用半厚.14（实际.13）造成的.01m间隙；脊桁与帽梁的.01m软件间隙一并修正。8片屋面与2片山花的绕序、共边、非退化面另有本卷测试；84片须弥座外皮闭合且正体积。首轮“仅数部件/仅测椽轴”的通过不能替代本轮检查。

桌面实际操作覆盖七步、五视角、X/Z剖切两端与反向、自然/教学/系统色、换光、复位、四局部、整体与局部展开、真实画布石栏拾取、选框随移动、局部回整体、图录逐图高清/400%窗口放大与滚动/切图端点/左右键/Esc焦点返回/实际ramp节点/同章保留第5张。当前预览控制台检查error/warn为空，但没有捕获全量HTTP请求，不能扩大为全网络零错误。

IAB请求390视口后实际仍1280，失败尝试及原截图保留。成功窄屏使用 `photos/preview.html?book=baohe&device=mobile` 的同源iframe，内部**真实390×844、scrollWidth390**，实际建筑baohe、revision及脚本均核对。整体、四类局部最大展开、回整体、竖图高清与节点联动通过；见 [mobile-browser.json](mobile-browser.json)。此为真实窄宽度布局与UI操作，不是真机触屏/GPU仿真。

旧Playwright runner改为读DOM状态，避免再次import有初始化副作用的app，并把新输出默认放`/tmp`、适配根书架的建筑合集入口；本轮未执行该runner，实际UI验收使用CUA。新源码与本地HTTP响应字节核验见 [source-hashes.json](source-hashes.json)。

优先待补：北端带尺平面/抄平及清晰北立面；本殿减柱转承与梁架测绘；逐石/逐攒、石榫铁件与内沟探测；雕刻拓片和许可明确的专属细部摄影。当前屋角、斗科、山花、隔扇、天花和彩画仍是部分或教学表达，不因配图高清而升级。

### 收尾发现的明确木构差距（不并入通过项）

[桁椽接触诊断](timber-contact-unresolved.json)独立抽查16处中排椽段与有限桁盒：6处仍有确定的软件几何间隙，最大保守下界约0.311m；其余零下界只表示胶囊包络可能相交，不证明圆木实体接触。原始失败输出保存在 `timber-contact-known-failure.txt`，脚本有意返回非零。

这是现有教学屋面随横向翘角抬升、桁仍为直杆之间的关系差距；不能把“支承竖杆已接桁底”写成“桁已托住所有椽”。本轮没有为凑接触而凭空加垫木、改成曲桁或移植别殿木架，正文第6步已明确桁椽接触未全面闭合。完整梁架关系与角部支承仍须本殿测绘再修；40项通过不覆盖这项已知失败，不代表全木架验收通过。

保留ID复验见 `browser-closeout.json` / `mobile-closeout.json`；承托半厚与资料缓存修正后的最终复验见 `browser-bearing-closeout.json` / `mobile-bearing-closeout.json`。模型最终revision为 `baohe-02-20261016-final-bearing`，脚本 `app.js?v=baohe-02bearing`；较早截图/状态按其原revision保留。

资料缓存失败也原样保留：`browser-bearing-stale-data.json`当时新模型已加载，但未版本化的data.js仍显示旧“有支承”文字；对app/model的资料导入和图录备用模块加明确版本后，最终DOM确实显示“桁椽接触尚未全面闭合”。不能只看模型revision就认定讲解模块也更新。

截图存储补正：CUA返回真实JPEG字节，早期临时文件误用.png后缀；旧上传记录保留，当前上传按魔数发布.jpg及image/jpeg，字节不重编码，活跃映射由 `upload-screenshots-mime-corrected.json` 及根media-assets.json取代。最早封面裁切/场景不对应的候选未采用；最终独立页核对chapter0/detailfalse后截取完整画布，见 `cover-capture.json`。

## R2预览与对照

- [ui-bearing-whole.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/0a0ddac1bf6147c0/ui-bearing-whole.jpg)
- [ui-bearing-frame.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/d4734d7e6805320a/ui-bearing-frame.jpg)
- [before-fixed-side.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/72b77b521978f63e/before-fixed-side.jpg)
- [after-final-side.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/4c415706997aa725/after-final-side.jpg)
- [before-fixed-terrace.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/d58506fc5e9409e8/before-fixed-terrace.jpg)
- [after-final-terrace.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/f8331c3481f642e6/after-final-terrace.jpg)
- [ui-mobile-actual-ramp-exploded.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/fa6073c00483ddd9/ui-mobile-actual-ramp-exploded.jpg)
- [ui-photo-0.png](https://readforfun-img.chunyangwen.com/chinese-architecture/baohe/updates/02/25b63104e429de8b/ui-photo-0.jpg)
