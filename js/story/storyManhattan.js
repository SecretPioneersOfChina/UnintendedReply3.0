/**
 * storyManhattan.js - 曼哈顿午夜 (man_ch1-4)
 * 美剧式高强度：一小时一章、每章结尾留钩子、权力游戏 + 灰色人物 + 四结局
 *
 * 风格参考（仅节奏，不含任何既有作品的角色/文本）：
 * 凌晨的城市、永远在响的手机、每一集最后三十秒的反转。
 */
var character_reyes    = { id: 'reyes',    nameKey: 'manCharReyes',    color: '#38bdf8', avatar: '⚖️', description: '助理联邦检察官玛雅·雷耶斯，南区联邦检察官办公室' };
var character_cole     = { id: 'cole',     nameKey: 'manCharCole',     color: '#f59e0b', avatar: '🕶️', description: 'FBI 特别探员戴恩·科尔，你的搭档，话很密' };
var character_halloway = { id: 'halloway', nameKey: 'manCharHalloway', color: '#a78bfa', avatar: '🏛️', description: '联邦法官艾达·哈洛威，三十一年法袍，从不参加派对' };
var character_stern    = { id: 'stern',    nameKey: 'manCharStern',    color: '#ef4444', avatar: '💼', description: '诺兰·斯特恩，全州最大的地产与基建商，正在竞选市长' };
var character_bluebird = { id: 'bluebird', nameKey: 'manCharBluebird', color: '#22d3ee', avatar: '🐦', description: '「蓝鸟」，只肯在加密频道里说话的匿名线人' };

