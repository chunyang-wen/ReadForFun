# ReadForFun 唐诗宋词配图生成队列

> 这是供后续 agent handoff 的规划文件。本文件只盘点和规划，不代表图片已经生成。
> 生成时应以条目正文和语义为准，保持中国古典绘画/绘本质感，画面中不要出现文字、题字、水印或现代标志。

## 范围与统计

- 唐诗：49 首使用默认/占位 SVG 配图的条目；每首 1 张图，共 49 张。远端已存在的 `poem.webp` 不重复生成。
- 宋词：68 首新增词，按上阕/下阕各 1 张，共 136 张。新增范围按当前数据的第 33–100 条判定。
- 待生成图片总数：185 张。
- 未列入：已有远端 `poem.webp` 的 51 首唐诗，以及原有宋词 32 首。

## 统一生成约定

1. 网格中的每个格子是同一张画面内的语义分镜，不是把诗句排版到图上。
2. 同一首诗/词要保持人物、服饰、建筑、季节和光线连续；格与格之间允许远景、中景、特写变化。
3. 优先表现动作、关系和情绪转折；不要只画泛化山水。
4. 生成完成后写回对应数据的图片引用，并保留本文件中的 `id`、分组和网格作为审计信息。

## 任务清单

### 唐诗

#### 001. 王維《山居秋暝》

- `id`: `wang-wei---shan-ju-qiu-ming`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---shan-ju-qiu-ming/poem.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 四格对应四句，保持同一时空与人物/景物连续性；每格只承担一个动作或意象。
- `content`: 空山新雨後，天氣晚來秋。 / 明月松間照，清泉石上流。 / 竹喧歸浣女，蓮動下漁舟。 / 隨意春芳歇，王孫自可留。
- `status`: `done`

#### 002. 李商隱《夜雨寄北》

- `id`: `li-shang-yin---ye-yu-ji-bei`
- `target_asset`: `ReadForFun/tang-shi/images/li-shang-yin---ye-yu-ji-bei/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 君問歸期未有期，巴山夜雨漲秋池。 / 何當共剪西窗燭，却話巴山夜雨時。
- `status`: `done`

#### 003. 杜牧《秋夕》

- `id`: `du-mu---qiu-xi`
- `target_asset`: `ReadForFun/tang-shi/images/du-mu---qiu-xi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 紅燭秋光冷畫屏，輕羅小扇撲流螢。 / 天階夜色涼如水，坐看牽牛織女星。
- `status`: `done`

#### 004. 孟浩然《宿建德江》

- `id`: `meng-hao-ran---su-jian-de-jiang`
- `target_asset`: `ReadForFun/tang-shi/images/meng-hao-ran---su-jian-de-jiang/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 移舟泊煙渚，日暮客愁新。 / 野曠天低樹，江清月近人。
- `status`: `done`

#### 005. 王維《相思》

- `id`: `wang-wei---xiang-si`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---xiang-si/poem.webp`
- `image_count`: `1`
- `grid`: `1×1`
- `layout_note`: 全诗合成一幅完整的留白式画面，突出核心意象与情绪。
- `content`: 紅豆生南國，秋來發故枝。 / 願君多采擷，此物最相思。
- `status`: `done`

#### 006. 柳宗元《江雪》

- `id`: `liu-zong-yuan---jiang-xue`
- `target_asset`: `ReadForFun/tang-shi/images/liu-zong-yuan---jiang-xue/poem.webp`
- `image_count`: `1`
- `grid`: `1×1`
- `layout_note`: 全诗合成一幅完整的留白式画面，突出核心意象与情绪。
- `content`: 千山鳥飛絕，萬逕人蹤滅。 / 孤舟蓑笠翁，獨釣寒江雪。
- `status`: `done`

#### 007. 白居易《長恨歌》

- `id`: `bai-ju-yi---zhang-hen-ge`
- `target_asset`: `ReadForFun/tang-shi/images/bai-ju-yi---zhang-hen-ge/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 漢皇重色思傾國，御宇多年求不得。 / 楊家有女初長成，養在深閨人未識。 / 天生麗質難自棄，一朝選在君王側。 / 回眸一笑百媚生，六宮粉黛無顏色。 / 春寒賜浴華清池，溫泉水滑洗凝脂。 / 侍兒扶起嬌無力，始是新承恩澤時。 / 雲鬢花顏金步搖，芙蓉帳暖度春宵。 / 春宵苦短日高起，從此君王不早朝。 / 承歡侍宴無閑暇，春從春遊夜專夜。 / 後宮佳麗三千人，三千寵愛在一身。 / 金屋妝成嬌侍夜，玉樓宴罷醉和春。 / 姊妹弟兄皆列土，可憐光彩生門戶。 / 遂令天下父母心，不重生男重生女。 / 驪宮高處入青雲，仙樂風飄處處聞。 / 緩歌慢舞凝絲竹，盡日君王看不足。 / 漁陽鞞鼓動地來，驚破霓裳羽衣曲。 / 九重城闕煙塵生，千乘萬騎西南行。 / 翠華搖搖行復止，西出都門百餘里。 / 六軍不發無奈何，宛轉蛾眉馬前死。 / 花鈿委地無人收，翠翹金雀玉搔頭。 / 君王掩面救不得，回看血淚相和流。 / 黃埃散漫風蕭索，雲棧縈紆登劒閣。 / 峨嵋山下少人行，旌旗無光日色薄。 / 蜀江水碧蜀山青，聖主朝朝暮暮情。 / 行宮見月傷心色，夜雨聞鈴腸斷聲。 / 天旋日轉迴龍馭，到此躊躇不能去。 / 馬嵬坡下泥土中，不見玉顏空死處。 / 君臣相顧盡霑衣，東望都門信馬歸。 / 歸來池苑皆依舊，太液芙蓉未央柳。 / 芙蓉如面柳如眉，對此如何不淚垂？ / 春風桃李花開夜，秋雨梧桐葉落時。 / 西宮南苑多秋草，宮葉滿階紅不埽。 / 棃園弟子白髮新，椒房阿監青娥老。 / 夕殿螢飛思悄然，孤燈挑盡未成眠。 / 遲遲鐘鼓初長夜，耿耿星河欲曙天。 / 鴛鴦瓦冷霜華重，翡翠衾寒誰與共。 / 悠悠生死別經年，魂魄不曾來入夢。 / 臨邛道士鴻都客，能以精誠致魂魄。 / 爲感君王展轉思，遂教方士殷勤覓。 / 排空馭氣奔如電，升天入地求之徧。 / 上窮碧落下黃泉，兩處茫茫皆不見。 / 忽聞海上有仙山，山在虛無縹緲間。 / 樓閣玲瓏五雲起，其中綽約多仙子。 / 中有一人字太真，雪膚花貌參差是。 / 金闕西廂叩玉扃，轉教小玉報雙成。 / 聞道漢家天子使，九華帳裏夢魂驚。 / 攬衣推枕起裴回，珠箔銀屏邐迤開。 / 雲鬢半偏新睡覺，花冠不整下堂來。 / 風吹仙袂飄颻舉，猶似霓裳羽衣舞。 / 玉容寂莫淚闌干，棃花一枝春帶雨。 / 含情凝睇謝君王，一別音容兩渺茫。 / 昭陽殿裏恩愛絕，蓬萊宮中日月長。 / 回頭下望人寰處，不見長安見塵霧。 / 唯將舊物表深情，鈿合金釵寄將去。 / 釵留一股合一扇，釵擘黃金合分鈿。 / 但教心似金鈿堅，天上人間會相見。 / 臨別殷勤重寄詞，詞中有誓兩心知。 / 七月七日長生殿，夜半無人私語時。 / 在天願作比翼鳥，在地願爲連理枝。 / 天長地久有時盡，此恨緜緜無絕期。
- `status`: `done`

#### 008. 白居易《琵琶引》

- `id`: `bai-ju-yi---pi-pa-yin`
- `target_asset`: `ReadForFun/tang-shi/images/bai-ju-yi---pi-pa-yin/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 潯陽江頭夜送客，楓葉荻花秋索索。 / 主人下馬客在船，舉酒欲飲無管弦。 / 醉不成歡慘將別，別時茫茫江浸月。 / 忽聞水上琵琶聲，主人忘歸客不發。 / 尋聲暗問彈者誰，琵琶聲停欲語遲。 / 移船相近邀相見，添酒迴燈重開宴。 / 千呼萬喚始出來，猶抱琵琶半遮面。 / 轉軸撥弦三兩聲，未成曲調先有情。 / 弦弦掩抑聲聲思，似訴平生不得意。 / 低眉信手續續彈，說盡心中無限事。 / 輕攏慢撚抹復挑，初爲霓裳後六幺。 / 大弦嘈嘈如急雨，小弦切切如私語。 / 嘈嘈切切錯雜彈，大珠小珠落玉盤。 / 間關鶯語花底滑，幽咽泉流水下灘。 / 水泉冷澀弦疑絕，疑絕不通聲暫歇。 / 別有幽愁暗恨生，此時無聲勝有聲。 / 銀缾乍破水漿迸，鐵騎突出刀槍鳴。 / 曲終收撥當心畫，四弦一聲如裂帛。 / 東舟西舫悄無言，唯見江心秋月白。 / 沈吟放撥插弦中，整頓衣裳起斂容。 / 自言本是京城女，家在蝦蟇陵下住。 / 十三學得琵琶成，名蜀教坊第一部。 / 曲罷曾教善才伏，妝成每被秋娘妬。 / 五陵年少爭纏頭，一曲紅綃不知數。 / 鈿頭雲箆擊節碎，血色羅帬飜酒汙。 / 今年歡笑復明年，秋月春風等閑度。 / 弟走從軍阿姨死，暮去朝來顏色故。 / 門前冷落鞍馬稀，老大嫁作商人婦。 / 商人重利輕別離，前月浮梁買茶去。 / 去來江口守空船，繞船月明江水寒。 / 夜深忽夢少年事，夢啼妝淚紅闌干。 / 我聞琵琶已歎息，又聞此語重唧唧。 / 同是天涯淪落人，相逢何必曾相識。 / 我從去年辭帝京，謫居臥病潯陽城。 / 潯陽小處無音樂，終歲不聞絲竹聲。 / 住近湓江地低濕，黃蘆苦竹繞宅生。 / 其間旦暮聞何物，杜鵑啼血猨哀鳴。 / 春江花朝秋月夜，往往取酒還獨傾。 / 豈無山歌與村笛，嘔啞嘲哳難爲聽。 / 今夜聞君琵琶語，如聽仙樂耳暫明。 / 莫辭更坐彈一曲，爲君飜作琵琶行。 / 感我此言良久立，却坐促弦弦轉急。 / 淒淒不似向前聲，滿座重聞皆掩泣。 / 座中泣下誰最多，江州司馬青衫濕。
- `status`: `done`

#### 009. 韓愈《石鼓歌》

- `id`: `han-yu---shi-gu-ge`
- `target_asset`: `ReadForFun/tang-shi/images/han-yu---shi-gu-ge/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 張生手持石鼓文，勸我試作石鼓歌。 / 少陵無人謫仙死，才薄將奈石鼓何。 / 周綱陵遲四海沸，宣王憤起揮天戈。 / 大開明堂受朝賀，諸侯劒佩鳴相磨。 / 蒐于岐陽騁雄俊，萬里禽獸皆遮羅。 / 鐫功勒成告萬世，鑿石作鼓隳嵯峨。 / 從臣才藝咸第一，揀選撰刻留山阿。 / 雨淋日炙野火燎，鬼物守護煩撝呵。 / 公從何處得紙本，毫髮盡備無差訛。 / 辭嚴義密讀難曉，字體不類隸與科。 / 年深豈免有缺畫，快劒斫斷生蛟鼉。 / 鸞翔鳳翥衆僊下，珊瑚碧樹交枝柯。 / 金繩鐵索鎖紐壯，古鼎躍水龍騰梭。 / 陋儒編詩不收入，二雅褊迫無委蛇。 / 孔子西行不到秦，掎摭星宿遺羲娥。 / 嗟予好古生苦晚，對此涕淚雙滂沱。 / 憶昔初蒙博士徴，其年始改稱元和。 / 故人從軍在右輔，爲我度量掘臼科。 / 濯冠沐浴告祭酒，如此至寶存豈多。 / 氊包席裹可立致，十鼓祗載數駱駝。 / 薦諸太廟比郜鼎，光價豈止百倍過。 / 聖恩若許留太學，諸生講解得切磋。 / 觀經鴻都尚填咽，坐見舉國來奔波。 / 剜苔剔蘚露節角，安置妥帖平不頗。 / 大廈深簷與蓋覆，經歷久遠期無佗。 / 中朝大官老於事，詎肯感激徒媕婀。 / 牧童敲火牛礪角，誰復著手爲摩挲。 / 日銷月鑠就埋沒，六年西顧空吟哦。 / 羲之俗書趁姿媚，數紙尚可博白鵝。 / 繼周八代爭戰罷，無人收拾理則那。 / 方今太平日無事，柄任儒術崇丘軻。 / 安能以此上論列，願借辨口如懸河。 / 石鼓之歌止於此，嗚呼吾意其蹉跎。
- `status`: `done`

#### 010. 李商隱《韓碑》

- `id`: `li-shang-yin---han-bei`
- `target_asset`: `ReadForFun/tang-shi/images/li-shang-yin---han-bei/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 元和天子神武姿，彼何人哉軒與羲。 / 誓將上雪列聖恥，坐法宮中朝四夷。 / 淮西有賊五十載，封狼生貙貙生羆。 / 不據山河據平地，長戈利矛日可麾。 / 帝得聖相相曰度，賊斫不死神扶持。 / 腰懸相印作都統，陰風慘澹天王旗。 / 愬武古通作牙爪，儀曹外郎載筆隨。 / 行軍司馬智且勇，十四萬衆猶虎貔。 / 入蔡縛賊獻太廟，功無與讓恩不訾。 / 帝曰汝度功第一，汝從事愈宜爲辭。 / 愈拜稽首蹈且舞，金石刻畫臣能爲。 / 古者世稱大手筆，此事不繫于職司。 / 當仁自古有不讓，言訖屢頷天子頤。 / 公退齋戒坐小閣，濡染大筆何淋漓。 / 點竄堯典舜典字，塗改清廟生民詩。 / 文成破體書在紙，清晨再拜鋪丹墀。 / 表曰臣愈昧死上，詠神聖功書之碑。 / 碑高三丈字如斗，負以靈鼇蟠以螭。 / 句奇語重喻者少，讒之天子言其私。 / 長繩百尺拽碑倒，麤砂大石相磨治。 / 公之斯文若元氣，先時已入人肝脾。 / 湯盤孔鼎有述作，今無其器存其辭。 / 嗚呼聖皇及聖相，相與烜赫流淳熙。 / 公之斯文不示後，曷與三五相攀追。 / 願書萬本誦萬過，口角流沫右手胝。 / 傳之七十有二代，以爲封禪玉檢明堂基。
- `status`: `done`

#### 011. 李白《夢遊天姥吟留別》

