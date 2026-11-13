// 病例 C01D：阮舟，胸痛，診斷是血管急症（肺栓塞）。
// 虛構的教學病例，依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：年輕、沒有病史的人突然又喘又痛，先看血氧和小腿，不要當成緊張或太累。
// 地點不在公會：船剛靠岸，她走不到病室，所以是出診到碼頭的貨棧。
import type { CaseSpec } from '../core/module.ts';
import { GULATI_2021, KONSTANTINIDES_2020, REVIEW_NOTE, TEXT_RESULT, WELLS_2001, WHY_NO_WEIGHT_LOSS } from './shared.ts';

export const C01D: CaseSpec = {
  format: 3,
  id: 'c01d',
  complaint: 'chest-pain',
  kind: '變體',
  title: '靠岸的那天早上',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '阮舟', age: 35, sex: '女', job: '遠洋貨船的帳房', look: 'zhou', pronoun: '她' },
  scene: 'dock',
  reading: {
    lines: ['阮舟，35 歲，遠洋貨船的帳房。', '船今天早上靠岸。她下跳板的時候突然胸口痛、喘不過來，走不到公會，碼頭的人把她扶進貨棧。', '這一張是出診。她坐著，不肯躺下，說一句話要換兩次氣。'],
    prompts: ['最危險的可能是什麼？', '年輕、沒有病史的人突然喘，最容易被當成什麼？', '進門第一眼，我要先看哪兩樣東西？'],
  },
  vitals: {
    base: { bp: '104/66', hr: 118, rr: 28, spo2: 89, bt: 37.2 },
    worse: { bp: '88/56', hr: 130, rr: 32, spo2: 85, bt: 37.2 },
    clue: { text: '心跳快、呼吸快、血氧 89%', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（阮舟坐在貨棧角落那張守夜人的床上，兩手撐著床沿，肩膀跟著每一口氣上下。）' },
    'q-intro': { say: '阮舟……立夏生的，三十五。' },
    'q-explain': { say: '好……快一點，我喘。' },
    // 主訴
    'q-cc': { say: '胸口痛……喘不過來。', clue: { text: '主訴：胸痛、喘', kind: 'pos' } },
    'q-onset': { say: '今天早上，船一靠岸，我撐著拐杖下跳板，走沒幾步突然就來了。一下子就痛到頂。', clue: { text: '今天早上突然發作，一下子就痛到頂', kind: 'pos', key: true, tell: { form: 'vascular', dir: 1 }, why: '一下子就到頂的胸痛，要先想大血管出事：主動脈剝離和肺栓塞。' } },
    'q-location': { say: '右邊，肋骨下面這一側。', clue: { text: '右側胸，偏下面', kind: 'pos' } },
    'q-duration': { say: '從早上到現在，快兩個鐘頭了，沒有停過。', clue: { text: '持續快兩個小時', kind: 'pos' } },
    'q-character': { say: '刺的。吸氣吸到一半，就像被刀尖頂住，吸不下去。不是被撕開的那種。', clue: { text: '吸氣會頂住的刺痛，沒有撕裂感', kind: 'pos', key: true } },
    'q-assoc': { say: '很喘，心跳得好快，頭有點暈。剛才咳了一口，痰裡有血絲。', clue: { text: '喘、心跳很快、頭暈，咳出帶血絲的痰', kind: 'pos', key: true, tell: { form: 'vascular', dir: 1 }, why: '突然的喘、心跳快，再加上咳血，是肺栓塞的組合。年輕、沒有病史的人，最容易被當成緊張。' } },
    'q-factors': { say: '深呼吸、咳嗽的時候更痛，所以不敢用力吸。坐直好一點，躺下去更喘。跟出不出力沒有關係。', clue: { text: '跟著呼吸痛，跟出力無關', kind: 'pos', tell: { form: 'cardiac', dir: -1 }, why: '跟著呼吸走的刺痛，不是心臟缺血的樣子。不過不能只靠這一條，心電圖還是要做。' } },
    'q-radiate': { say: '不會。背不痛，手臂、下巴也不會。', clue: { text: '不會傳到背、手臂或下巴', kind: 'neg' } },
    'q-treat': { say: '沒有。船上的人說是暈船加上太累，叫我躺一下就好。', clue: { text: '沒有就醫；被當成暈船和太累', kind: 'info' } },
    'q-severity': { say: '吸氣的時候七分。憋著不吸，大概三分。', clue: { text: '吸氣時 7 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有什麼病。船東每年請大夫幫我們看一次，都說很好。', clue: { text: '沒有慢性病', kind: 'info' } },
    'q-family': { say: '我媽生完我弟之後，腿腫過一次。大夫說是裡面有血塊。', clue: { text: '母親產後腿部有過血栓', kind: 'info' } },
    'q-surgery': { say: '兩個禮拜前在船上扭到左腳踝，包了夾板。這十幾天幾乎都躺在艙房裡，沒怎麼下床。', clue: { text: '左腳踝扭傷上夾板，臥床兩週', kind: 'pos', key: true, tell: { form: 'vascular', dir: 1 }, why: '腳受傷固定、躺著不動兩個禮拜，腿裡容易長血塊。這是肺栓塞最重要的背景之一。' } },
    'q-meds': { say: '大夫開了調經的藥，吃了半年。沒有別的，也沒有對什麼過敏。', clue: { text: '吃調經的藥（荷爾蒙）半年，沒有過敏', kind: 'info', key: true } },
    'q-habits': { say: '不抽菸，不喝酒，不吃檳榔。', clue: { text: '不抽菸、不喝酒', kind: 'info' } },
    'q-work': { say: '在遠洋貨船上管帳，一趟出去兩三個月。船上沒有人發燒、咳嗽。', clue: { text: '遠洋貨船的帳房，剛結束長途航程', kind: 'info' } },
    'q-life': { say: '在船上吃得普通。這幾天喘，睡不好。上了岸是一個人住。', clue: { text: '這幾天因為喘睡不好', kind: 'info' } },
    'q-concern': { say: '我的帳冊還在跳板那邊……船東今天要對帳。還有，我以後是不是不能再上船了？', clue: { text: '掛心帳冊；怕以後不能上船', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒，只是覺得身體熱熱的。體重沒變，晚上不會盜汗，聲音也沒變。', clue: { text: '沒有發燒、體重減輕、盜汗或聲音改變', kind: 'neg', tell: { form: 'tumor', dir: -1 }, why: WHY_NO_WEIGHT_LOSS } },
    'q-ros-cp': { say: '平常不咳，今天才咳出那一口。心一直跳得很快。昨天晚上就覺得躺平比較喘。', clue: { text: '今天才開始咳；心悸；躺平比較喘', kind: 'pos' } },
    'q-ros-gi': { say: '沒有，都正常。', clue: { text: '腸胃和大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '左小腿這三天越來越腫、越來越脹。我以為是扭到還沒好。手腳不會麻。', clue: { text: '左小腿三天來越來越腫脹', kind: 'pos', key: true, tell: { form: 'vascular', dir: 1 }, why: '單邊小腿腫脹，要想到腿裡的靜脈有血塊。血塊跑到肺，就是肺栓塞。' } },
  },
  findings: {
    'x-look': { say: '坐得很直，不肯躺下。說一句話要換兩次氣，嘴唇的顏色偏暗。', clue: { text: '端坐、說話要換氣、嘴唇偏暗', kind: 'pos', key: true } },
    'x-head': { say: '結膜不蒼白。嘴唇有一點發紫。脖子和鎖骨上方摸不到腫大的淋巴結。', clue: { text: '嘴唇輕微發紫，沒有摸到淋巴結', kind: 'pos' } },
    'x-jvp': { say: '頸靜脈比平常鼓一點。氣管在正中間。', clue: { text: '頸靜脈輕微怒張，氣管居中', kind: 'pos' } },
    'x-chest-touch': { say: '胸廓對稱，兩邊起伏一樣，只是又淺又快。按壓胸壁和肋骨，不會引發一樣的痛。', clue: { text: '呼吸淺快；按壓胸壁不會引發一樣的痛', kind: 'neg', tell: { form: 'msk', dir: -1 }, why: '按不出一樣的痛，就比較不像胸壁的肌肉或肋骨。' } },
    'x-chest-listen': { say: '兩側叩診音清，呼吸音清楚、對稱，沒有囉音，也沒有喘鳴。', clue: { text: '兩側呼吸音清楚、對稱', kind: 'neg', key: true } },
    'x-heart': { say: '心跳很快，規則。沒有雜音，沒有心包摩擦音。', clue: { text: '心搏快而規則，沒有雜音', kind: 'pos' } },
    'x-botharms': { say: '右手 104/66 mmHg，左手 102/64 mmHg。兩邊脈搏一樣強，都很快。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟，沒有壓痛。', clue: { text: '腹部柔軟，沒有壓痛', kind: 'neg' } },
    'x-perfusion': { say: '手指冰冷，指甲床的顏色偏暗，微血管回填約 3 秒。指甲的形狀正常。', clue: { text: '手指冰冷，微血管回填約 3 秒', kind: 'pos', key: true } },
    'x-legs': { say: '左小腿比右邊粗了大約 3 公分，皮膚溫熱、發亮，沿著小腿後面按下去會痛。右腳正常。', clue: { text: '左小腿比右邊粗 3 公分，溫熱、按了會痛', kind: 'pos', key: true, tell: { form: 'vascular', dir: 1 }, why: '兩邊小腿粗細差這麼多，又熱又痛，是深部靜脈栓塞的樣子。配上突然的喘和低血氧，肺栓塞要排第一。' } },
  },
  results: {
    't-ecg': { say: '竇性心搏過速，每分鐘 118 下。沒有 ST 段上升。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速，沒有 ST 段上升', kind: 'neg', key: true, tell: { form: 'cardiac', dir: -1 }, why: '沒有缺血的變化，急性冠心症比較不像。肺栓塞的心電圖常常只看到心跳快，所以不能用它來排除。' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-cxr': { say: '兩側肺野清楚，沒有氣胸，沒有肺炎的陰影，縱膈沒有變寬。' + TEXT_RESULT, clue: { text: '胸部 X 光：肺野清楚，沒有氣胸或肺炎', kind: 'neg', key: true, fog: 5, tell: { form: 'vascular', dir: 1 }, why: '喘成這樣、血氧這麼低，片子卻是乾淨的：氣胸、肺炎都不像，問題可能在肺的血管。X 光正常，不能排除肺栓塞。' } },
    't-glucose': { say: '98 mg/dL。', clue: { text: '血糖 98 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'vascular', exclude: { cardiac: 2, msk: 2, tumor: 1 } },
  summaries: [
    { id: 's-best', text: '35 歲女性，左腳踝扭傷後臥床兩週，今天突然右胸刺痛合併喘，吸氣會加重；心跳快、血氧 89%，左小腿腫痛。', score: 5, note: '有年齡、危險因子、起病的方式、性質、目前的穩定程度和小腿的發現。聽的人馬上知道你在擔心什麼。' },
    { id: 's-ok', text: '35 歲女性，今天早上突然胸痛和喘，心跳很快。', score: 3, note: '起病的方式有了，但少了臥床兩週、血氧 89% 和小腿腫痛，這三樣才是讓人警覺的地方。' },
    { id: 's-vague', text: '年輕女性胸悶、呼吸不順，可能是太累或太緊張。', score: 0, note: '把喘和心跳快歸給緊張，是肺栓塞最常被漏掉的原因。先看血氧。' },
    { id: 's-anchor', text: '35 歲女性胸痛，吸氣會痛，應該是躺太久、肌肉痠痛。', score: 0, note: '「躺太久」正是危險因子，卻被拿來當成不要緊的理由。按壓胸壁也按不出一樣的痛。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-pe', text: '我的診斷是血管急症，擔心肺栓塞。病人血氧低、心跳快，現在不穩定。', score: 2, note: '說出最擔心的問題，也說出有多急。' },
      { id: 'a-unknown', text: '胸痛合併喘，原因還不清楚。', score: 1, note: '沒有說出你擔心什麼。臥床兩週、小腿腫痛、血氧 89% 都沒有報。' },
      { id: 'a-anxious', text: '年輕、沒有病史，可能是換氣過度，想先讓她休息。', score: 0, note: '換氣過度不會讓血氧掉到 89%。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-ecg', text: '請同意馬上做 12 導程心電圖，也請您評估需不需要進一步的影像檢查。', ok: true, orders: 't-ecg', note: '急性胸痛都要有心電圖。要不要做電腦斷層血管攝影，由醫師依臨床機率決定。' },
      { id: 'r-o2', text: '我先讓她坐高、給氧氣，接上監測，每 5 分鐘重測一次。', ok: true, note: '血氧低於 90%，給氧是該做的。也說出了你自己接下來會做什麼。' },
      { id: 'r-wait', text: '先讓她休息半小時，喘沒有好再跟您說。', ok: false, note: '這是延遲。血氧 89%、心跳 118，不能等。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您突然又喘又痛、血氧偏低，小腿也腫。我們擔心是血塊影響到肺的血管，需要馬上檢查。', ok: true, note: '用病人聽得懂的話說出擔心什麼、為什麼要檢查，沒有把話說死。' },
    { id: 'e-plan', text: '醫師馬上過來，我會一直在旁邊。現在先坐高、戴著氧氣，不要自己下床。', ok: true, note: '說明接下來會發生什麼，以及她現在要配合的事。' },
    { id: 'e-warn', text: '如果更喘、胸口更痛、頭更暈，或是想吐，馬上跟我說。', ok: true, note: '交代要注意的變化。' },
    { id: 'e-concern', text: '您掛心帳冊，也擔心之後能不能上船。帳冊我請碼頭的人先幫您收好；能不能上船，等檢查結果出來，請醫師跟您說明。', ok: true, concern: true, needsClue: 'c-concern', note: '回應她在意的兩件事：一件現在就能處理，一件誠實地說要等結果。' },
    { id: 'e-false', text: '年輕人不會有什麼大問題，放輕鬆、慢慢呼吸就好。', ok: false, note: '沒有根據的保證，而且把低血氧當成緊張。' },
    { id: 'e-jargon', text: '您是肺栓塞，要打抗凝血劑，可能還要溶栓。', ok: false, note: '還沒有影像結果就說出診斷和治療。這些要等檢查、由醫師說明。' },
  ],

  // 下了診斷之後：兩分鐘內沒有人知道，她會變差；五分鐘還沒有，岑禾接手
  timeline: { worsenAfter: 120, stepInAfter: 300, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-ecg', within: 180, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一張是出診。順序一樣，不過你要一邊做、一邊看著她。值班鐘我帶來了，隨時可以敲。'],
    watch: '阮舟坐得很直，兩手撐著床沿，肩膀跟著每一口氣上下。',
    watchWorse: '阮舟的嘴唇發紫，說不出完整的句子。',
    worsen: '我……吸不到氣……',
    stepIn: '我先敲鐘了。血氧這麼低的病人，不能讓她等。',
    called: '鐘響了，整個碼頭都聽得到。沈渡醫師馬上到，你繼續。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。先坐高、給氧，心電圖我來看，影像我來安排。腿上那一段，你量得很清楚。',
    reportWeak: '我聽不出來有多急。先講血氧多少、你最擔心什麼、要我做什麼。我先看病人。',
    testRead: '竇性心搏過速，沒有 ST 段上升。喘成這樣、腿又腫，我來安排電腦斷層。你留在她旁邊，繼續給氧。',
    explainOk: '……好。我不動。',
    explainConcern: '……帳冊有人收就好。謝謝你跟我說實話。',
    explainBad: '可是……我真的吸不到氣……',
    closing: '霧散了。「血管急症」那一盞，終於有人看過它亮起來的樣子。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓她知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。真實的情境裡，量到血氧 89% 就會先給氧、先叫人，不會等整套問完。提早敲鐘不扣分。',
      '「血管急症」底下有兩個病。沒有撕裂痛、兩手血壓沒有差別，讓主動脈剝離比較不像；其他的線索都指向肺栓塞。',
      '要不要做電腦斷層血管攝影、要不要先驗 D-dimer，由醫師依臨床機率決定。你的工作是把危險因子和小腿的發現報清楚。',
    ],
    teaching: [
      { text: '急性胸痛要先找出會致命的原因：急性冠心症、主動脈剝離、肺栓塞。', ref: 'gulati2021' },
      { text: '懷疑肺栓塞，先評估臨床機率：有沒有深部靜脈栓塞的徵象、心跳快、近期臥床或手術、咳血。機率低而且 D-dimer 陰性，可以不做影像就排除。', ref: 'wells2001' },
      { text: '肺栓塞的心電圖和胸部 X 光常常沒有專一的變化，主要是用來找別的原因；正常不能排除。', ref: 'konstantinides2020' },
      { text: '肺栓塞合併血氧低於 90%，要給氧氣。', ref: 'konstantinides2020' },
    ],
    references: [GULATI_2021, KONSTANTINIDES_2020, WELLS_2001],
  },
};