/* ========== 第一章：第一份情报（00:07） ========== */
var man_ch1 = {
    id: 'man_ch1',
    titleKey: 'manCh1Title',
    subtitleKey: 'manCh1Sub',
    narrator: txt(
        '纽约，凌晨零点零七分。\n这座城市有一句老话：白天属于律师，凌晨属于知道真相的人。',
        'New York. Twelve oh-seven in the morning.\nThere is an old line about this city: the day belongs to lawyers, the small hours belong to people who know what happened.',
        'ニューヨーク、午前零時七分。\nこの街には古い言葉がある。昼は弁護士のもの、深夜は真実を知る者のもの。'
    ),
    scenes: {
        man_ch1_start: {
            messages: [
                makeNarrator(txt(
                    '四十分钟前，我输掉了今年最重要的一场官司。法官说证据"来源不清"，被告走出法庭的时候朝我笑了一下——那种笑的意思是：下次你也抓不到我。\n我叫玛雅·雷耶斯。三十一岁。南区联邦检察官办公室。我的胜率是 71%，今天变成 70%。',
                    'Forty minutes ago I lost the most important case of my year. The judge called the evidence "of uncertain provenance", and as the defendant walked out he gave me a small smile — the kind that means: you will not catch me next time either.\nMy name is Maya Reyes. Thirty-one. Southern District of New York. My conviction rate was seventy-one per cent. Today it is seventy.',
                    '四十分前、私は今年一番大事な裁判に負けた。裁判官は証拠を「出自不明」と呼び、被告は法廷を出るとき小さく笑った——次も捕まらない、という笑いだ。\n私の名はマヤ・レイエス。三十一歳。ニューヨーク南地区連邦検事局。有罪率は71パーセントだった。今日から70パーセント。'
                )),
                makeSystem(txt(
                    '🔐 加密消息 · 未知发送者 · 阅后即焚（5 分钟）\n「雷耶斯检察官。哈德逊码头 14 号仓库，市政爆破令，05:00 执行。\n里面有一具尸体和一份名单。你有四小时五十三分钟。\n——蓝鸟」\n附件：一张照片。水泥地上的一只手，手腕上戴着我父亲的表。',
                    '🔐 Encrypted message · unknown sender · burns in 5:00\n"AUSA Reyes. Hudson Pier, Warehouse 14. City demolition order, 05:00.\nInside: a body and a list. You have four hours and fifty-three minutes.\n— Bluebird."\nAttachment: one photograph. A hand on concrete. On the wrist, my father\'s watch.',
                    '🔐 暗号化メッセージ・送信者不明・5分で消滅\n「レイエス検事。ハドソン埠頭14号倉庫、市の爆破命令、05:00執行。\n中には遺体と名簿。残り四時間五十三分。\n――ブルーバード」\n添付：写真一枚。コンクリートの上の手。手首に、父の時計。'
                )),
                makeCharacter('reyes', txt(
                    '「我父亲的表在他下葬那天就摘下来了。」我对着空无一人的办公室说。\n「所以这张照片要么是假的，要么——」\n手机又震了一次。倒计时开始走：04:52:11。',
                    '"My father\'s watch came off his wrist the day we buried him." I say it to an empty office.\n"So this photograph is either fake, or—"\nThe phone vibrates once more. A counter starts running: 04:52:11.',
                    '「父の時計は埋葬の日に外された。」誰もいないオフィスに向かって私は言う。\n「つまりこの写真は偽物か、さもなければ――」\n電話がもう一度震えた。カウントが動き出す。04:52:11。'
                ))
            ],
            playerReply: txt(
                '在纽约，凌晨收到的消息只有两种：一种是你想听的，一种是真的。',
                'In New York there are only two kinds of message that arrive after midnight: the kind you want to hear, and the kind that is true.',
                'ニューヨークで深夜に届く知らせは二種類だけ。聞きたいものと、本当のもの。'
            ),
            choices: [
                makeChoice(txt('🚗 现在就去码头——四小时不够我走程序', '🚗 Go to the pier now — four hours is not enough for paperwork', '🚗 いますぐ埠頭へ——四時間じゃ手続きを踏む余裕はない'),
                    'man_ch1_pier', { man_evidence: 1 }, 'risk',
                    txt('我抓起外套，没关电脑。', 'I grab my coat and leave the computer running.', '私はコートを掴み、PCは消さなかった。'), 'neutral'),
                makeChoice(txt('🕶️ 先叫上科尔——FBI 有枪，我没有', '🕶️ Call Cole first — the FBI has guns, I have a badge', '🕶️ まずコールを呼ぶ——FBIには銃がある、私にはバッジしかない'),
                    'man_ch1_cole', { man_cole: 1 }, 'trust',
                    txt('凌晨零点十一分，我知道他一定还没睡。', 'At twelve-eleven I know he will still be awake.', '零時十一分。彼はまだ起きているはずだ。'), 'neutral'),
                makeChoice(txt('💻 先查"蓝鸟"——匿名的人最危险', '💻 Trace Bluebird first — anonymous people are the most dangerous', '💻 まずブルーバードを追う——匿名の者が一番危険'),
                    'man_ch1_trace', { man_evidence: 1, man_bluebird: 1 }, 'truth',
                    txt('我打开那台从不联网的笔记本。', 'I open the laptop that never touches a network.', 'ネットに繋がないノートPCを開く。'), 'good')
            ]
        },

        /* 科尔登场 */
        man_ch1_cole: {
            messages: [
                makeNarrator(txt(
                    '戴恩·科尔在唐人街一家二十四小时的面馆里等我，面前放着一碗没动过的面。\n他做卧底六年，养成了两个习惯：背靠墙坐，和人说话时不看眼睛。',
                    'Dane Cole waits for me in a twenty-four-hour noodle shop in Chinatown, an untouched bowl in front of him.\nSix years undercover left him with two habits: he sits with his back to the wall, and he does not look at your eyes when he talks.',
                    'デイン・コールはチャイナタウンの二十四時間営業の麺店で待っていた。手つかずの一杯が前にある。\n六年の潜入が彼に二つの癖を残した。壁に背を預けて座ることと、話すとき相手の目を見ないこと。'
                )),
                makeCharacter('cole', txt(
                    '「哈德逊码头十四号。斯特恩集团去年秋天买下的，账上写的是『仓储』。」他掰着手指。「爆破令是市政厅签的，签字的人上周退休去了佛罗里达。」\n他终于看我一眼。「玛雅，你父亲叫哈维尔·雷耶斯。」\n「我知道我父亲叫什么。」\n「他也给斯特恩做过账。」',
                    '"Hudson Pier, number fourteen. Stern Group bought it last autumn, booked as warehousing." He counts on his fingers. "The demolition order came from City Hall, signed by a man who retired to Florida last week."\nHe finally looks at me. "Maya, your father was Javier Reyes."\n"I know my father\'s name."\n"He kept Stern\'s books too."',
                    '「ハドソン埠頭14号。スターン・グループが去年の秋に買った。帳簿上は倉庫。」彼は指を折る。「爆破命令は市庁舎。署名した男は先週フロリダへ退職した。」\n彼はようやく私を見る。「マヤ、君の父はハビエル・レイエス。」\n「父の名は知ってる。」\n「彼もスターンの帳簿を見ていた。」'
                )),
                makeCharacter('reyes', txt(
                    '「说下去。」\n「二〇一三年他从斯特恩大厦二十二层跳下去。尸检报告写『无他杀迹象』。我查过那份报告——」他停了一下。「我查过。不是官方渠道。」\n面馆的电视在放凌晨新闻，音量关着。屏幕上出现一张脸：诺兰·斯特恩，正在宣布参选市长。',
                    '"Go on."\n"In 2013 he walked out of the twenty-second floor of Stern Tower. The autopsy said no evidence of homicide. I read that report —" he stops. "I read it. Not through official channels."\nThe noodle shop television is showing the late news with the sound off. A face fills the screen: Nolan Stern, announcing he is running for mayor.',
                    '「続けて。」\n「2013年、彼はスターン・タワー22階から飛び降りた。検死報告は『他殺の形跡なし』。私はあの報告を読んだ――」彼は一拍置く。「読んだ。公式のルートじゃない。」\n麺店のテレビは深夜のニュース。音は消えている。画面に顔が映る。ノーラン・スターン、市長選出馬を表明中。'
                ))
            ],
            playerReply: txt(
                '科尔说"我查过"的时候，用的是过去式。卧底六年的人不会随便用过去式。',
                'When Cole said "I read it", he used the past tense. A man who spent six years undercover does not use the past tense by accident.',
                'コールが「読んだ」と言ったとき、過去形だった。六年潜入した男が過去形を間違っては使わない。'
            ),
            choices: [
                makeChoice(txt('🚗 出发去码头——车里再说', '🚗 Head for the pier — talk in the car', '🚗 埠頭へ出発——続きは車で'),
                    'man_ch1_pier', { man_evidence: 1 }, 'risk',
                    txt('他把面钱压在碗底下，跟着我出门。', 'He weighs the bowl down with cash and follows me out.', '彼は代金を丼の下に挟み、私について出る。'), 'neutral'),
                makeChoice(txt('💻 查"蓝鸟"——先知道是谁在替我计时', '💻 Trace Bluebird first — know who is keeping time for me', '💻 ブルーバードを追う——誰が私の時を刻んでいるか'),
                    'man_ch1_trace', { man_evidence: 1, man_bluebird: 1 }, 'truth',
                    txt('我需要知道发信人在哪栋楼里。', 'I need to know which building the sender is sitting in.', '送信者がどのビルにいるか知る必要がある。'), 'good'),
                makeChoice(txt('🍜 继续坐着——问他为什么知道我父亲', '🍜 Stay seated — ask why he knows about my father', '🍜 座ったまま訊く。なぜ父のことを知っている'),
                    'man_ch1_closing', { man_cole: 1 }, 'empathy',
                    txt('有些问题必须在面凉之前问完。', 'Some questions have to be asked before the noodles go cold.', '麺が冷める前に訊かねばならない質問がある。'), 'good')
            ]
        },

        /* 追查蓝鸟 */
        man_ch1_trace: {
            messages: [
                makeNarrator(txt(
                    '加密链路的元数据像一串 footprints：三次跳板，最后落在一栋写字楼的公共 WiFi——斯特恩集团总部，三十六层。\n发信时间：23:58。那时我还在法庭里听法官念"证据来源不清"。',
                    'The metadata of the encrypted channel is a line of footprints: three hops, ending in the public WiFi of one office tower — Stern Group HQ, floor thirty-six.\nTime sent: 23:58. At that moment I was still in the courtroom listening to a judge say "evidence of uncertain provenance".',
                    '暗号通信のメタデータは足跡の列だ。三つの跳躍を経て、あるオフィスビルの公衆WiFiに着地する——スターン・グループ本社、36階。\n送信時刻23:58。そのとき私はまだ法廷で「証拠の出自不明」という言葉を聞いていた。'
                )),
                makeSystem(txt(
                    '🔎 链路画像\n• 发送设备：一次性手机（预付费，现金购买）\n• 位置：斯特恩集团总部 36F 公共网络\n• 时间：23:58（我在法庭里）\n• 附件照片 EXIF：相机型号被抹除，但保留了色温数据——室内，色温 3200K，卤素灯\n• 蓝鸟的措辞：「里面有一具尸体和一份名单」——用「有」，不是「可能」',
                    '🔎 Channel profile\n• Device: burner phone (prepaid, cash)\n• Location: Stern Group HQ, 36F public network\n• Time: 23:58 (I was in court)\n• EXIF on the attachment: camera model scrubbed, colour temperature kept — indoor, 3200K, halogen\n• Bluebird\'s wording: "inside: a body and a list" — not "might be"',
                    '🔎 通信経路\n• 端末：使い捨て携帯（プリペイド、現金購入）\n• 位置：スターン・グループ本社36階 公衆回線\n• 時刻：23:58（私は法廷にいた）\n• 添付写真のEXIF：機種は消去、色温度のみ残存——室内、3200K、ハロゲン\n• ブルーバードの言い回し：「中には遺体と名簿」――「あるかもしれない」ではない'
                )),
                makeCharacter('reyes', txt(
                    '「她在楼里。她知道尸体在哪，也知道名单在哪。她不发给我同事，不发给我上司——她发给我。」\n我盯着屏幕。「为什么是我？」\n答案在第二十秒的时候自己浮上来：因为我今天刚输掉的那场官司，被告就是斯特恩集团的子公司。',
                    '"She is inside the building. She knows where the body is and where the list is. She did not send it to my colleagues, or to my boss — she sent it to me."\nI stare at the screen. "Why me?"\nThe answer surfaces after twenty seconds: because the defendant in the case I lost today was a Stern Group subsidiary.',
                    '「彼女はあのビルの中にいる。遺体の場所も名簿の場所も知っている。同僚にも上司にも送らず、私に送った。」\n私は画面を見つめる。「なぜ私に？」\n答えは二十秒後に自然と浮かぶ。今日私が負けた裁判の被告は、スターン・グループの子会社だった。'
                ))
            ],
            playerReply: txt(
                '在这个城市，最贵的情报不是钱买来的，是被人用绝望寄出来的。',
                'In this city the most expensive intelligence is not bought with money. It is posted by someone out of options.',
                'この街で最も高価な情報は、金で買うものではない。追い詰められた者が投函するものだ。'
            ),
            choices: [
                makeChoice(txt('🚗 去码头——四小时十一分', '🚗 To the pier — four hours eleven minutes left', '🚗 埠頭へ——残り四時間十一分'),
                    'man_ch1_pier', { man_evidence: 1 }, 'risk',
                    txt('剩下的事，在路上想。', 'The rest I can think about on the way.', '残りは道すがら考える。'), 'neutral'),
                makeChoice(txt('🕶️ 带上科尔', '🕶️ Bring Cole along', '🕶️ コールを連れて行く'),
                    'man_ch1_cole', { man_cole: 1 }, 'trust',
                    txt('我需要一个有枪的人，和一个我认识的人。', 'I need someone with a gun, and someone I know.', '銃を持った者と、私が知っている者が要る。'), 'good'),
                makeChoice(txt('📞 打给法官哈洛威——先要一张证', '📞 Call Judge Halloway — get a warrant first', '📞 ハロウェイ判事に電話——先に令状を'),
                    'man_ch1_closing', { man_halloway: 1 }, 'caution',
                    txt('凌晨零点四十分，法官的电话响了七声。', 'At twelve-forty a judge\'s telephone rings seven times.', '零時四十分、判事の電話は七回鳴った。'), 'neutral')
            ]
        },

        /* 码头外围 */
        man_ch1_pier: {
            messages: [
                makeNarrator(txt(
                    '哈德逊码头在午夜像一条被拔掉牙的旧狗：锈、湿、安静。十四号仓库门口停着两辆车——一辆市政工程皮卡，一辆没有牌照的黑色 SUV。\n仓库墙上贴着橙色告示：拆除令，05:00。',
                'Hudson Pier at midnight is like an old dog with its teeth pulled: rusted, wet, quiet. Two vehicles sit outside Warehouse 14 — a city works pickup and a black SUV with no plates.\nAn orange notice is stapled to the wall: DEMOLITION ORDER, 05:00.',
                'ハドソン埠頭の真夜中は、歯を抜かれた老犬のようだ。錆、湿気、静けさ。14号倉庫の前に車が二台——市の作業用ピックアップと、ナンバーのない黒いSUV。\n壁にはオレンジの告知。解体命令、05:00。'
                )),
                makeCharacter('cole', txt(
                    '「没有爆破公司的车。市政爆破令按规定要提前四十八小时公告——这份是四小时前补的。」他压低声音。「玛雅，这不是拆房子，这是销毁。」\n他从后座拿出两支手电。\n「还有一件事。进去了就不能停：你一旦踏进去，就算非法入侵；但只要你在里面找到尸体，它就变成合法。」',
                    '"No demolition contractor\'s truck. City demolition orders require forty-eight hours of public notice — this one was backdated four hours ago." He drops his voice. "Maya, this is not knocking down a building. This is destruction of evidence."\nHe takes two torches from the back seat.\n"One more thing: once we go in we do not stop. The moment you step inside it is trespass; the moment you find a body inside, it becomes lawful."',
                    '「解体業者の車がない。市の解体命令は四十八時間前の公告が原則だ——これは四時間前に遡って作られている。」彼は声を落とす。「マヤ、これは建物を壊すんじゃない。証拠を消すんだ。」\n彼は後部座席から懐中電灯を二つ出す。\n「もう一つ。入ったら止まるな。踏み込んだ瞬間は不法侵入。だが中で遺体を見つけた瞬間、それは適法になる。」'
                )),
                makeCharacter('reyes', txt(
                    '「这就是法律最美的地方。」我说。「也是我们最丑的地方。」\n倒计时：03:58:20。',
                    '"That is the most beautiful thing about the law," I say. "And the ugliest thing about us."\nCounter: 03:58:20.',
                    '「それが法の一番美しいところ。」私は言う。「そして私たちの一番醜いところ。」\n残り時間：03:58:20。'
                ))
            ],
            playerReply: txt(
                '在纽约当检察官，你学的第一件事不是法律，是什么时候可以不再等许可。',
                'Being a prosecutor in New York, the first thing you learn is not the law. It is when you may stop waiting for permission.',
                'ニューヨークの検事が最初に学ぶのは法律ではない。許可を待つのをやめていい瞬間だ。'
            ),
            choices: [
                makeChoice(txt('🚪 进去。现在', '🚪 Go in. Now', '🚪 入る。今すぐ'),
                    'man_ch2_inside', { man_evidence: 1 }, 'risk',
                    txt('我推开那扇卷帘门。', 'I push up the roller door.', '私はシャッターを押し上げる。'), 'neutral'),
                makeChoice(txt('🔦 先绕一圈——看谁在看我们', '🔦 Circle the building first — see who is watching us', '🔦 まず一周する——誰が見ているか'),
                    'man_ch2_gate', { man_evidence: 1, man_watch: 1 }, 'caution',
                    txt('仓库后面有一条防火梯。', 'There is a fire escape at the back.', '裏に非常階段がある。'), 'good'),
                makeChoice(txt('📞 先给法官打电话——我要一张真的证', '📞 Call the judge first — I want a real warrant', '📞 まず判事に電話——本物の令状が要る'),
                    'man_ch1_closing', { man_halloway: 1 }, 'trust',
                    txt('凌晨一点，我敲的不是门，是一个人的良心。', 'At one in the morning I am not knocking on a door. I am knocking on a conscience.', '午前一時、私が敲いているのは扉ではない。良心だ。'), 'neutral')
            ]
        },

        /* 章末 */
        man_ch1_closing: {
            messages: [
                makeNarrator(txt(
                    '在纽约，凌晨一点的电话只有两种人接：欠你钱的，和怕你的。\n艾达·哈洛威法官两样都不是——她接了，因为她还没睡。',
                    'In New York only two kinds of people answer the phone at one in the morning: those who owe you money, and those who fear you.\nJudge Ida Halloway is neither. She answers because she has not slept.',
                    'ニューヨークで午前一時に電話に出るのは二種類だけ。金を借りている者と、あなたを恐れる者。\nアイダ・ハロウェイ判事はどちらでもない。彼女は出た。まだ寝ていなかったからだ。'
                )),
                makeCharacter('halloway', txt(
                    '「玛雅·雷耶斯。我在你二十七岁那年听过你的第一次开场陈述。」\n她的声音像纸。「你说：法官阁下，本案唯一的证人是时间。」\n「您记得。」\n「我记了四年。」她停了一下。「哈维尔·雷耶斯是个好人。他不肯签那份文件。」',
                    '"Maya Reyes. I heard your first opening statement when you were twenty-seven."\nHer voice is like paper. "You said: Your Honour, the only witness in this case is time."\n"You remember that."\n"I have remembered it for four years." She pauses. "Javier Reyes was a good man. He refused to sign that document."',
                    '「マヤ・レイエス。あなたが二十七のとき、最初の冒頭陳述を聞いたわ。」\n彼女の声は紙のようだ。「こう言った。裁判長、本件の唯一の証人は時間です、と。」\n「覚えておいででしたか。」\n「四年覚えている。」彼女は一拍置く。「ハビエル・レイエスは良い人だった。あの書類に署名しなかった。」'
                )),
                makeCharacter('reyes', txt(
                    '「哪份文件？」\n电话那头很安静。安静到我能听见她把话筒换到另一只手上。\n「法官。」我说。「哪一份文件？」',
                    '"Which document?"\nIt is very quiet at the other end. Quiet enough that I hear her move the receiver to her other hand.\n"Judge," I say. "Which document?"',
                    '「どの書類です？」\n受話器の向こうが静かだ。彼女が受話器を反対の手に持ち替える音が聞こえるほどに。\n「判事」と私は言う。「どの書類です？」'
                )),
                makeCharacter('bluebird', txt(
                    '「玛雅，你还有三小时五十六分钟。别浪费在老人身上。」她挂了。',
                    '"Maya, you have three hours and fifty-six minutes left. Do not waste them on an old woman." She hangs up.',
                    '「マヤ、残り三時間五十六分。老人に無駄にしないで。」彼女は切った。'
                ))
            ],
            isTransition: true,
            nextChapter: 'man_ch2'
        }
    },
    startScene: 'man_ch1_start'
};

