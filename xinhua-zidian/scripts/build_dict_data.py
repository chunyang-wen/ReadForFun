#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-performance Xinhua Dictionary compiler.
Produces ultra-compact, clean, zero-duplicate JavaScript datasets (< 2.5 MB total).
"""

import json
import os
import re
from collections import Counter, defaultdict

TONE_MAP = {
    'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4),
    'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
    'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4),
    'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
    'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4),
    'ǖ': ('v', 1), 'ǘ': ('v', 2), 'ǚ': ('v', 3), 'ǜ': ('v', 4), 'ü': ('v', 5),
    'ń': ('n', 2), 'ň': ('n', 3), 'ǹ': ('n', 4), 'm̄': ('m', 1),
}

RADICAL_STROKES_OVERRIDE = {
    '一': 1, '丨': 1, '丿': 1, '丶': 1, '乙': 1, '乛': 1, '亅': 1,
    '二': 2, '十': 2, '厂': 2, '匚': 2, '卜': 2, '冂': 2, '八': 2, '人': 2, '亻': 2,
    '入': 2, '勹': 2, '儿': 2, '匕': 2, '几': 2, '冫': 2, '冖': 2, '凵': 2, '刀': 2,
    '刂': 2, '力': 2, '又': 2, '厶': 2, '廴': 2, '讠': 2, '卩': 2, '阝': 2,
    '口': 3, '囗': 3, '山': 3, '巾': 3, '彳': 3, '彡': 3, '广': 3, '门': 3, '宀': 3,
    '辶': 3, '彐': 3, '尸': 3, '己': 3, '已': 3, '巳': 3, '弓': 3, '子': 3, '女': 3,
    '纟': 3, '马': 3, '幺': 3, '屮': 3, '弋': 3, '小': 3, '氵': 3, '忄': 3, '扌': 3,
    '夕': 3, '大': 3, '土': 3, '士': 3, '工': 3, '干': 3, '寸': 3,
    '木': 4, '犬': 4, '犭': 4, '歹': 4, '车': 4, '戈': 4, '比': 4, '瓦': 4, '止': 4,
    '攴': 4, '攵': 4, '日': 4, '曰': 4, '水': 4, '贝': 4, '见': 4, '牛': 4, '手': 4,
    '毛': 4, '气': 4, '片': 4, '斤': 4, '爪': 4, '父': 4, '月': 4, '氏': 4, '欠': 4,
    '风': 4, '殳': 4, '文': 4, '方': 4, '火': 4, '灬': 4, '斗': 4, '户': 4, '心': 4,
    '王': 4, '韦': 4, '車': 7, '韋': 9, '麥': 11, '魚': 11, '鳥': 11, '齲': 24, '褃': 13
}

def parse_pinyin(py):
    if not py:
        return '', '', 5
    py = py.replace('ɡ', 'g').replace(' ', '').strip()
    first_py = py.split(',')[0].split(';')[0]
    raw = []
    tone = 5
    for ch in first_py:
        if ch in TONE_MAP:
            base, t = TONE_MAP[ch]
            raw.append(base)
            tone = t
        else:
            raw.append(ch)
    raw_str = ''.join(raw).lower()
    return first_py, raw_str, tone

def extract_structure(more_text):
    if not more_text:
        return '独体字'
    patterns = [
        '左右结构', '上下结构', '左中右结构', '上中下结构',
        '全包围结构', '半包围结构', '品字形结构', '单一结构', '嵌插结构'
    ]
    for p in patterns:
        if p in more_text:
            return p
    if '独体' in more_text:
        return '独体字'
    return '通用结构'

def extract_stroke_code(more_text):
    if not more_text:
        return ''
    m = re.search(r'笔顺编号[：:]?\s*([0-9]+)', more_text)
    if m:
        return m.group(1)
    return ''

def extract_wubi(more_text):
    if not more_text:
        return ''
    m = re.search(r'五笔86[：:]?\s*([a-zA-Z]+)', more_text)
    if m:
        return m.group(1).upper()
    m2 = re.search(r'五笔[：:]?\s*([a-zA-Z]+)', more_text)
    if m2:
        return m2.group(1).upper()
    return ''

def extract_concise_explanation(exp):
    """提取新华字典规范的现代白话文释义，去除冗余古籍引文大幅缩小体积"""
    if not exp:
        return ''
    raw_lines = [l.strip() for l in exp.split('\n') if l.strip()]
    
    # 提取以数字/圈号开头的现代释义行 (如 ⒈、⒉、①、②)
    modern_lines = []
    for line in raw_lines:
        if re.match(r'^[⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑\d]+[、\.]|^[①②③④⑤⑥⑦⑧⑨⑩]', line):
            modern_lines.append(line)
        elif modern_lines and line.startswith('～'):
            modern_lines.append('  ' + line)
    
    if modern_lines:
        return '\n'.join(modern_lines[:8])
    
    # 如果没有圈号，过滤掉包含古籍引用 (--《...》) 的句子，保留前3行精炼释义
    filtered = [l for l in raw_lines if not ('--《' in l or '--宋' in l or '--清' in l or '--明' in l or '--汉' in l)]
    return '\n'.join(filtered[:4])

def main():
    dict_dir = 'ReadForFun/xinhua-zidian'
    data_dir = os.path.join(dict_dir, 'data')
    js_dir = os.path.join(dict_dir, 'js')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(js_dir, exist_ok=True)

    print("Loading raw word.json and ci.json from /tmp ...")
    with open('/tmp/word.json', 'r', encoding='utf-8') as f:
        words_data = json.load(f)
    with open('/tmp/ci.json', 'r', encoding='utf-8') as f:
        cis_data = json.load(f)

    # 1. 词频与组词统计（优先采用现代高频汉语词典，彻底解决“游泳、学习、学校”等常用词缺失问题）
    char_words_map = defaultdict(list)
    char_freq = Counter()

    if os.path.exists('/tmp/jieba_dict.txt'):
        print("Loading real-world modern Chinese vocabulary from /tmp/jieba_dict.txt ...")
        with open('/tmp/jieba_dict.txt', 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    w, f_val = parts[0], int(parts[1])
                    if 2 <= len(w) <= 4 and all('\u4e00' <= ch <= '\u9fff' for ch in w):
                        for ch in set(w):
                            char_freq[ch] += f_val
                            char_words_map[ch].append((w, f_val))
    else:
        # 备用词库
        for item in cis_data:
            w = item.get('ci', '').strip()
            if 2 <= len(w) <= 4 and all('\u4e00' <= ch <= '\u9fff' for ch in w):
                for ch in set(w):
                    char_freq[ch] += 1
                    char_words_map[ch].append((w, 1))

    # 为每个汉字按现代真实词频排序，优先双音节词（如“游泳、学生”）
    sorted_words_for_char = {}
    for ch, w_list in char_words_map.items():
        def word_rank(item):
            w, f_val = item
            len_bonus = 2.0 if len(w) == 2 else (1.2 if len(w) == 3 else 1.0)
            start_bonus = 1.5 if w.startswith(ch) else 1.0
            return f_val * len_bonus * start_bonus
        
        w_list.sort(key=word_rank, reverse=True)
        # 提取去重后的前 8 个精选高频组词
        seen = set()
        clean_words = []
        for w, _ in w_list:
            if w not in seen:
                seen.add(w)
                clean_words.append(w)
                if len(clean_words) >= 8:
                    break
        sorted_words_for_char[ch] = clean_words

    rad_strokes_map = dict(RADICAL_STROKES_OVERRIDE)
    for item in words_data:
        ch = item.get('word', '')
        st = item.get('strokes', '')
        if ch and st and st.isdigit() and ch not in rad_strokes_map:
            rad_strokes_map[ch] = int(st)

    # 2. 处理汉字数据
    processed_dict = {}
    pinyin_to_chars = defaultdict(list)
    radical_to_chars = defaultdict(list)
    pinyin_index_tree = defaultdict(lambda: defaultdict(list))

    for item in words_data:
        char = item.get('word', '').strip()
        if not char or not ('\u4e00' <= char <= '\u9fff'):
            continue
        
        raw_py = item.get('pinyin', '').strip()
        py_display, py_raw, tone = parse_pinyin(raw_py)
        strokes = int(item.get('strokes') or 0)
        radical = item.get('radicals', '').strip()
        rad_st = rad_strokes_map.get(radical, 3)
        extra_st = max(0, strokes - rad_st)

        more_info = item.get('more', '')
        structure = extract_structure(more_info)
        stroke_code = extract_stroke_code(more_info)
        wubi = extract_wubi(more_info)
        explanation = extract_concise_explanation(item.get('explanation', ''))

        # 真实高频常用词
        words = sorted_words_for_char.get(char, [])

        entry = {
            'char': char,
            'pinyin': py_display,
            'pinyin_raw': py_raw,
            'tone': tone,
            'radical': radical,
            'strokes': strokes,
            'extra_strokes': extra_st,
            'structure': structure,
            'stroke_code': stroke_code,
            'wubi': wubi,
            'explanation': explanation,
            'words': words,
            'freq': char_freq.get(char, 0)
        }
        processed_dict[char] = entry

        if py_display:
            pinyin_to_chars[py_display].append(char)
        if radical:
            radical_to_chars[radical].append({
                'char': char,
                'strokes': strokes,
                'extra_strokes': extra_st,
                'freq': char_freq.get(char, 0)
            })
        if py_raw:
            initial = py_raw[0].upper()
            if 'A' <= initial <= 'Z':
                pinyin_index_tree[initial][py_raw].append({
                    'char': char,
                    'tone': tone,
                    'freq': char_freq.get(char, 0)
                })

    # 同音字计算
    for char, entry in processed_dict.items():
        py = entry['pinyin']
        same_py = [c for c in pinyin_to_chars.get(py, []) if c != char]
        same_py.sort(key=lambda c: processed_dict[c]['freq'], reverse=True)
        entry['homophones'] = same_py[:12]

    # 选取常用规范汉字作为核心富文本字典
    # 1. 优先完整收录国家《通用规范汉字表》一级字表 (3500字)，确保像“泳、岁、哪、它”等现代高频字全部在列！
    core_chars = set()
    if os.path.exists('/tmp/level-1.txt'):
        with open('/tmp/level-1.txt', 'r', encoding='utf-8') as f:
            for line in f:
                ch = line.strip()
                if ch in processed_dict:
                    core_chars.add(ch)
        print(f"Loaded {len(core_chars)} characters from 《通用规范汉字表》一级字表")

    # 2. 结合词频补足到约 4200 字
    sorted_chars = sorted(processed_dict.keys(), key=lambda c: processed_dict[c]['freq'], reverse=True)
    for c in sorted_chars:
        if len(core_chars) >= 4200:
            break
        core_chars.add(c)

    for c in '永和道德墨雅学礼义仁智信天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏':
        if c in processed_dict:
            core_chars.add(c)

    core_dict = {}
    for c in core_chars:
        ent = processed_dict[c]
        core_dict[c] = {
            'char': ent['char'],
            'pinyin': ent['pinyin'],
            'radical': ent['radical'],
            'strokes': ent['strokes'],
            'extra_strokes': ent['extra_strokes'],
            'structure': ent['structure'],
            'wubi': ent['wubi'],
            'stroke_code': ent['stroke_code'],
            'explanation': ent['explanation'],
            'words': ent['words'],
            'homophones': ent['homophones']
        }

    # 超轻量全汉字检索索引 (仅保存拼音首字母/部首/笔画，排除冗余大词典)
    all_index = {}
    for c, ent in processed_dict.items():
        all_index[c] = {
            'p': ent['pinyin'],
            'r': ent['radical'],
            's': ent['strokes'],
            'es': ent['extra_strokes']
        }

    # 部首分类
    radicals_by_stroke = defaultdict(list)
    for rad, char_list in radical_to_chars.items():
        st = rad_strokes_map.get(rad, 3)
        char_list.sort(key=lambda x: (x['extra_strokes'], -x['freq']))
        radicals_by_stroke[st].append({
            'radical': rad,
            'count': len(char_list),
            'chars': [x['char'] for x in char_list]
        })
    
    sorted_rad_groups = []
    for st in sorted(radicals_by_stroke.keys()):
        rad_items = radicals_by_stroke[st]
        rad_items.sort(key=lambda x: -x['count'])
        sorted_rad_groups.append({
            'stroke': st,
            'radicals': rad_items
        })

    # 拼音分类
    sorted_pinyin_groups = []
    for initial in sorted(pinyin_index_tree.keys()):
        syllables = []
        for syl in sorted(pinyin_index_tree[initial].keys()):
            items = pinyin_index_tree[initial][syl]
            tones_map = defaultdict(list)
            for it in items:
                tones_map[it['tone']].append(it)
            for t in tones_map:
                tones_map[t].sort(key=lambda x: -x['freq'])
            
            syllables.append({
                'syllable': syl,
                'count': len(items),
                'tones': {t: [x['char'] for x in tones_map[t]] for t in sorted(tones_map.keys())}
            })
        sorted_pinyin_groups.append({
            'initial': initial,
            'syllables': syllables
        })

    # 3. 仅输出单一高效的 JS 数据文件（无需重复的 .json 文件，体积减半）
    core_js_path = os.path.join(data_dir, 'dict-core.js')
    index_js_path = os.path.join(data_dir, 'dict-index.js')
    rad_js_path = os.path.join(js_dir, 'radical-data.js')
    py_js_path = os.path.join(js_dir, 'pinyin-data.js')

    # 删除旧的冗余 .json 文件
    for old_file in ['dict-core.json', 'dict-index.json']:
        p = os.path.join(data_dir, old_file)
        if os.path.exists(p):
            os.remove(p)

    print(f"Writing {core_js_path} ...")
    with open(core_js_path, 'w', encoding='utf-8') as f:
        f.write('window.DICT_CORE=')
        json.dump(core_dict, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    print(f"Writing {index_js_path} ...")
    with open(index_js_path, 'w', encoding='utf-8') as f:
        f.write('window.DICT_INDEX=')
        json.dump(all_index, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    print(f"Writing {rad_js_path} ...")
    with open(rad_js_path, 'w', encoding='utf-8') as f:
        f.write('window.RADICAL_GROUPS=')
        json.dump(sorted_rad_groups, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    print(f"Writing {py_js_path} ...")
    with open(py_js_path, 'w', encoding='utf-8') as f:
        f.write('window.PINYIN_GROUPS=')
        json.dump(sorted_pinyin_groups, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    core_sz = os.path.getsize(core_js_path) / 1024 / 1024
    idx_sz = os.path.getsize(index_js_path) / 1024 / 1024
    rad_sz = os.path.getsize(rad_js_path) / 1024
    py_sz = os.path.getsize(py_js_path) / 1024
    total_mb = (core_sz + idx_sz + (rad_sz + py_sz) / 1024)

    print("\n=== 构建完成 ===")
    print(f"dict-core.js:  {core_sz:.2f} MB (收录 {len(core_dict)} 常用规范汉字白话释义/组词/同音字)")
    print(f"dict-index.js: {idx_sz:.2f} MB (收录 {len(all_index)} 全量汉字检索)")
    print(f"radical-data:  {rad_sz:.1f} KB")
    print(f"pinyin-data:   {py_sz:.1f} KB")
    print(f"==> 全部数据体积总计: {total_mb:.2f} MB (彻底杜绝大文件，完美适配 GitHub Pages！)")

if __name__ == '__main__':
    main()
