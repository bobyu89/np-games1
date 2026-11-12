// 病例 C03B：邵棠，腹痛，診斷是闌尾（急性闌尾炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：痛的位置會移動。不要被「吃壞肚子」這個最順的解釋帶走。
import type { CaseSpec } from '../core/module.ts';
import { DISAVERIO_2020, REVIEW_NOTE } from './shared.ts';

export const C03B: CaseSpec = {
  format: 3,
  id: 'c03b',
  complaint: 'abdomen',
  kind: '變體',
  title: '從肚臍開始的',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '邵棠', age: 19, sex: '男', job: '船塢的學徒', look: 'tang', pronoun: '他' },
  scene: 'ward-rain',
  reading: {
    lines: ['邵棠，19 歲，船塢的學徒。', '昨天下午肚臍附近悶悶地痛，以為是吃壞肚子。今天早上痛跑到右下腹，走路會痛，師傅叫他來公會。', '他慢慢走進來，身體微微往右彎。躺上床的時候，右腳不敢伸直。'],
    prompts: ['最危險的可能是什麼？', '「痛的位置會移動」，是在告訴我什麼？', '如果不是我想的那一個，右下腹還有什麼？'],
  },
  vitals: {
    base: { bp: '118/72', hr: 96, rr: 18, spo2: 99, bt: 37.9 },
    clue: { text: '微燒 37.9 度、心跳稍快，血壓正常', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（邵棠平躺著，右邊的膝蓋彎起來，兩手放在肚子上不敢動。）' },
    'q-intro': { say: '邵棠。驚蟄那天生的，十九歲。' },
    'q-explain': { say: '好。那個……會不會很痛？' },
    // 主訴
    'q-cc': { say: '肚子痛。右邊下面這裡。', clue: { text: '主訴：右下腹痛', kind: 'pos' } },
    'q-onset': { say: '昨天下午在船塢刨木頭的時候開始的。一開始是肚臍這一圈悶悶的，我以為是中午的魚不新鮮。', clue: { text: '昨天下午開始，起初是肚臍周圍悶痛', kind: 'pos', key: true } },
    'q-location': { say: '現在在右邊下面這裡，一根手指指得出來。昨天是在肚臍旁邊，今天早上才跑過來的。', clue: { text: '痛從肚臍周圍移到右下腹', kind: 'pos', key: true, tell: { form: 'appendix', dir: 1 }, why: '先在肚臍附近悶悶地痛，過了幾個小時移到右下腹、變得很清楚，是闌尾炎典型的走法。' } },
    'q-duration': { say: '一直痛，沒有停，而且越來越痛。', clue: { text: '持續而且越來越痛', kind: 'pos' } },
    'q-character': { say: '昨天是悶悶的，說不出在哪裡。今天變成很清楚的刺痛。', clue: { text: '從說不清楚的悶痛，變成清楚的刺痛', kind: 'pos', key: true } },
    'q-assoc': { say: '完全不想吃東西。早上吐了一次。有一點發燒。沒有拉肚子。眼睛沒有黃。', clue: { text: '沒有食慾、嘔吐一次、微燒；沒有腹瀉', kind: 'pos', key: true, tell: { form: 'appendix', dir: 1 }, why: '先痛，再不想吃、想吐，然後微燒，這個順序支持闌尾炎。腸胃炎通常會拉肚子，而且常常是先吐才痛。' } },
    'q-factors': { say: '走路、咳嗽的時候特別痛。坐板車過來，每顛一下都痛。躺著把右腳彎起來最舒服。', clue: { text: '走路、咳嗽、震動會加重；彎著右腿比較舒服', kind: 'pos', key: true, tell: { form: 'appendix', dir: 1 }, why: '一震動就痛，表示肚子裡面那一層膜被發炎刺激到了。彎著右腿，是在讓那個地方放鬆。' } },
    'q-radiate': { say: '不會跑到背後，也不會痛到下面。', clue: { text: '不會傳到背部、鼠蹊或陰囊', kind: 'neg', tell: { form: 'pancreas', dir: -1 }, why: '胰臟炎的痛在上腹，常常直直穿到背。痛在下面、不會到背，就比較不像。' } },
    'q-treat': { say: '昨天喝了師娘煮的薑湯，沒有用。', clue: { text: '喝薑湯沒有改善', kind: 'info' } },
    'q-severity': { say: '現在七分。昨天才三分。', clue: { text: '一天內從 3 分痛到 7 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有。從小到大沒生過什麼病。', clue: { text: '沒有慢性病', kind: 'info' } },
    'q-family': { say: '沒有特別的。', clue: { text: '家族史沒有特別的', kind: 'info' } },
    'q-surgery': { say: '沒開過刀。最近沒有撞到肚子。', clue: { text: '沒有開過刀（闌尾還在），沒有外傷', kind: 'info', key: true } },
    'q-meds': { say: '沒有吃藥。沒有過敏。', clue: { text: '沒有用藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '不抽菸。偶爾跟師兄喝一點酒，昨天沒喝。', clue: { text: '不抽菸，偶爾喝酒', kind: 'info' } },
    'q-work': { say: '船塢的學徒，刨木頭、扛木料。昨天中午跟大家吃一樣的魚，別人都沒事。', clue: { text: '一起吃飯的人都沒有不舒服', kind: 'neg', key: true } },
    'q-life': { say: '昨天晚上痛得睡不好。今天什麼都沒吃。住在船塢的工寮。', clue: { text: '睡不好，今天沒有進食', kind: 'info' } },
    'q-concern': { say: '會不會要開刀？我才來三個月，怕師傅不要我了。開刀的錢，我也沒有。', clue: { text: '怕要開刀；怕丟了工作，也付不出錢', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '有一點發燒。體重沒變。', clue: { text: '微燒，體重沒有變', kind: 'pos' } },
    'q-ros-cp': { say: '沒有咳嗽，不會喘，胸口不悶。', clue: { text: '沒有咳嗽、喘或胸悶', kind: 'neg' } },
    'q-ros-gi': { say: '昨天早上大便正常，之後就沒解，屁也變少。沒有拉肚子，沒有血。小便不會痛、不會一直想尿，顏色正常。', clue: { text: '沒有腹瀉或血便；小便正常', kind: 'neg', tell: { form: 'diverticulum', dir: -1 }, why: '大腸憩室炎多半是年紀比較大的人，痛在左下腹，常常帶著排便的改變。十九歲、痛在右邊、沒有腹瀉，就很不像。' } },
    'q-ros-limb': { say: '手腳都正常。', clue: { text: '手腳正常', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '平躺著不太敢動，右腳彎著。表情繃著，額頭微微出汗。', clue: { text: '不敢動、右腿彎著', kind: 'pos', key: true } },
    'x-head': { say: '眼白沒有變黃。嘴唇和舌頭偏乾。', clue: { text: '沒有黃疸，口腔偏乾', kind: 'neg' } },
    'x-heart-lung': { say: '心跳稍快，規則，沒有雜音。兩邊呼吸音清楚。', clue: { text: '心肺聽診沒有異常', kind: 'neg' } },
    'x-abd-look': { say: '肚子平坦，沒有疤。請他咳嗽一下，他馬上按住右下腹。腸音比平常少。', clue: { text: '咳嗽時右下腹痛；腸音減少', kind: 'pos' } },
    'x-abd-perc': { say: '右下腹輕輕敲就痛。其他地方敲了不痛。', clue: { text: '右下腹叩痛', kind: 'pos' } },
    'x-abd-light': { say: '右下腹輕壓會痛，肌肉繃起來。右上腹和上腹正中間都是軟的，不痛。', clue: { text: '右上腹和上腹部沒有壓痛', kind: 'neg', tell: { form: 'biliary', dir: -1 }, alsoOk: [{ form: 'pancreas', dir: -1 }], why: '膽囊和胰臟的問題，壓痛在上腹。上面是軟的、不痛，就比較不像。' } },
    'x-abd-deep': { say: '肚臍到右邊骨盆突起的那條線上，靠外側三分之一的地方壓痛最明顯（McBurney 點），放開的時候更痛。左下腹壓了不痛。', clue: { text: 'McBurney 點壓痛和反彈痛', kind: 'pos', key: true, tell: { form: 'appendix', dir: 1 }, why: '壓痛最明顯的地方在 McBurney 點，放開更痛，表示發炎已經刺激到旁邊的腹膜。' } },
    'x-abd-sign': { say: '按左下腹，他說右下腹會痛（Rovsing 徵象）。把右腿往後伸，右下腹會痛（腰大肌徵象）。按著右肋下深吸氣不會痛（Murphy 徵象陰性）。', clue: { text: 'Rovsing 徵象和腰大肌徵象陽性；Murphy 徵象陰性', kind: 'pos', key: true, tell: { form: 'appendix', dir: 1 }, why: '按別的地方、拉動後面的肌肉，痛的都是右下腹同一個點。好幾個徵象指向同一個地方，比單獨一個可靠。' } },
    'x-cva': { say: '兩邊腰的後面，敲了都不痛。', clue: { text: '兩側腰部敲擊不痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。', clue: { text: '末梢溫暖，循環良好', kind: 'neg' } },
  },
  results: {
    't-us': { say: '右下腹看到一條壓不扁的管狀構造，直徑大約 9 公釐，旁邊的脂肪變亮。沒有看到積膿。（訓練用的文字結果，要由醫師判讀。超音波看不清楚的時候，醫師可能會再安排電腦斷層。）', clue: { text: '超音波：右下腹壓不扁的管狀構造，直徑約 9 公釐', kind: 'pos', key: true, fog: 6, tell: { form: 'appendix', dir: 1 }, why: '影像看到腫起來、壓不扁的闌尾，和病史、身體評估對得起來。要不要開刀、什麼時候開，由外科決定。' } },
    't-blood': { say: '白血球 13,800，嗜中性球的比例偏高，發炎指數上升。肝膽胰的指數都正常。（訓練用的文字結果，要由醫師判讀。）', clue: { text: '抽血：白血球和發炎指數上升，肝膽胰指數正常', kind: 'pos' } },
    't-urine': { say: '尿裡沒有血，沒有發炎的跡象。（訓練用的文字結果，要由醫師判讀。）', clue: { text: '驗尿正常', kind: 'neg' } },
    't-ecg': { say: '竇性心律，每分鐘 96 下，沒有異常。（訓練用的文字結果，要由醫師判讀。）', clue: { text: '心電圖正常', kind: 'neg' } },
  },

  answer: { truth: 'appendix', exclude: { biliary: 2, pancreas: 2, diverticulum: 1 } },
  summaries: [
    { id: 's-best', text: '19 歲男性，昨天下午起肚臍周圍悶痛，今晨移到右下腹，合併食慾不振、嘔吐和微燒；McBurney 點壓痛和反彈痛，血壓正常。', score: 5, note: '有年齡、痛怎麼移動、伴隨症狀的順序、最有力的徵象和目前的穩定程度。' },
    { id: 's-ok', text: '19 歲男性，右下腹痛一天，有吐、有發燒。', score: 3, note: '位置和症狀有了，但少了「從肚臍移過來」和反彈痛，這兩樣才是讓人警覺的地方。' },
    { id: 's-vague', text: '年輕男性肚子痛，大概是吃壞肚子。', score: 0, note: '沒有拉肚子，一起吃飯的人也都沒事。' },
    { id: 's-anchor', text: '19 歲男性腹痛，昨天吃了不新鮮的魚，是腸胃炎，給止瀉藥。', score: 0, note: '被第一個聽到的解釋帶走了。他沒有腹瀉，而且有反彈痛。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-app', text: '我的診斷是闌尾的問題，擔心急性闌尾炎。病人微燒，血壓穩定，右下腹有腹膜刺激的徵象。', score: 2, note: '說出你的判斷、目前的穩定程度，還有讓你擔心的發現。' },
      { id: 'a-unknown', text: '右下腹痛，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。' },
      { id: 'a-ge', text: '應該是腸胃炎，想先給止痛藥和止瀉藥讓他回去。', score: 0, note: '沒有腹瀉、有反彈痛，不能當成腸胃炎放回去。' },
    ],
    requests: [
      { id: 'r-img', text: '請同意抽血，並安排腹部的影像檢查。', ok: true, orders: 't-us', note: '把病史、身體評估和抽血合起來看，再決定影像要做到哪一步。' },
      { id: 'r-surg', text: '請您今天過來評估，看需不需要會診外科。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-npo', text: '我先讓他禁食、躺著休息，定時量體溫，隔一段時間再摸一次肚子。', ok: true, note: '說出你自己接下來會做什麼。重複評估可以看出有沒有在變差。' },
      { id: 'r-enema', text: '他一天沒解便了，先幫他灌腸通一通。', ok: false, note: '懷疑闌尾炎的時候，不要灌腸，也不要給瀉藥。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '你的痛很可能是闌尾在發炎。我們要抽血、做影像檢查來確認。', ok: true, note: '用他聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '結果出來之前，先不要吃東西、喝水。醫師今天會過來，可能會請外科一起看。', ok: true, note: '說明接下來會發生什麼，以及他現在要配合的事。' },
    { id: 'e-warn', text: '如果痛突然變成整個肚子、肚子變得很硬，或是發高燒、發抖，馬上跟我說。痛突然減輕也要說，那不一定是好了。', ok: true, note: '交代什麼情況要馬上說，也提醒他：突然不痛不等於沒事。' },
    { id: 'e-concern', text: '你擔心要開刀，也擔心工作和錢。要不要開刀，醫師看完檢查會跟你說清楚。師傅那邊，要不要我請公會的人去說一聲？費用的事，公會有人可以幫你問。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他的三個擔心：一個等結果，兩個現在就能幫忙。' },
    { id: 'e-false', text: '年輕人吃壞肚子而已，回去喝點熱水就好。', ok: false, note: '沒有根據的保證。他回去之後，可能就在工寮裡破掉。' },
    { id: 'e-jargon', text: '你是急性闌尾炎，今天就要開刀切掉。', ok: false, note: '診斷還沒有確認，要不要開刀也是外科決定的。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-us', within: 300, points: 3 }, { type: 'exclude', forms: ['biliary', 'pancreas', 'diverticulum'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['同樣是腹痛，換了一個角落。他自己已經有一個答案了。先聽完，再決定信不信。'],
    watch: '邵棠平躺著，右腳一直彎著，連呼吸都不太敢用力。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。血壓穩的，是什麼事等不了？',
    reportGood: '收到。先抽血、做影像，禁食。痛怎麼移動、哪幾個徵象陽性，你報得很清楚。我看完過去，外科我來聯絡。',
    reportWeak: '我聽不出你的判斷。右下腹痛的原因很多，你認為是哪一個、根據是什麼？',
    explainOk: '好……那我先不吃。',
    explainConcern: '……謝謝。師傅那邊，我真的不知道怎麼開口。',
    explainBad: '喔……那我回工寮躺一下好了。',
    closing: '霧散了。腹痛蟹的結，不一定打在牠一開始痛的地方。寫進圖鑑吧。',
    hintNoExplain: '摸肚子之前，先讓他知道你要做什麼、會碰哪裡，而且從不痛的地方開始。',
  },

  debrief: {
    alternatives: [
      '這位病人血壓穩定，不用敲值班鐘；但有腹膜刺激的徵象，今天一定要回報，不能讓他回工寮。',
      '影像可以自己先提出，也可以在回報的時候一起請醫師同意。',
      '年輕男性的右下腹痛，鼠蹊和陰囊也要問、也要看：睪丸扭轉和疝氣都會痛在這附近。這一關只做了問診的部分。',
    ],
    teaching: [
      { text: '懷疑闌尾炎，不單靠某一個徵象：把病史、身體評估和抽血合成臨床評分，再決定要不要做影像、做哪一種。', ref: 'disaverio2020' },
      { text: '影像可以先用超音波；看不清楚、還是懷疑的時候，再做電腦斷層。', ref: 'disaverio2020' },
    ],
    references: [DISAVERIO_2020],
  },
};
