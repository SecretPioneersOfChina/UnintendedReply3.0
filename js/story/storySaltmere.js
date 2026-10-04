/**
 * storySaltmere.js - 盐港迷雾 (salt_ch1-4)
 * 英剧式悬疑：慢燃、群像、阶级与"全镇的沉默" + 四结局
 *
 * 风格参考（仅氛围，不含任何既有作品的角色/文本）：
 * 灰蓝色的北海、小镇人人互相认识、每个人都说了半句真话。
 */
var character_holt    = { id: 'holt',    nameKey: 'saltCharHolt',    color: '#7aa2c0', avatar: '🕵️', description: '刑事侦缉督察薇薇安·霍尔特，从伦敦被下放到盐港' };
var character_reay    = { id: 'reay',    nameKey: 'saltCharReay',    color: '#4f8ef7', avatar: '🧢', description: '警长卡勒姆·雷伊，本地人，温和，话不多' };
var character_hester  = { id: 'hester',  nameKey: 'saltCharHester',  color: '#c98fb0', avatar: '👑', description: '海丝特·索恩夫人，盐港最有权势的人' };
var character_julian  = { id: 'julian',  nameKey: 'saltCharJulian',  color: '#e0b04a', avatar: '🎩', description: '朱利安·索恩，索恩家的长子，正在竞选议员' };
var character_cade    = { id: 'cade',    nameKey: 'saltCharCade',    color: '#8fa08d', avatar: '⚓', description: '马丁·凯德，老灯塔看守，发现尸体的人' };
var character_amy     = { id: 'amy',     nameKey: 'saltCharAmy',     color: '#f59e0b', avatar: '📓', description: '艾米·巴克，离开盐港十一年后回来的女人' };