/* ========== 第二章：哈德逊码头（01:20） ========== */
var man_ch2 = {
    id: 'man_ch2',
    titleKey: 'manCh2Title',
    subtitleKey: 'manCh2Sub',
    narrator: txt(
        '哈德逊河在凌晨是黑色的，水面上的灯是黄色的，桥是红色的。\n纽约的颜色只有这三种，剩下的都是霓虹。',
        'The Hudson is black at this hour, the lights on the water are yellow, the bridges are red.\nNew York has only these three colours. Everything else is neon.',
        'ハドソン川はこの時間、黒い。水面の灯は黄色、橋は赤。\nニューヨークの色はこの三つだけ。あとは全部ネオンだ。'
    ),
    scenes: {
        man_ch2_gate: {
            messages: [
                makeNarrator(txt(
                    '防火梯锈得能听见自己掉渣。科尔在下面把风，我爬到二层平台，从一扇破窗往里看。\n仓库里亮着一盏卤素灯——3200K，和照片里一模一样。',
                    'The fire escape is so rusted you can hear it shedding. Cole watches below; I climb to the second-floor landing and look in through a broken window.\nOne halogen lamp burns inside — 3200K, exactly the colour temperature in the photograph.',
                    '非常階段は錆びて、崩れる音が聞こえるほどだ。コールが下で見張り、私は二階の踊り場まで登り、割れた窓から中を覗く。\n倉庫の中でハロゲン灯が一つ点っている——3200K、写真とまったく同じ色温度。'
                )),
                makeCharacter('cole', txt(
                    '「两点钟方向，有个人在卸货区抽烟。抽了十二分钟没动地方——那不是工人，那是岗哨。」\n无线电里他的声音有点失真。\n「玛雅，我数过：仓库三个出口，两个被车堵住了。他们不是怕人进去，他们是怕什么东西出来。」',
                    '"Two o\'clock, a man smoking in the loading bay. Twelve minutes, hasn\'t moved — that is not a worker, that is a sentry."\nHis voice distorts slightly over the radio.\n"Maya, I counted: three exits, two blocked by vehicles. They are not afraid of someone getting in. They are afraid of something getting out."',
                    '「二時の方向、荷捌き場で煙草を吸っている男がいる。十二分動かない——作業員じゃない、見張りだ。」\n無線の向こうで彼の声が少し歪む。\n「マヤ、数えた。出口は三つ、二つは車で塞がれている。彼らが恐れているのは誰かが入ることじゃない。何かが出ることだ。」'
                )),
                makeSystem(txt(
                    '📋 现场速记 · 01:26\n• 出口 3 处，其中 2 处被车辆封堵\n• 卸货区有 1 名岗哨（非制服）\n• 仓库内唯一光源：卤素灯 1 盏，3200K\n• 未见爆破公司人员与设备\n• 倒计时：03:34:00',
                    '📋 Running notes · 01:26\n• 3 exits, 2 blocked by vehicles\n• 1 sentry in the loading bay (plain clothes)\n• Only light source inside: one halogen lamp, 3200K\n• No demolition contractor personnel or equipment\n• Counter: 03:34:00',
                    '📋 現場メモ・01:26\n• 出口3箇所、うち2箇所は車両で封鎖\n• 荷捌き場に見張り1名（私服）\n• 庫内光源はハロゲン灯1つのみ、3200K\n• 解体業者の人員・機材は不在\n• 残り時間：03:34:00'
                ))
            ],
            playerReply: txt(
                '一个仓库，三个出口，两个被堵住。这不是建筑工地，这是保险箱。',
                'One warehouse, three exits, two of them blocked. This is not a construction site. This is a safe.',
                '倉庫に出口三つ、二つが塞がれている。これは工事現場じゃない。金庫だ。'
            ),
            choices: [
                makeChoice(txt('🚪 从破窗进去', '🚪 Go in through the broken window', '🚪 割れた窓から入る'),
                    'man_ch2_inside', { man_evidence: 1 }, 'risk',
                    txt('我先扔了手电，再扔了自己。', 'I throw the torch in first, then myself.', '先に懐中電灯を投げ、それから自分を投げる。'), 'neutral'),
                makeChoice(txt('🚶 走正门——让他们知道联邦的人来了', '🚶 Walk in the front door — let them know the feds are here', '🚶 正面から入る——連邦が来たことを知らせる'),
                    'man_ch2_inside', { man_evidence: 1, man_bold: 1 }, 'truth',
                    txt('有时候，最亮的灯就是最好的武器。', 'Sometimes the brightest light is the best weapon.', 'ときに最も明るい灯が最良の武器になる。'), 'good'),
                makeChoice(txt('📸 先拍照取证——把"正在销毁"这件事钉死', '📸 Photograph first — nail down the fact of destruction', '📸 まず撮影——「証拠隠滅中」を固める'),
                    'man_ch2_body', { man_evidence: 2, man_photo: 1 }, 'caution',
                    txt('我按了十七次快门。', 'I press the shutter seventeen times.', 'シャッターを十七回切る。'), 'good')
            ]
        },

        /* 进入仓库 */
        man_ch2_inside: {
            messages: [
                makeNarrator(txt(
                    '仓库里冷得像冰柜，空气里有三种味道：柴油、水泥灰、和一种甜的、不该在这儿的味道。\n卤素灯照着地面中央一块新浇的水泥——三米见方，还没干透。\n一只手从水泥边缘伸出来。手腕上戴着一块旧表。',
                    'Inside it is cold as a walk-in freezer, and the air carries three smells: diesel, cement dust, and something sweet that has no business being here.\nThe halogen lamp lights a patch of freshly poured concrete in the middle of the floor — three metres square, not yet cured.\nA hand protrudes from the edge of the concrete. On the wrist is an old watch.',
                    '庫内は冷蔵庫のように冷たく、空気に三つの匂いがある。軽油、セメントの粉、そして甘い、ここにあるはずのない匂い。\nハロゲン灯が床の真ん中の新しく打たれたコンクリートを照らす——三メートル四方、まだ乾いていない。\nその縁から手が一本突き出ている。手首に古い時計。'
                )),
                makeCharacter('reyes', txt(
                    '我蹲下去，没有碰它。表盘是裂的，指针停在 10:43。\n这是我父亲的表。我在十岁那年看着他给这块表上弦，他说：玛雅，时间是最诚实的证人，它从不替谁说话，它只是走。',
                    'I crouch without touching it. The face is cracked; the hands have stopped at 10:43.\nThis is my father\'s watch. I was ten the first time I watched him wind it, and he said: Maya, time is the most honest witness — it never speaks for anyone, it simply runs.',
                    '私はしゃがむ。触れない。文字盤は割れ、針は10時43分で止まっている。\n父の時計だ。十歳のとき、彼がこの時計のゼンマイを巻くのを見ながら言った。マヤ、時間は最も正直な証人だ。誰の代弁もしない、ただ進むだけだ、と。'
                )),
                makeCharacter('cole', txt(
                    '「玛雅。」他站在我身后，声音很低。「这不是你父亲。」',
                    '"Maya." He stands behind me, very quietly. "This is not your father."',
                    '「マヤ。」彼が背後に立つ。声はとても低い。「これは君の父じゃない。」'
                )),
                makeCharacter('reyes', txt(
                    '「我知道。」',
                    '"I know."',
                    '「分かってる。」'
                )),
                makeCharacter('cole', txt(
                    '「我要你听见自己说这句话。」',
                    '"I need to hear you say it."',
                    '「君自身の口で言ってほしい。」'
                )),
                makeCharacter('reyes', txt(
                    '「这不是我父亲。」我说。「这是我父亲的表。有人把它戴在别人手上，好让我一定会来。」',
                    '"This is not my father," I say. "This is my father\'s watch. Someone put it on another man\'s wrist so that I would be certain to come."',
                    '「父じゃない」と私は言う。「父の時計だ。誰かが他人の手首にはめた。私が必ず来るように。」'
                ))
            ],
            playerReply: txt(
                '有人用我父亲的表给我发了一张请柬。这说明三件事：他知道我，他知道我父亲，他知道我会来。',
                'Someone sent me an invitation using my father\'s watch. That tells me three things: he knows me, he knew my father, and he knew I would come.',
                '誰かが父の時計で私に招待状を寄越した。それは三つを意味する。彼は私を知っている。父を知っていた。そして私が来ると分かっていた。'
            ),
            choices: [
                makeChoice(txt('🔍 检查尸体——先知道他是谁', '🔍 Examine the body — find out who he is first', '🔍 遺体を調べる——まず彼が誰か'),
                    'man_ch2_body', { man_evidence: 1 }, 'truth',
                    txt('水泥还没干透，边缘有一道撬痕。', 'The concrete is not cured; there is a pry mark along the edge.', 'コンクリートはまだ乾いていない。縁にこじ開けた跡がある。'), 'neutral'),
                makeChoice(txt('🧊 撬开水泥——他手里有东西', '🧊 Break open the concrete — there is something in his hand', '🧊 コンクリートを割る——手に何かある'),
                    'man_ch2_usb', { man_evidence: 2 }, 'risk',
                    txt('我用消防斧，第一下就裂了。', 'I use the fire axe. It cracks on the first blow.', '私は消防斧を使う。一撃で割れた。'), 'good'),
                makeChoice(txt('📞 叫局里来人——让程序开始', '📞 Call the office — start the process', '📞 局に連絡——手続きを始める'),
                    'man_ch2_body', { man_evidence: 1, man_proc: 1 }, 'caution',
                    txt('凌晨一点四十七分，我拨了值班号。', 'At one forty-seven I dial the duty number.', '午前一時四十七分、私は当番の番号を回す。'), 'neutral')
            ]
        },

        /* 尸体 */
        man_ch2_body: {
            messages: [
                makeSystem(txt(
                    '📋 现场记录 · 01:52\n• 死者：男性，40–50 岁，身高约 1.78m\n• 死亡时间（肝温/尸僵初判）：约 22:30–23:10\n• 死因：颈部受压（舌骨骨折），非坠落、非事故\n• 随身物：钱包（现金未取）、市政工作证\n• 身份：罗恩·维加，市审计署审计员，复兴基金审核组组长\n• 异常：右手紧握，指间夹有一枚微型存储卡',
                    '📋 Scene record · 01:52\n• Deceased: male, 40–50, approx. 1.78m\n• Time of death (liver temp / rigor onset): approx. 22:30–23:10\n• Cause: compression to the neck (fractured hyoid) — not a fall, not an accident\n• Effects: wallet (cash untouched), municipal ID\n• Identity: Ron Vega, city auditor, head of the Renewal Fund audit team\n• Anomaly: right hand clenched, a micro storage card between the fingers',
                    '📋 現場記録・01:52\n• 死者：男性、40〜50歳、身長約1.78m\n• 死亡時刻（肝温・死硬直の初期）：22:30〜23:10頃\n• 死因：頸部圧迫（舌骨骨折）。転落でも事故でもない\n• 所持品：財布（現金は手つかず）、市の職員証\n• 身分：ロン・ベガ、市監査局監査員、再生基金審査班長\n• 特異点：右手は固く握られ、指の間に小型メモリーカード'
                )),
                makeCharacter('cole', txt(
                    '「复兴基金的审核组长。基金规模二十一亿。」他吹了声口哨。「玛雅，这就是名单的意义：二十一个亿，谁签的字，谁分了多少。」\n他看着那块新水泥。「他们不是把他埋了。他们是想把他浇进地基，然后五点钟连楼一起炸掉。」',
                    '"Head of the Renewal Fund audit team. The fund is two point one billion." He whistles. "Maya, that is what the list means: two point one billion, who signed, who took what."\nHe looks at the fresh concrete. "They did not bury him. They meant to pour him into the foundation and blow the whole thing up at five."',
                    '「再生基金の審査班長。基金規模二十一億。」彼は口笛を吹く。「マヤ、それが名簿の意味だ。二十一億、誰が署名し、誰がいくら取ったか。」\n彼は新しいコンクリートを見る。埋めたんじゃない。基礎に流し込み、五時に建物ごと吹き飛ばすつもりだった。'
                )),
                makeCharacter('reyes', txt(
                    '「他手里有东西。」',
                    '"There is something in his hand."',
                    '「彼の手に何かある。」'
                )),
                makeCharacter('cole', txt(
                    '「我知道。但你一旦把它拔出来，辩方律师会说取证链断裂。」',
                    '"I know. But the moment you pull it out, a defence lawyer will say the chain of custody is broken."',
                    '「分かってる。だが抜いた瞬間、弁護側は証拠の連鎖が切れたと言う。」'
                )),
                makeCharacter('reyes', txt(
                    '「科尔。」我说。「凌晨两点，我站在一具被浇进水泥的尸体旁边。我不打算把今晚交给一个律师去讲。」',
                    '"Cole," I say. "It is two in the morning and I am standing next to a body poured into concrete. I am not handing this night over to a lawyer."',
                    '「コール」と私は言う。「午前二時よ。私はコンクリートに流し込まれた遺体の傍に立っている。今夜を弁護士に預けるつもりはない。」'
                ))
            ],
            playerReply: txt(
                '死者是审核组长。他审核的那笔钱是二十一亿。他被浇进了地基。这三句话就是一整个案子。',
                'The dead man was the head of the audit team. The money he audited was two point one billion. He was poured into the foundation. Those three sentences are an entire case.',
                '死者は審査班長。彼が審査した金は二十一億。彼は基礎に流し込まれた。この三文で事件は全部説明できる。'
            ),
            choices: [
                makeChoice(txt('🧊 取出存储卡——现在', '🧊 Take the card out — now', '🧊 メモリーカードを取り出す——今'),
                    'man_ch2_usb', { man_evidence: 2 }, 'risk',
                    txt('我把他的手掰开。它很凉，也很配合。', 'I open his hand. It is cold, and it cooperates.', '私は彼の手を開く。冷たい。そして素直だ。'), 'neutral'),
                makeChoice(txt('📸 先固定现场——整套流程走完再动', '📸 Secure the scene first — finish the process before touching it', '📸 まず現場保全——手順を踏んでから触る'),
                    'man_ch2_usb', { man_evidence: 2, man_proc: 1 }, 'caution',
                    txt('我拍了四十一张照片。', 'I take forty-one photographs.', '私は四十一枚撮る。'), 'good'),
                makeChoice(txt('🏃 退出去——有人来了', '🏃 Get out — someone is coming', '🏃 退く——誰か来る'),
                    'man_ch2_closing', {}, 'caution',
                    txt('外面传来第二辆车熄火的声音。', 'Outside, a second engine cuts out.', '外で二台目のエンジンが止まる音。'), 'neutral')
            ]
        },

        /* 存储卡 */
        man_ch2_usb: {
            messages: [
                makeNarrator(txt(
                    '存储卡插进那台不联网的笔记本。里面只有一个文件，没有名字，只有一串数字：\n「21」——二十一行。每一行是一个缩写、一个数字、和一个日期。',
                    'I put the card into the laptop that never touches a network. It holds one file, unnamed, with a single string of digits:\n"21" — twenty-one lines. Each line is an initial, a number, and a date.',
                    'カードをネットに繋がないノートに差す。中にあるのはファイル一つ。名前はなく、数字の羅列だけ。\n「21」——二十一行。各行は頭文字、数字、日付。'
                )),
                makeSystem(txt(
                    '🔐 名单 · 前 11 行（其余需解密密钥）\n01  R.M.   4,200,000   03/14\n02  D.C.     380,000   07/02   ← 这两行我看了三遍\n03  J.O.   9,750,000   11/19\n04  I.H.  18,600,000   01/08   ← 最大一笔\n05  T.B.   3,100,000   02/22\n…\n11  H.R.   2,400,000   11/12   ← 2013 年。我父亲死的那一年的那一天。\n最终行：N.S.  —— 金额栏为空，日期栏写着「每周」',
                    '🔐 The list · first 11 lines (remainder requires a key)\n01  R.M.   4,200,000   03/14\n02  D.C.     380,000   07/02   ← I read these two lines three times\n03  J.O.   9,750,000   11/19\n04  I.H.  18,600,000   01/08   ← the largest\n05  T.B.   3,100,000   02/22\n...\n11  H.R.   2,400,000   11/12   ← 2013. The year my father died. That day.\nFinal line: N.S. — amount blank, date column reads "weekly"',
                    '🔐 名簿・最初の11行（残りは鍵が必要）\n01  R.M.   4,200,000   03/14\n02  D.C.     380,000   07/02   ← この二行を三度読み返した\n03  J.O.   9,750,000   11/19\n04  I.H.  18,600,000   01/08   ← 最大額\n05  T.B.   3,100,000   02/22\n…\n11  H.R.   2,400,000   11/12   ← 2013年。父が死んだ年、その日。\n最終行：N.S. ―― 金額欄は空、日付欄に「毎週」'
                )),
                makeCharacter('reyes', txt(
                    '「D. C.」\n科尔就在我身后两米。他没有动。\n「戴恩。」我说。「三十八万。去年七月二日。那天你告诉我你在费城开会。」\n他很慢地摘下墨镜——凌晨的仓库里他一直戴着墨镜，我竟然现在才发现。',
                    '"D. C."\nCole is two metres behind me. He does not move.\n"Dane," I say. "Three hundred and eighty thousand. Second of July last year. That was the day you told me you were in a meeting in Philadelphia."\nVery slowly he takes off his sunglasses — he has been wearing them in a warehouse at two in the morning, and I only notice now.',
                    '「D. C.」\nコールは二メートル後ろにいる。動かない。\n「デイン」と私は言う。「三十八万。去年七月二日。あの日あなたはフィラデルフィアで会議だと言った。」\n彼はゆっくりとサングラスを外す——午前二時の倉庫でずっと掛けていた。私が気づいたのは今だ。'
                ))
            ],
            playerReply: txt(
                '名单上第二个名字就在我身后。这就是美剧最烂的一集里会发生的情节——而它正在发生。',
                'The second name on the list is standing behind me. This is the thing that happens in the worst episode of a TV show — and it is happening.',
                '名簿の二番目の名前が私の後ろに立っている。ドラマの最低の回に起きる展開だ——そして今、起きている。'
            ),
            choices: [
                makeChoice(txt('🕶️ 问他——先听他怎么说', '🕶️ Ask him — hear what he says first', '🕶️ 彼に訊く——まず言い分を聞く'),
                    'man_ch3_cole', { man_cole: 1, man_evidence: 1 }, 'trust',
                    txt('我把屏幕转过去，让他自己看。', 'I turn the screen so he can read it himself.', '私は画面を向けて、彼に読ませる。'), 'good'),
                makeChoice(txt('📞 直接上报——把他交给局里', '📞 Report it — hand him over to the Bureau', '📞 すぐ報告——彼を局に渡す'),
                    'man_ch3_halloway', { man_evidence: 2, man_proc: 1 }, 'caution',
                    txt('程序会保护我，也会保护名单上的所有人。', 'The process will protect me. It will also protect everyone on that list.', '手続きは私を守る。そして名簿の全員も守る。'), 'neutral'),
                makeChoice(txt('🐦 先联系蓝鸟——她知道密钥在哪', '🐦 Contact Bluebird — she knows where the key is', '🐦 ブルーバードに連絡——鍵の在り処を知っている'),
                    'man_ch3_bluebird', { man_bluebird: 1, man_evidence: 1 }, 'risk',
                    txt('我在加密频道里打了两个字：我要密钥。', 'In the encrypted channel I type two words: I need the key.', '暗号チャンネルに二語打つ。鍵が要る。'), 'good')
            ]
        },

        /* 章末 */
        man_ch2_closing: {
            messages: [
                makeNarrator(txt(
                    '我们从侧门撤出来的时候，那辆没牌照的 SUV 已经走了。地上留下两道轮胎印，和一根没抽完的烟。\n科尔把烟捡起来，用证物袋装好。他说：这年头，DNA 比指纹管用。',
                    'When we slip out through the side door the unplated SUV is already gone. It leaves two tyre tracks and a half-smoked cigarette.\nCole picks the cigarette up and bags it. "These days," he says, "DNA beats fingerprints."',
                    '側口から抜け出したとき、ナンバーのないSUVはもう消えていた。残したのは二筋のタイヤ痕と、吸いかけの煙草。\nコールは煙草を拾い、証拠袋に入れる。「近ごろはDNAの方が指紋より役に立つ」。'
                )),
                makeCharacter('reyes', txt(
                    '「现在几点。」',
                    '"What time is it?"',
                    '「何時？」'
                )),
                makeCharacter('cole', txt(
                    '「两点三十七。」',
                    '"Two thirty-seven."',
                    '「二時三十七分。」'
                )),
                makeCharacter('reyes', txt(
                    '「两小时二十三分钟。」我说。「科尔，在纽约，两小时二十三分钟够干什么？」',
                    '"Two hours and twenty-three minutes," I say. "Cole, in New York, what can be done in two hours and twenty-three minutes?"',
                    '「二時間二十三分」と私は言う。「コール、ニューヨークで二時間二十三分あれば何ができる？」'
                )),
                makeCharacter('cole', txt(
                    '「够一个法官起床、签字、再反悔。也够一个市长候选人把二十一亿变成一场慈善晚宴。」',
                    '"Enough for a judge to get up, sign, and change her mind. Also enough for a mayoral candidate to turn two point one billion into a charity gala."',
                    '「判事が起きて、署名して、翻意するには足りる。市長候補が二十一億を慈善晩餐会に変えるにも足りる。」'
                ))
            ],
            isTransition: true,
            nextChapter: 'man_ch3'
        }
    },
    startScene: 'man_ch2_gate'
};

