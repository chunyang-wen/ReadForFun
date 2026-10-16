"""Publish only this round's reviewed media; credentials remain in existing local env files."""
import os,re,json,pathlib,hashlib,datetime,concurrent.futures,urllib.request,sys
import boto3
ROOT=pathlib.Path(__file__).resolve().parents[4]
env={}
for file in [ROOT.parent/'.envrc',ROOT/'.envrc',ROOT.parent/'.env',ROOT/'.env']:
 if file.is_file():
  for line in file.read_text().splitlines():
   m=re.match(r'^(?:export\s+)?(R2_[A-Z_]+)\s*=\s*(.*)',line.strip())
   if m:env[m[1]]=m[2].strip().strip('\"\'')
env.update({k:v for k,v in os.environ.items() if k.startswith('R2_')})
c=boto3.client('s3',endpoint_url=env['R2_ENDPOINT_URL'],aws_access_key_id=env['R2_ACCESS_KEY_ID'],aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],region_name='auto')
screenshots_only='--screenshots-only' in sys.argv
previous_file=pathlib.Path(__file__).parent/'upload.json'
prior_objects=json.loads(previous_file.read_text()).get('objects',{}) if previous_file.exists() else {}
source=pathlib.Path('/tmp/kongmiao-02/prepared');jobs=[]
assets=json.loads((ROOT/'chinese-architecture/photos/assets.json').read_text());records=[]
for a in assets:
 if screenshots_only or not a['id'].startswith('kongmiao-'):continue
 for kind in ['original','display','thumb','full']:
  f=(('original.pdf' if a.get('sourceType')=='commons-pdf-page' else 'original.jpg') if kind=='original' else kind+'.webp');file=source/(a['id']+'-'+f);key=a[kind].split(env['R2_PUBLIC_URL'].rstrip('/')+'/')[1].split('#')[0];path=f'chinese-architecture/photos/fallback/{a["id"]}/{a["sha256"][:16]}/{f}'
  jobs.append((file,key,path,('application/pdf' if a.get('sourceType')=='commons-pdf-page' else 'image/jpeg') if kind=='original' else 'image/webp'))
# Research/render screenshots are published too; never add local image bytes to Git.
for file in pathlib.Path('/tmp/kongmiao-02').glob('*.png'):
 digest=hashlib.sha256(file.read_bytes()).hexdigest();prior=prior_objects.get('chinese-architecture/kongmiao/updates/02/media/'+file.name);
 if screenshots_only and prior and prior.get('sha256')==digest and prior.get('readBackSHA256Verified'):continue
 key=f'chinese-architecture/kongmiao/updates/02/{digest[:16]}/{file.name}';jobs.append((file,key,'chinese-architecture/kongmiao/updates/02/media/'+file.name,'image/png'))
def upload(job):
 file,key,path,mime=job;data=file.read_bytes();digest=hashlib.sha256(data).hexdigest()
 try:c.put_object(Bucket=env['R2_BUCKET_NAME'],Key=key,Body=data,ContentType=mime,CacheControl='public,max-age=31536000,immutable',IfNoneMatch='*')
 except c.exceptions.ClientError as e:
  if e.response['Error']['Code'] not in ['PreconditionFailed','412']:raise
 read=c.get_object(Bucket=env['R2_BUCKET_NAME'],Key=key)['Body'].read();assert hashlib.sha256(read).hexdigest()==digest
 url=env['R2_PUBLIC_URL'].rstrip('/')+'/'+key
 try:
  r=urllib.request.urlopen(url,timeout=25);public={'status':r.status,'sha256Matches':hashlib.sha256(r.read()).hexdigest()==digest}
 except Exception as e:public={'status':getattr(e,'code',None),'error':type(e).__name__}
 return path,dict(url=url,key=key,sha256=digest,bytes=len(data),contentType=mime,uploaded=True,readBackSHA256Verified=True,publicHTTP=public)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: records=list(pool.map(upload,jobs))
# Re-read shared manifests immediately before merging; preserve other volumes.
p=ROOT/'media-assets.json';manifest=json.loads(p.read_text());manifest['assets'].update(dict(records));manifest['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
sources=json.loads((pathlib.Path(__file__).parent/'sources.json').read_text());sha1={r['id']:r['info']['sha1'] for r in sources}
p=ROOT/'chinese-architecture/photos/assets.json';assets=json.loads(p.read_text())
for a in assets:
 if a['id'].startswith('kongmiao-'):a.update(sourceSHA1=sha1[a['id']],r2Only=True,storage='R2 uploaded and SHA256 read-back verified; public availability separately recorded')
p.write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
prior_objects.update(dict(records))
(pathlib.Path(__file__).parent/'upload.json').write_text(json.dumps(dict(checkedAt=manifest['checkedAt'],objects=prior_objects),ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'objects':len(records),'readBackSHA256Verified':True,'publicHTTP':[x['publicHTTP']['status'] for _,x in records]}))
