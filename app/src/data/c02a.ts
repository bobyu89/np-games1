// 病例 C02A：駱松，喘，診斷是心因性（心衰竭惡化）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：慢慢變喘的人，用病史和身體評估分出「水積在肺裡」和「氣吐不出去」。
import type { CaseSpec } from '../core/module.ts';
import { HEIDENREICH_2022, REVIEW_NOTE, TEXT_RESULT, WANG_2005 } from './shared.ts';

export const C02A: CaseSpec = {
  format: 3,
  id: 'c02a',
  complaint: 'dyspnea',
  kind: '示範',
  title: '躺不平的夜',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '駱松', age: 70, sex: '男', job: '退休的老船長', look: 'song', pronoun: '他' },
  reading: {
    lines: ['駱松，70 歲，退休的老船長。', '這兩個禮拜越來越喘。昨天夜裡喘到坐在床邊等天亮，今天早上孫子陪他走來公會。', '他走進來的路上停了兩次。坐著可以講完整的句子，腳踝腫得鞋子只穿得進一半。'],
    prompts: ['最危險的可能是什麼？', '「慢慢變喘」和「突然很喘」，要想的病有什麼不一樣？', '我要怎麼分辨這個喘是心臟來的，還是肺來的？'],
  },
  vitals: {
    base: { bp: '158/94', hr: 102, rr: 24, spo2: 92, bt: 36.5 },
    clue: { text: '血壓高、心跳快、呼吸快，血氧 92%', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（駱松坐在床邊，背後墊著兩個枕頭。他孫子站在簾子旁邊。）' },
    'q-intro': { say: '駱松。大暑那天生的，今年剛好七十。' },
    'q-explain': { say: '好，你慢慢問。我講話要換氣，你別急。' },
    // 主訴
    'q-cc': { say: '喘。這幾天越來越喘，吸不飽。', clue: { text: '主訴：越來越喘', kind: 'pos' } },
    'q-onset': { say: '大概兩個禮拜前開始的，一天比一天喘一點。昨天晚上最厲害。', clue: { text: '兩個禮拜來慢慢變喘，昨晚最嚴重', kind: 'pos', key: true, tell: { form: 'sudden', dir: -1 }, why: '氣胸和肺栓塞是一下子就喘起來。花了兩個禮拜慢慢變喘，就比較不像。' } },
    'q-location': { say: '以前可以從港口走回家，現在走到巷口就要停。爬樓梯更不行。坐著不動還好。', clue: { text: '走到巷口就喘，坐著不動還好', kind: 'pos' } },
    'q-duration': { say: '白天是動了才喘。到了晚上，躺下去就開始。', clue: { text: '白天活動才喘，晚上躺下就喘', kind: 'pos' } },
    'q-character': { say: '像胸口泡在水裡，吸不飽。不是吐不出去的那種。', clue: { text: '吸不飽，不是吐不出去', kind: 'pos' } },
    'q-assoc': { say: '兩隻腳腫起來，鞋子穿不下。這兩個禮拜褲頭變緊，重了三四公斤。會咳，咳出來是白色的泡泡。沒有發燒，胸口不痛。', clue: { text: '兩腳水腫、兩週重了三四公斤、白色泡沫痰', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '腳腫、體重在幾天裡多了好幾公斤，是水排不出去。心臟打不動的時候，水會先積在腳和肺。' } },
    'q-factors': { say: '躺平最喘，出力也喘。坐起來、把腳放下去，會好一點。', clue: { text: '躺平和出力會加重，坐起來緩解', kind: 'pos' } },
    'q-radiate': { say: '現在要墊三個枕頭才睡得著。昨天睡到半夜突然喘醒，坐在床邊十幾分鐘才緩下來。', clue: { text: '要墊三個枕頭；夜裡喘醒，坐起來才緩解', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '躺平就喘、睡到一半喘醒要坐起來，是心臟來的喘很有力的線索。' } },
    'q-treat': { say: '沒有。想說年紀大了，本來就會喘。', clue: { text: '沒有就醫，以為是年紀大', kind: 'info' } },
    'q-severity': { say: '現在坐著大概四分，可以把話講完。昨天半夜有八分。', clue: { text: '現在 4 分，可以說完整的句子', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '血壓高二十年了。三年前大夫說我的心臟變大、沒力，給了我消水腫的藥。這半年沒有回去看。', clue: { text: '高血壓二十年；三年前診斷心衰竭，半年沒有回診', kind: 'info', key: true, tell: { form: 'cardiac', dir: 1 }, why: '以前就有心衰竭，是病史裡最有用的一條線索。' } },
    'q-family': { say: '我爸六十幾歲走的，那時候也是腳腫、喘。', clue: { text: '父親六十多歲時也有腳腫和喘', kind: 'info' } },
    'q-surgery': { say: '沒開過刀。最近沒有跌倒，也沒有躺著不動。', clue: { text: '沒有手術、外傷或久臥不動', kind: 'neg' } },
    'q-meds': { say: '血壓藥有吃。消水腫的那一顆，十天前去參加老船員的聚會，嫌一直跑茅房，就停了，到現在沒吃。沒有過敏。', clue: { text: '利尿的藥停了十天', kind: 'info', key: true } },
    'q-habits': { say: '我不抽菸，一輩子沒抽過。酒以前喝，現在不喝了。', clue: { text: '從來不抽菸', kind: 'neg', tell: { form: 'airway', dir: -1 }, why: '沒有抽菸、也沒有長年的咳嗽和痰，慢性阻塞性肺病就比較不像。' } },
    'q-work': { say: '跑了四十年的船，退下來五年了。最近沒有出遠門，身邊沒有人感冒。', clue: { text: '退休船長；沒有旅遊或接觸史', kind: 'info' } },
    'q-life': { say: '聚會那幾天吃了很多醃魚和鹹菜，回來也一直吃。晚上喘，睡不好。跟兒子一家住。', clue: { text: '這十天吃了很多醃漬的東西', kind: 'info', key: true } },
    'q-concern': { say: '下個月我孫子第一次出海，我答應要到碼頭送他。我這樣……還走得到碼頭嗎？', clue: { text: '想到碼頭送孫子第一次出海', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '沒有發燒，不會發冷，晚上也不會盜汗。就是很累。聲音沒變。', clue: { text: '沒有發燒、畏寒或盜汗', kind: 'neg', tell: { form: 'infect', dir: -1 }, why: '肺炎多半會發燒、發冷，痰是黃的。這些都沒有，就比較不像。' } },
    'q-ros-cp': { say: '咳白色泡泡的痰，沒有血。心有時候會亂跳一下。', clue: { text: '白色泡沫痰，沒有咳血；偶爾心悸', kind: 'pos' } },
    'q-ros-gi': { say: '肚子脹脹的，吃一點就飽。小便這幾天變少。大便正常。', clue: { text: '腹脹、容易飽、尿量變少', kind: 'pos' } },
    'q-ros-limb': { say: '兩隻腳都腫，一樣腫。小腿不會痛。手腳不麻。', clue: { text: '兩腳一樣腫，小腿不痛', kind: 'pos' } },
  },
  findings: {
    'x-look': { say: '坐著，背後要墊高。嘴唇顏色正常。講完一個長句子要停下來換氣。', clue: { text: '要坐高，講長句子要換氣', kind: 'pos', key: true } },
    'x-head': { say: '結膜不蒼白，嘴唇沒有發紫。脖子和鎖骨上方摸不到腫大的淋巴結。', clue: { text: '結膜不蒼白，沒有摸到淋巴結', kind: 'neg' } },
    'x-jvp': { say: '床頭抬高四十五度，頸靜脈還是鼓到下巴的一半。氣管在正中間。', clue: { text: '頸靜脈明顯怒張，氣管居中', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '坐高了頸靜脈還是鼓著，表示血回不去心臟、塞在前面。' } },
    'x-chest-touch': { say: '胸廓外形正常，兩邊起伏對稱。按壓不痛。', clue: { text: '胸廓正常，起伏對稱', kind: 'neg' } },
    'x-chest-listen': { say: '兩邊下面三分之一，吸氣快結束的時候有細細碎碎的濕囉音。沒有喘鳴，吐氣沒有拉長。', clue: { text: '兩側下肺濕囉音；沒有喘鳴', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '兩邊下面對稱的濕囉音，是水積在肺的底部。氣管變窄的話，聽到的會是喘鳴和拉長的吐氣。' } },
    'x-heart': { say: '心跳偏快，大致規則。心尖的位置往左下偏。除了平常的兩個心音，還多一個低低的第三心音。', clue: { text: '心尖聽到第三心音，心尖往左下偏', kind: 'pos', key: true, tell: { form: 'cardiac', dir: 1 }, why: '第三心音是心衰竭最有力的身體評估發現之一：聽到了，可能性就高很多。' } },
    'x-botharms': { say: '右手 158/94 mmHg，左手 156/92 mmHg。兩邊脈搏一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部稍微鼓。右邊肋骨下面摸得到肝臟的邊緣，壓下去他說脹。', clue: { text: '肝臟腫大，有壓脹感', kind: 'pos' } },
    'x-perfusion': { say: '手腳摸起來偏涼，微血管回填約 2 秒。指甲的形狀正常。', clue: { text: '手腳偏涼，微血管回填約 2 秒', kind: 'pos' } },
    'x-legs': { say: '兩腳從腳背腫到小腿一半，按下去一個凹洞，好幾秒才彈回來。兩邊一樣，小腿不紅不痛。', clue: { text: '兩腳對稱的凹陷性水腫到小腿一半', kind: 'pos', key: true } },
  },
  results: {
    't-cxr': { say: '心臟的影子變大。兩邊肺門的血管變粗，往上肺野擴張；兩邊肋膜角變鈍。沒有氣胸，沒有一塊一塊的實質化。' + TEXT_RESULT, clue: { text: '胸部 X 光：心臟變大、肺血管鬱血、兩側少量肋膜積液', kind: 'pos', key: true, fog: 5, tell: { form: 'cardiac', dir: 1 }, why: 'X 光看到肺的血管鬱血，是心衰竭很有力的證據。同一張片子也告訴你：沒有氣胸，沒有肺炎的陰影。' } },
    't-ecg': { say: '竇性心律，每分鐘 102 下。左心室肥大的電壓變化，沒有急性的 ST 段變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速、左心室肥大，沒有急性 ST 變化', kind: 'pos' } },
    't-blood': { pending: '血已經抽好送出（含 BNP），結果要等一段時間，這一關裡等不到。' },
    't-glucose': { say: '124 mg/dL。', clue: { text: '血糖 124 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'cardiac', exclude: { airway: 2, infect: 2, sudden: 1 } },
  summaries: [
    { id: 's-best', text: '70 歲男性，有高血壓和心衰竭病史，停了十天的利尿劑，兩週來漸進性的喘，合併端坐呼吸、夜間喘醒和雙下肢水腫；血氧 92%，可以說完整的句子。', score: 5, note: '有年齡、病史、誘因、病程、最有力的幾個症狀和目前的穩定程度。' },
    { id: 's-ok', text: '70 歲男性，喘了兩個禮拜，腳會腫。', score: 3, note: '病程有了，但少了心衰竭病史、停藥，還有躺平會喘、夜裡喘醒這幾個關鍵。' },
    { id: 's-vague', text: '老先生呼吸喘，原因待查。', score: 0, note: '太模糊。聽的人分不出要多快處理、往哪個方向想。' },
    { id: 's-anchor', text: '70 歲男性喘、有咳嗽有痰，年紀大了抵抗力差，應該是感冒轉成肺炎。', score: 0, note: '沒有發燒，痰是白色泡沫，兩腳水腫。只抓住「咳嗽有痰」，就會漏掉心臟。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-hf', text: '我的診斷是心因性的喘，心衰竭惡化。目前還算穩定，但今天要處理。', score: 2, note: '說出你的判斷，也說出有多急。' },
      { id: 'a-unknown', text: '喘的原因還不清楚，生命徵象還可以。', score: 1, note: '沒有說出你擔心什麼。血氧 92%、夜裡喘醒，也不算「還可以」。' },
      { id: 'a-cold', text: '應該是年紀大又著涼，想先給止咳藥觀察。', score: 0, note: '夜裡喘醒、頸靜脈怒張、第三心音，都不是著涼會有的。' },
    ],
    requests: [
      { id: 'r-cxr', text: '請同意照胸部 X 光、做心電圖，並抽血驗 BNP。', ok: true, orders: 't-cxr', note: '喘的病人，X 光和心電圖是基本的檢查；還不確定的時候 BNP 可以幫忙。' },
      { id: 'r-see', text: '請您今天過來看病人，評估要不要用利尿劑。', ok: true, note: '明確說出要對方做什麼。用藥由醫師決定。' },
      { id: 'r-sit', text: '我先讓他坐高、接上血氧監測，記錄體重和尿量。', ok: true, note: '說出你自己接下來會做什麼。體重和尿量是之後判斷有沒有改善的依據。' },
      { id: 'r-fluid', text: '他看起來很虛，想先幫他吊一瓶點滴補充水分。', ok: false, note: '已經有水腫和肺部濕囉音的人，再灌水會更喘。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的喘看起來和心臟有關：心臟打水的力氣不夠，水積在肺和腳。我們要照 X 光、抽血來確認。', ok: true, note: '用病人聽得懂的話說出評估的結果和下一步，沒有把話說死。' },
    { id: 'e-plan', text: '醫師今天會過來看，可能會用藥把多出來的水排掉。現在先坐高一點，比較好呼吸。', ok: true, note: '說明接下來會發生什麼，以及他現在可以怎麼做。' },
    { id: 'e-warn', text: '如果喘到講不出話、胸口痛、冒冷汗，或是咳出粉紅色的泡沫，馬上跟我說。', ok: true, note: '交代什麼情況要馬上說。' },
    { id: 'e-concern', text: '您想到碼頭送孫子第一次出海。先把這幾天積的水排掉、把藥調好；到時候能不能去，我會幫您問醫師，一起想辦法。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他最在意的事，沒有亂保證，也沒有說不行。' },
    { id: 'e-false', text: '年紀大了本來就會喘，回去多休息就好。', ok: false, note: '把可以治療的病說成老化。他就是這樣想，才拖了兩個禮拜。' },
    { id: 'e-jargon', text: '您是鬱血性心衰竭急性惡化，要打利尿劑。', ok: false, note: '用了病人聽不懂的詞，而且診斷和用藥要由醫師確認之後才說。' },
  ],

  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-cxr', within: 300, points: 3 }, { type: 'exclude', forms: ['airway', 'infect', 'sudden'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['新的主訴，流程是一樣的。四個可能的診斷換了，你一個一個認。'],
    watch: '駱松靠著枕頭坐著，每講幾個字就吸一口氣。',
    called: '鐘響了，沈渡醫師會過來。不過你想一想：這位病人，等不了嗎？',
    doctorArrives: '我來了。他坐著講話還行，是什麼事等不了？',
    reportGood: '收到。先照片子、抽血，我看完過去。停藥和醃魚那一段問得好，那就是這一次的原因。',
    reportWeak: '我聽不出你的判斷。先說你認為是哪裡來的喘、有多急，再說要我做什麼。',
    explainOk: '原來是水……好，我聽你們的。',
    explainConcern: '……好。那我這幾天乖乖吃藥。碼頭那一趟，我想自己走過去。',
    explainBad: '是嗎……那我回去再躺幾天看看。',
    closing: '霧散了。氣促蛙的第一盞燈亮了。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這位病人坐著還能說完整的句子，不用敲值班鐘；但今天一定要回報、要處理，不能讓他回去再等。',
      '胸部 X 光可以自己先提出，也可以在回報的時候一起請醫師同意。',
      '問出「為什麼是現在變喘」和診斷一樣重要：停藥和吃得太鹹，是之後衛教的重點。',
    ],
    teaching: [
      { text: '喘的病人如果以前就有心衰竭、會夜裡喘醒、聽得到第三心音、X 光看到肺靜脈鬱血，心衰竭的可能性都會明顯變高。', ref: 'wang2005' },
      { text: '照過 X 光、做過心電圖還是不確定的時候，BNP 很低可以幫忙排除心衰竭。', ref: 'wang2005' },
      { text: '心衰竭惡化的病人，要評估鬱血的程度，也要找出這一次的誘因，例如沒有按時吃藥、鹽吃太多。', ref: 'heidenreich2022' },
    ],
    references: [WANG_2005, HEIDENREICH_2022],
  },
};