/* ========== 第三章：法官的厨房（03:00） ========== */
var man_ch3 = {
    id: 'man_ch3',
    titleKey: 'manCh3Title',
    subtitleKey: 'manCh3Sub',
    narrator: txt(
        '凌晨三点是纽约最诚实的时间：华尔街还没醒，地铁里只有上夜班的人，政客都在睡觉。\n所以凌晨三点也是这个城市唯一还能办事的时间。',
        'Three in the morning is New York\'s most honest hour: Wall Street is not awake yet, the subway carries only night shifts, the politicians are asleep.\nWhich is why three in the morning is also the only hour when anything in this city can still get done.',
        '午前三時はニューヨークで最も正直な時間だ。ウォール街はまだ起きていない、地下鉄には夜勤の者しかいない、政治家は寝ている。\nだから午前三時は、この街でまだ何かができる唯一の時間でもある。'
    ),
    scenes: {
        man_ch3_hub: {
            messages: [
                makeNarrator(txt(
                    '倒计时 01:58:00。\n三件事必须同时发生：拿到搜查令、解开剩下十行、找到蓝鸟。我只有两条腿和一个电话号码本。',
                    'Counter: 01:58:00.\nThree things have to happen at once: get a warrant, unlock the remaining ten lines, find Bluebird. I have two legs and a contacts list.',
                    '残り時間 01:58:00。\n三つを同時に進めねばならない。令状、残り十行の解錠、ブルーバードの確保。私にあるのは二本の足と電話帳だけ。'
                )),
                makeCharacter('reyes', txt(
                    '「在法庭上，我们管这叫『并行程序』。在生活中，我们管这叫『来不及』。」\n科尔把车停在街角，引擎没熄。\n「玛雅，我陪你上楼。但你要答应我一件事：别在法官家里掏枪。」\n「我没带枪。」\n「我知道。这就是我最担心的。」',
                    '"In court we call this parallel proceedings. In life we call it running out of time."\nCole leaves the engine running at the corner.\n"Maya, I will go upstairs with you. But promise me one thing: do not draw a weapon in a judge\'s house."\n"I do not have a weapon."\n"I know. That is exactly what worries me."',
                    '「法廷では『併行手続』と呼ぶ。人生では『間に合わない』と呼ぶ。」\nコールは角に車を停め、エンジンは切らない。\n「マヤ、一緒に上がる。だが一つ約束して。判事の家で銃を抜くな。」\n「銃は持ってない。」\n「分かってる。だからこそ心配だ。」'
                ))
            ],
            playerReply: txt(
                '两小时。三个人。三条路。这就是我在法学院没学过的那一课：时间分配。',
                'Two hours. Three people. Three roads. This is the lesson they never taught in law school: allocation of time.',
                '二時間、三人、三つの道。ロースクールで教わらなかった科目だ。時間の配分。'
            ),
            choices: [
                makeChoice(txt('🏛️ 上楼找哈洛威法官——要一张能冻结爆破的令', '🏛️ Go up to Judge Halloway — get an order that stops the blast', '🏛️ ハロウェイ判事の部屋へ——爆破を止める令状を'),
                    'man_ch3_halloway', { man_evidence: 1, man_halloway: 1 }, 'truth',
                    txt('她的门牌是 4B。灯亮着。', 'Her door is 4B. The light is on.', '彼女の部屋は4B。灯が点いている。'), 'neutral'),
                makeChoice(txt('🐦 约蓝鸟见面——她就在那栋楼里', '🐦 Meet Bluebird — she is inside that tower', '🐦 ブルーバードと会う——あのビルの中にいる'),
                    'man_ch3_bluebird', { man_bluebird: 1, man_evidence: 1 }, 'risk',
                    txt('我发了三个字：二十分钟。', 'I send three words: twenty minutes.', '三語送る。二十分後。'), 'good'),
                makeChoice(txt('🕶️ 先跟科尔把话说清楚——D. C. 是谁', '🕶️ Settle it with Cole first — who is D. C.?', '🕶️ まずコールと決着をつける。D. C. は誰だ'),
                    'man_ch3_cole', { man_cole: 1, man_evidence: 1 }, 'trust',
                    txt('在车里，引擎的声音是天然的隔音。', 'In the car, the engine is a natural soundproofing.', '車の中なら、エンジン音が天然の防音になる。'), 'good')
            ]
        },

        /* 法官 */
        man_ch3_halloway: {
            messages: [
                makeNarrator(txt(
                    '艾达·哈洛威的厨房铺着一九七四年的油毡地，炉子上的水刚好开。她穿着法袍外套——三十一年了，她说这样随时能出门。\n我把材料摊在她的餐桌上。她一份一份看，看到第八页的时候停住了。',
                    'Ida Halloway\'s kitchen has linoleum from 1974 and a kettle that has just boiled. She wears her robe over her coat — thirty-one years, she says, so she can leave at any moment.\nI spread my material across her kitchen table. She reads page by page and stops at page eight.',
                    'アイダ・ハロウェイの台所の床は1974年のリノリウム。コンロの湯がちょうど沸いた。彼女はコートの上に法服を羽織っている——三十一年、いつでも出られるようにと。\n私は資料を食卓に広げる。彼女は一頁ずつ読み、八頁目で止まった。'
                )),
                makeCharacter('halloway', txt(
                    '「第四行。」她说。「I. H.，一千八百六十万，一月八日。」\n她把眼镜摘下来，用袖口擦——这是人拖时间的动作。\n「玛雅，你知道联邦法官的财产申报是公开的吗？你知道我丈夫的医疗账单有多贵吗？」',
                    '"Line four," she says. "I. H., eighteen million six hundred thousand, eighth of January."\nShe takes off her glasses and polishes them on her sleeve — the gesture of a person buying time.\n"Maya, do you know that a federal judge\'s financial disclosure is public? Do you know how expensive my husband\'s medical bills are?"',
                    '「四行目」と彼女。「I. H.、一千八百六十万、一月八日。」\n彼女は眼鏡を外し、袖口で拭う——時間を稼ぐ動作だ。\n「マヤ、連邦判事の資産公開が誰でも見られることを知っている？ 夫の医療費がどれほどか知っている？」'
                )),
                makeCharacter('reyes', txt(
                    '「法官，我不想知道。」',
                    '"Your Honour, I do not want to know that."',
                    '「判事、知りたくない。」'
                )),
                makeCharacter('halloway', txt(
                    '「可你已经知道了。」',
                    '"But you already do."',
                    '「だがもう知っている。」'
                )),
                makeCharacter('reyes', txt(
                    '「我只要一张令：冻结哈德逊码头十四号的拆除，48 小时。」',
                    '"All I need is an order: freeze the demolition at Hudson Pier 14, forty-eight hours."',
                    '「令状が一枚要るだけ。ハドソン埠頭14号の解体を四十八時間停止。」'
                )),
                makeCharacter('halloway', txt(
                    '「给你令，仓库在五点零一分被别的理由炸掉。」她说。「给你令，明天早上七点，你会被调去处理移民案子。」\n她把水倒进两个不配套的杯子。「玛雅，你父亲当年也是这么说的：我只要一张纸。然后他们给了他一张纸——从二十二楼。」',
                    '"Give you that order and the warehouse is blown at five-oh-one for another reason," she says. "Give you that order and by seven tomorrow morning you will be reassigned to immigration cases."\nShe pours water into two unmatching cups. "Maya, your father said the same thing once: all I need is one piece of paper. And they gave him one — from the twenty-second floor."',
                    '「令状を出せば、倉庫は五時一分に別の理由で吹き飛ぶ。令状を出せば、明朝七時にあなたは移民案件へ回される。」\n彼女は揃っていない二つのカップに湯を注ぐ。「マヤ、あなたの父も同じことを言った。紙が一枚あればいい、と。そして彼らは一枚よこした――22階から。」'
                )),
                makeNarrator(txt(
                    '她在令状上签了字。钢笔漏了一点墨，像一道很小的伤口。\n签完她说了最后一句：「玛雅，这张纸救不了你。它能救的只有一件事——让他们在救你之前，必须先解释为什么。」',
                    'She signs the order. The pen leaks a little ink, like a very small wound.\nWhen she finishes she says one last thing: "Maya, this paper will not save you. What it can save is one thing only — before they come for you, they will have to explain why."',
                    '彼女は令状に署名した。ペンが少しインクを漏らす。とても小さな傷のようだ。\n署名を終えて、彼女は最後の一言を言う。「マヤ、この紙はあなたを救えない。救えるのは一つだけ——彼らがあなたを始末する前に、なぜかを説明しなければならなくなること。」'
                ))
            ],
            playerReply: txt(
                '她签了。她也上了名单。这两件事今晚第一次同时为真。',
                'She signed. She is also on the list. For the first time tonight both of those things are true at once.',
                '彼女は署名した。そして彼女も名簿に載っている。この二つが同時に真になるのは今夜が初めてだ。'
            ),
            choices: [
                makeChoice(txt('🐦 去见蓝鸟——她有密钥', '🐦 Meet Bluebird — she has the key', '🐦 ブルーバードに会う——鍵を持っている'),
                    'man_ch3_bluebird', { man_bluebird: 1, man_evidence: 1 }, 'risk',
                    txt('二十分钟，从布鲁克林高地到中城。', 'Twenty minutes from Brooklyn Heights to Midtown.', 'ブルックリン・ハイツからミッドタウンまで二十分。'), 'good'),
                makeChoice(txt('🕶️ 回车里——先处理科尔', '🕶️ Back to the car — deal with Cole', '🕶️ 車へ戻る——まずコールを'),
                    'man_ch3_cole', { man_cole: 1, man_evidence: 1 }, 'trust',
                    txt('名单上第二个名字还在车里等我。', 'The second name on the list is still waiting in the car.', '名簿の二番目の名前がまだ車で待っている。'), 'good'),
                makeChoice(txt('⏱️ 时间到了。回码头', '⏱️ Time is up. Back to the pier', '⏱️ 時間だ。埠頭へ戻る'),
                    'man_ch3_closing', {}, 'risk',
                    txt('一小时十二分。', 'One hour twelve.', '一時間十二分。'), 'neutral')
            ]
        },

        /* 蓝鸟 */
        man_ch3_bluebird: {
            messages: [
                makeNarrator(txt(
                    '斯特恩集团总部三十六层的清洁间，凌晨三点十九分，只有自动吸尘器在跑。\n她穿着行政助理的制服，胸牌上写着 Callie Chen。二十六岁。她把一次性手机放在水槽里，倒上水。',
                    'Cleaning closet, floor thirty-six, Stern Group HQ. Three nineteen in the morning; only the robotic vacuum is working.\nShe wears an admin assistant\'s uniform. The badge reads Callie Chen. Twenty-six. She puts the burner phone in the sink and pours water over it.',
                    'スターン・グループ本社36階の清掃室。午前三時十九分、動いているのは自動掃除機だけ。\n彼女は管理アシスタントの制服。胸札には Callie Chen。二十六歳。使い捨て携帯を流しに置き、水をかける。'
                )),
                makeCharacter('bluebird', txt(
                    '「我不是为了正义。」这是她第一句话。「我做了三年半的行政助理，我知道每一个人的咖啡怎么泡，也知道每一笔钱怎么走。」\n她从制服口袋里掏出一个指甲盖大小的硬件。\n「密钥在这里。但我有个条件：名单上的第十一行，H. R.，我要你查清楚他到底签没签。」',
                    '"This is not about justice." That is her first sentence. "I have been an admin assistant for three and a half years. I know how every one of them takes their coffee, and I know how every payment moves."\nShe takes a piece of hardware the size of a fingernail from her pocket.\n"The key is here. But I have one condition: line eleven, H. R. — I want you to find out whether he actually signed."',
                    '「正義のためじゃない。」これが彼女の最初の一言。「三年半アシスタントをした。誰がコーヒーをどう飲むかも、金がどう動くかも知っている。」\n彼女は爪ほどの大きさの機器を制服のポケットから出す。\n「鍵はここ。だが条件がある。11行目、H. R.。彼が本当に署名したのか突き止めて。」'
                )),
                makeCharacter('reyes', txt(
                    '「H. R. 是哈维尔·雷耶斯。他是我父亲。」',
                    '"H. R. is Javier Reyes. He was my father."',
                    '「H. R. はハビエル・レイエス。私の父よ。」'
                )),
                makeCharacter('bluebird', txt(
                    '她愣了大概两秒钟——这是我今晚见过最诚实的两秒钟。\n「那你更应该查。」她说。「因为如果他签了，那他也是二十一个人之一；如果他没签，那他就不是自杀。」',
                    'She freezes for perhaps two seconds — the most honest two seconds I have seen tonight.\n"Then you should look harder," she says. "Because if he signed, he is one of the twenty-one. And if he did not, it was not suicide."',
                    '彼女は二秒ほど固まる——今夜見た中で最も正直な二秒。\n「ならなおさら調べるべきだ。署名していたら彼も二十一人の一人。していなければ、あれは自殺じゃない。」'
                )),
                makeCharacter('reyes', txt(
                    '「……你为什么在意？」',
                    '"...Why do you care?"',
                    '「……なぜそこまで？」'
                )),
                makeCharacter('bluebird', txt(
                    '「因为我父亲也在名单上。第七行。他已经死了。」',
                    '"Because my father is on it too. Line seven. He is already dead."',
                    '「私の父も名簿にいる。七行目。もう死んだ。」'
                ))
            ],
            playerReply: txt(
                '两个女儿，两个死掉的父亲，一份二十一个人的名单。这就是这座城市真正的家庭结构。',
                'Two daughters, two dead fathers, one list of twenty-one names. That is the real family structure of this city.',
                '二人の娘、二人の死んだ父、二十一人の名簿。これがこの街の本当の家族構成だ。'
            ),
            choices: [
                makeChoice(txt('🏛️ 去找法官签字冻结爆破', '🏛️ Get the judge to sign the freeze order', '🏛️ 判事に凍結令状へ署名させる'),
                    'man_ch3_halloway', { man_evidence: 1, man_halloway: 1 }, 'truth',
                    txt('四 B 的灯还亮着。', 'The light in 4B is still on.', '4Bの灯はまだ点いている。'), 'neutral'),
                makeChoice(txt('🕶️ 回车里——名单上还有第二行没解决', '🕶️ Back to the car — line two is still unresolved', '🕶️ 車へ戻る——二行目がまだ片づいていない'),
                    'man_ch3_cole', { man_cole: 1, man_evidence: 1 }, 'trust',
                    txt('D. C. 还在驾驶座上。', 'D. C. is still in the driver\'s seat.', 'D. C. はまだ運転席にいる。'), 'good'),
                makeChoice(txt('⏱️ 拿密钥走人——时间不够了', '⏱️ Take the key and go — there is no time left', '⏱️ 鍵を持って立ち去る——時間がない'),
                    'man_ch3_closing', { man_evidence: 1 }, 'risk',
                    txt('她把指甲盖大的东西放进我手心。', 'She puts the fingernail-sized thing in my palm.', '彼女は爪ほどのそれを私の掌に置く。'), 'good')
            ]
        },

        /* 科尔 */
        man_ch3_cole: {
            messages: [
                makeNarrator(txt(
                    '车里。雨刷开着，虽然没下雨——他紧张的时候会开雨刷。这习惯我见过四次。\n「三十八万。」我说。\n「三十八万。」他重复。',
                    'In the car. The wipers are running although it is not raining — he runs them when he is nervous. I have seen it four times.\n"Three hundred and eighty thousand," I say.\n"Three hundred and eighty thousand," he repeats.',
                    '車の中。雨が降っていないのにワイパーが動いている——彼は緊張するとワイパーを動かす。四度見た。\n「三十八万」と私は言う。\n「三十八万」と彼が繰り返す。'
                )),
                makeCharacter('cole', txt(
                    '「二〇一九年我妹妹的肾。三十八万不是给我的，是给中介的——他们要现金，要在七月二号之前。」\n他终于看着我。「我写了一份内部报告，交给局里。三天后我被通知：报告『已归档』，我被调去看仓库。」\n「所以你收了钱。」\n「所以我收了钱，然后我把每一笔都记下来了。玛雅，我这三年不是在卧底，我是在攒证据。」',
                    '"2019. My sister\'s kidney. The three hundred and eighty thousand was never mine — it went to a broker, and it had to be in cash before the second of July."\nAt last he looks at me. "I filed an internal report. Three days later I was told the report was archived, and reassigned to warehouse duty."\n"So you took the money."\n"So I took the money, and I wrote down every payment. Maya, these three years I have not been undercover. I have been collecting."',
                    '「2019年、妹の腎臓だ。三十八万は私のものじゃない。仲介に払った——現金で、七月二日までに。」\n彼はようやく私を見る。「内部報告を書いて局に出した。三日後、報告は『保管済み』と通知され、私は倉庫勤務に回された。」\n「つまり金を受け取った。」\n「受け取って、そして一銭ずつ記録した。マヤ、この三年、私は潜入していたんじゃない。集めていたんだ。」'
                )),
                makeCharacter('reyes', txt(
                    '「你为什么不早说？」\n「因为每一个我早说的人，第二天就不在名单上了。」他把一份手写台账推给我。四十一页，字迹工整得像印刷体。\n「现在你可以用它。也可以把我一起交出去——这两件事我都同意。」',
                    '"Why did you not say so earlier?"\n"Because everyone I told early was off the list by the next day." He pushes a handwritten ledger toward me. Forty-one pages, the handwriting neat as print.\n"You can use it now. You can also hand me in with it — I agree to both."',
                    '「なぜ早く言わなかった？」\n「早く言った相手は皆、翌日には名簿から消えた。」彼は手書きの帳簿を差し出す。四十一頁、活字のように整った字。\n「好きに使え。私ごと突き出してもいい——どちらも了承する。」'
                ))
            ],
            playerReply: txt(
                '他是名单上的人，也是唯一愿意作证的人。在纽约，这两件事常常是同一个人。',
                'He is on the list, and he is the only one willing to testify. In New York those two things are very often the same person.',
                '彼は名簿に載っている。そして唯一証言する意志のある者だ。ニューヨークでは、この二つはしばしば同一人物だ。'
            ),
            choices: [
                makeChoice(txt('🏛️ 去法官那里——我要冻结令', '🏛️ To the judge — I need the freeze order', '🏛️ 判事のもとへ——凍結令状が要る'),
                    'man_ch3_halloway', { man_evidence: 1, man_halloway: 1 }, 'truth',
                    txt('四十一页台账，加上她的签名，够了吗？', 'Forty-one pages of ledger plus her signature. Is it enough?', '四十一頁の帳簿と、彼女の署名。足りるか。'), 'good'),
                makeChoice(txt('🐦 去找蓝鸟拿密钥', '🐦 Find Bluebird and get the key', '🐦 ブルーバードから鍵を受け取る'),
                    'man_ch3_bluebird', { man_bluebird: 1, man_evidence: 1 }, 'risk',
                    txt('三十六层的清洁间。', 'Cleaning closet, floor thirty-six.', '36階の清掃室。'), 'good'),
                makeChoice(txt('⏱️ 够了。回码头', '⏱️ Enough. Back to the pier', '⏱️ 十分だ。埠頭へ戻る'),
                    'man_ch3_closing', {}, 'risk',
                    txt('引擎响起来的时候，天开始亮了一点点。', 'When the engine turns over, the sky has begun to lighten.', 'エンジンがかかったとき、空が少し明るくなっていた。'), 'neutral')
            ]
        },

        /* 章末 */
        man_ch3_closing: {
            messages: [
                makeNarrator(txt(
                    '凌晨四点十二分。哈德逊河上有第一班驳船开过去，汽笛长而慢。\n倒计时 00:47:00。',
                    'Four twelve in the morning. The first barge of the day moves up the Hudson, its horn long and slow.\nCounter: 00:47:00.',
                    '午前四時十二分。ハドソン川を最初の艀が通る。汽笛は長く、ゆっくり。\n残り時間 00:47:00。'
                )),
                makeCharacter('stern', txt(
                    '手机响了。不是蓝鸟的频道——是未知号码。\n「雷耶斯小姐。我是诺兰·斯特恩。」\n他的声音出奇地和气，像在给一个孩子念睡前故事。\n「我知道你父亲跳下去的时候，你在楼下等他。你等了四个小时。你母亲后来跟我说，你那天一句话都没说。」',
                    'The phone rings. Not Bluebird\'s channel — an unknown number.\n"Ms Reyes. Nolan Stern."\nHis voice is strangely gentle, like a man reading a bedtime story.\n"I know that when your father went out of that window you waited downstairs. You waited four hours. Your mother told me later that you did not say a single word that day."',
                    '電話が鳴る。ブルーバードの回線ではない——不明な番号。\n「レイエスさん。ノーラン・スターンだ。」\n彼の声は妙に穏やかだ。子供に寝物語を読むよう。\n「君の父が飛び降りたとき、君は下で待っていた。四時間。母君が後で言っていた。あの日、君は一言も口をきかなかった、と。」'
                )),
                makeCharacter('reyes', txt(
                    '「斯特恩先生，我给您四十七分钟。您可以用它打电话给律师，也可以用它想一想：为什么一个开发商会记得一个会计的女儿等了多久。」\n我挂断。然后我做了今晚唯一一件让我自己害怕的事——我把手机关了。\n因为从现在开始，我不打算再听任何人的电话。',
                    '"Mr Stern, I am giving you forty-seven minutes. You can spend them calling your lawyers, or you can spend them considering why a property developer remembers how long an accountant\'s daughter waited downstairs."\nI hang up. Then I do the only thing tonight that frightens me: I switch the phone off.\nBecause from this moment I do not intend to take another call from anyone.',
                    '「スターンさん、四十七分差し上げる。弁護士に電話してもいい。その間にお考えになってもいい——なぜ不動産開発業者が、会計士の娘がどれだけ待ったか覚えているのかを。」\n私は切る。そして今夜唯一、自分が怖いことをする。電話の電源を落とした。\n今から先、誰の電話にも出ないつもりだからだ。'
                ))
            ],
            isTransition: true,
            nextChapter: 'man_ch4'
        }
    },
    startScene: 'man_ch3_hub'
};

