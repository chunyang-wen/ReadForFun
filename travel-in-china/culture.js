export const culturalSources={
 cottage:{title:'成都杜甫草堂博物馆 · 草堂简介',url:'https://www.cddfct.cn/go-c11.htm'},
 springRain:{title:'国家档案局 · 晓看红湿处，花重锦官城',url:'https://www.saac.gov.cn/daj/c100254/201507/8f865b8979f0433c9a23de6629726dd4.shtml'},
 xuetao:{title:'望江楼公园 · 薛涛纪念馆',url:'https://www.wangjianglou.com/xhall/'},
 wuhou:{title:'成都武侯祠博物馆 · 武侯祠简介',url:'https://www.wuhouci.net.cn/about-events/655674906054234112'},
 jueju:{title:'唐诗之境 · 绝句原文与讲解',url:'../tang-shi/#du-fu-jue-ju-liang-ge-huang-li-ming-cui-liu'}
};
export const people=[
 {id:'dufu',name:'杜甫',era:'唐代',place:'杜甫草堂 · 浣花溪',county:'510105',relation:'流寓与创作',summary:'在成都的生活，让春雨、草堂、江船与雪山进入诗篇。',article:'dufu',source:'cottage'},
 {id:'xuetao',name:'薛涛',era:'唐代',place:'望江楼公园 · 薛涛纪念馆',county:'510107',relation:'后世纪念地',summary:'从女诗人的创作与薛涛笺，认识成都的文学记忆。',article:'xuetao',source:'xuetao'},
 {id:'zhuge',name:'诸葛亮',era:'三国时期',place:'成都武侯祠',county:'510107',relation:'历史人物纪念地',summary:'在祠庙、碑刻和后世诗篇中，理解一位历史人物如何被记住。',article:'wuhou',source:'wuhou'}
];
export const poems=[
 {id:'spring-rain',title:'春夜喜雨',author:'杜甫',era:'唐代',place:'成都 · 锦官城',county:'510105',relation:'成都生活与诗中城市',lines:['好雨知时节，当春乃发生。','随风潜入夜，润物细无声。','野径云俱黑，江船火独明。','晓看红湿处，花重锦官城。'],explanation:'诗人把春雨写得像一位懂得季节的朋友。由夜雨想到清晨的花，雨声、灯火与想象共同展开成都的春天。',note:'“锦官城”指成都。草堂是理解其成都生活的入口，不把每一句景物绑定为今天可定位的拍摄点。',article:'dufu',source:'springRain'},
 {id:'jueju',title:'绝句 · 两个黄鹂鸣翠柳',author:'杜甫',era:'唐代',place:'成都草堂生活',county:'510105',relation:'草堂时期诗作',lines:['两个黄鹂鸣翠柳，一行白鹭上青天。','窗含西岭千秋雪，门泊东吴万里船。'],explanation:'先看近处的鸟与柳，再把目光推向雪山和远船。四句诗让一扇窗、一扇门，连接起辽阔的世界。',note:'“西岭”是远景，“东吴”关联船只与远方；不要把诗中出现的地名都当成诗人正在游览的地点。',article:'dufu',source:'jueju'},
 {id:'shuxiang',title:'蜀相 · 节选',author:'杜甫',era:'唐代',place:'成都武侯祠',county:'510107',relation:'诗作追怀历史人物',lines:['丞相祠堂何处寻，锦官城外柏森森。'],explanation:'从寻找祠堂写起，柏树把目光引向诸葛亮。这里可以同时读到三国人物、唐代诗人的追怀与后世的纪念。',note:'诗中的祠堂与今天的博物馆有历史联系，现存建筑不能直接视为杜甫当年见到的原貌。',article:'wuhou',source:'wuhou'}
];
export const culturalArticles=[
 {id:'dufu',title:'跟着杜甫，读一场成都的雨',short:'杜甫与草堂',en:'A CITY IN A POEM',tags:['play','culture'],scene:6,minutes:4,people:['dufu'],poems:['spring-rain','jueju'],county:'510105',dek:'从“花重锦官城”走向浣花溪，让熟悉的诗句重新有了地方。',intro:'一座城市不仅留在地图上，也会留在诗里。杜甫曾流寓成都，草堂成为理解他这段生活的重要入口。走近这里，可以把熟悉的诗句与雨、树、溪流联系起来，也留意今天的纪念空间如何讲述过去。',details:[['人物','杜甫，唐代诗人。先了解他的成都生活，再读作品。'],['地方','杜甫草堂位于成都青羊区，邻近浣花溪。'],['诗中城市','“锦官城”让一首写雨的诗与成都相连。']],story:'读《春夜喜雨》，可以先顺着时间走：夜里，雨轻轻落下；想象中的清晨，花朵沾满雨水。再读《绝句》，视线从近处的鸟和柳推向远方。旅行时，把“诗写了什么”和“今天看见什么”放在一起比较，会比只背下一句更有意思。',observe:'在草堂或浣花溪附近寻找水、树和窗景，试着用一句自己的话描写。今天的建筑与园林历经修葺，不能将插画或现存茅屋视为唐代原样。',question:'读一读：诗里哪些是眼前所见，哪些是想象中的画面？',answer:'例如《春夜喜雨》先写夜色，末联想象清晨的花。可以给“听到的、看到的、想到的”各选一种颜色。',refs:['cottage','springRain','jueju']},
 {id:'xuetao',title:'在竹影与诗笺间，认识薛涛',short:'薛涛与望江楼',en:'A WOMAN IN THE CITY’S MEMORY',tags:['play','culture'],scene:7,minutes:3,people:['xuetao'],poems:[],county:'510107',dek:'一位女诗人，一座后世纪念她的园林，还有纸上的文学生活。',intro:'到望江楼公园，不妨带着一个名字出发：薛涛。她是与成都关系密切的唐代女诗人。这里的薛涛纪念馆，让人从诗歌、诗笺与生平资料走近她，而不只是记住一座楼的名字。',details:[['人物','从薛涛的创作与生活经历认识唐代女诗人。'],['诗笺','“笺”是一种用于书写的小幅纸，薛涛笺与其文学记忆相连。'],['纪念地','今天的望江楼建筑和纪念馆承载后世记忆，并非唐代原居所的直接复原。']],story:'一位诗人的影响，可以在书页之外延续。后人修建纪念空间、整理生平、阅读作品，让名字与地方不断产生新的联系。把“她生活的时代”和“人们纪念她的时代”分开看，会发现城市文化也有自己的年轮。',observe:'在展览中找一找作品、生平与后世纪念这三类材料。遇到“相传”或“传说”的说明，留意它与有文献依据的记载有什么区别。',question:'想一想：纪念一位诗人，只能立一座雕像吗？',answer:'也可以保存作品、举办朗读、设计展览或写一张诗笺。试着为你喜欢的诗人设计一份小小的纪念。',refs:['xuetao']},
 {id:'wuhou',title:'沿着红墙，遇见历史中的诸葛亮',short:'诸葛亮与武侯祠',en:'HISTORY, POETRY & REMEMBRANCE',tags:['play','culture'],scene:8,minutes:3,people:['zhuge'],poems:['shuxiang'],county:'510107',dek:'三国人物、唐代诗篇与今天的祠庙，在成都相遇。',intro:'武侯祠让诸葛亮与成都的关系变得具体。这里保存的并非一段单一时代的场景，而是人们长期纪念刘备、诸葛亮等蜀汉人物的文化空间。参观时，可以把历史人物、文学形象与后世建筑分别读懂。',details:[['人物','诸葛亮是蜀汉丞相，刘备是蜀汉建立者。'],['诗篇','杜甫《蜀相》写到锦官城外的丞相祠堂。'],['空间','现存祠庙经历历史变迁；碑刻、匾额与展览各有时代。']],story:'同一个人，在史书、诗歌和故事中可能以不同方式出现。杜甫写《蜀相》，把自己的追怀留在诗里；后人又通过祠庙和碑刻表达敬意。读懂这些层次，就能理解一处景点为什么会承载那么长的记忆。',observe:'找一处碑刻或匾额，先看年代、作者和说明，再读内容。把史实、文学表达和民间传说分别记在笔记的三栏里。',question:'找一找：这里有哪些属于不同年代的线索？',answer:'可以从碑刻题记、建筑说明和展览年表寻找。年代不同并不矛盾，它们共同组成后世不断纪念的历史。',refs:['wuhou']}
];
