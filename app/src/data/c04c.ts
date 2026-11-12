// 病例 C04C：池榆，發燒，真身是呼吸道（懷疑肺結核）。
// 虛構的教學病例，依文末的文獻撰寫，還沒經過臨床老師審查，不能當教材。
// 舊索引上寫的是「感冒，還沒好」，寫了兩次。
// 這一關要練的是：拖了幾個禮拜的咳嗽和發燒不是感冒；想到會傳染的病，第一件事是保護旁邊的人。
// 這一關「非感染」那一盞故意放不下：發燒、盜汗、體重減輕，腫瘤也會這樣。
import type { CaseSpec } from '../core/module.ts';
import { LEWINSOHN_2017, REVIEW_NOTE, TEXT_RESULT } from './shared.ts';

export const C04C: CaseSpec = {
  format: 3,
  id: 'c04c',
  complaint: 'fever',
  kind: '變體',
  title: '還沒好的感冒',
  review: { state: '未審查', note: REVIEW_NOTE },
  patient: { name: '池榆', age: 47, sex: '男', job: '遠洋貨船上的廚子', look: 'yu', pronoun: '他' },
  scene: 'ward-rain',
  reading: {
    lines: ['池榆，47 歲，遠洋貨船上的廚子。', '一個半月前開始咳嗽，藥鋪說是感冒。這三個禮拜，每天下午都有點燒，夜裡流汗流到要換衣服，褲頭也鬆了。前天咳出來的痰裡有血絲。', '他自己走進來，人很瘦，開口之前先咳了一陣。'],
    prompts: ['最危險的可能是什麼？', '感冒會拖一個半月嗎？拖這麼久的咳嗽和發燒，要想到什麼？', '如果我想的是對的，除了他自己，還有誰要被保護？'],
  },
  vitals: {
    base: { bp: '116/72', hr: 92, rr: 18, spo2: 96, bt: 37.9 },
    clue: { text: '低燒 37.9 度；血壓、呼吸和血氧正常', kind: 'pos', key: true },
  },

  answers: {
    // 開場
    'q-wash': { say: '（池榆坐在床邊，用手帕摀著嘴咳了一陣，才抬起頭。）' },
    'q-intro': { say: '池榆。霜降生的，四十七。' },
    'q-explain': { say: '好。咳……不好意思。' },
    // 主訴
    'q-cc': { say: '一直咳，下午會發燒。', clue: { text: '主訴：久咳、午後發燒', kind: 'pos' } },
    'q-onset': { say: '燒是三個禮拜前開始的。咳更早，一個半月了，那時候藥鋪說是感冒。', clue: { text: '咳嗽六週、發燒三週，慢慢來的', kind: 'pos', key: true, tell: { form: 'lung', dir: 1 }, why: '感冒一兩個禮拜會好。咳了一個半月、又燒了三個禮拜，就不是感冒。這麼慢的呼吸道感染，要想到結核。' } },
    'q-location': { say: '下午量大概三十七度八、三十八度。早上起來是正常的。', clue: { text: '每天午後低燒約 38 度，早上正常', kind: 'pos' } },
    'q-duration': { say: '每天下午燒上來，半夜流一身汗就退了，隔天下午又來。', clue: { text: '午後發燒、夜裡出汗後退燒，天天如此', kind: 'pos' } },
    'q-character': { say: '不會發抖。就是夜裡流汗，流到被單都濕了，要起來換衣服。', clue: { text: '沒有寒顫；夜間盜汗到要換衣服', kind: 'pos', key: true } },
    'q-assoc': { say: '咳嗽，有黃痰。前天痰裡有幾條血絲。咳的時候右邊胸口會悶痛。', clue: { text: '咳嗽有痰，痰中帶血絲', kind: 'pos', key: true, tell: { form: 'lung', dir: 1 }, why: '發燒的人有咳嗽、有痰、痰裡還有血，火就在肺裡。' } },
    'q-factors': { say: '退燒藥吃了會退一下。咳嗽藥水沒什麼用。', clue: { text: '止咳藥沒有效', kind: 'info' } },
    'q-radiate': { say: '身上沒有傷口。沒有打針，沒有拔牙。', clue: { text: '沒有傷口、打針或拔牙', kind: 'neg' } },
    'q-treat': { say: '去過兩次藥鋪，都說是感冒，拿了咳嗽藥水。沒有吃過抗生素。', clue: { text: '兩次都被當成感冒；沒有用過抗生素', kind: 'info', key: true } },
    'q-severity': { say: '人比較累，但是還能做事。飯吃得比以前少。小便正常。', clue: { text: '倦怠、食慾變差，還能工作', kind: 'pos' } },
    // 個人與過去病史
    'q-pmh': { say: '沒有什麼病，沒有糖尿病。', clue: { text: '沒有慢性病', kind: 'neg' } },
    'q-family': { say: '家裡沒有人有肺的毛病。', clue: { text: '家人沒有肺部疾病', kind: 'info' } },
    'q-surgery': { say: '沒開過刀，沒住過院。', clue: { text: '沒有手術或住院', kind: 'neg' } },
    'q-meds': { say: '沒有固定吃藥。這一個多月只有咳嗽藥水和退燒藥。沒有過敏。', clue: { text: '沒有長期用藥', kind: 'info' } },
    'q-habits': { say: '抽菸，一天十來根，二十年了。酒在船上不喝，靠岸才喝。', clue: { text: '抽菸二十年，一天約十根', kind: 'pos', key: true } },
    'q-work': { say: '在貨船上當廚子，一趟出去兩三個月。睡的是底艙的通舖，八個人一間。去年同艙的老周也是咳了好幾個月，後來被送下船養病，聽說是肺有問題。', clue: { text: '住船上八人一間的通舖；去年同艙的人久咳、下船養病', kind: 'pos', key: true, tell: { form: 'lung', dir: 1 }, why: '結核是在不通風的地方、長時間待在一起傳開的。同艙的人久咳之後被送下船，是很重要的接觸史。' } },
    'q-life': { say: '這一個半月瘦了五公斤，褲頭鬆了一圈。胃口不好。靠岸的時候住碼頭的客棧。', clue: { text: '六週內體重掉了 5 公斤', kind: 'pos', key: true } },
    'q-concern': { say: '我是廚子。要是這個會傳給人，船東不會再用我了。我一直不敢看大夫，也是怕這個。', clue: { text: '怕被當成會傳染的人、丟掉船上的工作，所以不敢就醫', kind: 'info' } },
    // 系統回顧
    'q-ros-gen': { say: '很累。夜裡盜汗，瘦了。頭不痛，脖子不硬。', clue: { text: '倦怠、盜汗、體重減輕；沒有頭痛或頸部僵硬', kind: 'pos' } },
    'q-ros-cp': { say: '咳，有痰，痰裡有過血絲。走快一點會有點喘。躺平可以睡。', clue: { text: '活動時輕微喘；可以平躺', kind: 'pos' } },
    'q-ros-gi': { say: '胃口不好，不會吐，肚子不痛，沒有拉肚子。小便不痛、不頻。', clue: { text: '解尿不痛不頻；沒有腹痛腹瀉', kind: 'neg', tell: { form: 'urinary', dir: -1 }, why: '泌尿道的感染會頻尿、尿的時候痛，或是腰痛。都沒有，就比較不像。' } },
    'q-ros-limb': { say: '手腳不麻，腳不腫，關節不痛。', clue: { text: '四肢和關節沒有症狀', kind: 'neg' } },
  },
  findings: {
    'x-look': { say: '很瘦，顴骨突出，衣服看得出大了一號。講幾句話就要咳。呼吸不費力。', clue: { text: '消瘦；說話時頻咳，呼吸不費力', kind: 'pos', key: true } },
    'x-head': { say: '喉嚨不紅。脖子兩側和鎖骨上面摸不到腫大的淋巴結。', clue: { text: '咽喉不紅；頸部和鎖骨上沒有摸到淋巴結', kind: 'neg' } },
    'x-neck': { say: '脖子可以彎，下巴碰得到胸口，不僵硬。', clue: { text: '頸部柔軟，沒有僵硬', kind: 'neg', key: true } },
    'x-chest-listen': { say: '右邊上面敲起來比左邊實一點。請他咳一下再聽：右上肺聽得到細細的濕囉音。其他地方是清楚的。', clue: { text: '右上肺叩診較實，咳嗽後聽得到濕囉音', kind: 'pos', key: true, tell: { form: 'lung', dir: 1 }, why: '囉音只在右邊，而且在肺的上面。配上拖了六個禮拜的病程，上肺的病灶要想到結核。' } },
    'x-heart': { say: '心跳規則，沒有雜音。', clue: { text: '心搏規則，沒有雜音', kind: 'neg' } },
    'x-abd': { say: '腹部柔軟，沒有壓痛。摸不到肝和脾。', clue: { text: '腹部柔軟，沒有壓痛', kind: 'neg' } },
    'x-cva': { say: '兩邊腰的後面敲了都不痛。', clue: { text: '兩側肋脊角沒有敲擊痛', kind: 'neg' } },
    'x-skin': { say: '全身的皮膚看過一遍，包括兩隻腳：沒有傷口，沒有紅腫，沒有疹子。', clue: { text: '全身皮膚沒有傷口、紅腫或疹子', kind: 'neg', tell: { form: 'skin', dir: -1 }, why: '皮膚從頭到腳看過，沒有紅腫，也沒有傷口。皮膚與軟組織可以排除。' } },
    'x-legs': { say: '兩腳不腫。關節不紅、不痛。', clue: { text: '下肢和關節沒有紅腫', kind: 'neg' } },
    'x-perfusion': { say: '手腳溫暖，微血管回填不到 2 秒。手指頭的形狀正常。', clue: { text: '末梢溫暖，循環良好', kind: 'neg' } },
  },
  results: {
    't-urine': { say: '乾淨，沒有白血球。' + TEXT_RESULT, clue: { text: '驗尿：正常', kind: 'neg' } },
    't-cxr': { say: '右上肺野有一片不均勻的陰影，裡面看得到一個空洞。其他的肺野清楚，心臟不大。' + TEXT_RESULT, clue: { text: '胸部 X 光：右上肺野浸潤，裡面有空洞', kind: 'pos', key: true, fog: 6, tell: { form: 'lung', dir: 1 }, why: '上肺的浸潤加上空洞，在證明不是之前，要當成肺結核：先隔離，再驗痰。腫瘤也可能長成這樣，所以後面的檢查都要做。' } },
    't-blood': { say: '白血球正常。有一點貧血，發炎指數上升。乳酸正常。血液培養已經送出。' + TEXT_RESULT, clue: { text: '抽血：輕微貧血、發炎指數上升；白血球和乳酸正常', kind: 'pos' } },
    't-glucose': { say: '102 mg/dL。', clue: { text: '血糖 102 mg/dL', kind: 'neg' } },
  },

  answer: { truth: 'lung', exclude: { other: 2, urinary: 1, skin: 1 } },
  summaries: [
    { id: 's-best', text: '47 歲男性，抽菸，住船上的通舖、去年同艙有人久咳；咳嗽六週，午後發燒和夜間盜汗三週，體重掉 5 公斤，痰中帶血絲；體溫 37.9、血氧 96%，右上肺聽得到濕囉音。', score: 5, note: '有時間的長度、全身的症狀、接觸史，和評估的發現。這幾樣放在一起，才看得出不是感冒。' },
    { id: 's-ok', text: '47 歲男性，咳嗽六週合併午後發燒，痰中有血絲。', score: 3, note: '看得出不是感冒了，但少了盜汗、體重減輕和接觸史。' },
    { id: 's-vague', text: '中年男性咳嗽、有點燒，感冒還沒好。', score: 0, note: '藥鋪說了兩次的，就是這一句。感冒不會拖一個半月。' },
    { id: 's-anchor', text: '47 歲男性，抽菸二十年，久咳、痰中帶血、體重減輕，是肺癌。', score: 0, note: '腫瘤確實還要排除。但他每天發燒、盜汗，同艙有人久咳：會傳染的那一個，要先想、先防。' },
  ],
  sbar: {
    assessments: [
      { id: 'a-best', text: '我的診斷是呼吸道的感染，拖了六個禮拜，我擔心是肺結核：午後發燒、盜汗、體重減輕、痰裡有血絲，同艙有人久咳過。生命徵象穩定。腫瘤也還不能排除。', score: 2, note: '說出你最擔心的，也說出還不能排除的另一個可能。' },
      { id: 'a-unknown', text: '久咳合併發燒，原因還不清楚。', score: 1, note: '你手上的線索，已經夠你說出最該先防的是什麼了。' },
      { id: 'a-cold', text: '感冒拖得比較久，想再給他一瓶咳嗽藥水。', score: 0, note: '這會是索引上的第三行「感冒，還沒好」。' },
    ],
    requests: [
      { id: 'r-iso', text: '我已經請他戴上口罩，想把他移到單獨、通風的房間；進去照顧的人戴 N95。', ok: true, note: '懷疑會經由空氣傳染的病，隔離不用等確診。' },
      { id: 'r-cxr', text: '請同意照胸部 X 光，並留痰做抹片和培養。', ok: true, orders: 't-cxr', note: '影像看病灶在哪裡、長什麼樣；痰用來確認是不是結核菌。' },
      { id: 'r-plan', text: '確認之後的通報和治療，請您處理。同艙的人要不要檢查，也請您評估。', ok: true, note: '通報和接觸者的追蹤有規定的流程，由醫師和院方啟動。' },
      { id: 'r-syrup', text: '他說是感冒，我想先給止咳藥，讓他回船上休息。', ok: false, note: '如果是結核，讓他回到八個人一間的底艙，就是讓另外七個人一起暴露。' },
    ],
  },
  explain: [
    { id: 'e-why', text: '您的咳嗽和發燒拖這麼久，不是感冒。我們擔心肺裡有慢性的感染，要照 X 光、驗痰，才知道是哪一種。', ok: true, note: '用他聽得懂的話說出評估的結果和下一步。' },
    { id: 'e-mask', text: '在結果出來之前，請您戴著口罩，我們會安排一個單獨的房間給您。這是在保護跟您一起生活的人。', ok: true, note: '隔離要說清楚：為了誰、到什麼時候。' },
    { id: 'e-plan', text: '等一下會照 X 光，再請您把痰留下來。醫師看過結果，會跟您說接下來怎麼做。', ok: true, note: '說明接下來會發生什麼。' },
    { id: 'e-warn', text: '如果咳出整口的血、突然喘起來，或是燒得更高，要馬上跟我說。', ok: true, note: '交代要注意的變化。' },
    { id: 'e-concern', text: '您怕丟掉船上的工作，所以一直不敢來。如果真的是會傳染的那一種，它是可以治的；好好吃藥一段時間之後，就不會再傳給別人。到時候要怎麼跟船東說，我們可以一起想。', ok: true, concern: true, needsClue: 'c-concern', note: '回應他不敢就醫的原因。「能治，治了就不會傳染」是他最需要聽到的。' },
    { id: 'e-false', text: '感冒本來就會拖，再多休息幾天就好。', ok: false, note: '沒有根據的保證。他已經聽過兩次了。' },
    { id: 'e-blame', text: '你這個會傳染給整船的人，怎麼拖到現在才來？', ok: false, note: '責備只會讓他，和下一個像他一樣的人，更不敢來。' },
  ],

  // 這位病人是穩定的：急的不是他自己，是跟他待在一起的人
  timeline: { doctorDelay: 90 },
  safety: [{ type: 'order', test: 't-cxr', within: 300, points: 2 }, { type: 'explain', id: 'e-mask', points: 3, what: '請他戴上口罩、和其他人分開' }, { type: 'exclude', forms: ['urinary', 'skin'], points: 2 }, { type: 'explain', id: 'e-warn', points: 1 }, { type: 'calm', points: 1 }],
  readsNeeded: 6,

  lines: {
    opening: ['這一張，索引上寫的是「感冒，還沒好」。寫了兩次。', '一樣是找火。但這一次你要多想一步：如果你想的是對的，這把火會不會燒到別人身上？'],
    watch: '池榆坐在床邊，咳的時候用手帕摀著嘴，把頭轉開。',
    called: '鐘響了。沈渡醫師會過來。不過他的生命徵象是穩的；這一位急的不是他自己。',
    doctorArrives: '我到了。告訴我重點。',
    reportGood: '收到。口罩和房間你已經處理了，很好。片子照完、痰留了，通報我來。同艙的人，我請人去問。',
    reportWeak: '咳了一個半月、每天發燒，你想到什麼？想到了，第一件事要做什麼？下次先講這兩樣。',
    testRead: '右上肺有空洞。先當成結核處理，等痰的結果。隔離你一開始就做了；同艙那七個人要謝謝你。',
    explainOk: '……好。口罩我戴著。',
    explainConcern: '……可以治？治了就不會傳給人？……那我自己去跟船東說。',
    explainBad: '我不是故意的……我以為只是感冒。',
    closing: '霧散了。「感冒，還沒好」。寫的人不是錯在第一次，是錯在第二次還寫同一句。寫進圖鑑吧。',
    hintNoExplain: '動手之前，先讓他知道你要做什麼、為什麼做、會碰哪裡。',
  },

  debrief: {
    alternatives: [
      '這一關照考站的順序走。真實的情境裡，一聽到「咳了一個半月、發燒、盜汗、瘦了」，口罩就要先戴上，不用等問完。',
      '「非感染」這一關還排除不了：發燒、盜汗、體重減輕、痰裡有血，腫瘤也會這樣，他又抽了二十年的菸。所以片子和痰都要做，兩邊一起查。',
      '隔離不是懲罰。跟病人說清楚是為了誰、到什麼時候，他才會配合。',
    ],
    teaching: [
      { text: '懷疑肺結核的時候，要照胸部影像，並留痰做抹片、培養和核酸檢驗來確認。', ref: 'lewinsohn2017' },
    ],
    references: [LEWINSOHN_2017],
  },
};