- `id`: `li-bai---meng-you-tian-lao-yin-liu-bie`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---meng-you-tian-lao-yin-liu-bie/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 海客談瀛洲，煙濤微茫信難求。 / 越人語天姥，雲霓明滅或可覩。 / 天姥連天向天橫，勢拔五嶽掩赤城。 / 天台四萬八千丈，對此欲倒東南傾。 / 我欲因之夢吳越，一夜飛度鏡湖月。 / 湖月照我影，送我至剡溪。 / 謝公宿處今尚在，淥水蕩漾清猨啼。 / 脚著謝公屐，身登青雲梯。 / 半壁見海日，空中聞天雞。 / 千巖萬轉路不定，迷花倚石忽已暝。 / 熊咆龍吟殷巖泉，慄深林兮驚層巔。 / 雲青青兮欲雨，水澹澹兮生煙。 / 列缺霹靂，丘巒崩摧。 / 洞天石扇，訇然中開。 / 青冥浩蕩不見底，日月照耀金銀臺。 / 霓爲衣兮風爲馬，雲之君兮紛紛而來下。 / 虎鼓瑟兮鸞迴車，仙之人兮列如麻。 / 忽魂悸以魄動，怳驚起而長嗟。 / 惟覺時之枕席，失向來之煙霞。 / 世間行樂亦如此，古來萬事東流水。 / 別君去時何時還，且放白鹿青崖間，須行即騎訪名山。 / 安能摧眉折腰事權貴？使我不得開心顏。
- `status`: `done`

#### 012. 杜甫《丹青引贈曹將軍霸》

- `id`: `du-fu---dan-qing-yin-zeng-cao-jiang-jun-ba`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---dan-qing-yin-zeng-cao-jiang-jun-ba/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 將軍魏武之子孫，於今爲庶爲清門。 / 英雄割據雖已矣，文彩風流猶尚存。 / 學書初學衛夫人，但恨無過王右軍。 / 丹青不知老將至，富貴於我如浮雲。 / 開元之中常引見，承恩數上南熏殿。 / 凌煙功臣少顏色，將軍下筆開生面。 / 良相頭上進賢冠，猛將腰間大羽箭。 / 褒公鄂公毛髮動英姿颯爽來酣戰。 / 先帝天馬玉花驄，畫工如山貌不同。 / 是日牽來赤墀下，迥立閶闔生長風。 / 詔謂將軍拂絹素，意匠慘澹經營中。 / 斯須九重真龍出，一洗萬古凡馬空。 / 玉花却在御榻上，榻上庭前屹相向。 / 至尊含笑催賜金，圉人太僕皆惆悵。 / 弟子韓幹早入室，亦能畫馬窮殊相。 / 幹惟畫肉不畫骨，忍使驊騮氣凋喪。 / 將軍畫善蓋有神，必逢佳士亦寫真。 / 即今飄泊干戈際，屢貌尋常行路人。 / 途窮反遭俗眼白，世上未有如公貧。 / 但看古來盛名下，終日坎壈纏其身。
- `status`: `done`

#### 013. 李白《蜀道難》

- `id`: `li-bai---shu-dao-nan`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---shu-dao-nan/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 噫吁戲！危乎高哉！蜀道之難難於上青天！蠶叢及魚鳧，開國何茫然。 / 爾來四萬八千歲，不與秦塞通人煙。 / 西當太白有鳥道，可以橫絕峨眉巔。 / 地崩山摧壯士死，然後天梯石棧相鉤連。 / 上有六龍回日之高標，下有衝波逆折之回川。 / 黃鶴之飛尚不得過，猨猱欲度愁攀援。 / 青泥何盤盤，百步九折縈巖巒。 / 捫參歷井仰脅息，以手撫膺坐長歎。 / 問君西遊何時還？畏途巉巖不可攀。 / 但見悲鳥號古木，雄飛雌從繞林間。 / 又聞子規啼夜月，愁空山，蜀道之難難於上青天，使人聽此凋朱顏。 / 連峯去天不盈尺，枯松倒挂倚絕壁。 / 飛湍瀑流爭喧豗，砅厓轉石萬壑雷。 / 其險也如此，嗟爾遠道之人胡爲乎來哉！劒閣崢嶸而崔嵬，一夫當關，萬夫莫開。 / 所守或匪親，化爲狼與豺。 / 朝避猛虎，夕避長蛇。 / 磨牙吮血，殺人如麻。 / 錦城雖云樂，不如早還家。 / 蜀道之難難於上青天，側身西望長咨嗟。
- `status`: `done`

#### 014. 李白《相和歌辭 蜀道難》

- `id`: `li-bai---xiang-he-ge-ci- -shu-dao-nan`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---xiang-he-ge-ci- -shu-dao-nan/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 噫吁嚱！危乎高哉！蜀道之難難於上青天！蠶叢及魚鳧，開國何茫然。 / 爾來四萬八千歲，乃與秦塞通人煙。 / 西當太白有鳥道，可以橫絕峨眉巔。 / 地崩山摧壯士死，然後天梯石棧方鉤連。 / 上有六龍迴日之高標，下有衝波逆折之迴川。 / 黃鶴之飛尚不得，猨猱欲度愁攀緣。 / 青泥何盤盤，百步九折縈巖巒。 / 捫參歷井仰脅息，以手撫膺坐長歎。 / 問君西遊何時還？畏途巉巖不可攀。 / 但見悲鳥號枯木，雄飛呼雌繞林間。 / 又聞子規啼夜月，愁空山，蜀道之難難於上青天！使人聽此彫朱顏。 / 連峰去天不盈尺，枯松倒挂倚絕壁。 / 飛湍瀑流相喧豗，砅崖轉石萬壑雷。 / 其嶮也若此，嗟爾遠道之人胡爲乎來哉？劒閣崢嶸而崔嵬，一夫當關，萬夫莫開。 / 所守或匪親，化爲狼與豺。 / 朝避猛虎，夕避長蛇。 / 磨牙吮血，殺人如麻。 / 錦城雖云樂，不如早還家。 / 蜀道之難難於上青天，側身西望長咨嗟。
- `status`: `done`

#### 015. 杜甫《韋諷錄事宅觀曹將軍畫馬圖》

- `id`: `du-fu---wei-feng-lu-shi-zhai-guan-cao-jiang-jun-hua-ma-tu`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---wei-feng-lu-shi-zhai-guan-cao-jiang-jun-hua-ma-tu/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 國初已來畫鞍馬，神妙獨數江都王。 / 將軍得名三十載，人間又見真乘黃。 / 曾貌先帝照夜白，龍池十日飛霹靂。 / 內府殷紅馬腦盌，倢伃傳詔才人索。 / 盌賜將軍拜舞歸，輕紈細綺相追飛。 / 貴戚權門得筆跡，始覺屏障生光輝。 / 昔日太宗拳毛騧，近時郭家師子花。 / 今之新圖有二馬，復令識者久歎嗟。 / 此皆騎戰一敵萬，縞素漠漠開風沙。 / 其餘七匹亦殊絕，迥若寒空動煙雪。 / 霜蹄蹴踏長楸間，馬官廝養森成列。 / 可憐九馬爭神駿，顧視清高氣深穩。 / 借問苦心愛者誰，後有韋諷前支遁。 / 憶昔巡幸新豐宮，翠華拂天來向東。 / 騰驤磊落三萬匹，皆與此圖筋骨同。 / 自從獻寶朝河宗，無復射蛟江水中。 / 君不見金粟堆前松柏裏，龍媒去盡鳥呼風。
- `status`: `done`

#### 016. 王維《桃源行》

- `id`: `wang-wei---tao-yuan-xing`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---tao-yuan-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 漁舟逐水愛山春，兩岸桃花夾去津。 / 坐看紅樹不知遠，行盡青溪不見人。 / 山口潛行始隈隩，山開曠望旋平陸。 / 遙看一處攢雲樹，近入千家散花竹。 / 樵客初傳漢姓名，居人未改秦衣服。 / 居人共住武陵源，還從物外起田園。 / 月明松下房櫳靜，日出雲中雞犬喧。 / 驚聞俗客爭來集，競引還家問都邑。 / 平明閭巷埽花開，薄暮漁樵乘水入。 / 初因避地去人間，及至成仙遂不還。 / 峽裏誰知有人事，世中遙望空雲山。 / 不疑靈境難聞見，塵心未盡思鄉縣。 / 出洞無論隔山水，辭家終擬長游衍。 / 自謂經過舊不迷，安知峰壑今來變。 / 當時只記入山深，青溪幾曲到雲林。 / 春來遍是桃花水，不辨仙源何處尋。
- `status`: `done`

#### 017. 韓愈《謁衡嶽廟遂宿嶽寺題門樓》

- `id`: `han-yu---ye-heng-yue-miao-sui-su-yue-si-ti-men-lou`
- `target_asset`: `ReadForFun/tang-shi/images/han-yu---ye-heng-yue-miao-sui-su-yue-si-ti-men-lou/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 五嶽祭秩皆三公，四方環鎮嵩當中。 / 火維地荒足妖怪，天假神柄專其雄。 / 噴雲泄霧藏半腹，雖有絕頂誰能窮。 / 我來正逢秋雨節，陰氣晦昧無清風。 / 潛心默禱若有應，豈非正直能感通。 / 須臾靜掃衆峰出，仰見突兀撐青空。 / 紫蓋連延接天柱，石廩騰擲堆祝融。 / 森然魄動下馬拜，松柏一逕趨靈宮。 / 粉牆丹柱動光彩，鬼物圖畫填青紅。 / 升階傴僂薦脯酒，欲以菲薄明其衷。 / 廟令老人識神意，睢盱偵伺能鞠躬。 / 手持桮珓導我擲，云此最吉餘難同。 / 竄逐蠻荒幸不死，衣食纔足甘長終。 / 侯王將相望久絕，神縱欲福難爲功。 / 夜投佛寺上高閣，星月掩暎雲朣朧。 / 猿鳴鐘動不知曙，杲杲寒日生於東。
- `status`: `done`

#### 018. 杜甫《兵車行》

- `id`: `du-fu---bing-che-xing`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---bing-che-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 車轔轔，馬蕭蕭，行人弓箭各在腰。 / 耶孃妻子走相送，塵埃不見咸陽橋。 / 牽衣頓足闌道哭，哭聲直上干雲霄。 / 道傍過者問行人，行人但云點行頻。 / 或從十五北防河，便至四十西營田。 / 去時里正與裹頭，歸來頭白還戍邊。 / 邊亭流血成海水，武皇開邊意未已。 / 君不聞漢家山東二百州，千村萬落生荆杞。 / 縱有健婦把鋤犂，禾生隴畝無東西。 / 況復秦兵耐苦戰，被驅不異犬與雞。 / 長者雖有問，役夫敢申恨。 / 且如今年冬，未休關西卒。 / 縣官急索租，租稅從何出？信知生男惡，反是生女好。 / 生女猶是嫁比鄰，生男埋沒隨百草。 / 君不見青海頭，古來白骨無人收。 / 新鬼煩冤舊鬼哭，天陰雨濕聲啾啾。
- `status`: `done`

#### 019. 王維《老將行》

- `id`: `wang-wei---lao-jiang-xing`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---lao-jiang-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 少年十五二十時，步行奪得胡馬射。 / 射殺中山白額虎，肯數鄴下黃鬚兒。 / 一身轉戰三千里，一劒曾當百萬師。 / 漢兵奮迅如霹靂，虜騎崩騰畏蒺藜。 / 衞青不敗由天幸，李廣無功緣數奇。 / 自從棄置便衰朽，世事磋跎成白首。 / 昔時飛箭無全目，今日垂楊生左肘。 / 路傍時賣故侯瓜，門前學種先生柳。 / 蒼茫古木連窮巷，寥落寒山對虛牖。 / 誓令疏勒出飛泉，不似潁川空使酒。 / 賀蘭山下陣如雲，羽檄交馳日夕聞。 / 節使三河募年少，詔書五道出將軍。 / 試拂鐵衣如雪色，聊持寶劒動星文。 / 願得燕弓射天將，恥令越甲鳴吳軍。 / 莫嫌舊日雲中守，猶堪一戰取功勳。
- `status`: `done`

#### 020. 李白《雜曲歌辭 長干行二首 一》

- `id`: `li-bai---za-qu-ge-ci- -zhang-gan-xing-er-shou- -yi`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---za-qu-ge-ci- -zhang-gan-xing-er-shou- -yi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 妾髮初覆額，折花門前劇。 / 郎騎竹馬來，遶牀弄青梅。 / 同居長干里，兩小無嫌猜。 / 十四爲君婦，羞顏尚不開。 / 低頭向暗壁，千喚不一迴。 / 十五始展眉，願同塵與灰。 / 常存抱柱信，豈上望夫臺。 / 十六君遠行，瞿塘灩預堆。 / 五月不可觸，猨鳴天上哀。 / 門前遲行跡，一一生綠苔。 / 苔深不能掃，落葉秋風早。 / 八月蝴蝶來，雙飛西園草。 / 感此傷妾心，坐愁紅顏老。 / 早晚下三巴，預將書報家。 / 相迎不道遠，直至長風沙。
- `status`: `done`

#### 021. 李頎《聽董大彈胡笳聲兼寄語弄房給事》

- `id`: `li-qi---ting-dong-da-dan-hu-jia-sheng-jian-ji-yu-nong-fang-gei-shi`
- `target_asset`: `ReadForFun/tang-shi/images/li-qi---ting-dong-da-dan-hu-jia-sheng-jian-ji-yu-nong-fang-gei-shi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 蔡女昔造胡笳聲，一彈一十有八拍。 / 胡人落淚沾邊草，漢使斷腸對歸客。 / 古戍蒼蒼烽火寒，大荒沈沈飛雪白。 / 先拂商弦後角羽，四郊秋葉驚摵摵。 / 董夫子，通神明，深山竊聽來妖精。 / 言遲更速皆應手，將往復旋如有情。 / 空山百鳥散還合，萬里浮雲陰且晴。 / 嘶酸雛鴈失羣夜，斷絕胡兒戀母聲。 / 川爲淨其波，鳥亦罷其鳴。 / 烏孫部落家鄉遠，邏娑沙塵哀怨生。 / 幽音變調忽飄灑，長風吹林雨墮瓦。 / 迸泉颯颯飛木末，野鹿呦呦走堂下。 / 長安城連東掖垣，鳳凰池對青瑣門。 / 高才脫略名與利，日夕望君抱琴至。
- `status`: `done`

#### 022. 杜甫《哀王孫》

- `id`: `du-fu---ai-wang-sun`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---ai-wang-sun/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 長安城頭頭白烏，夜飛延秋門上呼。 / 又向人家啄大屋，屋底達官走避胡。 / 金鞭斷折九馬死，骨肉不待同馳驅。 / 腰下實玦青珊瑚，可憐王孫泣路隅。 / 問之不肯道姓名，但道困苦乞爲奴。 / 已經百日竄荆棘，身上無有完肌膚。 / 高帝子孫盡隆準，龍種自與常人殊。 / 豺狼在邑龍在野，王孫善保千金軀。 / 不敢長語臨交衢，且爲王孫立斯須。 / 昨夜東風吹血腥，東來橐駝滿舊都。 / 朔方健兒好身手，昔何勇銳今何愚。 / 竊聞天子已傳位，賢德北服南單于。 / 花門剺面請雪恥，慎勿出口他人狙。 / 哀哉王孫慎勿疎，五陵佳氣無時無。
- `status`: `done`

