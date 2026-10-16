#!/usr/bin/env python3
"""Upload staged media to content-addressed R2 objects; write a verified URL manifest.
Run with `uv run --with 'boto3>=1.40' python scripts/publish_staged_media.py`.
Loads the existing Video2Book / ReadForFun local R2 configuration.
Does not print credentials, delete local files, or rewrite Git history.
"""
import concurrent.futures,datetime,hashlib,json,mimetypes,subprocess,urllib.parse,os,re
import boto3
from botocore.config import Config
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
env={}
for file in [ROOT.parent/'.envrc',ROOT/'.envrc',ROOT.parent/'.env',ROOT/'.env']:
 if file.is_file():
  for line in file.read_text().splitlines():
   match=re.match(r"^(?:export\s+)?(R2_[A-Z_]+)\s*=\s*(.*)",line.strip())
   if match:env[match[1]]=match[2].strip().strip("\"'")
env.update({k:v for k,v in os.environ.items() if k.startswith('R2_')})
client=boto3.client('s3',endpoint_url=env['R2_ENDPOINT_URL'],aws_access_key_id=env['R2_ACCESS_KEY_ID'],aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],region_name='auto',config=Config(retries={'max_attempts':5,'mode':'standard'},max_pool_connections=12))
bucket=env['R2_BUCKET_NAME'];base=env['R2_PUBLIC_URL'].rstrip('/')
extensions={'.png','.jpg','.jpeg','.webp','.svg','.mp3','.wav','.mp4','.gif','.ogg','.m4a'}
paths=[p for p in subprocess.check_output(['git','diff','--cached','--name-only','--diff-filter=AM'],cwd=ROOT,text=True).splitlines() if Path(p).suffix.lower() in extensions and (ROOT/p).is_file()]
# Existing photo derivatives are already content addressed on R2; reuse only after byte verification.
reuse={}
for a in json.loads((ROOT/'chinese-architecture/photos/assets.json').read_text()):
 for kind in ['display','thumb','full']:
  path=f'chinese-architecture/photos/fallback/{a["id"]}/{a["sha256"][:16]}/{kind}.webp'
  if str(a.get(kind,'')).startswith(base+'/'):reuse[path]=a[kind][len(base)+1:].split('#')[0]
def publish(path):
 data=(ROOT/path).read_bytes();digest=hashlib.sha256(data).hexdigest();key=reuse.get(path,f'{Path(path).parent}/{digest[:16]}/{Path(path).name}')
 mime=mimetypes.guess_type(path)[0] or 'application/octet-stream';uploaded=False
 try:
  body=client.get_object(Bucket=bucket,Key=key)['Body'].read()
  if hashlib.sha256(body).hexdigest()!=digest:raise ValueError('Existing object differs: '+path)
 except client.exceptions.NoSuchKey:
  client.put_object(Bucket=bucket,Key=key,Body=data,ContentType=mime,CacheControl='public,max-age=31536000,immutable',Metadata={'sha256':digest},IfNoneMatch='*');uploaded=True
  body=client.get_object(Bucket=bucket,Key=key)['Body'].read()
  if hashlib.sha256(body).hexdigest()!=digest:raise ValueError('Read-back mismatch: '+path)
 return path,{'url':base+'/'+urllib.parse.quote(key,safe='/'),'key':key,'sha256':digest,'bytes':len(data),'contentType':mime,'uploaded':uploaded,'readBackSHA256Verified':True}
previous=ROOT/'media-assets.json'
entries=json.loads(previous.read_text()).get('assets',{}) if previous.exists() else {}
verified=0
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 futures=[pool.submit(publish,p) for p in paths]
 for i,future in enumerate(concurrent.futures.as_completed(futures),1):
  path,item=future.result();entries[path]=item;verified+=1
  if i%25==0:print(f'Uploaded/verified {i}/{len(paths)}',flush=True)
manifest={'version':1,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicBase':base,'assets':dict(sorted(entries.items()))}
(ROOT/'media-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verified':len(entries),'uploaded':sum(v['uploaded'] for v in entries.values()),'bytes':sum(v['bytes'] for v in entries.values())}),flush=True)