/* ========== 第一章：退潮 ========== */
var salt_ch1 = {
    id: 'salt_ch1',
    titleKey: 'saltCh1Title',
    subtitleKey: 'saltCh1Sub',
    narrator: txt(
        '英格兰东海岸，盐港。十一月，退潮的凌晨四点。潮水退去的时候，海会把藏了一夜的东西还回来。\n今早它还回来的，是一个女人。',
        'Saltmere, on the east coast of England. November, four in the morning, and the tide is going out. When the sea withdraws it gives back whatever it has been hiding all night.\nThis morning what it gives back is a woman.',
        'イングランド東海岸、ソルトミア。十一月、引き潮の午前四時。海は引くとき、一晩隠していたものを返す。\n今朝それが返したのは、一人の女だった。'
    ),
    scenes: {
        /* 开篇：防波堤下 */
        salt_ch1_start: {
            messages: [
                makeNarrator(txt(
                    '防波堤第七根柱子下面，她半埋在湿沙里，身上是那件盐港中学的旧校服——虽然她已经二十七岁了。\n她的指甲缝里全是盐。左手指甲断了一枚。',
                    'Beneath the seventh pillar of the breakwater she lies half-buried in wet sand, wearing the old blazer of Saltmere Comprehensive — though she is twenty-seven years old.\nHer fingernails are packed with salt. One nail on her left hand is torn.',
                    '防波堤の七本目の柱の下、彼女は濡れた砂に半ば埋もれていた。saltmere中等学校の古いブレザーを着て——もう二十七歳なのに。\n爪の間は塩だらけ。左手の爪が一枚剥がれていた。'
                )),
                makeCharacter('cade', txt(
                    '「我每天这个点出来遛狗。狗先闻到的——它不叫，就是不肯走。我以为是条死海豹，拿灯一照……」\n他把马灯放下，手在抖。「上帝啊。是艾米。是艾米·巴克。」',
                    "\"I walk the dog at this hour every day. The dog smelled her first — didn't bark, just refused to move. Thought it was a dead seal. Held up the lantern and...\"\nHe sets the lantern down. His hands are shaking. \"Dear God. It's Amy. It's Amy Barker.\"",
                    '「毎日この時間に犬を散歩させてる。先に気づいたのは犬だ——吠えない、ただ動かない。アザラシの死骸かと思って、ランタンを向けたら……」\n彼はランタンを置く。手が震えている。「なんてこった。エイミーだ。エイミー・バーカーだ。」'
                )),
                makeCharacter('holt', txt(
                    '「凯德先生，从现在起你什么都不要再碰。狗绳给我。」\n我蹲下来，没去碰她。盐港的规矩我知道：先看潮水，再看尸体。\n潮汐表说，尸体被放进水里的时间，是昨晚九点到十一点之间。',
                    '"Mr Cade, from this moment you touch nothing else. Give me the lead."\nI crouch down without touching her. I know the rule in a place like this: read the tide first, then read the body.\nThe tide table says she entered the water between nine and eleven last night.',
                    '「ケイドさん、これ以上何も触らないで。リードを私に。」\n私はしゃがみ込むが、彼女には触れない。こういう土地の作法を知っている。まず潮を読み、それから遺体を読む。\n潮汐表によれば、彼女が水に入ったのは昨夜九時から十一時の間だ。'
                )),
                makeSystem(txt(
                    '📋 现场初判\n• 地点：盐港防波堤第七柱，退潮线以下 4 米\n• 死者：艾米·巴克（现场辨认）\n• 死亡时间窗口：昨夜 21:00–23:00\n• 未发现：手机、包、鞋（右脚）\n• 报案人：马丁·凯德，灯塔看守',
                    '📋 First assessment\n• Location: 7th pillar, Saltmere breakwater, 4m below the tide line\n• Deceased: Amy Barker (identified on scene)\n• Time of death window: 21:00–23:00 last night\n• Not found: phone, bag, right shoe\n• Reported by: Martin Cade, lighthouse keeper',
                    '📋 現場初判\n• 場所：ソルトミア防波堤7番柱、干潮線より4m下\n• 死者：エイミー・バーカー（現場で確認）\n• 死亡推定時刻：昨夜21:00〜23:00\n• 未発見：携帯、バッグ、右の靴\n• 通報者：マーティン・ケイド、灯台守'
                ))
            ],
            playerReply: txt(
                '在我的履历里，这一页叫"下放"。在盐港，这一页叫"回家"。我恨这两个词。',
                'In my file this page is called "a sideways move". In Saltmere it is called "coming home". I hate both words.',
                '私の経歴書では、この頁は「左遷」と呼ばれる。ソルトミアでは「帰郷」と呼ばれる。どちらの言葉も嫌いだ。'
            ),
            choices: [
                makeChoice(txt('🔍 一寸一寸看现场——沙会说话', '🔍 Work the sand inch by inch — sand talks', '🔍 砂を一寸ずつ調べる——砂は語る'),
                    'salt_ch1_shore', { salt_clue: 1 }, 'truth',
                    txt('我把风衣脱下来铺在沙上，趴下去。', 'I take off my coat, spread it on the sand, and lie down.', '私はコートを脱いで砂の上に敷き、腹ばいになった。'), 'neutral'),
                makeChoice(txt('⚓ 先问凯德——他为什么一眼就认出她', '⚓ Question Cade first — why did he name her so fast?', '⚓ まずケイドを訊く——なぜ一目で彼女だと'),
                    'salt_ch1_cade', { salt_cade: 1 }, 'empathy',
                    txt('我让他坐下。他不坐。', 'I tell him to sit. He does not sit.', '私は彼に座れと言う。彼は座らない。'), 'neutral'),
                makeChoice(txt('📁 先查她是谁——十一年，足够让一个人变成另一个人', '📁 Find out who she was first — eleven years is long enough to become someone else', '📁 まず彼女が誰だったか——十一年あれば別人になれる'),
                    'salt_ch1_file', { salt_clue: 1 }, 'caution',
                    txt('我给局里打电话：查艾米·巴克的全部档案。', 'I ring the station: pull everything on Amy Barker.', '私は署に電話する。エイミー・バーカーの全記録を。'), 'neutral')
            ]
        },

        /* 现场勘查 */
        salt_ch1_shore: {
            messages: [
                makeNarrator(txt(
                    '潮水退得干净，沙面像一块黑板，什么都写在上面。\n她被拖进来的痕迹很清楚：脚跟的两道沟，和旁边另一组脚印——四十二码，男靴，鞋跟外侧磨损，像常年走石坡的人。\n还有第三样东西：半枚被踩进沙里的金属牌，边缘挂着一点蓝漆。',
                    'The tide has gone out cleanly. The sand is a blackboard with everything written on it.\nThe drag marks are clear: two furrows from her heels, and beside them a second set of prints — size 42, men\'s boots, worn on the outer heel, the way a man who walks rock slopes wears them.\nAnd a third thing: half a metal tag trodden into the sand, a fleck of blue paint clinging to its edge.',
                    '潮は綺麗に引いた。砂は黒板のようで、すべてが書かれている。\n引きずられた跡は明瞭だ。かかとの二筋の溝、そしてその脇に別の足跡——42サイズ、男性靴、外側のヒールが減っている。岩場を歩き慣れた者の減り方だ。\nそして三つ目。砂に踏み込まれた金属プレートの半分。縁に青いペンキが一片。'
                )),
                makeCharacter('reay', txt(
                    '「蓝漆。是索恩航运的漆——他们所有船、所有码头器械都刷这个色。这镇上一半的男人脚底下沾着它。」\n他顿了顿。「霍尔特督察，我说句不好听的：在盐港，这条线索等于没线索。」',
                    '"Blue paint. That\'s Thorne Shipping\'s colour — every boat, every piece of dock equipment they own is painted in it. Half the men in this town have it on their soles."\nHe pauses. "Ma\'am, and I\'ll say the ugly bit: in Saltmere, that clue is no clue at all."',
                    '「青いペンキ。ソーン海運の色だ。船も岸壁の機材も全部この色。この町の男の半分が靴裏に付けてる。」\n彼は間を置く。「警視、嫌なことを言いますが。ソルトミアでは、その手がかりは手がかりじゃない。」'
                )),
                makeCharacter('holt', txt(
                    '「那就把它当成半条。警长，我要这镇上所有人的不在场证明——包括你。」\n卡勒姆看着我，没生气。他只是点了点头，像早就知道我会这么说。',
                    '"Then treat it as half a clue. Sergeant, I want alibis for everyone in this town — including yours."\nCallum looks at me without anger. He simply nods, as though he knew I would say it.',
                    '「なら半分の手がかりとして扱う。巡査部長、この町の全員のアリバイを取る。あなたのも含めて。」\nカラムは私を見る。怒っていない。ただ頷く——私がそう言うと分かっていたように。'
                ))
            ],
            playerReply: txt(
                '卡勒姆·雷伊。三十四岁，盐港出生长大，档案干净得像刚洗过的杯子。',
                'Callum Reay. Thirty-four, born and raised in Saltmere, file as clean as a freshly rinsed glass.',
                'カラム・レイ。三十四歳、ソルトミア生まれ育ち。記録は洗いたてのコップのように綺麗だ。'
            ),
            choices: [
                makeChoice(txt('⚓ 去灯塔问凯德——他在潮水里站了太久', '⚓ Go to the lighthouse and ask Cade — he stood in the water too long', '⚓ 灯台へ。ケイドに訊く——彼は水に長く立ちすぎた'),
                    'salt_ch1_cade', { salt_cade: 1 }, 'empathy',
                    txt('他报的案，可他的靴子干得最快。', 'He reported it, yet his boots dried the fastest.', '通報したのは彼だ。だが彼の靴が一番早く乾いていた。'), 'neutral'),
                makeChoice(txt('📁 查艾米·巴克——她为什么回来', '📁 Look up Amy Barker — why did she come back?', '📁 エイミー・バーカーを調べる——なぜ戻った'),
                    'salt_ch1_file', { salt_clue: 1 }, 'truth',
                    txt('一个人回来，要么是为了爱，要么是为了账。', 'People come back for love, or they come back for a debt.', '人が戻るのは、愛のためか、借りの為か。'), 'neutral'),
                makeChoice(txt('🌫️ 天亮了，收队——先让法医说话', '🌫️ It is daylight. Stand down — let the pathologist speak first', '🌫️ 夜が明けた。撤収——まず鑑識に語らせる'),
                    'salt_ch1_night', {}, 'caution',
                    txt('我把现场交给取证组。', 'I hand the scene over to forensics.', '私は現場を鑑識に引き渡す。'), 'neutral')
            ]
        },

        /* 问凯德 */
        salt_ch1_cade: {
            messages: [
                makeNarrator(txt(
                    '凯德的灯塔在防波堤尽头，一盏不再点亮的旧灯。屋里全是钟表——三十七只，没有两只走得一样快。\n他给我们倒茶，杯子是三个不同的。',
                    'Cade\'s lighthouse stands at the end of the breakwater, an old lamp that is no longer lit. The room is full of clocks — thirty-seven of them, no two keeping the same time.\nHe pours tea into three cups that do not match.',
                    'ケイドの灯台は防波堤の突端にある。もう灯らない古い灯。部屋は時計だらけ——三十七個、二つとして同じ時を刻んでいない。\n彼はお茶を注ぐ。三つの違うカップに。'
                )),
                makeCharacter('cade', txt(
                    '「十一年。她走的时候十七岁，背着个包，从长途汽车站走的。全盐港都知道她再也不会回来。」\n他盯着自己的手。「三天前她敲我的门，问我一句话——她问：那天晚上，灯塔的灯为什么没亮。」',
                    '"Eleven years. She was seventeen when she left, a rucksack on her back, from the coach station. All of Saltmere knew she would never come back."\nHe stares at his hands. "Three days ago she knocked on my door and asked me one thing. She asked: why was the lamp not lit that night?"',
                    '「十一年。彼女が出て行ったのは十七のとき。リュックを背負って、長距離バス停から。町中の誰もが、彼女はもう戻らないと知っていた。」\n彼は自分の手を見つめる。「三日前、彼女が私の扉を敲いて、一つだけ訊いた。あの夜、灯台の灯はなぜ点かなかったのか、と。」'
                )),
                makeCharacter('holt', txt(
                    '「哪天晚上？」\n凯德没有回答。三十七只钟表一起走，屋里像下着小雨。',
                    '"Which night?"\nCade does not answer. Thirty-seven clocks tick together and the room sounds like light rain.',
                    '「どの夜です？」\nケイドは答えない。三十七個の時計が一斉に刻み、部屋は小雨の音がする。'
                ))
            ],
            playerReply: txt(
                '「那天晚上」。在盐港，人们说这四个字的时候，从来不用加日期。',
                '"That night." In Saltmere, nobody needs to add a date to those two words.',
                '「あの夜」。ソルトミアでは、この言葉に日付を付け足す者はいない。'
            ),
            choices: [
                makeChoice(txt('🔍 回现场，把沙再读一遍', '🔍 Back to the beach — read the sand again', '🔍 砂浜へ戻り、砂をもう一度読む'),
                    'salt_ch1_shore', { salt_clue: 1 }, 'truth',
                    txt('有些答案不在人嘴里。', 'Some answers are not carried in mouths.', '答えのいくつかは、人の口の中にはない。'), 'neutral'),
                makeChoice(txt('📁 查档案：十一年前那晚发生了什么', '📁 Pull the files — what happened eleven years ago?', '📁 記録を漁る。十一年前のあの夜に何が'),
                    'salt_ch1_file', { salt_wreck: 1, salt_clue: 1 }, 'risk',
                    txt('我翻开盐港最旧的那只柜子。', 'I open the oldest cabinet in Saltmere.', '私はソルトミアで一番古い書類棚を開ける。'), 'good'),
                makeChoice(txt('🫖 不逼他。慢慢泡完这杯茶', '🫖 Do not push him. Let the tea finish brewing', '🫖 急がない。この一杯が淹るまで待つ'),
                    'salt_ch1_night', { salt_cade: 1 }, 'empathy',
                    txt('在英国，沉默也是一种供词。', 'In England, silence is a kind of testimony too.', 'イギリスでは、沈黙もまた証言だ。'), 'good')
            ]
        },

        /* 死者身份 */
        salt_ch1_file: {
            messages: [
                makeSystem(txt(
                    '📁 档案：艾米·巴克\n• 1997 年生于盐港，母亲是索恩庄园的清洁工，父亲是渔民\n• 2013 年（16 岁）：父亲死于海难\n• 2013 年 11 月：离开盐港，从此未归\n• 2024 年 11 月 3 日：登记入住盐港唯一一家旅馆，房间 4 号\n• 职业：伦敦某独立新闻机构的调查记者',
                    '📁 File: Amy Barker\n• Born Saltmere 1997; mother cleaned at Thorne Hall, father was a fisherman\n• 2013 (age 16): father lost at sea\n• Nov 2013: left Saltmere, never returned\n• 3 Nov 2024: checked into Saltmere\'s only hotel, room 4\n• Occupation: investigative journalist, independent newsroom, London',
                    '📁 記録：エイミー・バーカー\n• 1997年ソルトミア生まれ。母はソーン館の清掃員、父は漁師\n• 2013年（16歳）：父が海難死\n• 2013年11月：ソルトミアを去る、以来帰らず\n• 2024年11月3日：町で唯一のホテル4号室にチェックイン\n• 職業：ロンドンの独立系報道機関の調査記者'
                )),
                makeCharacter('reay', txt(
                    '「她父亲是『海雀号』上的。五个人，一艘船，一夜之间全没了。那年我哥哥也在那条船上。」\n他说得很平。太平了。',
                    '"Her father was aboard the Puffin. Five men, one boat, gone in a single night. My brother was on her too that year."\nHe says it flatly. Too flatly.',
                    '「彼女の父は『海雀号』に乗っていた。五人、一隻、一夜で全部失われた。あの年、兄も同じ船だった。」\n彼は淡々と言う。淡々としすぎている。'
                )),
                makeCharacter('holt', txt(
                    '「警长，你哥哥的事，档案里一个字都没有。」',
                    '"Sergeant, there is nothing in the file about your brother."',
                    '「巡査部長、あなたの兄のことは記録に一言もない。」'
                )),
                makeCharacter('reay', txt(
                    '「因为那是海。海不写档案。」\n他说完就后悔了——他看向窗外的防波堤，那里现在有蓝色帐篷和白色的灯。',
                    '"Because it was the sea. The sea does not keep files."\nHe regrets it the moment he says it — he looks out at the breakwater, where there are now blue tents and white lamps.',
                    '「海だからさ。海は記録を残さない。」\n言った瞬間に彼は後悔する——窓の外の防波堤を見る。今は青いテントと白い灯が並んでいる。'
                ))
            ],
            playerReply: txt(
                '十一年前死掉五个男人。十一年后死掉一个女人。中间连着一条谁都不肯说出口的线。',
                'Five men died eleven years ago. A woman died last night. Between them runs a line nobody in this town will say aloud.',
                '十一年前に五人の男が死んだ。昨夜、一人の女が死んだ。その間を、町の誰も口にしない一本の線が走っている。'
            ),
            choices: [
                makeChoice(txt('🔍 去现场——沙还没被潮水抹掉', '🔍 To the beach — the tide has not erased the sand yet', '🔍 砂浜へ。潮が砂を消す前に'),
                    'salt_ch1_shore', { salt_clue: 1 }, 'truth',
                    txt('我必须在涨潮前回去。', 'I have to get back before the tide turns.', '潮が満ちる前に戻らねば。'), 'neutral'),
                makeChoice(txt('⚓ 回灯塔——凯德知道那晚灯为什么不亮', '⚓ Back to the lighthouse — Cade knows why the lamp stayed dark', '⚓ 灯台へ戻る。あの夜、なぜ灯が点かなかったか'),
                    'salt_ch1_cade', { salt_cade: 1, salt_wreck: 1 }, 'empathy',
                    txt('他又倒了三杯不配套的茶。', 'He pours three unmatching cups again.', '彼はまた、揃っていない三杯を注ぐ。'), 'good'),
                makeChoice(txt('🌫️ 收队。今晚索恩庄园有晚宴', '🌫️ Stand down. There is a dinner at Thorne Hall tonight', '🌫️ 撤収。今夜、ソーン館で晩餐会がある'),
                    'salt_ch1_night', {}, 'caution',
                    txt('盐港所有重要的人，今夜都会在同一张桌子上。', 'Everyone who matters in Saltmere will be at one table tonight.', 'ソルトミアの重要な者が全員、今夜ひとつのテーブルに着く。'), 'neutral')
            ]
        },

        /* 章末：霍尔特的夜晚 */
        salt_ch1_night: {
            messages: [
                makeNarrator(txt(
                    '我在伦敦的最后一件事，是举报了我的上司。程序正义做完之后，他们给了我两个选择：辞职，或者盐港。\n我母亲在索恩庄园擦了二十六年的地板。她死的时候，庄园送了一个花圈，没派人来。',
                    'The last thing I did in London was report my own superior. When due process was finished they gave me two choices: resign, or Saltmere.\nMy mother scrubbed the floors of Thorne Hall for twenty-six years. When she died, the Hall sent a wreath and sent no one.',
                    'ロンドンで最後に私がしたのは、上司を告発することだった。手続きが終わると、二つの選択肢が与えられた。辞職か、ソルトミアか。\n母は二十六年、ソーン館の床を磨いた。死んだとき、館は花輪を寄越し、人は寄越さなかった。'
                )),
                makeCharacter('reay', txt(
                    '「督察，大家都劝你别查太深。他们说这话的时候，其实是在替自己说。」\n「那你呢？」\n「我哥哥叫欧文。他二十四岁。他游泳比谁都好。」',
                    '"Ma\'am, everyone will tell you not to dig too deep. When they say it, they are really saying it for themselves."\n"And you?"\n"My brother was called Owen. He was twenty-four. He could swim better than any of us."',
                    '「警視、深く掘るなと皆言いますよ。彼らがそれを言うとき、実際には自分のために言っている。」\n「あなたは？」\n「兄はオーウェン。二十四だった。泳ぎは誰より上手かった。」'
                )),
                makeNarrator(txt(
                    '夜里十一点，海面上的雾从东边压过来，把盐港的灯一盏一盏吃掉。\n在雾里，我听见防波堤那头传来一声钟——不是教堂的，是灯塔的。那只很久没响过的钟。',
                    'At eleven the fog comes in from the east and eats the lights of Saltmere one by one.\nThrough the fog I hear a bell from the far end of the breakwater — not the church bell. The lighthouse bell, which has not rung in years.',
                    '午後十一時、東から霧が押し寄せ、ソルトミアの灯を一つずつ食べていく。\n霧の中、防波堤の向こうから鐘が一つ聞こえた。教会のではない。灯台の鐘——何年も鳴っていなかったそれが。'
                ))
            ],
            isTransition: true,
            nextChapter: 'salt_ch2'
        }
    },
    startScene: 'salt_ch1_start'
};