#### 023. 李白《廬山謠寄盧侍御虛舟》

- `id`: `li-bai---lu-shan-yao-ji-lu-shi-yu-xu-zhou`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---lu-shan-yao-ji-lu-shi-yu-xu-zhou/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 我本楚狂人，鳳歌笑孔丘。 / 手持綠玉杖，朝別黃鶴樓。 / 五嶽尋仙不辭遠，一生好入名山遊。 / 廬山秀出南斗傍，屏風九疊雲錦張，影落明湖青黛光。 / 金闕前開二峰長，銀河倒挂三石梁。 / 香爐瀑布遙相望，迴厓沓嶂凌蒼蒼。 / 翠影紅霞映朝日，鳥飛不到吳天長。 / 登高壯觀天地間，大江茫茫去不還。 / 黃雲萬里動風色，白波九道流雪山。 / 好爲廬山謠，興因廬山發。 / 閑窺石鏡清我心，謝公行處蒼苔沒。 / 早服還丹無世情，琴心三疊道初成。 / 遙見仙人綵雲裏，手把芙蓉朝玉京。 / 先期汗漫九垓上，願接盧敖遊太清。
- `status`: `done`

#### 024. 高適《相和歌辭 燕歌行》

- `id`: `gao-shi---xiang-he-ge-ci- -yan-ge-xing`
- `target_asset`: `ReadForFun/tang-shi/images/gao-shi---xiang-he-ge-ci- -yan-ge-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 漢家煙塵在東北，漢將辭家破殘賊。 / 男兒本自重橫行，天子非常賜顏色。 / 摐金伐鼓下榆關，旌旗逶迤碣石間。 / 校尉羽書飛瀚海，單于獵火照狼山。 / 山川蕭條極邊土，胡騎憑凌雜風雨。 / 戰士軍前半死生，美人帳下猶歌舞。 / 大漠窮秋塞草衰，孤城落日鬬兵稀。 / 身當恩遇常輕敵，力盡關山未解圍。 / 鐵衣遠戍辛勤久，玉箸應啼別離後。 / 少婦城南欲斷腸，征人薊北空回首。 / 邊風飄飄那可度，絕域蒼茫更何有。 / 殺氣三日作陣雲，寒聲一夜傳刁斗。 / 相看白刃血紛紛，死節從來豈顧勳。 / 君不見沙場征戰苦，至今猶憶李將軍。
- `status`: `done`

#### 025. 韓愈《八月十五夜贈張功曹》

- `id`: `han-yu---ba-yue-shi-wu-ye-zeng-zhang-gong-cao`
- `target_asset`: `ReadForFun/tang-shi/images/han-yu---ba-yue-shi-wu-ye-zeng-zhang-gong-cao/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 纖雲四卷天無河，清風吹空月舒波。 / 沙平水息聲影絕，一桮相屬君當歌。 / 君歌聲酸辭且苦，不能聽終淚如雨。 / 洞庭連天九疑高，蛟龍出沒猩鼯號。 / 十生九死到官所，幽居默默如藏逃。 / 下牀畏蛇食畏藥，海氣濕蟄熏腥臊。 / 昨者州前搥大鼓，嗣皇繼聖登夔臯。 / 赦書一日行萬里，罪從大辟皆除死。 / 遷者追廻流者還，滌瑕蕩垢清朝班。 / 州家申名使家抑，坎軻祗得移荆蠻。 / 判司卑官不堪說，未免捶楚塵埃間。 / 同時輩流多上道，天路幽險難追攀。 / 君歌且休聽我歌，我歌今與君殊科。
- `status`: `done`

#### 026. 杜甫《麗人行》

- `id`: `du-fu---li-ren-xing`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---li-ren-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 三月三日天氣新，長安水邊多麗人。 / 態濃意遠淑且真，肌理細膩骨肉勻。 / 繡羅衣裳照暮春，蹙金孔雀銀麒麟。 / 頭上何所有，翠微㔩葉垂鬢脣。 / 背後何所見，珠壓腰衱穩稱身。 / 就中雲幕椒房親，賜名大國虢與秦。 / 紫駝之峰出翠釜，水精之盤行素鱗。 / 犀箸厭飫久未下，鑾刀縷切空紛綸。 / 黃門飛鞚不動塵，御廚絡繹送八珍。 / 簫鼓哀吟感鬼神，賓從雜遝實要津。 / 後來鞍馬何逡巡，當軒下馬入錦茵。 / 楊花雪落覆白蘋，青鳥飛去銜紅巾。 / 炙手可熱勢絕倫，慎莫近前丞相嗔。
- `status`: `done`

#### 027. 杜甫《觀公孫大娘弟子舞劒器行》

- `id`: `du-fu---guan-gong-sun-da-niang-di-zi-wu-jian-qi-xing`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---guan-gong-sun-da-niang-di-zi-wu-jian-qi-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 昔有佳人公孫氏，一舞劒氣動四方。 / 觀者如山色沮喪，天地爲之久低昂。 / 㸌如羿射九日落，矯如羣帝驂龍翔。 / 來如雷霆收震怒，罷如江海凝清光。 / 絳脣珠袖兩寂莫，況有弟子傳芬芳。 / 臨潁美人在白帝，妙舞此曲神揚揚。 / 與余問答既有以，感時撫事增惋傷。 / 先帝侍女八千人，公孫劒器初第一。 / 五十年間似反掌，風塵傾動昏王室。 / 棃園子弟散如煙，女樂餘姿映寒日。 / 金粟堆南木已拱，瞿唐石城草蕭瑟。 / 玳筵急管曲復終，樂極哀來月東出。 / 老夫不知其所往，足繭荒山轉愁疾。
- `status`: `done`

#### 028. 杜甫《雜曲歌辭 麗人行》

- `id`: `du-fu---za-qu-ge-ci- -li-ren-xing`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---za-qu-ge-ci- -li-ren-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 三月三日天氣新，長安水邊多麗人。 / 態濃意遠淑且真，肌理細膩骨肉勻。 / 繡羅衣裳照暮春，蹙金孔雀銀麒麟。 / 頭上何所有？翠微㔩葉垂鬢脣。 / 背後何所見？珠壓腰衱穩稱身。 / 就中雲幕椒房親，賜名大國虢與秦。 / 紫駞之峯出翠釜，水晶之盤行素鱗。 / 犀筯厭飫久未下，鸞刀縷切空紛綸。 / 黃門飛鞚不動塵，御廚絲絡送八珍。 / 簫鼓哀吟感鬼神，賓從雜遝實要津。 / 後來鞍馬何逡巡，當軒下馬入錦茵。 / 楊花雪落覆白蘋，青鳥飛去銜紅巾。 / 炙手可熱勢絕倫，慎莫近前丞相嗔。
- `status`: `done`

#### 029. 李白《鼓吹曲辭 將進酒》

- `id`: `li-bai---gu-chui-qu-ci- -jiang-jin-jiu`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---gu-chui-qu-ci- -jiang-jin-jiu/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 君不見黃河之水天上來，奔流到海不復回。 / 君不見高堂明鏡悲白髮，朝如青絲暮成雪。 / 人生得意須盡歡，莫使金尊空對月。 / 天生我材必有用，千金散盡還復來。 / 烹羊宰牛且爲樂，會須一飲三百杯。 / 岑夫子，丹丘生，將進酒，杯莫停。 / 與君歌一曲，請君爲我側耳聽。 / 鐘鼓饌玉不足貴，但願長醉不復醒。 / 古來聖賢皆寂寞，惟有飲者留其名。 / 陳王昔時宴平樂，斗酒十千恣歡謔。 / 主人何爲言少錢，徑須酤取對君酌。 / 五花馬，千金裘，呼兒將出換美酒，與爾同銷萬古愁。
- `status`: `done`

#### 030. 李白《將進酒》

- `id`: `li-bai---jiang-jin-jiu`
- `target_asset`: `ReadForFun/tang-shi/images/li-bai---jiang-jin-jiu/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 君不見黃河之水天上來，奔流到海不復迴。 / 君不見高堂明鏡悲白髮，朝如青絲暮成雪。 / 人生得意須盡歡，莫使金樽空對月。 / 天生我材必有用，千金散盡還復來。 / 烹羊宰牛且爲樂，會須一飲三百盃。 / 岑夫子，丹丘生，將進酒，君莫停。 / 與君歌一曲，請君爲我側耳聽。 / 鐘鼓饌玉不足貴，但願長醉不願醒。 / 古來聖賢皆寂寞，惟有飲者留其名。 / 陳王昔時宴平樂，斗酒十千恣讙謔。 / 主人何爲言少錢，徑須沽取對君酌。 / 五花馬，千金裘，呼兒將出換美酒，與爾同銷萬古愁。
- `status`: `done`

#### 031. 杜甫《贈衛八處士》

- `id`: `du-fu---zeng-wei-ba-chu-shi`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---zeng-wei-ba-chu-shi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 人生不相見，動如參與商。 / 今夕復何夕，共此燈燭光。 / 少壯能幾時，鬢髮各已蒼。 / 訪舊半爲鬼，驚呼熱中腸。 / 焉知二十載，重上君子堂。 / 昔別君未婚，兒女忽成行。 / 怡然敬父執，問我來何方。 / 問荅乃未已，兒女羅酒漿。 / 夜雨剪春韭，新炊間黃粱。 / 主稱會面難，一舉累十觴。 / 十觴亦不醉，感子故意長。 / 明日隔山岳，世事兩茫茫。
- `status`: `done`

#### 032. 杜甫《佳人》

- `id`: `du-fu---jia-ren`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---jia-ren/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 絕代有佳人，幽居在空谷。 / 自云良家子，零落依草木。 / 關中昔喪敗，兄弟遭殺戮。 / 官高何足論，不得收骨肉。 / 世情惡衰歇，萬事隨轉燭。 / 夫壻輕薄兒，新人已如玉。 / 合昏尚知時，鴛鴦不獨宿。 / 但見新人笑，那聞舊人哭。 / 在山泉水清，出山泉水濁。 / 侍婢賣珠回，牽蘿補茅屋。 / 摘花不插髮，采柏動盈匊。 / 天寒翠袖薄，日暮倚修竹。
- `status`: `done`

#### 033. 杜甫《古柏行》

- `id`: `du-fu---gu-bai-xing`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---gu-bai-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 孔明廟前有老柏，柯如青銅根如石。 / 霜皮溜雨四十圍，黛色參天二千尺。 / 君臣已與時際會，樹木猶爲人愛惜。 / 雲來氣接巫峽長，月出寒通雪山白。 / 憶昨路繞錦亭東，先主武侯同閟宮。 / 崔嵬枝幹郊原古，窈窕丹青戶牖空。 / 落落盤踞雖得地，冥冥孤高多烈風。 / 扶持自是神明力，正直原因造化功。 / 大廈如傾要梁棟，萬牛回首丘山重。 / 不露文章世已驚，未辭剪伐誰能送。 / 苦心豈免容螻蟻，香葉終經宿鸞鳳。 / 志士幽人莫怨嗟，古來材大難爲用。
- `status`: `done`

#### 034. 元結《賊退示官吏》

- `id`: `yuan-jie---zei-tui-shi-guan-li`
- `target_asset`: `ReadForFun/tang-shi/images/yuan-jie---zei-tui-shi-guan-li/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 昔歲逢太平，山林二十年。 / 泉源在庭戶，洞壑當門前。 / 井稅有常期，日[晏]猶得眠。 / 忽然遭世變，數歲親戎旃。 / 今來典斯郡，山夷又紛然。 / 城小賊不屠，人貧傷可憐。 / 是以陷隣境，此州獨見全。 / 使臣將王命，豈不如賊焉。 / 今彼徴斂者，迫之如火煎。 / 誰能絕人命，以作時世賢。 / 思欲委符節，引竿自刺船。 / 將家就魚麥，歸老江湖邊。
- `status`: `done`

#### 035. 韋應物《送楊氏女》

- `id`: `wei-ying-wu---song-yang-shi-nv`
- `target_asset`: `ReadForFun/tang-shi/images/wei-ying-wu---song-yang-shi-nv/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 永日方慼慼，出門復悠悠。 / 女子今有行，大江泝輕舟。 / 爾輩況無恃，撫念益慈柔。 / 幼爲長所育，兩別泣不休。 / 對此結中腸，義往難復留。 / 自小闕內訓，事姑貽我憂。 / 賴茲託令門，仁恤庶無尤。 / 貧儉誠所尚，資從豈待周。 / 孝恭遵婦道，容止順其猷。 / 別離在今晨，見爾當何秋。 / 居閑始自遣，臨感忽難收。 / 歸來視幼女，零淚緣纓流。
- `status`: `done`

#### 036. 杜甫《寄韓諫議》

- `id`: `du-fu---ji-han-jian-yi`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---ji-han-jian-yi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 今我不樂思岳陽，身欲奮飛病在牀。 / 美人娟娟隔秋水，濯足洞庭望八荒。 / 鴻飛冥冥日月白，青楓葉赤天雨霜。 / 玉京羣帝集北斗，或騎騏驎翳鳳皇。 / 芙蓉旌旗煙霧樂，影動倒景搖瀟湘。 / 星宮之君醉瓊漿，羽人稀少不在旁。 / 似聞昨者赤松子，恐是漢代韓張良。 / 昔隨劉氏定長安，帷幄未改神慘傷。 / 國家成敗吾豈敢，色難腥腐餐風香。 / 周南留滯古所惜，南極老人應壽昌。 / 美人胡爲隔秋水，焉得置之貢玉堂。
- `status`: `done`

#### 037. 岑參《與高適薛據慈恩寺浮圖》

- `id`: `cen-can---yu-gao-shi-xue-ju-ci-en-si-fu-tu`
- `target_asset`: `ReadForFun/tang-shi/images/cen-can---yu-gao-shi-xue-ju-ci-en-si-fu-tu/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 塔勢如湧出，孤高聳天宮。 / 登臨出世界，磴道盤虛空。 / 突兀壓神州，崢嶸如鬼工。 / 四角礙白日，七層摩蒼穹。 / 下窺指高鳥，俯聽聞驚風。 / 連山若波濤，奔湊似朝東。 / 青槐夾馳道，宮館何玲瓏。 / 秋色從西來，蒼然滿關中。 / 五陵北原上，萬古青濛濛。 / 淨理了可悟，勝因夙所宗。 / 誓將挂冠去，覺道資無窮。
- `status`: `done`

#### 038. 王維《洛陽女兒行》

