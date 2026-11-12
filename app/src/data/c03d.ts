// 病例 C03D：鄔桃，腹痛，真身是大腸憩室（急性憩室炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：左下腹痛了好幾天、排便改變的年長者。診斷之外，還要聽見她真正在怕什麼。
import type { CaseSpec } from '../core/module.ts';
import { PEERY_2021, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C03D: CaseSpec = {
  format: 3,
  id: 'c03d',
  complaint: 'abdomen',
  kind: '遷移',
  title: '左邊的那個結',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '鄔桃', age: 63, sex: '女', job: '麵包坊的老闆娘', look: 'tao', pronoun: '她' },
  reading: {
    lines: ['鄔桃，63 歲，麵包坊的老闆娘。', '左下腹痛了三天，一天比一天痛，昨天開始發燒。本來長年便秘，這兩天反而拉了幾次稀的。女兒硬把她帶來公會。', '她自己慢慢走進來，一手扶著左邊的肚子，坐下的時候很小心。'],
    prompts: ['最危險的可能是什麼？', '左下腹，除了大腸，還有哪些東西住在那裡？', '她拖了三天才來。是什麼讓她不想來？'],
  },
  vitals: {
    base: { bp: '136/80', hr: 92, rr: 18, spo2: 98, bt: 38.0 },
    clue: { text: '發燒 38.0 度、心跳稍快，血壓正常', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（鄔桃坐在床邊，圍裙上還沾著麵粉。她女兒站在簾子外面。）' },
    'q-intro': { say: '鄔桃。冬至那天生的，六十三了。' },
    'q-explain': { say: '好。其實也沒什麼，是我女兒大驚小怪。' },
    // 主訴
    'q-cc': { say: '肚子痛，左邊下面這裡。痛三天了。', clue: { text: '主訴：左下腹痛三天', kind: 'pos' } },
    'q-onset': { say: '三天前早上揉麵的時候開始的。一開始只是悶悶的，以為是便秘。後來一天比一天痛。', clue: { text: '三天前開始，一天比一天痛', kind: 'pos', key: true } },
    'q-location': { say: '左邊下面這一塊。三天來都在這裡，沒有換過地方。', clue: { text: '左下腹，三天來位置固定', kind: 'pos', key: true, tell: { form: 'diverticulum', dir: 1 }, why: '年紀比較大的人，痛固定在左下腹好幾天，要先想到大腸憩室發炎。' } },
    'q-duration': { say: '一直在痛，不是一陣一陣的。', clue: { text: '持續的痛', kind: 'pos' } },
    'q-character': { say: '悶悶的、脹脹的，有時候像抽筋一樣絞一下。', clue: { text: '悶脹痛，偶爾絞痛', kind: 'pos' } },
    'q-assoc': { say: '昨天開始發燒。有點想吐，沒有吐。我本來三四天才解一次，這兩天反而拉了三次稀的，裡面沒有血。', clue: { text: '發燒；長年便秘，這兩天變成腹瀉，沒有血', kind: 'pos', key: true, tell: { form: 'diverticulum', dir: 1 }, why: '左下腹痛、發燒，再加上排便的習慣變了，是憩室炎常見的組合。' } },
    'q-factors': { say: '走路、彎腰搬麵粉的時候比較痛。躺著不動好一點。吃東西沒有特別差別。', clue: { text: '活動時加重，躺著緩解；跟進食無關', kind: 'pos' } },
    'q-radiate': { say: '不會跑到背後，也不會到右邊。不會痛到下面。', clue: { text: '不會傳到背、右側或鼠蹊', kind: 'neg', tell: { form: 'pancreas', dir: -1 }, why: '胰臟炎的痛在上腹，常常穿到背。痛在左下、不會到背，就比較不像。' } },
    'q-treat': { say: '吃了兩天通便的草藥茶，沒有用，肚子反而更脹。', clue: { text: '喝了兩天通便的草藥茶，更脹', kind: 'info', key: true } },
    'q-severity': { say: '現在六分。第一天才兩三分。', clue: { text: '三天內從 2 分痛到 6 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '血壓高，有在吃藥。便秘是老毛病了，三十年。兩年前左邊也這樣痛過一次，比較輕，大夫說我的腸子上有小口袋在發炎，吃藥就好了。', clue: { text: '長年便秘；兩年前左下腹痛過，被診斷憩室發炎', kind: 'info', key: true, tell: { form: 'diverticulum', dir: 1 }, why: '以前就發作過一次憩室炎，同一個地方又痛，這一次要更先想到它。' } },
    'q-family': { say: '我媽是大腸長了不好的東西走的，那年她六十五。', clue: { text: '母親 65 歲大腸癌過世', kind: 'info', key: true } },
    'q-surgery': { say: '年輕的時候拿過子宮，肌瘤。別的沒有，最近沒有撞到。', clue: { text: '年輕時因肌瘤切除子宮', kind: 'info' } },
    'q-meds': { say: '血壓藥。膝蓋痛的時候會吃止痛藥，這個月吃得比較多。沒有過敏。', clue: { text: '血壓藥；這個月常吃止痛藥', kind: 'info' } },
    'q-habits': { say: '不抽菸，不喝酒。', clue: { text: '不抽菸、不喝酒', kind: 'info' } },
    'q-work': { say: '開麵包坊，天沒亮就起來揉麵。最近沒有出遠門。一起吃飯的家人都沒事。', clue: { text: '一起吃飯的家人都沒有不舒服', kind: 'neg' } },
    'q-life': { say: '三餐都吃自己做的白麵包配肉湯，青菜很少，水也喝得少。這幾天痛到睡不好。跟女兒女婿住。', clue: { text: '青菜和水都吃喝得很少', kind: 'info' } },
    'q-concern': { say: '……我媽當年也是這樣，先是肚子痛、大便不一樣，查出來就來不及了。我跟她走的時候差不多歲數。我不是不想來，是不敢來。', clue: { text: '怕跟母親一樣是大腸癌，所以拖著不敢來', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '昨天開始發燒，有一點發冷。這半年體重沒什麼變，不會盜汗。', clue: { text: '發燒；半年來體重沒有減輕', kind: 'pos' } },
    'q-ros-cp': { say: '沒有咳嗽，不會喘，胸口不悶。', clue: { text: '沒有咳嗽、喘或胸悶', kind: 'neg' } },
    'q-ros-gi': { say: '大便這兩天稀稀的，黃褐色，沒有血，沒有黑的。小便不會痛，不會一直想尿，沒有血。月經早就停了，下面沒有出血。', clue: { text: '沒有血便或黑便；小便正常；停經後沒有出血', kind: 'neg' } },
    'q-ros-limb': { say: '膝蓋是老毛病。腳沒有腫。', clue: { text: '膝蓋舊疾，腳不腫', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '走路和坐下都很小心，一手扶著左下腹。表情還算平靜，額頭有一點熱。', clue: { text: '動作小心，扶著左下腹', kind: 'pos' } },
    'x-head': { say: '眼白沒有變黃。結膜顏色正常，不蒼白。嘴唇有點乾。', clue: { text: '沒有黃疸，結膜不蒼白', kind: 'neg' } },
    'x-heart-lung': { say: '心跳稍快，規則，沒有雜音。兩邊呼吸音清楚。', clue: { text: '心肺聽診沒有異常', kind: 'neg' } },
    'x-abd-look': { say: '下腹正中有一道舊的直疤。左下腹稍微鼓一點。腸音聽得到，比平常少。', clue: { text: '下腹有舊手術疤；左下腹微脹，腸音稍減', kind: 'pos' } },
    'x-abd-perc': { say: '大部分是鼓音。敲到左下腹的時候她說痛。', clue: { text: '左下腹叩痛', kind: 'pos' } },
    'x-abd-light': { say: '左下腹輕壓會痛，肌肉有一點繃。右上腹、上腹正中間都是軟的，不痛。', clue: { text: '右上腹和上腹部沒有壓痛', kind: 'neg', tell: { form: 'biliary', dir: -1 }, alsoOk: [{ form: 'pancreas', dir: -1 }], why: '膽囊和胰臟的問題，壓痛在上腹。上面是軟的、不痛，就比較不像。' } },
    'x-abd-deep': { say: '左下腹深壓很痛，摸起來有一段硬硬的、像香腸一樣的東西；放開的時候有一點痛，只在那一塊。右下腹壓了不痛。', clue: { text: '左下腹深壓痛、摸到條狀硬塊、局部輕微反彈痛', kind: 'pos', key: true, tell: { form: 'diverticulum', dir: 1 }, why: '壓痛和反彈痛都只在左下腹那一塊，表示發炎還侷限在那裡。如果整個肚子都硬、都痛，就是另一回事了。' } },
    'x-abd-sign': { say: '按左下腹，痛的是左下腹自己，右下腹不會痛（Rovsing 徵象陰性）。把右腿往後伸不會痛。按著右肋下深吸氣不會痛。', clue: { text: 'Rovsing 徵象、腰大肌徵象、Murphy 徵象都是陰性', kind: 'neg', tell: { form: 'appendix', dir: -1 }, alsoOk: [{ form: 'biliary', dir: -1 }], why: '闌尾炎的幾個徵象都指向右下腹。這幾個都是陰性，右下腹也不痛，就比較不像。' } },
    'x-cva': { say: '兩邊腰的後面，敲了都不痛。', clue: { text: '兩側腰部敲擊不痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。皮膚沒有變黃，也不蒼白。', clue: { text: '末梢溫暖，皮膚顏色正常', kind: 'neg' } },
  },
  results: {
    't-us': { say: '左下腹有一段大腸的腸壁變厚，旁邊的脂肪變亮。沒有看到明顯的積膿。（訓練用的文字結果，要由醫師判讀。要確定診斷、看有沒有併發症，醫師通常會再安排電腦斷層。）', clue: { text: '超音波：左下腹一段大腸壁增厚，周圍脂肪發炎', kind: 'pos', key: true, fog: 6, tell: { form: 'diverticulum', dir: 1 }, why: '影像看到那一段腸子在發炎，和病史、身體評估對得起來。不過超音波看不到全貌，憩室炎常常要靠電腦斷層才能確定。' } },
    't-blood': { say: '白血球 13,500，發炎指數上升。血色素正常。肝膽胰的指數正常。' + TEXT_RESULT, clue: { text: '抽血：白血球和發炎指數上升，血色素正常', kind: 'pos' } },
    't-urine': { say: '尿裡沒有血，沒有發炎的跡象。' + TEXT_RESULT, clue: { text: '驗尿正常', kind: 'neg' } },
    't-ecg': { say: '竇性心律，每分鐘 92 下，沒有 ST 段或 T 波的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心律，沒有 ST-T 變化', kind: 'neg' } },
  },

  answer: { truth: 'diverticulum', exclude: { biliary: 2, pancreas: 2, appendix: 1 } },
  summaries: [
    { id: 's-best', text: '63 歲女性，長年便秘、兩年前憩室炎過一次，左下腹痛三天逐日加重，合併發燒和排便習慣改變；左下腹壓痛合併局部反彈痛，血壓穩定。母親大腸癌過世。', score: 5, note: '有年齡、以前的發作、病程、伴隨症狀、侷限在一處的徵象和穩定程度，也帶上了之後追蹤要用的家族史。' },
    { id: 's-ok', text: '63 歲女性，左下腹痛三天，有發燒。', score: 3, note: '位置和病程有了，但少了排便的改變、以前的發作和局部的反彈痛。' },
    { id: 's-vague', text: '老太太肚子痛、拉肚子，可能是吃壞肚子。', score: 0, note: '一起吃飯的家人都沒事，痛了三天而且固定在一個地方，不是吃壞肚子的樣子。' },
    { id: 's-anchor', text: '63 歲女性長年便秘，這次也是便秘引起的腹痛，給瀉藥通一通。', score: 0, note: '把新的痛歸給老毛病。發燒和局部的反彈痛，都不是便秘會有的。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-div', text: '我的診斷是大腸憩室的問題，擔心急性憩室炎。有發燒，血壓穩定，左下腹有局部的反彈痛，沒有擴散到整個肚子。', score: 2, note: '說出你的判斷和穩定程度，也說出發炎目前還侷限在一處。' },
      { id: 'a-unknown', text: '左下腹痛合併發燒，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。' },
      { id: 'a-constip', text: '應該是便秘，想先給瀉藥。', score: 0, note: '發燒、局部反彈痛、摸到硬塊，不能當成便秘處理。' },
    ],
    requests: [
      { id: 'r-img', text: '請同意抽血，並安排腹部的影像檢查。超音波如果看不清楚，請您評估要不要做電腦斷層。', ok: true, orders: 't-us', note: '憩室炎常常要靠電腦斷層才能確定，也才看得到有沒有積膿或破掉。做哪一種由醫師決定。' },
      { id: 'r-see', text: '請您今天過來評估，決定要不要住院、需不需要用抗生素。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-rest', text: '我先讓她暫時禁食、躺著休息，定時量體溫，隔一段時間再摸一次肚子。她很怕是大腸癌，說明的時候想請您一起。', ok: true, note: '說出你自己接下來會做什麼，也把病人最怕的事一起交班。' },
      { id: 'r-enema', text: '她便秘很久了，先幫她灌腸，或是給強一點的瀉藥。', ok: false, note: '腸子正在發炎的時候，不要灌腸，也不要給刺激性的瀉藥。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您左下腹的痛，看起來是大腸壁上的小口袋又在發炎，跟兩年前那一次很像。我們要抽血、做影像檢查來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，也接上她以前的經驗。' },
    { id: 'e-plan', text: '結果出來之前，先不要吃東西。醫師今天會過來看，再決定怎麼治療、要不要住院。通便的草藥茶先停掉。', ok: true, note: '說明接下來會發生什麼，以及她現在要配合的事。' },
    { id: 'e-warn', text: '如果痛突然變成整個肚子、肚子變得很硬、發高燒發抖，或是大便有血，馬上跟我說。', ok: true, note: '交代什麼情況要馬上說。' },
    { id: 'e-concern', text: '您怕跟媽媽一樣，所以這三天不敢來。今天摸到的、看到的，比較像發炎。不過您的擔心有道理：等這一次發炎好了，要不要把整條大腸檢查一遍，我會請醫師跟您一起決定。您今天來了，就是最重要的一步。', ok: true, concern: true, needsClue: 'c-concern', note: '說出她不敢說的那句話，不否定她的害怕，也給了一個具體的下一步。' },
    { id: 'e-false', text: '便秘而已，多吃青菜、多喝水就會好了。', ok: false, note: '沒有根據的保證，也讓她更確定「不用來」。' },
    { id: 'e-jargon', text: '您是急性憩室炎，要打抗生素，嚴重的話要開刀切一段腸子。', ok: false, note: '診斷還沒有確認，治療也還沒有決定。對一個本來就很害怕的人，先講開刀只會讓她更怕。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-us', within: 300, points: 3 }, { type: 'exclude', forms: ['biliary', 'pancreas', 'appendix'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['最後一個角落。她說「沒什麼」。拖了三天才來的人，通常不是真的沒什麼。'],
    watch: '鄔桃躺著，一手輕輕放在左下腹，眼睛看著簾子外面女兒的影子。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。她血壓穩、發炎在一處，是什麼事等不了？',
    reportGood: '收到。先抽血、做超音波，我看完決定要不要再照電腦斷層。她怕什麼你也問到了，很好，說明的時候我跟你一起。',
    reportWeak: '我聽不出你的判斷。左下腹痛的原因不少，你認為是哪一個？反彈痛是局部的，還是整個肚子？',
    explainOk: '好。茶我不喝了。',
    explainConcern: '……我以為說出來，你們會笑我想太多。好，檢查我做。這一次我不拖了。',
    explainBad: '是嗎……那我回去多吃點青菜就好了，不用麻煩你們。',
    closing: '霧散了。結繩蟹的四個結都解開了。她怕的那一個，你也沒有假裝沒看見。寫進圖鑑吧。',
    hintNoExplain: '摸肚子之前，先讓她知道你要做什麼、會碰哪裡，而且從不痛的地方開始。',
  },

  debrief: {
    alternatives: [
      '這位病人血壓穩定、發炎侷限在一處，不用敲值班鐘；但有發燒和局部的反彈痛，今天一定要回報。',
      '左下腹還住著別的東西：輸尿管、卵巢、疝氣。她的小便正常、停經後沒有出血，這幾個比較不像；這一關沒有另外做骨盆和鼠蹊的檢查。',
      '「擔心什麼」這一題，在她身上問出了拖三天的原因。沒問，就只會看到一個「大驚小怪的女兒」。',
    ],
    teaching: [
      { text: '憩室炎常常需要電腦斷層才能確定診斷。', ref: 'peery2021' },
      { text: '少數情況下，大腸的腫瘤會被當成憩室炎。發作過後要不要做大腸鏡，看病史、上一次大腸鏡是什麼時候、這一次的嚴重度和病程。', ref: 'peery2021' },
    ],
    references: [PEERY_2021],
  },
};
