// 病例 C03A：方苓，腹痛，真身是膽囊與膽道（急性膽囊炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：上腹痛不能只看位置。用「怎麼開始、痛到哪裡、摸起來怎樣」把膽、胰臟、胃分開。
import type { CaseSpec } from '../core/module.ts';
import { GULATI_2021, REVIEW_NOTE, TEXT_RESULT, YOKOE_2018 } from './shared.ts';

export const C03A: CaseSpec = {
  format: 3,
  id: 'c03a',
  complaint: 'abdomen',
  kind: '示範',
  title: '晚餐之後',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '方苓', age: 46, sex: '女', job: '港邊炸魚攤的老闆娘', look: 'ling', pronoun: '她' },
  reading: {
    lines: ['方苓，46 歲，港邊炸魚攤的老闆娘。', '昨天晚上收攤吃完飯，右上腹開始痛，痛了一整夜沒有停，吐了兩次。早上先生陪她來公會。', '她彎著腰走進來，一手按著右邊肋骨下面，額頭有一點汗。'],
    prompts: ['最危險的可能是什麼？', '上腹這一帶，裡面住著哪幾個器官？', '哪幾條線索可以幫我分出是膽、是胰臟，還是胃？'],
  },
  vitals: {
    base: { bp: '132/82', hr: 98, rr: 20, spo2: 98, bt: 38.2 },
    clue: { text: '發燒 38.2 度、心跳偏快，血壓正常', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（方苓側躺著，膝蓋縮起來，一手護著右邊的肋骨下面。）' },
    'q-intro': { say: '方苓。小滿那天生的，四十六。' },
    'q-explain': { say: '好……麻煩你，摸的時候輕一點。' },
    // 主訴
    'q-cc': { say: '肚子痛。右邊上面這裡，痛了一整夜。', clue: { text: '主訴：右上腹痛了一整夜', kind: 'pos' } },
    'q-onset': { say: '昨天晚上收攤，吃完晚飯大概一個鐘頭開始的。晚飯是賣剩的炸魚，配一鍋滷肥肉。', clue: { text: '吃完油膩的晚餐一小時後開始痛', kind: 'pos', key: true, tell: { form: 'biliary', dir: 1 }, why: '吃了油的東西，膽囊會用力收縮。這時候才痛起來，要想到石頭卡在膽囊的出口。' } },
    'q-location': { say: '右邊肋骨下面這一塊。從一開始就在這裡，沒有換過地方。', clue: { text: '右上腹，位置沒有移動過', kind: 'pos', key: true } },
    'q-duration': { say: '一開始一陣一陣的，後來就一直痛。到現在十幾個鐘頭了，沒有停過。', clue: { text: '持續痛了十幾個小時沒有停', kind: 'pos', key: true, tell: { form: 'biliary', dir: 1 }, why: '石頭卡住的痛，通常幾個小時內會自己過去。痛了十幾個小時還不停，要想到膽囊已經發炎了。' } },
    'q-character': { say: '脹脹的，又像被人擰著。很深。不是燒的那種。', clue: { text: '深處的脹痛和絞痛，不是燒灼感', kind: 'pos' } },
    'q-assoc': { say: '吐了兩次，吐的都是晚上吃的東西。有發燒，一陣一陣發冷。沒有拉肚子。先生說我的眼睛沒有變黃。', clue: { text: '嘔吐兩次、發燒畏寒；沒有腹瀉，沒有黃疸', kind: 'pos', key: true } },
    'q-factors': { say: '深呼吸的時候更痛，所以不敢用力吸。怎麼躺都差不多。現在聞到油味就想吐。', clue: { text: '深呼吸會加重，換姿勢沒有差別', kind: 'pos' } },
    'q-radiate': { say: '會痛到右邊肩膀後面，肩胛骨那裡。不會直直穿到背的中間。', clue: { text: '痛到右肩胛；不會穿到背的中間', kind: 'pos', key: true, tell: { form: 'biliary', dir: 1 }, why: '膽囊的痛常常傳到右肩或右肩胛。胰臟炎的痛，比較常直直穿到背的中間。' } },
    'q-treat': { say: '半夜吃了兩包胃藥，一點用都沒有。', clue: { text: '吃胃藥沒有改善', kind: 'info' } },
    'q-severity': { say: '最痛的時候九分，現在七分。', clue: { text: '最痛 9 分，現在 7 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有什麼病。不過這半年有三四次，吃完油的東西，右上腹悶悶地痛，一兩個鐘頭自己就好了，所以沒去看。', clue: { text: '半年來數次飯後右上腹痛，一兩小時自己緩解', kind: 'pos', key: true, tell: { form: 'biliary', dir: 1 }, why: '吃完油的就痛、一兩個小時自己好，是膽絞痛的樣子。這一次沒有好，表示又往前走了一步。' } },
    'q-family': { say: '我媽和我姊，膽都開過刀。', clue: { text: '母親和姊姊都開過膽囊的刀', kind: 'info', key: true } },
    'q-surgery': { say: '兩個孩子都是自己生的。肚子沒開過刀，最近也沒有撞到。', clue: { text: '沒有腹部手術或外傷', kind: 'neg' } },
    'q-meds': { say: '沒有固定吃藥，止痛藥也很少吃。沒有過敏。', clue: { text: '沒有固定用藥，很少吃止痛藥', kind: 'info' } },
    'q-habits': { say: '不抽菸。酒幾乎不喝，一年喝不到兩次。', clue: { text: '幾乎不喝酒', kind: 'neg', tell: { form: 'pancreas', dir: -1 }, why: '喝酒是胰臟炎常見的原因。幾乎不喝，就少一個理由。不過膽結石也會引起胰臟炎，所以血還是要抽。' } },
    'q-work': { say: '炸魚攤，每天站十幾個鐘頭。最近沒有出遠門，一起吃飯的家人都沒事。', clue: { text: '一起吃飯的家人都沒有不舒服', kind: 'neg' } },
    'q-life': { say: '三餐都吃攤子上的東西，忙起來一天只吃兩頓。昨天晚上痛到沒睡。', clue: { text: '飲食油膩、三餐不定時', kind: 'info' } },
    'q-concern': { say: '我姊開完刀躺了半個月……我怕也要開刀。攤子沒人顧，月底還有貨款要付。', clue: { text: '怕要開刀；掛心攤子和貨款', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '有發燒、發冷。體重沒什麼變。聲音沒變。', clue: { text: '發燒畏寒，體重沒有變', kind: 'pos' } },
    'q-ros-cp': { say: '沒有咳嗽，不會喘，胸口不悶，心也不會亂跳。', clue: { text: '沒有咳嗽、喘、胸悶或心悸', kind: 'neg' } },
    'q-ros-gi': { say: '大便昨天早上解過，黃色的，跟平常一樣，沒有黑也沒有變白。沒有拉肚子、沒有便秘。小便顏色深一點，不會痛。月經上個禮拜剛結束。', clue: { text: '排便正常，顏色沒有改變；月經上週剛結束', kind: 'neg', tell: { form: 'diverticulum', dir: -1 }, why: '排便沒有改變，左下腹也不痛，大腸憩室炎就比較不像。' } },
    'q-ros-limb': { say: '手腳都正常。腳沒有腫。', clue: { text: '手腳正常', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '側躺，膝蓋縮著，一手護著右上腹。額頭有汗，翻身的動作很慢。', clue: { text: '縮著身體護著右上腹，冒汗', kind: 'pos', key: true } },
    'x-head': { say: '眼白沒有變黃。嘴唇有點乾。', clue: { text: '沒有黃疸，嘴唇偏乾', kind: 'neg' } },
    'x-heart-lung': { say: '心跳偏快，規則，沒有雜音。兩邊呼吸音清楚，右邊吸得比較淺。', clue: { text: '心肺聽診沒有異常，右側吸氣較淺', kind: 'neg' } },
    'x-abd-look': { say: '肚子平坦，沒有疤，沒有鼓起來。腸音聽得到，比平常少一點。', clue: { text: '腹部平坦、沒有疤痕，腸音稍減', kind: 'neg' } },
    'x-abd-perc': { say: '大部分是鼓音。敲到右上腹的時候，她整個人縮了一下。', clue: { text: '右上腹叩痛', kind: 'pos' } },
    'x-abd-light': { say: '右上腹輕輕碰就痛，肌肉繃起來。上腹正中間和左上腹是軟的，不痛。', clue: { text: '右上腹壓痛、肌肉緊繃；上腹正中和左上腹不痛', kind: 'pos', key: true, tell: { form: 'pancreas', dir: -1 }, why: '胰臟炎和胃潰瘍的壓痛，多半在上腹正中間或偏左。那裡是軟的、不痛，就比較不像。' } },
    'x-abd-deep': { say: '右上腹深壓很痛。右下腹、左下腹壓下去不痛，放開也不痛。', clue: { text: '右下腹和左下腹沒有壓痛或反彈痛', kind: 'neg', tell: { form: 'appendix', dir: -1 }, alsoOk: [{ form: 'diverticulum', dir: -1 }], why: '闌尾炎的壓痛在右下腹，憩室炎在左下腹。下面兩邊都不痛，這兩個就比較不像。' } },
    'x-abd-sign': { say: '按著右邊肋骨的下緣請她深吸氣，她吸到一半痛得停住（Murphy 徵象陽性）。按左下腹，右下腹不會痛。右腿往後伸不會痛。', clue: { text: 'Murphy 徵象陽性', kind: 'pos', key: true, tell: { form: 'biliary', dir: 1 }, why: '按著右肋下吸氣，吸到一半痛得停住，是膽囊發炎很有用的一個徵象。' } },
    'x-cva': { say: '兩邊腰的後面，敲了都不痛。', clue: { text: '兩側腰部敲擊不痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。皮膚沒有變黃。', clue: { text: '末梢溫暖，皮膚沒有變黃', kind: 'neg' } },
  },
  results: {
    't-us': { say: '膽囊裡有好幾顆結石，膽囊壁變厚，膽囊旁邊有一點積水；探頭壓在膽囊上，她會喊痛。膽管沒有變粗。' + TEXT_RESULT, clue: { text: '超音波：膽結石、膽囊壁增厚、膽囊周圍積液', kind: 'pos', key: true, fog: 6, tell: { form: 'biliary', dir: 1 }, why: '局部的徵象（Murphy 徵象、右上腹壓痛）、全身的發炎（發燒），再加上影像的發現，三樣都有了。' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-urine': { say: '尿裡沒有血，沒有發炎的跡象。驗孕是陰性。' + TEXT_RESULT, clue: { text: '驗尿正常，驗孕陰性', kind: 'neg' } },
    't-ecg': { say: '竇性心律，每分鐘 96 下，沒有 ST 段或 T 波的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心律，沒有 ST-T 變化', kind: 'neg' } },
  },

  answer: { truth: 'biliary', exclude: { pancreas: 2, appendix: 2, diverticulum: 1 } },
  summaries: [
    { id: 's-best', text: '46 歲女性，半年來數次飯後右上腹痛，昨晚吃完油膩的晚餐後右上腹持續痛了十幾個小時，痛到右肩胛，合併嘔吐和發燒 38.2 度；Murphy 徵象陽性，血壓正常。', score: 5, note: '有年齡、以前的發作、這一次怎麼開始、多久、痛到哪裡、伴隨的症狀、最有力的徵象和目前的穩定程度。' },
    { id: 's-ok', text: '46 歲女性，昨晚開始右上腹痛，有吐、有發燒。', score: 3, note: '位置和症狀有了，但少了「吃完油的才痛、痛了十幾個小時、Murphy 徵象」這幾個關鍵。' },
    { id: 's-vague', text: '中年女性肚子痛，可能是吃壞肚子。', score: 0, note: '沒有拉肚子，一起吃飯的人也沒事。「吃壞肚子」沒有線索支持。' },
    { id: 's-anchor', text: '46 歲女性上腹痛，吃胃藥沒效，應該是胃潰瘍，換一種胃藥。', score: 0, note: '把上腹痛直接當成胃。壓痛在右上腹、會痛到右肩胛、有發燒，都不是胃潰瘍的樣子。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-chole', text: '我的診斷是膽囊與膽道的問題，擔心急性膽囊炎。病人有發燒，血壓和血氧穩定。', score: 2, note: '說出你的判斷，也說出目前的穩定程度。' },
      { id: 'a-unknown', text: '腹痛的原因還不清楚，有發燒。', score: 1, note: '你手上的線索其實夠你說出方向了。' },
      { id: 'a-gastro', text: '應該是腸胃炎，想先給止吐藥讓她回去。', score: 0, note: '沒有腹瀉，右上腹有壓痛和肌肉緊繃，又發燒，不能當成腸胃炎放回去。' },
    ],
    requests: [
      { id: 'r-us', text: '請同意安排腹部超音波，並抽血驗血球和肝膽胰指數。', ok: true, orders: 't-us', note: '懷疑膽囊炎，超音波是第一線的影像。抽血同時看胰臟有沒有一起發炎。' },
      { id: 'r-see', text: '請您今天過來評估，看需不需要會診外科。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-npo', text: '我先讓她禁食、躺著休息，定時量體溫，記錄疼痛。', ok: true, note: '說出你自己接下來會做什麼。可能要進一步處置的腹痛，先禁食。' },
      { id: 'r-eat', text: '她一整夜沒吃，先讓她喝點粥墊墊胃。', ok: false, note: '吃東西會讓膽囊再收縮一次，而且她可能需要進一步的處置，現在要禁食。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的痛看起來是膽囊發炎，可能有石頭卡住了。我們會做超音波、抽血來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '結果出來之前，先不要吃東西、喝水。醫師今天會過來看，再決定怎麼治療。', ok: true, note: '說明接下來會發生什麼，以及她現在要配合的事。' },
    { id: 'e-warn', text: '如果痛突然變成整個肚子、肚子變得很硬、發高燒發抖，或是眼睛變黃，馬上跟我說。', ok: true, note: '交代什麼情況要馬上說。' },
    { id: 'e-concern', text: '您怕要開刀，也擔心攤子和貨款。要不要開、什麼時候開，醫師看完檢查會把幾種做法跟您說清楚。攤子的事，要不要我請您先生進來一起商量？', ok: true, concern: true, needsClue: 'c-concern', note: '回應她最怕的事，沒有替醫師做決定，也把家人拉進來一起想。' },
    { id: 'e-false', text: '吃個胃藥、休息一天就會好了。', ok: false, note: '沒有根據的保證。胃藥她已經吃過了，沒有用。' },
    { id: 'e-jargon', text: '您是急性膽囊炎，今天就要做腹腔鏡把膽囊拿掉。', ok: false, note: '用了病人聽不懂的詞，而且診斷和手術要由醫師確認、說明。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-us', within: 300, points: 3 }, { type: 'exclude', forms: ['pancreas', 'appendix', 'diverticulum'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一隻的四盞燈，分在肚子的四個角落。可是不要只看牠痛在哪裡，要問牠是怎麼開始的。'],
    watch: '方苓縮著身體側躺，偶爾吸一口氣到一半就停住。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。血壓穩的，是什麼事等不了？',
    reportGood: '收到。先做超音波、抽血，禁食。我看完結果過去，需要的話我來找外科。',
    reportWeak: '我聽不出你的判斷。先說你認為是哪個器官、有沒有發燒，再說要我做什麼。',
    explainOk: '好……我先不吃。',
    explainConcern: '……好，你叫他進來。有人一起聽，我比較不怕。',
    explainBad: '可是我半夜就吃過胃藥了啊……',
    closing: '霧散了。結繩蟹的第一個結解開了。寫進圖鑑吧。',
    hintNoExplain: '摸肚子之前，先讓她知道你要做什麼、會碰哪裡，而且從不痛的地方開始。',
  },

  debrief: {
    alternatives: [
      '這位病人血壓和血氧都穩，不用敲值班鐘；但有發燒和局部的肌肉緊繃，今天一定要回報。',
      '腹部照「看、聽、敲、摸」的順序。先摸再聽，腸音會被你摸亂。',
      '心電圖不是每一位腹痛都要做；年紀比較大、有心血管危險因子的上腹痛，做一張比較安心。',
    ],
    teaching: [
      { text: '急性膽囊炎的診斷看三樣：局部的徵象（Murphy 徵象、右上腹的壓痛或腫塊）、全身的發炎（發燒、白血球或發炎指數上升）、影像的發現。', ref: 'yokoe2018' },
      { text: '懷疑急性膽囊炎，腹部超音波是第一線的影像檢查。', ref: 'yokoe2018' },
      { text: '上腹的不舒服也可能是心臟缺血的表現，不要只往肚子裡想。', ref: 'gulati2021' },
    ],
    references: [YOKOE_2018, GULATI_2021],
  },
};
