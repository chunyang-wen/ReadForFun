// Transcribed from NBS China Statistical Yearbook 2025, table 1-1 (end of 2024).
// null means not applicable / not supplied, never a zero inferred from a blank.
export const geographySources = {
 national:{title:'中央政府驻港联络办 · 中华人民共和国行政区划',url:'https://www.locpg.gov.cn/2022-06/07/c_1211652713.htm',asOf:'2022-06-07'},
 nbs:{title:'国家统计局 · 全国行政区划（2024 年底）',url:'https://www.stats.gov.cn/sj/ndsj/2025/html/C01-01.jpg',asOf:'2024-12-31'},
 chengdu:{title:'成都区县边界与名称 · 阿里云 DataV',url:'https://geo.datav.aliyun.com/areas_v3/bound/510100_full.json',checked:'2026-10-16'},
 hk:{title:'香港民政事务总署 · 十八区',url:'https://www.had.gov.hk/en/18_districts/my_map.htm',checked:'2026-10-16'},
 macau:{title:'澳门文化局 · 文创地图的七个堂区',url:'https://www.icm.gov.mo/gb/News/detail/11522',asOf:'2014'},
 taiwan:{title:'台湾地区地方政府组织介绍',url:'https://www.president.gov.tw/Page/106',checked:'2026-10-16'}
};
// adcode, prefecture-level divisions, prefecture-level cities, county-level divisions.
const rows=[
 ['110000',null,null,16],['120000',null,null,16],['130000',11,11,167],['140000',11,11,117],['150000',12,9,103],
 ['210000',14,14,100],['220000',9,8,60],['230000',13,12,121],['310000',null,null,16],['320000',13,13,95],
 ['330000',11,11,90],['340000',16,16,104],['350000',9,9,84],['360000',11,11,100],['370000',16,16,136],
 ['410000',17,17,157],['420000',13,12,103],['430000',14,13,122],['440000',21,21,122],['450000',14,14,111],
 ['460000',4,4,25],['500000',null,null,38],['510000',21,18,183],['520000',9,6,88],['530000',16,8,129],
 ['540000',7,6,74],['610000',10,10,107],['620000',14,12,86],['630000',8,2,44],['640000',5,5,22],['650000',14,4,110]
];
export const provinceStatistics=Object.fromEntries(rows.map(([code,prefectures,cities,counties])=>[code,{prefectures,cities,counties,source:'nbs'}]));
export const nationalStatistics={total:34,provinces:23,autonomous:5,municipalities:4,special:2,prefectures:333,cities:293,counties:2846};
export const chengduDivisions=[
 ['510104','锦江区','district'],['510105','青羊区','district'],['510106','金牛区','district'],['510107','武侯区','district'],['510108','成华区','district'],['510112','龙泉驿区','district'],['510113','青白江区','district'],['510114','新都区','district'],['510115','温江区','district'],['510116','双流区','district'],['510117','郫都区','district'],['510118','新津区','district'],
 ['510121','金堂县','county'],['510129','大邑县','county'],['510131','蒲江县','county'],
 ['510181','都江堰市','city'],['510182','彭州市','city'],['510183','邛崃市','city'],['510184','崇州市','city'],['510185','简阳市','city']
].map(([code,name,type])=>({code,name,type}));
export function divisionCounts(divisions){return {total:divisions.length,districts:divisions.filter(d=>d.type==='district').length,counties:divisions.filter(d=>d.type==='county').length,cities:divisions.filter(d=>d.type==='city').length}}
