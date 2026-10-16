import {culturalArticles,culturalSources,people,poems} from './culture.js';
export const categories = {all:'全部', eat:'吃', play:'玩', culture:'人文'};
export const sources = {
 ...culturalSources,
 tea:{title:'中国供销合作网 · 在成都茶馆喝盖碗茶',url:'https://www.chinacoop.gov.cn/HTML/2008/08/24/9453.html'},
 teaLife:{title:'央广网 · 成都人春天里的盖碗茶',url:'https://sc.cnr.cn/scpd/jdt/20220422/t20220422_525802297.shtml'},
 silk:{title:'中国非物质文化遗产网 · 蜀锦',url:'https://www.ihchina.cn/project_details/21921.html'},
 opera:{title:'中国非物质文化遗产网 · 川剧近距离',url:'https://www.ihchina.cn/news_1_details/10194.html'},
 water:{title:'国家民委 · 都江堰水利工程',url:'https://www.neac.gov.cn/seac/c103391/202308/1166522.shtml'},
 park:{title:'红星新闻网 · 成都市人民公园文化活动',url:'https://news.chengdu.cn/2026/0224/699cff95bda5fc6bcf81a15c.shtml'},
 noodles:{title:'四川省人民政府 · 担担面',url:'https://www.sc.gov.cn/10462/c112071/2024/6/19/00ab7552c02946c4a209af2e4b0732a0.shtml'}
};
export const articles = [
 {id:'noodles',title:'一碗担担面，尝见成都',short:'担担面',en:'A TASTE OF CHENGDU',tags:['eat'],scene:0,minutes:2,dek:'细面与调味相遇，一座城的滋味，从拌匀的那一刻开始。',intro:'认识一座城市，有时可以从一小碗面开始。担担面是与四川饮食紧密相连的面食。面条、配料与碗底的调味共同组成滋味；不同店家的做法，也各有自己的习惯。',details:[['先看配料','留意面上铺了什么，再观察调味藏在碗底还是浇在面上。'],['拌一拌','把调味拌开，比较面条颜色和香气的变化。'],['慢慢尝','麻、辣、咸、香是不同的感受，可以分别描述。']],story:'食物并不只有一种“标准答案”。同一个名字，在不同家庭和小店中也会有细微差别。把注意力放在面条的口感、配料和调味上，比急着给它打分，更容易读懂一碗面的性格。',observe:'先询问口味和配料，再按自己的习惯选择。与孩子一起体验时，可以从不辣或少辣开始，留意个人过敏原。',question:'同一碗面，拌匀之前和之后，有什么不同？',answer:'可以分别观察颜色、闻一闻香气，再描述口感。每个人的感受都可以不一样。',refs:['noodles']},
 {id:'tea',title:'在一盏茶里，慢下来',short:'成都茶馆',en:'THE ART OF TAKING TIME',tags:['eat','culture'],scene:1,minutes:3,dek:'竹椅、盖碗与摆龙门阵，坐下来，才算走近这座城。',intro:'成都茶馆里的主角，除了茶，还有人。竹椅间的交谈、桌上的盖碗、有人坐下又有人离开，构成了日常生活的一角。来这里，不妨先找一个位置，听听周围的声音。',details:[['茶盖','覆盖碗口。饮茶时可轻轻拨开茶叶，留出小缝。'],['茶碗','盛放茶汤。观察碗口、碗身和手握的位置。'],['茶船','承托茶碗，也叫茶托。看它与碗底怎样相配。']],story:'“摆龙门阵”是四川话里聊天、讲故事的说法。茶馆把人们聚在一起，喝茶与交谈自然地连成一件事。竹椅、矮桌和盖碗既是器物，也让一段停留有了具体的形状。每家茶馆都有自己的节奏，图中的场景是对这种生活氛围的艺术化描绘。',observe:'找一找茶盖、茶碗、茶船，再听一听水声和交谈声。尊重正在休息的茶客；拍摄人物前先征求同意。热水由大人协助，先等茶汤降温。',question:'找一找：盖碗为什么要分成三个部分？',answer:'可以从“盖住、盛放、承托”三个动作开始想。试着画一只自己的茶碗，想想怎样拿着更稳。不要直接触碰刚注入热水的器具。',refs:['tea','teaLife']},
 {id:'park',title:'把一个下午，交给公园',short:'城市公园',en:'A WALK THROUGH EVERYDAY LIFE',tags:['play','culture'],scene:2,minutes:2,dek:'树荫里的脚步与声音，是另一种认识成都的方式。',intro:'公园让一座城市的日常变得容易看见。沿着步道走一段，看树影怎样落在路面，也看看人们怎样使用这片公共空间。成都人民公园中的茶馆与文化活动，是观察城市生活的一个入口。',details:[['看树影','在同一条路上，寻找明暗和叶形的变化。'],['听声音','把鸟鸣、脚步、交谈和音乐分别记下来。'],['看生活','留意散步、休息与相聚，尊重彼此的空间。']],story:'旅行中的公园，不一定要有一个必须完成的清单。一次停步、一张长椅、一段树荫，都可以成为认识当地生活的线索。这里的插画表现公园生活的氛围，并不对应某一段可直接导航的道路。',observe:'选择一小段步道慢慢走。把自然声音和人们活动的声音分成两组，看看这座公园怎样容纳它们。',question:'闭上眼睛十秒，你能分辨几种声音？',answer:'先站在安全的位置，再与同伴分享。可以尝试画一张没有道路、只有声音的公园地图。',refs:['park','teaLife']},
 {id:'dujiangyan',county:'510181',title:'让江水，找到合适的去处',short:'都江堰',en:'WISDOM ALONG THE RIVER',tags:['play','culture'],scene:3,minutes:3,dek:'从分水到排沙，顺着岷江读一段人与水的故事。',intro:'都江堰是理解成都平原的一把钥匙。鱼嘴、飞沙堰、宝瓶口相互配合，把分水、排沙与控制引水联系起来。看它时，先追问水往哪里走，会比只记住三个名字更有意思。',details:[['鱼嘴','把岷江分成内江和外江。'],['飞沙堰','帮助排出多余水量与泥沙。'],['宝瓶口','控制引入成都平原的水量。']],story:'这套工程的重要之处，在于让几个部分共同工作。它利用河流与地形，也依靠长期维护。眼前的景观既关乎古代智慧，也关乎一代代人的管理与修护。插画用于表达江水与山地的关系，具体工程位置以现场与资料示意为准。',observe:'沿现场指示辨认内江与外江，再寻找水流的转弯和收窄。只在开放步道上观察，不靠近无防护的水边。',question:'想一想：如果水变多了，它可以从哪里离开？',answer:'结合现场示意图，找找飞沙堰与外江。试着用箭头画出几条水路，而不是只画一条直线。',refs:['water']},
 {id:'opera',title:'一声锣响，故事登场',short:'川剧',en:'STORIES ON THE STAGE',tags:['culture'],scene:4,minutes:2,dek:'从眼神、身段到唱腔，发现舞台上丰富的表达。',intro:'川剧的乐趣，远不止瞬间变换的脸谱。唱腔、念白、身段和锣鼓共同讲故事。第一次观看，可以先挑一种线索：演员怎样走路，怎样看人，又怎样让情绪发生变化。',details:[['听唱腔','川剧汇集高腔、昆腔、胡琴、弹戏、灯调等声腔。'],['看身段','观察手势、脚步和衣袖怎样配合。'],['听锣鼓','留意节奏怎样跟随出场、动作与转折。']],story:'戏曲舞台常用有限的布景表达丰富的空间。一个动作可以提示人物正在赶路，也可以让观众感到犹疑或欣喜。把注意力从“发生了什么技巧”移向“人物在想什么”，会发现另一层故事。',observe:'观看前先了解剧目梗概。结束后和同伴各选一个记得最清楚的动作，说说它让你感到了什么。',question:'不说话，只用走路和眼神，能表现着急吗？',answer:'在不打扰他人的地方试一试。与同伴交换表演，再讨论哪些动作让情绪更容易被看懂。',refs:['opera']},
 {id:'silk',title:'把花纹，织进经纬之间',short:'蜀锦',en:'PATTERNS WOVEN IN TIME',tags:['culture'],scene:5,minutes:3,dek:'走近丝线、织机与纹样，认识成都的另一种细腻。',intro:'蜀锦与成都的丝织传统相连。花纹在织造的过程中形成，丝线的排列、色彩与组织方式共同决定织物的面貌。与其只看成品，不妨把目光移向线与线怎样交织。',details:[['经与纬','两组方向不同的线，共同构成织物。'],['看纹样','寻找一个重复的单元，观察它怎样连续出现。'],['看光泽','换一个角度，留意丝线反光的变化。']],story:'传统手工蜀锦织造包含对花纹与织机的细致安排。技艺的延续既在成品中，也在人的手上。图中的织机和纹样是主题插画，并非可据以复原设备的技术图。',observe:'在允许参观的展示中，先看线的走向，再看图案。未经允许不要触碰织物和设备，讲解时可以问问一个花纹需要怎样准备。',question:'找一找：一块花纹里，最小的重复单位是什么？',answer:'先圈出一个图形，再看它向左、向右、向上如何排列。也可以用方格纸设计自己的双色纹样。',refs:['silk']}
];
articles.push(...culturalArticles);
export function matchesDestination(query,category){
 const text=['成都','四川','chengdu','sichuan',...articles.filter(a=>category==='all'||a.tags.includes(category)).flatMap(a=>[a.short,a.title,a.dek]),...(category==='all'||category==='culture'||category==='play'?[...people.flatMap(p=>[p.name,p.place]),...poems.flatMap(p=>[p.title,...p.lines])]:[])].join(' ').toLowerCase();
 return text.includes(query.trim().toLowerCase());
}