- `id`: `wang-wei---luo-yang-nv-er-xing`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---luo-yang-nv-er-xing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 洛陽女兒對門居，纔可容顏十五餘。 / 良人玉勒乘驄馬，侍女金盤鱠鯉魚。 / 畫閣朱樓盡相望，紅桃綠柳垂簷向。 / 羅幃送上七香車，寶扇迎歸九華帳。 / 狂夫富貴在青春，意氣驕奢劇季倫。 / 自憐碧玉親教舞，不惜珊瑚持與人。 / 春窗曙滅九微火，九微片片飛花璅。 / 戲罷曾無理曲時，妝成秪是薰香坐。 / 城中相識盡繁華，日夜經過趙李家。 / 誰憐越女顏如玉，貧賤江頭自浣紗。
- `status`: `done`

#### 039. 韓愈《山石》

- `id`: `han-yu---shan-shi`
- `target_asset`: `ReadForFun/tang-shi/images/han-yu---shan-shi/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 山石犖確行徑微，黃昏到寺蝙蝠飛。 / 升堂坐階新雨足，芭蕉葉大支子肥。 / 僧言古壁佛畫好，以火來照所見稀。 / 鋪牀拂席置羹飯，疎糲亦足飽我飢。 / 夜深靜臥百蟲絕，清月出嶺光入扉。 / 天明獨去無道路，出入高下窮煙霏。 / 山紅澗碧紛爛漫，時見松櫪皆十圍。 / 當流赤足蹋澗石，水聲激激風吹衣。 / 人生如此自可樂，豈必局束爲人鞿。 / 嗟哉吾黨二三子，安得至老不更歸。
- `status`: `done`

#### 040. 杜甫《哀江頭》

- `id`: `du-fu---ai-jiang-tou`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---ai-jiang-tou/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 少陵野老吞聲哭，春日潛行曲江曲。 / 江頭宮殿鎖千門，細柳新蒲爲誰綠。 / 憶昔霓旌下南苑，苑中萬物生顏色。 / 昭陽殿裏第一人，同輦隨君侍君側。 / 輦前才人帶弓箭，白馬嚼齧黃金勒。 / 翻身向天仰射雲，一箭正墜雙飛翼。 / 明眸皓齒今何在，血污遊魂歸不得。 / 清渭東流劒閣深，去住彼此無消息。 / 人生有情淚霑臆，江水江花豈終極。 / 黃昏胡騎塵滿城，欲往城南忘南北。
- `status`: `done`

#### 041. 韋應物《郡齋雨中與諸文士燕集》

- `id`: `wei-ying-wu---jun-zhai-yu-zhong-yu-zhu-wen-shi-yan-ji`
- `target_asset`: `ReadForFun/tang-shi/images/wei-ying-wu---jun-zhai-yu-zhong-yu-zhu-wen-shi-yan-ji/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 兵衛森畫戟，宴寢凝清香。 / 海上風雨至，逍遙池閣涼。 / 煩疴近消散，嘉賓復滿堂。 / 自慙居處崇，未覩斯民康。 / 理會是非遣，性達形迹忘。 / 鮮肥屬時禁，蔬果幸見嘗。 / 俯飲一杯酒，仰聆金玉章。 / 神歡體自輕，意欲凌風翔。 / 吳中盛文史，羣彥今汪洋。 / 方知大藩地，豈曰財賦疆。
- `status`: `done`

#### 042. 李頎《送陳章甫》

- `id`: `li-qi---song-chen-zhang-fu`
- `target_asset`: `ReadForFun/tang-shi/images/li-qi---song-chen-zhang-fu/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 四月南風大麥黃，棗花未落桐陰長。 / 青山朝別暮還見，嘶馬出門思舊鄉。 / 陳侯立身何坦蕩，虬鬚虎眉仍大顙。 / 腹中貯書一萬卷，不肯低頭在草莽。 / 東門酤酒飲我曹，心輕萬事皆鴻毛。 / 醉臥不知白日暮，有時空望孤雲高。 / 長河浪頭連天黑，津口停舟渡不得。 / 鄭國遊人未及家，洛陽行子空歎息。 / 聞道故林相識多，罷官昨日今如何。
- `status`: `done`

#### 043. 李頎《聽安萬善吹觱篥歌》

- `id`: `li-qi---ting-an-wan-shan-chui-bi-li-ge`
- `target_asset`: `ReadForFun/tang-shi/images/li-qi---ting-an-wan-shan-chui-bi-li-ge/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 南山截竹爲觱篥，此樂本自龜茲出。 / 流傳漢地曲轉奇，涼州胡人爲我吹。 / 傍鄰聞者多歎息，遠客思鄉皆淚垂。 / 世人解聽不解賞，長飆風中自來往。 / 枯桑老柏寒颼飀，九雛鳴鳳亂啾啾。 / 龍吟虎嘯一時發，萬籟百泉相與秋。 / 忽然更作漁陽摻，黃雲蕭條白日暗。 / 變調如聞楊柳春，上林繁花照眼新。 / 歲夜高堂列明燭，美酒一杯聲一曲。
- `status`: `done`

#### 044. 岑參《白雪歌送武判官歸京》

- `id`: `cen-can---bai-xue-ge-song-wu-pan-guan-gui-jing`
- `target_asset`: `ReadForFun/tang-shi/images/cen-can---bai-xue-ge-song-wu-pan-guan-gui-jing/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 北風捲地白草折，胡天八月即飛雪。 / 忽然一夜春風來，千樹萬樹梨花開。 / 散入珠簾濕羅幕，狐裘不煖錦衾薄。 / 將軍角弓不得控，都護鐵衣冷難着。 / 瀚海闌干百丈冰，愁雲黲淡萬里凝。 / 中軍置酒飲歸客，胡琴琵琶與羌笛。 / 紛紛暮雪下轅門，風掣紅旗凍不翻。 / 輪臺東門送君去，去時雪滿天山路。 / 山迴路轉不見君，雪上空留馬行處。
- `status`: `done`

#### 045. 岑參《輪臺歌奉送封大夫出師西征》

- `id`: `cen-can---lun-tai-ge-feng-song-feng-da-fu-chu-shi-xi-zheng`
- `target_asset`: `ReadForFun/tang-shi/images/cen-can---lun-tai-ge-feng-song-feng-da-fu-chu-shi-xi-zheng/poem.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 按语义相邻的句子合并为六个叙事单元，避免逐句切碎画面。
- `content`: 輪臺城頭夜吹角，輪臺城北旄頭落。 / 羽書昨夜過渠黎，單于已在金山西。 / 戍樓西望煙塵黑，漢兵屯在輪臺北。 / 上將擁旄西出征，平明吹笛大軍行。 / 四邊伐鼓雪海湧，三軍大呼陰山動。 / 虜塞兵氣連雲屯，戰場白骨纏草根。 / 劒河風急雪片闊，沙口石凍馬蹄脫。 / 亞相勤王甘苦辛，誓將報主靜邊塵。 / 古來青史誰不見，今見功名勝古人。
- `status`: `done`

#### 046. 王維《送綦毋潛落第還鄉》

- `id`: `wang-wei---song-qi-wu-qian-luo-di-hai-xiang`
- `target_asset`: `ReadForFun/tang-shi/images/wang-wei---song-qi-wu-qian-luo-di-hai-xiang/poem.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 四格分别对应首联、颔联、颈联、尾联；用远景、人物动作、细节、情绪收束形成叙事。
- `content`: 聖代無隱者，英靈盡來歸。 / 遂令東山客，不得顧采薇。 / 既至君門遠，孰云吾道非。 / 江淮度寒食，京洛縫春衣。 / 置酒臨長道，同心與我違。 / 行當浮桂櫂，未幾拂荆扉。 / 遠樹帶行客，孤村當落暉。 / 吾謀適不用，勿謂知音稀。
- `status`: `done`

#### 047. 丘爲《尋西山隱者不遇》

- `id`: `qiu-wei---xun-xi-shan-yin-zhe-bu-yu`
- `target_asset`: `ReadForFun/tang-shi/images/qiu-wei---xun-xi-shan-yin-zhe-bu-yu/poem.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 四格分别对应首联、颔联、颈联、尾联；用远景、人物动作、细节、情绪收束形成叙事。
- `content`: 絕頂一茅茨，直[上]三十里。 / 扣關無僮僕，窺室唯案几。 / 若非巾柴車，應是釣秋水。 / 差池不相見，黽勉空仰止。 / 草色新雨中，松聲晚牕裏。 / 及茲契幽絕，自足蕩心耳。 / 雖無賓主意，頗得清淨理。 / 興盡方下山，何必待之子。
- `status`: `done`

#### 048. 杜甫《夢李白二首 一》

- `id`: `du-fu---meng-li-bai-er-shou- -yi`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---meng-li-bai-er-shou- -yi/poem.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 四格分别对应首联、颔联、颈联、尾联；用远景、人物动作、细节、情绪收束形成叙事。
- `content`: 死別已吞聲，生別常惻惻。 / 江南瘴癘地，逐客無消息。 / 故人入我夢，明我長相憶。 / 恐非平生魂，路遠不可測。 / 魂來楓葉青，魂返關塞黑。 / 君今在羅網，何以有羽翼。 / 落月滿屋梁，猶疑照顏色。 / 水深波浪闊，無使蛟龍得。
- `status`: `done`

#### 049. 杜甫《夢李白二首 二》

- `id`: `du-fu---meng-li-bai-er-shou- -er`
- `target_asset`: `ReadForFun/tang-shi/images/du-fu---meng-li-bai-er-shou- -er/poem.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 四格分别对应首联、颔联、颈联、尾联；用远景、人物动作、细节、情绪收束形成叙事。
- `content`: 浮雲終日行，遊子久不至。 / 三夜頻夢君，情親見君意。 / 告歸常局促，苦道來不易。 / 江湖多風波，舟楫恐失墜。 / 出門搔白首，若負平生志。 / 冠蓋滿京華，斯人獨顦顇。 / 孰云網恢恢，將老身反累。 / 千秋萬歲名，寂莫身後事。
- `status`: `done`

### 宋词

#### 050. 韩元吉《六州歌头》 · 上阕

- `id`: `han-yuan-ji---liu-zhou-ge-tou--`
- `target_asset`: `ReadForFun/song-ci/images/han-yuan-ji---liu-zhou-ge-tou--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 东风著意。 / 先上小桃枝。 / 红粉腻。 / 娇如醉。 / 倚朱扉。 / 记年时。 / 隐映新妆，面临水岸。 / 春将半。 / 云日暖。 / 斜桥转。 / 夹城西。 / 草软莎平跋马，垂杨渡、玉勒争嘶。 / 认蛾眉凝笑，脸薄拂燕支。 / 绣户曾窥。 / 恨依依。
- `status`: `done`

#### 051. 韩元吉《六州歌头》 · 下阕

- `id`: `han-yuan-ji---liu-zhou-ge-tou--`
- `target_asset`: `ReadForFun/song-ci/images/han-yuan-ji---liu-zhou-ge-tou--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 共携手处。 / 香如雾。 / 红随步。 / 怨春迟。 / 消瘦损。 / 凭谁问。 / 只花知。 / 泪空垂。 / 旧日堂前燕，和烟雨，又双飞。 / 人自老。 / 春长好。 / 梦佳期。 / 前度刘郎，几许风流地，花也应悲。 / 但茫茫暮霭，目断武陵溪。 / 往事难追。
- `status`: `done`

#### 052. 柳永《戚氏》 · 上阕

- `id`: `liu-yong---qi-shi--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---qi-shi--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 晚秋天。 / 一霎微雨洒庭轩。 / 槛菊萧疏，井梧零乱惹残烟。 / 凄然。 / 望江关。 / 飞云黯淡夕阳间。 / 当时宋玉悲感，向此临水与登山。 / 远道迢递，行人凄楚，倦听陇水潺。 / 正蝉吟败叶，蛩响衰草，相应喧喧。 / 孤馆度日如年。 / 风露渐变，悄悄至更阑。
- `status`: `done`

#### 053. 柳永《戚氏》 · 下阕

- `id`: `liu-yong---qi-shi--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---qi-shi--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 长天净，绛河清浅，皓月婵娟。 / 思绵绵。 / 夜永对景，那堪屈指，暗想从前。 / 未名未禄，绮陌红楼，往往经岁迁延。 / 帝里风光好，当年少日，暮宴朝欢。 / 况有狂朋怪侣，遇当歌、对酒竞留连。 / 别来迅景如梭，旧游似梦，烟水程何限。 / 念利名、憔悴长萦绊。 / 追往事、空惨愁颜。 / 漏箭移、稍觉轻寒。 / 渐呜咽、画角数声残。 / 对闲窗畔，停灯向晓，抱影无眠。
- `status`: `done`

#### 054. 刘辰翁《兰陵王》 · 上阕

- `id`: `liu-chen-weng---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---lan-ling-wang--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 送春去。 / 春去人间无路。 / 秋千外、芳草连天，谁遣风沙暗南浦。 / 依依甚意绪。 / 漫忆海门飞絮。 / 乱鸦过，斗转城荒，不见来时试灯处。 / 春去。 / 最谁苦。 / 但箭雁沉边，梁燕无主。
- `status`: `done`

#### 055. 刘辰翁《兰陵王》 · 下阕

- `id`: `liu-chen-weng---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---lan-ling-wang--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 杜鹃声里长门暮。 / 想玉树凋土，泪盘如露。 / 咸阳送客屡回顾。 / 斜日未能度。 / 春去。 / 尚来否。 / 正江令恨别，庾信愁赋。 / 苏堤尽日风和雨。 / 叹神游故国，花记前度。 / 人生流落，顾孺子，共夜雨。
- `status`: `done`

#### 056. 刘辰翁《宝鼎现》 · 上阕

- `id`: `liu-chen-weng---bao-ding-xian--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---bao-ding-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 红妆春骑。 / 踏月影、竿旗穿市。 / 望不尽、楼台歌舞，习习香尘莲步底。 / 箫声断、约彩鸾归去，未怕金吾呵醉。 / 甚辇路、喧阗且止。 / 听得念奴歌起。 / 父老犹记宣和事。 / 抱铜仙、清泪如水。 / 还转盼、沙河多丽。
- `status`: `done`

#### 057. 刘辰翁《宝鼎现》 · 下阕

- `id`: `liu-chen-weng---bao-ding-xian--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---bao-ding-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 漾明光连邸第。 / 帘影冻、散红光成绮。 / 月浸葡萄十里。 / 看往来、神仙才子。 / 肯把菱花扑碎。 / 肠断竹马儿童，空见说、三千乐指。 / 等多时春不归来，到春时欲睡。 / 又说向、灯前拥髻。 / 暗滴鲛珠坠。 / 便当日、亲见霓裳，天上人间梦里。
- `status`: `done`

#### 058. 张元干《兰陵王》 · 上阕

- `id`: `zhang-yuan-gan---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/zhang-yuan-gan---lan-ling-wang--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 卷朱箔。 / 朝雨轻阴乍阁。 / 阑干外，烟柳弄晴，芳草侵阶映红药。 / 东风妒花恶。 / 吹落。 / 梢头嫩萼。 / 屏山掩，沈水倦熏，中酒心情怕杯勺。 / 寻思旧京洛。 / 正年少疏狂，歌笑迷著。
- `status`: `done`

