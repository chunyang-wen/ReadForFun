import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cityNames,cityLetters,placeLabels,discoveryFor} from '../map-discovery.js';
const features=JSON.parse(fs.readFileSync(new URL('../assets/china-provinces.geojson',import.meta.url))).features.filter(f=>f.properties.name);
const project=([lon,lat])=>[30+(lon-73)*11,35+(54-lat)*13.4];
test('all provincial waypoints have names and non-overlapping labels',()=>{
 const {cities,provinces}=placeLabels(features,project);
 assert.equal(cities.length,34);assert.equal(provinces.length,28);
 assert.deepEqual(new Set(cities.map(c=>c.code)),new Set(Object.keys(cityNames)));
 const labels=[...cities,...provinces];
 for(const [i,label] of labels.entries()){
  const a=label.box;assert(a.x>=0&&a.y>=0&&a.x+a.w<=770&&a.y+a.h<=540);
  for(const other of labels.slice(i+1)){
   const b=other.box;assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${label.name} overlaps ${other.name}`);
  }
 }
});
test('letters lead to existing stories or regional previews, with cultural sources',()=>{
 for(const [code,name] of Object.entries(cityNames)){
  const letter=discoveryFor({code,name});
  assert(letter.title&&letter.text&&letter.action);
  assert(code==='510000'?letter.href.startsWith('#/chengdu/'):letter.href===`#/atlas?province=${code}`);
 }
 for(const letter of Object.values(cityLetters))assert(new URL(letter.source).hostname.endsWith('.gov.cn'));
 assert.equal(new Set([0,1,2].map(turn=>discoveryFor({code:'510000'},turn).href)).size,3);
});
