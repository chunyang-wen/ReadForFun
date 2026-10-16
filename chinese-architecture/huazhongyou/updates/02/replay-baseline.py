"""Recreate the preserved viewer at the same URL depth, without altering snapshots."""
from pathlib import Path
root=Path(__file__).parent;out=root/'replay-generated';out.mkdir(exist_ok=True)
for name in ['app.js','model.js','data.js','index.html']:
 s=(root/'baseline'/name).read_text().replace('../vendor/','../../../../vendor/')
 if name=='index.html':s=s.replace('href="style.css"','href="../../../style.css"')
 (out/name).write_text(s)