#### 059. 张元干《兰陵王》 · 下阕

- `id`: `zhang-yuan-gan---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/zhang-yuan-gan---lan-ling-wang--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 障泥油壁催梳掠。 / 曾驰道同载，上林携手，灯夜初过早共约。 / 又争信漂泊。 / 寂寞。 / 念行乐。 / 甚粉淡衣襟，音断弦索。 / 琼枝璧月春如昨。 / 怅别後华表，那回双鹤。 / 相思除是，向醉里、暂忘却。
- `status`: `done`

#### 060. 周邦彦《兰陵王》 · 上阕

- `id`: `zhou-bang-yan---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---lan-ling-wang--/upper.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 柳阴直。 / 烟里丝丝弄碧。 / 隋堤上、曾见几番，拂水飘绵送行色。 / 登临望故国。 / 谁识。 / 京华倦客。 / 长亭路，年去岁来，应折柔条过千尺。 / 闲寻旧踪迹。 / 又酒趁哀弦，灯照离席。
- `status`: `done`

#### 061. 周邦彦《兰陵王》 · 下阕

- `id`: `zhou-bang-yan---lan-ling-wang--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---lan-ling-wang--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 梨花榆火催寒食。 / 愁一箭风快，半篙波暖，回头迢递便数驿。 / 望人在天北。 / 凄恻。 / 恨堆积。 / 渐别浦萦回，津堠岑寂。 / 斜阳冉冉春无极。 / 念月榭携手，露桥闻笛。 / 沈思前事，似梦里，泪暗滴。
- `status`: `done`

#### 062. 周邦彦《六丑》 · 上阕

- `id`: `zhou-bang-yan---liu-chou--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---liu-chou--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 正单衣试酒，恨客里、光阴虚掷。 / 愿春暂留，春归如过翼。 / 一去无迹。 / 为问花何在，夜来风雨，葬楚宫倾国。 / 钗钿堕处遗香泽。 / 乱点桃蹊，轻翻柳陌。 / 多情为谁追惜。 / 但蜂媒蝶使，时叩窗隔。
- `status`: `done`

#### 063. 周邦彦《六丑》 · 下阕

- `id`: `zhou-bang-yan---liu-chou--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---liu-chou--/lower.webp`
- `image_count`: `1`
- `grid`: `3×3`
- `layout_note`: 九格按场景、动作、转折和情绪层层推进；优先合并重复意象，避免信息拥挤。
- `content`: 东园岑寂。 / 渐蒙笼暗碧。 / 静绕珍丛底，成叹息。 / 长条故惹行客。 / 似牵衣待话，别情无极。 / 残英小、强簪巾帻。 / 终不似一朵，钗头颤袅，向人侧。 / 漂流处、莫趁潮汐。 / 恐断红、尚有相思字，何由见得。
- `status`: `done`

#### 064. 吴文英《莺啼序》 · 上阕

- `id`: `wu-wen-ying---ying-ti-xu--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---ying-ti-xu--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 残寒正欺病酒，掩沈香绣户。 / 燕来晚、飞入西城，似说春事迟暮。 / 画船载、清明过却，晴烟冉冉吴宫树。 / 念羁情游荡，随风化为轻絮。 / 十载西湖，傍柳系马，趁娇尘软雾。 / 溯红渐、招入仙溪，锦儿偷寄幽素。 / 倚银屏、春宽梦窄，断红湿、歌纨金缕。 / 暝堤空，轻把斜阳，总还鸥鹭。
- `status`: `done`

#### 065. 吴文英《莺啼序》 · 下阕

- `id`: `wu-wen-ying---ying-ti-xu--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---ying-ti-xu--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 幽兰旋老，杜若还生，水乡尚寄旅。 / 别後访、六桥无信，事往花委，瘗玉埋香，几番风雨。 / 长波妒盼，遥山羞黛，渔灯分影春江宿，记当时、短楫桃根渡。 / 青楼彷佛，临分败壁题诗，泪墨惨澹尘土。 / 危亭望极，草色天涯，吹鬓侵半苎。 / 暗点检、离痕欢唾，尚染鲛绡，凤迷归，破鸾慵舞。 / 殷勤待写，书中长恨，蓝霞辽海沈过雁，漫相思、弹入哀筝柱。 / 伤心千里江南，怨曲重招，断魂在否。
- `status`: `done`

#### 066. 周邦彦《浪涛沙・浪淘沙》 · 上阕

- `id`: `zhou-bang-yan---lang-tao-sha-・-lang-tao-sha--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---lang-tao-sha-・-lang-tao-sha--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 昼阴重，霜凋岸草，雾隐城堞。 / 南陌脂车待发。 / 东门帐饮乍阕。 / 正拂面垂杨堪缆结。 / 掩红泪、玉手亲折。 / 念汉浦离鸿去何许，经时信音绝。 / 情切。 / 望中地远天阔。
- `status`: `done`

#### 067. 周邦彦《浪涛沙・浪淘沙》 · 下阕

- `id`: `zhou-bang-yan---lang-tao-sha-・-lang-tao-sha--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---lang-tao-sha-・-lang-tao-sha--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 向露冷风清，无人处、耿耿寒漏咽。 / 嗟万事难忘，唯是轻别。 / 翠尊未竭。 / 凭断云留取，西楼残月。 / 罗带光销纹衾叠。 / 连环解、旧香顿歇。 / 怨歌永、琼壶敲尽缺。 / 恨春去、不与人期，弄夜色，空馀满地梨花雪。
- `status`: `done`

#### 068. 张孝祥《六州歌头》 · 上阕

- `id`: `zhang-xiao-xiang---liu-zhou-ge-tou--`
- `target_asset`: `ReadForFun/song-ci/images/zhang-xiao-xiang---liu-zhou-ge-tou--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 长怀望断，关塞莽然平。 / 征尘暗，霜风劲，悄边声。 / 黯销凝。 / 追想当年事，殆天数，非人力，洙泗上，弦歌地，亦膻腥。 / 隔水毡乡，落日牛羊下，区脱纵横。 / 看名王宵猎，骑火一川明。 / 笳鼓悲鸣。 / 遣人惊。
- `status`: `done`

#### 069. 张孝祥《六州歌头》 · 下阕

- `id`: `zhang-xiao-xiang---liu-zhou-ge-tou--`
- `target_asset`: `ReadForFun/song-ci/images/zhang-xiao-xiang---liu-zhou-ge-tou--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 念腰间箭，匣中剑，空埃蠹，竟何成。 / 时易失，心徒壮，岁将零。 / 渺神京。 / 干羽方怀远，静烽燧，且休兵。 / 冠盖使，纷驰骛，若为情。 / 闻道中原遗老，常南望，羽葆霓旌。 / 使行人到此，忠愤气填膺。 / 有泪如倾。
- `status`: `done`

#### 070. 袁去华《剑器近》 · 上阕

- `id`: `yuan-qu-hua---jian-qi-jin--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---jian-qi-jin--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 夜来雨。 / 赖倩得、东风吹住。 / 海棠正妖饶处。 / 且留取。 / 悄庭户。 / 试细听、莺啼燕语。 / 分明共人愁绪。
- `status`: `done`

#### 071. 袁去华《剑器近》 · 下阕

- `id`: `yuan-qu-hua---jian-qi-jin--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---jian-qi-jin--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 怕春去。 / 佳树。 / 翠阴初转午。 / 重帘未卷，乍睡起、寂寞看风絮。 / 偷弹清泪寄烟波，见江头故人，为言憔悴如许。 / 彩笺无数。 / 去却寒暄，到了浑无定据。 / 断肠落日千山暮。
- `status`: `done`

#### 072. 彭元逊《六丑》 · 上阕

- `id`: `peng-yuan-xun---liu-chou--`
- `target_asset`: `ReadForFun/song-ci/images/peng-yuan-xun---liu-chou--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 似东风老大，那复有、当时风气。 / 有情不收，江山身是寄。 / 浩荡何世。 / 但忆临官道，暂来不住，便出门千里。 / 痴心指望回风坠。 / 扇底相逢，钗头微缀。 / 他家万条千缕，解遮亭障驿，不隔江水。
- `status`: `done`

#### 073. 彭元逊《六丑》 · 下阕

- `id`: `peng-yuan-xun---liu-chou--`
- `target_asset`: `ReadForFun/song-ci/images/peng-yuan-xun---liu-chou--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 瓜洲曾舣，等行人岁岁。 / 日下长秋，城乌夜起。 / 帐庐好在春睡。 / 共飞归湖上，草青无地。 / 雨、春心如腻。 / 欲待化、丰乐楼前，青门都废。 / 何人念、流落无几。 / 点点抟作，雪绵松润，为君泪。
- `status`: `done`

#### 074. 姜夔《霓裳中序第一》 · 上阕

- `id`: `jiang-kui---ni-chang-zhong-xu-di-yi--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---ni-chang-zhong-xu-di-yi--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 亭皋正望极。 / 乱落江莲归未得。 / 多病却无气力。 / 况纨扇渐疏，罗衣初萦。 / 流光过隙。 / 叹杏梁、双燕如客。 / 人何在，一帘淡月，仿佛照颜色。
- `status`: `done`

#### 075. 姜夔《霓裳中序第一》 · 下阕

- `id`: `jiang-kui---ni-chang-zhong-xu-di-yi--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---ni-chang-zhong-xu-di-yi--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 幽寂。 / 乱蛩吟壁。 / 动庾信、清愁似织。 / 沈思年少浪迹。 / 笛里关山，柳下坊陌。 / 坠红无信息。 / 漫暗水，涓涓溜碧。 / 漂零久，而今何意，醉卧酒垆侧。
- `status`: `done`

#### 076. 周邦彦《瑞龙吟》 · 上阕

- `id`: `zhou-bang-yan---rui-long-yin--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---rui-long-yin--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 章台路。 / 还见褪粉梅梢，试花桃树。 / 坊陌人家，定巢燕子，归来旧处。 / 暗凝伫。 / 因念个人痴小，乍窥门户。 / 侵晨浅约宫黄，障风映袖，盈盈笑语。 / 前度刘郎重到，访邻寻里，同时歌舞。
- `status`: `done`

#### 077. 周邦彦《瑞龙吟》 · 下阕

- `id`: `zhou-bang-yan---rui-long-yin--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---rui-long-yin--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 唯有旧家秋娘，声价如故。 / 吟笺赋笔，犹记燕台句。 / 知谁伴，名园露饮，东城闲步。 / 事与孤鸿去。 / 探春尽是，伤离意绪。 / 官柳低金缕。 / 归骑晚，纤纤池塘飞雨。 / 断肠院落，一帘风絮。
- `status`: `done`

#### 078. 万俟咏《三台》 · 上阕

- `id`: `mo-qi-yong---san-tai--`
- `target_asset`: `ReadForFun/song-ci/images/mo-qi-yong---san-tai--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 见梨花初带夜月，海棠半含朝雨。 / 内苑春、不禁过青门，御沟涨、潜通南浦。 / 东风静、细柳垂金缕。 / 望凤阙、非烟非雾。 / 好时代、朝野多欢，遍九陌、太平箫鼓。 / 乍莺儿百啭断续，燕子飞来飞去。 / 近绿水、台榭映秋千，斗草聚、双双游女。
- `status`: `done`

#### 079. 万俟咏《三台》 · 下阕

- `id`: `mo-qi-yong---san-tai--`
- `target_asset`: `ReadForFun/song-ci/images/mo-qi-yong---san-tai--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 饧香更、酒冷踏青路。 / 会暗识、夭桃朱户。 / 向晚骤、宝马雕鞍，醉襟惹、乱花飞絮。 / 正轻寒轻暖漏永，半阴半晴云暮。 / 禁火天、已是试新妆，岁华到、三分佳处。 / 清明看、汉宫传蜡炬。 / 散翠烟、飞入槐府。 / 敛兵卫、阊阖门开，住传宣、又还休务。
- `status`: `done`

#### 080. 朱嗣发《摸鱼儿》 · 上阕

- `id`: `zhu-si-fa---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/zhu-si-fa---mo-yu-er--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 对西风、鬓摇烟碧，参差前事流水。 / 紫丝罗带鸳鸯结，的的镜盟钗誓。 / 浑不记、漫手织回文，几度欲心碎。 / 安花著蒂。 / 奈雨覆云翻，情宽分窄，石上玉簪脆。 / 朱楼外。 / 愁压空云欲坠。
- `status`: `done`

#### 081. 朱嗣发《摸鱼儿》 · 下阕

- `id`: `zhu-si-fa---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/zhu-si-fa---mo-yu-er--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 月痕犹照无寐。 / 阴晴也只随天意。 / 枉了玉消香碎。 / 君且醉。 / 君不见、长门青草春风泪。 / 一时左计。 / 悔不早荆钗，暮天修竹，头白倚寒翠。
- `status`: `done`

#### 082. 柳永《夜半乐》 · 上阕

- `id`: `liu-yong---ye-ban-le--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---ye-ban-le--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 冻云黯淡天气，扁舟一叶，乘兴离江渚。 / 渡万壑千岩，越溪深处。 / 怒涛渐息，樵风乍起，更闻商旅相呼。 / 片帆高举。 / 泛画鹢、翩翩过南浦。 / 望中酒旆闪闪，一簇烟村，数行霜树。 / 残日下，渔人鸣榔归去。
- `status`: `done`

#### 083. 柳永《夜半乐》 · 下阕

- `id`: `liu-yong---ye-ban-le--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---ye-ban-le--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 败荷零落，衰杨掩映，岸边两两三三，浣沙游女。 / 避行客、含羞笑相语。 / 到此因念，绣阁轻抛，浪萍难驻。 / 叹後约丁宁竟何据。 / 惨离怀，空恨岁晚归期阻。 / 凝泪眼、杳杳神京路。 / 断鸿声远长天暮。
- `status`: `done`

#### 084. 辛弃疾《摸鱼儿》 · 上阕

- `id`: `xin-qi-ji---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/xin-qi-ji---mo-yu-er--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 更能消、几番风雨。 / 匆匆春又归去。 / 惜春长恨花开早，何况落红无数。 / 春且住。 / 见说道、天涯芳草迷归路。 / 怨春不语。 / 算只有殷勤，画檐珠网，尽日惹飞絮。
- `status`: `done`

#### 085. 辛弃疾《摸鱼儿》 · 下阕

- `id`: `xin-qi-ji---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/xin-qi-ji---mo-yu-er--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 长门事，准拟佳期又误。 / 蛾眉曾有人妒。 / 千金纵买相如赋，脉脉此情谁诉。 / 君莫舞。 / 君不见、玉环飞燕皆尘土。 / 闲愁最苦。 / 休去倚危楼，斜阳正在，烟柳断肠处。
- `status`: `done`

#### 086. 周邦彦《解语花》 · 上阕

