import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PHOTO_STORIES} from './catalog.js';
import {CHAPTERS as taihe,NODES as taiheNodes} from '../taihe/data.js';
import {CHAPTERS as taimiao,NODES as taimiaoNodes} from '../taimiao/data.js';
import {CHAPTERS as foguang} from '../data.js';
const assets=JSON.parse(readFileSync(new URL('./assets.json',import.meta.url)));
test('each photo has explicit reusable rights, attribution and exact building chapter',()=>{
 assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);
 for(const [building,story] of Object.entries(PHOTO_STORIES))for(const item of story.items){
  const asset=assets.find(a=>a.id===item.id);assert.ok(asset);assert.ok(item.id.startsWith(building+'-'));
  assert.ok(({taihe,taimiao,foguang})[building][item.chapter]);assert.ok(item.look&&item.limit);
  if(item.node){assert.ok(({taihe:taiheNodes,taimiao:taimiaoNodes})[building].some(n=>n.id===item.node));assert.equal(({taihe,taimiao,foguang})[building][item.chapter].view,'detail');}
  assert.ok(asset.author&&asset.date&&asset.changes);assert.match(asset.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.ok(['CC BY-SA 3.0','CC BY-SA 4.0'].includes(asset.license));assert.match(asset.licenseUrl,/^https:\/\/creativecommons.org\/licenses\/by-sa\//);
 }
});
test('every display size has a local fallback, and remote keys are content addressed',()=>{
 for(const a of assets){assert.ok(Math.max(a.width,a.height)>=3000&&Math.min(a.width,a.height)>=2400);assert.match(a.sha256,/^[0-9a-f]{64}$/);
  for(const kind of ['display','thumb','full']){assert.ok(a[kind].includes(a.id+'/'+a.sha256.slice(0,16)+'/'));if(a.id.startsWith('foguang-'))assert.equal(a.storage,'local licensed derivatives; original remains at Commons; not uploaded to R2');assert.ok(existsSync(new URL(`./fallback/${a.id}/${a.sha256.slice(0,16)}/${kind}.webp`,import.meta.url)));}
 }
});
test('caisson photograph returns to the actual Taihe caisson chapter',()=>{
 const caisson=PHOTO_STORIES.taihe.items.find(i=>i.id==='taihe-caisson');assert.equal(taihe[caisson.chapter].node,'caisson');
 assert.equal(taimiao[PHOTO_STORIES.taimiao.items.find(i=>i.id==='taimiao-interior').chapter].node,'finish');
});

test('each photograph appears exactly once in its building story',()=>{
 const ids=Object.values(PHOTO_STORIES).flatMap(s=>s.items.map(i=>i.id));assert.equal(ids.length,new Set(ids).size);
 for(const asset of assets)assert.ok(ids.includes(asset.id),`Missing story: ${asset.id}`);
});
