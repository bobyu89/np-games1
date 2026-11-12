// 主訴模組：喘。症影是氣促蛙，底下有四個診斷。
// 開場、病史、系統回顧和身體評估用共用的骨架；這裡只寫喘自己的部分。
import type { ComplaintDef } from '../core/module.ts';
import { EXAMS, HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const DYSPNEA: ComplaintDef = {
  id: 'dyspnea',
  name: '喘',
  shadow: { name: '氣促蛙', look: 'frog', lore: '喘的症影。肚子像風箱一樣一鼓一縮，卻怎麼也吸不滿。同樣是喘，問題可能在心臟、在氣管、在肺，或是突然出的事。' },
  forms: [
    { id: 'cardiac', name: '心因性', mark: '心', danger: true, blurb: '心臟打不出去，水積回肺裡：心衰竭、肺水腫。' },
    { id: 'airway', name: '氣道阻塞', mark: '氣', danger: true, blurb: '氣管變窄，氣吐不出去：慢性阻塞性肺病或氣喘的急性發作。' },
    { id: 'infect', name: '肺部感染', mark: '炎', danger: true, blurb: '肺泡被發炎的東西佔住：肺炎。' },
    { id: 'sudden', name: '突發急症', mark: '急', danger: true, blurb: '一下子就喘起來：氣胸、肺栓塞。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始喘的？是突然喘起來，還是慢慢變喘？',
      'q-location': '什麼時候會喘？走路、爬樓梯，還是坐著不動也喘？現在能走多遠？',
      'q-duration': '是一直喘，還是一陣一陣的？一陣大概多久？',
      'q-character': '是吸不進去、吐不出來，還是胸口悶住？',
      'q-assoc': '喘的時候，還有別的不舒服嗎？咳嗽、痰、發燒、胸痛、心悸、腳腫？',
      'q-factors': '什麼會讓您更喘，什麼會好一點？出力、躺平、冷空氣、坐起來、用藥？',
      'q-radiate': '晚上睡覺要墊幾個枕頭？會不會睡到一半喘醒，要坐起來？',
      'q-treat': '這段時間看過大夫、用過什麼藥嗎？有沒有用？',
      'q-severity': '零到十分，現在有多喘？說話會不會斷斷續續？',
    }, { 'q-location': '什麼時候喘', 'q-radiate': '夜裡與躺平', 'q-severity': '有多喘' }),
    ...HISTORY,
    ...REVIEW,
  ],
  exams: EXAMS,
  tests: [
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, delay: 100 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
    { id: 't-blood', label: '抽血（血球、BNP、動脈血氣）', kind: 'order', cost: 20 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
  ],
};
