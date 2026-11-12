// 主訴模組：背痛。症影是負石龜，底下有四個真身。
// 教案把背痛分成泌尿和骨骼兩類；這裡把「骨骼」拆成一般的肌肉骨骼和不能等的脊椎問題，再加上血管。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是背痛自己的：
// 問法繞著「紅旗」問，評估多了下肢的神經學檢查，還有肚子和脈搏。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const BACK_PAIN: ComplaintDef = {
  id: 'back-pain',
  name: '背痛',
  shadow: { name: '負石龜', look: 'tortoise', lore: '背痛的症影。背上馱著一疊石頭，走一步、沉一分。石頭多半只是累；有幾塊，底下壓著東西。' },
  forms: [
    { id: 'msk', name: '肌肉骨骼', mark: '肌', danger: false, blurb: '筋和肌肉的事：拉傷、扭到、勞損。' },
    { id: 'urinary', name: '泌尿', mark: '尿', danger: true, blurb: '痛從腎臟和輸尿管來：結石、腎盂腎炎。' },
    { id: 'spine', name: '脊椎與神經', mark: '脊', danger: true, blurb: '骨頭裡或神經被壓住：馬尾症候群、壓迫性骨折、感染、腫瘤。' },
    { id: 'vascular', name: '血管與內臟', mark: '脈', danger: true, blurb: '痛從肚子裡的大血管來：腹主動脈瘤、主動脈剝離。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始痛的？那時候在做什麼？是突然痛起來，還是慢慢來的？',
      'q-location': '痛在哪裡？正中間、一邊的腰，還是更上面？可以指給我看嗎？',
      'q-duration': '是一直痛，還是一陣一陣的？休息的時候、晚上躺著，會不會痛？',
      'q-character': '是怎麼樣的痛？痠、緊、像被扯住，還是像在絞、在撕？',
      'q-assoc': '除了痛，還有別的不舒服嗎？腳麻、腳沒力、小便解不出來或漏出來、大便失禁、屁股和胯下麻、發燒、小便有血？',
      'q-factors': '什麼會讓它更痛，什麼會好一點？彎腰、咳嗽、走路、換姿勢、躺著不動？',
      'q-radiate': '痛會跑到別的地方嗎？屁股、大腿、小腿、腳底，還是鼠蹊、肚子？',
      'q-treat': '這段時間看過大夫、吃過藥、貼過膏藥或推拿過嗎？有沒有用？',
      'q-severity': '零到十分，現在幾分？會不會痛到坐也不是、站也不是？',
    }, { 'q-duration': '休息與夜裡' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 背、神經、肚子、脈搏：背痛的源頭不一定在背上。會陰那一帶的感覺沒有人想查，但不查就會漏掉馬尾
  exams: [
    { id: 'x-look', part: '整體', label: '姿勢與步態', explain: '我先看您站著、走幾步的樣子，還有整體的臉色。站不住的話不用勉強。', weight: 2 },
    { id: 'x-spine', part: '背部', label: '脊椎觸診與敲擊', explain: '我要從上往下摸您的脊椎和兩邊的肌肉，再輕輕敲幾下，請把上衣拉起來。會痛請馬上說。', weight: 2 },
    { id: 'x-move', part: '背部', label: '腰的活動度', explain: '請您慢慢往前彎、往後仰、往兩邊側彎，做到會痛就停。', weight: 1 },
    { id: 'x-cva', part: '背部', label: '腰部敲擊', explain: '我要輕輕敲一下兩邊腰的後面、肋骨下緣的地方。', weight: 2 },
    { id: 'x-slr', part: '神經', label: '直腿抬高', explain: '請您躺平，我會把您的腿伸直、慢慢抬起來，兩邊都做。腿後面會痛、會麻就告訴我。', weight: 2 },
    { id: 'x-motor', part: '神經', label: '下肢肌力', explain: '請您用力把腳掌往上翹、往下踩，我會用手擋著。可以的話，再用腳跟和腳尖各走幾步。', weight: 2 },
    { id: 'x-sense', part: '神經', label: '感覺（含會陰）', explain: '我要輕輕碰您的腿和腳，兩邊比一比。接著要檢查屁股中間和胯下的感覺：這裡比較私密，我會拉上簾子、請人陪著，您同意了我才做。', weight: 2 },
    { id: 'x-reflex', part: '神經', label: '反射', explain: '我用小槌子敲您的膝蓋和腳跟後面，再劃一下腳底。', weight: 1 },
    { id: 'x-abd', part: '腹部', label: '腹部', explain: '我要看、聽、再輕輕摸您的肚子，特別是肚臍附近和下腹。請躺平、膝蓋彎起來。', weight: 2 },
    { id: 'x-pulse', part: '四肢', label: '下肢脈搏與皮膚', explain: '我要摸您兩邊鼠蹊和腳背的脈搏，比一比，也看腳的顏色和溫度。', weight: 2 },
  ],
  tests: [
    { id: 't-urine', label: '驗尿', kind: 'order', cost: 10, delay: 60 },
    { id: 't-blood', label: '抽血（血球、腎功能、發炎指數）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-us', label: '超音波（主動脈、腎臟、膀胱）', kind: 'order', cost: 10, delay: 100 },
    { id: 't-img', label: '腰椎 X 光（磁振造影請醫師評估）', kind: 'order', cost: 10, delay: 110 },
  ],
};
