# 第三卷 · 应县木塔真实性研究

本地预览：<http://localhost:8765/chinese-architecture/yingxian/study/?mode=d&view=patch>

- [前后对照](comparison.html)：最终同机位截图与原始大图。
- [研究与步骤](RESEARCH.md)：采用阶段、照片/文献用途、参数证据、改动归因与未决问题。
- [验收与重放](VALIDATION.md)：本轮实际测试范围、命令、CUA复放代码。
- [完整配置](experiment.json)：固定机位、视口、来源、参数和场景。
- [最终证据](runs/01-verified/verification.json)：源码SHA-256、环境、完整配置与测试结果。

独立适配器只在研究页使用：平柱铺作沿八面法向排列，首层回廊八面中央灰瓦搭接试件；保留基线以比较。正式第三卷及合集入口保持原有实现。当前仍是局部研究，未取得足以完成全塔测绘复原的资料。

静态服务可从仓库根运行 `python3 -m http.server 8765 --bind 127.0.0.1`；无构建或新增运行依赖。共享生成器按MIT依赖使用；外部照片只作研究链接，没有分发为贴图。
