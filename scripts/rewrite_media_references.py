#!/usr/bin/env python3
"""Replace concrete webpage/document media paths using the verified R2 manifest.
Leaves test output paths and historical JSON evidence untouched.
"""
from pathlib import Path
import json,re,subprocess
ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'media-assets.json').read_text());assets=manifest['assets']
files=set(subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0'))
pattern=re.compile(r'''(["'(\x60])([^"'()<>\s\x60]+\.(?:png|jpg|jpeg|webp|svg|gif|mp3|wav|ogg|m4a|mp4|webm))(?=["')\x60])''',re.I)
changed=[]
for name in sorted(files):
 p=ROOT/name
 if not p.is_file() or p.suffix not in {'.html','.css','.md','.js'} or '.test.' in name or '/tests/' in name:continue
 def replace(m):
  value=m[2]
  if value.startswith(('https:','http:','data:')):return m[0]
  try:relative=(p.parent/value).resolve().relative_to(ROOT).as_posix()
  except ValueError:return m[0]
  return m[1]+assets[relative]['url'] if relative in assets else m[0]
 old=p.read_text();new=pattern.sub(replace,old)
 if old!=new:p.write_text(new);changed.append(name)
fallbacks={path.removeprefix('chinese-architecture/photos/'):entry['url'] for path,entry in assets.items() if path.startswith('chinese-architecture/photos/fallback/')}
(ROOT/'chinese-architecture/photos/r2-fallbacks.js').write_text('// Verified R2 equivalents for newly archived local derivatives.\nexport const R2_FALLBACKS = '+json.dumps(fallbacks,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({'updatedFiles':changed,'r2PhotoFallbacks':len(fallbacks)},ensure_ascii=False))
