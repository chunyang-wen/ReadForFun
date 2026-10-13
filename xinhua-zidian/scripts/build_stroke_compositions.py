#!/usr/bin/env python3
"""Compile only composable dictionary entries missing from hanzi-writer-data.
Usage: build_stroke_compositions.py /path/to/ids.txt /path/to/npm-meta.json
No third-party packages. IDS source and metadata are build inputs only.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARITY = {'⿰': 2, '⿱': 2, '⿲': 3, '⿳': 3}
# Generic glyph variants, not individual-character drawing exceptions.
ALIASES = {'⺮':'竹', '𥫗':'竹', '⺿':'艹', '⻀':'艹', '⺾':'艹', '⺅':'亻', '⺡':'氵', '⺘':'扌', '⺖':'忄'}

def main(ids_path, meta_path):
    index = json.loads((ROOT/'data/dict-index.js').read_text().split('=',1)[1].rstrip(';\n'))
    files = json.loads(Path(meta_path).read_text())['files']
    available = {Path(f['path']).stem for f in files if f['path'].endswith('.json') and len(Path(f['path']).stem)==1}
    descriptions = {}
    for line in Path(ids_path).read_text().splitlines():
        fields = line.split('\t')
        if len(fields)>=3 and fields[0].startswith('U+'):
            descriptions[fields[1]] = [re.sub(r'\[[^]]*\]', '', d) for d in fields[2:]]

    def parse(text):
        chars=iter(text)
        def read():
            c=next(chars)
            return [c,*[read() for _ in range(ARITY[c])]] if c in ARITY else c
        tree=read()
        if next(chars,None) is not None: raise ValueError('Unsupported IDS')
        return tree

    def resolve(tree, trail):
        if isinstance(tree,list): return [tree[0],*[resolve(c,trail) for c in tree[1:]]]
        leaf=ALIASES.get(tree,tree)
        if leaf in available: return leaf
        if leaf in trail or len(trail)>8: raise ValueError('Cycle or excessive depth')
        for desc in descriptions.get(leaf,[]):
            try: return resolve(parse(desc),trail|{leaf})
            except (ValueError,StopIteration): pass
        raise ValueError('No drawable component')

    compositions={}
    for char in index:
        if char in available: continue
        for desc in descriptions.get(char,[]):
            try:
                tree=resolve(parse(desc),{char})
                if isinstance(tree,list): compositions[char]=tree
                break
            except (ValueError,StopIteration): pass
    target=ROOT/'data/stroke-compositions.json'
    target.write_text(json.dumps(compositions,ensure_ascii=False,separators=(',',':'))+'\n')
    print(f'{len(compositions)} composable missing glyphs; {target.stat().st_size} bytes (lazy loaded).')
    for c in '毮籥蔱': print(c,compositions.get(c))

if __name__=='__main__': main(*sys.argv[1:])
