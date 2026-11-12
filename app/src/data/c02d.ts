// 病例 C02D：岳楊，喘，真身是突發急症（自發性氣胸）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：一下子就喘起來的年輕人。一邊敲起來特別響、卻聽不到呼吸音，是什麼意思；還有，什麼時候不能再等。
// 地點不在公會：他在船上補帆的時候發作，下不了船，所以是出診到碼頭的貨棧。
import type { CaseSpec } from '../core/module.ts';
import { MACDUFF_2010, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C02D: CaseSpec = {
  format: 3,
  id: 'c02d',
  complaint: 'dyspnea',
  kind: '遷移',
  title: '桅杆下的一刺',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '岳楊', age: 24, sex: '男', job: '修桅杆的索具工', look: 'yang', pronoun: '他' },
  scene: 'dock',
  reading: {
    lines: ['岳楊，24 歲，修桅杆的索具工。又高又瘦。', '一個鐘頭前坐在甲板上補帆，右邊胸口突然一刺，接著就喘。同伴把他扶下船，抬進碼頭的貨棧。', '這一張是出診。他坐著，一手按著右胸，呼吸很淺，不敢吸深。'],
    prompts: ['最危險的可能是什麼？', '「突然」這兩個字，把哪幾種病排到前面？', '身體評估的時候，哪幾樣東西變了，我就不能再等？'],
  },
  vitals: {
    base: { bp: '118/76', hr: 104, rr: 24, spo2: 93, bt: 36.7 },
    worse: { bp: '92/58', hr: 128, rr: 32, spo2: 86, bt: 36.7 },
    clue: { text: '心跳快、呼吸快、血氧 93%，沒有發燒', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（岳楊坐在貨棧角落的床上，身體微微往右邊縮，一手按著右胸。）' },
    'q-intro': { say: '岳楊。清明生的，二十四。' },
    'q-explain': { say: '好。我不太敢吸氣，講短一點。' },
    // 主訴
    'q-cc': { say: '右邊胸口痛，喘，吸不到底。', clue: { text: '主訴：右胸痛、喘', kind: 'pos' } },
    'q-onset': { say: '一個鐘頭前。我坐著補帆，沒有出力，右邊突然像被刺了一下，接著就喘了。', clue: { text: '一小時前坐著的時候突然發作', kind: 'pos', key: true, tell: { form: 'sudden', dir: 1 }, why: '前一刻還好好的，沒有出力，一下子就又痛又喘。這種開始的方式，要先想氣胸和肺栓塞。' } },
    'q-location': { say: '坐著不動也喘。剛才從船上走下來，走幾步就要停。今天早上爬桅杆的時候，一點都不喘。', clue: { text: '坐著不動也喘；今天早上之前完全正常', kind: 'pos', key: true } },
    'q-duration': { say: '從那一下之後就一直喘，沒有好過。', clue: { text: '發作之後持續地喘', kind: 'pos' } },
    'q-character': { say: '吸到一半右邊就痛，像刀刺。吸不深，所以喘。不是氣吐不出去。', clue: { text: '吸氣時右胸像刀刺，吸不深', kind: 'pos', key: true } },
    'q-assoc': { say: '沒有發燒，沒有咳嗽，沒有痰。心跳得很快。腳沒有腫。', clue: { text: '沒有發燒、咳嗽或痰', kind: 'neg', tell: { form: 'infect', dir: -1 }, why: '肺炎會發燒、咳嗽、有濃痰，而且是幾天裡慢慢來。這些都沒有，就比較不像。' } },
    'q-factors': { say: '深呼吸、咳嗽、轉身都更痛。坐著不動、淺淺地吸最舒服。', clue: { text: '深呼吸、咳嗽、轉身會加重', kind: 'pos' } },
    'q-radiate': { say: '昨天晚上睡得很好，平躺沒事。以前從來不會夜裡喘。', clue: { text: '昨晚可以平躺，從來沒有夜裡喘醒', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '昨天晚上還能平躺睡覺、今天早上還能爬桅杆，不是心臟慢慢撐不住的樣子。' } },
    'q-treat': { say: '沒有。同伴說是岔氣，叫我憋著氣跳兩下。我跳了一下，更痛。', clue: { text: '沒有就醫；被當成岔氣', kind: 'info' } },
    'q-severity': { say: '痛大概六分。喘……一句話要換一次氣。', clue: { text: '痛 6 分，一句話要換一次氣', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有什麼病。小時候沒有氣喘，平常也不咳。', clue: { text: '沒有慢性病，沒有氣喘或慢性咳嗽', kind: 'neg', tell: { form: 'airway', dir: -1 }, why: '氣道阻塞的人，以前就會喘、會咳。他平常完全沒有，就比較不像。' } },
    'q-family': { say: '我哥也是瘦高個，他有一年也這樣痛過，後來說是肺破了。', clue: { text: '哥哥有過氣胸', kind: 'info' } },
    'q-surgery': { say: '沒開過刀，胸口沒有撞到。兩年前右邊也這樣痛過一次，比較輕，大夫說肺上破了一個小洞，躺了幾天自己好了。', clue: { text: '兩年前右側發生過一次氣胸，自己好了', kind: 'pos', key: true, tell: { form: 'sudden', dir: 1 }, why: '以前同一邊就破過一次。氣胸會再發，有過一次的人，這一次要更先想到它。' } },
    'q-meds': { say: '沒有吃藥。沒有過敏。', clue: { text: '沒有用藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '抽菸，一天半包，五六年了。酒偶爾喝。', clue: { text: '抽菸五六年，一天半包', kind: 'info', key: true } },
    'q-work': { say: '修桅杆、整索具，整天爬高。最近沒有坐長途的船，也沒有潛水。身邊沒有人生病。', clue: { text: '沒有長途旅行或潛水', kind: 'info' } },
    'q-life': { say: '吃睡都正常。住在碼頭的通舖。', clue: { text: '飲食和睡眠正常', kind: 'info' } },
    'q-concern': { say: '我是不是不能再爬桅杆了？這是我唯一會的活。上次大夫叫我戒菸，我沒戒。', clue: { text: '怕不能再爬桅杆；上次被勸戒菸沒有戒', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒，體重沒變，一直都這麼瘦。聲音沒變。', clue: { text: '沒有發燒，體重沒有變', kind: 'neg' } },
    'q-ros-cp': { say: '沒有咳嗽，沒有痰，沒有咳血。就是心跳很快。', clue: { text: '沒有咳嗽或咳血；心悸', kind: 'neg' } },
    'q-ros-gi': { say: '都正常。', clue: { text: '腸胃和大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '手腳不麻。腳沒有腫，小腿不痛。', clue: { text: '腳不腫，小腿不痛', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '又高又瘦。坐著，身體往右邊縮，呼吸很淺。講一句話要換一次氣。嘴唇顏色還可以。', clue: { text: '瘦高、身體縮向右側、呼吸淺、說話要換氣', kind: 'pos', key: true } },
    'x-head': { say: '結膜不蒼白，嘴唇沒有發紫。脖子摸不到淋巴結，皮膚底下沒有摸到一粒一粒會響的氣。', clue: { text: '嘴唇沒有發紫，頸部沒有皮下氣腫', kind: 'neg' } },
    'x-jvp': { say: '沒有頸靜脈怒張。氣管在正中間。', clue: { text: '現在沒有頸靜脈怒張，氣管居中', kind: 'neg', key: true } },
    'x-chest-touch': { say: '右邊胸廓的起伏明顯比左邊小。手掌貼在背上請他說話，右邊幾乎感覺不到震動。按壓胸壁和肋骨不會引發一樣的痛。', clue: { text: '右側胸廓起伏變小，說話時的震動消失', kind: 'pos', key: true, tell: { form: 'sudden', dir: 1 }, why: '一邊不太動、震動也傳不過來，表示那一邊的肺和胸壁之間隔了東西。' } },
    'x-chest-listen': { say: '右邊敲起來特別響，像敲空的木桶。右邊的呼吸音幾乎聽不到。左邊正常。沒有喘鳴，沒有濕囉音。', clue: { text: '右側叩診過度反響、呼吸音幾乎消失；左側正常', kind: 'pos', key: true, tell: { form: 'sudden', dir: 1 }, why: '敲起來特別響、卻聽不到呼吸音：裡面是空氣，可是不是肺裡的空氣。肺炎是敲起來實；氣管變窄是兩邊都有喘鳴。' } },
    'x-heart': { say: '心跳快，規則。沒有雜音。', clue: { text: '心搏快而規則，沒有雜音', kind: 'neg' } },
    'x-botharms': { say: '右手 118/76 mmHg，左手 116/74 mmHg。兩邊脈搏一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟，沒有壓痛。', clue: { text: '腹部柔軟，沒有壓痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。指甲形狀正常。', clue: { text: '末梢溫暖，循環還好', kind: 'neg' } },
    'x-legs': { say: '兩邊小腿一樣粗，不腫，按了不痛。', clue: { text: '小腿不腫不痛', kind: 'neg', key: true } },
  },
  results: {
    't-cxr': { say: '右邊的肺往中間縮，肺的外緣看得到一條細細的線，線外面一整圈是黑的、沒有肺的紋路。氣管和心臟還在正中間。' + TEXT_RESULT, clue: { text: '胸部 X 光：右側肺塌陷，看得到肺的邊線；氣管和心臟沒有偏移', kind: 'pos', key: true, fog: 6, tell: { form: 'sudden', dir: 1 }, why: '看得到肺的邊線、外面一圈沒有紋路，就是氣胸。氣管和心臟還在中間，表示還沒有壓到另一邊；這一點要一直盯著。' } },
    't-ecg': { say: '竇性心搏過速，每分鐘 104 下。沒有 ST 段的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速，沒有 ST 變化', kind: 'neg' } },
    't-blood': { pending: '血已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-glucose': { say: '92 mg/dL。', clue: { text: '血糖 92 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'sudden', exclude: { cardiac: 2, infect: 2, airway: 1 } },
  summaries: [
    { id: 's-best', text: '24 歲瘦高男性，抽菸，兩年前右側氣胸過，一小時前休息時突然右胸刺痛合併喘；血氧 93%，右側呼吸音幾乎消失、叩診過度反響，氣管居中、血壓穩定。', score: 5, note: '有年齡、體型、危險因子、以前的發作、怎麼開始、最有力的發現，還有「目前還沒有壓迫」這一句。' },
    { id: 's-ok', text: '24 歲男性，一小時前突然右胸痛和喘。', score: 3, note: '起病的方式有了，但少了以前的氣胸、右側聽不到呼吸音和血氧。' },
    { id: 's-vague', text: '年輕男性胸口痛、有點喘，可能是岔氣。', score: 0, note: '「岔氣」不會讓血氧掉到 93%，也不會讓一邊的呼吸音不見。' },
    { id: 's-anchor', text: '24 歲男性胸痛、吸氣會痛，按胸壁不痛，是肋膜發炎，給止痛藥。', score: 0, note: '只抓住「吸氣會痛」。沒有比較兩邊的呼吸音，就會漏掉氣胸。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-ptx', text: '我的診斷是突發急症，擔心右側氣胸。血氧 93%、心跳快；目前氣管沒有偏、血壓還在，但可能變得很快。', score: 2, note: '說出你的判斷、現在的狀況，也說出你在防什麼。' },
      { id: 'a-unknown', text: '突然胸痛合併喘，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。右邊聽不到呼吸音這件事沒有報。' },
      { id: 'a-strain', text: '應該是岔氣或拉傷，想先給止痛藥讓他休息。', score: 0, note: '按胸壁不會痛，一邊的呼吸音不見，不是拉傷。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-cxr', text: '請同意馬上照胸部 X 光。', ok: true, orders: 't-cxr', note: '病人還穩定的時候，X 光用來確認氣胸和它有多大。' },
      { id: 'r-watch', text: '我先讓他坐著不要動、接上監測，盯著血壓、頸靜脈和氣管的位置，一有變化馬上叫您。需不需要給氧，請您指示。', ok: true, note: '說出你會盯哪三樣東西。這三樣一變，就不是等 X 光的時候了。' },
      { id: 'r-breathe', text: '請他起來走一走，做幾次深呼吸，把氣順開。', ok: false, note: '這是把氣胸當成岔氣處理。出力和用力吸氣都可能讓它變大。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '你右邊的肺可能又破了一個小洞，空氣跑到肺的外面，把肺壓扁了，所以會痛、會喘。我們要照 X 光確認。', ok: true, note: '用他聽得懂的話說出評估的結果和下一步，也接上他兩年前的經驗。' },
    { id: 'e-plan', text: '醫師馬上過來，看完片子再決定怎麼處理。現在坐著不要動，淺淺地呼吸就好，不要憋氣、不要出力。', ok: true, note: '說明接下來會發生什麼，以及他現在要配合的事。' },
    { id: 'e-warn', text: '如果突然更喘、覺得胸口被壓住、頭暈或眼前發黑，馬上跟我說，不要忍。', ok: true, note: '交代要注意的變化。這些是壓力升高的訊號。' },
    { id: 'e-concern', text: '你怕不能再爬桅杆。這一次先處理好；之後能不能爬高、要等多久，我會幫你問醫師。菸的事，等你不喘了，我們再找時間談，不是現在。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他最怕的事，也接住他自己提起的菸，但不在這個時候說教。' },
    { id: 'e-false', text: '年輕人岔氣而已，休息一下就好了。', ok: false, note: '沒有根據的保證。同伴就是這樣跟他說的。' },
    { id: 'e-jargon', text: '你是自發性氣胸復發，等一下要插胸管。', ok: false, note: '診斷還沒有確認，要怎麼處理也是醫師看完片子才決定的。' },
  ],

  // 下了診斷之後：兩分鐘內沒有人知道，他會變差；五分鐘還沒有，岑禾接手
  timeline: { worsenAfter: 120, stepInAfter: 300, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-cxr', within: 180, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['又是出診。這一位是一下子喘起來的。左邊和右邊，你要比著看、比著敲、比著聽。值班鐘我帶來了。'],
    watch: '岳楊坐著，一手按著右胸，小口小口地吸氣。',
    watchWorse: '岳楊脖子兩邊的血管鼓了起來，喉結看起來往左邊偏。他張著嘴，卻吸不進氣。',
    worsen: '……壓住了……吸不進來……',
    stepIn: '我先敲鐘了。你看他的脖子和氣管。這個樣子，不是等片子的時候。',
    called: '鐘響了，整個碼頭都聽得到。沈渡醫師馬上到，你繼續盯著他。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。片子馬上照，我過去看。氣管和頸靜脈你繼續盯著，一偏、一鼓就叫我，那時候不等片子。',
    reportWeak: '我聽不出你擔心什麼。兩邊的呼吸音一樣嗎？氣管在哪裡？下次先講這兩樣。我先看病人。',
    testRead: '右邊塌了，邊線很清楚，縱膈還在中間。我來處理。你做得對：先叫人，再照片子。',
    explainOk: '……好。我不動。',
    explainConcern: '……嗯。菸的事，我知道。等我能好好吸一口氣再說。',
    explainBad: '可是我跳了一下，更痛啊……',
    closing: '霧散了。風箱蛙的四盞燈都亮過了：水、氣、發炎，還有突然破掉的那一下。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。真實的情境裡，突然喘起來、一邊聽不到呼吸音的人，會先叫人、先接上監測。提早敲鐘不扣分。',
      '「突發急症」這一盞底下有兩個病。小腿不腫不痛、沒有久臥或長途旅行，讓肺栓塞比較不像；一邊聽不到呼吸音、敲起來特別響，指向氣胸。',
      '戒菸很重要，他自己也知道。等他能好好呼吸的時候再談，他才聽得進去。',
    ],
    teaching: [
      { text: '抽菸會增加自發性氣胸的風險；有過一次氣胸的人，也比較容易再發。', ref: 'macduff2010' },
      { text: '氣胸如果開始壓迫（越來越喘、血壓掉、頸靜脈怒張、氣管偏到另一邊），是要馬上處理的急症，不等 X 光。', ref: 'macduff2010' },
    ],
    references: [MACDUFF_2010],
  },
};
