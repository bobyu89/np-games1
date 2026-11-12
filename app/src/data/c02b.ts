// 病例 C02B：霍樟，喘，真身是氣道阻塞（慢性阻塞性肺病急性惡化）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 這一關要練的是：同樣是喘，「吐不出去」和「吸不飽」不一樣；還有，氧氣不是給越多越好。
import type { CaseSpec } from '../core/module.ts';
import { AUSTIN_2010, REVIEW_NOTE, TEXT_RESULT, WANG_2005 } from './shared.ts';

export const C02B: CaseSpec = {
  format: 3,
  id: 'c02b',
  complaint: 'dyspnea',
  kind: '變體',
  title: '吐不出去的氣',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '霍樟', age: 66, sex: '男', job: '燻魚坊的師傅', look: 'zhang', pronoun: '他' },
  reading: {
    lines: ['霍樟，66 歲，燻魚坊的師傅。', '平常走快一點就喘。三天前著涼之後越來越喘，今天從坊裡走到門口都要停下來，徒弟用板車把他推來公會。', '他坐著，身體往前傾，兩手撐在膝蓋上，噘著嘴吐氣。一句話要分三次講。'],
    prompts: ['最危險的可能是什麼？', '「吸不飽」和「吐不出去」，問題出在不一樣的地方。各是哪裡？', '這位病人需要氧氣。要給多少？'],
  },
  vitals: {
    base: { bp: '146/86', hr: 112, rr: 28, spo2: 86, bt: 37.6 },
    worse: { bp: '152/90', hr: 126, rr: 34, spo2: 82, bt: 37.6 },
    clue: { text: '心跳快、呼吸快、血氧 86%，微燒', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（霍樟撐著膝蓋，抬眼看了你一下，又低頭專心吐氣。）' },
    'q-intro': { say: '霍樟……白露生的……六十六。' },
    'q-explain': { say: '好……你問短一點。' },
    // 主訴
    'q-cc': { say: '喘……氣吐不出去。', clue: { text: '主訴：喘，氣吐不出去', kind: 'pos' } },
    'q-onset': { say: '平常走快就會喘，好幾年了。三天前著涼，之後一天比一天喘。', clue: { text: '長年活動會喘；三天前著涼後明顯變喘', kind: 'pos', key: true, tell: { form: 'airway', dir: 1 }, why: '本來就有長年的喘，感冒之後幾天內變嚴重，是慢性阻塞性肺病急性惡化典型的樣子。' } },
    'q-location': { say: '現在坐著不動也喘。昨天還走得到門口，今天走三步就要停。', clue: { text: '坐著不動也喘，走三步要停', kind: 'pos', key: true } },
    'q-duration': { say: '這三天都在喘，沒有哪一段是好的。', clue: { text: '三天來持續地喘', kind: 'pos' } },
    'q-character': { say: '吸得進去，可是吐不出來。胸口像被桶箍箍住。', clue: { text: '吸得進、吐不出，胸口像被箍住', kind: 'pos', key: true, tell: { form: 'airway', dir: 1 }, why: '吐不出去、胸口被箍住，是氣管變窄的感覺。水積在肺裡的喘，比較像吸不飽。' } },
    'q-assoc': { say: '咳得比平常多。痰從白的變成黃綠色，量也變多。有一點燒。腳沒有腫，胸口不痛。', clue: { text: '咳嗽變多、痰變黃綠而且變多、微燒', kind: 'pos', key: true, tell: { form: 'airway', dir: 1 }, alsoOk: [{ form: 'infect', dir: 1 }], why: '更喘、痰變多、痰變膿，是慢性阻塞性肺病急性惡化的三個主要症狀。肺炎也會這樣，所以要照 X 光。' } },
    'q-factors': { say: '一動就更喘。往前趴著、噘嘴慢慢吐，會好一點。吸那支藥只好一下子。', clue: { text: '活動加重；前傾、噘嘴吐氣稍微緩解', kind: 'pos' } },
    'q-radiate': { say: '躺著、坐著差不多，不用特別墊高。夜裡是咳醒的，不是喘醒的。', clue: { text: '可以平躺，夜裡沒有喘醒', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '不用墊高枕頭、不會夜裡喘醒要坐起來，心衰竭就比較不像。' } },
    'q-treat': { say: '藥舖給的那支吸的藥……這三天一直吸，一天十幾次。', clue: { text: '吸入的藥一天用到十幾次', kind: 'info', key: true } },
    'q-severity': { say: '九分。你看我……一句話要分三次。', clue: { text: '喘 9 分，講話斷斷續續', kind: 'pos', key: true } },
    // 個人與過去病史
    'q-pmh': { say: '大夫說我這是老菸槍的肺，五六年了。吸的藥有一搭沒一搭地用。沒有別的病。', clue: { text: '慢性阻塞性肺病五六年，吸入的藥沒有規則使用', kind: 'info', key: true } },
    'q-family': { say: '我爸也是咳了一輩子。', clue: { text: '父親長年咳嗽', kind: 'info' } },
    'q-surgery': { say: '去年冬天也是這樣喘，住過一次院，沒有插管。沒開過刀，最近沒有受傷，也沒有躺著不動。', clue: { text: '去年因為喘住院一次；沒有外傷或久臥', kind: 'info', tell: { form: 'sudden', dir: -1 }, why: '沒有外傷、久臥不動這些背景，而且是三天裡慢慢變差，氣胸和肺栓塞就比較不像。' } },
    'q-meds': { say: '就那支吸的藥。沒有別的，沒有過敏。', clue: { text: '只用吸入的藥，沒有過敏', kind: 'info' } },
    'q-habits': { say: '菸斗抽了四十五年。現在少抽了，一天還是要兩三斗。酒不喝。', clue: { text: '抽菸斗 45 年，現在還在抽', kind: 'info', key: true, tell: { form: 'airway', dir: 1 }, why: '抽了幾十年的菸，是慢性阻塞性肺病最主要的原因。' } },
    'q-work': { say: '燻魚坊做了四十年，整天都在煙裡。最近沒有出遠門。坊裡有兩個徒弟在感冒。', clue: { text: '燻魚坊工作 40 年，長期吸入煙；徒弟在感冒', kind: 'info', key: true } },
    'q-life': { say: '這三天喘到睡不著，也吃不太下。跟老伴住。', clue: { text: '三天來睡不好、吃不下', kind: 'info' } },
    'q-concern': { say: '我怕被插管……去年隔壁床的就是那樣進去的。還有，坊裡這一批魚，再兩天要出貨。', clue: { text: '怕被插管；掛心坊裡要出貨', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '有一點燒，很累。體重沒變，不會盜汗。聲音沒變。', clue: { text: '微燒、疲倦；體重沒有變', kind: 'pos' } },
    'q-ros-cp': { say: '黃綠色的痰，沒有血。心跳很快。', clue: { text: '黃綠色的痰，沒有咳血', kind: 'pos' } },
    'q-ros-gi': { say: '吃不下，別的都正常。', clue: { text: '食慾差，大小便正常', kind: 'neg' } },
    'q-ros-limb': { say: '手腳不麻。腳沒有腫，小腿不痛。', clue: { text: '腳不腫，小腿不痛', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '身體往前傾，兩手撐在膝蓋上，噘著嘴吐氣。每吸一口氣，脖子兩邊的肌肉都繃起來。一句話講不完。', clue: { text: '前傾撐膝、噘嘴吐氣、用到脖子的肌肉', kind: 'pos', key: true, tell: { form: 'airway', dir: 1 }, why: '往前趴、噘嘴吐氣，是氣吐不出去的人自己找到的省力姿勢。用到脖子的肌肉，表示光靠平常的力氣已經不夠。' } },
    'x-head': { say: '結膜不蒼白。嘴唇有一點發紫。脖子和鎖骨上方摸不到腫大的淋巴結。', clue: { text: '嘴唇輕微發紫', kind: 'pos', key: true } },
    'x-jvp': { say: '沒有頸靜脈怒張。氣管在正中間。', clue: { text: '沒有頸靜脈怒張，氣管居中', kind: 'neg', tell: { form: 'cardiac', dir: -1 }, why: '頸靜脈沒有鼓起來，表示血回心臟沒有被塞住，心衰竭就比較不像。' } },
    'x-chest-touch': { say: '胸廓前後變厚，像一個桶子。兩邊起伏對稱，可是幅度很小。按壓不痛。', clue: { text: '桶狀胸，兩邊起伏對稱但幅度小', kind: 'pos', key: true } },
    'x-chest-listen': { say: '兩邊敲起來都特別響。呼吸音整片變小，吐氣拉得很長，到處都是吐氣的喘鳴聲。兩邊一樣。沒有濕囉音。', clue: { text: '兩側過度反響、呼吸音變小、吐氣延長、廣泛喘鳴', kind: 'pos', key: true, tell: { form: 'airway', dir: 1 }, why: '吐氣拉長、整片喘鳴，是氣管變窄的聲音。兩邊都聽得到、對稱，也讓單邊的氣胸比較不像。' } },
    'x-heart': { say: '心音聽起來很遠，偏快，規則。沒有雜音，沒有多出來的心音。', clue: { text: '心音遙遠、偏快，沒有第三心音', kind: 'neg' } },
    'x-botharms': { say: '右手 146/86 mmHg，左手 144/84 mmHg。兩邊脈搏一樣強。', clue: { text: '兩手血壓和脈搏沒有差別', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟。吐氣的時候，肚子的肌肉跟著用力。', clue: { text: '吐氣時腹肌用力', kind: 'pos' } },
    'x-perfusion': { say: '手指溫暖，指甲床有一點發紫，微血管回填約 2 秒。指尖沒有變圓。', clue: { text: '指甲床輕微發紫', kind: 'pos' } },
    'x-legs': { say: '兩腳沒有水腫。小腿一樣粗，不紅不痛。', clue: { text: '兩腳沒有水腫，小腿不腫不痛', kind: 'neg' } },
  },
  results: {
    't-cxr': { say: '兩邊的肺被撐得很開、顏色偏黑，橫膈被壓平，心臟的影子細長。沒有一塊一塊的陰影，沒有氣胸。' + TEXT_RESULT, clue: { text: '胸部 X 光：肺過度充氣、橫膈變平；沒有肺炎的陰影或氣胸', kind: 'neg', key: true, fog: 5, tell: { form: 'infect', dir: -1 }, alsoOk: [{ form: 'sudden', dir: -1 }], why: '沒有一塊一塊的陰影，肺炎比較不像；也沒有氣胸。肺被撐開、橫膈被壓平，是長年氣吐不乾淨留下來的樣子。' } },
    't-ecg': { say: '竇性心搏過速，每分鐘 112 下。沒有 ST 段的變化。' + TEXT_RESULT, clue: { text: '心電圖：竇性心搏過速，沒有 ST 變化', kind: 'neg' } },
    't-blood': { pending: '血和動脈血氣已經抽好送出，結果要等一段時間，這一關裡等不到。' },
    't-glucose': { say: '118 mg/dL。', clue: { text: '血糖 118 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'airway', exclude: { cardiac: 2, infect: 2, sudden: 1 } },
  summaries: [
    { id: 's-best', text: '66 歲男性，慢性阻塞性肺病、抽菸 45 年，三天前上呼吸道感染後喘加劇，痰變多變膿；血氧 86%、講話斷續、使用呼吸輔助肌，兩側廣泛喘鳴。', score: 5, note: '有年齡、病史、誘因、三個主要症狀和目前有多不穩定。聽的人馬上知道要過來。' },
    { id: 's-ok', text: '66 歲男性，老菸槍，喘了三天，有黃痰。', score: 3, note: '方向對了，但少了血氧 86% 和講話斷續，聽不出有多急。' },
    { id: 's-vague', text: '老先生很喘，可能是肺不好。', score: 0, note: '太模糊。聽的人不知道是哪一種喘、要多快過來。' },
    { id: 's-anchor', text: '66 歲男性喘、心跳很快，年紀大了，應該是心臟衰竭。', score: 0, note: '可以平躺、頸靜脈不鼓、腳不腫、聽不到濕囉音。把「老人喘」直接當成心臟，會給錯處置。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-copd', text: '我的診斷是氣道阻塞，慢性阻塞性肺病急性惡化。血氧 86%、講話斷斷續續，現在不穩定。', score: 2, note: '說出你的判斷，也說出有多急。' },
      { id: 'a-unknown', text: '病人很喘，原因還不清楚。', score: 1, note: '你手上的線索其實夠你說出方向了。血氧也沒有報。' },
      { id: 'a-hf', text: '應該是心臟衰竭，想先請您開利尿劑。', score: 0, note: '線索並不支持：可以平躺、頸靜脈不怒張、腳不腫、聽不到濕囉音。' },
    ],
    requests: [
      { id: 'r-come', text: '請您現在過來看病人。', ok: true, note: '明確說出要對方做什麼。' },
      { id: 'r-cxr', text: '請同意照胸部 X 光，並抽動脈血氣。', ok: true, orders: 't-cxr', note: 'X 光用來找肺炎和氣胸；動脈血氣看二氧化碳有沒有排不出去。' },
      { id: 'r-o2low', text: '我先給低流量的氧氣，把血氧調到 88–92% 之間，接上監測，隨時回報。', ok: true, note: '這種病人的氧氣要調著給。目標和給法照醫囑。' },
      { id: 'r-o2high', text: '我先用最大流量的氧氣面罩，把血氧拉到 100%。', ok: false, note: '這種病人氧氣給太多，二氧化碳可能排不出去，人會越來越想睡。目標不是 100%。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的氣管因為這一次感冒變得更窄，所以氣吐不出去。我們會給氧氣，也會用藥讓氣管鬆開。', ok: true, note: '用病人聽得懂的話說出原因和接下來要做的事。' },
    { id: 'e-plan', text: '醫師馬上過來。現在照您習慣的姿勢坐著，噘嘴慢慢吐氣，我就在旁邊。', ok: true, note: '說明接下來會發生什麼，也肯定他自己找到的省力方法。' },
    { id: 'e-warn', text: '如果越來越想睡、頭痛，或是更喘，馬上跟我說。', ok: true, note: '交代要注意的變化。想睡、頭痛是二氧化碳排不出去的訊號。' },
    { id: 'e-concern', text: '您怕被插管。現在先用氧氣和藥把氣順下來；每一步要做什麼，我都會先跟您說，不會突然就做。坊裡的事，我請您徒弟先顧著。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他最怕的事。沒有保證「不會」，但保證會先說。' },
    { id: 'e-false', text: '吸幾口氧氣就沒事了，等一下就可以回坊裡。', ok: false, note: '沒有根據的保證。他可能因此提早離開。' },
    { id: 'e-blame', text: '這都是抽菸抽出來的，早就該戒了。', ok: false, note: '責備不會讓他現在好一點，還會讓他之後不敢說實話。戒菸要談，但不是現在，也不是這樣談。' },
  ],

  // 下了診斷之後：兩分鐘內沒有人知道，他會變差；五分鐘還沒有，岑禾接手
  timeline: { worsenAfter: 120, stepInAfter: 300, doctorDelay: 90 },
  safety: [{ type: 'call', points: 6 }, { type: 'order', test: 't-cxr', within: 180, points: 3 }],
  readsNeeded: 6,

  lines: {
    opening: ['同一隻蛙，這一位喘得連話都講不完。問短一點，眼睛不要離開他。值班鐘隨時可以敲。'],
    watch: '霍樟撐著膝蓋，噘著嘴，一口一口慢慢吐氣。',
    watchWorse: '霍樟的頭越垂越低，叫他要叫兩聲才抬頭。',
    worsen: '……頭……好重……',
    stepIn: '我先敲鐘了。血氧 86% 的人，不能等你把話想完。',
    called: '值班鐘響了。沈渡醫師馬上到，你繼續。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。氧氣照你說的調著給，不要衝高。片子和血氣我來看，藥我來開。你留在他旁邊，注意他有沒有變得想睡。',
    reportWeak: '我聽不出是哪一種喘，也不知道血氧多少。下次先講這兩樣。我先看病人。',
    testRead: '肺被撐得很開，沒有肺炎，沒有氣胸。就是惡化。藥我來開，氧氣維持在 88 到 92。',
    explainOk: '……好……我照做。',
    explainConcern: '……先跟我說就好……我最怕的是什麼都不知道。',
    explainBad: '……（霍樟別過頭，不再看你。）',
    closing: '霧散了。同一隻蛙，一個是水，一個是氣。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。真實的情境裡，量到血氧 86% 就會先處理、先叫人，不會等整套問完。提早敲鐘不扣分。',
      '氧氣的目標（88–92%）和給法，要照醫囑和院內的規範。重點是「調著給、一直看著」，不是背一個數字。',
      '戒菸和規則用藥很重要，但要等這一次穩下來，再找一個他聽得進去的時候談。',
    ],
    teaching: [
      { text: '慢性阻塞性肺病急性惡化，氧氣要調著給：和高流量的氧氣比起來，調整劑量的氧氣死亡率比較低，也比較少發生二氧化碳滯留和呼吸性酸中毒。', ref: 'austin2010' },
      { text: '喘的病人如果聽不到濕囉音、X 光上心臟不大，心衰竭的可能性會變低。', ref: 'wang2005' },
    ],
    references: [AUSTIN_2010, WANG_2005],
  },
};
