// 病例 C01A：林秋，胸痛，真身是急性冠心症（危險的那一版）。
// 虛構的教學病例，依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。
import type { CaseSpec } from '../core/module.ts';
import { GULATI_2021, RAO_2025, REVIEW_NOTE } from './shared.ts';

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
    prompts: ['最危險的可能是什麼？', '最常見的可能是什麼？', '我第一件要知道的事是什麼？有什麼要同時處理？'],
  },
  vitals: {
    base: { bp: '103/68', hr: 108, rr: 24, spo2: 96, bt: 36.4 },
    worse: { bp: '86/58', hr: 118, rr: 26, spo2: 95, bt: 36.4 },
    clue: { text: '血壓偏低、心跳快、呼吸快', kind: 'pos', key: true },
  },

  answers: {
    'q-intro': { say: '林秋……好，麻煩你了。' },
    'q-concern': { say: '我女兒今晚一個人值夜守燈……她還在等我去交班。', clue: { text: '擔心女兒一個人值夜', kind: 'info' } },
    'q-onset': { say: '搬到第三盞燈的時候開始的。大概四十分鐘了，休息也沒有比較好。', clue: { text: '持續 40 分鐘，休息沒有好', kind: 'pos', key: true, tell: { form: 'acs', dir: 1 }, why: '休息也不緩解、持續這麼久的胸痛，要先想到心臟。' } },
    'q-quality': { say: '胸口正中間，像被什麼壓住。', clue: { text: '胸口正中，壓迫感', kind: 'pos', key: true, tell: { form: 'acs', dir: 1 }, why: '壓、悶、緊，一整片指不出一個點，是心臟缺血常見的說法。' } },
    'q-radiate': { say: '一路到左手臂，下巴也有點緊。', clue: { text: '傳到左臂和下巴', kind: 'pos', key: true, tell: { form: 'acs', dir: 1 }, why: '會傳到手臂、下巴或肩膀的胸痛，更像心臟。' } },
    'q-severity': { say: '八分吧……比以前任何一次都厲害。', clue: { text: '疼痛 8 分', kind: 'pos' } },
    'q-provoke': { say: '在搬銅燈上架子。這兩個禮拜爬坡會悶，停下來幾分鐘就好。這次不一樣。', clue: { text: '這兩週出力就悶，這次休息不緩解', kind: 'pos', key: true } },
    'q-worse': { say: '都不會，怎麼動都一樣。', clue: { text: '呼吸、轉身、按壓都不影響', kind: 'neg', tell: { form: 'msk', dir: -1 }, why: '跟呼吸、姿勢、按壓都沒關係，就比較不像胸壁的問題。' } },
    'q-tear': { say: '沒有，背不痛。就是壓著。', clue: { text: '沒有撕裂感，沒有痛到背', kind: 'neg', tell: { form: 'dissection', dir: -1 }, why: '突然、像撕裂、痛到背，是主動脈剝離的典型說法。沒有，就比較不像；但不能只靠這一條排除。' } },
    'q-relief': { say: '坐著好一點點，沒有完全好。沒吃藥。', clue: { text: '坐著只好一點點', kind: 'pos' } },
    'q-assoc': { say: '一直冒冷汗，還有點想吐。', clue: { text: '冒冷汗、噁心', kind: 'pos', key: true, tell: { form: 'acs', dir: 1 }, why: '冒冷汗、噁心跟著胸痛一起來，更像心臟。' } },
    'q-sob': { say: '有一點喘。沒有昏倒，只是很虛。', clue: { text: '有點喘，沒有昏倒', kind: 'pos' } },
    'q-pmh': { say: '高血壓五年，在藥舖拿藥。大夫說過血脂偏高，我沒理它。', clue: { text: '高血壓、血脂偏高', kind: 'info' } },
    'q-meds': { say: '血壓藥，有時候忘記吃。沒有過敏。', clue: { text: '血壓藥沒有規則吃，無藥物過敏', kind: 'info' } },
    'q-family': { say: '我爸五十二歲那年心肌梗塞走的。', clue: { text: '父親 52 歲心肌梗塞', kind: 'info' } },
    'q-smoke': { say: '菸抽了三十年，一天一包。酒很少。', clue: { text: '抽菸 30 年', kind: 'info' } },
    'q-immob': { say: '沒有，天天都在走動幹活。', clue: { text: '沒有久坐、腿腫或手術', kind: 'neg', tell: { form: 'pe', dir: -1 }, why: '沒有久坐不動、腿腫或剛開刀，肺栓塞的危險因子就少，比較不像。' } },
    'q-ros-cv': { say: '都沒有。', clue: { text: '沒有心悸、夜間喘或腳腫', kind: 'neg' } },
    'q-ros-resp': { say: '沒有。', clue: { text: '沒有咳嗽、咳血或發燒', kind: 'neg' } },
    'q-ros-gi': { say: '沒有，跟吃飯沒關係。', clue: { text: '沒有火燒心，跟吃東西無關', kind: 'neg' } },
    'q-trauma': { say: '沒有。', clue: { text: '胸口沒有撞到或拉傷', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '表情痛苦，臉色蒼白，額頭和脖子都是冷汗，一手按著胸口。', clue: { text: '臉色蒼白、冒冷汗、按著胸口', kind: 'pos', key: true } },
    'x-botharms': { say: '右手 102/66 mmHg，左手 104/68 mmHg，沒有明顯差別。', clue: { text: '兩手血壓沒有明顯差別', kind: 'neg', tell: { form: 'dissection', dir: -1 }, why: '兩手血壓差很多，要想到主動脈剝離。沒有差別，就比較不像。' } },
    'x-heart': { say: '心律規則、偏快。沒有雜音，沒有心包摩擦音。', clue: { text: '心律規則偏快，沒有雜音或摩擦音', kind: 'neg' } },
    'x-lungs': { say: '兩側呼吸音清楚、對稱，沒有囉音。', clue: { text: '兩側呼吸音清楚、對稱', kind: 'neg' } },
    'x-jvp': { say: '沒有頸靜脈怒張。', clue: { text: '沒有頸靜脈怒張', kind: 'neg' } },
    'x-perfusion': { say: '手腳濕冷，微血管回填約 3 秒。', clue: { text: '手腳濕冷，微血管回填約 3 秒', kind: 'pos', key: true } },
    'x-legs': { say: '兩側橈動脈、足背動脈的搏動對稱。兩腳沒有水腫，小腿沒有壓痛。', clue: { text: '脈搏對稱，小腿不腫不痛', kind: 'neg' } },
    'x-chestwall': { say: '按壓胸壁不會引發一樣的痛。', clue: { text: '按壓胸壁不會引發一樣的痛', kind: 'neg', tell: { form: 'msk', dir: -1 }, why: '按不出一樣的痛，胸壁來源就比較不像。' } },
    'x-abd': { say: '腹部柔軟，上腹沒有壓痛。', clue: { text: '腹部柔軟，上腹沒有壓痛', kind: 'neg' } },
  },
  results: {
    't-record': { say: '兩年前的紀錄：高血壓，建議戒菸，之後沒有回來追蹤。沒有做過心電圖。', clue: { text: '舊紀錄：高血壓沒有追蹤，沒做過心電圖', kind: 'info' } },
    't-ecg': { say: '竇性心律，心跳約每分鐘 110 下。II、III、aVF 導程的 ST 段上升，I、aVL 導程的 ST 段下降。（訓練用的文字結果，要由值班醫師判讀。）', clue: { text: '心電圖：II、III、aVF 的 ST 段上升', kind: 'pos', key: true, fog: 6, tell: { form: 'acs', dir: 1 }, why: '下壁導程的 ST 段上升，強烈支持急性冠心症。結果要由醫師判讀。' } },
    't-glucose': { say: '132 mg/dL。', clue: { text: '血糖 132 mg/dL', kind: 'neg' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-cxr': { pending: '已經排上，還沒輪到，這一關裡等不到。' },
  },

  answer: { truth: 'acs', exclude: { dissection: 2, pe: 2, msk: 1 } },
  summaries: [
    { id: 's-best', text: '58 歲男性，有高血壓和抽菸史，急性持續 40 分鐘的胸口壓迫感，合併冒冷汗，血壓偏低。', score: 5, note: '有年齡、危險因子、病程、性質、伴隨症狀和目前的穩定程度，聽的人馬上知道有多急。' },
    { id: 's-ok', text: '58 歲男性，搬重物之後胸痛 40 分鐘，休息沒有改善。', score: 3, note: '病程有了，但少了壓迫感、冒冷汗和血壓偏低這幾個決定急不急的資訊。' },
    { id: 's-vague', text: '中年男性胸口不舒服，原因還不清楚。', score: 0, note: '太模糊，聽的人沒辦法判斷要不要馬上過來。' },
    { id: 's-anchor', text: '58 歲男性搬重物後胸痛，應該是胸壁拉傷。', score: 0, note: '一句話裡直接下了診斷，而且把搬重物當成唯一的解釋。問題摘要要先講事實。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-acs', text: '我擔心是急性冠心症，病人現在不穩定。', score: 2, note: '說出最擔心的問題，也說出有多急。' },
      { id: 'a-unknown', text: '胸痛的原因還不清楚，生命徵象還可以。', score: 1, note: '沒有說出你擔心什麼。血壓偏低、心跳快、手腳濕冷不算「還可以」。' },
      { id: 'a-msk', text: '可能是搬東西拉傷，想先觀察看看。', score: 0, note: '持續的壓迫感合併冒冷汗，不能先當成拉傷來觀察。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-ecg', text: '請同意馬上做 12 導程心電圖，並請您判讀。', ok: true, orders: 't-ecg', note: '疑似急性冠心症要在 10 分鐘內取得並判讀心電圖。' },
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

  timeline: { worsenAt: 240, stepInAt: 480, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-ecg', by: 600, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['你現在最想知道什麼？有什麼要同時處理？'],
    watch: '林秋按著胸口，額頭的汗一直沒有停。',
    watchWorse: '林秋閉著眼睛，呼吸又淺又快。',
    worsen: '頭……有點暈。',
    stepIn: '我先敲鐘了。這個病人不能再等。',
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
      '先敲鐘、再補問病史，或是先量生命徵象、看到血壓偏低就敲鐘，兩種順序都可以。',
      '心電圖可以在敲鐘之前就先提出，不用等醫師到。',
      '病史不用一次問完。先問會改變處置的幾題，穩定之後再補齊。',
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
