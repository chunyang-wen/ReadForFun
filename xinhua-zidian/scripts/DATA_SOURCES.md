# 字典数据校订（2026-10-14）

原库有重复字条，`uu / 义未详` 可覆盖正确记录；另有大量错配的读音和笔画数。当前网站使用开源数据，并非新华字典出版社提供的授权电子版。

- 读音：mozillazg/pinyin-data 的 pinyin.txt，Unicode 17.0 数据合并结果，MIT 许可。保留旧读音（只要在参考数据中有效），补充多音字读音；参考数据不支持旧读音时，改用其首个读音。
  https://github.com/mozillazg/pinyin-data
- 总笔画：Unicode 17.0.0 Unihan_IRGSources.txt 的 kTotalStrokes，多个地区值采用首值。地区字形和笔顺可能不同，该数据不代表所有字形的唯一标准。
  https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip
- 单独核实：毮、龠、籥、月的条目。毮的现代汉语详细释义尚未核实，不猜造释义。籥、龠为 yuè，月的同音字。已订正读音但未经核实的旧释义标明待核实。
  https://zdic.net/hans/毮
  https://zdic.net/hans/龠
  https://zdic.net/hans/籥
- 原始词条：pwxcoo/chinese-xinhua。原始释义质量仍参差不齐，本次校订不是全字典释义的人工审定。
  https://github.com/pwxcoo/chinese-xinhua

`data-corrections.json` 是仅供构建使用的紧凑校订快照，不在页面载入。比对旧索引，1747 个首读音不在参考读音中，7319 个笔画数不一致；快照亦含多音字补充，共 9959 个字的补丁。完整上游原库与 Unicode 压缩包不加入项目。

```sh
python3 xinhua-zidian/scripts/repair_dict_data.py
node xinhua-zidian/tests/dictionary-data.test.cjs
```

`build_dict_data.py` 在生成后自动执行校订。校订脚本可重复执行，重新构建拼音和部首索引；同音字在运行时按全部已收录读音与声调匹配，不采用截断列表。参考数据中包含古音、罕用读音，不能把每个多音字的所有读音都套到任意词语上。

## 笔顺数据与渲染

现有 Hanzi Writer 仅约 36 KB；逐笔拆解直接用 SVG。没有添加新库。每个字按需取一份 JSON，先本地，再 CDN。字体轮廓和笔画数不能自动提供可靠的笔顺、独立笔画路径及中线。

- 龠：hanzi-writer-data@2.0.1 的 17 笔矢量，约 4.8 KB，源自 Make Me A Hanzi / Arphic 字体，遵循 Arphic Public License。具体笔画名按已核实笔顺补充。
- 缺失字统一使用 `stroke-composer.js`：按 IDS 拆分复用现有笔画轨迹，支持左右、上下、左中右、上中下结构及嵌套。组合 SVG 轮廓和中线后，继续使用原有动画和逐笔展示。没有单字手绘补丁。
- `data/stroke-compositions.json` 含 6537 个可拆到现有轨迹部件的缺失字候选，178830 字节，仅遇到缺字时加载。候选不是全部经过人工审定的笔顺；字形比例根据通用规则模拟，左右／上下部件依次书写。组合总笔数必须与字典一致，不一致则拒绝展示动画。包围、重叠等结构和无法分解的部件仍回退到无轨迹提示。
- 例如：毮 = ⿰扌⿱少毛，籥 = ⿱竹龠，蔱 = ⿱艹殺。三字均通过真实部件数据的组合、笔数校验及页面验证。模拟字形标注“部件组合模拟”，支持播放、重播和逐笔高亮，不用于标准临摹评分。
- 拆分数据来自 cjkvi/cjkvi-ids 的 `ids.txt`（CHISE 派生数据，GPLv2）。保留生成脚本与 GPLv2 许可证；完整原始 IDS（约 2 MB）和 NPM 文件清单（约 1.2 MB）仅为构建输入，不加入项目。
  https://github.com/cjkvi/cjkvi-ids

重建与验证：

```sh
python3 xinhua-zidian/scripts/build_stroke_compositions.py /path/to/ids.txt /path/to/hanzi-writer-data-meta.json
node xinhua-zidian/tests/stroke-composer.test.cjs
```

- 原先的中线形状猜测算法会把短横误作点、撇误作竖钩，页面不再将其猜测当成标准笔画名。存在有效笔顺编号时显示基础类别（横/提、竖/竖钩、撇、点/捺、折笔）；没有可靠类别时只显示逐笔图形。
- 无法组合出轨迹时显示当前汉字和已收录的笔顺类别，并禁用动画与临摹按钮。没有可靠笔顺编号时明确显示暂无数据，不伪造动画。

许可证在 `../licenses/`。本地 JSON 依赖 HTTP 服务；直接通过 file:// 打开可能无法加载按字文件。
