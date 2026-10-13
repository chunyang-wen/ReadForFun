#!/usr/bin/env python3
"""Apply the reviewed offline snapshot and rebuild both lookup indexes.
No network or third-party Python dependencies. Run after build_dict_data.py.
"""
import json
from collections import defaultdict
from pathlib import Path
from build_dict_data import parse_pinyin, split_shengmu_yunmu, SHENGMU_ORDER, RADICAL_STROKES_OVERRIDE

ROOT = Path(__file__).resolve().parents[1]
# These explanations are independently reviewed; uncertain source text is not inferred.
REVIEWED = {
    '毮': dict(p='shā', r='毛', s=11, es=7, structure='左右结构', wubi='RITN',
              stroke_code='12123433115', explanation='生僻字，读 shā。汉典收录该读音；详细现代汉语释义暂未核实。'),
    '龠': dict(p='yuè', r='龠', s=17, es=0, structure='上中下结构',
              stroke_code='34125125125125122', explanation='① 古代的一种管乐器，形似笛。\n② 古代容量单位，等于半合。'),
    '籥': dict(p='yuè', r='竹', s=23, es=17, structure='上下结构',
              stroke_code='31431434125125125125122', explanation='① 古代管乐器，同“龠”。\n② 古代鼓风吹火装置上的管子。\n③ 通“鑰”，指锁钥。'),
    '月': dict(explanation='① 月亮，地球的天然卫星。如：月光、月亮。\n② 计时单位，一年分为十二个月。如：月份。\n③ 每月的。如：月刊、月报。')
}

def read(relative):
    return json.loads((ROOT / relative).read_text().split('=', 1)[1].rstrip(';\n'))

def write(relative, name, data):
    (ROOT / relative).write_text('window.' + name + '=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')

def main():
    index, core = read('data/dict-index.js'), read('data/dict-core.js')
    corrections = json.loads((ROOT / 'scripts/data-corrections.json').read_text())
    for c, patch in corrections.items():
        if c not in index: continue
        e = index[c]
        old_count = e['s']
        e.update(patch)
        if old_count != e['s']:
            # A missing radical has no meaningful outside-stroke count.
            e['es'] = max(0, e['s'] - RADICAL_STROKES_OVERRIDE[e['r']]) if e['r'] in RADICAL_STROKES_OVERRIDE else None
        if c in core:
            ent = core[c]
            if ent['pinyin'] != e['p']:
                ent['explanation'] = '原始释义与校订读音不一致，详细释义暂待核实。'
                ent['words'] = []
            ent.update(pinyin=e['p'], strokes=e['s'], extra_strokes=e['es'])
            if len(ent.get('stroke_code', '')) != e['s']:
                ent['stroke_code'] = ''
    for c, patch in REVIEWED.items():
        index.setdefault(c, {}).update({k: v for k, v in patch.items() if k in ('p', 'r', 's', 'es')})
        e = index[c]
        if 'p' in patch: e.pop('ps', None)
        core.setdefault(c, dict(char=c, words=[], homophones=[], structure='通用结构', wubi='', stroke_code=''))
        core[c].update({k: v for k, v in patch.items() if k not in ('p', 'r', 's', 'es')})
        core[c].update(pinyin=e['p'], radical=e['r'], strokes=e['s'], extra_strokes=e['es'])

    # Preserve existing frequency order while including every stored reading.
    groups = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for c, e in index.items():
        for py in e.get('ps', [e['p']]):
            display, raw, tone = parse_pinyin(py)
            if not raw or raw == 'uu': continue
            sm, ym = split_shengmu_yunmu(raw)
            groups[sm][raw][str(tone)].append(c)
    pinyin_groups = []
    for sm in SHENGMU_ORDER:
        syllables = []
        for raw, tones in sorted(groups[sm].items()):
            ym = split_shengmu_yunmu(raw)[1]
            syllables.append(dict(syllable=raw, yunmu=ym, count=sum(map(len, tones.values())), tones=dict(tones)))
        if syllables:
            pinyin_groups.append(dict(shengmu=sm, count=sum(s['count'] for s in syllables),
                                      yunmu_list=list(dict.fromkeys(s['yunmu'] for s in syllables)), syllables=syllables))
    # Runtime derives homophones from these complete, tone-aware indexes.
    for c, ent in core.items():
        ent['homophones'] = []

    radicals = defaultdict(list)
    for c, e in index.items():
        if e['r'] and e['es'] is not None: radicals[e['r']].append(c)
    radical_groups = defaultdict(list)
    for rad, chars in radicals.items():
        by_extra = defaultdict(list)
        for c in chars: by_extra[index[c]['es']].append(c)
        count = RADICAL_STROKES_OVERRIDE.get(rad)
        if count is None: continue
        radical_groups[count].append(dict(radical=rad, count=len(chars), chars=chars,
            extra_groups=[dict(extra=k, chars=v, count=len(v)) for k, v in sorted(by_extra.items())]))
    # Keep the exact schema consumed by the drawer.
    previous = read('js/radical-data.js')
    sample = previous[0]['radicals'][0]
    for values in radical_groups.values():
        for item in values:
            if 'extra_strokes' in sample.get('extra_groups', [{}])[0]:
                for g in item['extra_groups']: g['extra_strokes'] = g.pop('extra')
    write('data/dict-index.js', 'DICT_INDEX', index)
    write('data/dict-core.js', 'DICT_CORE', core)
    write('js/pinyin-data.js', 'PINYIN_GROUPS', pinyin_groups)
    write('js/radical-data.js', 'RADICAL_GROUPS', [dict(stroke=s, radicals=r) for s, r in sorted(radical_groups.items())])
    print(f'Repaired {len(index)} entries; {len(corrections)} compact source corrections.')

if __name__ == '__main__': main()
