"""Compose unretouched final-run screenshots; original captures remain alongside."""
from pathlib import Path
from PIL import Image
import hashlib,json
base=Path(__file__).resolve().parent
run=base/'runs/02e'
images=[run/'desktop/facade-a.jpg',run/'desktop/facade-g.jpg']
result=Image.new('RGB',(2416,710),'#eeeade')
for i,p in enumerate(images):
    image=Image.open(p)
    assert image.size[0]==1280
    result.paste(image.crop((36,214,1244,924)),(i*1208,0))
result.save(base/'comparison.jpg',quality=93)
(base/'comparison-provenance.json').write_text(json.dumps({'operation':'two screenshot crops; no retouching or AI imagery','crop':[36,214,1244,924],'sources':{str(p.relative_to(base)):hashlib.sha256(p.read_bytes()).hexdigest() for p in images}},indent=2)+'\n')
