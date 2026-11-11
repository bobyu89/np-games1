// 病例 C01A：林秋，胸痛（危險的那一版）。
// 虛構的教學病例，依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。
import type { CaseDef } from '../core/types.ts';

export const C01A: CaseDef = {
  format: 2,
  id: 'c01a',
  title: '鐘聲之前',
  complaint: '胸痛',
  review: { state: '未審查', note: '示範病例。內容依文末的指引撰寫，還沒經過臨床老師審查，不能當教材。行動的時間限制、權限和處置要由臨床老師定稿。' },
  patient: { name: '林秋', age: 58, sex: '男', job: '港口的燈匠' },
  shadow: { name: '鐵翅蛾', lore: '胸痛的症影。翅膀像鐵片一樣壓在胸口。同樣的外形底下，可能是好幾種不同的病。' },
  reading: {
    lines: [
      '林秋，58 歲，港口的燈匠。',
      '傍晚搬銅燈上架的時候胸口不舒服，同伴扶他到公會的病室。',
      '他清醒，可以自己說話，額頭都是汗。',
    ],
    prompts: ['最危險的可能是什麼？', '最常見的可能是什麼？', '我第一件要知道的事是什麼？有什麼要同時處理？'],
  },
  vitals: {
    base: { bp: '103/68', hr: 108, rr: 24, spo2: 96, bt: 36.4 },
    worse: { bp: '86/58', hr: 118, rr: 26, spo2: 95, bt: 36.4 },
  },

  clues: [
    { id: 'c-onset', text: '持續 40 分鐘，休息沒有好', kind: 'pos', key: true },
    { id: 'c-pressure', text: '胸口正中，壓迫感', kind: 'pos', key: true },
    { id: 'c-radiate', text: '傳到左臂和下巴', kind: 'pos', key: true },
    { id: 'c-severity', text: '疼痛 8 分', kind: 'pos' },
    { id: 'c-crescendo', text: '這兩週出力就悶，這次休息不緩解', kind: 'pos', key: true },
    { id: 'c-nopleuritic', text: '呼吸、轉身、按壓都不影響', kind: 'neg' },
    { id: 'c-notear', text: '沒有撕裂感，沒有痛到背', kind: 'neg' },
    { id: 'c-norelief', text: '坐著只好一點點', kind: 'pos' },
    { id: 'c-sweat', text: '冒冷汗、噁心', kind: 'pos', key: true },
    { id: 'c-sob', text: '有點喘，沒有昏倒', kind: 'pos' },
    { id: 'c-htn', text: '高血壓、血脂偏高', kind: 'info' },
    { id: 'c-meds', text: '血壓藥沒有規則吃，無藥物過敏', kind: 'info' },
    { id: 'c-family', text: '父親 52 歲心肌梗塞', kind: 'info' },
    { id: 'c-smoke', text: '抽菸 30 年', kind: 'info' },
    { id: 'c-noimmob', text: '沒有久坐、腿腫或手術', kind: 'neg' },
    { id: 'c-concern', text: '擔心女兒一個人值夜', kind: 'info' },
    { id: 'c-ros-cv', text: '沒有心悸、夜間喘或腳腫', kind: 'neg' },
    { id: 'c-ros-resp', text: '沒有咳嗽、咳血或發燒', kind: 'neg' },
    { id: 'c-ros-gi', text: '沒有火燒心，跟吃東西無關', kind: 'neg' },
    { id: 'c-notrauma', text: '胸口沒有撞到或拉傷', kind: 'neg' },
    { id: 'c-look', text: '臉色蒼白、冒冷汗、按著胸口', kind: 'pos', key: true },
    { id: 'c-vitals', text: '血壓偏低、心跳快、呼吸快', kind: 'pos', key: true },
    { id: 'c-botharms', text: '兩手血壓沒有明顯差別', kind: 'neg' },
    { id: 'c-heart', text: '心律規則偏快，沒有雜音或摩擦音', kind: 'neg' },
    { id: 'c-lungs', text: '兩側呼吸音清楚、對稱', kind: 'neg' },
    { id: 'c-jvp', text: '沒有頸靜脈怒張', kind: 'neg' },
    { id: 'c-perfusion', text: '手腳濕冷，微血管回填約 3 秒', kind: 'pos', key: true },
    { id: 'c-legs', text: '脈搏對稱，小腿不腫不痛', kind: 'neg' },
    { id: 'c-chestwall', text: '按壓胸壁不會引發一樣的痛', kind: 'neg' },
    { id: 'c-abd', text: '腹部柔軟，上腹沒有壓痛', kind: 'neg' },
    { id: 'c-record', text: '舊紀錄：高血壓沒有追蹤，沒做過心電圖', kind: 'info' },
    { id: 'c-glucose', text: '血糖 132 mg/dL', kind: 'neg' },
    { id: 'c-ecg', text: '心電圖：II、III、aVF 的 ST 段上升', kind: 'pos', key: true, fog: 6 },
  ],

  questions: [
    { id: 'q-intro', group: 'open', label: '自我介紹', ask: '林先生您好，我是今天照顧您的專科護理師。先跟您確認名字，接下來我會問幾個問題、做一些檢查，可以嗎？', answer: '林秋……好，麻煩你了。', weight: 0 },
    { id: 'q-concern', group: 'open', label: '他擔心什麼', ask: '您現在最擔心的是什麼？', answer: '我女兒今晚一個人值夜守燈……她還在等我去交班。', clue: 'c-concern', weight: 2 },

    { id: 'q-onset', group: 'cc', label: '何時開始', ask: '現在還在痛嗎？什麼時候開始的？', answer: '搬到第三盞燈的時候開始的。大概四十分鐘了，休息也沒有比較好。', clue: 'c-onset', weight: 3 },
    { id: 'q-quality', group: 'cc', label: '位置與性質', ask: '是怎麼樣的痛？在哪個位置？', answer: '胸口正中間，像被什麼壓住。', clue: 'c-pressure', weight: 3 },
    { id: 'q-radiate', group: 'cc', label: '會傳到哪', ask: '會痛到別的地方嗎？', answer: '一路到左手臂，下巴也有點緊。', clue: 'c-radiate', weight: 3 },
    { id: 'q-severity', group: 'cc', label: '幾分痛', ask: '零到十分，現在大概幾分？', answer: '八分吧……比以前任何一次都厲害。', clue: 'c-severity', weight: 1 },
    { id: 'q-provoke', group: 'cc', label: '誘發', ask: '那時候在做什麼？以前出力的時候會這樣嗎？', answer: '在搬銅燈上架子。這兩個禮拜爬坡會悶，停下來幾分鐘就好。這次不一樣。', clue: 'c-crescendo', weight: 3 },
    { id: 'q-worse', group: 'cc', label: '加重', ask: '深呼吸、咳嗽、轉身或按胸口，會更痛嗎？', answer: '都不會，怎麼動都一樣。', clue: 'c-nopleuritic', weight: 2 },
    { id: 'q-tear', group: 'cc', label: '撕裂、背痛', ask: '有沒有像被撕開的感覺？會痛到背後嗎？', answer: '沒有，背不痛。就是壓著。', clue: 'c-notear', weight: 2 },
    { id: 'q-relief', group: 'cc', label: '緩解', ask: '有什麼會讓它好一點？吃過什麼藥嗎？', answer: '坐著好一點點，沒有完全好。沒吃藥。', clue: 'c-norelief', weight: 1 },
    { id: 'q-assoc', group: 'cc', label: '伴隨症狀', ask: '還有哪裡不舒服？', answer: '一直冒冷汗，還有點想吐。', clue: 'c-sweat', weight: 3 },
    { id: 'q-sob', group: 'cc', label: '喘、昏倒', ask: '會喘嗎？有沒有頭暈或快昏倒？', answer: '有一點喘。沒有昏倒，只是很虛。', clue: 'c-sob', weight: 2 },

    { id: 'q-pmh', group: 'hx', label: '過去病史', ask: '以前有什麼病？', answer: '高血壓五年，在藥舖拿藥。大夫說過血脂偏高，我沒理它。', clue: 'c-htn', weight: 2 },
    { id: 'q-meds', group: 'hx', label: '用藥與過敏', ask: '現在吃什麼藥？有沒有對什麼藥過敏？', answer: '血壓藥，有時候忘記吃。沒有過敏。', clue: 'c-meds', weight: 2 },
    { id: 'q-family', group: 'hx', label: '家族史', ask: '家裡有人年輕的時候心臟出過事嗎？', answer: '我爸五十二歲那年心肌梗塞走的。', clue: 'c-family', weight: 2 },
    { id: 'q-smoke', group: 'hx', label: '菸酒', ask: '抽菸、喝酒嗎？', answer: '菸抽了三十年，一天一包。酒很少。', clue: 'c-smoke', weight: 2 },
    { id: 'q-immob', group: 'hx', label: '久坐、腿腫', ask: '最近有沒有長時間坐著不動、腿腫，或是剛開過刀？', answer: '沒有，天天都在走動幹活。', clue: 'c-noimmob', weight: 2 },

    { id: 'q-ros-cv', group: 'ros', label: '心悸、腳腫', ask: '會心悸嗎？晚上會喘到要坐起來、腳會腫嗎？', answer: '都沒有。', clue: 'c-ros-cv', weight: 1 },
    { id: 'q-ros-resp', group: 'ros', label: '咳嗽、發燒', ask: '有咳嗽、咳血或發燒嗎？', answer: '沒有。', clue: 'c-ros-resp', weight: 1 },
    { id: 'q-ros-gi', group: 'ros', label: '火燒心', ask: '有火燒心、吐酸水嗎？跟吃東西有關係嗎？', answer: '沒有，跟吃飯沒關係。', clue: 'c-ros-gi', weight: 1 },
    { id: 'q-trauma', group: 'ros', label: '外傷', ask: '最近胸口有沒有撞到或拉傷？', answer: '沒有。', clue: 'c-notrauma', weight: 1 },
  ],

  exams: [
    { id: 'x-look', label: '觀察外觀', explain: '我先看一下您整體的樣子和呼吸。', finding: '表情痛苦，臉色蒼白，額頭和脖子都是冷汗，一手按著胸口。', clue: 'c-look', weight: 2 },
    { id: 'x-botharms', label: '量兩手血壓', explain: '我要量您兩隻手的血壓，比較兩邊有沒有差別，袖帶會緊一下。', finding: '右手 102/66 mmHg，左手 104/68 mmHg，沒有明顯差別。', clue: 'c-botharms', weight: 2 },
    { id: 'x-heart', label: '聽心臟', explain: '我要聽您的心臟，會把聽診器放在胸口幾個位置，需要把衣服解開一點。', finding: '心律規則、偏快。沒有雜音，沒有心包摩擦音。', clue: 'c-heart', weight: 2 },
    { id: 'x-lungs', label: '聽肺部', explain: '我要聽您兩邊的呼吸聲，前面和背後都會聽，請您慢慢呼吸。', finding: '兩側呼吸音清楚、對稱，沒有囉音。', clue: 'c-lungs', weight: 2 },
    { id: 'x-jvp', label: '看頸靜脈', explain: '我要看一下您脖子的血管，請把頭稍微轉向左邊。', finding: '沒有頸靜脈怒張。', clue: 'c-jvp', weight: 1 },
    { id: 'x-perfusion', label: '摸手腳末梢', explain: '我要摸您的手和腳，看溫度和血液循環，會壓一下指甲。', finding: '手腳濕冷，微血管回填約 3 秒。', clue: 'c-perfusion', weight: 2 },
    { id: 'x-legs', label: '脈搏與小腿', explain: '我要摸您手腕和腳背的脈搏，再看一下兩邊的小腿。', finding: '兩側橈動脈、足背動脈的搏動對稱。兩腳沒有水腫，小腿沒有壓痛。', clue: 'c-legs', weight: 1 },
    { id: 'x-chestwall', label: '按壓胸壁', explain: '我要輕輕按您胸口幾個地方，看按了會不會出現一樣的痛，會痛請馬上說。', finding: '按壓胸壁不會引發一樣的痛。', clue: 'c-chestwall', weight: 1 },
    { id: 'x-abd', label: '摸肚子', explain: '我要摸一下您的肚子，特別是上腹的位置，請把腿稍微彎起來。', finding: '腹部柔軟，上腹沒有壓痛。', clue: 'c-abd', weight: 1 },
  ],

  tests: [
    { id: 't-record', label: '公會的舊紀錄', kind: 'record', cost: 20, result: '兩年前的紀錄：高血壓，建議戒菸，之後沒有回來追蹤。沒有做過心電圖。', clue: 'c-record' },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 120, result: '竇性心律，心跳約每分鐘 110 下。II、III、aVF 導程的 ST 段上升，I、aVL 導程的 ST 段下降。（訓練用的文字結果，要由值班醫師判讀。）', clue: 'c-ecg' },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 60, result: '132 mg/dL。', clue: 'c-glucose' },
    { id: 't-blood', label: '抽血（含心肌旋蛋白）', kind: 'order', cost: 20, pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, pending: '已經排上，還沒輪到，這一關裡等不到。' },
  ],

  hypotheses: [
    { id: 'acs', name: '急性冠心症', support: ['c-onset', 'c-pressure', 'c-radiate', 'c-crescendo', 'c-sweat', 'c-htn', 'c-family', 'c-smoke', 'c-look', 'c-vitals', 'c-perfusion', 'c-ecg', 'c-severity', 'c-norelief', 'c-sob'], against: [] },
    { id: 'dissection', name: '主動脈剝離', support: ['c-htn', 'c-severity', 'c-vitals'], against: ['c-notear', 'c-botharms', 'c-legs'] },
    { id: 'pe', name: '肺栓塞', support: ['c-sob', 'c-vitals'], against: ['c-noimmob', 'c-legs', 'c-ros-resp', 'c-nopleuritic', 'c-lungs'] },
    { id: 'ptx', name: '張力性氣胸', support: ['c-sob', 'c-vitals'], against: ['c-lungs', 'c-jvp', 'c-notrauma', 'c-nopleuritic'] },
    { id: 'peri', name: '急性心包膜炎', support: [], against: ['c-nopleuritic', 'c-heart', 'c-ros-resp'] },
    { id: 'gerd', name: '胃食道逆流', support: [], against: ['c-ros-gi', 'c-sweat', 'c-radiate', 'c-crescendo', 'c-abd', 'c-vitals'] },
    { id: 'msk', name: '胸壁肌肉骨骼疼痛', support: [], against: ['c-chestwall', 'c-nopleuritic', 'c-notrauma', 'c-sweat', 'c-vitals'] },
    { id: 'panic', name: '恐慌發作', support: ['c-sob'], against: ['c-crescendo', 'c-radiate', 'c-perfusion', 'c-vitals', 'c-ecg'] },
  ],
  answer: { likely: 'acs', exclude: { dissection: 2, pe: 2, ptx: 1 } },

  summaries: [
    { id: 's-best', text: '58 歲男性，有高血壓和抽菸史，急性持續 40 分鐘的胸口壓迫感，合併冒冷汗，血壓偏低。', score: 5, note: '有年齡、危險因子、病程、性質、伴隨症狀和目前的穩定程度，聽的人馬上知道有多急。' },
    { id: 's-ok', text: '58 歲男性，搬重物之後胸痛 40 分鐘，休息沒有改善。', score: 3, note: '病程有了，但少了壓迫感、冒冷汗和血壓偏低這幾個決定急不急的資訊。' },
    { id: 's-vague', text: '中年男性胸口不舒服，原因還不清楚。', score: 0, note: '太模糊，聽的人沒辦法判斷要不要馬上過來。' },
    { id: 's-anchor', text: '58 歲男性搬重物後胸痛，應該是胸壁拉傷。', score: 0, note: '一句話裡直接下了診斷，而且是把搬重物當成唯一的解釋。問題摘要要先講事實。' },
  ],

  sbar: {
    assessments: [
      { id: 'a-acs', text: '我擔心是急性冠心症，病人現在不穩定。', score: 2, note: '說出最擔心的問題，也說出有多急。' },
      { id: 'a-unknown', text: '胸痛的原因還不清楚，生命徵象還可以。', score: 1, note: '沒有說出你擔心什麼。血壓偏低、心跳快、手腳濕冷不算「還可以」。' },
      { id: 'a-msk', text: '可能是搬東西拉傷，想先觀察看看。', score: 0, note: '持續的壓迫感合併冒冷汗，不能先當成拉傷來觀察。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-ecg', text: '請同意馬上做 12 導程心電圖，並請您判讀。', ok: true, note: '疑似急性冠心症要在 10 分鐘內取得並判讀心電圖。' },
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

  timeline: { worsenAt: 240, stepInAt: 480, ecgBy: 600, ecgTest: 't-ecg', doctorDelay: 90 },

  lines: {
    opening: ['你現在最想知道什麼？有什麼要同時處理？'],
    worsen: '頭……有點暈。',
    stepIn: '我先敲鐘了。這個病人不能再等。',
    called: '值班鐘響了。沈渡醫師馬上到，你繼續。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。心電圖我來判讀，你接著監測，五分鐘後重測血壓。',
    reportWeak: '我聽不出來有多急。下次先講你最擔心什麼、要我做什麼。我先看病人。',
    ecgRead: 'II、III、aVF 的 ST 段上升。我來安排後送，你留在他旁邊。',
    closing: '霧散了。把這一筆寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  hints: [
    { id: 'h-call', text: '持續的胸口壓迫、冒冷汗、血壓偏低。這幾件事湊在一起，可以等你問完再叫人嗎？' },
    { id: 'h-vitals', text: '你還不知道他的血壓和心跳。看得到的數字，先拿到手。' },
    { id: 'h-ecg', text: '懷疑心臟的時候，有一項檢查越早做越好。到「檢查」裡找。' },
    { id: 'h-negatives', text: '最可能的你有了。那些不能漏掉的呢？問一個能把它排除的問題。' },
    { id: 'h-report', text: '人叫了，但他還不知道發生什麼事。把重點報給沈渡醫師。' },
    { id: 'h-reassess', text: '他的樣子變了。你手上的數字還是剛才的。' },
    { id: 'h-board', text: '線索夠多了。到「推理」把它們排一排：最可能的是什麼，還要排除什麼。' },
    { id: 'h-explain', text: '林秋還不知道自己怎麼了。結案之前，跟他說明。' },
    { id: 'h-close', text: '該做的都做了。到「說明」裡提交摘要。' },
  ],

  debrief: {
    alternatives: [
      '先敲鐘、再補問病史，或是先量生命徵象、看到血壓偏低就敲鐘，兩種順序都可以。',
      '心電圖可以在敲鐘之前就先提出，不用等醫師到。',
      '病史不用一次問完。先問會改變處置的幾題，穩定之後再補齊。',
    ],
    teaching: [
      { text: '急性胸痛要先找出會致命的原因：急性冠心症、主動脈剝離、肺栓塞、張力性氣胸。', ref: 'gulati2021' },
      { text: '疑似急性冠心症，要在 10 分鐘內取得並判讀 12 導程心電圖。', ref: 'rao2025' },
      { text: '胸壁按壓會痛，只是讓急性冠心症比較不像，不能單靠這一項排除。', ref: 'gulati2021' },
      { text: '血氧在 90% 以上的時候，不需要常規給氧氣。', ref: 'rao2025' },
    ],
    references: [
      { id: 'gulati2021', text: 'Gulati, M., et al. (2021). 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR guideline for the evaluation and diagnosis of chest pain. Circulation, 144(22), e368–e454.', doi: '10.1161/CIR.0000000000001029' },
      { id: 'rao2025', text: 'Rao, S. V., et al. (2025). 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. Journal of the American College of Cardiology, 85(22), 2135–2237.', doi: '10.1016/j.jacc.2024.11.009' },
    ],
  },
};
