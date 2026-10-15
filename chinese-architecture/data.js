export const SOURCES = [
 {id:'facade',title:'香港教育局：园池木构建筑',url:'https://www.edb.gov.hk/attachment/sc/curriculum-development/kla/pshe/references-and-resources/ethics-and-religious-studies/Nan_Lian_Garden/3iii_sc.pdf',note:'PDF第2页：当中五间板门、两端槛墙直棂窗；尺寸及修缮分期未核。'},
 {id:'survey',title:'张荣：佛光寺东大殿数字化勘察与唐代材分研究',url:'https://www.kaah.or.kr/download/mailing/kaah_seminar_presentation1_1.pdf',note:'PDF 第 16–18、26–28 页：梁架剖面、外檐铺作、开间与材分。'},
 {id:'plan',title:'梁思成 1937 年东大殿测绘图 · 香港大学资料页',url:'https://learning.hku.hk/ccch9051/group-13/items/show/1',note:'七间、四进；22 根外柱与 14 根内柱。'},
 {id:'dimensions',title:'East Main Hall · 结构与木材退化研究',url:'https://www.mdpi.com/2673-4117/7/5/200',note:'第 3.1 节与图 5：总体尺寸与结构分析模型。分析模型不等同于实测复原。'},
 {id:'heritage',title:'五台山 · 联合国教科文组织',url:'https://whc.unesco.org/en/list/1279/',note:'佛光寺东大殿的遗产背景。'}
];
export const LAYERS = [
 {id:'foundation',label:'台基 · 柱础',short:'石作',color:'#929783',offset:0},
 {id:'columns',label:'内外柱网',short:'柱网',color:'#a06b44',offset:.5},
 {id:'ties',label:'阑额 · 柱间联系',short:'阑额',color:'#9d533c',offset:1.3},
 {id:'brackets',label:'铺作 · 华栱 · 下昂',short:'铺作',color:'#c39555',offset:3.5},
 {id:'ming',label:'明栿 · 乳栿 · 丁栿',short:'明栿',color:'#986d43',offset:5.5},
 {id:'ceiling',label:'平闇 · 格栅',short:'平闇',color:'#73896e',offset:7.5},
 {id:'roofFrame',label:'草栿 · 蜀柱 · 叉手',short:'草架',color:'#be8854',offset:10},
 {id:'purlins',label:'槫 / 檩 · 承椽横木',short:'槫檩',color:'#807b4b',offset:12.5},
 {id:'rafters',label:'椽 · 角梁 · 檐口',short:'椽架',color:'#b79b66',offset:15},
 {id:'roof',label:'望板 · 瓦面 · 屋脊',short:'屋面',color:'#626e66',offset:18},
 {id:'enclosure',label:'墙体 · 板门 · 直棂窗',short:'围护',color:'#aa9b7e',offset:.5}
];
export const CHAPTERS = [
 {id:'whole',n:'01',title:'观全貌',subtitle:'从屋顶读到台基',text:'单檐四阿顶覆盖七开间的殿身。先旋转模型，观察深檐、山面与四条斜向垂脊；随后依次揭去屋面，进入木构内部。',visible:LAYERS.map(l=>l.id),view:'iso',facts:[['七开间','两端稍窄，中部五间较宽'],['模型坐标','前檐朝西；长轴沿南北方向']],question:'试着拖动建筑，绕到山面：屋顶的四个坡面在哪里汇合？'},
 {id:'grid',n:'02',title:'认柱网',subtitle:'36 根柱，围出两重空间',text:'外圈 22 柱，内圈 14 柱，围成回字形的柱网。俯视可辨认外槽与内槽；墙体关闭后，承重骨架与围护的关系更清楚。',visible:['foundation','columns','ties'],view:'top',facts:[['22 + 14','外檐柱与内槽柱'],['34.00 × 17.66 m','柱网总体参考尺度，非屋面外轮廓']],question:'沿着前檐数一数：八根柱之间，为什么是七间？'},
 {id:'bracket',n:'03',title:'解铺作',subtitle:'一攒外檐柱头铺作',text:'进入柱头铺作局部。栌斗坐在柱头，两跳华栱向外递出，两道下昂带着斜度向内延伸。用局部拆合滑杆分开构件，逐件点选查看。',visible:['brackets'],view:'detail',facts:[['双杪双下昂','外檐柱头铺作的构造特征'],['约 1.97 m','采用研究中的四跳水平合计值']],question:'旋转到侧面，沿下昂看过去：它的后尾伸向屋内哪里？'},
 {id:'beams',n:'04',title:'辨梁架',subtitle:'平闇上下，两套梁栿',text:'明栿位于可见空间，用较规整的月梁轮廓；草栿位于上部屋架。四椽栿、乳栿与丁栿承担不同位置的跨接，不能用同一根横梁替代。',visible:['foundation','columns','ties','brackets','ming','roofFrame','purlins'],view:'section',facts:[['下：明栿','乳栿、四椽栿、侧向丁栿'],['上：草架','草栿、短柱与脊下叉手']],question:'在剖切中找到叉手：两根斜木如何在脊槫下相交？'},
 {id:'roofing',n:'05',title:'循屋架',subtitle:'槫、椽与四坡屋面',text:'沿长轴布置的槫承接顺坡椽，四隅的角梁组织转角。关闭瓦面，观察椽子由脊部向檐口铺展的方向，再对照山面上的变化。',visible:['foundation','columns','ties','brackets','ming','roofFrame','purlins','rafters'],view:'iso',facts:[['槫 / 檩','顺长轴布置的承椽横木'],['四阿顶','两片长坡面与两片山面坡面']],question:'点选一根椽，再点选其下方的槫：二者的方向是否相同？'},
 {id:'explode',n:'06',title:'拆而复合',subtitle:'把整座木构分层展开',text:'将台基、柱网、铺作、梁架和屋面分层拉开，建立从下到上的构造次序。分层位移用于观察；它不是现场拆卸顺序，也不表示构件在施工中可以独立悬空。',visible:LAYERS.filter(l=>l.id!=='enclosure').map(l=>l.id),view:'exploded',facts:[['逐层开关','任意隐藏或恢复一个构造层'],['复位','回到完整建筑与初始视角']],question:'把所有层合回，看看屋面、梁架和柱网怎样重新对齐。'}
];
export const PARTS = {
 foundation:{name:'台基与阶石',term:'石作 / 基础',text:'水平石台承托殿身，阶石连接台面与地面。模型呈现可见台基体量，不包含地下基础。',evidence:'外形示意；未取得地下基础测绘资料。'},
 base:{name:'柱础',term:'石作 / 柱脚',text:'木柱落座于石础上。选中高亮可以观察柱脚与石面接触的位置。础面、圆鼓与底座分件建模。',evidence:'位置随柱网确定；柱础剖面和尺寸为教学近似。'},
 outerColumn:{name:'外檐柱',term:'柱网 / 外圈',text:'外圈共有 22 根柱。柱身上承柱头铺作，并以阑额联系相邻柱。',evidence:'数量与柱网有文献依据；柱高、卷杀与侧脚尚未逐柱实测。'},
 innerColumn:{name:'内槽柱',term:'柱网 / 内圈',text:'内圈共有 14 根柱。与外柱共同支撑殿堂构架，内外柱圈之间形成外槽。',evidence:'数量与两圈布局有依据；模型对内槽进深采用规则化分配。'},
 tie:{name:'阑额',term:'柱网 / 水平联系',text:'位于柱头之间的横向构件，联系相邻立柱。这里可与柱上独立的铺作区分。',evidence:'位置为构架关系重建；端部榫口未按每根原构件复原。'},
 ludou:{name:'栌斗',term:'铺作 / 柱头大斗',text:'整攒铺作在柱头处的承托木件。模型把斗底、斜欹和槽口肩部分开，便于辨认华栱与泥道栱的交叉落座。',evidence:'参照外檐剖面；槽口为可视化配合，非加工尺寸。'},
 mudao:{name:'泥道栱',term:'铺作 / 柱头横栱',text:'沿檐面方向展开的栱，与向出檐方向伸展的华栱相交。旋转到俯视可以看清两者方向。',evidence:'方向和层次据铺作图；曲线与端部削切为近似。'},
 huagong:{name:'华栱',term:'铺作 / 第一、二跳',text:'垂直檐面向外出跳。两跳伸出量并不相同；模型采用约 0.543 m 与 0.449 m。第一跳外端不添加横栱，以表现偷心做法。',evidence:'伸出量参考勘察统计均值；构件内部榫槽未全部揭示。'},
 dou:{name:'散斗 / 交互斗',term:'铺作 / 小斗',text:'承接上下相交的栱或横木。斗肩留出的槽口显示木件的落座方向；不同部位的真实槽口仍须逐件核对。',evidence:'构件类别有依据；此处使用规则化槽口。'},
 ang:{name:'下昂',term:'铺作 / 斜向构件',text:'外端较低，后尾向屋内升高。两道下昂与水平华栱共同组织外檐铺作。局部视图保留后尾，便于看清其斜向延伸。',evidence:'角度采用研究的约 24°；隐蔽端部搭接为推定。'},
 linggong:{name:'令栱 / 横向承托栱',term:'铺作 / 檐部',text:'在铺作外端沿檐面展开，承接上部替木与撩檐槫。由正面看横向展开，再转到侧面看出挑位置。',evidence:'外端位置与构件层次据剖面，端部轮廓为近似。'},
 timu:{name:'替木',term:'铺作 / 槫下垫木',text:'槫下的短承托木，增大支承接触长度。上方圆形的槫与下方层叠的铺作在这里联系。',evidence:'构件关系据剖面；长度为比例近似。'},
 intermediate:{name:'补间铺作（简化）',term:'铺作 / 柱间',text:'位于柱间阑额上的铺作。模型用人字形支撑和短栱表现它与柱头铺作的区别。',evidence:'补间构造与逐攒位置未完整测绘，此处为拓扑示意。'},
 innerBracket:{name:'内槽铺作（简化）',term:'铺作 / 内柱',text:'内槽铺作朝内槽方向承托梁架。这里分出多层华栱，与外檐的双下昂构造区别呈现。',evidence:'内向多跳依据勘察表；完整互锁与每攒差异尚未复原。'},
 ming:{name:'明栿 · 四椽栿',term:'梁架 / 可见梁栿',text:'跨接内槽的梁栿，位于平闇以下。月梁形下缘与上部草栿的直身外形形成区别。',evidence:'种类、跨接关系据剖面；梁高和曲线采用比例近似。'},
 rufu:{name:'明乳栿',term:'梁架 / 外槽',text:'在前后外槽中联系外檐与内槽支承位置。它与跨接内槽的四椽栿共同构成横向联系。',evidence:'构架关系有依据；具体标高与节点为教学近似。'},
 dingfu:{name:'丁栿',term:'梁架 / 山面联系',text:'山面附近按横向联系需要布置的梁栿。与中部横架方向不同，用于理解端部屋架。',evidence:'位置为剖面与平面关系重建，隐蔽端头未核定。'},
 ceiling:{name:'平闇',term:'室内 / 天花',text:'平闇将室内可见梁栿与上部屋架在视觉上分隔。模型可独立关闭格栅和面板，观察上下构造。',evidence:'层位有文献依据；格栅间距与面板纹样为示意。'},
 caofu:{name:'草栿',term:'屋架 / 上层梁栿',text:'位于平闇上部，用较直、粗大的木件支撑上方屋架。分层后可看清它与明栿的位置差别。',evidence:'类型与上下关系依据剖面；所有梁截面尚未逐件量取。'},
 shuzhu:{name:'蜀柱 / 短柱',term:'屋架 / 层间承托',text:'上层梁架之间的短竖向承托，帮助逐级抬高上部构件。底下的垫木与横梁也单独呈现。',evidence:'布置为剖面原理重建；不是实测构件清单。'},
 chashou:{name:'叉手',term:'屋架 / 脊下斜木',text:'成对斜木在屋脊下形成叉手关系。局部剖切时可看见它与脊槫及下方梁架的位置。',evidence:'叉手形式有图像依据；交叠节点为可视化近似。'},
 purlin:{name:'槫（檩）',term:'屋架 / 纵向圆木',text:'沿长轴展开，承接顺坡方向的椽。脊部、各坡段与檐口的槫标高不同，共同组织屋面曲线。',evidence:'方向与层级据剖面；各道标高为比例重建。'},
 rafter:{name:'椽',term:'屋架 / 顺坡密木',text:'顺屋面坡向排列，跨在各道槫上。模型逐根建出长坡椽与山面椽，便于观察方向变化。',evidence:'方向与系统关系有依据；间距、根数和截面规则化。'},
 hip:{name:'角梁',term:'屋架 / 四隅',text:'斜向连接屋脊端部与檐角，组织两片坡面交汇处的椽架。',evidence:'路径依据四阿屋顶几何；翼角互锁、角昂穿插未实测复原。'},
 roof:{name:'望板与瓦面',term:'屋面 / 覆盖层',text:'椽上覆盖望板与灰瓦。瓦垄、檐口瓦当和屋脊均为独立几何，可以隐藏屋面观察下方木构。',evidence:'瓦垄密度、脊饰和曲面为视觉近似，未复原单片实物尺寸。'},
 enclosure:{name:'墙体、板门与直棂窗',term:'围护 / 殿身边界',text:'围护关闭后，柱网和梁架仍可独立辨认。模型呈现面向西的前檐入口与山面、后檐围护。',evidence:'五门两窗形制有文献与照片支持；全部厚度、标高和分段为比例推定，未复原唐代门廊。'}
};
