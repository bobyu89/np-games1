// 病例 C04A：溫荷，發燒，真身是泌尿道（急性腎盂腎炎）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 第三章的委託，都是舊索引上太早歸檔的。這一張寫的是「著涼」。
// 這一關要練的是：發燒只說有火，火在哪裡要從頭到腳找；找到一處，另外幾處也要有憑據才放下。
import type { CaseSpec } from '../core/module.ts';
import { EVANS_2021, JOHNSON_2018, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C04A: CaseSpec = {
  format: 3,
  id: 'c04a',
  complaint: 'fever',
  kind: '示範',
  title: '不是著涼',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '溫荷', age: 34, sex: '女', job: '碼頭補網的女工', look: 'he', pronoun: '她' },
  reading: {
    lines: ['溫荷，34 歲，碼頭補網的女工。', '三天前開始發燒、全身痠痛。藥鋪說是著涼，給了退燒的藥粉。昨天起右邊的腰一陣一陣痛；今天早上冷到全身發抖，量到 39 度。', '她自己走進來，臉紅紅的，右手撐著後腰。'],
    prompts: ['最危險的可能是什麼？', '發燒的人，身上有哪幾個地方可能藏著火？', '哪幾樣東西變了，就表示她不穩定？'],
  },
  vitals: {
    base: { bp: '112/70', hr: 106, rr: 20, spo2: 98, bt: 38.9 },
    clue: { text: '發燒 38.9 度、心跳偏快；血壓和血氧正常', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（溫荷側坐在床邊，右手撐著後腰。）' },
    'q-intro': { say: '溫荷。芒種那天生的，三十四。' },
    'q-explain': { say: '好。' },
    // 主訴
    'q-cc': { say: '發燒三天了。右邊的腰很痛。', clue: { text: '主訴：發燒三天、右腰痛', kind: 'pos' } },
    'q-onset': { say: '三天前的晚上。先是全身痠、發冷，隔天早上就燒起來了。', clue: { text: '三天前開始，先畏寒再發燒', kind: 'pos' } },
    'q-location': { say: '今天早上在腋下量，三十九度。前兩天沒有量，摸起來很燙。', clue: { text: '最高量到 39 度', kind: 'pos' } },
    'q-duration': { say: '吃了藥粉會退一陣子，藥效過了又燒上來。', clue: { text: '退燒藥有效，但藥效過了又燒', kind: 'info' } },
    'q-character': { say: '今天早上冷到牙齒打顫，全身抖，蓋兩條被子都沒用。抖完就燒到最高。', clue: { text: '今天早上寒顫', kind: 'pos', key: true } },
    'q-assoc': { say: '小便很頻，一直想跑，每次只有一點點，尿的時候會刺痛。右邊的腰一陣一陣痛。有點想吐。', clue: { text: '頻尿、解尿疼痛、右腰痛', kind: 'pos', key: true, tell: { form: 'urinary', dir: 1 }, why: '頻尿、尿的時候會痛，再加上發燒和腰痛：火像是從膀胱一路往上，燒到了腎臟。' } },
    'q-factors': { say: '彎腰、走路震到會更痛。躺著不動好一點。', clue: { text: '腰痛在震動時加重', kind: 'pos' } },
    'q-radiate': { say: '身上沒有傷口，沒有破皮。最近沒有拔牙，沒有打針。', clue: { text: '沒有傷口或破皮，最近沒有打針或拔牙', kind: 'neg' } },
    'q-treat': { say: '去藥鋪拿了退燒的藥粉，說是著涼。沒有吃過抗生素。', clue: { text: '被當成著涼，只吃退燒藥；沒有用過抗生素', kind: 'info', key: true } },
    'q-severity': { say: '很累，但是人是清楚的。喝得下水，飯吃不太下。小便的量差不多，只是分很多次。', clue: { text: '意識清楚，喝得下水，尿量沒有減少', kind: 'neg', key: true } },
    // 個人與過去病史
    'q-pmh': { say: '沒有什麼慢性病，沒有糖尿病。去年也有過一次小便會痛，吃了幾天藥就好了。', clue: { text: '去年有過一次泌尿道感染；沒有糖尿病', kind: 'pos', tell: { form: 'urinary', dir: 1 }, why: '以前有過泌尿道感染的人，比較容易再來一次。' } },
    'q-family': { say: '爸媽都還健康。阿姨在洗腎。', clue: { text: '阿姨洗腎', kind: 'info' } },
    'q-surgery': { say: '沒開過刀，沒住過院。沒有長過結石。', clue: { text: '沒有手術、住院或結石的病史', kind: 'neg' } },
    'q-meds': { say: '平常沒有吃藥。這幾天只有那包退燒的藥粉，是燒起來之後才吃的。沒有過敏。', clue: { text: '沒有長期用藥；發燒之前沒有吃任何新的藥', kind: 'neg', tell: { form: 'other', dir: -1 }, why: '藥物引起的發燒，要先有一個新開始吃的藥。她是燒起來之後才吃藥的，就比較不像。' } },
    'q-habits': { say: '不抽菸，不喝酒。', clue: { text: '沒有菸酒', kind: 'info' } },
    'q-work': { say: '在碼頭補網，一坐就是一整天。忙起來常常憋尿，也忘了喝水。身邊沒有人發燒，最近沒有出遠門。', clue: { text: '工作時常憋尿、喝水少；身邊沒有人生病', kind: 'info', key: true } },
    'q-life': { say: '跟先生和女兒住。最近趕工，睡得少。月經上禮拜剛結束，沒有懷孕。', clue: { text: '月經剛結束，沒有懷孕', kind: 'info' } },
    'q-concern': { say: '我怕腎會壞掉。我阿姨就是洗腎的。還有，那批網子後天要交。', clue: { text: '怕腎壞掉；網子後天要交', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '很累，全身痠。沒有盜汗，體重沒有變。頭有點脹，脖子不會硬。', clue: { text: '倦怠；沒有盜汗或體重減輕', kind: 'neg' } },
    'q-ros-cp': { say: '沒有咳嗽，沒有痰，喉嚨不痛，不會喘。', clue: { text: '沒有咳嗽、痰或喉嚨痛', kind: 'neg' } },
    'q-ros-gi': { say: '想吐，沒有吐出來。肚子不痛，沒有拉肚子。小便比較濁，沒有看到血。', clue: { text: '噁心；尿液混濁', kind: 'pos' } },
    'q-ros-limb': { say: '手腳不麻。腳不腫，皮膚沒有哪裡紅腫。', clue: { text: '四肢沒有紅腫', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '臉潮紅，看起來很累，但是對答清楚。右手一直撐著腰。', clue: { text: '倦怠、臉潮紅，意識清楚', kind: 'pos' } },
    'x-head': { say: '喉嚨不紅，扁桃腺不腫。嘴唇有點乾。脖子和耳後摸不到腫大的淋巴結。', clue: { text: '咽喉不紅，淋巴結不腫；口唇稍乾', kind: 'neg' } },
    'x-neck': { say: '下巴可以碰到胸口，脖子不僵硬。', clue: { text: '頸部柔軟，沒有僵硬', kind: 'neg', key: true } },
    'x-chest-listen': { say: '兩邊敲起來一樣，都是清音。呼吸音清楚，沒有囉音。', clue: { text: '兩側呼吸音清楚，沒有囉音', kind: 'neg', tell: { form: 'lung', dir: -1 }, why: '沒有咳嗽，兩邊的肺聽起來又是清楚的，呼吸道就比較不像。' } },
    'x-heart': { say: '心跳快，規則。沒有雜音。', clue: { text: '心搏快而規則，沒有雜音', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟。恥骨上方按下去有點痠痛。沒有反彈痛。', clue: { text: '恥骨上輕微壓痛，沒有腹膜徵象', kind: 'pos' } },
    'x-cva': { say: '敲右邊腰的後面，她整個人縮了一下。左邊敲了不痛。', clue: { text: '右側肋脊角敲擊痛', kind: 'pos', key: true, tell: { form: 'urinary', dir: 1 }, why: '腰的後面一敲就痛，是腎臟在發炎很有力的徵象。' } },
    'x-skin': { say: '全身的皮膚看過一遍，包括背後和兩隻腳：沒有紅腫，沒有傷口，沒有疹子。', clue: { text: '全身皮膚沒有紅腫、傷口或疹子', kind: 'neg', tell: { form: 'skin', dir: -1 }, why: '皮膚從頭到腳看過一遍，沒有紅、腫、熱、痛的地方，也沒有細菌進得去的門。皮膚與軟組織可以排除。' } },
    'x-legs': { say: '兩腳不腫。關節不紅、不熱、不痛。', clue: { text: '下肢和關節沒有紅腫', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。', clue: { text: '末梢溫暖，循環良好', kind: 'neg', key: true } },
  },
  results: {
    't-urine': { say: '尿液混濁。白血球很多，亞硝酸鹽陽性，有一些紅血球。驗孕陰性。尿液培養已經送出。' + TEXT_RESULT, clue: { text: '驗尿：白血球很多、亞硝酸鹽陽性', kind: 'pos', key: true, fog: 6, tell: { form: 'urinary', dir: 1 }, why: '尿裡有很多白血球和細菌留下的痕跡，加上發燒和腰痛，就是腎盂腎炎的樣子。培養要在用抗生素之前留。' } },
    't-cxr': { say: '兩邊肺野清楚，沒有浸潤。' + TEXT_RESULT, clue: { text: '胸部 X 光：沒有肺炎', kind: 'neg' } },
    't-blood': { say: '白血球 14,800。乳酸正常，腎功能正常。血液培養已經送出，結果要等幾天。' + TEXT_RESULT, clue: { text: '抽血：白血球上升；乳酸和腎功能正常', kind: 'pos' } },
    't-glucose': { say: '96 mg/dL。', clue: { text: '血糖 96 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'urinary', exclude: { lung: 2, skin: 2, other: 1 } },
  summaries: [
    { id: 's-best', text: '34 歲女性，發燒三天、今晨寒顫，合併頻尿、解尿疼痛和右腰痛；體溫 38.9 度、心跳 106，血壓正常、意識清楚；右側肋脊角敲擊痛，肺部和皮膚沒有發現。', score: 5, note: '有發燒的時間、指向源頭的症狀、最有力的評估發現，也交代了穩定度，和哪幾處查過沒有問題。' },
    { id: 's-ok', text: '34 歲女性，發燒三天合併右腰痛。', score: 3, note: '方向有了，但少了小便的症狀、生命徵象和敲擊痛。' },
    { id: 's-vague', text: '年輕女性發燒、全身痠痛，像是著涼。', score: 0, note: '藥鋪就是這樣說的。著涼不會腰痛，也不會小便痛。' },
    { id: 's-anchor', text: '34 歲女性右腰痛，工作要久坐，是腰部拉傷，另外有點感冒。', score: 0, note: '把發燒和腰痛拆成兩件不相干的事，就會漏掉它們是同一個源頭。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-best', text: '我的診斷是泌尿道來的發燒，擔心是右側的腎盂腎炎。體溫 38.9、心跳 106，血壓正常、意識清楚，目前穩定。', score: 2, note: '說出你的判斷和依據，也說出她現在穩不穩定。' },
      { id: 'a-unknown', text: '發燒三天，原因還在找。', score: 1, note: '你問到的小便症狀和敲擊痛，已經夠你說出方向了。' },
      { id: 'a-cold', text: '應該是著涼，想請她多喝水、回家休息。', score: 0, note: '著涼不會有腰的敲擊痛。' },
    ],
    requests: [
      { id: 'r-urine', text: '請同意驗尿、留尿液培養，並抽血（含血液培養）。培養想在用抗生素之前留。', ok: true, orders: 't-urine', note: '先留培養，再用抗生素。之後才知道是哪一種菌、藥要不要換。' },
      { id: 'r-plan', text: '抗生素和要不要留下來觀察，請您評估。她喝得下水，沒有懷孕。', ok: true, note: '把醫師做決定需要的資訊一起報：能不能喝水、有沒有懷孕。' },
      { id: 'r-watch', text: '我會繼續看她的血壓、心跳和意識，有變化馬上回報。', ok: true, note: '發燒的病人，穩定是「現在」穩定。' },
      { id: 'r-home', text: '她說是著涼，我想先給退燒藥，燒退了就讓她回去。', ok: false, note: '只退燒、不找源頭，等於把這張紀錄再蓋一次。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '妳的發燒，看起來是從泌尿道來的：細菌從膀胱往上跑到了右邊的腎臟。所以腰會痛，小便也會痛。我們要驗尿確認。', ok: true, note: '用她聽得懂的話說出評估的結果，也說出接下來要做的檢查。' },
    { id: 'e-plan', text: '等一下會留小便、抽血。醫師看過結果，會決定用什麼藥。這種感染，藥用對了多半會好。', ok: true, note: '說明接下來會發生什麼。' },
    { id: 'e-warn', text: '如果燒一直不退、吐到沒辦法喝水、腰越來越痛，或是覺得頭暈、人恍恍惚惚的，要馬上跟我說。', ok: true, note: '交代要注意的變化。' },
    { id: 'e-concern', text: '妳怕腎會壞掉。這一次是感染，跟阿姨洗腎的原因不一樣；早一點把感染治好，就是在保護腎臟。網子的事，等醫師看過，我們再一起想怎麼安排。', ok: true, concern: true, needsClue: 'c-concern', note: '回應她最怕的事，也接住她放不下的那件工作。' },
    { id: 'e-false', text: '只是著涼，多喝水、多休息就會好。', ok: false, note: '沒有根據的保證。她已經休息三天了。' },
    { id: 'e-jargon', text: '妳是急性腎盂腎炎，要打兩個禮拜的抗生素。', ok: false, note: '診斷還沒有確認；用什麼藥、用多久，也不是我們現在能決定的。' },
  ],

  // 這位病人是穩定的：沒有時間壓力，敲鐘是過度通報
  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-urine', within: 300, points: 3 }, { type: 'exclude', forms: ['lung', 'skin', 'other'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['第三章的委託，都是舊索引上早就歸檔的。這一張，索引上寫的是「著涼」。', '發燒只告訴你有火。火在哪裡，要從頭到腳，一處一處找。'],
    watch: '溫荷側躺著，右手還是撐在腰上，臉頰紅紅的。',
    called: '鐘響了。沈渡醫師會過來。不過她的血壓和意識都還好。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。尿和血的培養先留，留完我開藥。她能喝水、沒有懷孕，這兩件你有報，很好。',
    reportWeak: '發燒三天，然後呢？火在哪裡？下次先講你找到的源頭。',
    testRead: '尿裡都是白血球。是腎盂腎炎。培養留了嗎？留了我就開藥。',
    explainOk: '好……原來不是著涼。',
    explainConcern: '……不一樣啊。那我放心一點了。網子我請隔壁的阿嬸先接。',
    explainBad: '可是我已經休息三天了，越來越燒啊。',
    closing: '霧散了。「著涼」那兩個字，可以從索引上劃掉了。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓她知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。發燒的病人，生命徵象要先看：血壓掉了、意識變了、呼吸很快，就不是慢慢問的時候。',
      '「著涼」是太早下的結論。發燒加上一個「局部」的症狀（腰痛、小便痛），就從那個局部去找。',
      '這一關的四個診斷沒有包括肚子裡的感染和腦膜炎。真的在找發燒的源頭時，這兩處也要想到：所以評估裡有腹部，也有頸部僵硬。',
    ],
    teaching: [
      { text: '腎盂腎炎典型的表現是發燒、腰痛，加上頻尿、解尿疼痛這些泌尿道的症狀；評估可以發現肋脊角的敲擊痛。', ref: 'johnson2018' },
      { text: '尿液培養要在用抗生素之前留。', ref: 'johnson2018' },
      { text: '懷疑有嚴重的感染時，血液培養也是在用抗生素之前留；但不能為了等培養而拖延用藥。', ref: 'evans2021' },
    ],
    references: [JOHNSON_2018, EVANS_2021],
  },
};
