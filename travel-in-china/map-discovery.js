// City anchors use the provincial-seat coordinates in the local DataV GeoJSON.
// These are discovery waypoints, not an exhaustive directory of Chinese cities.
export const cityNames = {
 110000:'北京',120000:'天津',130000:'石家庄',140000:'太原',150000:'呼和浩特',
 210000:'沈阳',220000:'长春',230000:'哈尔滨',310000:'上海',320000:'南京',
 330000:'杭州',340000:'合肥',350000:'福州',360000:'南昌',370000:'济南',
 410000:'郑州',420000:'武汉',430000:'长沙',440000:'广州',450000:'南宁',
 460000:'海口',500000:'重庆',510000:'成都',520000:'贵阳',530000:'昆明',
 540000:'拉萨',610000:'西安',620000:'兰州',630000:'西宁',640000:'银川',
 650000:'乌鲁木齐',710000:'台北',810000:'香港',820000:'澳门'
};
export const shortProvince=name=>name.replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市/g,'');
// Keep all text readable at the native SVG scale; leaders preserve its geographic anchor.
export function placeLabels(features,project){
 const occupied=[];
 const place=(x,y,width,height,preferred=[0,0])=>{
  let best,score=Infinity;
  const candidates=[preferred];
  for(let radius=0;radius<=150;radius+=8)for(let angle=0;angle<24;angle++)candidates.push([Math.cos(angle*Math.PI/12)*radius,Math.sin(angle*Math.PI/12)*radius]);
  for(const [dx,dy] of candidates){
   const bx=Math.max(26,Math.min(744-width,x+dx-width/2)),by=Math.max(110,Math.min(480-height,y+dy-height/2));
   const box={x:bx,y:by,w:width,h:height};
   const overlaps=occupied.reduce((n,b)=>n+(box.x<b.x+b.w+4&&box.x+box.w+4>b.x&&box.y<b.y+b.h+4&&box.y+box.h+4>b.y?1:0),0);
   const cost=overlaps*100000+Math.hypot(bx+width/2-x,by+height/2-y);
   if(cost<score){score=cost;best=box}if(cost<1)break;
  }
  occupied.push(best);return best;
 };
 const provinces=features.filter(f=>![110000,120000,310000,500000,810000,820000].includes(f.properties.adcode)).map(f=>{
  const name=shortProvince(f.properties.name),[x,y]=project(f.properties.centroid||f.properties.center);
  return {code:String(f.properties.adcode),name,x,y,box:place(x,y,name.length*11+6,17)};
 });
 const cities=features.map(f=>{const code=String(f.properties.adcode),name=cityNames[code];const [x,y]=project(f.properties.center);return {code,name,x,y,box:place(x,y,name.length*13+8,20,[20,-13])}});
 return {cities,provinces};
}
// Short cultural leads checked against the linked local-government sources, 2026-10-16.
export const cityLetters={
 '110000':{tag:'街头风味',title:'一张薄饼，卷起北京风味',text:'从北京烤鸭，认识挂炉烤制的手艺。',source:'https://www.beijing.gov.cn/renwen/bjgk/dcgk/fy/202211/t20221111_2856920.html',sourceTitle:'北京市政府 · 全聚德挂炉烤鸭技艺'},
 '320000':{tag:'金陵风味',title:'到南京，聊聊一只鸭子',text:'盐水鸭，也是认识金陵日常的一扇窗。',source:'https://dfz.nanjing.gov.cn/gzdt/202605/t20260507_5835258.html',sourceTitle:'南京地方志 · 金陵味道，从一只鸭子说起'},
 '330000':{tag:'一城茶香',title:'西湖边，赴一场龙井茶约',text:'从一杯西湖龙井，走近杭州的茶文化。',source:'https://szjggw.hangzhou.gov.cn/art/2016/9/26/art_1083832_2222962.html',sourceTitle:'杭州市机关工委 · 西湖龙井 独树一帜'},
 '440000':{tag:'广府日常',title:'到广州，饮茶去',text:'一壶茶，几样点心，慢慢认识广府饮茶习俗。',source:'https://sfj.gz.gov.cn/gkmlpt/content/10/10663/post_10663066.html',sourceTitle:'广州市司法局 · 广州早茶传承保护规定介绍'}
};
export function discoveryFor(city,turn=0){
 if(city.code==='530000')return {tag:'云南 · 省级图志',title:'从昆明出发，沿山水读云南',text:'米线、梯田与靛蓝，把不同州、市的生活连起来。',href:'#/atlas?province=530000',action:'先看云南预览'};
 if(city.code==='510000')return [
  {tag:'街头风味',title:'一碗担担面，尝尝成都',text:'从一碗川味，读一段街头故事。',href:'#/chengdu/noodles',action:'尝一口成都'},
  {tag:'人与诗',title:'跟着杜甫，读一场春雨',text:'“晓看红湿处，花重锦官城。”',href:'#/chengdu/dufu',action:'读杜甫与成都'},
  {tag:'日常生活',title:'坐下来，喝一碗茶',text:'从盖、碗、托，认识成都的茶馆。',href:'#/chengdu/tea',action:'去茶馆坐坐'}
 ][turn%3];
 if(cityLetters[city.code])return {...cityLetters[city.code],href:`#/atlas?province=${city.code}`,action:'看看这座城的线索'};
 return {tag:'山河来信 · 问候',title:`你好，${city.name}！`,text:'你在哪里？下一站，想去这里看看吗？',href:`#/atlas?province=${city.code}`,action:'认识这片地方'};
}