- `id`: `zhou-bang-yan---jie-yu-hua--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---jie-yu-hua--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 风销焰蜡，露烘炉。 / 花市光相射。 / 桂华流瓦。 / 纤云散，耿耿素娥欲下。 / 衣裳淡雅。 / 看楚女、纤腰一把。 / 箫鼓喧，人影参差，满路飘香麝。
- `status`: `done`

#### 087. 周邦彦《解语花》 · 下阕

- `id`: `zhou-bang-yan---jie-yu-hua--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---jie-yu-hua--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 因念都城放夜。 / 望千门如昼，嬉笑游冶。 / 钿车罗帕。 / 相逢处，自有暗尘随马。 / 年光是也。 / 唯只见、旧情衰谢。 / 清漏移，飞盖归来，从舞休歌罢。
- `status`: `done`

#### 088. 陆叡《瑞鹤仙》 · 上阕

- `id`: `lu-rui---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/lu-rui---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 湿云黏雁影。 / 望征路愁迷，离绪难整。 / 千金买光景。 / 但疏钟催晓，乱鸦啼暝。 / 花暗省。 / 许多情、相逢梦境。
- `status`: `done`

#### 089. 陆叡《瑞鹤仙》 · 下阕

- `id`: `lu-rui---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/lu-rui---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 便行云、都不归来，也合寄将音信。 / 孤迥。 / 盟鸾心在，跨鹤程高，後期无准。 / 情丝待翦。 / 翻惹得，旧时恨。 / 怕天教何处，参差双燕，还染残朱剩粉。 / 对菱花、与说相思，看谁瘦损。
- `status`: `done`

#### 090. 吴文英《瑞鹤仙》 · 上阕

- `id`: `wu-wen-ying---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 晴丝牵绪乱。 / 对沧江斜日，花飞人远。 / 垂杨暗吴苑。 / 正旗亭烟冷，河桥风暖。 / 兰情蕙盼。 / 惹相思、春根酒畔。
- `status`: `done`

#### 091. 吴文英《瑞鹤仙》 · 下阕

- `id`: `wu-wen-ying---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 又争知、吟骨萦销，渐把旧衫重翦。 / 凄断。 / 流红千浪，缺月孤楼，总难留燕。 / 歌尘凝扇。 / 待凭信，拌分钿。 / 试挑灯欲写，还依不忍，笺幅偷和泪卷。 / 寄残云、剩雨蓬莱，也应梦见。
- `status`: `done`

#### 092. 袁去华《瑞鹤仙》 · 上阕

- `id`: `yuan-qu-hua---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 郊原初过雨。 / 见败叶零乱，风定犹舞。 / 斜阳挂深树。 / 映浓愁浅黛，遥山眉妩。 / 来时旧路。 / 尚岩花、娇黄半吐。
- `status`: `done`

#### 093. 袁去华《瑞鹤仙》 · 下阕

- `id`: `yuan-qu-hua---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 到而今，唯有溪边流水，见人如故。 / 无语。 / 邮亭深静，下马还寻，旧曾题处。 / 无聊倦旅。 / 伤离恨，最愁苦。 / 纵收香藏镜，他年重到，人面桃花在否。 / 念沈沈、小阁幽窗，有时梦去。
- `status`: `done`

#### 094. 刘辰翁《摸鱼儿》 · 上阕

- `id`: `liu-chen-weng---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---mo-yu-er--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 怎知他、春归何处，相逢且尽尊酒。 / 少年袅袅天涯恨，长结西湖烟柳。 / 休回首。 / 但细雨断桥，憔悴人归後。 / 东风似旧。 / 问前度桃花，刘郎能记，花复认郎否。
- `status`: `done`

#### 095. 刘辰翁《摸鱼儿》 · 下阕

- `id`: `liu-chen-weng---mo-yu-er--`
- `target_asset`: `ReadForFun/song-ci/images/liu-chen-weng---mo-yu-er--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 君且住，草草留君翦韭。 / 前宵更恁时候。 / 深杯欲共歌声滑，翻湿春衫半袖。 / 空眉皱。 / 看白发尊前，已似人人有。 / 临分把手。 / 叹一笑论文，清狂顾曲，此会几时又。
- `status`: `done`

#### 096. 陆淞《瑞鹤仙》 · 上阕

- `id`: `lu-song---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/lu-song---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 脸霞红印枕。 / 睡觉来、冠儿还是不整。 / 屏间麝煤冷。 / 但眉峰压翠，泪珠弹粉。 / 堂深昼永。 / 燕交飞、风帘露井。
- `status`: `done`

#### 097. 陆淞《瑞鹤仙》 · 下阕

- `id`: `lu-song---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/lu-song---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 恨无人，与说相思，近日带围宽尽。 / 重省。 / 残灯朱幌，淡月纱窗，那时风景。 / 阳台路迥。 / 云雨梦，便无准。 / 待归来，先指花梢教看，却把心期细问。 / 问因循、过了青春，怎生意稳。
- `status`: `done`

#### 098. 姜夔《翠楼吟》 · 上阕

- `id`: `jiang-kui---cui-lou-yin--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---cui-lou-yin--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 月冷龙沙，尘轻虎落，今年汉初赐。 / 新翻胡部曲，听毡幕、元戎歌吹。 / 层楼高峙。 / 看栏曲萦红，檐牙飞翠。 / 人姝丽。 / 粉香吹下，夜寒风细。
- `status`: `done`

#### 099. 姜夔《翠楼吟》 · 下阕

- `id`: `jiang-kui---cui-lou-yin--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---cui-lou-yin--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 此地。 / 宜有词仙，拥素云黄鹤，与君游戏。 / 玉梯凝望久，叹芳草、萋萋千里。 / 天涯情味。 / 仗酒清愁，花销英气。 / 西山外。 / 晚来还卷，一帘秋霁。
- `status`: `done`

#### 100. 柳永《定风波》 · 上阕

- `id`: `liu-yong---ding-feng-bo--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---ding-feng-bo--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 自春来、惨绿愁红，芳心是事可可。 / 日上花梢，莺穿柳带，犹压香衾卧。 / 暖酥消，腻云。 / 终日厌厌倦梳裹。 / 无那。 / 恨薄情一去，音书无个。
- `status`: `done`

#### 101. 柳永《定风波》 · 下阕

- `id`: `liu-yong---ding-feng-bo--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---ding-feng-bo--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 早知恁麽。 / 悔当初、不把雕鞍锁。 / 向鸡窗、只与蛮笺象管，拘束教吟课。 / 镇相随，莫抛躲。 / 针线闲拈伴伊坐。 / 和我。 / 免使年少，光阴虚过。
- `status`: `done`

#### 102. 周邦彦《瑞鹤仙》 · 上阕

- `id`: `zhou-bang-yan---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 悄郊原带郭。 / 行路永，客去车尘漠漠。 / 斜阳映山落。 / 敛馀红、犹恋孤城栏角。 / 凌波步弱。 / 过短亭、何用素约。
- `status`: `done`

#### 103. 周邦彦《瑞鹤仙》 · 下阕

- `id`: `zhou-bang-yan---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 有流莺劝我，重解绣鞍，缓引春酌。 / 不记归时早暮，上马谁扶，醒眠朱阁。 / 惊飙动幕。 / 扶残醉，绕红药。 / 叹西园、已是花深无地，东风何事又恶。 / 任流光过却。 / 犹喜洞天自乐。
- `status`: `done`

#### 104. 蒋捷《女冠子》 · 上阕

- `id`: `jiang-jie---nv-guan-zi--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---nv-guan-zi--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 蕙花香也。 / 雪晴池馆如画。 / 春风飞到，宝钗楼上，一片笙箫，琉璃光射。 / 而今灯漫挂。 / 不是暗尘明月，那时元夜。 / 况年来、心懒意怯，羞与蛾儿争要。
- `status`: `done`

#### 105. 蒋捷《女冠子》 · 下阕

- `id`: `jiang-jie---nv-guan-zi--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---nv-guan-zi--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 江城人悄初更打。 / 问繁华谁解，再向天公借。 / 剔残红灺。 / 但梦里隐隐，钿车罗帕。 / 吴笺银粉砑。 / 待把旧家风景，写成闲话。 / 笑绿鬟邻女，倚窗犹唱，夕阳西下。
- `status`: `done`

#### 106. 蒋捷《瑞鹤仙》 · 上阕

- `id`: `jiang-jie---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---rui-he-xian--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 绀烟迷雁迹。 / 渐断鼓零钟，街喧初息。 / 风檠背寒壁。 / 放冰蜍飞到，丝丝窗隙。 / 琼瑰暗泣。 / 念乡关、霜芜似织。
- `status`: `done`

#### 107. 蒋捷《瑞鹤仙》 · 下阕

- `id`: `jiang-jie---rui-he-xian--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---rui-he-xian--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 漫将身、化鹤归来，忘却旧游端的。 / 欢极。 / 蓬壶蕖浸，花院梨溶，醉连春夕。 / 柯云罢弈。 / 樱桃在，梦难觅。 / 劝清光，乍可幽窗相伴，休照红楼夜笛。 / 怕人间、换谱伊凉，素娥未识。
- `status`: `done`

#### 108. 田为《江神子慢・江城子慢》 · 上阕

- `id`: `tian-wei---jiang-shen-zi-man---jiang-cheng-zi-man--`
- `target_asset`: `ReadForFun/song-ci/images/tian-wei---jiang-shen-zi-man---jiang-cheng-zi-man--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 玉台挂秋月。 / 铅素浅，梅花傅香雪。 / 冰姿洁。 / 金莲衬、小小凌波罗袜。 / 雨初歇。 / 楼外孤鸿声渐远，远山外、行人音信绝。
- `status`: `done`

#### 109. 田为《江神子慢・江城子慢》 · 下阕

- `id`: `tian-wei---jiang-shen-zi-man---jiang-cheng-zi-man--`
- `target_asset`: `ReadForFun/song-ci/images/tian-wei---jiang-shen-zi-man---jiang-cheng-zi-man--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 此恨对语犹难，那堪更寄书说。 / 教人红销翠减，觉衣宽金缕，都为轻别。 / 太情切。 / 消魂处、画角黄昏时节。 / 声呜咽。 / 落尽庭花春去也，银蟾迥、无情圆又缺。 / 恨伊不似馀香，惹鸳鸯结。
- `status`: `done`

#### 110. 吴文英《惜黄花慢》 · 上阕

- `id`: `wu-wen-ying---xi-huang-hua-man--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---xi-huang-hua-man--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 送客吴皋。 / 正试霜夜冷，枫落长桥。 / 望天不尽，背城渐杳，离亭黯黯，恨水迢迢。 / 翠香零落红衣老，暮愁锁、残柳眉梢。 / 念瘦腰。 / 沈郎旧日，曾系兰桡。
- `status`: `done`

#### 111. 吴文英《惜黄花慢》 · 下阕

- `id`: `wu-wen-ying---xi-huang-hua-man--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---xi-huang-hua-man--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 仙人凤咽琼箫。 / 怅断魂送远，九辨难招。 / 醉鬟留盼，小窗翦烛，歌云载恨，飞上银霄。 / 素秋不解随船去，败红趁、一叶寒涛。 / 梦翠翘。 / 怨鸿料过南谯。
- `status`: `done`

#### 112. 袁去华《安公子》 · 上阕

- `id`: `yuan-qu-hua---an-gong-zi--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---an-gong-zi--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 弱柳丝千缕。 / 嫩黄匀遍鸦啼处。 / 寒入罗衣春尚浅，过一番风雨。 / 问燕子来时，绿水桥边路。 / 曾画楼、见个人人否。 / 料静掩云窗，尘满哀弦危柱。
- `status`: `done`

#### 113. 袁去华《安公子》 · 下阕

- `id`: `yuan-qu-hua---an-gong-zi--`
- `target_asset`: `ReadForFun/song-ci/images/yuan-qu-hua---an-gong-zi--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 庾信愁如许。 / 为谁都著眉端聚。 / 独立东风弹泪眼，寄烟波东去。 / 念永昼春闲，人倦如何度。 / 闲傍枕、百啭黄鹂语。 / 唤觉来厌厌，残照依然花坞。
- `status`: `done`

#### 114. 苏轼《贺新郎》 · 上阕

- `id`: `su-shi---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/su-shi---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 乳燕飞华屋。 / 悄无人、桐阴转午，晚凉新浴。 / 手弄生绡白团扇，扇手一时似玉。 / 渐困倚、孤眠清熟。 / 帘外谁来推绣户，枉教人、梦断瑶台曲。 / 又却是，风敲竹。
- `status`: `done`

#### 115. 苏轼《贺新郎》 · 下阕

- `id`: `su-shi---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/su-shi---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 石榴半吐红巾蹙。 / 待浮花、浪蕊都尽，伴君幽独。 / 艳一枝细看取，芳心千重似束。 / 又恐被、秋风惊绿。 / 若待得君来向此，花前对酒不忍触。 / 共粉泪，两蔌蔌。
- `status`: `done`

#### 116. 刘克庄《贺新郎》 · 上阕

- `id`: `liu-ke-zhuang---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/liu-ke-zhuang---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 深院榴花吐。 / 画帘开、衣纨扇，午风清暑。 / 儿女纷纷夸结束，新样钗符艾虎。 / 早已有、游人观渡。 / 老大逢场慵作戏，任陌头、年少争旗鼓。 / 溪雨急，浪花舞。
- `status`: `done`

#### 117. 刘克庄《贺新郎》 · 下阕

- `id`: `liu-ke-zhuang---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/liu-ke-zhuang---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 灵均标致高如许。 / 忆生平、既纫兰佩，更怀椒糈。 / 谁信骚魂千载後，波底垂涎角黍。 / 又说是、蛟馋龙怒。 / 把似而今醒到了，料当年、醉死差无苦。 / 聊一笑，吊千古。
- `status`: `done`

#### 118. 秦观《望海潮》 · 上阕

- `id`: `qin-guan---wang-hai-chao--`
- `target_asset`: `ReadForFun/song-ci/images/qin-guan---wang-hai-chao--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 梅英疏淡，冰澌溶泄，东风暗换年华。 / 金谷俊游，铜驼巷陌，新晴细履平沙。 / 长记误随车。 / 正絮翻蝶舞，芳思交加。 / 柳下桃蹊，乱分春色到人家。 / 西园夜饮鸣笳。
- `status`: `done`

#### 119. 秦观《望海潮》 · 下阕

- `id`: `qin-guan---wang-hai-chao--`
- `target_asset`: `ReadForFun/song-ci/images/qin-guan---wang-hai-chao--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 有华灯碍月，飞盖妨花。 / 兰苑未空，行人渐老，重来是事堪嗟。 / 烟暝酒旗斜。 / 但倚楼极目，时见栖鸦。 / 无奈归心。 / 暗随流水到天涯。
- `status`: `done`

#### 120. 贺铸《人南渡・感皇恩》 · 上阕

- `id`: `he-zhu---ren-nan-du-・-gan-huang-en--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---ren-nan-du-・-gan-huang-en--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 兰芷满芳洲，游思横路。 / 罗袜尘生步。 / 迎顾。 / 整鬟颦黛，脉脉两情难语。 / 细风吹柳絮。 / 人南渡。
- `status`: `done`

#### 121. 贺铸《人南渡・感皇恩》 · 下阕

- `id`: `he-zhu---ren-nan-du-・-gan-huang-en--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---ren-nan-du-・-gan-huang-en--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 回首旧游，山无重数。 / 花底深朱户。 / 何处。 / 半黄梅子，向晚一帘疏雨。 / 断魂分付与。 / 春将去。
- `status`: `done`

