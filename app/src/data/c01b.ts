// 病例 C01B：簡晴，胸痛，真身是肌肉骨骼（同一隻症影、不同的真身）。
// 虛構的教學病例，依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：病人穩定的時候，怎麼把危險的可能一個一個排除，再說「這次不是」。
import type { CaseSpec } from '../core/module.ts';
import { GULATI_2021, REVIEW_NOTE, TEXT_RESULT, WHY_ARMS_EQUAL, WHY_NO_IMMOB, WHY_NO_WEIGHT_LOSS } from './shared.ts';

export const C01B: CaseSpec = {
  format: 3,
  id: 'c01b',
  complaint: 'chest-pain',
  kind: '變體',
  title: '同一張面孔',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '簡晴', age: 42, sex: '女', job: '碼頭的搬運工', look: 'jian', pronoun: '她' },
  reading: {
    lines: ['簡晴，42 歲，碼頭的搬運工。', '左邊胸口痛了兩天。同事說「跟林秋那天一樣」，催她來公會。', '她自己走進來，說話不喘。'],
    prompts: ['最危險的可能是什麼？', '最常見的可能是什麼？', '要拿到哪些線索，我才敢說「這次不是」？'],
  },
  vitals: {
    base: { bp: '118/74', hr: 76, rr: 16, spo2: 99, bt: 36.5 },
    clue: { text: '生命徵象穩定', kind: 'neg', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（簡晴坐在床邊，看著你把手洗乾淨。）' },
    'q-intro': { say: '簡晴。霜降那天生的，四十二歲。' },
    'q-explain': { say: '好，你問吧。' },
    // 主訴
    'q-cc': { say: '左邊胸口痛。同事說跟林秋那天一樣，叫我一定要來。', clue: { text: '主訴：左胸痛', kind: 'pos' } },
    'q-onset': { say: '前天下午卸完一批貨之後開始的。那天有一箱特別重，扭了一下。', clue: { text: '兩天前搬重箱扭到之後開始', kind: 'pos', key: true, tell: { form: 'msk', dir: 1 }, why: '前面有清楚的拉扯或扭傷，胸壁的肌肉和軟骨就更可疑。' } },
    'q-location': { say: '左邊這裡。一根手指就指得出來。', clue: { text: '左胸一個點，一根手指指得出來', kind: 'pos', key: true, tell: { form: 'msk', dir: 1 }, why: '指得出一個點的痛，更像胸壁。心臟缺血的痛通常是一整片，說不出確切的位置。' } },
    'q-duration': { say: '動到才痛，一次幾秒鐘就過了。不動就沒事。', clue: { text: '每次只痛幾秒，不動不痛', kind: 'pos', key: true, tell: { form: 'cardiac', dir: -1 }, why: '只痛幾秒、不動就不痛，不是心臟缺血的樣子。缺血的痛通常持續好幾分鐘。' } },
    'q-character': { say: '刺刺的，像被針扎一下。不會悶，也沒有被撕開的感覺。', clue: { text: '刺痛，不悶，沒有撕裂感', kind: 'pos' } },
    'q-assoc': { say: '都沒有。不會冒汗、不會想吐，也不喘、不頭暈、不咳嗽。', clue: { text: '沒有冒冷汗、噁心、喘或頭暈', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, alsoOk: [{ form: 'vascular', dir: -1 }], why: '沒有冒冷汗、噁心、喘，心臟和大血管的急症都比較不像。但症狀可以不典型，所以還是要有心電圖。' } },
    'q-factors': { say: '抬手、轉身、深呼吸到底的時候會刺一下。走路、爬樓梯都不會。不動就好了。', clue: { text: '抬手、轉身、深呼吸會痛，走路爬樓梯不會', kind: 'pos', key: true, tell: { form: 'msk', dir: 1 }, why: '跟特定的動作有關、跟走路出力無關，更像胸壁。' } },
    'q-radiate': { say: '不會，就在這一點。背也不痛。', clue: { text: '不會傳到別處，背不痛', kind: 'neg' } },
    'q-treat': { say: '沒看大夫。自己貼了藥布，有好一點。', clue: { text: '自己貼藥布，有改善', kind: 'info' } },
    'q-severity': { say: '動到的時候五分，不動零分。', clue: { text: '動的時候 5 分，不動不痛', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有。去年公會的體檢都正常。', clue: { text: '沒有慢性病', kind: 'info' } },
    'q-family': { say: '我媽七十歲那年，心臟裝了支架。', clue: { text: '母親 70 歲裝心臟支架', kind: 'info' } },
    'q-surgery': { say: '沒住過院、沒開過刀。沒有撞到，也沒有躺著不動，每天都在搬貨。', clue: { text: '沒有手術、撞傷或久臥不動', kind: 'neg', tell: { form: 'vascular', dir: -1 }, why: WHY_NO_IMMOB } },
    'q-meds': { say: '沒有固定吃藥，調經的藥也沒有。沒有過敏。', clue: { text: '沒有固定用藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '不抽菸，不吃檳榔。酒偶爾喝一點。', clue: { text: '不抽菸', kind: 'info' } },
    'q-work': { say: '在碼頭搬貨，天天要抬重的。最近沒有出遠門，身邊沒有人生病。', clue: { text: '搬運工，每天抬重物', kind: 'info' } },
    'q-life': { say: '吃睡都正常。這幾天趕船期，比較累。一個人住。', clue: { text: '最近趕工比較累', kind: 'info' } },
    'q-concern': { say: '我怕是心臟。我媽就是心臟不好……而且明天還有一船貨要卸。', clue: { text: '怕是心臟；明天還要上工', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒，也不會盜汗。體重沒變。頭不痛，聲音也沒變。', clue: { text: '沒有發燒、體重減輕、盜汗或聲音改變', kind: 'neg', tell: { form: 'tumor', dir: -1 }, why: WHY_NO_WEIGHT_LOSS } },
    'q-ros-cp': { say: '沒有咳嗽，沒有痰，也沒有咳血。不會心悸，晚上睡得很平。', clue: { text: '沒有咳嗽、咳血、心悸或夜間喘', kind: 'neg' } },
    'q-ros-gi': { say: '沒有火燒心，跟吃東西沒關係。大小便正常。', clue: { text: '沒有火燒心，大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '手腳不麻。腳沒有腫，小腿不痛。', clue: { text: '手腳不麻，腳不腫，小腿不痛', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '坐得很直，表情自然，說話不喘。抬起左手的時候皺了一下眉。', clue: { text: '外觀自在，抬左手會皺眉', kind: 'info' } },
    'x-head': { say: '結膜不蒼白。脖子和鎖骨上方摸不到腫大的淋巴結。', clue: { text: '結膜不蒼白，沒有摸到淋巴結', kind: 'neg' } },
    'x-jvp': { say: '沒有頸靜脈怒張，氣管在正中間。', clue: { text: '沒有頸靜脈怒張，氣管居中', kind: 'neg' } },
    'x-chest-touch': { say: '胸廓對稱，皮膚沒有紅疹或瘀青。按壓左側第四、五肋軟骨交界的地方，引發一模一樣的痛。', clue: { text: '按壓左側肋軟骨會重現一樣的痛', kind: 'pos', key: true, tell: { form: 'msk', dir: 1 }, why: '按得出一模一樣的痛，胸壁來源就更像。但這只是讓心臟比較不像，不能單靠它排除。' } },
    'x-chest-listen': { say: '兩側叩診音清，呼吸音清楚、對稱。', clue: { text: '兩側呼吸音清楚、對稱', kind: 'neg' } },
    'x-heart': { say: '心律規則。沒有雜音，沒有心包摩擦音。', clue: { text: '心律規則，沒有雜音或摩擦音', kind: 'neg' } },
    'x-botharms': { say: '右手 118/74 mmHg，左手 116/72 mmHg。兩邊脈搏一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg', tell: { form: 'vascular', dir: -1 }, why: WHY_ARMS_EQUAL } },
    'x-abd': { say: '腹部柔軟，沒有壓痛。', clue: { text: '腹部柔軟，沒有壓痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。指甲的形狀正常。', clue: { text: '手腳溫暖，循環良好', kind: 'neg' } },
    'x-legs': { say: '兩邊小腿一樣粗，沒有水腫，按了不痛。', clue: { text: '小腿不腫不痛', kind: 'neg' } },
  },
  results: {
    't-ecg': { say: '竇性心律，每分鐘 76 下，沒有 ST 段或 T 波的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心律，沒有 ST-T 變化', kind: 'neg', key: true, fog: 5, tell: { form: 'cardiac', dir: -1 }, why: '心電圖正常，急性冠心症比較不像。但一次正常的心電圖不能完全排除，症狀變了要再做。' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-cxr': { say: '心臟大小正常，縱膈沒有變寬，肺野清楚，沒有看到肋骨骨折。' + TEXT_RESULT, clue: { text: '胸部 X 光：沒有異常', kind: 'neg' } },
    't-glucose': { say: '96 mg/dL。', clue: { text: '血糖 96 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'msk', exclude: { cardiac: 2, vascular: 2, tumor: 1 } },
  summaries: [
    { id: 's-best', text: '42 歲女性，沒有慢性病，兩天前搬重物後左胸局部刺痛，動作和按壓會重現，生命徵象穩定。', score: 5, note: '有年齡、背景、病程、性質、會重現的條件和穩定程度，聽的人知道這不急，也知道你為什麼這樣想。' },
    { id: 's-ok', text: '42 歲女性，搬貨後胸痛兩天。', score: 3, note: '病程有了，但少了「局部、動作和按壓會重現、生命徵象穩定」這幾個關鍵。' },
    { id: 's-vague', text: '年輕女性胸口痛，應該沒事。', score: 0, note: '沒有事實，只有結論。「應該沒事」要用線索來支持。' },
    { id: 's-anchor', text: '42 歲女性胸痛，母親有心臟病，要當成心臟病處理。', score: 0, note: '被家族史帶著走。母親 70 歲才發病，而且這次的痛和心臟缺血的樣子不一樣。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-msk', text: '我的診斷是胸壁的肌肉骨骼疼痛，病人目前穩定。', score: 2, note: '說出你的判斷，也說出病人穩定。' },
      { id: 'a-unknown', text: '胸痛的原因還不清楚。', score: 1, note: '你手上的線索其實夠你做出判斷了。' },
      { id: 'a-acs', text: '我擔心是急性冠心症，請您馬上過來。', score: 0, note: '線索並不支持。過度通報會讓真正急的病人等。' },
    ],
    requests: [
      { id: 'r-read', text: '為了排除心臟的問題，請同意做一張心電圖，有空的時候請您判讀。', ok: true, orders: 't-ecg', note: '急性胸痛都要有心電圖，而且要由醫師判讀。' },
      { id: 'r-plan', text: '我會衛教休息和止痛，並交代什麼情況要馬上回來。', ok: true, note: '說出你自己接下來會做什麼。' },
      { id: 'r-come', text: '請您現在放下手邊的事過來。', ok: false, note: '病人穩定，不需要醫師放下其他病人。' },
      { id: 'r-none', text: '不需要醫師看，我直接讓她回去。', ok: false, note: '心電圖要由醫師判讀，處置也要讓醫師知道。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '目前看起來比較像胸壁的肌肉拉傷，心電圖也沒有看到問題。', ok: true, note: '用病人聽得懂的話說出評估的結果，沒有把話說死。' },
    { id: 'e-plan', text: '這幾天先不要搬重的東西，可以熱敷，痛的時候照醫師開的止痛藥吃。', ok: true, note: '說明接下來怎麼照顧自己。' },
    { id: 'e-warn', text: '如果變成一整片的悶、痛超過幾分鐘、會喘、冒冷汗，或是痛到背後，要馬上回來。', ok: true, note: '交代什麼情況要馬上回來。這是讓病人安全回家的最後一道。' },
    { id: 'e-concern', text: '您擔心是心臟。今天的評估和心電圖都沒有看到心臟的問題；您母親的病史我記下了，之後可以安排檢查血壓和血脂。', ok: true, concern: true, needsClue: 'c-concern', note: '回應她最怕的事，用今天的線索回答，也給了後續。' },
    { id: 'e-false', text: '絕對不是心臟，完全不用擔心。', ok: false, note: '把話說死了。沒有一項檢查可以保證「絕對」。' },
    { id: 'e-jargon', text: '這是肋軟骨炎，吃非類固醇消炎藥就好。', ok: false, note: '用了病人聽不懂的詞，診斷和用藥也要由醫師確認。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-ecg', within: 300, points: 3 }, { type: 'exclude', forms: ['cardiac', 'vascular', 'tumor'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['同樣是胸痛，換了一個人。流程一樣，先別急著說是同一個答案。'],
    watch: '簡晴坐得很直，偶爾動一下左邊的肩膀，皺一下眉。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。說吧，怎麼回事？',
    reportGood: '聽起來是胸壁的問題。心電圖出來我會看，照你的計畫處理。',
    reportWeak: '我聽不出你的判斷。先說你認為是什麼，再說要我做什麼。',
    explainOk: '好，那我放心一點了。',
    explainConcern: '……原來不是心臟。我媽那件事，我一直放在心上。謝謝你。',
    explainBad: '真的嗎？那我回去上工了。',
    closing: '霧散了。同一隻蛾，這一次的真身不一樣。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓她知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '不敲值班鐘，改成向醫師回報你的診斷和計畫，是比較適當的層級。',
      '心電圖可以自己先提出，也可以在回報的時候一起請醫師同意。',
      '抽血和 X 光不是每一位都要做。提出之前先想：結果會不會改變你的處理。',
    ],
    teaching: [
      { text: '只痛幾秒、指得出一個點、跟姿勢有關的胸痛，比較不像心臟缺血。', ref: 'gulati2021' },
      { text: '胸壁按壓會重現一樣的痛，支持胸壁來源，但只是一筆證據；危險的原因要另外排除。', ref: 'gulati2021' },
      { text: '急性胸痛都要做心電圖。一次正常的心電圖，不能完全排除急性冠心症。', ref: 'gulati2021' },
      { text: '女性的急性冠心症，症狀可能不典型。不能因為年紀輕、是女性，就先排除。', ref: 'gulati2021' },
    ],
    references: [GULATI_2021],
  },
};