/* ========== 第二章：潮汐之间 ========== */
var salt_ch2 = {
    id: 'salt_ch2',
    titleKey: 'saltCh2Title',
    subtitleKey: 'saltCh2Sub',
    narrator: txt(
        '索恩庄园建在盐港最高的崖上，从每一扇窗都能看见海——这是盐港的建筑语言，意思是：我看着你们。',
        'Thorne Hall stands on the highest cliff in Saltmere, and from every window you can see the sea. That is the architectural language of this town, and it means: I am watching you.',
        'ソーン館はソルトミアで最も高い崖に建つ。どの窓からも海が見える——この町の建築言語だ。意味はこう。「私はお前たちを見ている」。'
    ),
    scenes: {
        /* 庄园大门 */
        salt_ch2_gate: {
            messages: [
                makeNarrator(txt(
                    '砾石路走了两百米才有门。门开着——在盐港，门开着不是欢迎，是"我们没什么要藏的"。\n海丝特·索恩夫人在大厅里等我，穿一件灰色的开司米，站在她曾祖母的画像下面，姿势和画像一模一样。',
                    'The gravel drive runs two hundred metres before the door. The door is open — in Saltmere, an open door is not welcome, it is a statement: we have nothing to hide.\nLady Hester Thorne waits in the hall, grey cashmere, standing beneath the portrait of her great-grandmother in the same posture as the portrait.',
                    '砂利道を二百メートル行ってようやく扉がある。扉は開いていた——ソルトミアでは、開いた扉は歓迎ではない。「隠すものはない」という宣言だ。\nヘスター・ソーン夫人がホールで待っている。グレーのカシミア。曾祖母の肖像画の下に、その絵とまったく同じ姿勢で立っている。'
                )),
                makeCharacter('hester', txt(
                    '「霍尔特督察。我认识你母亲。」\n她没有说"节哀"之类的任何一句。她只是让这句话悬在那里，像一件挂在墙上的武器。\n「在这个家里，我们记得每一个为我们工作过的人。这是我们的教养。」',
                    '"Detective Inspector Holt. I knew your mother."\nShe offers none of the usual sentences. She simply lets it hang there, like a weapon mounted on a wall.\n"In this house we remember everyone who has worked for us. It is our breeding."',
                    '「ホルト警視。あなたの母上を知っています。」\n彼女は「お悔やみ」の類を一切言わない。ただその一文を宙に吊るす。壁に掛かった武器のように。\n「この家では、働いてくれた者を一人残らず覚えている。それが私たちの躾です。」'
                )),
                makeCharacter('holt', txt(
                    '「那么您一定也记得艾米·巴克。她母亲也在这栋房子里工作过。」\n大厅里有一秒钟的安静。那一秒钟里，我听见楼上有扇门轻轻关上了。',
                    '"Then you will remember Amy Barker too. Her mother worked in this house as well."\nThere is a second of silence in the hall, and in that second I hear a door upstairs close quietly.',
                    '「ではエイミー・バーカーも覚えておいででしょう。彼女の母もこの家で働いていました。」\nホールに一秒の静けさ。その一秒の間に、二階の扉が静かに閉まる音がした。'
                ))
            ],
            playerReply: txt(
                '在英格兰，阶级不是钱，是"谁记得谁"。',
                'In England, class is not money. It is who remembers whom.',
                'イングランドにおいて、階級とは金ではない。「誰が誰を覚えているか」だ。'
            ),
            choices: [
                makeChoice(txt('📋 要昨晚的访客名单——谁在，谁不在', '📋 Demand last night\'s guest list — who was here, who was not', '📋 昨夜の来客名簿を出させる——誰がいて、誰がいないか'),
                    'salt_ch2_guest', { salt_proof: 1 }, 'truth',
                    txt('名单是一本皮革册子，翻开来有墨水的味道。', 'The list is a leather-bound book that smells of ink when opened.', '名簿は革装の冊子。開くとインクの匂いがした。'), 'neutral'),
                makeChoice(txt('🎩 单独问朱利安——楼上的门不是自己关的', '🎩 Speak to Julian alone — that door upstairs did not close itself', '🎩 ジュリアンと二人で話す——二階の扉は自然に閉まらない'),
                    'salt_ch2_julian', { salt_julian: 1 }, 'risk',
                    txt('我上楼。地毯吞掉了我的脚步声。', 'I go upstairs. The carpet swallows my footsteps.', '私は二階へ上がる。絨毯が足音を飲み込む。'), 'neutral'),
                makeChoice(txt('🌊 直接问"海雀号"——把刀直接放到桌上', '🌊 Ask about the Puffin outright — put the knife on the table', '🌊 いきなり「海雀号」を訊く——刃物をそのまま卓に置く'),
                    'salt_ch2_wreck', { salt_wreck: 1, salt_proof: 1 }, 'risk',
                    txt('我想看看她眨不眨眼。', 'I want to see whether she blinks.', '私は彼女が瞬きをするか見たかった。'), 'good')
            ]
        },

        /* 访客名单 */
        salt_ch2_guest: {
            messages: [
                makeNarrator(txt(
                    '名单翻到昨夜那一页——被撕掉了。撕得很整齐，用的是裁纸刀，不是手。\n但皮革封面有压痕。上一页写字的力道透到了这一页，我举起来对着窗：能看见几个字母的反面——A. B. 和一个时间：21:40。',
                    'I turn to last night\'s page — it has been torn out. Torn cleanly, with a paper knife, not by hand.\nBut the leather cover holds an impression. The pressure of the pen on the page before has struck through. I hold it to the window: the reverse of a few letters is legible — A. B. — and a time: 21:40.',
                    '名簿を昨夜の頁まで繰る——破り取られている。綺麗に、紙切り刀で。手ではない。\nだが革の表紙に圧痕が残っている。前頁のペンの圧が裏まで抜けているのだ。窓に翳すと、数文字の裏が読める。A. B. そして時刻。21:40。'
                )),
                makeCharacter('hester', txt(
                    '「昨晚是年度潮汐晚宴。四十个人，半数喝多了。名单是我亲手撕的——我不想让警局拿去打扰客人。」\n她微笑。「在这个国家，督察，我们仍然有一样东西叫得体。」',
                    '"Last night was the annual Tide Dinner. Forty guests, half of them drunk. I tore the page out myself — I did not want the police knocking on my guests\' doors."\nShe smiles. "In this country, Inspector, we still have a thing called decency."',
                    '「昨夜は年に一度の潮汐晩餐会。四十人の客、半数は酔っていた。破ったのは私だ。警察に客の戸を叩かせたくなかった。」\n彼女は微笑む。「この国にはまだ、品格というものがありますのでね、警視。」'
                )),
                makeCharacter('holt', txt(
                    '「妨碍司法，在英国也不算失礼，算犯罪。夫人，二十一点四十，A. B.——艾米·巴克到过这里。」\n这一次她没有笑。她把手放在那只银壶上，像要拿起来，又放下了。',
                    '"Obstructing an investigation is not bad manners in this country, Lady Thorne. It is a crime. Nine-forty, A. B. — Amy Barker was here."\nThis time she does not smile. She puts her hand on the silver teapot as if to lift it, and then does not.',
                    '「捜査妨害はこの国では不作法ではなく犯罪です。夫人。21時40分、A. B.——エイミー・バーカーはここに来ていた。」\n今度は彼女は微笑まない。銀の急須に手を置き、持ち上げかけて、やめる。'
                ))
            ],
            playerReply: txt(
                '她撕掉那一页不是为了保护客人。是为了保护其中一个。',
                'She did not tear out that page to protect her guests. She tore it out to protect one of them.',
                '彼女がその頁を破ったのは客を守るためではない。その中の一人を守るためだ。'
            ),
            choices: [
                makeChoice(txt('🎩 上楼找朱利安', '🎩 Go upstairs to Julian', '🎩 二階のジュリアンのもとへ'),
                    'salt_ch2_julian', { salt_julian: 1 }, 'risk',
                    txt('我在走廊尽头停住。', 'I stop at the end of the corridor.', '私は廊下の突端で立ち止まる。'), 'neutral'),
                makeChoice(txt('🌊 回到客厅，问"海雀号"', '🌊 Back to the drawing room — ask about the Puffin', '🌊 広間に戻り、「海雀号」を訊く'),
                    'salt_ch2_wreck', { salt_wreck: 1, salt_proof: 1 }, 'risk',
                    txt('我把银壶推到一边，好让她看清我的脸。', 'I push the teapot aside so she can see my face properly.', '私は銀の急須を脇へ押しやる。彼女に私の顔を見せるために。'), 'good'),
                makeChoice(txt('🚪 去艾米住过的房间——她把东西留在哪了', '🚪 Find the room Amy slept in — where did she leave her things?', '🚪 エイミーが泊まった部屋へ——彼女は何を置いていった'),
                    'salt_ch2_room', { salt_proof: 1 }, 'trust',
                    txt('旅馆四号房的钥匙，在柜台后面的第 4 格。', 'The key to hotel room 4 is in slot 4 behind the counter.', 'ホテル4号室の鍵は、カウンター裏の4番。'), 'neutral')
            ]
        },

        /* 朱利安 */
        salt_ch2_julian: {
            messages: [
                makeNarrator(txt(
                    '朱利安·索恩的书房里挂着一张选举海报，上面他自己笑得像个刚学会笑的人。\n桌上摊着一份演讲稿，标题是《盐港的第二次潮汐》。',
                    'Julian Thorne\'s study holds an election poster on which he smiles like a man who has only just learned how.\nA speech lies open on the desk, titled The Second Tide of Saltmere.',
                    'ジュリアン・ソーンの書斎には選挙ポスターが掛かっている。微笑み方を覚えたばかりの男のような笑顔だ。\n机には演説原稿が開いたまま。題は『ソルトミアの第二の潮』。'
                )),
                makeCharacter('julian', txt(
                    '「我昨晚十点离开宴会去了纽卡斯尔，有两个证人，还有高速收费记录。」\n他背得太快了。一个清白的人会先问"发生了什么"。\n「督察，你要明白：这个镇子现在最不需要的，就是一桩谋杀案。」',
                    '"I left the dinner at ten for Newcastle. Two witnesses, and the motorway toll records."\nHe recites it too quickly. An innocent man asks what happened first.\n"Inspector, you must understand: the last thing this town needs right now is a murder."',
                    '「昨夜十時に晩餐会を離れ、ニューカッスルへ向かった。証人は二人、高速の料金記録もある。」\n彼は早口で暗記を述べる。潔白な人間はまず「何があった」と訊く。\n「警視、分かってください。この町が今いちばん必要としていないのは、殺人事件です。」'
                )),
                makeCharacter('holt', txt(
                    '「那么最需要的是什么，索恩先生？」',
                    '"And what does it need most, Mr Thorne?"',
                    '「では何がいちばん必要なのです、ソーンさん？」'
                )),
                makeCharacter('julian', txt(
                    '「一场选举。」他说漏了嘴，然后改口：「不，我说的是——一份投资。复兴基金下周决定盐港的码头归谁。」',
                    '"An election." He hears himself and corrects: "No — I meant an investment. The Renewal Fund decides next week who gets the Saltmere docks."',
                    '「選挙だ。」彼は自分の言葉に気づき、修正する。「いや、投資のことだ。再生基金が来週、ソルトミアの埠頭を誰に与えるか決める。」'
                ))
            ],
            playerReply: txt(
                '他不是在为自己辩解。他是在为一个日子辩解——下周一，码头归谁。',
                'He is not defending himself. He is defending a date — next Monday, who gets the docks.',
                '彼が弁護しているのは自分ではない。ある日付だ——来週月曜、埠頭は誰のものになるか。'
            ),
            choices: [
                makeChoice(txt('📋 回客厅要访客名单', '📋 Back to the hall for the guest list', '📋 広間に戻り、来客名簿を要求する'),
                    'salt_ch2_guest', { salt_proof: 1 }, 'truth',
                    txt('我想知道谁的名字被写在他名字旁边。', 'I want to know whose name was written beside his.', '彼の名前の隣に誰の名前が書かれていたか知りたい。'), 'neutral'),
                makeChoice(txt('🌊 问他知不知道"海雀号"', '🌊 Ask whether he knows the Puffin', '🌊 「海雀号」を知っているか訊く'),
                    'salt_ch2_wreck', { salt_wreck: 1, salt_proof: 1 }, 'risk',
                    txt('我说出那三个字，看着他的手。', 'I say the two words and watch his hands.', '私はその名を口にし、彼の手を見る。'), 'good'),
                makeChoice(txt('🚪 去旅馆四号房', '🚪 Go to hotel room 4', '🚪 ホテルの4号室へ'),
                    'salt_ch2_room', { salt_proof: 1 }, 'trust',
                    txt('活人会说谎。留下的东西不会。', 'The living lie. What they leave behind does not.', '生きている者は嘘をつく。残された物はつかない。'), 'neutral')
            ]
        },

        /* 海雀号 */
        salt_ch2_wreck: {
            messages: [
                makeCharacter('hester', txt(
                    '「『海雀号』是一场海难，督察。事故调查报告有四十页，结论是天气。」\n她终于坐下了。坐下意味着这场对话她不想速战速决。\n「那一年，我丈夫捐了二十万英镑给死者家属。二十万。你知道那年我们赚了多少吗？负的。」',
                    '"The Puffin was a maritime accident, Inspector. The inquiry runs to forty pages and concludes: weather."\nAt last she sits. Sitting means she does not want this finished quickly.\n"That year my husband gave two hundred thousand pounds to the families. Two hundred thousand. Do you know what we earned that year? A loss."',
                    '「『海雀号』は海難事故です、警視。事故調査報告は四十頁、結論は天候。」\n彼女はようやく座る。座るということは、この会話を早く終わらせたくないということだ。\n「あの年、夫は遺族に二十万ポンド寄付した。二十万ですよ。あの年いくら稼いだか知っていますか？赤字です。」'
                )),
                makeCharacter('holt', txt(
                    '「天气不会撕掉访客名单。天气也不会在十一年后把一个记者拖进防波堤下面。」\n我从口袋里拿出那半枚金属牌，放在她面前的桌上。蓝漆，编号 TS-07。\n「TS。索恩航运。」',
                    '"Weather does not tear pages out of a guest book. Weather does not drag a journalist under the breakwater eleven years later."\nI take the half tag from my pocket and lay it on the table in front of her. Blue paint. Number TS-07.\n"TS. Thorne Shipping."',
                    '「天候が来客名簿の頁を破ることはない。天候が十一年後に記者を防波堤の下へ引きずり込むこともない。」\n私はポケットから金属プレートの半分を出し、彼女の前の卓に置く。青いペンキ、番号 TS-07。\n「TS。ソーン海運。」'
                )),
                makeNarrator(txt(
                    '她看了那半枚牌子很久。然后她说了一句我这辈子都忘不了的话：\n「督察，你母亲擦地板的时候，从来不看地毯下面的东西。你也别看。」',
                    'She looks at the half tag for a long time. Then she says something I will remember for the rest of my life:\n"Inspector, when your mother scrubbed these floors she never looked under the carpets. Do not look either."',
                    '彼女はその半分のプレートを長く見つめる。そして私が一生忘れない一言を言う。\n「警視。あなたの母上がこの床を磨いていたとき、絨毯の下のものは決して見なかった。あなたも見ないで。」'
                ))
            ],
            playerReply: txt(
                '这是盐港真正的语法：他们从不否认，他们只是劝你别看。',
                'This is the true grammar of Saltmere: they never deny. They only advise you not to look.',
                'これがソルトミアの真の文法だ。否定はしない。「見ないほうがいい」と勧めるだけだ。'
            ),
            choices: [
                makeChoice(txt('🚪 去旅馆四号房——艾米留下了什么', '🚪 Hotel room 4 — what did Amy leave behind?', '🚪 ホテル4号室へ——エイ米は何を残した'),
                    'salt_ch2_room', { salt_proof: 1 }, 'truth',
                    txt('我要看她最后写下的字。', 'I need to read the last thing she wrote.', '彼女が最後に書いたものを読みたい。'), 'neutral'),
                makeChoice(txt('🚗 离开庄园。让雾想一想', '🚗 Leave the Hall. Let the fog think about it', '🚗 館を出る。霧に考えさせる'),
                    'salt_ch2_leave', {}, 'caution',
                    txt('我发动车，雨刷刮掉一层盐。', 'I start the car; the wipers clear away a layer of salt.', 'エンジンをかけ、ワイパーが塩の膜を払う。'), 'neutral')
            ]
        },

        /* 旅馆四号房 */
        salt_ch2_room: {
            messages: [
                makeNarrator(txt(
                    '四号房没有被人整理过。床没睡过——她三天没睡在床上，她睡在桌前。\n桌上摊着一本硬皮笔记本、一张盐港地图、和一台被拆开的旧录音机。地图上，灯塔被红笔圈了三次。',
                    'Room 4 has not been serviced. The bed is unslept in — for three days she did not sleep in the bed, she slept at the desk.\nOn the desk lie a hardback notebook, a map of Saltmere, and an old tape recorder taken apart. On the map the lighthouse is circled three times in red.',
                    '4号室は清掃されていない。ベッドは使われていない——彼女は三日間ベッドで眠らず、机で眠った。\n机にはハードカバーの手帳、ソルトミアの地図、そして分解された古いテープレコーダー。地図の上で灯台が赤ペンで三度丸で囲まれている。'
                )),
                makeCharacter('reay', txt(
                    '「督察，你看这个。」他把录音机装回去，按下播放。\n先是海的声音，然后是一个男人的声音，很老，很轻：\n「……那天晚上我没点灯。我喝了酒。就一次。就一次……」',
                    '"Ma\'am — this." He fits the recorder back together and presses play.\nFirst the sea, then a man\'s voice, old and very quiet:\n"...that night I did not light the lamp. I had been drinking. Just once. Just once..."',
                    '「警視、これを。」彼はレコーダーを組み直し、再生を押す。\nまず海の音。それから男の声。老いて、とても小さい。\n「……あの夜、私は灯を点けなかった。酒を飲んでいた。一度だけ。一度だけ……」'
                )),
                makeNarrator(txt(
                    '笔记本最后一页只有一行字，写得很用力，纸都破了：\n「他们把燃料的钱拿走了，却让一个醉汉背了十一年。——问凯德，问他为什么肯背。」',
                    'The last page of the notebook holds a single line, written so hard the paper has torn:\n"They took the fuel money and let a drunk man carry it for eleven years. — Ask Cade. Ask him why he was willing to carry it."',
                    '手帳の最後の頁には一行だけ。強く書きすぎて紙が破れている。\n「彼らは燃料の金を持ち出し、酔った男に十一年背負わせた。——ケイドに訊け。なぜ背負う気になったのかを。」'
                ))
            ],
            playerReply: txt(
                '艾米早就查到了。她只差一个肯承认的人。',
                'Amy had already found it. All she needed was one person willing to admit it.',
                'エイミーはもう突き止めていた。あとは認める者が一人いればよかった。'
            ),
            choices: [
                makeChoice(txt('🚗 回警局。天黑之前还有很多事要做', '🚗 Back to the station. There is a great deal to do before dark', '🚗 署へ戻る。暗くなる前にやることが多い'),
                    'salt_ch2_leave', {}, 'trust',
                    txt('我把笔记本装进证物袋。', 'I seal the notebook in an evidence bag.', '私は手帳を証拠袋に入れる。'), 'neutral'),
                makeChoice(txt('🌊 直接去灯塔——现在', '🌊 Straight to the lighthouse — now', '🌊 すぐ灯台へ——今すぐ'),
                    'salt_ch2_leave', { salt_cade: 1 }, 'risk',
                    txt('我不能等到明天。', 'I cannot wait until tomorrow.', '明日まで待てない。'), 'neutral')
            ]
        },

        /* 章末 */
        salt_ch2_leave: {
            messages: [
                makeNarrator(txt(
                    '车开出庄园大门的时候，后视镜里，海丝特·索恩还站在台阶上。她没有挥手，她只是站着——像一座知道自己终将被拆掉的房子。',
                    'As the car pulls out through the gates I see Lady Thorne in the mirror, still on the steps. She does not wave. She simply stands there, like a house that knows it will eventually be pulled down.',
                    '車が館の門を出るとき、ミラーの中でヘスター・ソーンはまだ階段に立っている。手を振らない。ただ立っている——いずれ取り壊されると知っている家のように。'
                )),
                makeCharacter('reay', txt(
                    '「督察。我有一件事没说。」\n「我知道。」\n「……你怎么知道？」\n「因为你在盐港活了三十四年，而你还没学会撒谎。」',
                    '"Ma\'am. There is one thing I have not told you."\n"I know."\n"...How do you know?"\n"Because you have lived in Saltmere for thirty-four years and you still have not learned to lie."',
                    '「警視。一つ言っていないことがあります。」\n「知ってる。」\n「……なぜ？」\n「あなたは三十四年ソルトミアで生きて、まだ嘘が下手だから。」'
                )),
                makeNarrator(txt(
                    '海面上，涨潮开始了。盐港的潮水每十二小时回来一次，从不问这里的人准备好了没有。',
                    'Out on the water the tide has turned. In Saltmere the sea comes back every twelve hours and never asks whether anyone here is ready.',
                    '海の上で、潮が満ち始めた。ソルトミアの潮は十二時間ごとに戻る。ここの者が準備できているかなど、決して訊かない。'
                ))
            ],
            isTransition: true,
            nextChapter: 'salt_ch3'
        }
    },
    startScene: 'salt_ch2_gate'
};

