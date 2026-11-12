// 病例 C02C：柯蒲，喘，真身是肺部感染（社區型肺炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：發燒加上「只有一邊」的發現。兩邊對稱的是水或氣，只有一邊的要想感染。
import type { CaseSpec } from '../core/module.ts';
import { METLAY_2019, REVIEW_NOTE, TEXT_RESULT, WANG_2005 } from './shared.ts';

export const C02C: CaseSpec = {
  format: 3,
  id: 'c02c',
  complaint: 'dyspnea',
  kind: '變體',
  title: '啞掉的拍賣聲',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '柯蒲', age: 52, sex: '男', job: '漁市的拍賣人', look: 'pu', pronoun: '他' },
  scene: 'ward-rain',
  reading: {
    lines: ['柯蒲，52 歲，漁市的拍賣人。', '四天前開始發燒、咳嗽，以為是著涼。前天起走幾步就喘，今天早上喊價喊到一半喘不上來，被同行架來公會。', '他裹著外套，臉是紅的，呼吸又快又淺，講話可以成句，但中間要停下來咳。'],
    prompts: ['最危險的可能是什麼？', '發燒的喘，和不發燒的喘，要想的病差在哪裡？', '身體評估的時候，我要特別比較什麼？'],
  },
  vitals: {
    base: { bp: '112/70', hr: 112, rr: 26, spo2: 91, bt: 39.1 },
    clue: { text: '發燒 39.1 度、心跳快、呼吸快，血氧 91%', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（柯蒲裹著外套坐在床邊，側過頭去咳了一陣。）' },
    'q-intro': { say: '柯蒲。寒露生的，五十二。' },
    'q-explain': { say: '好。我嗓子啞了，你聽得清楚嗎？' },
    // 主訴
    'q-cc': { say: '喘，而且一直咳。燒了好幾天。', clue: { text: '主訴：喘、咳嗽、發燒', kind: 'pos' } },
    'q-onset': { say: '四天前先是發燒、咳嗽。前天開始喘，一天比一天喘。', clue: { text: '四天前發燒咳嗽，前天開始喘，逐日加重', kind: 'pos', key: true, tell: { form: 'sudden', dir: -1 }, why: '氣胸和肺栓塞是一下子就喘起來。先燒、再咳、幾天後才喘，就比較不像。' } },
    'q-location': { say: '走到巷口就要停。坐著不動還好，可是一咳就喘。', clue: { text: '走一小段就喘，咳嗽會引發喘', kind: 'pos' } },
    'q-duration': { say: '這兩天都在喘。發燒的時候最厲害。', clue: { text: '兩天來持續地喘，發燒時更喘', kind: 'pos' } },
    'q-character': { say: '吸到一半，右邊胸口就刺一下，不敢吸深。不是氣吐不出去。', clue: { text: '吸氣時右胸刺痛，不敢吸深', kind: 'pos', key: true } },
    'q-assoc': { say: '燒到會發抖。痰很濃，黃綠色，昨天有一口帶鐵鏽色。全身痠痛，吃不下。腳沒有腫。', clue: { text: '高燒寒顫、黃綠色濃痰帶鐵鏽色、全身痠痛', kind: 'pos', key: true, tell: { form: 'infect', dir: 1 }, why: '燒到發抖、痰又濃又有顏色，是感染的樣子。心臟來的喘，痰是白色的泡沫，通常不發燒。' } },
    'q-factors': { say: '深呼吸和咳嗽的時候右邊會痛。吃了退燒的藥水，燒退一下又起來。', clue: { text: '深呼吸和咳嗽時右胸痛；退燒後又燒', kind: 'pos' } },
    'q-radiate': { say: '可以躺平，不用墊高。夜裡是咳醒、燒醒的，不是喘到要坐起來。', clue: { text: '可以平躺，夜裡沒有喘醒', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '不用墊高枕頭、不會夜裡喘醒要坐起來，心衰竭就比較不像。' } },
    'q-treat': { say: '藥舖的退燒藥水喝了三天，還有止咳的。都沒有斷根。', clue: { text: '自己喝退燒和止咳藥水三天，沒有改善', kind: 'info' } },
    'q-severity': { say: '現在六分。發燒的時候到八分。', clue: { text: '喘 6 分，發燒時 8 分', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '大夫說我血糖偏高，要我少吃甜的，沒有吃藥。別的沒有。', clue: { text: '血糖偏高，沒有治療', kind: 'info' } },
    'q-family': { say: '沒有特別的。', clue: { text: '家族史沒有特別的', kind: 'info' } },
    'q-surgery': { say: '沒開過刀。最近沒有受傷，也沒有躺著不動，這幾天還硬撐著去喊價。', clue: { text: '沒有手術、外傷或久臥不動', kind: 'neg' } },
    'q-meds': { say: '就那些藥水。沒有對什麼過敏。', clue: { text: '沒有固定用藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '不抽菸，嗓子是吃飯的傢伙。酒偶爾喝。平常也不咳。', clue: { text: '不抽菸，平常沒有慢性咳嗽', kind: 'neg', tell: { form: 'airway', dir: -1 }, why: '沒有抽菸、平常也不咳不喘，慢性阻塞性肺病就比較不像。' } },
    'q-work': { say: '在漁市喊價，天沒亮就站在濕冷的棚子底下。這兩個禮拜，市場裡好幾個人在發燒咳嗽。', clue: { text: '漁市這兩週有好幾個人發燒咳嗽', kind: 'info', key: true } },
    'q-life': { say: '這幾天吃不下，水也喝得少。晚上咳到沒辦法睡。跟老婆孩子住。', clue: { text: '進食和喝水都變少，睡不好', kind: 'info' } },
    'q-concern': { say: '後天是漁市一年一次的大拍賣，我是主拍。嗓子啞了、人倒了，一整年就白忙了。', clue: { text: '後天要主持一年一次的大拍賣', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '發燒、發冷、全身痠，沒有力氣。體重沒注意。聲音是喊啞加上咳啞的。', clue: { text: '發燒畏寒、全身痠痛、沒有力氣', kind: 'pos' } },
    'q-ros-cp': { say: '咳黃綠色的濃痰，有一口帶鐵鏽色，沒有整口的血。心跳很快。', clue: { text: '濃痰帶鐵鏽色，沒有大量咳血', kind: 'pos' } },
    'q-ros-gi': { say: '沒胃口，有點想吐。小便變少，顏色很深。', clue: { text: '食慾差、尿量變少、尿色深', kind: 'pos' } },
    'q-ros-limb': { say: '手腳痠，但是不麻。腳沒有腫，小腿不痛。', clue: { text: '腳不腫，小腿不痛', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '臉潮紅，額頭是燙的，呼吸又快又淺。可以講完整的句子，但常常被咳嗽打斷。咳的時候一手按著右邊的肋骨。', clue: { text: '臉潮紅、呼吸淺快，咳嗽時按著右胸', kind: 'pos', key: true } },
    'x-head': { say: '結膜不蒼白。嘴唇乾，沒有發紫。喉嚨有點紅。脖子摸到幾顆小小的、會痛的淋巴結。', clue: { text: '嘴唇乾；頸部有小而會痛的淋巴結', kind: 'pos' } },
    'x-jvp': { say: '沒有頸靜脈怒張。氣管在正中間。', clue: { text: '沒有頸靜脈怒張，氣管居中', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '頸靜脈沒有鼓起來，心衰竭就比較不像。氣管在正中間，也沒有被哪一邊推過去。' } },
    'x-chest-touch': { say: '右邊下面的起伏比左邊小。手掌貼在背上請他說話，右下的震動比左邊強。按壓胸壁不會引發一樣的痛。', clue: { text: '右下胸起伏較小，說話時的震動變強', kind: 'pos', key: true, tell: { form: 'infect', dir: 1 }, why: '只有一塊地方震動變強，表示那裡的肺從裝空氣變成裝了實心的東西，聲音傳得更好。' } },
    'x-chest-listen': { say: '右邊下面敲起來是實的。那裡聽到像對著管子吹氣的呼吸音，吸氣快結束的時候有濕囉音。左邊和右邊上面都清楚。沒有喘鳴。', clue: { text: '右下肺叩診實音、支氣管呼吸音、濕囉音；左側正常', kind: 'pos', key: true, tell: { form: 'infect', dir: 1 }, why: '只有一邊、只有一塊：敲起來實、聽到濕囉音。水積在肺裡是兩邊對稱，氣管變窄是整片喘鳴。只有一邊的，要先想感染。' } },
    'x-heart': { say: '心跳很快，規則。沒有雜音，沒有多出來的心音。', clue: { text: '心搏快而規則，沒有第三心音', kind: 'neg' } },
    'x-botharms': { say: '右手 112/70 mmHg，左手 110/68 mmHg。兩邊脈搏一樣，很快。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟，沒有壓痛。', clue: { text: '腹部柔軟，沒有壓痛', kind: 'neg' } },
    'x-perfusion': { say: '手腳是熱的，皮膚乾。微血管回填約 2 秒。指甲形狀正常。', clue: { text: '手腳發熱、皮膚乾', kind: 'pos' } },
    'x-legs': { say: '兩腳沒有水腫。小腿一樣粗，不紅不痛。', clue: { text: '兩腳沒有水腫，小腿不腫不痛', kind: 'neg' } },
  },
  results: {
    't-cxr': { say: '右下肺野有一整片白色的陰影，裡面看得到一條一條黑色的支氣管。左邊清楚。心臟不大，沒有氣胸。' + TEXT_RESULT, clue: { text: '胸部 X 光：右下肺野實質化陰影；心臟不大，沒有氣胸', kind: 'pos', key: true, fog: 6, tell: { form: 'infect', dir: 1 }, why: '有發燒、咳痰這些症狀，影像上又看到一塊浸潤，肺炎的診斷才算站得住。同一張片子也說：心臟不大，沒有氣胸。' } },
    't-ecg': { say: '竇性心搏過速，每分鐘 112 下。沒有 ST 段的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速，沒有 ST 變化', kind: 'neg' } },
    't-blood': { pending: '血已經抽好送出（含血球、腎功能和血液培養），結果要等一段時間，這一關裡等不到。' },
    't-glucose': { say: '186 mg/dL。', clue: { text: '血糖 186 mg/dL', kind: 'pos' } },
  },

  answer: { truth: 'infect', exclude: { cardiac: 2, airway: 2, sudden: 1 } },
  summaries: [
    { id: 's-best', text: '52 歲男性，四天前起發燒、咳黃綠色濃痰，前天開始喘，吸氣時右胸刺痛；體溫 39.1 度、呼吸每分鐘 26 次、血氧 91%，右下肺有實音和濕囉音。', score: 5, note: '有年齡、病程的順序、痰的樣子、生命徵象和只在一邊的發現。聽的人知道是感染，也知道有多嚴重。' },
    { id: 's-ok', text: '52 歲男性，發燒咳嗽四天，這兩天會喘。', score: 3, note: '方向有了，但少了血氧 91%、呼吸 26 次和右下肺的發現，聽不出嚴重度。' },
    { id: 's-vague', text: '中年男性感冒好幾天沒好，有點喘。', score: 0, note: '把它說成感冒，聽的人不會急。血氧 91% 的人不是感冒。' },
    { id: 's-anchor', text: '52 歲男性喘、心跳每分鐘 112 下，應該是心臟的問題。', score: 0, note: '心跳快是因為發燒和缺氧。可以平躺、頸靜脈不鼓、腳不腫，心臟的線索並不支持。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-pna', text: '我的診斷是肺部感染，擔心右下肺的肺炎。高燒、呼吸快、血氧 91%，還能講完整的句子，血壓穩定。', score: 2, note: '說出你的判斷，也把判斷嚴重度要用的數字報出來。' },
      { id: 'a-unknown', text: '發燒合併喘，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。血氧也沒有報。' },
      { id: 'a-cold', text: '應該是重感冒，想先給退燒藥和止咳藥讓他回去。', score: 0, note: '血氧 91%、呼吸每分鐘 26 次、右下肺有實音，不能當成感冒放回去。' },
    ],
    requests: [
      { id: 'r-cxr', text: '請同意照胸部 X 光，並抽血（血球、腎功能、血液培養）。', ok: true, orders: 't-cxr', note: '肺炎要有影像才算確認。抽血的結果會用來判斷嚴重度。' },
      { id: 'r-see', text: '請您今天過來評估嚴重度，決定要不要住院、用什麼藥。', ok: true, note: '明確說出要對方做什麼。去哪裡治療、用什麼藥，由醫師決定。' },
      { id: 'r-watch', text: '我先接上血氧監測、讓他坐高、補充水分，記錄體溫和呼吸次數。需不需要給氧，請您指示。', ok: true, note: '說出你自己接下來會做什麼，也把需要醫囑的事問清楚。' },
      { id: 'r-home', text: '先給退燒藥和止咳藥水，請他燒不退再回來。', ok: false, note: '這是延遲。他已經自己喝了三天藥水，而且血氧只有 91%。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您右邊的肺看起來在發炎，所以會發燒、會喘，吸氣的時候會痛。我們要照 X 光、抽血來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '醫師今天會過來看，再決定需不需要住院、用什麼藥。現在先坐高一點，慢慢喝水。', ok: true, note: '說明接下來會發生什麼，以及他現在可以怎麼做。' },
    { id: 'e-warn', text: '如果更喘、嘴唇發紫、人變得昏昏的，或是胸口痛得更厲害，馬上跟我說。', ok: true, note: '交代什麼情況要馬上說。' },
    { id: 'e-concern', text: '後天的大拍賣對您很重要。能不能上場，要看這兩天燒退不退、喘不喘；我會把這件事跟醫師說，請他幫您一起想。要不要先找一位同行備著？', ok: true, concern: true, needsClue: 'c-concern', note: '回應他最在意的事。沒有說可以，也沒有說不行，而是把它放進計畫裡。' },
    { id: 'e-false', text: '就是感冒拖久了，多喝水、睡一覺就好。', ok: false, note: '沒有根據的保證。他可能真的回去硬撐到後天。' },
    { id: 'e-leftover', text: '我這裡有上一位病人沒吃完的消炎藥，您先拿回去吃。', ok: false, note: '不可以把別人的藥給他。要不要用抗生素、用哪一種，由醫師評估後決定。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-cxr', within: 300, points: 3 }, { type: 'exclude', forms: ['cardiac', 'airway', 'sudden'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一位在發燒。聽診的時候，左邊和右邊要比著聽：一樣不一樣，比聽到什麼更重要。'],
    watch: '柯蒲裹著外套，呼吸又淺又快，隔一下就咳一陣。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。他講話還成句，血壓也在，是什麼事等不了？',
    reportGood: '收到。先照片子、抽血，接上血氧。呼吸次數和血氧你都報了，我好判斷。我看完片子過去。',
    reportWeak: '我聽不出嚴重度。體溫、呼吸次數、血氧各是多少？你覺得是哪裡的問題？',
    explainOk: '好……原來是肺。我以為只是著涼。',
    explainConcern: '……你說得對，我先找老陳備著。能上就上，不能上，至少場子不會開天窗。',
    explainBad: '那我回去多喝點水，後天照樣上場。',
    closing: '霧散了。風箱蛙的第三盞燈亮了：這一次只鼓了一邊。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這位病人還能講完整的句子、血壓穩定，不用敲值班鐘；但血氧 91%，今天一定要回報，不能讓他回去。',
      '胸部 X 光可以自己先提出，也可以在回報的時候一起請醫師同意。',
      '漁市裡好幾個人在發燒咳嗽，這件事也值得跟公會說一聲：可能不只他一個。',
    ],
    teaching: [
      { text: '社區型肺炎的診斷，要有症狀，也要在胸部影像上看到浸潤。', ref: 'metlay2019' },
      { text: '確定是肺炎之後，下一步是判斷嚴重度、決定在哪裡治療：用經過驗證的評估工具，再加上臨床判斷。', ref: 'metlay2019' },
      { text: '喘的病人如果 X 光上心臟不大，心衰竭的可能性會變低。', ref: 'wang2005' },
    ],
    references: [METLAY_2019, WANG_2005],
  },
};
