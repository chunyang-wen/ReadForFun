# 第十三卷 · 本地验收

2026-10-14。[本地预览](http://localhost:8765/chinese-architecture/taimiao/)，独立目录。未提交、推送或发布，前卷模型、记录、测试与截图保留。

## 模型检查

`node --test chinese-architecture/taimiao/tests/model.test.js chinese-architecture/tests/model.test.js`

本卷10项＋第一卷7项，17项全部通过：三排柱网及独立站位、每柱接础、全模型和四节点有限正尺度/唯一ID/完整说明、十一檩及不等步架、短柱上下皮、横梁顶部在屋面下、上椽采样端点在瓦面下、下檐环带中空、十二层有内容、端坡脊下短柱不升到中央脊高。

上述是教学模型空间约束，不是68个实物柱位、工艺节点或力学的专业验收。测试不证明推定尺寸变成事实。

## 浏览器与交互

命令：`PLAYWRIGHT_MODULE=/Users/chunyangwen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node chinese-architecture/taimiao/tests/browser.mjs`

Chrome headless实际WebGL，Playwright：1600×1150桌面，390×844触屏手机模拟，1366×900正常动画。

- 七步切换、五预设视角、整体最大展开与四局部最大展开；包围盒八角投影均在画幅内。
- X/Z两轴剖切、−100/0/100端点、反向，十二层显隐/全显，三种配色、标注、复位通过。
- 四局部为上檐斗科、下檐角科、十一檩横架、金饰与天花；合拢/展开均保存真实渲染截图。表面标签随观察片向外移动。
- 选择器和画布射线实际拾取，鼠标拖动、滚轮、键盘旋转缩放与复位有效。
- 手机无横向溢出；CDP真实触摸事件模拟拖动改变相机，四局部及整体最大展开可取景。这不是手机GPU真机验收。
- 减少动态与正常动画两种路径可用。WebGL失败可读提示存在，但未人为触发，恢复路径未测试。
- 页面脚本异常0、建筑资源HTTP失败0。
- 第一卷、奉先殿、保和殿只读加载回归；未改前卷测试或运行其截图脚本。

## 视觉复核与修正

首轮整体/揭瓦截图发现端坡脊下短柱升到中脊标高；修正当地屋坡包络，添加自动回归。屋架局部最低檩原有悬空，补檐部占位梁及与底架相接的承垫；补间科与额枋之间补连续垫板。均明确标推定，不改称真实前殿节点。修正后重跑完整浏览器检查与截图。

已目视全貌、揭瓦、横架合拢、上檐斗科、角科最大展开及手机整体最大展开。最终`previews/`：whole（合集封面）、desktop、front、side、top、columns、column-grid、section、roof-frame、beam-frame、exploded；upper/corner/frame/finish的assembled与exploded；mobile-whole、mobile、mobile-exploded；collection-root。

## 合集增量整合

`taimiao/tests/collection.mjs`实际浏览器通过：13卡按1—13排序，十三卷徽标/摘要，第十三卷封面解码、详情入口、顶部/页脚返回合集，根书架唯一美轮美奂入口，没有独立太庙或孔庙根卡；太庙和孔庙搜索词存在。390×844合集无溢出，手机进入第十三卷并从页脚返回成功。既有十一、十二卡保留。`git diff --check`通过。

## 精度与未验证范围

原书实例及页图、完整前殿测绘剖面、逐柱材料和尺寸、后檐中部站位、各科跳数/后尾/暗销、梁端榫与桁接、端坡真实支座、飛椽和扇椽加工、逐石雕刻、天花与贴金工艺层、满文匾与历史陈设待核；跨浏览器、手机GPU真机、建筑保护专业核验未做。详情见 [MODEL_NOTES.md](MODEL_NOTES.md)。形制有据而细部推定，是此次交付的明确范围。