/* ========== 第三章：盐与谎言 ========== */
var salt_ch3 = {
    id: 'salt_ch3',
    titleKey: 'saltCh3Title',
    subtitleKey: 'saltCh3Sub',
    narrator: txt(
        '盐港的档案室在市政厅地下，隔壁是暖气机房，常年二十八度。\n在英格兰，如果你想藏一份文件，最好的办法不是烧掉它，而是把它放在一个没人愿意待的房间里。',
        'Saltmere\'s archive is in the basement of the town hall, next to the boiler room, twenty-eight degrees all year round.\nIn England, if you want to hide a document, the best method is not to burn it. It is to keep it in a room where nobody wants to sit.',
        'ソルトミアの文書室は市庁舎の地下、ボイラー室の隣で、年中二十八度。\nイングランドで書類を隠したいなら、燃やすのが最善ではない。誰もいたがらない部屋に置くのが最善だ。'
    ),
    scenes: {
        /* 调查中枢 */
        salt_ch3_hub: {
            messages: [
                makeNarrator(txt(
                    '退潮还有六个小时。六小时之后，海会把所有痕迹洗干净。\n在这六小时里，我最多能去三个地方中的两个——这是我在这行学到的唯一算术。',
                    'There are six hours until the tide goes out again. After that the sea will wash everything clean.\nIn six hours I can reach two of three places at most — the only arithmetic this job has ever taught me.',
                    '次の引き潮まで六時間。その後、海はすべての痕跡を洗い流す。\nこの六時間で、三つの場所のうちせいぜい二つにしか行けない——この仕事が教えてくれた唯一の算数だ。'
                )),
                makeCharacter('holt', txt(
                    '「卡勒姆，三件事要查清楚：那份维修记录、凯德那晚到底做了什么、还有你哥哥的名字为什么从来没出现在报告里。」\n「督察……第三件事，跟我有关。」\n「我知道。所以更要查。」',
                    '"Callum, three things need to be settled: the maintenance record, what Cade actually did that night, and why your brother\'s name never appeared in the report."\n"Ma\'am... the third one is about me."\n"I know. That is exactly why it has to be settled."',
                    '「カラム、三つ片づけることがある。補修記録、あの夜ケイドが実際に何をしたか、そしてあなたの兄の名前がなぜ報告書に一度も出てこないか。」\n「警視……三つ目は、私のことです。」\n「知ってる。だからこそ片づける。」'
                ))
            ],
            playerReply: txt(
                '在伦敦我学会了怀疑每一个人。在盐港我学会的是更难的一样：怀疑每一个我愿意相信的人。',
                'In London I learned to suspect everyone. In Saltmere I am learning the harder thing: to suspect everyone I want to believe.',
                'ロンドンで私は全員を疑うことを覚えた。ソルトミアで覚えているのは、もっと難しいこと——信じたいと願う者を疑うことだ。'
            ),
            choices: [
                makeChoice(txt('📁 市政厅地下——十一年前的维修记录', '📁 Town hall basement — the maintenance record from eleven years ago', '📁 市庁舎地下——十一年前の補修記録'),
                    'salt_ch3_archive', { salt_proof: 1, salt_ledger: 1 }, 'truth',
                    txt('暖气机房隔壁，二十八度。', 'Next to the boiler. Twenty-eight degrees.', 'ボイラー室の隣、二十八度。'), 'neutral'),
                makeChoice(txt('⚓ 灯塔——让凯德自己说完那句话', '⚓ The lighthouse — let Cade finish that sentence himself', '⚓ 灯台——ケイドにあの文を最後まで言わせる'),
                    'salt_ch3_lighthouse', { salt_proof: 1, salt_confession: 1 }, 'empathy',
                    txt('三十七只钟，只有一只是对的。', 'Thirty-seven clocks. Only one of them is right.', '三十七個の時計。正しいのは一つだけ。'), 'good'),
                makeChoice(txt('🧢 找卡勒姆——欧文·雷伊的那一夜', '🧢 Find Callum — the night of Owen Reay', '🧢 カラムを探す——オーウェン・レイのあの夜'),
                    'salt_ch3_reay', { salt_proof: 1, salt_owen: 1 }, 'trust',
                    txt('他哥哥游泳比谁都好。', 'His brother could swim better than any of them.', '兄は誰より泳ぎが上手かった。'), 'good')
            ]
        },

        /* 档案室 */
        salt_ch3_archive: {
            messages: [
                makeNarrator(txt(
                    '海雀号的材料有四大箱。前面三箱是天气报告、保险单、抚恤金发放签收表——签得整整齐齐，每一个名字后面都有一个颤抖的签名。\n第四箱在最下面，编号是"杂项"。里面只有一张纸。',
                    'The Puffin material fills four boxes. The first three hold weather reports, insurance policies, and compensation receipts — neat, every name followed by a shaking signature.\nThe fourth box is at the bottom, labelled "Miscellaneous". Inside it is a single sheet of paper.',
                    '海雀号の資料は四箱。最初の三箱は気象報告、保険証書、弔慰金の受領表——整然としており、どの名前の後にも震える署名がある。\n四箱目が一番下、「雑件」。中には紙が一枚だけ。'
                )),
                makeSystem(txt(
                    '📄 索恩航运 · 内部支出凭证（复印件）\n• 日期：2013 年 11 月 12 日\n• 项目：灯塔燃料补给（年度）→ 状态：取消\n• 金额：£4,200 → 转出至「索恩庄园 · 潮汐晚宴」\n• 批准签名：H. T.\n• 备注栏手写：「今年不补给。反正那条航线已经不用了。」',
                    '📄 Thorne Shipping · Internal Expenditure Voucher (copy)\n• Date: 12 Nov 2013\n• Item: Lighthouse fuel supply (annual) → Status: CANCELLED\n• Amount: £4,200 → transferred to "Thorne Hall · Tide Dinner"\n• Approved by: H. T.\n• Marginal note in handwriting: "No resupply this year. The route is no longer in use anyway."',
                    '📄 ソーン海運・内部支出伝票（写し）\n• 日付：2013年11月12日\n• 項目：灯台燃料補給（年間）→ 状態：取消\n• 金額：£4,200 →「ソーン館・潮汐晩餐会」へ振替\n• 承認署名：H. T.\n• 余白の手書き：「今年は補給なし。どうせその航路は使っていない。」'
                )),
                makeCharacter('holt', txt(
                    '「四千二百英镑。一场晚宴的钱，换了五个男人的命。」\n我把纸举到灯下。水印是真的，签名是真的，字迹是她的——和今早大厅里那个签访客名单的手，一模一样。',
                    '"Four thousand two hundred pounds. The price of one dinner, for the lives of five men."\nI hold the sheet up to the lamp. The watermark is genuine, the signature is genuine, the hand is hers — the same hand that signed the guest book in the hall this morning.',
                    '「四千二百ポンド。晩餐会一回分で、五人の男の命。」\n私は紙を灯に翳す。透かしは本物、署名は本物、そして字は彼女のものだ——今朝ホールで来客名簿に署名したのと同じ手。'
                ))
            ],
            playerReply: txt(
                '海难报告写的是"天气"。真正的报告只有一句话：今年不补给。',
                'The inquiry wrote the word "weather". The real report was one line: no resupply this year.',
                '海難報告には「天候」と書かれた。本当の報告は一文だけ。今年は補給なし、と。'
            ),
            choices: [
                makeChoice(txt('⚓ 去灯塔——让凯德把那句话说完', '⚓ To the lighthouse — let Cade finish what he started', '⚓ 灯台へ——ケイドにあの文を言わせる'),
                    'salt_ch3_lighthouse', { salt_proof: 1, salt_confession: 1 }, 'empathy',
                    txt('我带着这张纸去见他。', 'I take this sheet with me to see him.', '私はこの一枚を持って彼に会いに行く。'), 'good'),
                makeChoice(txt('🧢 先找卡勒姆——他有权先知道', '🧢 Find Callum first — he has the right to know first', '🧢 まずカラム——彼が最初に知る権利がある'),
                    'salt_ch3_reay', { salt_proof: 1, salt_owen: 1 }, 'trust',
                    txt('这个镇子欠他哥哥一个名字。', 'This town owes his brother a name.', 'この町は彼の兄に名前を借りている。'), 'good'),
                makeChoice(txt('⚖️ 够了。收网', '⚖️ Enough. Close the net', '⚖️ 十分だ。網を畳む'),
                    'salt_ch3_closing', {}, 'risk',
                    txt('涨潮不等人。', 'The tide does not wait for anyone.', '潮は誰も待たない。'), 'neutral')
            ]
        },

        /* 灯塔 */
        salt_ch3_lighthouse: {
            messages: [
                makeNarrator(txt(
                    '灯塔的门开着。三十七只钟，今天只有一只在走。\n马丁·凯德坐在那盏不亮的灯下面，脚边放着一个铁皮箱，箱子上写着：燃料。空的。',
                    'The lighthouse door stands open. Of the thirty-seven clocks, only one is running today.\nMartin Cade sits beneath the dead lamp. At his feet is a tin box labelled: FUEL. It is empty.',
                    '灯台の扉は開いている。三十七個の時計のうち、今日動いているのは一つだけ。\nマーティン・ケイドは灯らない灯の下に座っている。足元にブリキ箱。「燃料」。中は空だ。'
                )),
                makeCharacter('cade', txt(
                    '「补给船本来十一月来。他们告诉我取消了，说航线不用了。」\n他把空箱子踢了一脚，声音很轻，像踢一只死猫。\n「我那晚喝了一整瓶。两点钟我醒了，看见海面上什么都没有——没有灯，没有船，只有黑。我跑到窗户那儿，我叫了。可是叫有什么用。」',
                    '"The supply boat always came in November. They cancelled it — said the route was no longer used."\nHe kicks the empty box, gently, as one kicks a dead cat.\n"That night I drank a whole bottle. At two I woke and looked out and there was nothing on the water — no lamp, no boat, only black. I ran to the window. I shouted. But what is the use of shouting."',
                    '「補給船は十一月に来ることになっていた。取消だと言われた。航路は使っていない、と。」\n彼は空箱を軽く蹴る。死んだ猫を蹴るように。\n「あの夜、瓶を一本空けた。二時に目が覚めて、海を見た。何もない——灯も船もなく、ただの黒だ。窓へ走って、叫んだ。だが叫んで何になる。」'
                )),
                makeCharacter('holt', txt(
                    '「所以他们让你背了十一年。」\n「不是他们。」他抬起头，脸上有一种奇怪的平静。「是我自己。因为如果我说了，他们会问：那你为什么不点煤油灯？——因为我卖了。我把它卖了换酒。」\n他停了一下。「督察，一个错的人，扛一件对的事，是扛不住的。」',
                    '"So they let you carry it for eleven years."\n"Not they." He looks up, and there is a strange calm on his face. "I carried it myself. Because if I spoke they would ask: then why did you not light the oil lamp? — Because I sold it. Sold it for drink."\nHe pauses. "Inspector, the wrong person cannot carry the right thing. Not for long."',
                    '「では、彼らに十一年背負わされたのですね。」\n「彼らじゃない。」彼は顔を上げ、妙な静けさを浮かべる。「自分で背負った。もし話せば訊かれる。ならなぜ石油ランプを点けなかった、と。——売ったからだ。酒に替えた。」\n彼は一拍置く。「警視、間違った人間は正しいものを背負えない。長くは。」'
                ))
            ],
            playerReply: txt(
                '他不是无辜的。但他也不是唯一有罪的。在盐港，罪是按份分下去的，像分一条鱼。',
                'He is not innocent. But he is not the only one who is guilty. In Saltmere guilt is portioned out like a fish.',
                '彼は無実ではない。だが罪があるのが彼だけでもない。ソルトミアでは、罪は魚のように分けられる。'
            ),
            choices: [
                makeChoice(txt('📁 去市政厅——拿到那张签着 H. T. 的纸', '📁 Town hall — get the sheet signed H. T.', '📁 市庁舎へ——H. T. と署名された一枚を'),
                    'salt_ch3_archive', { salt_proof: 1, salt_ledger: 1 }, 'truth',
                    txt('我需要那张纸来证明：罪不只在他一个人身上。', 'I need that sheet to prove the guilt is not his alone.', 'その一枚が要る。罪が彼一人のものではないと証明するために。'), 'good'),
                makeChoice(txt('🧢 找卡勒姆——欧文在船上的最后一小时', '🧢 Find Callum — Owen\'s last hour aboard', '🧢 カラムへ——オーウェンの船上の最後の一時間'),
                    'salt_ch3_reay', { salt_proof: 1, salt_owen: 1 }, 'trust',
                    txt('有些话必须由一个姓雷伊的人说。', 'Some things must be said by someone named Reay.', 'ある言葉は、レイ姓の者が言わねばならない。'), 'good'),
                makeChoice(txt('⚖️ 收网。把他带回局里', '⚖️ Close the net. Take him in', '⚖️ 網を畳む。彼を署へ'),
                    'salt_ch3_closing', { salt_confession: 1 }, 'risk',
                    txt('我给他戴上手铐时，他没有反抗。', 'He does not resist when I cuff him.', '手錠をかけても彼は抵抗しない。'), 'neutral')
            ]
        },

        /* 卡勒姆 */
        salt_ch3_reay: {
            messages: [
                makeNarrator(txt(
                    '卡勒姆在警局后院的吸烟处，一根烟点了三次都没点着。\n他说：我告诉你的每一句都是真的。我只是从来不告诉你，我少说了哪几句。',
                    'Callum is in the yard behind the station. He tries three times to light a cigarette.\n"Everything I told you was true," he says. "I just never told you which parts I left out."',
                    'カラムは署の裏庭の喫煙所にいる。三度試して、まだ煙草に火がつかない。\n「言ったことは全部本当です。ただ、何を省いたかは一度も言わなかった。」'
                )),
                makeCharacter('reay', txt(
                    '「欧文不是船员。他是索恩航运那晚派去『检查灯塔』的维修工。公司后来报告里把他写成了搭便船的人——因为维修工出事，公司要赔三倍。」\n「所以他的名字不在报告里。」\n「他的名字在附件七。附件七没有电子版。纸质的那份，在庄园。」',
                    '"Owen was not crew. He was the maintenance man Thorne Shipping sent out that night to inspect the lamp. In the company report they wrote him down as a man hitching a ride — because if a maintenance man dies, the company pays three times over."\n"So his name is not in the report."\n"His name is in Annex Seven. Annex Seven was never digitised. The paper copy is at the Hall."',
                    '「オーウェンは乗組員じゃない。あの夜ソーン海運が『灯台を点検に』派遣した補修員だ。会社の報告書には、便乗者として書かれた——補修員が死ねば、会社の支払いは三倍になる。」\n「だから報告書に名前がない。」\n「名前は附属資料七にある。七だけ電子化されていない。紙の原本は館にある。」'
                )),
                makeCharacter('holt', txt(
                    '「你早知道。」\n「我这十一年每天都在知道。」他把烟折断了。「督察，我加入警队不是为了查这个。我是为了有一天能合法地打开那只柜子。」\n他终于看着我。「现在你能打开了。别因为我，就慢下来。」',
                    '"You knew."\n"I have known every day for eleven years." He snaps the cigarette in half. "Ma\'am, I did not join the police to investigate this. I joined so that one day I could open that cabinet legally."\nAt last he looks at me. "Now you can open it. Do not slow down on my account."',
                    '「前から知っていたのね。」\n「十一年、毎日知っていた。」彼は煙草を折る。「警視、私はこれを調べるために警察に入ったんじゃない。いつか合法的にあの棚を開けるために入った。」\n彼はようやく私を見る。「あなたなら開けられる。私のために足を止めないで。」'
                ))
            ],
            playerReply: txt(
                '在盐港，最深的那种忠诚，长得很像背叛。',
                'In Saltmere, the deepest kind of loyalty looks exactly like betrayal.',
                'ソルトミアでは、最も深い忠誠は裏切りと瓜二つの顔をしている。'
            ),
            choices: [
                makeChoice(txt('📁 去市政厅拿维修记录', '📁 Town hall — the maintenance record', '📁 市庁舎で補修記録を'),
                    'salt_ch3_archive', { salt_proof: 1, salt_ledger: 1 }, 'truth',
                    txt('附件七之前，我得先有前面那张纸。', 'Before Annex Seven I need the sheet that comes before it.', '附属資料七の前に、先の一枚が要る。'), 'neutral'),
                makeChoice(txt('⚓ 去灯塔', '⚓ The lighthouse', '⚓ 灯台へ'),
                    'salt_ch3_lighthouse', { salt_proof: 1, salt_confession: 1 }, 'empathy',
                    txt('我想亲耳听那句"我卖了它"。', 'I want to hear him say "I sold it" with my own ears.', '「売った」という一言をこの耳で聞きたい。'), 'good'),
                makeChoice(txt('⚖️ 收网', '⚖️ Close the net', '⚖️ 網を畳む'),
                    'salt_ch3_closing', {}, 'risk',
                    txt('证据够了。剩下的交给法庭。', 'There is enough. The rest belongs to a court.', '証拠は足りる。あとは法廷に任せる。'), 'neutral')
            ]
        },

        /* 章末过渡 */
        salt_ch3_closing: {
            messages: [
                makeNarrator(txt(
                    '夜里九点，风从东北来，海面翻起来像有人在下面推。\n气象台说，这是盐港十年来最高的潮。渔民们叫它"清洗潮"——它来的时候，会把码头上所有的旧东西一起带走。',
                    'At nine the wind comes from the north-east and the sea turns over as if something beneath it is pushing.\nThe Met Office calls it the highest tide in Saltmere for ten years. The fishermen call it the Cleaning Tide — when it comes it takes every old thing on the quay with it.',
                    '夜九時、風は北東から。海は下から誰かが押すように盛り上がる。\n気象台は十年で最高の潮と言う。漁師たちは「洗い潮」と呼ぶ——来るとき、岸壁の古い物を全部持っていく。'
                )),
                makeCharacter('holt', txt(
                    '「今晚所有人都在海边。灯塔、庄园、码头——我只能在一个地方。」',
                    '"Tonight everyone will be at the water. The lighthouse, the Hall, the quay — I can only be in one of them."',
                    '「今夜、皆が海辺にいる。灯台、館、埠頭——私は一箇所にしか行けない。」'
                )),
                makeCharacter('reay', txt(
                    '卡勒姆把车钥匙递给我，又收回去。「督察，无论你选哪里，我都在你后面。」',
                    'Callum holds out the car keys, then takes them back. "Ma\'am, wherever you choose, I will be behind you."',
                    'カラムは車の鍵を差し出し、また引っ込める。「警視、どこを選んでも私は後ろにいます。」'
                )),
                makeCharacter('holt', txt(
                    '「不。」我说。「今晚我要你去你哥哥该在的地方。」',
                    '"No," I say. "Tonight I want you where your brother should have been."',
                    '「いいえ」と私は言う。「今夜は、兄がいるべきだった場所に行って。」'
                ))
            ],
            isTransition: true,
            nextChapter: 'salt_ch4'
        }
    },
    startScene: 'salt_ch3_hub'
};