#### 122. 吴文英《金缕歌・贺新郎》 · 上阕

- `id`: `wu-wen-ying---jin-lv-ge-・-he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---jin-lv-ge-・-he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 乔木生云气。 / 访中兴、英雄陈迹，暗追前事。 / 战舰东风悭借便，梦断神州故里。 / 旋小筑、吴宫闲地。 / 华表月明归夜鹤，叹当时、花竹今如此。 / 枝上露，溅清泪。
- `status`: `done`

#### 123. 吴文英《金缕歌・贺新郎》 · 下阕

- `id`: `wu-wen-ying---jin-lv-ge-・-he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---jin-lv-ge-・-he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 遨头小簇行春队。 / 步苍苔、寻幽别坞，问梅开未。 / 重唱梅边吸度曲，催发寒梢冻蕊。 / 此心与、东君同意。 / 後不如今非昔，两无言、相对沧浪水。 / 怀此恨，寄残醉。
- `status`: `done`

#### 124. 周密《玉京秋》 · 上阕

- `id`: `zhou-mi---yu-jing-qiu--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---yu-jing-qiu--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 烟水阔。 / 高林弄残照，晚蜩凄切。 / 碧砧度韵，银床飘叶。 / 衣湿桐阴露冷，采凉花、时赋秋雪。 / 叹轻别。 / 一襟幽事，砌蛩能说。
- `status`: `done`

#### 125. 周密《玉京秋》 · 下阕

- `id`: `zhou-mi---yu-jing-qiu--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---yu-jing-qiu--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 客思吟商还怯。 / 怨歌长、琼壶暗缺。 / 翠扇恩疏，红衣香褪，翻成消歇。 / 玉骨西风，恨最恨、闲却新凉时节。 / 楚箫咽。 / 谁倚西楼淡月。
- `status`: `done`

#### 126. 周密《曲游春》 · 上阕

- `id`: `zhou-mi---qu-you-chun--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---qu-you-chun--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 楚苑东风外，暖丝情絮，春思如织。 / 燕约莺期，恼芳情偏在，翠深红隙。 / 漠漠香尘隔。 / 沸十里、乱弦丛笛。 / 看画船，尽入西泠，闲却半湖春色。 / 柳陌。
- `status`: `done`

#### 127. 周密《曲游春》 · 下阕

- `id`: `zhou-mi---qu-you-chun--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---qu-you-chun--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 新烟凝碧。 / 映帘底宫眉，堤上游勒。 / 轻暝笼寒，怕梨云梦冷，杏香愁幂。 / 歌管酬寒食。 / 奈蝶怨、良宵岑寂。 / 正满湖、碎月摇花，怎生去得。
- `status`: `done`

#### 128. 仲殊《夏云峰》 · 上阕

- `id`: `zhong-shu---xia-yun-feng--`
- `target_asset`: `ReadForFun/song-ci/images/zhong-shu---xia-yun-feng--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 天阔云高，溪横水远。 / 晚日寒生轻晕。 / 闲阶静、杨花渐少，朱门掩、莺声犹嫩。 / 悔匆匆、过却清明，旋占得馀芳，已成幽恨。 / 都几日阴沈，连宵慵困。 / 起来韶华都尽。
- `status`: `done`

#### 129. 仲殊《夏云峰》 · 下阕

- `id`: `zhong-shu---xia-yun-feng--`
- `target_asset`: `ReadForFun/song-ci/images/zhong-shu---xia-yun-feng--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 怨入双眉闲斗损。 / 乍品得情怀，看承全近。 / 深深态、无非自许。 / 厌厌意、终羞人间。 / 争知道、梦里蓬莱，待忘了馀香，时传音信。 / 纵留得莺花，东风不住，也则眼前愁闷。
- `status`: `done`

#### 130. 潘汾《贺新郎》 · 上阕

- `id`: `pan-fen---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/pan-fen---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 篆缕销香鼎。 / 翠沈沈、庭阴转午，画堂人静。 / 芳草王孙知何处，惟有杨花糁径。 / 正玉枕、瞢腾初醒。 / 门外残红春已去，镇无聊、酒厌厌病。 / 云髻，未整。
- `status`: `done`

#### 131. 潘汾《贺新郎》 · 下阕

- `id`: `pan-fen---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/pan-fen---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 江南旧事休重省。 / 但天涯、寻消问息，断鸿难倩。 / 月满西楼凭阑久，依旧归期未定。 / 便只恐、瓶沈金井。 / 嘶骑不来银烛暗，枉教人、立尽梧桐影。 / 谁伴我，对鸾镜。
- `status`: `done`

#### 132. 李玉《贺新郎》 · 上阕

- `id`: `li-yu---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/li-yu---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 篆缕销金鼎。 / 醉沈沈、庭阴转午，画堂人静。 / 芳草王孙知何处，惟有杨花糁径。 / 渐玉枕、腾腾春醒。 / 帘外残红春已透，镇无聊、酒厌厌病。 / 云鬓乱，未整。
- `status`: `done`

#### 133. 李玉《贺新郎》 · 下阕

- `id`: `li-yu---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/li-yu---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 江南旧事休重省。 / 遍天涯、寻消问息，断鸿难倩。 / 月满西楼凭栏久，依旧归期未定。 / 又只恐、瓶沈金井。 / 嘶骑不来银烛暗，枉教人、立尽梧桐影。 / 谁伴我，对鸾镜。
- `status`: `done`

#### 134. 姜夔《齐天乐》 · 上阕

- `id`: `jiang-kui---qi-tian-le--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---qi-tian-le--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 庾郎先自吟愁赋。 / 凄凄更闻私语。 / 露湿铜铺，苔侵石井，都是曾听伊处。 / 哀音似诉。 / 正思妇无眠，起寻机杼。 / 曲曲屏山，夜凉独自甚情绪。
- `status`: `done`

#### 135. 姜夔《齐天乐》 · 下阕

- `id`: `jiang-kui---qi-tian-le--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---qi-tian-le--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 西窗又吹暗雨。 / 为谁频断续，相和砧杵。 / 候馆迎秋，离宫吊月，别有伤心无数。 / 豳诗漫与。 / 笑篱落呼灯，世间儿女。 / 写入琴丝，一声声更苦。
- `status`: `done`

#### 136. 姜夔《暗香》 · 上阕

- `id`: `jiang-kui---an-xiang--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---an-xiang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 旧时月色。 / 算几番照我，梅边吹笛。 / 唤起玉人，不管清寒与攀摘。 / 何逊而今渐老，都忘却、春风词笔。 / 但怪得、竹外疏花，香冷入瑶席。 / 江国。
- `status`: `done`

#### 137. 姜夔《暗香》 · 下阕

- `id`: `jiang-kui---an-xiang--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-kui---an-xiang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 正寂寂。 / 叹寄与路遥，夜雪初积。 / 翠尊易泣。 / 红萼无言耿相忆。 / 长记曾携手处，千树压、西湖寒碧。 / 又片片、吹尽也，几时见得。
- `status`: `done`

#### 138. 柳永《迷神引》 · 上阕

- `id`: `liu-yong---mi-shen-yin--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---mi-shen-yin--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 一叶扁舟轻帆卷。 / 暂泊楚江南岸。 / 孤城暮角，引胡茄怨。 / 水茫茫，平沙雁、旋惊散。 / 烟敛寒林簇，画屏展。 / 天际遥山小，黛眉浅。
- `status`: `done`

#### 139. 柳永《迷神引》 · 下阕

- `id`: `liu-yong---mi-shen-yin--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---mi-shen-yin--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 旧赏轻抛，到此成游宦。 / 觉客程劳，年光晚。 / 异乡风物，忍萧索、当愁眼。 / 帝城赊，秦楼阻，旅魂乱。 / 芳草连空阔，残照满。 / 佳人无消息，断云远。
- `status`: `done`

#### 140. 史达祖《双双燕》 · 上阕

- `id`: `shi-da-zu---shuang-shuang-yan--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---shuang-shuang-yan--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 过春社了，度帘幕中间，去年尘冷。 / 差池欲住，试入旧巢相并。 / 还相雕梁藻井。 / 又软语、商量不定。 / 飘然快拂花梢，翠尾分开红影。 / 芳径。
- `status`: `done`

#### 141. 史达祖《双双燕》 · 下阕

- `id`: `shi-da-zu---shuang-shuang-yan--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---shuang-shuang-yan--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 芹泥雨润。 / 爱贴地争飞，竞夸轻俊。 / 红楼归晚，看足柳昏花暝。 / 应自栖香正稳。 / 便忘了、天涯芳信。 / 愁损翠黛双蛾，日日画阑独凭。
- `status`: `done`

#### 142. 辛弃疾《贺新郎》 · 上阕

- `id`: `xin-qi-ji---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/xin-qi-ji---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 凤尾龙香拨。 / 自开元、霓裳曲罢，几番风月。 / 最苦浔阳江头客，画舸亭亭待发。 / 记出塞、黄云堆雪。 / 马上离愁三万里，望昭阳、宫殿孤鸿没。 / 弦解语，恨难说。
- `status`: `done`

#### 143. 辛弃疾《贺新郎》 · 下阕

- `id`: `xin-qi-ji---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/xin-qi-ji---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 辽阳驿使音尘绝。 / 琐窗寒、轻拢慢拈，泪珠盈睫。 / 推手含情还却手，一抹梁州哀彻。 / 千古事、云飞烟灭。 / 贺老定场无消息，想沈香亭北繁华歇。 / 弹到此，为呜咽。
- `status`: `done`

#### 144. 周邦彦《大》 · 上阕

- `id`: `zhou-bang-yan---da--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---da--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 对宿烟收，春禽静，飞雨时鸣高屋。 / 墙头青玉旆，洗铅霜都尽，嫩梢相触。 / 润逼琴丝，寒侵枕障，虫网吹沾帘竹。 / 邮亭无人处，听檐声不断，困眠初熟。 / 奈愁极顿惊，梦轻难记，自怜幽独。 / 行人归意速。
- `status`: `done`

#### 145. 周邦彦《大》 · 下阕

- `id`: `zhou-bang-yan---da--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---da--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 最先念、流潦妨车毂。 / 怎奈向、兰成憔悴，卫清羸，等闲时、易伤心目。 / 未怪平阳客，双泪落、笛中哀曲。 / 况萧索、青芜国。 / 红糁铺地，门外荆桃如菽。 / 夜游共谁秉烛。
- `status`: `done`

#### 146. 周邦彦《西河》 · 上阕

- `id`: `zhou-bang-yan---xi-he--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---xi-he--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 佳丽地。 / 南朝盛事谁记。 / 山围故国绕清江，髻鬟对起。 / 怒涛寂寞打孤城，风樯遥度天际。 / 断崖树，犹倒倚。 / 莫愁艇子曾系。
- `status`: `done`

#### 147. 周邦彦《西河》 · 下阕

- `id`: `zhou-bang-yan---xi-he--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---xi-he--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 空馀旧迹郁苍苍，雾沈半垒。 / 夜深月过女墙来，赏心东望淮水。 / 酒旗戏鼓甚处市。 / 想依稀、王谢邻里。 / 燕子不知何世。 / 入寻常、巷陌人家，相对如说兴亡，斜阳里。
- `status`: `done`

#### 148. 姚云文《紫萸香慢》 · 上阕

- `id`: `yao-yun-wen---zi-yu-xiang-man--`
- `target_asset`: `ReadForFun/song-ci/images/yao-yun-wen---zi-yu-xiang-man--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 近重阳、偏多风雨，绝怜此日暄明。 / 问秋香浓未，待携客、出西城。 / 正自羁怀多感，怕荒台高处，更不胜情。 / 向尊前、又忆洒酒插花人。 / 只座上、已无老兵。 / 凄情。
- `status`: `done`

#### 149. 姚云文《紫萸香慢》 · 下阕

- `id`: `yao-yun-wen---zi-yu-xiang-man--`
- `target_asset`: `ReadForFun/song-ci/images/yao-yun-wen---zi-yu-xiang-man--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 浅醉还醒。 / 愁不肯、与诗平。 / 记长楸走马，雕弓笮柳，前事休评。 / 紫萸一枝传赐，梦谁到、汉家陵。 / 尽乌纱、便随风去，要天知道，华发如此星星。 / 歌罢涕零。
- `status`: `done`

#### 150. 蒋捷《贺新郎》 · 上阕

- `id`: `jiang-jie---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 梦冷黄金屋。 / 叹秦筝、斜鸿阵里，素弦尘扑。 / 化作娇莺飞归去，犹认纱窗旧绿。 / 正过雨、荆桃如菽。 / 此恨难平君知否，似琼台、涌起弹棋局。 / 消瘦影，嫌明烛。
- `status`: `done`

#### 151. 蒋捷《贺新郎》 · 下阕

- `id`: `jiang-jie---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/jiang-jie---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 鸳楼碎泻东西玉。 / 问芳、何时再展，翠钗难卜。 / 待把宫眉横云样，描上生绡画幅。 / 怕不是、新来妆束。 / 彩扇红牙今都在，恨无人、解听开元曲。 / 空掩袖，倚寒竹。
- `status`: `done`

#### 152. 叶梦得《贺新郎》 · 上阕

- `id`: `ye-meng-de---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/ye-meng-de---he-xin-lang--/upper.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 睡起啼莺语。 / 掩青苔、房栊向晚，乱红无数。 / 吹尽残花无人见，惟有垂杨自舞。 / 渐暖霭、初回轻暑。 / 宝扇重寻明月影，暗尘侵、尚有乘鸾女。 / 惊旧恨，遽如许。
- `status`: `done`

#### 153. 叶梦得《贺新郎》 · 下阕

- `id`: `ye-meng-de---he-xin-lang--`
- `target_asset`: `ReadForFun/song-ci/images/ye-meng-de---he-xin-lang--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 江南梦断横江渚。 / 浪黏天、葡萄涨绿，半空烟雨。 / 无限楼前沧波意，谁采苹花寄取。 / 但怅望、兰舟容与。 / 万里云帆何时到，送孤鸿、目断千山阻。 / 谁为我，唱金缕。
- `status`: `done`

#### 154. 吴文英《霜叶飞》 · 上阕

- `id`: `wu-wen-ying---shuang-ye-fei--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---shuang-ye-fei--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 断烟离绪。 / 关心事，斜阳红隐霜树。 / 半壶秋水荐黄花，香西风雨。 / 纵玉勒、轻飞迅羽。 / 凄凉谁吊荒台古。
- `status`: `done`

#### 155. 吴文英《霜叶飞》 · 下阕

- `id`: `wu-wen-ying---shuang-ye-fei--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---shuang-ye-fei--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 记醉蹋南屏，彩扇咽、寒蝉倦梦，不知蛮素。 / 聊对旧节传杯，尘笺蠹管，断阕经岁慵赋。 / 小蟾斜影转东篱，夜冷残蛩语。 / 早白发、缘愁万缕。 / 惊飙从卷乌纱去。 / 漫细将、茱萸看，但约明年，翠微高处。
- `status`: `done`

