import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PHOTO_STORIES} from './catalog.js';
import {CHAPTERS as taihe,NODES as taiheNodes} from '../taihe/data.js';
import {CHAPTERS as taimiao,NODES as taimiaoNodes} from '../taimiao/data.js';
import {CHAPTERS as foguang} from '../data.js';
import {CHAPTERS as dule,NODES as duleNodes} from '../dule/data.js';
import {CHAPTERS as yingxian} from '../yingxian/data.js';
import {CHAPTERS as jinci,NODES as jinciNodes} from '../jinci/data.js';
import {CHAPTERS as fengxian,NODES as fengxianNodes} from '../fengxian/data.js';
import {CHAPTERS as qinian,NODES as qinianNodes} from '../qinian/data.js';
import {CHAPTERS as huazhongyou,NODES as huazhongyouNodes} from '../huazhongyou/data.js';
import {CHAPTERS as chengzhi,NODES as chengzhiNodes} from '../chengzhi/data.js';
import {CHAPTERS as dianchunyi,NODES as dianchunyiNodes} from '../dianchunyi/data.js';
const assets=JSON.parse(readFileSync(new URL('./assets.json',import.meta.url)));
const r2Media=JSON.parse(readFileSync(new URL('../../media-assets.json',import.meta.url))).assets;
test('each photo has explicit reusable rights, attribution and exact building chapter',()=>{
 assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);
 for(const [building,story] of Object.entries(PHOTO_STORIES))for(const item of story.items){
  const asset=assets.find(a=>a.id===item.id);assert.ok(asset);assert.ok(item.id.startsWith(building+'-'));
  assert.ok(({taihe,taimiao,foguang,dule,yingxian,jinci,fengxian,qinian,huazhongyou,chengzhi,dianchunyi})[building][item.chapter]);assert.ok(item.look&&item.limit);
  if(item.node){assert.ok(({taihe:taiheNodes,taimiao:taimiaoNodes,dule:duleNodes,jinci:jinciNodes,fengxian:fengxianNodes,qinian:qinianNodes,huazhongyou:huazhongyouNodes,chengzhi:chengzhiNodes,dianchunyi:dianchunyiNodes})[building].some(n=>n.id===item.node));assert.equal(({taihe,taimiao,foguang,dule,yingxian,jinci,fengxian,qinian,huazhongyou,chengzhi,dianchunyi})[building][item.chapter].view,'detail');}
  assert.ok(asset.author&&asset.date&&asset.changes);assert.match(asset.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  if(asset.sourceType==='commons-pdf-page'){assert.equal(asset.license,'Public domain');assert.ok(asset.licenseUrl.endsWith('#Licensing'));assert.ok(asset.pdfPage>=1);assert.match(asset.original,/original\.pdf(?:#page=\d+)?$/);assert.match(asset.sourceSHA1,/^[0-9a-f]{40}$/);assert.match(asset.scanSHA256,/^[0-9a-f]{64}$/);}else{assert.ok(['CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0','CC BY 4.0','CC BY 3.0','CC BY 2.0'].includes(asset.license));assert.match(asset.licenseUrl,/^https:\/\/creativecommons.org\/licenses\/by(?:-sa)?\//);}
 }
});
test('every display size has a local or verified R2 fallback, and remote keys are content addressed',()=>{
 for(const a of assets){assert.ok(a.width>0&&a.height>0);if(a.sourceType!=='commons-pdf-page'&&!a.id.startsWith('dule-plaque-')&&!a.id.startsWith('yingxian-')&&!a.id.startsWith('fengxian-')&&!a.id.startsWith('dianchunyi-'))assert.ok(Math.max(a.width,a.height)>=3000&&Math.min(a.width,a.height)>=2400);assert.match(a.sha256,/^[0-9a-f]{64}$/);
  for(const kind of ['display','thumb','full']){assert.ok(a[kind].includes(a.id+'/'+a.sha256.slice(0,16)+'/'));if(a.id.startsWith('foguang-'))assert.equal(a.storage,'local licensed derivatives; original remains at Commons; not uploaded to R2');const path=`chinese-architecture/photos/fallback/${a.id}/${a.sha256.slice(0,16)}/${kind}.webp`;const remote=r2Media[path];if(remote){assert.equal(remote.readBackSHA256Verified,true);assert.match(remote.sha256,/^[0-9a-f]{64}$/);assert.equal(a[kind],remote.url)}else assert.ok(existsSync(new URL(`./fallback/${a.id}/${a.sha256.slice(0,16)}/${kind}.webp`,import.meta.url)));}
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

test('Dule historic plate pages retain period and subject limits, without claiming modern coverage',()=>{const historic=PHOTO_STORIES.dule.items.filter(i=>i.id.endsWith('-1932'));assert.equal(historic.length,5);for(const item of historic){assert.match(item.limit,/1932/);assert.ok(assets.find(a=>a.id===item.id).sourceType==='commons-pdf-page');}assert.equal(PHOTO_STORIES.dule.relatedSources.length,2);assert.ok(PHOTO_STORIES.dule.items.some(i=>i.angle==='side'));assert.ok(PHOTO_STORIES.dule.items.some(i=>i.id==='dule-interior-2023'));});


test('Yingxian retains native pixels and local delivery while independently recording verified R2 storage',()=>{
 const ids=['yingxian-whole-2025','yingxian-aerial-2019','yingxian-corner-2007','yingxian-ang-2007','yingxian-ceiling-2009','yingxian-statuary','yingxian-overall-2019'];
 assert.deepEqual(PHOTO_STORIES.yingxian.items.map(i=>i.id),ids);
 for(const id of ids){const a=assets.find(a=>a.id===id);assert.match(a.storage,/R2 uploaded and SHA256 read-back verified/);assert.ok(a.r2.full.includes(a.sha256.slice(0,16)));assert.match(a.original,/^https:\/\/upload.wikimedia.org\//);for(const kind of ['display','thumb','full'])assert.match(a[kind],/^\.\.\/photos\/fallback\//);}
 for(const id of ids.slice(2,4)){const a=assets.find(a=>a.id===id);assert.equal(a.width,1500);assert.equal(a.height,998);assert.equal(a.license,'CC BY 3.0');const item=PHOTO_STORIES.yingxian.items.find(i=>i.id===id);assert.equal(item.chapter,5);assert.match(item.limit,/1500×998/);assert.equal(item.node,undefined);}
 assert.match(PHOTO_STORIES.yingxian.intro,/尚缺/);
});

test('Jinci covers hall, porch, bracket and dragons while preserving uncertain directions',()=>{const story=PHOTO_STORIES.jinci;assert.equal(story.items.length,9);assert.match(story.intro,/尚缺/);assert.ok(!story.items.some(i=>['back','side'].includes(i.angle)));for(const i of story.items.filter(i=>i.id.includes('dragon')))assert.equal(i.node,'dragon');assert.equal(story.items.find(i=>i.id==='jinci-bracket').node,'lower');for(const i of story.items){const a=assets.find(a=>a.id===i.id);assert.match(a.sourceSHA1,/^[0-9a-f]{40}$/);assert.match(a.storage,/R2 uploaded and SHA256 read-back verified/);assert.match(a.original,/^https:\/\/upload.wikimedia.org\//);for(const kind of ['thumb','display','full']){assert.equal(a[kind],r2Media[`chinese-architecture/photos/fallback/${a.id}/${a.sha256.slice(0,16)}/${kind}.webp`].url);assert.ok(a.r2[kind].includes(a.sha256.slice(0,16)));}}});

test('Fengxian interior photos retain front-hall identity limits and real decoration node',()=>{const story=PHOTO_STORIES.fengxian;assert.equal(story.items.length,3);assert.match(story.intro,/尚缺/);for(const item of story.items){assert.match(item.id,/^fengxian-/);if(item.node)assert.equal(item.node,'decoration');assert.match(item.limit,/前殿|钟表/);}assert.match(story.items[2].limit,/展览围护未核/);});


test('Qinian atlas has explicit east-view limits and real decoration node, with R2-only delivery',()=>{const s=PHOTO_STORIES.qinian;assert.equal(s.items.length,6);assert.match(s.intro,/尚缺/);assert.ok(s.items.some(i=>i.angle==='east'&&i.limit.includes('斜视')));const i=s.items.find(i=>i.angle==='interior');assert.equal(i.node,'decoration');assert.equal(qinian[i.chapter].node,'decoration');for(const i of s.items){const a=assets.find(a=>a.id===i.id);assert.match(a.storage,/R2 uploaded/);for(const k of ['thumb','display','full','original'])assert.match(a[k],/^https:\/\/readforfun-img.chunyangwen.com\//);assert.match(a.sourceSHA1,/^[a-f0-9]{40}$/);}});

test('Huazhongyou identifies one gate, links the lotus node and keeps missing rear coverage explicit',()=>{const s=PHOTO_STORIES.huazhongyou;assert.equal(s.items.length,3);assert.match(s.intro,/尚缺/);assert.equal(s.items.find(i=>i.id.includes('wood')).node,'lotus');assert.ok(!s.items.some(i=>['back','side'].includes(i.angle)));for(const i of s.items){const a=assets.find(a=>a.id===i.id);assert.equal(a.author,'othree');assert.equal(a.license,'CC BY 2.0');assert.match(a.sourceSHA1,/^[0-9a-f]{40}$/);assert.match(a.storage,/R2 uploaded/);assert.match(a.full,/^https:\/\/readforfun-img/);}});

test('Chengzhi front-hall photos retain door/hidden-frame gaps and link actual carving nodes',()=>{const s=PHOTO_STORIES.chengzhi;assert.equal(s.items.length,4);assert.match(s.intro,/尚缺隔扇/);assert.ok(s.items.some(i=>i.node==='banquet'));assert.ok(s.items.some(i=>i.node==='spandrel'));for(const i of s.items){const a=assets.find(a=>a.id===i.id);assert.equal(a.author,'EditQ');assert.equal(a.license,'CC BY-SA 4.0');assert.match(a.sourceSHA1,/^[a-f0-9]{40}$/);assert.match(a.storage,/R2 uploaded/);for(const k of ['original','display','thumb','full'])assert.match(a[k],/^https:\/\/readforfun-img/);}});

 test('Dianchunyi shows three verified courtyard/facade contexts, explicit missing north view and preview boundary',()=>{const s=PHOTO_STORIES.dianchunyi;assert.equal(s.items.length,3);assert.match(s.intro,/尚缺/);assert.ok(!s.items.some(i=>i.angle==='back'));const a=assets.find(a=>a.id==='dianchunyi-south-2019');assert.equal(a.originalSHA1Verified,false);assert.equal(a.sourceType,'commons-thumbnail');assert.equal(a.width,1280);assert.match(a.originalLabel,/预览/);for(const i of s.items){const a=assets.find(a=>a.id===i.id);assert.match(a.storage,/R2 uploaded/);for(const k of ['full','thumb','display','original'])assert.match(a[k],/^https:\/\/readforfun-img.chunyangwen.com\//);}});
