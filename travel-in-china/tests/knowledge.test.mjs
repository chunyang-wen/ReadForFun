import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {provinceStatistics,nationalStatistics,chengduDivisions,divisionCounts} from '../geography.js';
import {people,poems,culturalArticles} from '../culture.js';
import {articles,sources,matchesDestination} from '../data.js';
import {geographyPanel} from '../knowledge.js';
test('NBS 2024 province rows reconcile with published national totals',()=>{
 const rows=Object.values(provinceStatistics);
 assert.equal(rows.length,31);
 for(const key of ['prefectures','cities','counties'])assert.equal(rows.reduce((sum,row)=>sum+(row[key]??0),0),nationalStatistics[key]);
 assert.equal(nationalStatistics.total,nationalStatistics.provinces+nationalStatistics.autonomous+nationalStatistics.municipalities+nationalStatistics.special);
 assert.deepEqual(provinceStatistics['510000'],{prefectures:21,cities:18,counties:183,source:'nbs'});
 assert.equal(provinceStatistics['110000'].prefectures,null);
 assert.match(geographyPanel({province:'110000',name:'北京市'}),/直接下辖/);
 assert.match(geographyPanel({province:'820000',name:'澳门特别行政区'}),/非当前市县统计/);
});
test('Chengdu directory matches the source geometry and distinguishes districts, counties, cities',()=>{
 assert.deepEqual(divisionCounts(chengduDivisions),{total:20,districts:12,counties:3,cities:5});
 const geo=JSON.parse(fs.readFileSync(new URL('../assets/chengdu-counties.geojson',import.meta.url)));
 assert.deepEqual(chengduDivisions.map(d=>[d.code,d.name]).sort(),geo.features.map(f=>[String(f.properties.adcode),f.properties.name]).sort());
});
test('Poetry and person relations resolve to sources, county units and articles',()=>{
 assert.equal(new Set(articles.map(a=>a.id)).size,9);
 for(const a of articles)for(const key of a.refs)assert(sources[key],`${a.id}: ${key}`);
 for(const item of [...people,...poems]){assert(articles.some(a=>a.id===item.article));assert(chengduDivisions.some(d=>d.code===item.county));assert(sources[item.source]);assert(item.relation);}
 for(const a of culturalArticles){for(const id of a.poems)assert(poems.some(p=>p.id===id));for(const id of a.people)assert(people.some(p=>p.id===id));}
 assert(matchesDestination('杜甫','culture'));assert(matchesDestination('花重锦官城','culture'));assert(matchesDestination('诸葛亮','play'));assert(!matchesDestination('杜甫','eat'));
});
