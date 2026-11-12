// 病例 C03C：龔椿，腹痛，真身是胰臟與胃（急性胰臟炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：腹痛的人也會不穩定。一直吐、心跳快、血壓偏低，表示水分已經不夠了。
import type { CaseSpec } from '../core/module.ts';
import { BANKS_2013, GULATI_2021, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C03C: CaseSpec = {
  format: 3,
  id: 'c03c',
  complaint: 'abdomen',
  kind: '變體',
  title: '祭典的隔天',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '龔椿', age: 48, sex: '男', job: '酒坊的釀酒師', look: 'chun', pronoun: '他' },
  reading: {
    lines: ['龔椿，48 歲，酒坊的釀酒師。', '昨天是港口的祭典，他喝了一整晚。今天凌晨上腹痛醒，一路痛到背後，吐了七八次都沒有比較好。徒弟把他背來公會。', '他不肯躺平，坐在床上往前彎，兩手抱著肚子。嘴唇很乾。'],
    prompts: ['最危險的可能是什麼？', '同樣是上腹痛，這一位和方苓那一次差在哪裡？', '吐了這麼多次的人，除了痛，我還要擔心什麼？'],
  },
  vitals: {
    base: { bp: '104/66', hr: 114, rr: 22, spo2: 96, bt: 37.9 },
    worse: { bp: '88/54', hr: 128, rr: 26, spo2: 95, bt: 37.9 },
    clue: { text: '心跳快、血壓偏低、微燒 37.9 度', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（龔椿坐在床上往前彎，兩手抱著肚子，身上還有酒味。）' },
    'q-intro': { say: '龔椿……芒種生的，四十八。' },
    'q-explain': { say: '好……可不可以先給我一點水？算了，喝了也是吐。' },
    // 主訴
    'q-cc': { say: '肚子痛，上面這裡。痛到背都直不起來。', clue: { text: '主訴：上腹痛，痛到背', kind: 'pos' } },
    'q-onset': { say: '今天凌晨痛醒的。昨天祭典，我從傍晚喝到半夜，喝了多少自己也不記得。', clue: { text: '喝了一整晚的酒之後，凌晨痛醒', kind: 'pos', key: true, tell: { form: 'pancreas', dir: 1 }, why: '大量喝酒之後幾個小時痛起來，要先想到胰臟。' } },
    'q-location': { say: '上面正中間，偏左邊一點。從一開始就在這裡。', clue: { text: '上腹正中偏左，位置沒有移動', kind: 'pos', key: true } },
    'q-duration': { say: '一直痛，沒有一陣一陣的。到現在七八個鐘頭了，越來越痛。', clue: { text: '持續痛了七八個小時，越來越痛', kind: 'pos' } },
    'q-character': { say: '很深，像有人拿棍子從前面一直頂。不是絞的，也不是燒的。', clue: { text: '深處持續的鈍痛，像被棍子頂著', kind: 'pos' } },
    'q-assoc': { say: '吐了七八次，一開始是吃的東西，後來只有黃色的苦水。吐完也沒有比較舒服。沒有吐血。沒有拉肚子。', clue: { text: '嘔吐七八次，吐完沒有緩解；沒有吐血或腹瀉', kind: 'pos', key: true } },
    'q-factors': { say: '躺平最痛。坐起來往前彎、抱著膝蓋，會好一點。喝一口水就更痛，馬上吐。', clue: { text: '躺平加重，坐起來往前彎會緩解；進食進水就痛、就吐', kind: 'pos', key: true, tell: { form: 'pancreas', dir: 1 }, why: '躺平更痛、往前彎抱著膝蓋比較舒服，是胰臟發炎的人常擺的姿勢。' } },
    'q-radiate': { say: '直直穿到背的中間，像被一根棍子從前面頂到後面。不會到右邊肩膀。', clue: { text: '直直穿到背的中間，不會到右肩', kind: 'pos', key: true, tell: { form: 'pancreas', dir: 1 }, why: '胰臟在肚子的最後面，貼著背。它的痛常常直直穿到背的中間；膽囊的痛比較常傳到右肩胛。' } },
    'q-treat': { say: '徒弟給我喝了解酒的湯，喝下去全吐了。', clue: { text: '喝解酒湯後全部吐出來', kind: 'info' } },
    'q-severity': { say: '九分。我這輩子沒這麼痛過。', clue: { text: '疼痛 9 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '去年也這樣痛過一次，沒這麼厲害。大夫說是胰臟發炎，叫我戒酒。我停了一個月。沒有別的病，沒聽過有膽結石。', clue: { text: '去年發作過一次胰臟炎，被勸戒酒', kind: 'info', key: true } },
    'q-family': { say: '我爸也是釀酒的，五十幾歲肝壞掉走的。', clue: { text: '父親五十多歲因肝病過世', kind: 'info' } },
    'q-surgery': { say: '肚子沒開過刀，最近沒有撞到。', clue: { text: '沒有腹部手術或外傷', kind: 'neg' } },
    'q-meds': { say: '沒有固定吃藥。止痛藥偶爾吃，不常。沒有過敏。', clue: { text: '沒有固定用藥，偶爾吃止痛藥', kind: 'info' } },
    'q-habits': { say: '酒是每天喝。試酒加上自己喝，一天少說一斤，二十年了。菸不抽。', clue: { text: '每天喝酒，一天一斤以上，二十年', kind: 'info', key: true, tell: { form: 'pancreas', dir: 1 }, why: '長年大量喝酒，是胰臟炎最常見的原因之一。' } },
    'q-work': { say: '在酒坊釀酒，每一缸都要自己試。昨天一起喝的人都只是宿醉，沒有人像我這樣。', clue: { text: '一起喝酒的人都沒有腹痛', kind: 'neg' } },
    'q-life': { say: '祭典前忙了半個月，吃得亂七八糟。昨天晚上幾乎只喝酒，沒吃什麼。', clue: { text: '最近飲食不正常，昨晚幾乎只喝酒', kind: 'info' } },
    'q-concern': { say: '我是釀酒的，不喝酒怎麼試酒？還有，下個月有一批酒要交，這幾缸只有我會顧。', clue: { text: '怕不能再試酒；掛心下個月要交的酒', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '有一點燒。很渴，全身沒力，站起來頭會暈。體重沒注意。', clue: { text: '微燒、口渴、無力、站起來頭暈', kind: 'pos', key: true } },
    'q-ros-cp': { say: '沒有咳嗽。有點喘，是痛到不敢用力吸。胸口不悶。', clue: { text: '沒有咳嗽或胸悶；因為痛而不敢深吸', kind: 'neg' } },
    'q-ros-gi': { say: '大便昨天早上解過，正常，沒有黑的，沒有血。今天沒解，也沒放屁。小便很少，顏色很深。', clue: { text: '大便正常、沒有黑便或血便；尿很少、顏色很深', kind: 'pos', tell: { form: 'diverticulum', dir: -1 }, why: '排便沒有改變、沒有血，左下腹也不痛，大腸憩室炎就比較不像。尿少、顏色深，是在告訴你他的水分不夠了。' } },
    'q-ros-limb': { say: '手腳冰冰的，沒有力氣。不麻。', clue: { text: '手腳冰冷、沒有力氣', kind: 'pos' } },
  },
  findings: {
    'x-look': { say: '坐著往前彎，不肯躺平。臉色發灰，嘴唇和舌頭很乾，身上有酒味。', clue: { text: '前彎抱腹、不肯躺平，口唇很乾', kind: 'pos', key: true } },
    'x-head': { say: '眼白沒有變黃。舌頭乾到起紋，口水很少。', clue: { text: '沒有黃疸，口腔很乾', kind: 'pos' } },
    'x-heart-lung': { say: '心跳很快，規則，沒有雜音。兩邊呼吸音清楚，吸氣比較淺。', clue: { text: '心搏快；兩側呼吸音清楚', kind: 'neg' } },
    'x-abd-look': { say: '上腹稍微鼓。肚臍周圍和兩邊腰沒有瘀青。腸音很少，聽了很久才一兩聲。', clue: { text: '上腹微脹，腸音明顯減少；沒有瘀斑', kind: 'pos', key: true } },
    'x-abd-perc': { say: '上腹敲起來比較鼓，敲的時候他皺眉。', clue: { text: '上腹鼓音、叩痛', kind: 'pos' } },
    'x-abd-light': { say: '上腹正中間和左上腹輕輕碰就痛，肌肉繃起來。右上腹是軟的，不痛。', clue: { text: '上腹正中和左上腹壓痛、肌肉緊繃；右上腹不痛', kind: 'pos', key: true } },
    'x-abd-deep': { say: '上腹深壓很痛。右下腹、左下腹壓下去不痛，放開也不痛。', clue: { text: '右下腹和左下腹沒有壓痛或反彈痛', kind: 'neg', tell: { form: 'appendix', dir: -1 }, alsoOk: [{ form: 'diverticulum', dir: -1 }], why: '闌尾炎的壓痛在右下腹，憩室炎在左下腹。下面兩邊都不痛，這兩個就比較不像。' } },
    'x-abd-sign': { say: '按著右邊肋骨下緣請他深吸氣，可以吸到底，不會痛得停住（Murphy 徵象陰性）。按左下腹，右下腹不會痛。', clue: { text: 'Murphy 徵象陰性', kind: 'neg', tell: { form: 'biliary', dir: -1 }, why: '按著右肋下還能吸到底，膽囊發炎就比較不像。不過膽結石也會引起胰臟炎，所以超音波還是要看一下膽。' } },
    'x-cva': { say: '兩邊腰的後面，敲了都不痛。', clue: { text: '兩側腰部敲擊不痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳冰涼，微血管回填約 3 秒。皮膚捏起來，慢慢才彈回去。', clue: { text: '手腳冰涼、微血管回填約 3 秒、皮膚彈性變差', kind: 'pos', key: true } },
  },
  results: {
    't-us': { say: '膽囊裡沒有看到結石，膽管沒有變粗。胰臟被腸子裡的氣擋住，看不清楚。' + TEXT_RESULT, clue: { text: '超音波：沒有膽結石，膽管沒有擴張；胰臟看不清楚', kind: 'neg' } },
    't-blood': { say: '脂肪酶超過正常上限的五倍。白血球上升。肝指數和膽紅素正常。血比較濃，腎功能的數字偏高一點。' + TEXT_RESULT, clue: { text: '抽血：脂肪酶超過正常上限五倍，血液偏濃', kind: 'pos', key: true, fog: 6, tell: { form: 'pancreas', dir: 1 }, why: '典型的上腹痛，加上脂肪酶超過正常上限的三倍，兩樣就足夠說是急性胰臟炎。血變濃，是他水分不夠的另一個證據。' } },
    't-urine': { say: '尿很濃，沒有血，沒有發炎的跡象。' + TEXT_RESULT, clue: { text: '驗尿：尿液濃縮，沒有其他異常', kind: 'pos' } },
    't-ecg': { say: '竇性心搏過速，每分鐘 114 下，沒有 ST 段或 T 波的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速，沒有 ST-T 變化', kind: 'neg' } },
  },

  answer: { truth: 'pancreas', exclude: { biliary: 2, appendix: 2, diverticulum: 1 } },
  summaries: [
    { id: 's-best', text: '48 歲男性，長年大量飲酒、去年胰臟炎過一次，昨晚豪飲後凌晨起上腹持續劇痛、穿到背，嘔吐七八次；心跳 114、血壓 104/66，口乾、尿少，上腹壓痛合併肌肉緊繃。', score: 5, note: '有年齡、危險因子、怎麼開始、痛的樣子、吐了多少，還有心跳、血壓和脫水的表現。聽的人知道是什麼，也知道要趕快補水。' },
    { id: 's-ok', text: '48 歲男性，喝酒之後上腹痛、一直吐。', score: 3, note: '方向有了，但少了痛到背、心跳和血壓，聽不出他已經不太穩了。' },
    { id: 's-vague', text: '中年男性喝醉之後肚子痛、嘔吐，應該是宿醉。', score: 0, note: '宿醉不會痛到 9 分、穿到背，也不會讓心跳到 114、手腳冰涼。' },
    { id: 's-anchor', text: '48 歲男性上腹痛、吐黃水，是喝酒傷胃的急性胃炎，給胃藥和止吐藥。', score: 0, note: '把上腹痛直接當成胃。痛穿到背、往前彎才舒服、去年胰臟炎過，都被放掉了。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-panc', text: '我的診斷是胰臟與胃的問題，擔心急性胰臟炎。吐了七八次，心跳 114、血壓偏低、手腳冰涼，看起來水分不夠，現在不穩定。', score: 2, note: '說出你的判斷，也說出為什麼急：不只是痛，是循環撐不住了。' },
      { id: 'a-unknown', text: '上腹痛合併嘔吐，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。心跳和血壓也沒有報。' },
      { id: 'a-hangover', text: '應該是宿醉加上胃炎，想先讓他睡一覺。', score: 0, note: '心跳 114、血壓 104/66、微血管回填 3 秒的人，不能放著睡。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-blood', text: '請同意馬上抽血（含脂肪酶），並安排腹部超音波和心電圖。', ok: true, orders: 't-blood', note: '脂肪酶是確認胰臟炎最直接的檢查。超音波看膽，心電圖排除心臟。' },
      { id: 'r-line', text: '我先讓他禁食、把點滴的管路準備好，每 5 分鐘量一次血壓，記錄尿量。點滴和止痛請您開。', ok: true, note: '說出你自己接下來會做什麼，也把需要醫囑的事講清楚。' },
      { id: 'r-soup', text: '先讓他喝點熱湯解酒，再吃一顆止痛藥，等酒退了再看。', ok: false, note: '他喝什麼吐什麼，而且要禁食。等下去只會更乾、血壓更低。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的痛看起來是胰臟在發炎，跟喝酒有關係的可能性很大。我們要抽血來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '現在先不要吃東西、喝水，喝了會更痛。醫師馬上過來，會用點滴幫您補水，也會幫您止痛。', ok: true, note: '說明接下來會發生什麼，也解釋為什麼他很渴卻不能喝。' },
    { id: 'e-warn', text: '如果頭更暈、心跳得更厲害、喘，或是肚子整個變硬，馬上跟我說。', ok: true, note: '交代要注意的變化。' },
    { id: 'e-concern', text: '您擔心不能試酒，也掛心那幾缸酒。這一次先把發炎和缺水處理好。酒的事，等您不痛了，我們找一個時間，把大夫上次說的和您的工作一起攤開來談。那幾缸，要不要先交代徒弟？', ok: true, concern: true, needsClue: 'c-concern', note: '回應他在意的事。沒有在這個時候逼他戒酒，但也沒有假裝這件事不存在。' },
    { id: 'e-false', text: '宿醉而已，睡一覺、酒退了就好。', ok: false, note: '沒有根據的保證。他去年就發作過一次。' },
    { id: 'e-blame', text: '叫你戒酒你不聽，再喝下去命都沒了。', ok: false, note: '責備和嚇唬不會讓他戒酒，只會讓他下次不敢來。' },
  ],

  // 下了診斷之後：兩分鐘內沒有人知道，他會變差；五分鐘還沒有，岑禾接手
  timeline: { worsenAfter: 120, stepInAfter: 300, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-blood', within: 180, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['同一隻蟹，結打在上面。這一位吐了一整個早上。除了問他哪裡痛，也看看他還剩多少水。'],
    watch: '龔椿抱著膝蓋往前彎，隔一下就乾嘔一聲。',
    watchWorse: '龔椿靠在床頭，眼睛半閉，叫他要叫兩聲才回應。',
    worsen: '……頭好暈……好渴……',
    stepIn: '我先敲鐘了。心跳這麼快、手腳這麼冰的人，不能等你把話想完。',
    called: '值班鐘響了。沈渡醫師馬上到，你繼續。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。先抽血、禁食，點滴我來開，管路你先備好。尿量和血壓你有在看，很好，等一下補多少水就靠那兩個數字。',
    reportWeak: '我聽不出有多急。心跳多少、血壓多少、吐了幾次？下次先講這些。我先看病人。',
    testRead: '脂肪酶五倍，夠了，是胰臟炎。現在最要緊的是補水。超音波沒有石頭，原因就是酒。',
    explainOk: '……好。渴也只能忍了。',
    explainConcern: '……那幾缸，我交代阿順。酒的事……等我不痛了再說。',
    explainBad: '……（龔椿閉上眼睛，把臉轉向牆壁。）',
    closing: '霧散了。同樣是上腹痛，方苓的結打在膽，他的打在胰臟。寫進圖鑑吧。',
    hintNoExplain: '摸肚子之前，先讓他知道你要做什麼、會碰哪裡，而且從不痛的地方開始。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。真實的情境裡，量到心跳 114、血壓偏低，就會先叫人、先準備點滴。提早敲鐘不扣分。',
      '心電圖在這一位身上有它的理由：48 歲、上腹痛、冒冷汗又吐，心臟要先排除。',
      '戒酒一定要談，但要等他不痛、聽得進去的時候，而且要連他的工作一起談。',
    ],
    teaching: [
      { text: '急性胰臟炎的診斷，三樣裡面有兩樣就成立：典型的上腹痛（常常穿到背）、脂肪酶或澱粉酶超過正常上限的三倍、影像上的發現。', ref: 'banks2013' },
      { text: '急性胰臟炎的嚴重度分成輕度、中重度、重度，看有沒有器官衰竭、持續多久。輕度的最多，通常一個禮拜內會好。', ref: 'banks2013' },
      { text: '上腹的不舒服也可能是心臟缺血的表現，不要只往肚子裡想。', ref: 'gulati2021' },
    ],
    references: [BANKS_2013, GULATI_2021],
  },
};
