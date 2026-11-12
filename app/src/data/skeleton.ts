// 共用的骨架：每個主訴都照同一個順序做。
//   開場 → 主訴（OLD CARTS）→ 個人與過去病史 → 系統回顧 → 身體評估（從頭到腳五個模組）
// 順序參考臨床老師的 OSCE 教案，文字是為這個專案重寫的。
// 主訴那一段每個主訴自己寫問法；其他幾段全部共用，玩家每一關練的是同一套流程。
import type { ComplaintDef } from '../core/module.ts';

type Q = ComplaintDef['questions'][number];
type X = ComplaintDef['exams'][number];

/** 開場：三件事，每一位病人都一樣 */
export const OPENING: Q[] = [
  { id: 'q-wash', group: 'open', label: '洗手', ask: '（敲門進來，先把手洗乾淨。）', weight: 0 },
  { id: 'q-intro', group: 'open', label: '介紹與核對', ask: '您好，我是今天照顧您的專科護理師。請告訴我您的名字和生日，我對一下您的手圈。', weight: 0 },
  { id: 'q-explain', group: 'open', label: '說明流程', ask: '接下來我會先問您一些問題，再做身體評估，結果會跟值班醫師討論。我把簾子拉上；中間有任何不舒服，隨時跟我說。', weight: 0 },
];

/** OLD CARTS 的十個按鈕。順序和代號固定，問法由每個主訴自己寫 */
export const OLD_CARTS = [
  ['q-cc', '怎麼不舒服', 1],
  ['q-onset', '何時開始', 3],
  ['q-location', '位置', 2],
  ['q-duration', '持續多久', 3],
  ['q-character', '性質', 3],
  ['q-assoc', '伴隨症狀', 3],
  ['q-factors', '加重與緩解', 3],
  ['q-radiate', '會傳到哪', 3],
  ['q-treat', '處理過嗎', 1],
  ['q-severity', '幾分', 1],
] as const;
export type OldCartsId = (typeof OLD_CARTS)[number][0];
export const oldCarts = (ask: Record<OldCartsId, string>): Q[] => OLD_CARTS.map(([id, label, weight]) => ({ id, group: 'cc', label, ask: ask[id], weight }));

/** 個人與過去病史 */
export const HISTORY: Q[] = [
  { id: 'q-pmh', group: 'hx', label: '慢性病與控制', ask: '以前有什麼慢性病嗎？像是高血壓、糖尿病、心臟或肺的毛病。平常怎麼控制，有固定回去看嗎？', weight: 2 },
  { id: 'q-family', group: 'hx', label: '家族史', ask: '家裡的人有沒有心臟病、中風或是長過不好的東西？那時候幾歲？', weight: 2 },
  { id: 'q-surgery', group: 'hx', label: '住院手術外傷', ask: '住過院、開過刀嗎？最近有沒有跌倒、撞到，或是很長一段時間躺著、坐著不動？', weight: 2 },
  { id: 'q-meds', group: 'hx', label: '用藥與過敏', ask: '現在固定吃什麼藥？有沒有另外吃保健品、草藥或止痛藥？對什麼藥或食物過敏嗎？', weight: 2 },
  { id: 'q-habits', group: 'hx', label: '菸酒檳榔', ask: '抽菸、喝酒、吃檳榔嗎？多久了，一天大概多少？', weight: 2 },
  { id: 'q-work', group: 'hx', label: '工作與接觸史', ask: '做什麼工作？工作的地方有沒有粉塵或煙？最近有沒有出遠門，身邊有沒有人生病？', weight: 1 },
  { id: 'q-life', group: 'hx', label: '飲食睡眠壓力', ask: '最近吃得下、睡得好嗎？家裡跟誰一起住，最近有沒有什麼壓力？', weight: 1 },
  { id: 'q-concern', group: 'hx', label: '擔心什麼', ask: '這次不舒服，您自己最擔心的是什麼？', weight: 2 },
];

/** 系統回顧：從頭到腳掃一遍，補上前面沒問到的。四題，每一題把那一區的症狀一次問完 */
export const REVIEW: Q[] = [
  { id: 'q-ros-gen', group: 'ros', label: '全身與頭頸', ask: '最近有沒有發燒、特別累、晚上盜汗？體重有沒有變？會不會頭痛、頭暈，聲音有沒有變、吞東西會不會卡？', weight: 2 },
  { id: 'q-ros-cp', group: 'ros', label: '心肺', ask: '有咳嗽、有痰嗎？有沒有咳出血？會心悸嗎？晚上會不會喘到要坐起來、要墊高枕頭？', weight: 2 },
  { id: 'q-ros-gi', group: 'ros', label: '腸胃與泌尿', ask: '有火燒心、想吐、肚子痛嗎？大小便的樣子和次數跟平常一樣嗎？', weight: 1 },
  { id: 'q-ros-limb', group: 'ros', label: '四肢', ask: '手腳會麻、沒力嗎？腳會不會腫，小腿會不會痛？', weight: 2 },
];

/** 身體評估：整體看一眼，再照頭頸、胸部、心臟、腹部、四肢五個模組做 */
export const EXAMS: X[] = [
  { id: 'x-look', part: '整體', label: '整體外觀', explain: '我先看一下您整體的樣子、臉色和呼吸。', weight: 2 },
  { id: 'x-head', part: '頭頸', label: '眼口與淋巴結', explain: '我要看您的眼睛和嘴巴，再摸脖子和鎖骨上面的淋巴結，肩膀請放鬆。', weight: 2 },
  { id: 'x-jvp', part: '頭頸', label: '頸靜脈與氣管', explain: '我要看脖子的血管，也摸一下氣管有沒有在正中間，請把頭稍微轉向左邊。', weight: 1 },
  { id: 'x-chest-touch', part: '胸部', label: '胸廓與按壓', explain: '我要看胸口的外形和起伏，再輕輕按幾個地方，看按了會不會出現一樣的痛。會痛請馬上說。', weight: 2 },
  { id: 'x-chest-listen', part: '胸部', label: '叩診與聽診', explain: '我要敲一敲、再聽您兩邊的呼吸聲，前面和背後都會做，請慢慢深呼吸。', weight: 2 },
  { id: 'x-heart', part: '心臟', label: '心臟聽診', explain: '我要聽您的心臟，聽診器會放在胸口幾個位置，需要把衣服解開一點。', weight: 2 },
  { id: 'x-botharms', part: '心臟', label: '兩手血壓脈搏', explain: '我要量您兩隻手的血壓、摸兩邊的脈搏，比較有沒有差別。袖帶會緊一下。', weight: 2 },
  { id: 'x-abd', part: '腹部', label: '腹部', explain: '我要看、聽、再摸您的肚子，請躺平、把膝蓋稍微彎起來。', weight: 1 },
  { id: 'x-perfusion', part: '四肢', label: '末梢與指甲', explain: '我要摸您的手和腳，看溫度和血液循環，也看一下指甲，會壓一下指尖。', weight: 2 },
  { id: 'x-legs', part: '四肢', label: '小腿與水腫', explain: '我要看兩邊的小腿，比一比粗細，按一按有沒有腫或痛。', weight: 2 },
];