/* ========== 第四章：涨潮 ========== */
var salt_ch4 = {
    id: 'salt_ch4',
    titleKey: 'saltCh4Title',
    subtitleKey: 'saltCh4Sub',
    narrator: txt(
        '清洗潮。盐港十年来最高的一次。\n这样的夜里，全镇的人都会站在崖上看海——因为看海的时候，就不用看彼此。',
        'The Cleaning Tide. The highest in Saltmere for ten years.\nOn a night like this everyone in town stands on the cliff to watch the sea, because while you are watching the sea you do not have to look at each other.',
        '洗い潮。ソルトミアで十年ぶりの高さ。\nこんな夜、町中の者が崖に立って海を見る——海を見ていれば、互いを見なくて済むからだ。'
    ),
    scenes: {
        salt_ch4_start: {
            messages: [
                makeNarrator(txt(
                    '十点四十分。雨水横着走，路灯被风压弯。\n卡勒姆在码头，海丝特在庄园，马丁·凯德在灯塔。三个人，三盏灯——今晚我只能走到其中一盏下面。',
                    'Ten forty. The rain travels sideways and the streetlamps are bent by the wind.\nCallum is at the quay, Hester at the Hall, Martin Cade at the lighthouse. Three people, three lamps — tonight I can stand beneath only one of them.',
                    '二十二時四十分。雨は横に走り、街灯は風に曲がっている。\nカラムは埠頭、ヘスターは館、マーティン・ケイドは灯台。三人、三つの灯——今夜私が下に立てるのはその一つだけ。'
                )),
                makeCharacter('holt', txt(
                    '「在海里，淹死的人不是被水杀死的。」\n「是被所有人一起按住的。」\n这句话是艾米笔记本上倒数第二行写的。她写的时候，大概已经知道自己回不去了。',
                    '"At sea a drowning person is not killed by the water."\n"They are held down by everyone at once."\nThat is the second-to-last line in Amy\'s notebook. When she wrote it she probably already knew she was not going back.',
                    '「海で溺れる者は、水に殺されるのではない。」\n「皆で一斉に押さえつけられるのだ。」\nエイミーの手帳の最後から二行目。彼女はこれを書いたとき、もう戻れないと知っていたのだろう。'
                ))
            ],
            playerReply: txt(
                '我这一生只被下放过一次。今晚是我第二次选择去哪里。',
                'I have been sent away once in my life. Tonight is the second time I choose where to go.',
                '私の人生で左遷は一度だけ。今夜は二度目の、自分で選ぶ配置だ。'
            ),
            choices: [
                makeChoice(txt('⚓ 去灯塔——让凯德在灯下自己说完', '⚓ The lighthouse — let Cade finish under the lamp', '⚓ 灯台へ——灯の下でケイドに言わせる'),
                    'salt_ch4_perfect', {}, 'empathy',
                    txt('我去找那个扛了十一年的人。', 'I go to the man who carried it for eleven years.', '十一年背負った男のもとへ。'), 'good',
                    { variable: 'salt_proof', operator: '>=', value: 2 }),
                makeChoice(txt('👑 去庄园——把纸放在海丝特面前', '👑 The Hall — lay the sheet in front of Hester', '👑 館へ——紙をヘスターの前に置く'),
                    'salt_ch4_good', {}, 'truth',
                    txt('我去找那个签了字的人。', 'I go to the woman who signed it.', '署名した女のもとへ。'), 'neutral'),
                makeChoice(txt('🐦 把它全部交给伦敦——让盐港再也藏不住', '🐦 Send everything to London — let Saltmere never hide again', '🐦 すべてをロンドンへ——ソルトミアをもう隠せないように'),
                    'salt_ch4_hidden', {}, 'risk',
                    txt('我按下发送键，外面正在涨潮。', 'I press send while the tide comes in outside.', '私は送信を押す。外では潮が満ちていく。'), 'risk',
                    { variable: 'salt_proof', operator: '>=', value: 2 }),
                makeChoice(txt('🌫️ 结案为意外溺亡——让这个镇子继续活下去', '🌫️ Close it as accidental drowning — let the town go on living', '🌫️ 事故死として処理する——この町に生き続けさせる'),
                    'salt_ch4_bad', {}, 'caution',
                    txt('我在报告上写下"天气"两个字。', 'I write the word "weather" on the report.', '私は報告書に「天候」と書く。'), 'bad')
            ]
        },

        /* 完美结局 */
        salt_ch4_perfect: {
            messages: [
                makeNarrator(txt(
                    '灯塔的门被风推开。马丁·凯德站在那盏不亮的灯下面，手里拿着一罐煤油——他买了一罐，今晚。\n「晚了十一年。」他说。',
                    'The wind pushes open the lighthouse door. Martin Cade stands beneath the dead lamp holding a tin of paraffin — he bought one, tonight.\n"Eleven years late," he says.',
                    '風が灯台の扉を押し開ける。マーティン・ケイドは灯らない灯の下に立ち、灯油の缶を手にしている——今夜買った一缶。\n「十一年遅い」と彼は言う。'
                )),
                makeCharacter('cade', txt(
                    '「她三天前来问我，我说我不记得了。第二天我又说，你走吧，别问了。」\n「前天晚上她又来了，带着那个小录音机。她说：凯德先生，我不是来怪你的，我是来把名字还给人家的。」\n他跪下去。「我没推她。可我把她推出去了——用一句『别问了』。」',
                    '"She came three days ago and asked, and I said I did not remember. The next day I said go away, stop asking."\n"Two nights ago she came back with that little recorder. She said: Mr Cade, I am not here to blame you, I am here to give the names back to the people they belong to."\nHe sinks to his knees. "I did not push her. But I pushed her out — with the words stop asking."',
                    '「三日前、彼女が訊きに来た。覚えていないと言った。次の日、もう行け、訊くなと言った。」\n「一昨夜また来た。あの小さなレコーダーを持って。こう言った。ケイドさん、責めに来たんじゃない。名前を、持ち主に返しに来たんです、と。」\n彼は膝をつく。「押していない。だが押し出した——『訊くな』の一言で。」'
                )),
                makeCharacter('holt', txt(
                    '「她去了防波堤。她要在涨潮前把录音交给谁？」',
                    '"She went to the breakwater. She wanted to hand the recording to someone before the tide. To whom?"',
                    '「彼女は防波堤へ行った。潮が満ちる前に録音を誰に渡すつもりだった？」'
                )),
                makeCharacter('reay', txt(
                    '「给我哥哥的弟弟。」门口有人说话。卡勒姆站在雨里，全身湿透，手里拿着一只从海里捞上来的防水袋。\n「她约了我。她想把最后一段给我。我没赶上——我迟了四十分钟。」',
                    '"To my brother\'s little brother." Someone speaks from the door. Callum stands in the rain, soaked through, holding a waterproof pouch pulled out of the sea.\n"She arranged to meet me. She wanted to give me the last part. I did not make it — I was forty minutes late."',
                    '「兄の弟に。」扉口で誰かが言う。カラムが雨の中に立っている。ずぶ濡れで、海から引き上げた防水袋を手に。\n「彼女は私と待ち合わせていた。最後の一部を私に、と。間に合わなかった——四十分遅れた。」'
                )),
                makeNarrator(txt(
                    '第二天上午，海丝特·索恩夫人在律师陪同下来到警局。她只说了一句话：\n「那四千二百英镑，是我签的。」\n朱利安·索恩在当天下午退出了选举。索恩航运的三艘船被扣押在纽卡斯尔港。附件七被公开，欧文·雷伊的名字第一次出现在一份官方文件里。\n盐港下了两天雨。第三天，有人在防波堤第七根柱子下面放了一束花，还有一支点亮的小蜡烛——这镇子十年没在海边点过灯。',
                    'The next morning Lady Hester Thorne comes to the station with her lawyer. She says one sentence only:\n"I signed the four thousand two hundred."\nJulian Thorne withdraws from the election that afternoon. Three Thorne Shipping vessels are detained at Newcastle. Annex Seven is published, and Owen Reay\'s name appears in an official document for the first time.\nIt rains in Saltmere for two days. On the third, someone leaves flowers at the seventh pillar of the breakwater, with a small lit candle — this town has not lit a light by the sea in ten years.',
                    '翌朝、ヘスター・ソーン夫人が弁護士同伴で署に来る。彼女は一言だけ言った。\n「あの四千二百ポンドに署名したのは私です。」\nジュリアン・ソーンはその日の午後に選挙から撤退。ソーン海運の三隻がニューカッスル港で差し押さえられた。附属資料七が公開され、オーウェン・レイの名前が初めて公文書に載った。\nソルトミアは二日雨だった。三日目、誰かが防波堤七番柱の下に花束と、灯した小さな蝋燭を置いた——この町は十年、海辺で灯を点けていなかった。'
                ))
            ],
            isEnding: true, endingId: 'perfect_salt', endingTitleKey: 'saltEndingPerfectTitle', endingDescKey: 'saltEndingPerfectDesc', endingIcon: '🕯️'
        },

        /* 好结局 */
        salt_ch4_good: {
            messages: [
                makeNarrator(txt(
                    '庄园的灯全亮着，像一艘不肯沉的船。海丝特·索恩坐在长桌尽头，桌上什么都没有——连茶都没有。',
                    'Every light in the Hall is on, like a ship refusing to sink. Lady Hester sits at the end of the long table with nothing on it — not even tea.',
                    '館の灯は全部点いている。沈むことを拒む船のようだ。ヘスター・ソーンは長卓の端に座っている。卓の上には何もない——お茶さえ。'
                )),
                makeCharacter('hester', txt(
                    '「你把那张纸放下，然后呢？督察，你想让我说什么？」\n「说你为什么签。」\n「因为那年冬天，公司账上只剩四千二百英镑。要么给灯塔加油，要么给两百个工人发工资。」\n她终于抬起眼睛。「我选了活人。十一年后，死了五个。这就是我犯的那一种错——每一步都对，最后全错。」',
                    '"You put down that sheet, and then what? Inspector, what do you want me to say?"\n"Why you signed it."\n"Because that winter there were four thousand two hundred pounds left in the company account. Either the lighthouse got its fuel, or two hundred men got their wages."\nAt last she raises her eyes. "I chose the living. Eleven years later, five were dead. That is the kind of mistake I make — every step correct, and all of it wrong."',
                    '「その紙を置いて、それから？ 警視、私に何を言わせたい？」\n「なぜ署名したか。」\n「あの冬、会社の口座には四千二百ポンドしかなかった。灯台に燃料を、か。二百人の労働者に賃金を、か。」\n彼女はようやく目を上げる。「生きている方を選んだ。十一年後、五人が死んだ。私が犯す過ちはこういう種類だ——一歩一歩は正しく、最後に全部間違う。」'
                )),
                makeCharacter('holt', txt(
                    '「马丁·凯德今晚在灯塔。他已经说了那句『我卖了它』。夫人，他一个人扛不住了。」',
                    '"Martin Cade is at the lighthouse tonight. He has already said the words I sold it. Lady Thorne, he cannot carry it alone any more."',
                    '「マーティン・ケイドは今夜灯台にいます。彼はもう『売った』と言った。夫人、彼は一人ではもう背負えない。」'
                )),
                makeCharacter('hester', txt(
                    '她沉默了很久，然后按铃叫管家：「把附件七拿出来。它在图书室第三个抽屉，锁是坏的。」',
                    'She is silent a long time, then rings for the housekeeper: "Bring Annex Seven. Third drawer in the library. The lock is broken."',
                    '長い沈黙の後、彼女はベルを鳴らして家政婦を呼ぶ。「附属資料七を。書斎の三番目の引き出し。錠は壊れている。」'
                )),
                makeCharacter('holt', txt(
                    '「您早就可以拿出来。」',
                    '"You could have produced it years ago."',
                    '「ずっと前に出せたはずです。」'
                )),
                makeCharacter('hester', txt(
                    '「是啊。」她说。「可是拿出来的人要付代价。我一直在让别人付。」',
                    '"Yes," she says. "But the person who produces it pays the price. I have been letting other people pay."',
                    '「ええ」と彼女。「だが出した者が代償を払う。私はずっと他人に払わせてきた。」'
                )),
                makeNarrator(txt(
                    '马丁·凯德以过失致人死亡被起诉，庭审时他只求一件事：把五个名字念一遍。\n索恩航运被判罚款与民事赔偿，但公司保住了；朱利安·索恩以微弱优势赢得了选举。\n海丝特·索恩在第二年春天卖掉了庄园，搬去了诺福克。她走的那天，镇上没有人去送。\n盐港重新给灯塔加了油。守灯的人换了一个年轻的姑娘——她每晚准时点灯，从不喝酒。',
                    'Martin Cade is charged with causing death by negligence. At trial he asks for one thing only: to read the five names aloud.\nThorne Shipping is fined and ordered to pay damages, but the company survives; Julian Thorne wins his election by a narrow margin.\nLady Hester sells the Hall the following spring and moves to Norfolk. Nobody in town comes to see her off.\nSaltmere resumes fuel deliveries to the lighthouse. The new keeper is a young woman who lights the lamp on time every night and never drinks.',
                    'マーティン・ケイドは過失致死で起訴された。公判で彼が願ったのは一つだけ。五つの名前を読み上げること。\nソーン海運には罰金と民事賠償が命じられたが、会社は残った。ジュリアン・ソーンは僅差で選挙に勝つ。\nヘスター・ソーンは翌春、館を売ってノーフォークへ移った。町の誰も見送りに来なかった。\nソルトミアは灯台への燃料補給を再開した。新しい灯台守は若い女性——毎晩時間通りに灯を点け、決して酒を飲まない。'
                ))
            ],
            isEnding: true, endingId: 'good_salt', endingTitleKey: 'saltEndingGoodTitle', endingDescKey: 'saltEndingGoodDesc', endingIcon: '🌅'
        },

        /* 隐藏结局 */
        salt_ch4_hidden: {
            messages: [
                makeNarrator(txt(
                    '凌晨一点，我把四样东西扫描进了伦敦的编辑部：维修凭证、附件七的封面、艾米笔记本的照片、还有凯德那段录音。\n我附了一句话：「请署我的名字。也署她的。」',
                    'At one in the morning I scan four things to the newsroom in London: the maintenance voucher, the cover of Annex Seven, photographs of Amy\'s notebook, and Cade\'s recording.\nI add one line: "Please print my name. Print hers too."',
                    '午前一時、私は四つをロンドンの編集部へスキャンした。補修伝票、附属資料七の表紙、エイミーの手帳の写真、そしてケイドの録音。\n一文添えた。「私の名前を載せてください。彼女のも。」'
                )),
                makeCharacter('hester', txt(
                    '「你知道你在做什么吗？」电话里她的声音很轻，像在念一张菜单。\n「知道。我在把盐港从地图上拿下来，重新画一遍。」\n「他们会恨你。」\n「他们已经恨过我母亲了。这是继承。」',
                    '"Do you know what you are doing?" On the telephone her voice is very light, as if reading a menu.\n"Yes. I am taking Saltmere off the map and drawing it again."\n"They will hate you."\n"They already hated my mother. This is an inheritance."',
                    '「何をしているか分かっているの？」電話の向こうで彼女の声はとても軽い。メニューを読むようだ。\n「ええ。ソルトミアを地図から外して、描き直しているの。」\n「皆があなたを憎む。」\n「母はもう憎まれた。これは相続です。」'
                )),
                makeNarrator(txt(
                    '报道在三天后见报：《一个小镇的十一年》。\n盐港的码头被吊销执照，索恩航运进入破产程序，四名现任议员辞职，两名被起诉。海丝特·索恩没有等到审判——她在那年冬天去世，讣告只有两行。\n而我：被调回伦敦，档案上写着"不宜在涉案地区任职"。\n两个月后，我收到一个没有署名的包裹。里面是一本旧笔记本，扉页写着艾米的名字，还有一张字条：\n「督察，谢谢你把名字还给了我们。——欧文的弟弟」\n窗外是伦敦的雨。伦敦的雨和盐港的雨是同一种，只是没有人站在崖上看。',
                    'The story runs three days later: Eleven Years in a Small Town.\nSaltmere\'s dock licence is revoked, Thorne Shipping enters administration, four sitting councillors resign and two are charged. Lady Hester does not live to see the trial — she dies that winter, and her obituary is two lines long.\nAs for me: transferred back to London, my file noting "unsuitable for service in the area concerned".\nTwo months later a parcel arrives without a return address. Inside is an old notebook with Amy\'s name on the flyleaf, and a note:\n"Inspector — thank you for giving the names back. — Owen\'s brother."\nOutside, London rain. London rain is the same rain as Saltmere\'s, only nobody stands on a cliff to watch it.',
                    '記事は三日後に掲載された。『ある小さな町の十一年』。\nソルトミアの埠頭免許は剥奪、ソーン海運は破産手続きへ、現職議員四名が辞職、二名が起訴された。ヘスター・ソーンは公判を待たず、その冬に亡くなった。訃報は二行だけ。\nそして私はロンドンへ戻された。記録には「当該地域での勤務不適」とある。\n二ヶ月後、差出人不明の小包が届いた。中は古い手帳。扉にエイミーの名前。そして一枚のメモ。\n「警視、名前を返してくれてありがとう。——オーウェンの弟より」\n窓の外はロンドンの雨。ロンドンの雨もソルトミアの雨も同じ雨だ。ただ、崖に立って見る者がいないだけ。'
                ))
            ],
            isEnding: true, endingId: 'hidden_salt', endingTitleKey: 'saltEndingHiddenTitle', endingDescKey: 'saltEndingHiddenDesc', endingIcon: '📰'
        },

        /* 坏结局 */
        salt_ch4_bad: {
            messages: [
                makeNarrator(txt(
                    '我在报告上写下：死者艾米·巴克，酒后在湿滑的防波堤上失足，落水溺亡。\n写下"天气"两个字的时候，我的手很稳。这是最可怕的地方。',
                    'I write on the report: the deceased, Amy Barker, having consumed alcohol, lost her footing on the wet breakwater and drowned.\nMy hand is steady when I write the word "weather". That is the worst part.',
                    '私は報告書に書く。死者エイミー・バーカー、飲酒の上、濡れた防波堤で足を滑らせ落水、溺死。\n「天候」の二文字を書くとき、私の手は震えなかった。そこが一番恐ろしい。'
                )),
                makeCharacter('reay', txt(
                    '「督察。」他把警徽放在我桌上，放在那张报告上面。\n「我做了十一年警察，为了打开一只柜子。今天柜子开着，你让我关上。」\n他走到门口又回头：「我哥哥游泳比谁都好。这句话我说了三遍了。以后没人会说第四遍。」',
                    '"Ma\'am." He lays his warrant card on my desk, on top of the report.\n"I was a policeman for eleven years so I could open one cabinet. Today the cabinet stands open and you ask me to shut it."\nAt the door he turns back: "My brother could swim better than any of us. That is the third time I have said it. Nobody will say it a fourth."',
                    '「警視。」彼は私の机に手帳を置く。その報告書の上に。\n「私は十一年警察官をした。棚を一つ開けるためだ。今日その棚は開いている。あなたは閉めろと言う。」\n扉口で彼は振り返る。「兄は誰より泳ぎが上手かった。これで三度目だ。四度目は誰も言わない。」'
                )),
                makeNarrator(txt(
                    '一周后，索恩航运拿到了码头四十年的经营权。剪彩那天，海丝特·索恩站在台上说了句：盐港终于翻过了一页。\n马丁·凯德把灯塔的钥匙交回了市政厅，搬去了纽卡斯尔他妹妹家。走之前他给灯塔上了最后一次油——虽然它已经很多年不亮了。\n我在盐港又待了四个月，然后调回伦敦，升了一级。\n只是从那以后，我每次闻到海水的味道，都会想起那个凌晨四点：狗不肯走，凯德举着马灯，而我明明看见沙上有第二组脚印，却选择了不去读它。',
                    'A week later Thorne Shipping is awarded a forty-year lease on the docks. At the ribbon-cutting Lady Hester says from the platform: at last Saltmere has turned the page.\nMartin Cade hands the lighthouse key back to the town hall and moves to his sister\'s in Newcastle. Before he goes he oils the lamp one last time — though it has not been lit for years.\nI stay in Saltmere four more months, then transfer back to London with a promotion.\nBut after that, every time I smell the sea I remember four in the morning: the dog refusing to move, Cade holding up his lantern, and myself seeing a second set of prints in the sand and choosing not to read them.',
                    '一週間後、ソーン海運は埠頭の四十年の営業権を得た。テープカットの日、ヘスター・ソーンは壇上で言った。ソルトミアはようやく頁をめくった、と。\nマーティン・ケイドは灯台の鍵を市庁舎に返し、ニューカッスルの妹の家へ移った。去る前、彼は灯に最後の油を差した——何年も灯っていないのに。\n私はさらに四ヶ月ソルトミアにいて、ロンドンへ戻り、一階級上がった。\nだがそれ以来、海の匂いをかぐたびに、あの午前四時を思い出す。犬が動かない。ケイドがランタンを掲げる。そして砂の上の二組目の足跡を私は確かに見ていたのに、読まないことを選んだ自分を。'
                ))
            ],
            isEnding: true, endingId: 'bad_salt', endingTitleKey: 'saltEndingBadTitle', endingDescKey: 'saltEndingBadDesc', endingIcon: '🌫️'
        }
    },
    startScene: 'salt_ch4_start'
};

window.STORY_CHAPTERS.push(salt_ch1, salt_ch2, salt_ch3, salt_ch4);

if (window.CHARACTERS) {
    Object.assign(window.CHARACTERS, {
        holt: character_holt,
        reay: character_reay,
        hester: character_hester,
        julian: character_julian,
        cade: character_cade,
        amy: character_amy
    });
}
