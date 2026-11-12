// 病例 C01C：莫桐，胸痛，真身是胸腔腫瘤（沒看過的說法：不是幾十分鐘，是一個多月）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：病人不急，但不能漏。把警訊一條一條收齊，回報清楚，說明的時候不搶著下結論。
import type { CaseSpec } from '../core/module.ts';
import { BAILE_2000, GULATI_2021, HAMILTON_2005, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C01C: CaseSpec = {
  format: 3,
  id: 'c01c',
  complaint: 'chest-pain',
  kind: '遷移',
  title: '慢慢來的那一隻',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '莫桐', age: 67, sex: '男', job: '退休的船塢填縫工', look: 'tong', pronoun: '他' },
  reading: {
    lines: ['莫桐，67 歲，退休的船塢填縫工。', '左邊胸口悶痛一個多月，越來越常痛，這幾天晚上痛到睡不好。兒子陪他來。', '他自己走進來，說話的聲音有點沙啞。'],
    prompts: ['最危險的可能是什麼？', '痛了一個多月，和痛了四十分鐘，要想的病有什麼不一樣？', '這一關要緊的是什麼：馬上處置，還是不要漏掉？'],
  },
  vitals: {
    base: { bp: '128/78', hr: 88, rr: 20, spo2: 94, bt: 36.8 },
    clue: { text: '生命徵象大致穩定，血氧 94%', kind: 'info', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（莫桐坐在床邊咳了兩聲。他兒子站在簾子旁邊。）' },
    'q-intro': { say: '莫桐。穀雨那天生的，六十七了。' },
    'q-explain': { say: '好。問仔細一點也好，我兒子比我還緊張。' },
    // 主訴
    'q-cc': { say: '左邊胸口悶悶地痛，拖了一個多月都沒好。', clue: { text: '主訴：左胸悶痛一個多月', kind: 'pos' } },
    'q-onset': { say: '一個多月前吧，說不出是哪一天。慢慢來的，那時候沒在做什麼。', clue: { text: '一個多月前慢慢開始，說不出哪一天', kind: 'pos', key: true, tell: { form: 'tumor', dir: 1 }, alsoOk: [{ form: 'cardiac', dir: -1 }, { form: 'vascular', dir: -1 }], why: '說不出哪一天、幾個禮拜慢慢加重，不是心臟或大血管急症的樣子。要想到裡面長了東西。' } },
    'q-location': { say: '左邊胸口偏上面，靠近肩膀這一帶。深深的，一整片。', clue: { text: '左上胸深處，一整片', kind: 'pos' } },
    'q-duration': { say: '一開始偶爾痛，現在幾乎整天都在。晚上躺下來更明顯。', clue: { text: '越來越常痛，現在幾乎整天，夜裡更明顯', kind: 'pos', key: true } },
    'q-character': { say: '鈍鈍的，像裡面有東西頂著。不是壓得喘不過氣，也不是被撕開的痛。', clue: { text: '深處的鈍痛，不是壓迫感或撕裂感', kind: 'pos' } },
    'q-assoc': { say: '咳嗽。咳了兩個多月，這兩個禮拜痰裡有血絲。爬樓梯比以前喘。不會冒冷汗。', clue: { text: '咳嗽兩個多月，痰裡有血絲，爬樓梯會喘', kind: 'pos', key: true, tell: { form: 'tumor', dir: 1 }, alsoOk: [{ form: 'vascular', dir: 1 }], why: '痰裡有血一定要追。配上兩個多月的咳嗽，要先想到肺裡的腫瘤。肺栓塞也會咳血，但通常來得急。' } },
    'q-factors': { say: '深呼吸、咳嗽的時候會更痛一點。走路、出力不會特別痛，休息也不會好。止痛藥只好一下。', clue: { text: '出力不會更痛，休息也不會好', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '出力不會更痛、休息也不會好，不是心絞痛的樣子。' } },
    'q-radiate': { say: '有時候痛到左邊肩膀後面。手臂和下巴不會。', clue: { text: '偶爾痛到左肩後方', kind: 'pos' } },
    'q-treat': { say: '在藥舖拿過止咳的藥水和止痛藥，吃了三個禮拜，沒什麼用。', clue: { text: '止咳藥和止痛藥吃了三週，沒有改善', kind: 'info' } },
    'q-severity': { say: '平常四分，晚上到六分。', clue: { text: '平常 4 分，夜裡 6 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒什麼大病。大夫說過我的肺不太好，每年冬天都會咳。沒有固定在看。', clue: { text: '每年冬天咳嗽，沒有其他慢性病', kind: 'info' } },
    'q-family': { say: '我哥六十出頭的時候，肺裡長了東西走的。', clue: { text: '哥哥六十多歲肺癌過世', kind: 'info' } },
    'q-surgery': { say: '沒開過刀。最近沒有跌倒、撞到，也沒有整天躺著，每天都去港邊走一圈。', clue: { text: '沒有手術、外傷或久臥不動', kind: 'neg' } },
    'q-meds': { say: '就那個止痛藥。沒有吃別的，也沒有對什麼過敏。', clue: { text: '只吃止痛藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '菸斗抽了四十年，去年才停。酒每天一小杯，檳榔不吃。', clue: { text: '抽菸 40 年，去年才戒', kind: 'info', key: true } },
    'q-work': { say: '以前在船塢填船縫，一做三十年。燒瀝青、塞石棉，滿屋子都是灰。最近沒有出遠門。', clue: { text: '船塢填縫 30 年，長期吸入石棉粉塵', kind: 'info', key: true } },
    'q-life': { say: '最近沒什麼胃口，飯吃一半就飽。晚上又痛又咳，睡不好。跟兒子一家住。', clue: { text: '胃口變差，睡不好', kind: 'pos' } },
    'q-concern': { say: '我哥當年也是這樣咳……我怕跟他一樣。可是我不想讓我兒子先聽到。', clue: { text: '怕跟哥哥一樣；不想讓兒子先知道', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒。這兩個月褲頭鬆了，瘦了大概五公斤。晚上有時候一身汗。', clue: { text: '兩個月瘦 5 公斤，夜裡盜汗，沒有發燒', kind: 'pos', key: true, tell: { form: 'tumor', dir: 1 }, why: '沒有刻意減重卻一直瘦，是警訊。配上久咳和痰裡有血，腫瘤要排到前面。' } },
    'q-ros-head': { say: '頭不痛。聲音這一個月變啞了。吞東西還好。', clue: { text: '聲音沙啞一個月', kind: 'pos', key: true } },
    'q-ros-resp': { say: '早上咳得最厲害，痰白白的帶血絲。沒有整口的血。', clue: { text: '痰中帶血絲，沒有大量咳血', kind: 'pos' } },
    'q-ros-cv': { say: '不會心悸。晚上可以躺平睡，不用墊高。', clue: { text: '沒有心悸，可以平躺', kind: 'neg' } },
    'q-ros-gi': { say: '沒有火燒心。大便正常，沒有黑黑的。小便也正常。', clue: { text: '沒有火燒心，大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '手腳不會麻，也不會沒力。腳沒有腫。', clue: { text: '手腳不麻，腳不腫', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '偏瘦，臉頰凹陷。說話的聲音沙啞，講長一點的句子要停下來換氣。', clue: { text: '消瘦、聲音沙啞、說話要換氣', kind: 'pos', key: true } },
    'x-head': { say: '結膜稍微蒼白。左邊鎖骨上方摸到一顆大約 2 公分的硬塊，不會痛，推不太動。', clue: { text: '左鎖骨上淋巴結：2 公分、硬、不痛、推不動', kind: 'pos', key: true, tell: { form: 'tumor', dir: 1 }, why: '鎖骨上方摸到又硬、又固定、不會痛的淋巴結，要想到胸腔或腹腔的腫瘤。這一項一定要回報。' } },
    'x-jvp': { say: '沒有頸靜脈怒張，氣管在正中間。臉和脖子沒有腫。', clue: { text: '沒有頸靜脈怒張，氣管居中，臉頸不腫', kind: 'neg' } },
    'x-chest-touch': { say: '左上胸的起伏比右邊小一點。按壓胸壁和肋骨，不會引發一樣的痛。', clue: { text: '左上胸起伏較小；按壓不會引發一樣的痛', kind: 'pos', tell: { form: 'msk', dir: -1 }, why: '按不出一樣的痛，胸壁的肌肉和軟骨就比較不像。' } },
    'x-chest-listen': { say: '左上肺敲起來比較實，呼吸音比右邊小，有一小段位置固定的喘鳴聲。', clue: { text: '左上肺叩診實音、呼吸音減弱、局部喘鳴', kind: 'pos', key: true, tell: { form: 'tumor', dir: 1 }, why: '只有一個地方敲起來實、聽起來小，表示那裡被東西佔住或塞住了。位置固定的喘鳴，要想到氣管被壓到。' } },
    'x-heart': { say: '心律規則，每分鐘 88 下。沒有雜音，沒有心包摩擦音。', clue: { text: '心律規則，沒有雜音或摩擦音', kind: 'neg' } },
    'x-botharms': { say: '右手 128/78 mmHg，左手 126/76 mmHg。兩邊脈搏一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟，沒有壓痛，沒有摸到腫大的肝臟。', clue: { text: '腹部柔軟，肝臟沒有腫大', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。兩手的指尖圓鼓鼓的，指甲像錶面一樣拱起來。', clue: { text: '杵狀指', kind: 'pos', key: true } },
    'x-legs': { say: '兩邊小腿一樣粗，沒有水腫，按了不痛。', clue: { text: '小腿不腫不痛', kind: 'neg', tell: { form: 'vascular', dir: -1 }, why: '單邊小腿又腫又痛，是深部靜脈栓塞的訊號，血塊可能跑到肺。沒有，肺栓塞就比較不像。' } },
  },
  results: {
    't-ecg': { say: '竇性心律，每分鐘 88 下，沒有 ST 段或 T 波的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心律，沒有 ST-T 變化', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '心電圖沒有缺血的變化，配上一個多月的病程，心臟的急症比較不像。' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-cxr': { say: '左上肺野有一塊邊緣不規則的陰影，大約 4 公分，左側肺門變大。沒有氣胸，縱膈沒有變寬。（訓練用的文字結果，要由醫師判讀；那是什麼，還要進一步檢查才知道。）', clue: { text: '胸部 X 光：左上肺野約 4 公分的陰影，左肺門變大', kind: 'pos', key: true, fog: 6, tell: { form: 'tumor', dir: 1 }, why: '影像上看到一塊東西，和病史、身體評估對得起來。但影像只能說「有東西」，是什麼要等進一步的檢查，由醫師說明。' } },
    't-glucose': { say: '104 mg/dL。', clue: { text: '血糖 104 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'tumor', exclude: { cardiac: 2, vascular: 2, msk: 1 } },
  summaries: [
    { id: 's-best', text: '67 歲男性，抽菸 40 年、長期接觸石棉，左胸鈍痛一個多月逐漸加重，合併久咳、痰中帶血、兩個月瘦 5 公斤和聲音沙啞；生命徵象穩定。', score: 5, note: '有年齡、危險因子、病程、性質、伴隨的警訊和目前的穩定程度。聽的人知道不用急救，但不能拖。' },
    { id: 's-ok', text: '67 歲男性，左胸痛一個多月，有咳嗽和痰中帶血。', score: 3, note: '病程和咳血有了，但少了體重減輕、抽菸和職業這幾個讓人提高警覺的資訊。' },
    { id: 's-vague', text: '老年男性胸痛合併咳嗽，原因待查。', score: 0, note: '太模糊。聽的人分不出這是感冒，還是要馬上安排檢查的事。' },
    { id: 's-anchor', text: '67 歲男性久咳胸痛，本來冬天就容易咳，應該是老毛病。', score: 0, note: '把新的症狀歸給老毛病，是最容易漏掉的地方。咳的樣子變了，多了血絲和體重減輕，就不是原來那一個。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-tumor', text: '我的診斷是胸腔的腫瘤要先排除。病人現在穩定，但需要盡快安排檢查。', score: 2, note: '說出最擔心的問題，也說出不是急救、但不能拖。' },
      { id: 'a-unknown', text: '慢性胸痛合併咳嗽，原因還不清楚，生命徵象穩定。', score: 1, note: '沒有說出你擔心什麼。痰中帶血、體重減輕、鎖骨上的淋巴結都沒有報。' },
      { id: 'a-old', text: '應該是慢性支氣管炎又發作，想先給止咳藥觀察。', score: 0, note: '止咳藥已經吃了三週沒有改善，而且多了警訊，不能再觀察。' },
    ],
    requests: [
      { id: 'r-cxr', text: '請同意先照一張胸部 X 光，並請您判讀。', ok: true, orders: 't-cxr', note: '有警訊的久咳和胸痛，影像是第一步。' },
      { id: 'r-see', text: '請您今天過來看病人，特別是左邊鎖骨上的淋巴結。', ok: true, note: '明確說出要對方做什麼、看哪裡。' },
      { id: 'r-talk', text: '病人很怕跟他哥哥一樣，也不想讓兒子先知道。結果出來之後，想請您一起向他說明。', ok: true, note: '把病人的顧慮一起交班，讓說明的人有準備。' },
      { id: 'r-home', text: '先讓他回去，下個月再回來追蹤。', ok: false, note: '這是延遲。有痰中帶血和體重減輕，不能等一個月。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您咳了很久、痰裡有血，胸口也一直痛，這些都需要查清楚，所以要照一張胸部 X 光。', ok: true, note: '用病人聽得懂的話說出為什麼要檢查，沒有先下結論。' },
    { id: 'e-plan', text: '檢查的結果會由沈渡醫師跟您說明，到時候我會陪您一起聽。', ok: true, note: '說明接下來會發生什麼、由誰說明。' },
    { id: 'e-warn', text: '如果咳出整口的血、突然很喘，或是胸口痛得跟平常不一樣，不要等，馬上回來。', ok: true, note: '交代什麼情況要馬上回來。' },
    { id: 'e-concern', text: '您怕跟哥哥一樣，也不想讓兒子先聽到。結果出來之前，我不會跟別人說；要讓誰知道、什麼時候說，由您決定。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他最在意的事，把「要告訴誰」的決定權交還給他。' },
    { id: 'e-false', text: '應該只是氣管發炎，不用想太多。', ok: false, note: '沒有根據的保證。他可能因此不回來做檢查。' },
    { id: 'e-blunt', text: '我看您八成是肺癌，要有心理準備。', ok: false, note: '還沒有檢查結果就說出診斷，也沒有先了解他想知道多少。壞消息要有準備、有步驟地說，而且由醫師說。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-cxr', within: 300, points: 3 }, { type: 'exclude', forms: ['cardiac', 'vascular'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一位不趕時間。照順序，一樣一樣做完整，不要跳。'],
    watch: '莫桐靠在床頭，隔一陣子就咳幾聲。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。病人看起來很穩定，是什麼事等不了？',
    reportGood: '收到。先照 X 光，片子出來我看。鎖骨上那一顆我自己再摸一次。說明的時候你一起來。',
    reportWeak: '我聽不出來要我做什麼。先講你最擔心什麼、是哪些發現讓你擔心。我晚一點過去。',
    explainOk: '……好。那就先照。',
    explainConcern: '……謝謝你。先不要跟他說，等我自己想清楚。',
    explainBad: '……（莫桐沒有說話，看了簾子外面的兒子一眼。）',
    closing: '霧散了。這一隻不急，可是最容易被當成老毛病放走。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這位病人穩定，不用搶時間。要緊的是不要把他當成老毛病放回去。',
      '胸部 X 光可以自己先提出，也可以在回報的時候一起請醫師同意。',
      '說明的時候不用、也不應該說出診斷。先說「有些地方需要查清楚」，結果由醫師說明。',
    ],
    teaching: [
      { text: '咳血、體重減輕、食慾變差、喘、胸痛、疲倦、久咳和杵狀指，都是肺癌確診之前常見的表現。出現這些，要安排檢查。', ref: 'hamilton2005' },
      { text: '胸痛要先分清楚是急性的，還是穩定、拖了一段時間的。兩邊要找的原因和檢查的順序不一樣。', ref: 'gulati2021' },
      { text: '說壞消息有步驟：先準備好環境，了解病人知道多少、想知道多少，再給資訊、回應情緒，最後一起訂下一步。', ref: 'baile2000' },
    ],
    references: [GULATI_2021, HAMILTON_2005, BAILE_2000],
  },
};
