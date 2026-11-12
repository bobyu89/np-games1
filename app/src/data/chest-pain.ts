// 主訴模組：胸痛。症影是鐵翅蛾，底下有四個真身。
// 開場、病史、系統回顧和身體評估用共用的骨架（skeleton.ts）；這裡只寫胸痛自己的部分。
import type { ComplaintDef } from '../core/module.ts';
import { EXAMS, HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const CHEST_PAIN: ComplaintDef = {
  id: 'chest-pain',
  name: '胸痛',
  shadow: { name: '鐵翅蛾', look: 'moth', lore: '胸痛的症影。翅膀像鐵片一樣壓在胸口。同樣的外形底下，可能是好幾種不同的病。' },
  forms: [
    { id: 'cardiac', name: '心因性', mark: '心', danger: true, blurb: '心臟的血管堵住或快要堵住：心絞痛、急性冠心症。' },
    { id: 'vascular', name: '血管急症', mark: '脈', danger: true, blurb: '大血管出事：主動脈剝離、肺栓塞。' },
    { id: 'tumor', name: '胸腔腫瘤', mark: '瘤', danger: true, blurb: '肺或縱膈長了東西，壓迫或侵犯到胸壁、氣管。' },
    { id: 'msk', name: '肌肉骨骼', mark: '肌', danger: false, blurb: '胸壁的肌肉、肋骨或軟骨拉傷、發炎。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始的？那時候正在做什麼？',
      'q-location': '痛在哪裡？可以用手指給我看嗎？',
      'q-duration': '一次痛多久？是一直痛，還是一陣一陣的？',
      'q-character': '是怎麼樣的痛？悶、緊、刺、燒，還是像被撕開？',
      'q-assoc': '痛的時候，還有別的不舒服嗎？像是冒冷汗、想吐、喘、頭暈、咳嗽。',
      'q-factors': '什麼會讓它更痛，什麼會讓它好一點？出力、深呼吸、轉身、休息？',
      'q-radiate': '會痛到別的地方嗎？肩膀、手臂、下巴或背後？',
      'q-treat': '這段時間看過大夫、吃過什麼藥嗎？有沒有用？',
      'q-severity': '零到十分，最痛的時候幾分？現在幾分？',
    }),
    ...HISTORY,
    ...REVIEW,
  ],
  exams: EXAMS,
  tests: [
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
    { id: 't-blood', label: '抽血（心肌旋蛋白、D-dimer）', kind: 'order', cost: 20 },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, delay: 120 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
  ],
};
