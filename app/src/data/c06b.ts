// 病例 C06B：甘棗，背痛，真身是泌尿（輸尿管結石，腎絞痛）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一位是自己撐到天亮才來的。
// 這一關要練的是：「一動就痛、不敢動」和「坐不住、怎麼換姿勢都痛」不是同一件事。
// 還有：結石本身不一定急，但堵住又感染、尿不出來，就不能等。
import type { CaseSpec } from '../core/module.ts';
import { TURK_2016 } from './back-pain.refs.ts';
import { REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C06B: CaseSpec = {
  format: 3,
  id: 'c06b',
  complaint: 'back-pain',
  kind: '變體',
  title: '坐不住',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '甘棗', age: 45, sex: '男', job: '鹽倉的帳房', look: 'c06b', pronoun: '他' },
  scene: 'ward-rain',
  reading: {
    lines: ['甘棗，45 歲，鹽倉的帳房。', '今天清晨被痛醒：左邊的腰像被人擰住，一陣一陣地絞，痛到吐。他在屋裡走來走去，坐也不是、躺也不是，撐到天亮才叫了車。', '他是弓著身子走進來的，一手按著左腰，額頭上都是汗。在床邊坐不到三句話，又站了起來。'],
    prompts: ['最危險的可能是什麼？', '「一動就痛」和「怎麼換姿勢都痛」，各自指向哪裡？', '如果是石頭，哪幾樣一出現就不能等？'],
  },
  vitals: {
    base: { bp: '148/90', hr: 98, rr: 20, spo2: 99, bt: 36.8 },
    clue: { text: '血壓和心跳偏高（正在痛）；沒有發燒', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（甘棗站在床邊，一手按著左腰，身體微微弓著。）' },
    'q-intro': { say: '甘棗。寒露生的，四十五。……等一下，又來了。（他停下來，喘了幾口氣。）' },
    'q-explain': { say: '好，好。你問，我走著答可以嗎？我坐不住。' },
    // 主訴
    'q-cc': { say: '左邊的腰，痛得要命。', clue: { text: '主訴：左腰劇痛', kind: 'pos' } },
    'q-onset': { say: '今天清晨，睡到一半被痛醒的。沒有搬東西，沒有閃到，一下子就痛起來了。', clue: { text: '清晨睡夢中突然發作，沒有出力或扭到', kind: 'pos', key: true, tell: { form: 'msk', dir: -1 }, why: '肌肉拉傷要有「那一下」：彎腰、出力、扭到。睡著睡著被痛醒，就比較不像。' } },
    'q-location': { say: '左邊腰的後面，肋骨下面這裡。', clue: { text: '左側腰部，肋骨下緣', kind: 'pos' } },
    'q-duration': { say: '一陣一陣的。絞起來大概一刻鐘，鬆一下，又來。躺著不動也一樣痛。', clue: { text: '一陣一陣地絞，中間會鬆；休息沒有用', kind: 'pos', key: true, tell: { form: 'urinary', dir: 1 }, why: '一陣一陣絞、中間會鬆、跟動不動沒有關係：這是一條管子被堵住，正在用力往下擠的痛。' } },
    'q-character': { say: '絞的。像有人伸手進去，在裡面擰。', clue: { text: '絞痛', kind: 'pos' } },
    'q-assoc': { say: '吐了兩次。小便變得很頻，每次只有一點點，顏色像洗肉的水。沒有發燒，沒有發冷。腳不麻。', clue: { text: '嘔吐、頻尿、尿色偏紅；沒有發燒或畏寒', kind: 'pos', key: true } },
    'q-factors': { say: '什麼姿勢都沒用。走來走去好像還好過一點。彎腰、轉身不會更痛。', clue: { text: '找不到舒服的姿勢；彎腰轉身不會加重', kind: 'pos', key: true } },
    'q-radiate': { say: '從腰往前、往下跑，跑到左邊的鼠蹊，連下面都在抽。', clue: { text: '從左腰往下傳到左側鼠蹊', kind: 'pos', key: true, tell: { form: 'urinary', dir: 1 }, why: '痛順著輸尿管的路線往下走到鼠蹊：這是石頭往下掉的那條路。' } },
    'q-treat': { say: '家裡有止痛的藥粉。吃了，又吐掉了。', clue: { text: '口服止痛藥吐掉了', kind: 'info' } },
    'q-severity': { say: '九分。我這輩子沒這麼痛過。', clue: { text: '9 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '血壓有一點高，沒在吃藥。三年前右邊也這樣痛過一次，後來尿出一顆小石頭。腳趾痛風發過兩次。兩顆腎都在。', clue: { text: '三年前排出過結石；有痛風；兩側腎臟都在', kind: 'pos', key: true } },
    'q-family': { say: '我爸也有石頭。', clue: { text: '父親有結石', kind: 'info' } },
    'q-surgery': { say: '沒開過刀。沒有摔倒，沒有撞到。', clue: { text: '沒有外傷或手術', kind: 'neg' } },
    'q-meds': { say: '沒有固定吃藥。沒有過敏。', clue: { text: '沒有用藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '不抽菸。酒喝得少。', clue: { text: '不抽菸', kind: 'info' } },
    'q-work': { say: '在鹽倉管帳，一坐就是一整天。倉裡又乾又熱，我水喝得很少，一天上不到三次茅房。', clue: { text: '久坐，水喝得很少', kind: 'info', key: true } },
    'q-life': { say: '愛吃內臟和海味。這幾天沒有什麼特別的。', clue: { text: '常吃內臟和海鮮', kind: 'info' } },
    'q-concern': { say: '上次是自己尿出來的。這次這麼痛，是不是卡住了？要不要開刀？月底要盤點，我走不開。', clue: { text: '怕石頭卡住要開刀；月底要盤點', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒，沒有發冷。體重沒變。', clue: { text: '沒有發燒或畏寒', kind: 'neg', key: true } },
    'q-ros-cp': { say: '不咳，不喘，胸口不痛。', clue: { text: '心肺沒有症狀', kind: 'neg' } },
    'q-ros-gi': { say: '想吐。肚子中間不痛，沒有拉肚子，有排氣。', clue: { text: '噁心嘔吐；有排氣，沒有腹瀉', kind: 'neg' } },
    'q-ros-limb': { say: '兩隻腳不麻，有力，不腫。屁股和胯下也不會麻。', clue: { text: '兩腳不麻、有力；會陰不麻', kind: 'neg', tell: { form: 'spine', dir: -1 }, why: '神經被壓住的背痛，腳會麻、會沒力，嚴重的連大小便都出問題。他都沒有。' } },
  },
  findings: {
    'x-look': { say: '站不住也坐不住，一直換姿勢、來回走。臉色發白，額頭冒汗。', clue: { text: '坐立不安，一直換姿勢；冒冷汗', kind: 'pos', key: true } },
    'x-spine': { say: '脊椎一節一節敲，不痛。腰兩旁的肌肉不緊，按了也不痛。', clue: { text: '脊椎和腰部肌肉都沒有壓痛', kind: 'neg', key: true } },
    'x-move': { say: '彎腰、後仰、側彎都做得到，不會讓痛更厲害。', clue: { text: '腰的活動不受限，動作不會加重疼痛', kind: 'neg' } },
    'x-cva': { say: '敲左邊腰的後面，他痛得整個人彈開。右邊敲了不痛。', clue: { text: '左側肋脊角敲擊痛', kind: 'pos', key: true, tell: { form: 'urinary', dir: 1 }, why: '腰的後面一敲就痛，而且只有一邊：痛的源頭是那一邊的腎臟和輸尿管。' } },
    'x-slr': { say: '兩腿抬高，都不會引起腿後面的麻痛。', clue: { text: '直腿抬高兩側陰性', kind: 'neg' } },
    'x-motor': { say: '兩腳的力氣正常，兩邊一樣。', clue: { text: '下肢肌力正常', kind: 'neg' } },
    'x-sense': { say: '兩腿的觸覺一樣。經他同意檢查胯下：感覺正常。', clue: { text: '下肢和會陰的感覺正常', kind: 'neg', key: true } },
    'x-reflex': { say: '膝蓋和腳跟的反射對稱。', clue: { text: '反射對稱', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟。左下腹深按有點痠，沒有反彈痛。肚臍附近摸不到會跳動的腫塊。', clue: { text: '腹部柔軟，沒有腹膜徵象，沒有搏動性的腫塊', kind: 'neg', key: true, tell: { form: 'vascular', dir: -1 }, why: '年紀大的人第一次「腎絞痛」，要先想大血管。他四十五歲、以前排過石頭，肚子也摸不到會跳的腫塊，就比較不像；超音波可以再看一眼。' } },
    'x-pulse': { say: '兩邊鼠蹊和腳背的脈搏一樣強。腳是暖的。', clue: { text: '下肢脈搏對稱，末梢溫暖', kind: 'neg' } },
  },
  results: {
    't-urine': { say: '顏色偏紅。紅血球很多，白血球不多，亞硝酸鹽陰性。' + TEXT_RESULT, clue: { text: '驗尿：很多紅血球，沒有感染的跡象', kind: 'pos', key: true, fog: 6, tell: { form: 'urinary', dir: 1 }, why: '尿裡都是血，卻沒有感染的跡象，配上絞痛和往下傳的路線，就是石頭。「沒有感染」這一點很要緊：堵住又感染，就是另一回事了。' } },
    't-blood': { say: '白血球正常，腎功能正常。尿酸偏高。' + TEXT_RESULT, clue: { text: '抽血：白血球和腎功能正常', kind: 'neg', key: true } },
    't-us': { say: '左邊的腎臟有輕微的積水，輸尿管的上段稍微變粗。右邊正常。主動脈的粗細正常。' + TEXT_RESULT, clue: { text: '超音波：左腎輕度積水；主動脈正常', kind: 'pos', key: true } },
    't-img': { say: '左邊輸尿管下段的位置，有一個米粒大的白點。腰椎正常。' + TEXT_RESULT, clue: { text: 'X 光：左側輸尿管下段有一個小白點', kind: 'pos' } },
  },

  answer: { truth: 'urinary', exclude: { vascular: 2, spine: 2, msk: 1 } },
  summaries: [
    { id: 's-best', text: '45 歲男性，三年前排過結石；今晨睡夢中突發左腰陣發性絞痛，往下傳到左鼠蹊，合併嘔吐、頻尿和尿色偏紅；沒有發燒；坐立不安，左側肋脊角敲擊痛，腹部沒有搏動性腫塊，下肢神經學檢查正常。', score: 5, note: '有痛的樣子、傳的路線、小便的變化，也交代了「沒有發燒」和「不是血管、不是神經」。' },
    { id: 's-ok', text: '45 歲男性，左腰絞痛合併尿色偏紅，以前有過結石。', score: 3, note: '方向對了。少了「沒有發燒」和「肚子沒有會跳的腫塊」：這兩樣在說它不是更危險的東西。' },
    { id: 's-vague', text: '中年男性左邊腰痛、想吐，可能是閃到腰或吃壞肚子。', score: 0, note: '閃到腰的人不敢動。他是坐不住。' },
    { id: 's-anchor', text: '45 歲男性腰痛劇烈、冒冷汗，是椎間盤突出壓到神經。', score: 0, note: '痛得厲害不等於壓到神經。他的腳不麻、有力，彎腰也不會更痛。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-best', text: '我的診斷是泌尿的問題，像是左側輸尿管結石：陣發性的絞痛往下傳到鼠蹊，尿色偏紅，左側肋脊角敲擊痛。沒有發燒；血壓 148/90、心跳 98，是痛造成的，目前穩定。', score: 2, note: '說出判斷和依據，也說出「沒有發燒」這個讓人放心的憑據。' },
      { id: 'a-unknown', text: '左邊腰痛得很厲害，原因還不清楚。', score: 1, note: '痛的樣子、傳的路線、小便的顏色，已經夠你說出方向了。' },
      { id: 'a-strain', text: '應該是閃到腰，想先給他貼膏藥、回去休息。', score: 0, note: '他沒有閃到的那一下，腰的肌肉也不痛。' },
    ],
    requests: [
      { id: 'r-urine', text: '請同意驗尿、抽血看腎功能，並安排超音波，看腎臟有沒有積水。', ok: true, orders: 't-urine', note: '尿看有沒有血、有沒有感染；腎功能和積水看堵得多厲害。' },
      { id: 'r-pain', text: '他痛到九分，吐了兩次，口服的藥吃不住。止痛和止吐請您評估。', ok: true, note: '腎絞痛的止痛不能等。這是他現在最需要的。' },
      { id: 'r-watch', text: '我會記他的尿量和體溫。如果發燒、尿不出來，或是痛一直壓不下來，馬上回報。', ok: true, note: '說出你在防什麼：堵住又發燒、尿不出來，就不是等石頭自己掉的時候了。' },
      { id: 'r-home', text: '他以前是自己尿出來的，我想請他多喝水，回去等石頭掉。', ok: false, note: '痛還沒壓下來，腎功能和有沒有感染都還不知道，不能就這樣讓他走。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的痛很像是輸尿管裡有石頭。石頭往下掉的時候會一陣一陣地絞，痛會跑到鼠蹊，小便也會帶血。', ok: true, note: '用他聽得懂的話，把三樣症狀串成一件事。' },
    { id: 'e-plan', text: '我們會驗尿、抽血、照超音波。醫師會先幫您止痛。小的石頭，多半會自己排出來。', ok: true, note: '說明接下來會發生什麼，也先回答他心裡的問題。' },
    { id: 'e-warn', text: '如果發燒、發冷，尿不出來，或是痛到藥也壓不住，要馬上跟我說。回去之後也一樣，這幾樣一出現就回來。', ok: true, note: '交代什麼情況不能等。' },
    { id: 'e-concern', text: '您擔心石頭卡住要開刀，也掛著月底的盤點。要不要處理，要看石頭多大、卡在哪裡，檢查出來醫師會跟您說。先把痛壓下來，我們再一起看時間怎麼排。', ok: true, concern: true, needsClue: 'c-concern', note: '不替醫師回答「要不要開刀」，但說出這件事是看什麼決定的。' },
    { id: 'e-false', text: '上次自己排出來，這次也一定會。回去多喝水就好。', ok: false, note: '沒有根據的保證。石頭多大、有沒有感染，都還不知道。' },
    { id: 'e-jargon', text: '你是輸尿管結石合併腎積水，可能要把石頭打碎，或是放一條管子進去。', ok: false, note: '檢查還沒做完；要怎麼處理，也不是現在能說的。' },
  ],

  // 這位病人是穩定的：他很痛，但敲值班鐘是過度通報
  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-urine', within: 300, points: 3 }, { type: 'exclude', forms: ['spine', 'vascular'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一位是自己撐到天亮才來的。你看他：坐不住。', '上一位是一動就痛，不敢動。這一位是怎麼換姿勢都痛。同樣是腰，這兩種痛說的不是同一件事。'],
    watch: '甘棗在床邊來回走。痛起來的時候扶著牆彎下腰，過一陣又直起來。',
    called: '鐘響了。沈渡醫師會過來。他很痛，但他的血壓和體溫是穩的。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。先止痛，尿和腎功能一起看。你有報「沒有發燒」，這是我最想知道的一句。',
    reportWeak: '腰很痛，然後呢？痛是哪一種？尿呢？有沒有發燒？下次照這個順序講。',
    testRead: '尿裡都是血，沒有感染，腎功能也好。是石頭。痛先壓下來，再看它多大。',
    explainOk: '石頭……跟上次一樣。好，我配合。',
    explainConcern: '……也是，先不痛再說。盤點我叫徒弟先頂著。',
    explainBad: '可是這次比上次痛太多了……萬一沒掉呢？',
    closing: '霧散了。坐不住的腰痛，源頭在腰的裡面，不在腰上。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '「一動就痛、不敢動」多半是肌肉骨骼；「坐不住、怎麼換姿勢都痛」要往內臟想。問姿勢，是背痛很省力的一題。',
      '結石最怕的是堵住又感染：發燒、發冷、尿不出來。只有一顆腎臟的人、腎功能在變差的人，也不能等。這一位都沒有。',
      '年紀大的人第一次「腎絞痛」，要先想到腹主動脈瘤。所以肚子要摸，超音波也看一眼主動脈。',
    ],
    teaching: [
      { text: '輸尿管結石造成的急性腎絞痛是急症，要馬上止痛。', ref: 'turk2016' },
      { text: '小於 6 毫米的輸尿管結石，在症狀控制得住的病人身上，可以自己排出來。', ref: 'turk2016' },
      { text: '例行的評估，第一線的影像是超音波；急性發作的時候，低劑量的電腦斷層是首選。', ref: 'turk2016' },
    ],
    references: [TURK_2016],
  },
};
