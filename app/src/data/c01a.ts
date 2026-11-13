// 病例 C01A：林秋，胸痛，診斷是心因性（急性冠心症，危險的那一版）。
// 虛構的教學病例，依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：整套流程照順序做完，下了診斷就馬上通報、提出心電圖。
import type { CaseSpec } from '../core/module.ts';
import { GULATI_2021, RAO_2025, REVIEW_NOTE, TEXT_RESULT, WHY_ARMS_EQUAL, WHY_NO_IMMOB, WHY_NO_WEIGHT_LOSS } from './shared.ts';

export const C01A: CaseSpec = {
  format: 3,
  id: 'c01a',
  complaint: 'chest-pain',
  kind: '示範',
  title: '鐘聲之前',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '林秋', age: 58, sex: '男', job: '港口的燈匠', look: 'lin', pronoun: '他' },
  reading: {
    lines: ['林秋，58 歲，港口的燈匠。', '傍晚搬銅燈上架的時候胸口不舒服，同伴扶他到公會的病室。', '他清醒，可以自己說話，額頭都是汗。'],
    prompts: ['最危險的可能是什麼？', '最常見的可能是什麼？', '問診、評估做完之後，我第一件要做的事是什麼？'],
  },
  vitals: {
    base: { bp: '103/68', hr: 108, rr: 24, spo2: 96, bt: 36.4 },
    worse: { bp: '86/58', hr: 118, rr: 26, spo2: 95, bt: 36.4 },
    clue: { text: '血壓偏低、心跳快、呼吸快', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（林秋半躺在床上，一手按著胸口，看著你把手洗乾淨。）' },
    'q-intro': { say: '林秋……秋分那天生的，今年五十八。' },
    'q-explain': { say: '好……你問吧。' },
    // 主訴
    'q-cc': { say: '胸口……很悶，很不對勁。', clue: { text: '主訴：胸口悶痛', kind: 'pos' } },
    'q-onset': { say: '這兩個禮拜爬坡就會悶，停下來幾分鐘就好。今天傍晚搬銅燈的時候又來了，這次沒有退。', clue: { text: '兩週來出力就悶、休息就好；今天發作後沒有退', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '出力就悶、休息就好，是心絞痛的樣子。這次休息也不退，表示變嚴重了。' } },
    'q-location': { say: '胸口正中間，一整片。要我指一個點，我指不出來。', clue: { text: '胸口正中一整片，指不出一個點', kind: 'pos' } },
    'q-duration': { say: '到現在大概四十分鐘，一直在，沒有停過。', clue: { text: '持續 40 分鐘沒有停', kind: 'pos', key: true } },
    'q-character': { say: '像被一綑纜繩勒緊，又悶又重。不是刺的，也沒有被撕開的感覺。', clue: { text: '又悶又緊的壓迫感，沒有撕裂感', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '悶、緊、壓，是心臟缺血常見的說法。刺痛或一碰就痛，反而比較不像。' } },
    'q-assoc': { say: '一直冒冷汗，有點想吐，也有點喘。沒有昏倒，也沒有咳嗽。', clue: { text: '冒冷汗、噁心、有點喘', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '冒冷汗、噁心跟著胸痛一起來，更像心臟。' } },
    'q-factors': { say: '怎麼動、怎麼呼吸都一樣。坐著只好一點點。', clue: { text: '呼吸、轉身都不影響，休息只好一點點', kind: 'neg', tell: { form: 'msk', dir: -1 }, why: '跟呼吸、姿勢都沒有關係，就比較不像胸壁的問題。' } },
    'q-radiate': { say: '一路到左邊肩膀和手臂，下巴也緊緊的。背不會痛。', clue: { text: '傳到左肩、左臂和下巴，背不痛', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '會傳到手臂、肩膀或下巴的胸痛，更像心臟。' } },
    'q-treat': { say: '沒有。本來想坐一下就好，是同伴硬把我扶過來的。', clue: { text: '沒有就醫或吃藥', kind: 'info' } },
    'q-severity': { say: '現在八分。比以前任何一次都厲害。', clue: { text: '疼痛 8 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '高血壓五年了，藥舖的大夫也說過我血裡的油太高。很久沒回去看了。', clue: { text: '高血壓、血脂高，沒有追蹤', kind: 'info' } },
    'q-family': { say: '我爸五十二歲那年，心臟病發走的。', clue: { text: '父親 52 歲心肌梗塞過世', kind: 'info' } },
    'q-surgery': { say: '沒住過院，沒開過刀。最近沒有受傷，也沒有躺著不動，天天都在爬燈架。', clue: { text: '沒有手術、外傷或久臥不動', kind: 'neg', tell: { form: 'vascular', dir: -1 }, why: WHY_NO_IMMOB } },
    'q-meds': { say: '就血壓藥，常常忘記吃。沒有吃別的，也沒有對什麼過敏。', clue: { text: '血壓藥沒有規則吃，沒有過敏', kind: 'info' } },
    'q-habits': { say: '菸抽了三十年，一天一包。酒很少，檳榔不吃。', clue: { text: '抽菸 30 年，一天一包', kind: 'info' } },
    'q-work': { say: '在港口點燈、修燈，要爬高、搬銅燈。最近沒有出遠門，身邊也沒有人生病。', clue: { text: '工作要爬高搬重，沒有旅遊或接觸史', kind: 'info' } },
    'q-life': { say: '吃得鹹，常吃宵夜。睡得還可以。跟女兒兩個人住。', clue: { text: '飲食偏鹹，與女兒同住', kind: 'info' } },
    'q-concern': { say: '我女兒今晚一個人守燈……她還在等我去交班。', clue: { text: '擔心女兒一個人值夜', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒。體重沒什麼變，晚上也不會盜汗。頭不痛，聲音沒變，吞東西也不會卡。', clue: { text: '沒有發燒、體重減輕、盜汗或聲音改變', kind: 'neg', tell: { form: 'tumor', dir: -1 }, why: WHY_NO_WEIGHT_LOSS } },
    'q-ros-cp': { say: '沒有咳嗽，也沒有咳血。現在心跳得很快；平常晚上不會喘到坐起來。', clue: { text: '沒有咳嗽或咳血；現在心悸，平常沒有夜間喘', kind: 'neg' } },
    'q-ros-gi': { say: '沒有火燒心，跟吃飯沒關係。大小便都正常。', clue: { text: '沒有火燒心，大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '手腳不會麻。腳沒有腫，小腿也不痛。', clue: { text: '手腳不麻，腳不腫，小腿不痛', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '表情痛苦，臉色蒼白，額頭和脖子都是冷汗，一手按著胸口。', clue: { text: '臉色蒼白、冒冷汗、按著胸口', kind: 'pos', key: true } },
    'x-head': { say: '結膜不蒼白，嘴唇沒有發紫。脖子和鎖骨上方摸不到腫大的淋巴結。', clue: { text: '結膜不蒼白，沒有摸到淋巴結', kind: 'neg' } },
    'x-jvp': { say: '沒有頸靜脈怒張，氣管在正中間。', clue: { text: '沒有頸靜脈怒張，氣管居中', kind: 'neg' } },
    'x-chest-touch': { say: '胸廓對稱，兩邊起伏一致。按壓胸壁不會引發一樣的痛。', clue: { text: '按壓胸壁不會引發一樣的痛', kind: 'neg', tell: { form: 'msk', dir: -1 }, why: '按不出一樣的痛，胸壁來源就比較不像。' } },
    'x-chest-listen': { say: '兩側叩診音清，呼吸音清楚、對稱，沒有囉音。', clue: { text: '兩側呼吸音清楚、對稱', kind: 'neg' } },
    'x-heart': { say: '心律規則、偏快。沒有雜音，沒有心包摩擦音。', clue: { text: '心律規則偏快，沒有雜音或摩擦音', kind: 'neg' } },
    'x-botharms': { say: '右手 102/66 mmHg，左手 104/68 mmHg。兩邊橈動脈的搏動一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg', tell: { form: 'vascular', dir: -1 }, why: WHY_ARMS_EQUAL } },
    'x-abd': { say: '腹部柔軟，上腹沒有壓痛，沒有摸到會跳動的腫塊。', clue: { text: '腹部柔軟，上腹沒有壓痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳濕冷，微血管回填約 3 秒。指甲的形狀正常。', clue: { text: '手腳濕冷，微血管回填約 3 秒', kind: 'pos', key: true } },
    'x-legs': { say: '兩邊小腿一樣粗，沒有水腫，按了不痛。', clue: { text: '小腿不腫不痛', kind: 'neg' } },
  },
  results: {
    't-ecg': { say: '竇性心律，心跳約每分鐘 110 下。II、III、aVF 導程的 ST 段上升，I、aVL 導程的 ST 段下降。' + TEXT_RESULT, clue: { text: '心電圖：II、III、aVF 的 ST 段上升', kind: 'pos', key: true, fog: 6, tell: { form: 'cardiac', dir: 1 }, why: '下壁導程的 ST 段上升，強烈支持急性冠心症。結果要由醫師判讀。' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-cxr': { say: '心臟大小正常，縱膈沒有變寬，兩側肺野清楚。' + TEXT_RESULT, clue: { text: '胸部 X 光：縱膈沒有變寬，肺野清楚', kind: 'neg' } },
    't-glucose': { say: '132 mg/dL。', clue: { text: '血糖 132 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'cardiac', exclude: { vascular: 3, tumor: 1, msk: 1 } },
  summaries: [
    { id: 's-best', text: '58 歲男性，有高血壓和抽菸史，兩週來出力就胸悶，今天持續 40 分鐘的胸口壓迫感，合併冒冷汗，血壓偏低。', score: 5, note: '有年齡、危險因子、病程、性質、伴隨症狀和目前的穩定程度，聽的人馬上知道有多急。' },
    { id: 's-ok', text: '58 歲男性，搬重物之後胸痛 40 分鐘，休息沒有改善。', score: 3, note: '病程有了，但少了壓迫感、冒冷汗和血壓偏低這幾個決定急不急的資訊。' },
    { id: 's-vague', text: '中年男性胸口不舒服，原因還不清楚。', score: 0, note: '太模糊，聽的人沒辦法判斷要不要馬上過來。' },
    { id: 's-anchor', text: '58 歲男性搬重物後胸痛，應該是胸壁拉傷。', score: 0, note: '把搬重物當成唯一的解釋。問題摘要要先講事實，再下判斷。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-acs', text: '我的診斷是心因性胸痛，擔心急性冠心症。病人現在不穩定。', score: 2, note: '說出最擔心的問題，也說出有多急。' },
      { id: 'a-unknown', text: '胸痛的原因還不清楚，生命徵象還可以。', score: 1, note: '沒有說出你擔心什麼。血壓偏低、心跳快、手腳濕冷不算「還可以」。' },
      { id: 'a-msk', text: '可能是搬東西拉傷，想先觀察看看。', score: 0, note: '持續的壓迫感合併冒冷汗，不能先當成拉傷來觀察。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-ecg', text: '請同意馬上做 12 導程心電圖，並請您判讀。', ok: true, orders: 't-ecg', note: '疑似急性冠心症，心電圖是第一項檢查，要由醫師判讀。' },
      { id: 'r-monitor', text: '我會接上監測，每 5 分鐘重測血壓，有變化馬上回報。', ok: true, note: '說出你自己接下來會做什麼。' },
      { id: 'r-wait', text: '先讓他喝點熱茶休息，半小時後再評估。', ok: false, note: '這是延遲。病人的狀況可能在這半小時裡變差。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的胸痛有可能和心臟的血管有關，我們要馬上做心電圖來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '醫師馬上過來，我會一直在旁邊。現在先躺好，不要下床出力。', ok: true, note: '說明接下來會發生什麼，以及他現在要配合的事。' },
    { id: 'e-warn', text: '如果痛得更厲害、更喘或頭暈，馬上跟我說。', ok: true, note: '交代要注意的變化。' },
    { id: 'e-concern', text: '您擔心女兒一個人值夜。您同意的話，我請同伴去通知她，也幫您交班。', ok: true, concern: true, needsClue: 'c-concern', note: '回應病人自己最在意的事，而且先問過他同不同意。' },
    { id: 'e-false', text: '應該只是累到了，休息一下就可以回去交班。', ok: false, note: '沒有根據的保證。他可能因此不肯留下來。' },
    { id: 'e-jargon', text: '您是下壁 ST 段上升型心肌梗塞，要做緊急心導管。', ok: false, note: '用了病人聽不懂的詞，而且診斷和處置要由醫師確認之後才說。' },
  ],

  // 下了診斷之後：兩分鐘內沒有人知道，他會變差；五分鐘還沒有，岑禾接手
  timeline: { worsenAfter: 120, stepInAfter: 300, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-ecg', within: 120, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['從開場做起。照你平常的順序來：問診、評估、診斷，最後才是檢查。'],
    watch: '林秋按著胸口，額頭的汗一直沒有停。',
    watchWorse: '林秋閉著眼睛，呼吸又淺又快。',
    worsen: '頭……有點暈。',
    stepIn: '我先敲鐘了。你已經知道他是什麼問題，就不能再等。',
    called: '值班鐘響了。沈渡醫師馬上到，你繼續。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。心電圖我來判讀，你接著監測，五分鐘後重測血壓。',
    reportWeak: '我聽不出來有多急。下次先講你最擔心什麼、要我做什麼。我先看病人。',
    testRead: 'II、III、aVF 的 ST 段上升。我來安排後送，你留在他旁邊。',
    explainOk: '……好，我知道了。',
    explainConcern: '……好。麻煩你們跟她說一聲，我就放心了。',
    explainBad: '是嗎……那我是不是可以回去了？',
    closing: '霧散了。把這一筆寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走：問診、評估、診斷，最後才是檢查。真實的急診不會等這麼久：疑似急性冠心症，心電圖要在到院 10 分鐘內做完。',
      '看到冒冷汗、量到血壓偏低，隨時都可以先敲值班鐘，不用等到下診斷。提早通報不會扣分。',
      '評估可以照模組從頭做到腳，也可以先做和主訴最有關的胸部和心臟，再補其他。',
    ],
    teaching: [
      { text: '急性胸痛要先找出會致命的原因：急性冠心症、主動脈剝離、肺栓塞。', ref: 'gulati2021' },
      { text: '疑似急性冠心症，要在 10 分鐘內取得並判讀 12 導程心電圖。', ref: 'rao2025' },
      { text: '胸壁按壓會痛，只是讓急性冠心症比較不像，不能單靠這一項排除。', ref: 'gulati2021' },
      { text: '血氧在 90% 以上的時候，不需要常規給氧氣。', ref: 'rao2025' },
    ],
    references: [GULATI_2021, RAO_2025],
  },
};
