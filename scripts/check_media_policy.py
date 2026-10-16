#!/usr/bin/env python3
"""Reject newly staged media; old tracked media can be migrated separately."""
import pathlib,subprocess,sys
allowed={'favicon.png','favicon-32.png','apple-touch-icon.png'}
extensions={'.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.mp3','.wav','.ogg','.m4a','.mp4','.webm'}
paths=subprocess.check_output(['git','diff','--cached','--name-only','--diff-filter=A','-z']).decode().split('\0')
bad=[p for p in paths if p and p not in allowed and pathlib.Path(p).suffix.lower() in extensions]
if bad:
 print('Media must be uploaded to R2 instead of Git:\n'+'\n'.join(bad));sys.exit(1)
print('PASS: no newly staged media files.')
