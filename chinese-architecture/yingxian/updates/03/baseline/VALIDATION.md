# 第三卷本地验收 · 2026-10-13

状态：本地预览；未提交、推送或发布。第三卷 `chinese-architecture/yingxian/`。第一卷 `chinese-architecture/` 和第二卷 `chinese-architecture/dule/` 保留。书架新增入口使用本卷实际模型截图。

## 模型回归

仓库根目录运行：

```sh
node --test chinese-architecture/tests/model.test.js chinese-architecture/dule/tests/model.test.js chinese-architecture/yingxian/tests/model.test.js
```

**23项全部通过**，第一卷7、第二卷7、第三卷9。第三卷覆盖：

- 五明四暗和独立低回廊，每段采用不同柱网数据。
- 24外柱、8内柱唯一位置，八个角柱，各面平柱中心距按原表值而非等分。
- 对边距基准与原表参数保留，不用优化表修正值。
- 所有后续柱脚有明确环梁承托，环梁顶与柱脚标高对应。
- 四暗层分别有径向与弦向斜撑，端点连接基部梁和上柱架。
- 二层明层外圈平柱特有的一栱五斗，不在其他明层机械复制。
- 插入与梁上退落分开；插入柱端进入贯通口，退落柱脚接完整梁面；无观音阁叉柱脚。
- 五个檐裙内侧不封塔心，顶部独立攒尖；顶层架端不越屋面控制曲线。
- 全部记录、实例矩阵与包围盒有限；构件ID唯一，来源和状态完整。

曾发现局部演示层ID被当作数字层号，导致出挑参数NaN；已修复并以全模型和局部的矩阵/边界检查防止复发。对边距测试最初取了斜面Z分量，改为正南平面基准；模型仍采用表1原值。

这些检查证明实现中的空间不变量，不能证明教学环梁、推定截面和节点形态已经达到文物测绘精度。

## 浏览器与交互

Chrome headless + Playwright，真实WebGL渲染；1600×1150桌面、390×844触屏模拟。最终代码修改后重跑通过。

- 七章节和五预设视角切换；所有十个单层选项逐个隔离，检查实际可见实例层位无泄漏。
- 最大系统展开和局部拆合；全部可见模型包围盒八个角点投影在画幅内。展开后旋转、复位正常。
- X/Z剖切方向，-100/0/100端点和反向保留；剖面无实体封口。
- 关键构件选择器、真实画布射线拾取（成功断言），选中证据与ID可读。
- 图层关闭和全部显示、构造分色、标注、键盘方向/缩放/恢复。
- 手机页面无横向溢出，局部最大展开完整取景；触屏模拟不等于真机验收。
- 第一、二卷仍加载正确建筑，WebGL错误区域未出现；三卷本轮脚本异常0，HTTP资源失败0。
- 书架第三卷卡片唯一、实际封面图片加载，点击进入第三卷成功；页面脚本异常0。
- `git diff --check` 通过；原有未提交/未跟踪内容保留，第三卷独立目录实现。

复现浏览器检查，需可用Playwright和Chrome：

```sh
python3 -m http.server 8765
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROME_EXECUTABLE='/absolute/path/to/Google Chrome' node chinese-architecture/yingxian/tests/browser.mjs
```

可通过 `PREVIEW_URL` 覆盖服务器地址。本机已运行的8765静态服务用于本次检查。

## 最终预览

- `previews/whole.jpg`：完整六檐与塔刹；书架封面。
- `previews/desktop.jpg`：桌面完整页面。
- `previews/section.jpg`：九段主骨架剖切。
- `previews/hidden-storey.jpg`：三层暗层隔离与半剖，双向撑。
- `previews/top-frame.jpg`：五层明层及顶部八角檐架，无瓦面。
- `previews/node-assembled.jpg`：两种连接合拢。
- `previews/node-exploded.jpg`：两种连接最大拆合。
- `previews/exploded.jpg`：全塔系统最大展开。
- `previews/mobile.jpg`：手机尺寸长图。

已人工查看全貌、桌面、暗层、顶架、局部合拢/展开、系统最大展开与手机截图。截图只能表明本轮渲染和阅读状态，不能补足缺失的节点证据。

## 未验收项

专业人员逐件/逐节点校核、真实移动设备GPU和跨浏览器表现、WebGL上下文恢复实测、全部54种铺作、135°转角真实互锁、逐层实际内柱圈/辅助柱、总高抄平口径、真实加工榫卯、装饰历史状态及原书正文页码。详见 [MODEL_NOTES.md](MODEL_NOTES.md)。


## 2026-10-16 正式卷升级记录

本轮在正式卷接入平柱立面法向修正及四图实景图录。结构、研究适配和图录检查，以及桌面/窄屏实际WebGL交互记录见 [updates/02/README.md](updates/02/README.md)，原始输出与新截图保存于同目录。2026-10-13的23项成绩为历史记录；本轮不以该数量代替新验证。页面仍在本地，未发布。
