// 主訴模組：腹痛。症影是腹痛蟹，底下有四個診斷，照肚子的四個角落分。
// 開場、病史、系統回顧用共用的骨架；身體評估換成腹部的做法（視診 → 聽診 → 叩診 → 觸診）。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const ABDOMEN: ComplaintDef = {
  id: 'abdomen',
  name: '腹痛',
  shadow: { name: '腹痛蟹', look: 'crab', lore: '腹痛的症影。把一條繩子在肚子裡打了結，越扯越緊。結打在哪裡、怎麼打的，每一次都不一樣。' },
  place: 'market',
  forms: [
    { id: 'biliary', name: '膽囊與膽道', mark: '膽', danger: true, blurb: '右上腹：膽結石卡住、膽囊發炎。' },
    { id: 'pancreas', name: '胰臟與胃', mark: '胰', danger: true, blurb: '上腹到左上腹：胰臟炎、消化性潰瘍。' },
    { id: 'appendix', name: '闌尾', mark: '闌', danger: true, blurb: '右下腹：闌尾炎。常常從肚臍附近開始痛。' },
    { id: 'diverticulum', name: '大腸憩室', mark: '憩', danger: true, blurb: '左下腹：憩室炎。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始痛的？那時候正在做什麼、剛吃了什麼？',
      'q-location': '現在痛在哪裡？請用一根手指指給我看。一開始也是痛在那裡嗎？',
      'q-duration': '是一直痛，還是一陣一陣的？一陣大概多久？',
      'q-character': '是怎麼樣的痛？絞、脹、悶、刺，還是燒？',
      'q-assoc': '有沒有不想吃、想吐、發燒、拉肚子？眼白或皮膚有沒有變黃？',
      'q-factors': '吃東西、走路、咳嗽、換姿勢，會更痛還是好一點？',
      'q-radiate': '會痛到別的地方嗎？背、肩膀，或是下面鼠蹊那邊？',
      'q-treat': '這段時間看過大夫、吃過什麼藥嗎？有沒有用？',
      'q-severity': '零到十分，最痛的時候幾分？現在幾分？',
    }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 腹部照「看、聽、敲、摸」的順序，摸放最後：先摸會改變腸音，也會讓病人繃起來
  exams: [
    { id: 'x-look', part: '整體', label: '整體外觀', explain: '我先看一下您整體的樣子、臉色，還有躺著的姿勢。', weight: 2 },
    { id: 'x-head', part: '頭頸', label: '眼白與口腔', explain: '我要看您的眼白和嘴巴裡面，看有沒有變黃、有沒有太乾。', weight: 1 },
    { id: 'x-heart-lung', part: '胸部', label: '心肺聽診', explain: '我要聽您的心臟和兩邊的肺，需要把衣服解開一點。', weight: 1 },
    { id: 'x-abd-look', part: '腹部', label: '視診與聽診', explain: '我要看您的肚子，再用聽診器聽腸子的聲音。請躺平、膝蓋彎起來，衣服拉到胸口下面。', weight: 2 },
    { id: 'x-abd-perc', part: '腹部', label: '叩診', explain: '我要輕輕敲您肚子的幾個地方。會痛請馬上說。', weight: 1 },
    { id: 'x-abd-light', part: '腹部', label: '輕觸診', explain: '我先輕輕地摸，從不痛的地方開始，最後才摸痛的地方。', weight: 2 },
    { id: 'x-abd-deep', part: '腹部', label: '深觸診與反彈痛', explain: '接下來會按深一點，再很快放開，看放開的時候會不會痛。放開之前我會先跟您說。', weight: 2 },
    { id: 'x-abd-sign', part: '腹部', label: '特殊徵象', explain: '我要做幾個特別的檢查：按著右邊肋骨下面請您深吸氣、按左下腹、再把右腿往後伸。', weight: 2 },
    { id: 'x-cva', part: '腹部', label: '腰部敲擊', explain: '請您坐起來，我要輕輕敲一下兩邊腰的後面。', weight: 1 },
    { id: 'x-perfusion', part: '四肢', label: '末梢與皮膚', explain: '我要摸您的手和腳，看溫度和血液循環，也看一下皮膚的顏色。', weight: 1 },
  ],
  tests: [
    { id: 't-us', label: '腹部超音波', kind: 'order', cost: 10, delay: 110 },
    { id: 't-blood', label: '抽血（血球、肝膽胰指數）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-urine', label: '驗尿（需要時含驗孕）', kind: 'order', cost: 10, delay: 60 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
  ],
};