#### 156. 苏轼《定风波》 · 上阕

- `id`: `su-shi---ding-feng-bo--`
- `target_asset`: `ReadForFun/song-ci/images/su-shi---ding-feng-bo--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 莫听穿林打叶声。 / 何妨吟啸且徐行。 / 竹杖芒鞋轻胜马。 / 谁怕。 / 一蓑烟雨任平生。
- `status`: `done`

#### 157. 苏轼《定风波》 · 下阕

- `id`: `su-shi---ding-feng-bo--`
- `target_asset`: `ReadForFun/song-ci/images/su-shi---ding-feng-bo--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 料峭春风吹酒醒。 / 微冷。 / 山头斜照却相迎。 / 回首向来萧瑟处。 / 归去。 / 也无风雨也无晴。
- `status`: `done`

#### 158. 晁端礼《绿头鸭・多丽》 · 上阕

- `id`: `chao-duan-li---lv-tou-ya-・-duo-li--`
- `target_asset`: `ReadForFun/song-ci/images/chao-duan-li---lv-tou-ya-・-duo-li--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 晚云收，淡天一片琉璃。 / 烂银盘、来从海底，皓色千里澄辉。 / 莹无尘、素娥淡伫，静可数、丹桂参差。 / 玉露初零，金风未凛，一年无似此佳时。 / 露坐久，疏莹时度，乌鹊正南飞。
- `status`: `done`

#### 159. 晁端礼《绿头鸭・多丽》 · 下阕

- `id`: `chao-duan-li---lv-tou-ya-・-duo-li--`
- `target_asset`: `ReadForFun/song-ci/images/chao-duan-li---lv-tou-ya-・-duo-li--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 瑶台冷，栏干凭暖，玉下迟迟。 / 念佳人，音尘别後，对此应解相思。 / 最关情、漏声正永，暗断肠、花影偷移。 / 料得来宵，清光未减，阴晴天气又争知。 / 共凝恋、如今别後，还是隔年期。 / 人强健，清尊素影，长愿相随。
- `status`: `done`

#### 160. 李甲《帝台春》 · 上阕

- `id`: `li-jia---di-tai-chun--`
- `target_asset`: `ReadForFun/song-ci/images/li-jia---di-tai-chun--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 芳草碧色，萋萋遍南陌。 / 暖絮乱红，也知人、春愁无力。 / 忆得盈盈拾翠侣，共携赏、凤城寒食。 / 到今来，海角逢春，天涯为客。 / 愁旋释。
- `status`: `done`

#### 161. 李甲《帝台春》 · 下阕

- `id`: `li-jia---di-tai-chun--`
- `target_asset`: `ReadForFun/song-ci/images/li-jia---di-tai-chun--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 还似织。 / 泪暗拭。 / 又偷滴。 / 谩伫立、遍倚危阑，尽黄昏，也只是、暮云凝碧。 / 拼则而已今拼了，忘则怎生便忘得。 / 又还问鳞鸿，试重寻消息。
- `status`: `done`

#### 162. 吴文英《夜合花》 · 上阕

- `id`: `wu-wen-ying---ye-he-hua--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---ye-he-hua--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 柳暝河桥，莺晴台苑，短策频惹春香。 / 当时夜泊，温柔便入深乡。 / 词韵窄，酒杯长。 / 翦蜡花、壶箭催忙。 / 共追游处，凌波翠陌，连棹横塘。
- `status`: `done`

#### 163. 吴文英《夜合花》 · 下阕

- `id`: `wu-wen-ying---ye-he-hua--`
- `target_asset`: `ReadForFun/song-ci/images/wu-wen-ying---ye-he-hua--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 十年一梦凄凉。 / 似西湖燕去，吴馆巢荒。 / 重来万感，依前唤酒银罂。 / 溪雨急，岸花狂。 / 趁残鸦、飞过苍茫。 / 故人楼上，凭谁指与，芳草斜阳。
- `status`: `done`

#### 164. 周密《绣鸾凤花犯・花犯》 · 上阕

- `id`: `zhou-mi---xiu-luan-feng-hua-fan-・-hua-fan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---xiu-luan-feng-hua-fan-・-hua-fan--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 楚江湄，湘娥乍见，无言洒清泪。 / 淡然春意。 / 空独倚东风，芳思谁寄。 / 凌波路冷秋无际。 / 香云随步起。
- `status`: `done`

#### 165. 周密《绣鸾凤花犯・花犯》 · 下阕

- `id`: `zhou-mi---xiu-luan-feng-hua-fan-・-hua-fan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-mi---xiu-luan-feng-hua-fan-・-hua-fan--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 谩记得，汉宫仙掌，亭亭明月底。 / 冰弦写怨更多情，骚人恨，枉赋芳兰幽芷。 / 春思远，谁叹赏、国香风味。 / 相将共、岁寒伴侣。 / 小窗净、沈烟熏翠袂。 / 幽梦觉，涓涓清露，一枝灯影里。
- `status`: `done`

#### 166. 贺铸《望湘人》 · 上阕

- `id`: `he-zhu---wang-xiang-ren--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---wang-xiang-ren--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 厌莺声到枕，花气动帘，醉魂愁梦相半。 / 被惜馀薰，带惊剩眼。 / 几许伤春春晚。 / 泪竹痕鲜，佩兰香老，湘天浓暖。 / 记小江、风月佳时，屡约非烟游伴。
- `status`: `done`

#### 167. 贺铸《望湘人》 · 下阕

- `id`: `he-zhu---wang-xiang-ren--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---wang-xiang-ren--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 须信鸾弦易断。 / 奈云和再鼓，曲终人远。 / 认罗袜无踪，旧处弄波清浅。 / 青翰棹舣，白苹洲畔。 / 尽木临皋飞观。 / 不解寄、一字相思，幸有归来双燕。
- `status`: `done`

#### 168. 柳永《玉蝴蝶》 · 上阕

- `id`: `liu-yong---yu-hu-die--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---yu-hu-die--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 望处雨收云断，凭阑悄悄，目送秋光。 / 晚景萧疏，堪动宋玉悲凉。 / 水风轻、苹花渐老，月露冷、梧叶飘黄。 / 遣情伤。 / 故人何在，烟水茫茫。
- `status`: `done`

#### 169. 柳永《玉蝴蝶》 · 下阕

- `id`: `liu-yong---yu-hu-die--`
- `target_asset`: `ReadForFun/song-ci/images/liu-yong---yu-hu-die--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 难忘。 / 文期酒会，几孤风月，屡变星霜。 / 海阔山遥，未知何处是潇湘。 / 念双燕、难凭远信，指暮天、空识归航。 / 黯相望。 / 断鸿声里，立尽斜阳。
- `status`: `done`

#### 170. 史达祖《喜迁莺》 · 上阕

- `id`: `shi-da-zu---xi-qian-ying--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---xi-qian-ying--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 月波疑滴。 / 望玉壶天近，了无尘隔。 / 翠眼圈花，冰丝织练，黄道宝光相直。 / 自怜诗酒瘦，难应接、许多春色。 / 最无赖，是随香趁烛，曾伴狂客。
- `status`: `done`

#### 171. 史达祖《喜迁莺》 · 下阕

- `id`: `shi-da-zu---xi-qian-ying--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---xi-qian-ying--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 踪迹。 / 谩记忆。 / 老了杜郎，忍听东风笛。 / 柳院灯疏，梅厅雪在，谁与细倾春碧。 / 旧情拘未定，犹自学、当年游历。 / 怕万一，误玉人、夜寒帘隙。
- `status`: `done`

#### 172. 史达祖《夜合花》 · 上阕

- `id`: `shi-da-zu---ye-he-hua--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---ye-he-hua--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 柳锁莺魂，花翻蝶梦，自知愁染潘郎。 / 轻衫未揽，犹将泪点偷藏。 / 念前事，怯流光。 / 早春窥、酥雨池塘。 / 向销凝里，梅开半面，情满徐妆。
- `status`: `done`

#### 173. 史达祖《夜合花》 · 下阕

- `id`: `shi-da-zu---ye-he-hua--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---ye-he-hua--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 风丝一寸柔肠。 / 曾在歌边惹恨，烛底萦香。 / 芳机瑞锦，如何未织鸳鸯。 / 人扶醉，月依墙。 / 是当初、谁敢疏狂。 / 把闲言语，花房夜久，各自思量。
- `status`: `done`

#### 174. 史达祖《玉胡蝶・玉蝴蝶》 · 上阕

- `id`: `shi-da-zu---yu-hu-die-・-yu-hu-die--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---yu-hu-die-・-yu-hu-die--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 晚雨未摧宫树，可怜闲叶，犹抱凉蝉。 / 短景归秋，吟思又接愁边。 / 漏初长、梦魂难禁，人渐老、风月俱寒。 / 想幽欢。 / 土花庭，虫网阑干。
- `status`: `done`

#### 175. 史达祖《玉胡蝶・玉蝴蝶》 · 下阕

- `id`: `shi-da-zu---yu-hu-die-・-yu-hu-die--`
- `target_asset`: `ReadForFun/song-ci/images/shi-da-zu---yu-hu-die-・-yu-hu-die--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 无端。 / 啼蛄搅夜，恨随团扇，苦近秋莲。 / 一笛当楼，谢娘悬泪立风前。 / 故园晚、强留诗酒，新雁远、不致寒暄。 / 隔苍烟。 / 楚香罗袖，谁伴婵娟。
- `status`: `done`

#### 176. 卢祖皋《宴清都》 · 上阕

- `id`: `lu-zu-gao---yan-qing-dou--`
- `target_asset`: `ReadForFun/song-ci/images/lu-zu-gao---yan-qing-dou--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 春讯飞琼管。 / 风日薄、度墙啼鸟声乱。 / 江城次第，笙歌翠合，绮罗香暖。 / 溶溶涧渌冰泮。 / 醉梦里、年华暗换。
- `status`: `done`

#### 177. 卢祖皋《宴清都》 · 下阕

- `id`: `lu-zu-gao---yan-qing-dou--`
- `target_asset`: `ReadForFun/song-ci/images/lu-zu-gao---yan-qing-dou--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 料黛眉重锁隋堤，芳心还动梁苑。 / 新来雁阔云音，鸾分槛影，无计重见。 / 啼春细雨，笼愁澹月，恁时庭院。 / 离肠未语先断。 / 算犹有、凭高望眼。 / 更那堪、芳草连天，飞梅弄晚。
- `status`: `done`

#### 178. 贺铸《绿头鸭・多丽》 · 上阕

- `id`: `he-zhu---lv-tou-ya-・-duo-li--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---lv-tou-ya-・-duo-li--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 玉人家，画楼珠箔临津。 / 托微风、彩箫流怨，断肠马上曾闻。 / 燕堂开、艳妆丛里，调琴思、认歌颦。 / 麝蜡烟浓，玉莲漏短，更衣不待酒初醺。 / 绣屏掩、枕鸳相就，香气渐暾暾。
- `status`: `done`

#### 179. 贺铸《绿头鸭・多丽》 · 下阕

- `id`: `he-zhu---lv-tou-ya-・-duo-li--`
- `target_asset`: `ReadForFun/song-ci/images/he-zhu---lv-tou-ya-・-duo-li--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 回廊影，疏钟淡月，几许销魂。 / 翠钗分、银笺封泪，舞鞋从此生尘。 / 住兰舟、载将离恨，转南浦、背西曛。 / 记取明年，蔷薇谢後，佳期应未误行云。 / 凤城远，楚梅香嫩，先寄一枝春。 / 青门外，祗凭芳草，寻访郎君。
- `status`: `done`

#### 180. 周邦彦《解连环》 · 上阕

- `id`: `zhou-bang-yan---jie-lian-huan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---jie-lian-huan--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 怨怀无托。 / 嗟情人断绝，信音辽邈。 / 信妙手、能解连环，似风散雨收，雾轻云薄。 / 燕子楼空，暗尘锁、一床弦索。 / 想移根换叶。
- `status`: `done`

#### 181. 周邦彦《解连环》 · 下阕

- `id`: `zhou-bang-yan---jie-lian-huan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---jie-lian-huan--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 尽是旧时，手种红药。 / 汀洲渐生杜若。 / 料舟依岸曲，人在天角。 / 谩记得、当日音书，把闲语闲言，待总烧却。 / 水驿春回，望寄我、江南梅萼。 / 拚今生，对花对酒，为伊落泪。
- `status`: `done`

#### 182. 周邦彦《绮寮怨》 · 上阕

- `id`: `zhou-bang-yan---qi-liao-yuan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---qi-liao-yuan--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 上马人扶残醉，晓风吹未醒。 / 映水曲、翠瓦朱檐，垂杨里、乍见津亭。 / 当时曾题败壁，蛛丝罩、淡墨苔晕青。 / 念去来、岁月如流，徘徊久、叹息愁思盈。 / 去去倦寻路程。
- `status`: `done`

#### 183. 周邦彦《绮寮怨》 · 下阕

- `id`: `zhou-bang-yan---qi-liao-yuan--`
- `target_asset`: `ReadForFun/song-ci/images/zhou-bang-yan---qi-liao-yuan--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 江陵旧事，何曾再问杨琼。 / 旧曲凄清。 / 敛愁黛、与谁听。 / 尊前故人如在，想念我、最关情。 / 何须渭城。 / 歌声未尽处，先泪零。
- `status`: `done`

#### 184. 王沂孙《长亭怨・长亭怨慢》 · 上阕

- `id`: `wang-yi-sun---chang-ting-yuan-・-chang-ting-yuan-man--`
- `target_asset`: `ReadForFun/song-ci/images/wang-yi-sun---chang-ting-yuan-・-chang-ting-yuan-man--/upper.webp`
- `image_count`: `1`
- `grid`: `2×2`
- `layout_note`: 按起兴/写景、人物或动作、转折、收束分成四格；少于四个语义单元时保留留白。
- `content`: 泛孤艇、东皋过遍。 / 尚记当日，绿阴门掩。 / 屐齿莓阶，酒痕罗袖事何限。 / 欲寻前迹，空惆怅、成秋苑。 / 自约赏花人，别後总、风流云散。
- `status`: `done`

#### 185. 王沂孙《长亭怨・长亭怨慢》 · 下阕

- `id`: `wang-yi-sun---chang-ting-yuan-・-chang-ting-yuan-man--`
- `target_asset`: `ReadForFun/song-ci/images/wang-yi-sun---chang-ting-yuan-・-chang-ting-yuan-man--/lower.webp`
- `image_count`: `1`
- `grid`: `2×3`
- `layout_note`: 六格按语义推进组织，不强行一格一句；把相邻短句合并，保留词的整体气韵。
- `content`: 水远。 / 怎知流水外，却是乱山尤远。 / 天涯梦短。 / 想忘了、绮疏雕槛。 / 望不尽、苒苒斜阳，抚乔木、年华将晚。 / 但数点红英，犹识西园凄婉。
- `status`: `done`
