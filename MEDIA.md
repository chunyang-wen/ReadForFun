# Media storage

Images and audio are published to the existing Cloudflare R2 bucket and served through `https://readforfun-img.chunyangwen.com`. New media must not be added to Git. Fonts, GeoJSON, code, licenses, prompts and attribution metadata remain in Git.

The 2026-10-16 migration replaces the unpublished `31fbfea` snapshot with the same source work and cloud media references. It covers 218 changed images (83,793,360 bytes), including travel illustrations, six UI concepts, two architecture covers, research screenshots and new photo derivatives. Older media in previous commits is outside this migration; the three existing app icons remain explicit Git exceptions.

`media-assets.json` maps each original repository-relative path to its R2 URL, object key, SHA-256, byte size, MIME type and upload verification result. Objects use content-addressed keys and immutable caching. Every object was downloaded through the authenticated R2 API and checked byte-for-byte before its local Git entry was removed. Local files remain ignored caches; a fresh checkout does not need those copies for the updated webpages.

Concrete HTML/CSS/document references use CDN URLs. The architecture photo gallery uses `photos/r2-fallbacks.js` for migrated derivatives; older tracked local fallbacks remain supported. Historical research JSON and screenshot output paths retain their original recording semantics; their archived media can be resolved through the manifest. The root media rule takes precedence over older notes requesting checked-in screenshots or local delivery for these newly migrated assets.

To publish future staged media, with the existing local `.envrc` R2 configuration:

```sh
uv run --python python3 --with 'boto3>=1.40' python scripts/publish_staged_media.py
python3 scripts/rewrite_media_references.py
```

Publish and verify before removing media from the index. Keep this manifest across migrations; new runs merge records. Never commit `.envrc` or keys. `scripts/check_media_policy.py` rejects new media in the staged diff while allowing the existing app icons.
