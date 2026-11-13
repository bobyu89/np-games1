// 主訴模組：體重減輕。症影是消瘦鼠，底下有四個診斷。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是體重減輕自己的。
// 第一個要分的是：吃得多還瘦，還是吃不下所以瘦。再來是大便、心情，和「誰煮飯、跟誰吃」。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const WEIGHT_LOSS: ComplaintDef = {
  id: 'weight-loss',
  name: '體重減輕',
  shadow: { name: '消瘦鼠', look: 'mouse', lore: '體重減輕的症影。每天夜裡，把月亮啃掉一小口。一天看不出來；等到看得出來，已經少了一大塊。' },
  place: 'quiet',
  forms: [
    { id: 'tumor', name: '惡性腫瘤', mark: '瘤', danger: true, blurb: '身體裡長了東西，吃不下，也被它吃掉。' },
    { id: 'endocrine', name: '內分泌與代謝', mark: '代', danger: true, blurb: '身體燒得太快：甲狀腺亢進、糖尿病。吃得多，還是瘦。' },
    { id: 'gut', name: '腸胃與吸收', mark: '腸', danger: false, blurb: '吃進去，留不住：發炎性腸道疾病、吸收不良、吞嚥困難。' },
    { id: 'mind', name: '身心與生活', mark: '心', danger: true, blurb: '不想吃，或是吃不到：憂鬱、失智、牙咬不動、沒有人煮。要想到自傷。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始瘦的？是慢慢瘦，還是這一陣子掉得特別快？',
      'q-location': '以前大概多重，現在多重？褲頭、腰帶鬆了多少？有沒有刻意少吃，或是多動？',
      'q-duration': '胃口怎麼樣？是吃得跟以前一樣多、甚至更多，還是不想吃、吃不下？',
      'q-character': '一天吃幾餐，一餐大概吃多少？是吃一點就飽、吞不下去，還是吃了會痛？',
      'q-assoc': '除了瘦，還有哪裡不一樣？心悸、怕熱、手抖、口渴、尿多、發燒、盜汗、咳嗽？',
      'q-factors': '大便跟以前一樣嗎？一天幾次？有沒有拉肚子、變黑、帶血，或是油油的浮在水上？',
      'q-radiate': '這陣子心情怎麼樣？有沒有提不起勁、原本喜歡的事不想做了？晚上睡得著嗎？',
      'q-treat': '這段時間看過大夫、吃過什麼藥或補品嗎？有沒有用？',
      'q-severity': '平常誰煮飯、誰買菜？是一個人吃，還是有人一起？買吃的錢夠不夠，牙齒咬得動嗎？',
    }, { 'q-onset': '瘦了多久', 'q-location': '瘦了多少', 'q-duration': '胃口', 'q-character': '吃的量與吞嚥', 'q-factors': '大便的樣子', 'q-radiate': '心情與睡眠', 'q-severity': '誰煮飯' }),
    ...HISTORY,
    ...REVIEW,
  ],
  exams: [
    { id: 'x-look', part: '整體', label: '體型與外觀', explain: '我先看一下您整體的樣子，也看一下衣服和腰帶合不合身。', weight: 2 },
    { id: 'x-eyes', part: '頭頸', label: '眼睛與甲狀腺', explain: '我要看您的眼睛，再摸一下脖子前面。等一下請您吞一口口水。', weight: 2 },
    { id: 'x-mouth', part: '頭頸', label: '口腔與牙齒', explain: '請把嘴巴張開，我看一下牙齒、舌頭和嘴巴裡面。', weight: 1 },
    { id: 'x-nodes', part: '頭頸', label: '淋巴結', explain: '我要摸脖子、鎖骨上面和腋下的淋巴結，肩膀請放鬆。', weight: 2 },
    { id: 'x-heart', part: '心臟', label: '心臟聽診', explain: '我要聽您的心臟，聽診器會放在胸口幾個位置，需要把衣服解開一點。', weight: 1 },
    { id: 'x-chest', part: '胸部', label: '胸部聽診', explain: '我要聽您兩邊的呼吸聲，前面和背後都會聽，請慢慢深呼吸。', weight: 1 },
    { id: 'x-abd', part: '腹部', label: '腹部與肛門', explain: '我要看、聽、再摸您的肚子，請躺平、把膝蓋稍微彎起來。如果需要看肛門周圍，我會先跟您說、把簾子拉好，您同意了才看。', weight: 2 },
    { id: 'x-skin', part: '皮膚', label: '皮膚與雙手', explain: '我要看一下您的皮膚，再請您把兩隻手往前平舉、手指張開。', weight: 2 },
    { id: 'x-motor', part: '神經', label: '肌力與反射', explain: '請您試著不用手撐，從椅子上站起來；再用力推我的手。我也會敲一下膝蓋。', weight: 1 },
    { id: 'x-mood', part: '神經', label: '情緒與認知', explain: '我想問您兩個關於心情的問題，再請您記三樣東西、告訴我今天是幾號。沒有對錯，慢慢來。', weight: 2 },
  ],
  tests: [
    { id: 't-blood', label: '抽血（血球、血糖、甲狀腺、發炎指數）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-stool', label: '糞便潛血', kind: 'order', cost: 10, delay: 90 },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, delay: 100 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
  ],
};
