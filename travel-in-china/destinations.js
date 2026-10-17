import {articles,sources} from './data.js';
import {people,poems} from './culture.js';
import {chengduDivisions} from './geography.js';
import {yunnan,kunming} from './destinations/yunnan.js';
export const chengdu={id:'chengdu',name:'成都',en:'CHENGDU',province:'510000',provinceName:'四川省',provinceEn:'SICHUAN',kind:'city',label:'四川 · 成都',coordinates:[104.065735,30.659462],lede:'在一盏茶里，慢下来。',intro:'一碗川味，一片树荫，一段经纬。\n从熟悉的日常出发，认识这座城。',cover:1,coverAlt:'成都茶馆的竹椅、盖碗和树影',articles,sources,people,poems,divisions:chengduDivisions,divisionParam:'county',divisionLabel:'区县',literatureLabel:'诗词',date:'2026 年 10 月 16 日',chapterLabels:['一碗川味','走进山水','读懂日常']};
export const destinations=Object.assign(Object.create(null),{chengdu,yunnan,kunming});
export const atlasDestinations=()=>Object.values(destinations).filter(d=>!d.parent);
export const destinationForProvince=code=>atlasDestinations().find(d=>d.province===code);
export const destinationPath=d=>d.path||'/'+d.id;
export const articlePath=(d,a)=>a.destination?destinationPath(destinations[a.destination])+'/'+a.id:destinationPath(d)+'/'+a.id;
export function resolveDestination(path){return Object.values(destinations).sort((a,b)=>destinationPath(b).length-destinationPath(a).length).find(d=>path===destinationPath(d)||path.startsWith(destinationPath(d)+'/'));}

export function matchesDestination(d,query,category='all'){
 const selected=d.articles.filter(a=>category==='all'||a.tags.includes(category));
 if(!selected.length)return false;
 const ids=new Set(selected.map(a=>a.id));
 const text=[d.name,d.en,d.provinceName,d.provinceEn,...selected.flatMap(a=>[a.short,a.title,a.dek,a.place||'']),...d.divisions.filter(v=>selected.some(a=>a[d.divisionParam]===v.code)).map(v=>v.name),...(category==='all'?(d.directory||[]).flatMap(v=>[v.short,...v.places,...v.themes]):[]),...d.people.filter(p=>ids.has(p.article)).flatMap(p=>[p.name,p.place]),...d.poems.filter(p=>ids.has(p.article)).flatMap(p=>[p.title,...p.lines])].join(' ').toLowerCase();
 return text.includes(query.trim().toLowerCase());
}
