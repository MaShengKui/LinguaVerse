/* ============================================================
   LinguaVerse 课程数据库
   英语 / 日语 / 韩语 · CEFR A1-C2 分级体系
============================================================ */
window.LV_DATA = (function () {

const LANGS = {
  en: { code:'en', name:'英语', native:'English', flag:'🇬🇧', bcp47:'en-US', cls:'en',
        desc:'全球通用语，从日常会话到商务表达' },
  ja: { code:'ja', name:'日语', native:'日本語', flag:'🇯🇵', bcp47:'ja-JP', cls:'ja',
        desc:'五十音起步，掌握动漫、旅行与职场日语' },
  ko: { code:'ko', name:'韩语', native:'한국어', flag:'🇰🇷', bcp47:'ko-KR', cls:'ko',
        desc:'从韩文字母到 K-Culture 沉浸式表达' },
};
const LEVELS = [
  { code:'A1', name:'入门', desc:'能理解并使用日常基本表达' },
  { code:'A2', name:'基础', desc:'能就熟悉的日常话题进行简单交流' },
  { code:'B1', name:'进阶', desc:'能应对旅行中多数场景，表达观点' },
  { code:'B2', name:'中高', desc:'能流畅互动，理解较复杂文本主旨' },
  { code:'C1', name:'高级', desc:'能灵活有效地运用语言于学术职场' },
  { code:'C2', name:'精通', desc:'接近母语者的综合驾驭能力' },
];

/* ---------------- 课程路径（每语言 18 节） ---------------- */
const COURSES = {
  en: [
    { level:'A1', title:'见面与问候', desc:'Hello / Goodbye / 自我介绍', type:'vocab', icon:'👋', xp:15 },
    { level:'A1', title:'数字与时间', desc:'听懂数字、日期与整点表达', type:'listening', icon:'🔢', xp:15 },
    { level:'A1', title:'Be 动词句型', desc:'I am / You are / He is', type:'grammar', icon:'📐', xp:15 },

    { level:'A2', title:'饮食日常', desc:'餐厅点餐与食物词汇', type:'vocab', icon:'🍔', xp:18 },
    { level:'A2', title:'一般现在时', desc:'描述习惯与日常作息', type:'grammar', icon:'⏰', xp:18 },
    { level:'A2', title:'购物情景跟读', desc:'How much is this? 实战开口', type:'speaking', icon:'🛍️', xp:18 },

    { level:'B1', title:'旅行与交通', desc:'机场、酒店与问路', type:'vocab', icon:'✈️', xp:22 },
    { level:'B1', title:'现在进行与过去时', desc:'正在发生 & 已经发生', type:'grammar', icon:'🔄', xp:22 },
    { level:'B1', title:'新闻短句听力', desc:'抓取关键信息与数字', type:'listening', icon:'📰', xp:22 },

    { level:'B2', title:'观点表达词汇', desc:'agree / argue / suggest', type:'vocab', icon:'💭', xp:26 },
    { level:'B2', title:'现在完成时', desc:'Have you ever…? 精讲', type:'grammar', icon:'✅', xp:26 },
    { level:'B2', title:'辩论式跟读', desc:'有理有据地表达立场', type:'speaking', icon:'🎤', xp:26 },

    { level:'C1', title:'商务职场词', desc:'negotiate / deadline / review', type:'vocab', icon:'💼', xp:30 },
    { level:'C1', title:'虚拟语气', desc:'If I were you… 假设与愿望', type:'grammar', icon:'🌗', xp:30 },
    { level:'C1', title:'演讲听力精听', desc:'TED 风格长句与逻辑词', type:'listening', icon:'🎧', xp:30 },

    { level:'C2', title:'学术写作词汇', desc:'地道学术搭配与正式语体', type:'vocab', icon:'📚', xp:35 },
    { level:'C2', title:'倒装与强调', desc:'Rarely have I… 高阶句式', type:'grammar', icon:'✨', xp:35 },
    { level:'C2', title:'母语级影子跟读', desc:'语调、连读与弱读综合训练', type:'speaking', icon:'👑', xp:35 },
  ],
  ja: [
    { level:'A1', title:'五十音与问候', desc:'あいうえお 与基本寒暄', type:'vocab', icon:'🌸', xp:15 },
    { level:'A1', title:'数字与价格', desc:'ひとつ〜ひゃく 听辨训练', type:'listening', icon:'🔢', xp:15 },
    { level:'A1', title:'です／ます 体', desc:'日语礼貌体入门', type:'grammar', icon:'📐', xp:15 },

    { level:'A2', title:'寿司店词汇', desc:'寿司、拉面与点餐用语', type:'vocab', icon:'🍣', xp:18 },
    { level:'A2', title:'て形变形', desc:'动词て形与「〜てください」', type:'grammar', icon:'🔄', xp:18 },
    { level:'A2', title:'便利店跟读', desc:'いらっしゃいませ 场景对话', type:'speaking', icon:'🏪', xp:18 },

    { level:'B1', title:'东京旅行词汇', desc:'交通、住宿与观光', type:'vocab', icon:'🗼', xp:22 },
    { level:'B1', title:'た形与过去时', desc:'昨日〜ました 表达过去', type:'grammar', icon:'⏳', xp:22 },
    { level:'B1', title:'车站广播听力', desc:'快速听懂列车与广播', type:'listening', icon:'🚆', xp:22 },

    { level:'B2', title:'情感与意见', desc:'嬉しい・残念・思います', type:'vocab', icon:'💭', xp:26 },
    { level:'B2', title:'条件形 ば／たら', desc:'如果…就… 的四种假设', type:'grammar', icon:'🌗', xp:26 },
    { level:'B2', title:'动漫台词跟读', desc:'感情饱满的角色对白', type:'speaking', icon:'🎬', xp:26 },

    { level:'C1', title:'敬语入门', desc:'尊敬语・謙譲語・丁寧語', type:'vocab', icon:'🧧', xp:30 },
    { level:'C1', title:'受身与使役', desc:'される・させる 高阶动词', type:'grammar', icon:'⚙️', xp:30 },
    { level:'C1', title:'新闻速听', desc:'NHK 风格新闻精听', type:'listening', icon:'📰', xp:30 },

    { level:'C2', title:'商务熟语', desc:'お世話になっております', type:'vocab', icon:'💼', xp:35 },
    { level:'C2', title:'嵌套长句解析', desc:'多重修饰的学术长句', type:'grammar', icon:'📚', xp:35 },
    { level:'C2', title:'落語语速跟读', desc:' native 级节奏与语调', type:'speaking', icon:'👑', xp:35 },
  ],
  ko: [
    { level:'A1', title:'韩文字母入门', desc:'한글 元音辅音与问候', type:'vocab', icon:'🪁', xp:15 },
    { level:'A1', title:'数字两套体系', desc:'汉字数词与固有数词', type:'listening', icon:'🔢', xp:15 },
    { level:'A1', title:'입니다／이에요', desc:'韩语基本判断句', type:'grammar', icon:'📐', xp:15 },

    { level:'A2', title:'韩式美食词汇', desc:'비빔밥・치킨・커피', type:'vocab', icon:'🍲', xp:18 },
    { level:'A2', title:'을/를 与助词', desc:'宾语助词与语序', type:'grammar', icon:'🧩', xp:18 },
    { level:'A2', title:'咖啡店跟读', desc:'주문할게요 点单实战', type:'speaking', icon:'☕', xp:18 },

    { level:'B1', title:'首尔旅行词汇', desc:'地铁、购物与砍价', type:'vocab', icon:'🏙️', xp:22 },
    { level:'B1', title:'过去式 았/었', desc:'했어요・먹었어요', type:'grammar', icon:'⏳', xp:22 },
    { level:'B1', title:'韩剧对白听力', desc:'日常对话速听速记', type:'listening', icon:'📺', xp:22 },

    { level:'B2', title:'情绪与态度', desc:'좋아하다・걱정하다', type:'vocab', icon:'💭', xp:26 },
    { level:'B2', title:'未来与推测', desc:'-(으)ㄹ 거예요', type:'grammar', icon:'🔮', xp:26 },
    { level:'B2', title:'K-pop 跟唱', desc:'副歌经典句节奏跟读', type:'speaking', icon:'🎵', xp:26 },

    { level:'C1', title:'职场韩语文档', desc:'회의・보고서・일정', type:'vocab', icon:'💼', xp:30 },
    { level:'C1', title:'敬语体系对比', desc:'합니다体与해요体切换', type:'grammar', icon:'🎩', xp:30 },
    { level:'C1', title:'新闻播报精听', desc:'正式语体与连接词尾', type:'listening', icon:'📰', xp:30 },

    { level:'C2', title:'惯用语与俗语', desc:'속담 地道表达', type:'vocab', icon:'📜', xp:35 },
    { level:'C2', title:'间接引语', desc:'-냬요・-대요 高阶转述', type:'grammar', icon:'🌀', xp:35 },
    { level:'C2', title:'脱口秀跟读', desc:'native 语速与语气词', type:'speaking', icon:'👑', xp:35 },
  ],
};

/* ---------------- 单词库 ----------------
   w 目标词 | en: uk/us 英式美式音标 | ja/ko: r 读音(假名/罗马音) | t 中文 | ex 例句 | exT 例句翻译 */
const VOCAB = {
  en: [
    {w:'hello', uk:'/həˈləʊ/', us:'/həˈloʊ/', t:'你好', ex:'Hello, nice to meet you!', exT:'你好，很高兴认识你！'},
    {w:'goodbye', uk:'/ˌɡʊdˈbaɪ/', us:'/ˌɡʊdˈbaɪ/', t:'再见', ex:'Goodbye, see you tomorrow.', exT:'再见，明天见。'},
    {w:'friend', uk:'/frend/', us:'/frend/', t:'朋友', ex:'She is my best friend.', exT:'她是我最好的朋友。'},
    {w:'water', uk:'/ˈwɔːtə/', us:'/ˈwɔːtər/', t:'水', ex:'Can I have a glass of water?', exT:'能给我一杯水吗？'},
    {w:'breakfast', uk:'/ˈbrekfəst/', us:'/ˈbrekfəst/', t:'早餐', ex:'I have eggs for breakfast.', exT:'我早餐吃鸡蛋。'},
    {w:'delicious', uk:'/dɪˈlɪʃəs/', us:'/dɪˈlɪʃəs/', t:'美味的', ex:'This soup is delicious.', exT:'这汤很美味。'},
    {w:'expensive', uk:'/ɪkˈspensɪv/', us:'/ɪkˈspensɪv/', t:'昂贵的', ex:'The hotel was too expensive.', exT:'这家酒店太贵了。'},
    {w:'discount', uk:'/ˈdɪskaʊnt/', us:'/ˈdɪskaʊnt/', t:'折扣', ex:'Is there any discount?', exT:'有折扣吗？'},
    {w:'airport', uk:'/ˈeəpɔːt/', us:'/ˈerpɔːrt/', t:'机场', ex:'The airport is far away.', exT:'机场很远。'},
    {w:'ticket', uk:'/ˈtɪkɪt/', us:'/ˈtɪkɪt/', t:'票', ex:'I bought a train ticket.', exT:'我买了一张火车票。'},
    {w:'reservation', uk:'/ˌrezəˈveɪʃn/', us:'/ˌrezərˈveɪʃn/', t:'预订', ex:'I have a reservation for two.', exT:'我预订了两人位。'},
    {w:'suggest', uk:'/səˈdʒest/', us:'/səˈdʒest/', t:'建议', ex:'I suggest we leave early.', exT:'我建议我们早点出发。'},
    {w:'however', uk:'/haʊˈevə/', us:'/haʊˈevər/', t:'然而', ex:'It was cold; however, we went out.', exT:'天很冷，然而我们还是出门了。'},
    {w:'negotiate', uk:'/nɪˈɡəʊʃieɪt/', us:'/nɪˈɡoʊʃieɪt/', t:'谈判', ex:'We need to negotiate the price.', exT:'我们需要协商价格。'},
    {w:'deadline', uk:'/ˈdedlaɪn/', us:'/ˈdedlaɪn/', t:'截止日期', ex:'The deadline is next Monday.', exT:'截止日期是下周一。'},
    {w:'significant', uk:'/sɪɡˈnɪfɪkənt/', us:'/sɪɡˈnɪfɪkənt/', t:'重要的', ex:'This is a significant change.', exT:'这是一项重大变化。'},
    {w:'analyze', uk:'/ˈænəlaɪz/', us:'/ˈænəlaɪz/', t:'分析', ex:'We analyze the data carefully.', exT:'我们仔细分析数据。'},
    {w:'consequently', uk:'/ˈkɒnsɪkwəntli/', us:'/ˈkɑːnsɪkwentli/', t:'因此', ex:'He worked hard and consequently succeeded.', exT:'他努力工作，因此成功了。'},
    {w:'nevertheless', uk:'/ˌnevəðəˈles/', us:'/ˌnevərðəˈles/', t:'尽管如此', ex:'It was raining; nevertheless, we arrived.', exT:'下着雨，尽管如此我们还是到了。'},
    {w:'comprehensive', uk:'/ˌkɒmprɪˈhensɪv/', us:'/ˌkɑːmprɪˈhensɪv/', t:'全面的', ex:'She gave a comprehensive report.', exT:'她做了一份全面的报告。'},
    {w:'morning', uk:'/ˈmɔːnɪŋ/', us:'/ˈmɔːrnɪŋ/', t:'早晨', ex:'I drink coffee every morning.', exT:'我每天早上喝咖啡。'},
    {w:'school', uk:'/skuːl/', us:'/skuːl/', t:'学校', ex:'The children walk to school.', exT:'孩子们步行去上学。'},
    {w:'weather', uk:'/ˈweðə/', us:'/ˈweðər/', t:'天气', ex:'The weather is nice today.', exT:'今天天气不错。'},
    {w:'understand', uk:'/ˌʌndəˈstænd/', us:'/ˌʌndərˈstænd/', t:'理解', ex:'I understand what you mean.', exT:'我明白你的意思。'},
  ],
  ja: [
    {w:'こんにちは', r:'konnichiwa', t:'你好（白天）', ex:'こんにちは、はじめまして。', exT:'你好，初次见面。'},
    {w:'ありがとう', r:'arigatou', t:'谢谢', ex:'どうもありがとうございます。', exT:'非常感谢。'},
    {w:'さようなら', r:'sayounara', t:'再见', ex:'さようなら、また明日。', exT:'再见，明天见。'},
    {w:'水', r:'みず mizu', t:'水', ex:'水を一つください。', exT:'请给我一杯水。'},
    {w:'朝ごはん', r:'あさごはん asagohan', t:'早餐', ex:'朝ごはんに卵を食べます。', exT:'早餐吃鸡蛋。'},
    {w:'おいしい', r:'oishii', t:'美味的', ex:'このラーメンはおいしいです。', exT:'这拉面很好吃。'},
    {w:'高い', r:'takai', t:'昂贵的／高的', ex:'このカメラは高いです。', exT:'这台相机很贵。'},
    {w:'割引', r:'わりびき waribiki', t:'折扣', ex:'割引はありますか。', exT:'有折扣吗？'},
    {w:'空港', r:'くうこう kuukou', t:'机场', ex:'空港まで電車で行きます。', exT:'坐电车去机场。'},
    {w:'切符', r:'きっぷ kippu', t:'票', ex:'切符を二枚買いました。', exT:'买了两张票。'},
    {w:'予約', r:'よやく yoyaku', t:'预订', ex:'予約をお願いします。', exT:'请帮我预订。'},
    {w:'賛成', r:'さんせい sansei', t:'赞成', ex:'その意見に賛成です。', exT:'我赞成那个意见。'},
    {w:'しかし', r:'shikashi', t:'然而', ex:'しかし、問題があります。', exT:'然而，有个问题。'},
    {w:'交渉', r:'こうしょう koushou', t:'谈判', ex:'価格を交渉します。', exT:'协商价格。'},
    {w:'締め切り', r:'しめきり shimekiri', t:'截止日期', ex:'締め切りは月曜日です。', exT:'截止日期是周一。'},
    {w:'重要', r:'じゅうよう juuyou', t:'重要的', ex:'これは重要な会議です。', exT:'这是重要的会议。'},
    {w:'分析', r:'ぶんせき bunseki', t:'分析', ex:'データを分析します。', exT:'分析数据。'},
    {w:'そのため', r:'sonotame', t:'因此', ex:'そのため、対策が必要です。', exT:'因此需要对策。'},
    {w:'それでも', r:'soredemo', t:'尽管如此', ex:'雨です。それでも出かけます。', exT:'在下雨，尽管如此还是要出门。'},
    {w:'包括的', r:'ほうかつてき houkatsuteki', t:'全面的', ex:'包括的な計画を立てる。', exT:'制定全面的计划。'},
    {w:'学校', r:'がっこう gakkou', t:'学校', ex:'子供たちは学校へ行きます。', exT:'孩子们去学校。'},
    {w:'天気', r:'てんき tenki', t:'天气', ex:'今日は天気がいいです。', exT:'今天天气好。'},
    {w:'分かる', r:'わかる wakaru', t:'明白', ex:'意味が分かりますか。', exT:'明白意思吗？'},
    {w:'駅', r:'えき eki', t:'车站', ex:'駅はどこですか。', exT:'车站在哪里？'},
  ],
  ko: [
    {w:'안녕하세요', r:'annyeonghaseyo', t:'你好', ex:'안녕하세요, 만나서 반갑습니다.', exT:'你好，见到你很高兴。'},
    {w:'감사합니다', r:'gamsahamnida', t:'谢谢', ex:'정말 감사합니다.', exT:'真的非常感谢。'},
    {w:'안녕히 가세요', r:'annyeonghi gaseyo', t:'再见（对离开者）', ex:'내일 봐요, 안녕히 가세요.', exT:'明天见，慢走。'},
    {w:'물', r:'mul', t:'水', ex:'물 한 잔 주세요.', exT:'请给我一杯水。'},
    {w:'아침', r:'achim', t:'早晨／早餐', ex:'아침에 커피를 마셔요.', exT:'早上喝咖啡。'},
    {w:'맛있다', r:'masitda', t:'好吃', ex:'이 비빔밥 맛있어요.', exT:'这拌饭很好吃。'},
    {w:'비싸다', r:'bissada', t:'昂贵的', ex:'이 가방은 비싸요.', exT:'这个包很贵。'},
    {w:'할인', r:'harin', t:'折扣', ex:'할인돼요?', exT:'有折扣吗？'},
    {w:'공항', r:'gonghang', t:'机场', ex:'공항까지 얼마나 걸려요?', exT:'到机场要多久？'},
    {w:'표', r:'pyo', t:'票', ex:'표 두 장 주세요.', exT:'请给我两张票。'},
    {w:'예약', r:'yeyak', t:'预订', ex:'예약했는데요.', exT:'我有预订。'},
    {w:'동의하다', r:'donguihada', t:'同意', ex:'그 의견에 동의해요.', exT:'我同意那个意见。'},
    {w:'하지만', r:'hajiman', t:'但是', ex:'하지만 걱정돼요.', exT:'但是我很担心。'},
    {w:'협상', r:'hyeopsang', t:'谈判', ex:'가격을 협상해요.', exT:'协商价格。'},
    {w:'마감일', r:'magamnil', t:'截止日期', ex:'마감일이 월요일이에요.', exT:'截止日期是周一。'},
    {w:'중요하다', r:'jungyohada', t:'重要的', ex:'중요한 회의예요.', exT:'是重要的会议。'},
    {w:'분석', r:'bunseok', t:'分析', ex:'데이터를 분석해요.', exT:'分析数据。'},
    {w:'그래서', r:'geuraeseo', t:'所以', ex:'그래서 일찍 출발해요.', exT:'所以早点出发。'},
    {w:'그럼에도', r:'geuremedo', t:'尽管如此', ex:'그럼에도 불구하고 해냈어요.', exT:'尽管如此还是做到了。'},
    {w:'종합적', r:'jonghapjeok', t:'综合的', ex:'종합적인 보고서예요.', exT:'是一份综合报告。'},
    {w:'학교', r:'hakgyo', t:'学校', ex:'아이들이 학교에 가요.', exT:'孩子们去学校。'},
    {w:'날씨', r:'nalssi', t:'天气', ex:'오늘 날씨가 좋아요.', exT:'今天天气好。'},
    {w:'알다', r:'alda', t:'知道', ex:'무슨 뜻인지 알아요?', exT:'知道是什么意思吗？'},
    {w:'역', r:'yeok', t:'车站', ex:'역이 어디예요?', exT:'车站在哪里？'},
  ],
};

/* ---------------- 语法题库 ----------------
   q 题干 | options | answer 正确下标 | tip 解析 */
const GRAMMAR = {
  en: [
    {q:'She ___ a teacher.', options:['am','is','are','be'], answer:1, tip:'第三人称单数 she 搭配 be 动词 is。'},
    {q:'I ___ coffee every morning.', options:['drink','drinks','drinking','drank'], answer:0, tip:'一般现在时，主语 I 用动词原形。'},
    {q:'They ___ football yesterday.', options:['play','plays','played','playing'], answer:2, tip:'yesterday 表示过去，用过去式 played。'},
    {q:'___ you ever been to Japan?', options:['Do','Did','Have','Are'], answer:2, tip:'现在完成时 Have you ever…？表示经历。'},
    {q:'He is ___ TV now.', options:['watch','watches','watched','watching'], answer:3, tip:'现在进行时 be + doing。'},
    {q:'There ___ many books on the desk.', options:['is','are','have','has'], answer:1, tip:'复数主语 many books 用 are。'},
    {q:'If I ___ rich, I would travel the world.', options:['am','was','were','will be'], answer:2, tip:'与现在事实相反的虚拟语气，be 动词一律用 were。'},
    {q:'Rarely ___ such a beautiful sunset.', options:['I have seen','have I seen','I saw','did I saw'], answer:1, tip:'Rarely 置于句首，句子需要部分倒装。'},
    {q:'The letter ___ yesterday.', options:['sent','was sent','is sent','sends'], answer:1, tip:'信是"被寄出"的，用过去时被动 was sent。'},
    {q:'This is the movie ___ won the award.', options:['who','which','what','whom'], answer:1, tip:'先行词是物 movie，关系代词用 which。'},
    {q:'I look forward to ___ you soon.', options:['see','seeing','saw','seen'], answer:1, tip:'look forward to 中 to 是介词，后接动名词。'},
    {q:'She asked me where ___.', options:['do I live','I live','I lived','did I live'], answer:2, tip:'宾语从句用陈述语序，且主句为过去时，从句时态后退。'},
  ],
  ja: [
    {q:'私＿＿学生です。', options:['は','が','を','に'], answer:0, tip:'は 是主题助词，用于点明句子主题。'},
    {q:'毎日牛乳を＿＿。', options:['飲みます','飲む','飲んで','飲もう'], answer:0, tip:'礼貌体中动词使用ます形：飲みます。'},
    {q:'昨日、映画を＿＿。', options:['見ます','見ました','見て','見よう'], answer:1, tip:'昨日表示过去，使用ました。'},
    {q:'ここに名前を＿＿ください。', options:['書く','書き','書いて','書こう'], answer:2, tip:'〜てください 表示请做某事，書く→書いて。'},
    {q:'雨が＿＿、傘をさします。', options:['降る','降って','降ったら','降り'], answer:2, tip:'〜たら 表示"如果…就"，降る→降ったら。'},
    {q:'これは誰＿＿本ですか。', options:['の','を','で','に'], answer:0, tip:'の 连接名词表示所属：誰の本（谁的书）。'},
    {q:'日本語が＿＿上手ですね。', options:['とても','あまり','全然','めったに'], answer:0, tip:'とても 修饰肯定形容词，表示"非常"。'},
    {q:'先生にほめ＿＿ました。', options:['る','され','られ','せ'], answer:1, tip:'ほめる 的受身形 ほめられる：被老师表扬。'},
    {q:'明日は雨が＿＿かもしれません。', options:['降る','降り','降って','降ろう'], answer:0, tip:'〜かもしれません 前接动词原形：也许会…。'},
    {q:'駅に＿＿どう行きますか。', options:['行くの','行くに','行けば','行ったり'], answer:1, tip:'动词辞书形 + に 表示移动目的：行くには（去…的话）。'},
    {q:'そのニュースを＿＿ことがあります。', options:['聞く','聞いた','聞き','聞こう'], answer:1, tip:'〜たことがあります 表示曾经有过的经历。'},
    {q:'お酒を＿＿ないでください。', options:['飲む','飲み','飲ま','飲もう'], answer:2, tip:'〜ないでください 前接ない形：飲まない。'},
  ],
  ko: [
    {q:'저＿＿ 학생이에요.', options:['는','은','이','를'], answer:0, tip:'저 后接 는（开音节后）。'},
    {q:'매일 우유를＿＿.', options:['마셔요','마시다','마셨','마시자'], answer:0, tip:'礼貌体现在时：마시다 → 마셔요。'},
    {q:'어제 영화를＿＿.', options:['봐요','봤어요','볼 거예요','보고'], answer:1, tip:'어제 是过去，用 았/었어요：봤어요。'},
    {q:'여기에 이름을＿＿.', options:['써 주세요','쓰다','썼다','쓰자'], answer:0, tip:'아/어 주세요 表示请为我做：써 주세요。'},
    {q:'비가＿＿ 우산을 써요.', options:['오면','와요','왔다','오고'], answer:0, tip:'-(으)면 表示假设：오면（如果下雨）。'},
    {q:'이거＿＿ 누구 책이에요?', options:['는','은','이','의'], answer:3, tip:'의 是属格助词：누구의 책（谁的书）。'},
    {q:'한국말을＿＿ 잘해요.', options:['아주','별로','안','조금도'], answer:0, tip:'아주 修饰肯定含义：非常。'},
    {q:'내일 비가＿＿ 거예요.', options:['오다','올','왔','오면'], answer:1, tip:'-(으)ㄹ 거예요 表推测：올 거예요（会下雨）。'},
    {q:'선생님께＿＿.', options:['혼났어요','혼내요','혼내다','혼내자'], answer:0, tip:'被老师批评，用被动/被害含义 혼나다 过去式。'},
    {q:'이 노래를＿＿ 적이 있어요.', options:['듣다','들은','들었','들으'], answer:1, tip:'-(으)ㄴ 적이 있다 表示曾有过的经历。'},
    {q:'술을＿＿ 마세요.', options:['마시','마시지','마신','마시자'], answer:1, tip:'-지 마세요 表禁止：마시지 마세요。'},
    {q:'책을 읽＿＿ 음악을 들어요.', options:['으면서','면','고','거나'], answer:0, tip:'-(으)면서 表示两个动作同时进行：边读书边听歌。'},
  ],
};

/* ---------------- 口语跟读句库 ---------------- */
const SPEAK = {
  en: [
    {text:'Nice to meet you. My name is Alex.', trans:'很高兴认识你，我叫亚历克斯。'},
    {text:'Could you recommend a good restaurant nearby?', trans:'你能推荐附近一家好餐厅吗？'},
    {text:'How much does this ticket cost?', trans:'这张票多少钱？'},
    {text:'I would like to book a room for two nights.', trans:'我想预订一个房间，住两晚。'},
    {text:'In my opinion, learning languages is really fun.', trans:'在我看来，学语言真的很有趣。'},
    {text:'Could you say that again, please?', trans:'请再说一遍好吗？'},
    {text:'I have been studying English for three years.', trans:'我学英语已经三年了。'},
    {text:'If I were you, I would take that opportunity.', trans:'如果我是你，我会抓住那个机会。'},
    {text:'The earlier we start, the sooner we will finish.', trans:'开始得越早，完成得越快。'},
    {text:'Innovation distinguishes between a leader and a follower.', trans:'创新是领导者与追随者的区别。'},
    {text:'I strongly believe that practice makes perfect.', trans:'我坚信熟能生巧。'},
    {text:'Not only did she apologize, but she also sent a gift.', trans:'她不仅道了歉，还送了礼物。'},
  ],
  ja: [
    {text:'はじめまして、どうぞよろしくお願いします。', trans:'初次见面，请多关照。'},
    {text:'この近くにおいしいラーメン屋はありますか。', trans:'这附近有好吃的拉面店吗？'},
    {text:'これはいくらですか。', trans:'这个多少钱？'},
    {text:'二泊の予約をお願いします。', trans:'请帮我预订两晚。'},
    {text:'私は日本語を勉強するのが大好きです。', trans:'我非常喜欢学日语。'},
    {text:'もう一度言っていただけますか。', trans:'能请您再说一遍吗？'},
    {text:'日本語を三年間勉強しています。', trans:'我学日语三年了。'},
    {text:'もし私が鳥だったら、あなたのところへ飛んでいきたい。', trans:'如果我是一只鸟，想飞到你身边。'},
    {text:'早く始めれば始めるほど、早く終わります。', trans:'越早开始，越早结束。'},
    {text:'継続は力なり、と私は信じています。', trans:'我相信坚持就是力量。'},
    {text:'努力は必ず報われるとは限りません。', trans:'努力未必一定会有回报。'},
    {text:'お忙しいところ恐れ入りますが、よろしくお願いいたします。', trans:'百忙之中打扰十分抱歉，拜托您了。'},
  ],
  ko: [
    {text:'안녕하세요, 만나서 반갑습니다.', trans:'你好，见到你很高兴。'},
    {text:'근처에 맛있는 식당 추천해 주세요.', trans:'请推荐附近好吃的餐厅。'},
    {text:'이거 얼마예요?', trans:'这个多少钱？'},
    {text:'이박 삼일 예약하고 싶어요.', trans:'我想预订两天三夜。'},
    {text:'저는 한국어 배우는 걸 정말 좋아해요.', trans:'我真的很喜欢学韩语。'},
    {text:'다시 한번 말씀해 주시겠어요?', trans:'能再说一遍吗？'},
    {text:'한국어를 삼 년 동안 배우고 있어요.', trans:'我学韩语三年了。'},
    {text:'제가 새라면 당신에게 날아갈 거예요.', trans:'如果我是鸟，就会飞向你。'},
    {text:'일찍 시작할수록 빨리 끝나요.', trans:'越早开始越快结束。'},
    {text:'노력은 배신하지 않는다고 믿어요.', trans:'我相信努力不会辜负你。'},
    {text:'바쁘신데 죄송하지만 부탁드립니다.', trans:'百忙之中打扰很抱歉，拜托了。'},
    {text:'포기하지 않으면 반드시 길이 열릴 거예요.', trans:'只要不放弃，一定会有路。'},
  ],
};

/* ---------------- 听力句库 ---------------- */
const LISTEN = {
  en: [
    {text:'The meeting starts at nine thirty.', trans:'会议九点半开始。'},
    {text:'Your gate number is B12. Boarding begins in ten minutes.', trans:'您的登机口是 B12，十分钟后开始登机。'},
    {text:'I would like a cup of coffee and two sandwiches.', trans:'我想要一杯咖啡和两个三明治。'},
    {text:'The train to London leaves from platform three.', trans:'开往伦敦的火车从三站台发车。'},
    {text:'Yesterday it rained heavily, so we stayed at home.', trans:'昨天雨下得很大，所以我们待在家里。'},
    {text:'Could you tell me how to get to the museum?', trans:'请问去博物馆怎么走？'},
    {text:'The unemployment rate dropped by two percent this quarter.', trans:'本季度失业率下降了两个百分点。'},
    {text:'Scientists have discovered a new species in the rainforest.', trans:'科学家在雨林中发现了新物种。'},
    {text:'Although the task was challenging, she completed it on time.', trans:'尽管任务有挑战，她还是按时完成了。'},
    {text:'The committee will review the proposal next Wednesday.', trans:'委员会下周三将审议该提案。'},
    {text:'Rarely has a single speech influenced public opinion so deeply.', trans:'很少有一场演讲能如此深刻地影响公众舆论。'},
    {text:'The research suggests a strong correlation between sleep and memory.', trans:'研究表明睡眠与记忆力密切相关。'},
  ],
  ja: [
    {text:'会議は九時半に始まります。', trans:'会议九点半开始。'},
    {text:'搭乗ゲートはB12番です。あと十分で搭乗開始です。', trans:'登机口是 B12，还有十分钟开始登机。'},
    {text:'コーヒーを一杯とサンドイッチを二つください。', trans:'请给我一杯咖啡和两个三明治。'},
    {text:'ロンドン行きの電車は三番ホームから出ます。', trans:'开往伦敦的电车从三站台发车。'},
    {text:'昨日は大雨だったので、家にいました。', trans:'昨天因为下大雨，所以待在家里。'},
    {text:'すみません、博物館までどう行けばいいですか。', trans:'请问，去博物馆该怎么走？'},
    {text:'今四半期の失業率は二パーセント下がりました。', trans:'本季度失业率下降了 2%。'},
    {text:'科学者たちは熱帯雨林で新種を発見しました。', trans:'科学家们在热带雨林发现了新物种。'},
    {text:'仕事は大変でしたが、彼女は時間通りに終えました。', trans:'工作虽然辛苦，她还是按时完成了。'},
    {text:'委員会は来週の水曜日に提案を審査します。', trans:'委员会下周三审查提案。'},
    {text:'たった一つの演説が世論をこれほど変えた例は稀です。', trans:'仅凭一场演讲就如此改变舆论的例子很罕见。'},
    {text:'研究によると、睡眠と記憶には強い相関があります。', trans:'研究表明睡眠与记忆有很强的相关性。'},
  ],
  ko: [
    {text:'회의는 아홉 시 반에 시작해요.', trans:'会议九点半开始。'},
    {text:'탑승구는 B12번이에요. 십 분 후에 탑승이 시작됩니다.', trans:'登机口是 B12，十分钟后开始登机。'},
    {text:'커피 한 잔과 샌드위치 두 개 주세요.', trans:'请给我一杯咖啡和两个三明治。'},
    {text:'런던행 기차는 삼 번 플랫폼에서 출발해요.', trans:'开往伦敦的火车从三站台发车。'},
    {text:'어제 비가 많이 와서 집에 있었어요.', trans:'昨天雨下得很大，所以待在家里。'},
    {text:'실례지만 박물관에 어떻게 가요?', trans:'请问博物馆怎么走？'},
    {text:'이번 분기 실업률이 이 퍼센트 내렸어요.', trans:'本季度失业率下降了 2%。'},
    {text:'과학자들이 열대우림에서 새로운 종을 발견했어요.', trans:'科学家在热带雨林发现了新物种。'},
    {text:'일이 어려웠지만 그녀는 제시간에 끝냈어요.', trans:'工作虽然困难，她还是按时完成了。'},
    {text:'위원회는 다음 주 수요일에 제안을 검토해요.', trans:'委员会下周三审查提案。'},
    {text:'단 한 번의 연설이 여론을 이렇게 바꾼 적은 드물어요.', trans:'仅凭一次演讲就如此改变舆论的情况很少见。'},
    {text:'연구에 따르면 수면과 기억력은 밀접한 관련이 있어요.', trans:'研究表明睡眠和记忆力密切相关。'},
  ],
};

/* ---------------- 成就系统 ----------------
   check: 判定函数名（在 store 中统一计算 progress） */
const ACHIEVEMENTS = [
  { id:'first_step', ico:'🌱', name:'初语者', desc:'完成你的第一节课',
    metric:s=>s.totalLessons, target:1, reward:20 },
  { id:'streak_3',    ico:'🔥', name:'三日之约', desc:'连续学习 3 天',
    metric:s=>s.streak, target:3, reward:30 },
  { id:'streak_7',    ico:'⚡', name:'一周不辍', desc:'连续学习 7 天',
    metric:s=>s.streak, target:7, reward:60 },
  { id:'streak_30',   ico:'🌟', name:'月度学霸', desc:'连续学习 30 天',
    metric:s=>s.streak, target:30, reward:200 },
  { id:'words_50',    ico:'🃏', name:'词汇收集者', desc:'累计掌握 50 个单词',
    metric:s=>s.wordsLearned, target:50, reward:50 },
  { id:'words_200',   ico:'📖', name:'行走词典', desc:'累计掌握 200 个单词',
    metric:s=>s.wordsLearned, target:200, reward:150 },
  { id:'grammar_50',  ico:'📐', name:'语法工匠', desc:'完成 50 道语法题',
    metric:s=>s.grammarDone, target:50, reward:50 },
  { id:'speak_30',    ico:'🎙️', name:'敢说之星', desc:'完成 30 次口语跟读',
    metric:s=>s.speakDone, target:30, reward:60 },
  { id:'listen_30',   ico:'🎧', name:'金耳朵', desc:'完成 30 次听力训练',
    metric:s=>s.listenDone, target:30, reward:60 },
  { id:'perfect_10',  ico:'💯', name:'十全十美', desc:'累计 10 次满分完成练习',
    metric:s=>s.perfectCount, target:10, reward:80 },
  { id:'polyglot',    ico:'🌍', name:'多语探索者', desc:'在 3 种语言中都完成课程',
    metric:s=>s.activeLangs, target:3, reward:100 },
  { id:'xp_2000',     ico:'👑', name:'语言大师', desc:'累计获得 2000 XP',
    metric:s=>s.xp, target:2000, reward:300 },
];

/* ---------------- 社区种子数据 ---------------- */
const SEED_POSTS = [
  { id:'p1', user:'小樱 Sakura', avatar:'樱', lang:'ja', time:'2 小时前',
    body:'刚看完一集动漫不看字幕听懂了 70%！坚持影子跟读三个月真的有用，大家加油！🌸',
    likes:42, comments:[{u:'老师 Kenta',c:'影子跟读 +1，注意促音的停顿哦～'},{u:'Momo',c:'好厉害！求分享方法'}] },
  { id:'p2', user:'Daniel', avatar:'D', lang:'en', time:'5 小时前',
    body:'Day 60 打卡。今天用英语和外国客户开了 30 分钟会，虽然紧张但都听懂了。输出真的比死记硬背重要。',
    likes:88, comments:[{u:'Luna',c:'输出 +1，我也要开始约语伴了'}] },
  { id:'p3', user:'지민 지민', avatar:'지', lang:'ko', time:'昨天',
    body:'韩语助词 은/는/이/가 到底怎么区分？求大神用最简单的话讲一下 🙏',
    links:67, likes:35, comments:[{u:'朴老师',c:'은/는 强调对比或主题，이/가 强调主语本身～'},{u:'Kevin',c:'同问，这里永远绕不清'}] },
  { id:'p4', user:'阿光', avatar:'光', lang:'ja', time:'昨天',
    body:'分享一个记五十音的歪招：给每个假名编一个画面，比如 さ 像一把さかな（鱼）刀，过目不忘。',
    likes:120, comments:[{u:'Nana',c:'哈哈亲测有效'},{u:'Tomo',c:'我当时是抄了一百遍……'}] },
  { id:'p5', user:'Emily', avatar:'E', lang:'en', time:'2 天前',
    body:'虚拟语气终于搞懂了！If I were you 里的 were 不是复数，是穿越回"不可能的假设世界"的信号 🌗',
    likes:56, comments:[{u:'文法控',c:'这个解释太妙了哈哈'}] },
  { id:'p6', user:'봄', avatar:'봄', lang:'ko', time:'3 天前',
    body:'用 K-pop 学韩语真的香，跟着唱了一个月，连音规则自然就会了，推荐从抒情歌副歌开始！',
    likes:94, comments:[{u:'追星少女',c:'IU 的歌真的很适合练发音'},{u:'Mark',c:'今晚试试～'}] },
];
const RANK_SEED = [
  {name:'多邻国在逃公主', xp:4820},{name:'Daniel', xp:3960},{name:'小樱 Sakura', xp:3540},
  {name:'지민', xp:2980},{name:'阿光', xp:2410},{name:'Nana', xp:1980},
  {name:'Emily', xp:1560},{name:'Tomo', xp:1240},
];
const TOPICS = ['# 日语学习','# 英语打卡','# 韩语入门','# 备考经验','# 语伴招募','# 动漫日剧','# K-pop','# 影子跟读'];

return { LANGS, LEVELS, COURSES, VOCAB, GRAMMAR, SPEAK, LISTEN, ACHIEVEMENTS, SEED_POSTS, RANK_SEED, TOPICS };
})();
