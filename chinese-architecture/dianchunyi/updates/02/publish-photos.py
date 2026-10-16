import pathlib,json,hashlib,html,re,os,datetime,urllib.request
from PIL import Image,ImageOps
import boto3
from botocore.config import Config
root=pathlib.Path.cwd();p=pathlib.Path('/tmp/dianchunyi-02');photos=root/'chinese-architecture/photos';dest=root/'chinese-architecture/dianchunyi/updates/02'
env={}
for f in [root.parent/'.envrc',root/'.envrc',root.parent/'.env',root/'.env']:
 if f.exists():
  for l in f.read_text().splitlines():
   m=re.match(r"^(?:export\s+)?(R2_[A-Z_]+)\s*=\s*(.*)",l.strip())
   if m:env[m[1]]=m[2].strip().strip("\"'")
env.update({k:v for k,v in os.environ.items() if k.startswith('R2_')});client=boto3.client('s3',endpoint_url=env['R2_ENDPOINT_URL'],aws_access_key_id=env['R2_ACCESS_KEY_ID'],aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],region_name='auto',config=Config(retries={'max_attempts':4}));base=env['R2_PUBLIC_URL'].rstrip('/');bucket=env['R2_BUCKET_NAME']
items=json.loads((p/'selected-info.json').read_text());assets=[];sources=[];uploads=[];entries={}
for i,id in [(51,'dianchunyi-south-2019'),(73,'dianchunyi-oblique-2009'),(17,'dianchunyi-courtyard-2012')]:
 info=items[i]['imageinfo'][0];meta=info['extmetadata'];original=i!=51;source=p/(f'original-{i}.jpg' if original else f'large-{i}.jpg');data=source.read_bytes();sha1=hashlib.sha1(data).hexdigest();sha=hashlib.sha256(data).hexdigest()
 if original:assert sha1==info['sha1']
 im=ImageOps.exif_transpose(Image.open(source));prefix=f'chinese-architecture/photos/{id}/{sha[:16]}';variants={};manifest={}
 for kind,size in [('original',None),('full',max(im.size)),('display',1600),('thumb',480)]:
  name=('original.jpg' if original else 'source-preview.jpg') if size is None else kind+'.webp';f=p/f'{id}-{name}'
  if size is None:f.write_bytes(data)
  else:
   v=im.copy();v.thumbnail((size,size));v.convert('RGB').save(f,'WEBP',quality=88,**({'icc_profile':im.info['icc_profile']} if im.info.get('icc_profile') else {}))
  body=f.read_bytes();h=hashlib.sha256(body).hexdigest();key=prefix+'/'+name
  try:client.put_object(Bucket=bucket,Key=key,Body=body,ContentType='image/jpeg' if size is None else 'image/webp',CacheControl='public,max-age=31536000,immutable',IfNoneMatch='*')
  except client.exceptions.ClientError as e:
   if e.response['Error']['Code'] not in ['PreconditionFailed','412']:raise
  read=client.get_object(Bucket=bucket,Key=key)['Body'].read();assert hashlib.sha256(read).hexdigest()==h
  url=base+'/'+key;variants[kind]=url;entry=dict(url=url,key=key,sha256=h,bytes=len(body),contentType='image/jpeg' if size is None else 'image/webp',uploaded=True,readBackSHA256Verified=True);uploads.append(entry)
  path=f'chinese-architecture/photos/fallback/{id}/{sha[:16]}/{name}' if size else f'chinese-architecture/dianchunyi/updates/02/media/{id}/{name}';entries[path]=entry
 assets.append(dict(id=id,width=im.width,height=im.height,sha256=sha,sourceSHA1=info['sha1'],downloadedSHA1=sha1,originalSHA1Verified=original,source=info['descriptionurl'],sourceFile=items[i]['title'][5:],author=html.unescape(re.sub('<[^>]+>','',meta['Artist']['value'])),date=meta['DateTimeOriginal']['value'].split(' ')[0],license=meta['LicenseShortName']['value'],licenseUrl=meta['LicenseUrl']['value'],changes='等比缩小/转WebP；不裁切、不增细、不改色。'+('原始JPEG字节和Commons SHA1已核。' if original else '原片下载429；使用Commons 1280×842授权预览，未冒称原片或高清原生图。'),iccProfilePreserved=bool(im.info.get('icc_profile')),storage='R2 uploaded and SHA256 read-back verified; R2-only media',sourceType='commons-jpeg' if original else 'commons-thumbnail',sourceOriginalSize=[info['width'],info['height']],sourceOriginalURL=info['url'],**({} if original else dict(originalLabel='来源预览 JPEG ↗',downloadURL=info['thumburl'])),r2=variants.copy(),**variants));sources.append(dict(id=id,file=items[i]['title'][5:],info=info,downloadURL=info['url'] if original else info['thumburl'],originalDownloaded=original))
# Re-read all shared files immediately before merge; preserve concurrent building work.
f=photos/'assets.json';prior=json.loads(f.read_text());by={a['id']:a for a in prior};by.update({a['id']:a for a in assets});f.write_text(json.dumps(list(by.values()),ensure_ascii=False,indent=2)+'\n')
f=photos/'records/commons-metadata.json';prior=json.loads(f.read_text());by={a['id']:a for a in prior};by.update({a['id']:a for a in sources});f.write_text(json.dumps(list(by.values()),ensure_ascii=False,indent=2)+'\n')
f=root/'media-assets.json';prior=json.loads(f.read_text());prior['assets'].update(entries);f.write_text(json.dumps(prior,ensure_ascii=False,indent=2)+'\n')
(dest/'photo-upload.json').write_text(json.dumps(dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),objects=uploads),ensure_ascii=False,indent=2)+'\n');(dest/'photo-sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n');(dest/'photo-assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n');print('Uploaded and read-back verified',len(uploads),'objects')
