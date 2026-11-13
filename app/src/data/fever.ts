// 主訴模組：發燒。症影是發熱蜥，底下有四個診斷。
// 教案把發燒分成感染和非感染兩類；這裡把感染照「火在哪裡」再拆成三個。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是發燒自己的：從頭到腳找源頭。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const FEVER: ComplaintDef = {
  id: 'fever',
  name: '發燒',
  shadow: { name: '發熱蜥', look: 'newt', lore: '發燒的症影。背上的炭一明一滅。它只告訴你「燒起來了」，不告訴你火是從哪裡燒起來的。' },
  place: 'archive',
  forms: [
    { id: 'lung', name: '呼吸道', mark: '肺', danger: true, blurb: '火在肺裡：肺炎、支氣管的感染。' },
    { id: 'urinary', name: '泌尿道', mark: '尿', danger: true, blurb: '火在腎臟和膀胱：腎盂腎炎、泌尿道感染。' },
    { id: 'skin', name: '皮膚與軟組織', mark: '膚', danger: true, blurb: '火在皮膚底下：蜂窩性組織炎、傷口感染，最怕往深處燒。' },
    { id: 'other', name: '非感染', mark: '非', danger: false, blurb: '不是細菌點的火：藥物、腫瘤、免疫的毛病、血栓。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始發燒的？是突然燒起來，還是慢慢熱起來？',
      'q-location': '有量體溫嗎？最高幾度？是在哪裡量的？',
      'q-duration': '是一直燒，還是會退、退了又燒？',
      'q-character': '燒起來之前會不會發冷、全身發抖？會不會流很多汗？',
      'q-assoc': '除了發燒，還有哪裡不舒服？咳嗽、喉嚨痛、小便痛、腰痛、肚子痛、拉肚子、哪裡紅腫、頭痛？',
      'q-factors': '什麼會讓您更不舒服，什麼會好一點？吃退燒藥會退嗎？',
      'q-radiate': '身上有沒有傷口、破皮，或是長了什麼？最近有沒有拔牙、打針、放過管子？',
      'q-treat': '這幾天看過大夫、吃過什麼藥嗎？有沒有吃抗生素？',
      'q-severity': '現在精神怎麼樣？吃得下、喝得下嗎？小便的量跟平常比呢？',
    }, { 'q-location': '量到幾度', 'q-duration': '燒的型態', 'q-character': '畏寒發抖', 'q-radiate': '傷口與管路', 'q-severity': '精神與進食' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 找源頭：從頭到腳，每一個可能藏火的地方都看到。皮膚要真的看，襪子要脫
  exams: [
    { id: 'x-look', part: '整體', label: '整體外觀', explain: '我先看一下您整體的樣子、精神和臉色。', weight: 2 },
    { id: 'x-head', part: '頭頸', label: '口咽與淋巴結', explain: '我要看您的喉嚨和嘴巴，再摸脖子和耳朵後面的淋巴結。', weight: 1 },
    { id: 'x-neck', part: '頭頸', label: '頸部僵硬', explain: '請您把下巴慢慢往胸口靠，我看脖子會不會硬、會不會痛。', weight: 2 },
    { id: 'x-chest-listen', part: '胸部', label: '胸部叩診與聽診', explain: '我要敲一敲、再聽您兩邊的呼吸聲，前面和背後都會做，請慢慢深呼吸。', weight: 2 },
    { id: 'x-heart', part: '心臟', label: '心臟聽診', explain: '我要聽您的心臟，聽診器會放在胸口幾個位置，需要把衣服解開一點。', weight: 1 },
    { id: 'x-abd', part: '腹部', label: '腹部', explain: '我要看、聽、再摸您的肚子，請躺平、把膝蓋稍微彎起來。', weight: 1 },
    { id: 'x-cva', part: '腹部', label: '腰部敲擊', explain: '請您坐起來，我要輕輕敲一下兩邊腰的後面。會痛請馬上說。', weight: 2 },
    { id: 'x-skin', part: '四肢', label: '皮膚、傷口與腳', explain: '我要把全身的皮膚看一遍，包括背後和兩隻腳。請讓我把襪子脫掉。', weight: 2 },
    { id: 'x-legs', part: '四肢', label: '下肢與關節', explain: '我要看兩邊的腿和關節，比一比粗細，摸一摸有沒有腫、熱或痛。', weight: 1 },
    { id: 'x-perfusion', part: '四肢', label: '末梢循環', explain: '我要摸您的手和腳，看溫度和血液循環，會壓一下指尖。', weight: 2 },
  ],
  tests: [
    { id: 't-urine', label: '驗尿與尿液培養', kind: 'order', cost: 10, delay: 60 },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, delay: 100 },
    { id: 't-blood', label: '抽血（血球、乳酸、血液培養）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
  ],
};
