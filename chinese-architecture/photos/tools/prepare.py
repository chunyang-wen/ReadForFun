#!/usr/bin/env python3
"""Prepare licensed Commons photos. Optional --upload uses existing R2 env vars.
Originals are byte-for-byte copies; previews are resized WebP, never AI enhanced.
Run with a Python containing Pillow. Do not pass credentials on the command line.
"""
import argparse,hashlib,json,os,pathlib,subprocess,urllib.request,re,html,datetime
from PIL import Image,ImageOps
p=argparse.ArgumentParser();p.add_argument('source',type=pathlib.Path);p.add_argument('--upload',action='store_true');p.add_argument('--merge',action='store_true');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];out=a.source/'prepared';out.mkdir(exist_ok=True)
metadata=json.loads((a.source/'metadata.json').read_text());assets=[]
base=os.environ.get('R2_PUBLIC_URL','https://readforfun-img.chunyangwen.com').rstrip('/')
for i,record in enumerate(metadata):
 info=record['info'];m=info['extmetadata'];license=m['LicenseShortName']['value']
 if license not in ['CC BY-SA 3.0','CC BY-SA 4.0']:raise ValueError('License requires review')
 original=a.source/record.get('localFile',f'{i}.jpg');original_bytes=original.read_bytes()
 if info.get('sha1') and hashlib.sha1(original_bytes).hexdigest()!=info['sha1']:raise ValueError('Original differs from Commons source SHA1')
 digest=hashlib.sha256(original_bytes).hexdigest();prefix=f'chinese-architecture/photos/{record["id"]}/{digest[:16]}'
 variants={};source_image=Image.open(original)
 if source_image.format not in ('JPEG','MPO') or not original_bytes.startswith(b'\xff\xd8'):raise ValueError('This pipeline expects verified JPEG-compatible originals')
 im=ImageOps.exif_transpose(source_image)
 for kind,size in [('original',None),('display',1600),('thumb',480),('full',max(im.size))]:
  filename=f'{kind}.jpg' if size is None else f'{kind}.webp';target=out/f'{record["id"]}-{filename}'
  if size is None:target.write_bytes(original.read_bytes())
  else:
   preview=im.copy();preview.thumbnail((size,size));color_options={'icc_profile':im.info['icc_profile']} if im.info.get('icc_profile') else {}
   preview.convert('RGB').save(target,'WEBP',quality=88,**color_options)
  key=f'{prefix}/{filename}';variants[kind]=f'{base}/{key}'
  if size is not None:
   local=root/'fallback'/record['id']/digest[:16]/filename;local.parent.mkdir(parents=True,exist_ok=True);local.write_bytes(target.read_bytes())
  if a.upload:
   env={**os.environ,'AWS_ACCESS_KEY_ID':os.environ['R2_ACCESS_KEY_ID'],'AWS_SECRET_ACCESS_KEY':os.environ['R2_SECRET_ACCESS_KEY'],'AWS_DEFAULT_REGION':'auto','AWS_EC2_METADATA_DISABLED':'true'}
   command=['aws','s3api','put-object','--bucket',os.environ['R2_BUCKET_NAME'],'--key',key,'--body',str(target),'--content-type','image/jpeg' if size is None else 'image/webp','--cache-control','public,max-age=31536000,immutable','--if-none-match','*','--endpoint-url',os.environ['R2_ENDPOINT_URL']]
   result=subprocess.run(command,env=env,capture_output=True,text=True)
   if result.returncode and 'PreconditionFailed' not in result.stderr:raise RuntimeError(f'Upload failed for {record["id"]}/{filename}; check R2 configuration locally')
   downloaded=out/(record['id']+'-verify-'+filename)
   verify=subprocess.run(['aws','s3api','get-object','--bucket',os.environ['R2_BUCKET_NAME'],'--key',key,'--endpoint-url',os.environ['R2_ENDPOINT_URL'],str(downloaded)],env=env,capture_output=True,text=True)
   if verify.returncode:raise RuntimeError('R2 read-back failed')
   if hashlib.sha256(downloaded.read_bytes()).hexdigest()!=hashlib.sha256(target.read_bytes()).hexdigest():raise ValueError('R2 asset hash mismatch')
   downloaded.unlink()
 assets.append(dict(id=record['id'],width=im.width,height=im.height,sha256=digest,iccProfilePreserved=bool(im.info.get('icc_profile')),source=info['descriptionurl'],sourceFile=record['file'],author=record.get('author') or html.unescape(re.sub('<[^>]+>','',m['Artist']['value'])).strip(),date=m.get('DateTimeOriginal',m.get('DateTime',{})).get('value','拍摄日期未注明').split(' ')[0],license=license,licenseUrl=m['LicenseUrl']['value'],changes='原始 JPEG 未改动；展示图与缩略图等比缩小并转为 WebP；高清 WebP 保留像素尺寸，均沿用原图许可。',**variants))
if a.merge:
 existing=json.loads((root/'assets.json').read_text())
 updated={item['id']:item for item in existing}
 updated.update({item['id']:item for item in assets})
 catalog=list(updated.values())
 prior=json.loads((root/'records'/'commons-metadata.json').read_text())
 sources={item['id']:item for item in prior};sources.update({item['id']:item for item in metadata});metadata=list(sources.values())
else:catalog=assets
(root/'assets.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(root/'records'/'commons-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
report=dict(timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),photos=[item['id'] for item in assets],variants=len(assets)*4,uploaded=a.upload,readBackSHA256Verified=a.upload)
(root/'records'/('expansion-upload.json' if a.upload else 'expansion-prepare.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(photos=len(assets),catalogPhotos=len(catalog),variants=len(assets)*4,uploaded=a.upload),ensure_ascii=False))
