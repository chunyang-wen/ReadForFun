#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build script to compile Xinhua Dictionary data into compact, high-performance web assets.
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

# Missing radical stroke counts
RADICAL_STROKES_OVERRIDE = {
    '一': 1, '丨': 1, '丿': 1, '丶': 1, '乙': 1, '乛': 1, '亅': 1,
    '二': 2, '十': 2, '厂': 2, '匚': 2, '卜': 2, '冂': 2, '八': 2, '人': 2, '亻': 2,
    '入': 2, '勹': 2, '儿': 2, '匕': 2, '几': 2, '冫': 2, '冖': 2, '凵': 2, '刀': 2,
    '刂': 2, '力': 2, '又': 2, '厶': 2, '廴': 2, '讠': 2, '卩': 2, '阝': 2,
    '口': 3, '囗': 3, '山': 3, '巾': 3, '彳': 3, '彡': 3, '广': 3, '门': 3, '宀': 3,
    '辶': 3, '彐': 3, '尸': 3, '己': 3, '已': 3, '巳': 3, '弓': 3, '子': 3, '女': 3,
    '纟': 3, '马': 3, '幺': 3, '屮': 3, '弋': 3, '小': 3, '氵': 3, '忄': 3, '扌': 3,
    '夕': 3, '大': 3, '土': 3, '士': 3, '工': 3, '干': 3, '寸': 3, '弋': 3,
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
    # Take first pinyin if comma-separated
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
    # Look for patterns like 左右结构, 上下结构, etc.
    patterns = [
        '左右结构', '上下结构', '左中右结构', '上中下结构',
        '全包围结构', '半包围结构', '品字形结构', '单一结构', '嵌插结构'
    ]
    for p in patterns:
        if p in more_text:
            return p
    # Look for simple structure words
    if '独体' in more_text:
        return '独体字'
    return '通用汉字'

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

def clean_explanation(exp):
    if not exp:
        return ''
    # Remove leading/trailing empty lines and clean whitespace
    lines = [line.strip() for line in exp.split('\n') if line.strip()]
    return '\n'.join(lines)

def main():
    print("Loading word.json and ci.json from /tmp ...")
    with open('/tmp/word.json', 'r', encoding='utf-8') as f:
        words_data = json.load(f)
    
    with open('/tmp/ci.json', 'r', encoding='utf-8') as f:
        cis_data = json.load(f)

    print(f"Loaded {len(words_data)} characters and {len(cis_data)} words.")

    # 1. Build word frequency and character word map from ci.json
    char_words_start = defaultdict(list)
    char_words_contain = defaultdict(list)
    char_freq = Counter()

    for item in cis_data:
        w = item.get('ci', '').strip()
        if not w or not (2 <= len(w) <= 6):
            continue
        # Count frequencies
        for ch in w:
            if '\u4e00' <= ch <= '\u9fff':
                char_freq[ch] += 1

        first_ch = w[0]
        if '\u4e00' <= first_ch <= '\u9fff' and len(char_words_start[first_ch]) < 12:
            char_words_start[first_ch].append(w)
        
        for ch in set(w[1:]):
            if '\u4e00' <= ch <= '\u9fff' and len(char_words_contain[ch]) < 8:
                char_words_contain[ch].append(w)

    # Pre-populate common radicals strokes map
    rad_strokes_map = dict(RADICAL_STROKES_OVERRIDE)
    for item in words_data:
        ch = item.get('word', '')
        st = item.get('strokes', '')
        if ch and st and st.isdigit() and ch not in rad_strokes_map:
            rad_strokes_map[ch] = int(st)

    # 2. Process words_data
    processed_dict = {}
    pinyin_to_chars = defaultdict(list)
    radical_to_chars = defaultdict(list)
    pinyin_index_tree = defaultdict(lambda: defaultdict(list)) # initial -> syllable -> [ {char, tone, pinyin} ]

    for item in words_data:
        char = item.get('word', '').strip()
        if not char or not ('\u4e00' <= char <= '\u9fff'):
            continue
        
        raw_py = item.get('pinyin', '').strip()
        py_display, py_raw, tone = parse_pinyin(raw_py)
        strokes = int(item.get('strokes') or 0)
        radical = item.get('radicals', '').strip()
        
        rad_st = rad_strokes_map.get(radical, 3) # default fallback 3
        extra_st = max(0, strokes - rad_st)

        more_info = item.get('more', '')
        structure = extract_structure(more_info)
        stroke_code = extract_stroke_code(more_info)
        wubi = extract_wubi(more_info)
        explanation = clean_explanation(item.get('explanation', ''))

        # Words
        starts = char_words_start.get(char, [])
        contains = [w for w in char_words_contain.get(char, []) if w not in starts]
        words = (starts + contains)[:10]

        entry = {
            'char': char,
            'pinyin': py_display,
            'pinyin_raw': py_raw,
            'tone': tone,
            'radical': radical,
            'radical_strokes': rad_st,
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

        # Group for homophones
        if py_display:
            pinyin_to_chars[py_display].append(char)
        
        # Group for radical index
        if radical:
            radical_to_chars[radical].append({
                'char': char,
                'strokes': strokes,
                'extra_strokes': extra_st,
                'freq': char_freq.get(char, 0)
            })

        # Group for pinyin index
        if py_raw:
            initial = py_raw[0].upper()
            if 'A' <= initial <= 'Z':
                pinyin_index_tree[initial][py_raw].append({
                    'char': char,
                    'tone': tone,
                    'pinyin': py_display,
                    'freq': char_freq.get(char, 0)
                })

    print(f"Processed {len(processed_dict)} characters into structured entries.")

    # 3. Add homophones to entries
    for char, entry in processed_dict.items():
        py = entry['pinyin']
        same_py = [c for c in pinyin_to_chars.get(py, []) if c != char]
        # Sort homophones by frequency
        same_py.sort(key=lambda c: processed_dict[c]['freq'], reverse=True)
        entry['homophones'] = same_py[:16]

    # 4. Sort characters by frequency to select core set
    sorted_chars = sorted(processed_dict.keys(), key=lambda c: processed_dict[c]['freq'], reverse=True)
    # We select top 4,200 characters as the rich core dictionary (covers 99.9% daily lookups)
    core_chars = set(sorted_chars[:4200])

    # Ensure classic cultural characters are in core (e.g. 永, 和, 德, 道, 墨, 雅, etc.)
    classic_chars = '永和道德墨雅学礼义仁智信天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏'
    for c in classic_chars:
        if c in processed_dict:
            core_chars.add(c)

    core_dict = {c: processed_dict[c] for c in core_chars}
    print(f"Core dictionary has {len(core_dict)} characters.")

    # 5. Lightweight all-character index for searching & basic display of all 16,000+ chars
    all_index = {}
    for c, entry in processed_dict.items():
        all_index[c] = {
            'p': entry['pinyin'],
            'r': entry['radical'],
            's': entry['strokes'],
            'es': entry['extra_strokes'],
            'w': entry['words'][:4],
            'in_core': c in core_dict
        }

    # 6. Radical Index data for JS
    # Group radicals by their stroke counts
    radicals_by_stroke = defaultdict(list)
    for rad, char_list in radical_to_chars.items():
        st = rad_strokes_map.get(rad, 3)
        # Sort characters by extra_strokes, then freq
        char_list.sort(key=lambda x: (x['extra_strokes'], -x['freq']))
        radicals_by_stroke[st].append({
            'radical': rad,
            'count': len(char_list),
            'chars': [x['char'] for x in char_list]
        })
    
    # Sort stroke numbers and radicals inside
    sorted_rad_groups = []
    for st in sorted(radicals_by_stroke.keys()):
        rad_items = radicals_by_stroke[st]
        rad_items.sort(key=lambda x: -x['count'])
        sorted_rad_groups.append({
            'stroke': st,
            'radicals': rad_items
        })

    # 7. Pinyin Index data for JS
    sorted_pinyin_groups = []
    for initial in sorted(pinyin_index_tree.keys()):
        syllables = []
        for syl in sorted(pinyin_index_tree[initial].keys()):
            items = pinyin_index_tree[initial][syl]
            # Group by tone 1, 2, 3, 4, 5
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

    # 8. Output files
    os.makedirs('xinhua-dict/data', exist_ok=True)
    os.makedirs('xinhua-dict/js', exist_ok=True)

    print("Writing xinhua-dict/data/dict-core.json and dict-core.js ...")
    with open('xinhua-dict/data/dict-core.json', 'w', encoding='utf-8') as f:
        json.dump(core_dict, f, ensure_ascii=False, separators=(',', ':'))
    with open('xinhua-dict/data/dict-core.js', 'w', encoding='utf-8') as f:
        f.write('window.DICT_CORE = ')
        json.dump(core_dict, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    print("Writing xinhua-dict/data/dict-index.json and dict-index.js ...")
    with open('xinhua-dict/data/dict-index.json', 'w', encoding='utf-8') as f:
        json.dump(all_index, f, ensure_ascii=False, separators=(',', ':'))
    with open('xinhua-dict/data/dict-index.js', 'w', encoding='utf-8') as f:
        f.write('window.DICT_INDEX = ')
        json.dump(all_index, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    print("Writing xinhua-dict/js/radical-data.js ...")
    with open('xinhua-dict/js/radical-data.js', 'w', encoding='utf-8') as f:
        f.write('// 201部首检字表数据\nwindow.RADICAL_GROUPS = ')
        json.dump(sorted_rad_groups, f, ensure_ascii=False, indent=2)
        f.write(';\n')

    print("Writing xinhua-dict/js/pinyin-data.js ...")
    with open('xinhua-dict/js/pinyin-data.js', 'w', encoding='utf-8') as f:
        f.write('// 拼音检字表数据\nwindow.PINYIN_GROUPS = ')
        json.dump(sorted_pinyin_groups, f, ensure_ascii=False, indent=2)
        f.write(';\n')

    print("Build completed successfully!")
    print(f"dict-core.json size: {os.path.getsize('xinhua-dict/data/dict-core.json') / 1024 / 1024:.2f} MB")
    print(f"dict-index.json size: {os.path.getsize('xinhua-dict/data/dict-index.json') / 1024 / 1024:.2f} MB")
    print(f"radical-data.js size: {os.path.getsize('xinhua-dict/js/radical-data.js') / 1024:.2f} KB")
    print(f"pinyin-data.js size: {os.path.getsize('xinhua-dict/js/pinyin-data.js') / 1024:.2f} KB")

if __name__ == '__main__':
    main()