/* ========== 第四章：爆破倒计时（04:30） ========== */
var man_ch4 = {
    id: 'man_ch4',
    titleKey: 'manCh4Title',
    subtitleKey: 'manCh4Sub',
    narrator: txt(
        '纽约的凌晨四点半属于两种人：刚下班的，和马上要上新闻的。\n今天我打算是第二种。',
        'Half past four in the morning in New York belongs to two kinds of people: those just off shift, and those about to be on the news.\nToday I intend to be the second kind.',
        'ニューヨークの午前四時半は二種類の者のものだ。仕事を終えた者と、これからニュースに出る者。\n今日私は後者になるつもりだ。'
    ),
    scenes: {
        man_ch4_start: {
            messages: [
                makeNarrator(txt(
                    '码头被警灯照成蓝色。拆除队的车这次真的来了——两台，准时。\n倒计时 00:24:00。\n在我左边是联邦法官签字的冻结令。在我右边是四十一页手写台账和一个指甲盖大的密钥。在我前面是一栋装着尸体的楼。',
                    'The pier is lit blue by patrol lights. This time the demolition crew has really arrived — two trucks, on time.\nCounter: 00:24:00.\nOn my left, a freeze order signed by a federal judge. On my right, forty-one handwritten pages and a key the size of a fingernail. In front of me, a building containing a body.',
                    '埠頭はパトライトに青く照らされている。今度は本物の解体作業車が来た——二台、時間通り。\n残り時間 00:24:00。\n左に、連邦判事が署名した凍結令状。右に、四十一頁の手書き帳簿と爪ほどの鍵。前には、遺体を収めた建物。'
                )),
                makeCharacter('cole', txt(
                    '「玛雅。二十四分钟。」他站在雨里。「你说过一句话我记到现在：时间是最诚实的证人。」',
                    '"Maya. Twenty-four minutes." He stands in the rain. "You once said something I still remember: time is the most honest witness."',
                    '「マヤ。二十四分」彼は雨の中に立つ。「一度君が言った言葉をまだ覚えている。時間は最も正直な証人だ、と。」'
                )),
                makeCharacter('reyes', txt(
                    '「我父亲说的。」',
                    '"My father said that."',
                    '「父の言葉よ。」'
                )),
                makeCharacter('cole', txt(
                    '「那你父亲错了。」他说。「时间不说谎，但它也不替谁出庭。出庭的永远是人。」',
                    '"Then your father was wrong," he says. "Time does not lie, but it never takes the stand for anyone. People take the stand."',
                    '「なら父上は間違っている」と彼。「時間は嘘をつかない。だが誰のためにも証言台に立たない。立つのは人間だ。」'
                ))
            ],
            playerReply: txt(
                '二十四分钟，四种打法。每一种我都能赢一部分，没有一种能让我全身而退。',
                'Twenty-four minutes, four plays. Each one wins me part of this. None of them lets me walk away whole.',
                '二十四分、四つの手。どれも一部は勝てる。どれも無傷では終わらない。'
            ),
            choices: [
                makeChoice(txt('🏛️ 用冻结令把仓库钉住——走法庭这条路', '🏛️ Pin the warehouse with the freeze order — take it through the court', '🏛️ 凍結令状で倉庫を止める——法廷ルート'),
                    'man_ch4_perfect', {}, 'truth',
                    txt('我把令状举过头顶，走向拆除队的工头。', 'I hold the order above my head and walk toward the foreman.', '令状を頭上に掲げ、私は解体班の現場監督へ歩く。'), 'good',
                    { variable: 'man_evidence', operator: '>=', value: 3 }),
                makeChoice(txt('📺 把名单交给记者——让全市在早餐前看到它', '📺 Hand the list to a reporter — let the whole city read it before breakfast', '📺 名簿を記者に渡す——朝食前に全市に読ませる'),
                    'man_ch4_hidden', {}, 'risk',
                    txt('雷蒙德·奥尔特加的号码，我背了六年。', 'I have known Raymond Ortega\'s number by heart for six years.', 'レイモンド・オルテガの番号を六年暗記している。'), 'risk',
                    { variable: 'man_evidence', operator: '>=', value: 3 }),
                makeChoice(txt('🤝 和斯特恩做交易——用他的自由换我父亲的名字', '🤝 Make a deal with Stern — his freedom for my father\'s name', '🤝 スターンと取引——父の名前と彼の自由を交換'),
                    'man_ch4_good', {}, 'caution',
                    txt('我拨回去。他等了我十九分钟。', 'I call back. He has waited nineteen minutes for me.', '私はかけ直す。彼は十九分待っていた。'), 'neutral'),
                makeChoice(txt('🏃 自己冲进去——在爆破前把证据拿出来', '🏃 Go in myself — get the evidence out before the blast', '🏃 自分で突入——爆破前に証拠を持ち出す'),
                    'man_ch4_bad', {}, 'risk',
                    txt('有时候检察官也得跑。', 'Sometimes a prosecutor has to run too.', '検事だって走るときはある。'), 'bad')
            ]
        },

        /* 完美结局 */
        man_ch4_perfect: {
            messages: [
                makeNarrator(txt(
                    '凌晨四点四十一分。拆除队的工头看着令状，说了句："小姐，我只是按单干活。"然后他退后了三步。\n三步之后，仓库还在。',
                    'Four forty-one. The demolition foreman reads the order and says: "Ma\'am, I only work from a work order." Then he steps back three paces.\nAfter three paces, the warehouse is still standing.',
                    '午前四時四十一分。解体班の現場監督は令状を見て言った。「仕事は指示書通りにするだけだ」。そして三步下がる。\n三步下がった後、倉庫はまだ建っている。'
                )),
                makeCharacter('reyes', txt(
                    '上午九点零七分，我把二十一行名单当庭提交。主审法官不是哈洛威——她主动回避了。\n十点十五分，联邦检察官办公室宣布成立特别调查组。\n十一点零二分，诺兰·斯特恩在他的竞选总部被带走。他西装的第二颗扣子没扣好——这是他十一年来第一次在镜头前失态。',
                    'At nine-oh-seven I file the twenty-one-line list in open court. The presiding judge is not Halloway — she recused herself.\nAt ten fifteen the US Attorney announces a special investigation unit.\nAt eleven-oh-two Nolan Stern is taken from his campaign headquarters. The second button of his jacket is undone — the first time in eleven years he has looked wrong on camera.',
                    '午前九時七分、二十一行の名簿を法廷に提出。裁判長はハロウェイではない——彼女は自ら回避した。\n十時十五分、連邦検事局は特別調査班の設置を発表。\n十一時二分、ノーラン・スターンは選挙本部で連行された。上着の第二ボタンが留まっていない——十一年で初めて、彼はカメラの前で崩れた。'
                )),
                makeNarrator(txt(
                    '解密后的名单第十一行写着：H. R. — 金额 2,400,000 — 状态：拒签。\n附件是他写给我的一封信，日期是他死前三天：「玛雅，他们说这是一份普通的年度报表。它不是。有人把它签成了别人的债。」\n市政厅把哈维尔·雷耶斯的档案从"自杀"改成了"他杀，嫌疑人在逃"。改一个字，用了十一年。\n科尔在听证会上作证四十一页台账，然后主动交出了他的警徽。法官没有接受——她说：本庭需要有人记得他们是怎么进来的。\n下午三点，我站在法院台阶上。记者问我：雷耶斯检察官，你赢了什么？\n我说：我赢回了四个小时。我十岁那年等的那四个小时，今天终于有人来解释了。',
                    'Line eleven, once decrypted, reads: H. R. — 2,400,000 — status: REFUSED.\nAttached is a letter he wrote to me three days before he died: "Maya, they say this is an ordinary annual return. It is not. Someone signed it into another man\'s debt."\nCity Hall changes Javier Reyes\'s file from suicide to homicide, suspect at large. One word, eleven years in the changing.\nCole testifies to forty-one pages of ledger and then offers his badge. The judge refuses to accept it, saying: this court needs someone who remembers how it all got in.\nAt three in the afternoon I stand on the courthouse steps. A reporter asks: AUSA Reyes, what did you win?\nI say: I won back four hours. The four hours I waited when I was ten — today, at last, someone explained them.',
                    '解錠された11行目にはこうある。H. R. ―― 2,400,000 ―― 状態：署名拒否。\n添付されていたのは、彼が死の三日前に私へ書いた手紙。「マヤ、彼らはこれが通常の年度報告だと言う。違う。誰かがこれを他人の借金として署名した。」\n市庁舎はハビエル・レイエスの記録を「自殺」から「他殺、容疑者逃走中」に書き換えた。一文字のために十一年。\nコールは公聴会で四十一頁の帳簿について証言し、自らバッジを差し出した。判事は受け取らない。こう言った。法廷には、これがどうやって入ってきたか覚えている者が必要です。\n午後三時、私は裁判所の階段に立つ。記者が訊く。レイエス検事、何を勝ち取った？\n私は答える。四時間を取り戻した。十歳のときに待ったあの四時間を。今日、ようやく誰かが説明してくれた。'
                ))
            ],
            isEnding: true, endingId: 'perfect_man', endingTitleKey: 'manEndingPerfectTitle', endingDescKey: 'manEndingPerfectDesc', endingIcon: '⚖️'
        },

        /* 隐藏结局 */
        man_ch4_hidden: {
            messages: [
                makeNarrator(txt(
                    '凌晨四点四十四分，我把全部二十一行发给《纽约纪事报》的雷蒙德·奥尔特加，附了一条要求：五点半之前不要发。\n五点零一分，仓库按原计划被炸。我在两百米外看着它塌下去——那具尸体永远不会被找到了。\n但我手里有二十一行，和四十一页台账。',
                    'At four forty-four I send all twenty-one lines to Raymond Ortega of the New York Chronicle, with one condition: do not publish before five thirty.\nAt five-oh-one the warehouse comes down on schedule. I watch it collapse from two hundred metres — that body will never be recovered.\nBut I hold twenty-one lines and forty-one pages.',
                    '午前四時四十四分、二十一行のすべてを『ニューヨーク・クロニクル』のレイモンド・オルテガに送る。条件は一つ。五時半まで公開しないこと。\n五時一分、倉庫は予定通り爆破された。二百メートル離れて崩れるのを見た——あの遺体はもう決して見つからない。\nだが私の手には二十一行と四十一頁がある。'
                )),
                makeCharacter('halloway', txt(
                    '上午七点，她打电话来。只说了一句：\n「玛雅，你把我也发出去了。」',
                    'At seven she calls. She says only one thing:\n"Maya, you published me as well."',
                    '午前七時、彼女から電話が来る。一言だけ。\n「マヤ、私も載せたのね。」'
                )),
                makeCharacter('reyes', txt(
                    '「是的，法官。第四行写着 I. H.，一千八百六十万。」',
                    '"Yes, Your Honour. Line four reads I. H., eighteen million six hundred thousand."',
                    '「はい、判事。四行目に I. H.、一千八百六十万。」'
                )),
                makeCharacter('halloway', txt(
                    '电话那头沉默了七秒。「我签过你的冻结令。」',
                    'Seven seconds of silence. "I signed your freeze order."',
                    '七秒の沈黙。「私はあなたの凍結令状に署名した。」'
                )),
                makeCharacter('reyes', txt(
                    '「我知道。所以我等到了五点半。」',
                    '"I know. That is why I waited until five thirty."',
                    '「知っています。だから五時半まで待った。」'
                )),
                makeNarrator(txt(
                    '早上六点，报道上线。标题是《二十一行》。\n到中午，市议会有四名议员辞职，两名州议员被联邦起诉，复兴基金被冻结。诺兰·斯特恩在下午的新闻发布会上说了一句："这是一场政治猎巫。"\n三天后，艾达·哈洛威法官申请退休，理由栏写着"健康原因"。她是三十一年来第一位在自己签过字的法庭上被弹劾的联邦法官。\n我被调去一个只有四个人的小组，负责整理此案的证据编号。没有升职，没有头版。\n第九个月的一个下午，一个年轻人来找我。她说她父亲在名单第七行。她说：雷耶斯检察官，我不是来谢你的。我是来告诉你，我也要当检察官。\n在纽约，这才是最好的结局：不是你赢了，是有人接着上场。',
                    'At six the story goes live. The headline is Twenty-One Lines.\nBy noon four city councillors have resigned, two state legislators are indicted federally, the Renewal Fund is frozen. Nolan Stern says at an afternoon press conference: "This is a political witch hunt."\nThree days later Judge Ida Halloway applies to retire, citing health. She is the first federal judge in thirty-one years to be impeached in a courtroom she once signed orders for.\nI am reassigned to a four-person team indexing the evidence in this case. No promotion. No front page.\nOne afternoon in the ninth month, a young woman comes to see me. Her father is line seven. She says: AUSA Reyes, I did not come to thank you. I came to tell you I am going to be a prosecutor too.\nIn New York that is the best ending there is: not that you won, but that somebody stepped up next.',
                    '午前六時、記事が公開された。見出しは『二十一行』。\n昼までに市議四名が辞職、州議二名が連邦で起訴、再生基金は凍結。ノーラン・スターンは午後の会見でこう言った。「これは政治的な魔女狩りだ」。\n三日後、アイダ・ハロウェイ判事は退職を申請した。理由欄は「健康上の理由」。三十一年で初めて、自分が署名した法廷で弾劾された連邦判事となった。\n私は四人だけの証拠番号整理班へ回された。昇進なし、一面記事なし。\n九ヶ月目の午後、若い女性が訪ねて来た。父は七行目だと言う。こう言った。レイエス検事、礼を言いに来たんじゃない。私も検事になると伝えに来た。\nニューヨークでは、これが最高の結末だ。あなたが勝つことではない。次に誰かが立つことだ。'
                ))
            ],
            isEnding: true, endingId: 'hidden_man', endingTitleKey: 'manEndingHiddenTitle', endingDescKey: 'manEndingHiddenDesc', endingIcon: '📰'
        },

        /* 好结局 */
        man_ch4_good: {
            messages: [
                makeNarrator(txt(
                    '我拨回去。他等了我十九分钟——十九分钟，说明他真的在考虑。',
                    'I call back. He has waited nineteen minutes — nineteen minutes means he was genuinely considering it.',
                    '私はかけ直す。彼は十九分待っていた——十九分、つまり本気で考えていた。'
                )),
                makeCharacter('stern', txt(
                    '「雷耶斯小姐。」他说。「你可以冻结那栋楼。但楼里的东西会在四十八小时后被一辆卡车运走，卡车属于一家在开曼注册的公司。」',
                    '"Ms Reyes," he says. "You can freeze the building. But what is inside it will be trucked out in forty-eight hours by a company registered in the Caymans."',
                    '「レイエスさん」と彼。「君はあの建物を凍結できる。だが中の物は四十八時間後にトラックで運ばれる。トラックはケイマン登記の会社のものだ。」'
                )),
                makeCharacter('reyes', txt(
                    '「那我要你取消运输单。」',
                    '"Then cancel the transport order."',
                    '「ならその輸送指示を取り消して。」'
                )),
                makeCharacter('stern', txt(
                    '「我可以。作为交换，你要的东西我给你一件：你父亲的签字页。」',
                    '"I can. In exchange I will give you one of the things you want: your father\'s signature page."',
                    '「いいだろう。交換に、君が欲しいものを一つ渡す。父君の署名頁だ。」'
                )),
                makeCharacter('stern', txt(
                    '「哈维尔·雷耶斯拒签。这是我在十一年里学到的唯一一件事：有些人真的不肯。」\n他把文件推过来。「他不是被我杀的。他是被我的一个合伙人杀的——那个人现在在巴西，他儿子是我的竞选经理。」\n「你要我把这个人交出去。」\n「我要你把名单上除了我以外的二十个人交出去。作为交换，我以污点证人身份作证。」',
                    '"Javier Reyes refused to sign. That is the only thing I have learned in eleven years: some people genuinely will not."\nHe slides the document across. "I did not kill him. One of my partners did — that man is in Brazil now, and his son runs my campaign."\n"You want me to hand that man over."\n"I want you to hand over the twenty names on that list that are not mine. In exchange I testify as a cooperating witness."',
                    '「ハビエル・レイエスは署名を拒んだ。十一年で私が学んだのはそれだけだ。本当に肯んじない人間がいる。」\n彼は書類を押し出す。「彼を殺したのは私じゃない。共同経営者の一人だ——今はブラジルにいる。その息子が私の選挙対策本部長だ。」\n「その男を差し出せと。」\n「名簿のうち、私以外の二十人を差し出せ。交換に、私は協力証人として証言する。」'
                )),
                makeNarrator(txt(
                    '交易成立。仓库被冻结，名单被扣押，十九人被起诉，复兴基金被接管。\n诺兰·斯特恩以污点证人身份获得部分豁免，最终被判四年，在一家最低安全级别的联邦营地服刑。他出狱那天，有两个记者在门口等他。\n我的父亲拿到了"拒签"两个字，但档案上"死因"那一栏写着：未结案。\n我升了职，成了办公室里最年轻的组长。同事们叫我"那个四小时的女人"。\n只有科尔知道，我用二十个人的刑期，换了一个人的名字。\n他在我升职那天递给我一杯咖啡，说：玛雅，这是法律。它不是正义，它是法律。\n我说：我知道。这就是我今晚为什么睡不着。',
                    'The deal is struck. The warehouse is frozen, the list seized, nineteen people indicted, the Renewal Fund placed in receivership.\nNolan Stern receives partial immunity as a cooperating witness, is sentenced to four years, and serves it at a minimum-security federal camp. Two reporters wait at the gate the day he walks out.\nMy father gets the word REFUSED, but the cause-of-death column still reads: open.\nI am promoted, the youngest unit chief in the office. My colleagues call me the four-hour woman.\nOnly Cole knows that I traded twenty people\'s sentences for one man\'s name.\nOn the day of my promotion he hands me a coffee and says: Maya, this is the law. It is not justice. It is the law.\nI know, I say. That is why I will not sleep tonight.',
                    '取引は成立した。倉庫は凍結、名簿は押収、十九名が起訴、再生基金は管理下に。\nノーラン・スターンは協力証人として一部免責を得て、懲役四年。最低警備の連邦施設で服役した。出所の日、記者が二人門で待っていた。\n父には「署名拒否」の二文字が与えられた。だが死因欄には「未解決」とある。\n私は昇進し、局で最年少の班長になった。同僚は私を「四時間の女」と呼ぶ。\n二十人の刑期と、一人の名前を交換したことを知っているのはコールだけだ。\n昇進の日、彼はコーヒーを差し出して言った。マヤ、これは法だ。正義じゃない。法だ。\n分かってると私は言った。だから今夜、眠れない。'
                ))
            ],
            isEnding: true, endingId: 'good_man', endingTitleKey: 'manEndingGoodTitle', endingDescKey: 'manEndingGoodDesc', endingIcon: '🌃'
        },

        /* 坏结局 */
        man_ch4_bad: {
            messages: [
                makeNarrator(txt(
                    '我跑了。从围栏缺口跑进去，跑过那块没干透的水泥，跑到尸体旁边。\n然后我听见第一声爆破预警——不是五点，是四点五十一分。他们提前了九分钟。\n科尔在门外喊我的名字。他喊了三遍。第三遍的时候，我被他拽了出去。',
                    'I run. Through the gap in the fence, across the uncured concrete, to the body.\nThen I hear the first blast warning — not five o\'clock, four fifty-one. They moved it up nine minutes.\nCole shouts my name from outside the door. Three times. On the third I am dragged out by him.',
                    '私は走った。フェンスの隙間から入り、乾いていないコンクリートを越え、遺体の傍まで。\nそして最初の爆破予告が聞こえた——五時ではない、四時五十一分。九分繰り上げられた。\nコールが扉の外で私の名を叫ぶ。三度。三度目に、彼に引きずり出された。'
                )),
                makeCharacter('reyes', txt(
                    '「手！」我喊。「他的手还在外面！」\n仓库在四秒之后塌下去。水泥、铁皮、二十一年的账，全部变成一层灰。\n科尔按住我，不让我再进去。我咬了他的手臂，他没松手。\n这是他这辈子对我做过最正确的一件事。',
                    '"His hand!" I shout. "His hand is still out there!"\nFour seconds later the warehouse comes down. Concrete, corrugated iron, twenty-one years of accounts, all of it becomes a layer of dust.\nCole holds me down and will not let me go back in. I bite his arm. He does not let go.\nIt is the single most correct thing he has ever done to me.',
                    '「手！」私は叫ぶ。「彼の手がまだ外に！」\n四秒後、倉庫が崩れた。コンクリート、鉄板、二十一年分の帳簿、すべてが一層の灰になった。\nコールは私を押さえ、戻らせない。私は彼の腕に噛みつく。彼は離さない。\n彼が私にした最も正しい行為だった。'
                )),
                makeNarrator(txt(
                    '早上六点，雷蒙德·奥尔特加发来一条消息：蓝鸟不回话了。\n上午十点，卡莉·陈被公司以"违反保密协议"解雇；她的公寓在当天下午退租，此后没有任何记录。\n诺兰·斯特恩在十一月当选市长。就职演说里有一句：这座城市需要的不是更多的诉讼，而是更多的建设。\n我父亲的表，现在在四米厚的混凝土下面。\n我在办公室坐了七个月，然后申请了半年的无薪假。批假的人问我打算做什么。\n我说：我想去学一下，怎么在没有人给我发消息的时候，自己找到尸体。\n在纽约，最坏的不是输掉。最坏的是你明明站在门口，却差了九分钟。',
                    'At six in the morning Raymond Ortega texts: Bluebird has stopped answering.\nAt ten, Callie Chen is dismissed by the company for breach of confidentiality; her apartment is vacated that afternoon and there is no record of her afterwards.\nNolan Stern is elected mayor in November. His inaugural address contains one line: what this city needs is not more litigation but more construction.\nMy father\'s watch now lies under four metres of concrete.\nI sit at my desk for seven months, then apply for six months of unpaid leave. The person who approves it asks what I intend to do.\nI say: I want to learn how to find a body myself, on the nights when nobody sends me a message.\nIn New York the worst thing is not losing. The worst thing is standing at the door and being nine minutes short.',
                    '午前六時、レイモンド・オルテガから連絡が来る。ブルーバードが応答しない。\n午前十時、カーリー・チェンは「秘密保持義務違反」で解雇。彼女のアパートはその午後に退去、以降記録はない。\nノーラン・スターンは十一月、市長に当選した。就任演説に一文ある。この街に必要なのは訴訟ではない、建設だ。\n父の時計は今、四メートルのコンクリートの下。\n私は七ヶ月机に座り、半年の無給休暇を申請した。承認した者が何をするつもりかと訊く。\n私は言った。誰も知らせを寄越さない夜に、自分で遺体を見つける方法を学びたい。\nニューヨークで最悪なのは負けることじゃない。扉の前に立ちながら、九分足りないことだ。'
                ))
            ],
            isEnding: true, endingId: 'bad_man', endingTitleKey: 'manEndingBadTitle', endingDescKey: 'manEndingBadDesc', endingIcon: '💥'
        }
    },
    startScene: 'man_ch4_start'
};

window.STORY_CHAPTERS.push(man_ch1, man_ch2, man_ch3, man_ch4);

if (window.CHARACTERS) {
    Object.assign(window.CHARACTERS, {
        reyes: character_reyes,
        cole: character_cole,
        halloway: character_halloway,
        stern: character_stern,
        bluebird: character_bluebird
    });
}
