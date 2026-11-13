// 主訴模組：頭痛。症影是頭痛鳥，底下有四個診斷。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是頭痛自己的：
// 問法繞著「紅旗」問，評估多了一組神經學檢查。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const HEADACHE: ComplaintDef = {
  id: 'headache',
  name: '頭痛',
  shadow: { name: '頭痛鳥', look: 'bird', lore: '頭痛的症影。停在人的頭上，一下一下地啄。多半只是吵；有幾種啄法，是在報信。' },
  place: 'archive',
  forms: [
    { id: 'primary', name: '原發性頭痛', mark: '原', danger: false, blurb: '頭痛本身就是病：偏頭痛、緊縮型頭痛。' },
    { id: 'bleed', name: '顱內出血', mark: '血', danger: true, blurb: '血管破了：蜘蛛膜下腔出血、腦出血。' },
    { id: 'infect', name: '中樞感染', mark: '炎', danger: true, blurb: '腦膜或腦在發炎：腦膜炎、腦炎。' },
    { id: 'pressure', name: '顱內壓升高', mark: '壓', danger: true, blurb: '裡面多了東西在佔位置：腫瘤、慢慢積起來的血塊。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始痛的？是一下子就痛到最厲害，還是慢慢痛起來？從開始到最痛，大概多久？',
      'q-location': '痛在哪裡？一邊、兩邊、前額、後腦，還是整個頭？',
      'q-duration': '這一次痛多久了？以前有過一樣的痛嗎？這一次跟以前一樣嗎？',
      'q-character': '是怎麼樣的痛？一跳一跳的、像被箍住，還是像被打了一下、要炸開？',
      'q-assoc': '痛的時候還有別的不舒服嗎？想吐、怕光怕吵、脖子硬、看東西模糊或兩個影子、手腳沒力、講話不清楚？',
      'q-factors': '什麼會讓它更痛，什麼會好一點？咳嗽、用力、彎腰、早上起床、光線、躺下休息？',
      'q-radiate': '痛起來的那一刻您在做什麼？有沒有撞到頭、昏過去？痛之前有沒有看到閃光或鋸齒狀的線？',
      'q-treat': '吃過止痛藥嗎？吃什麼、多常吃、有沒有效？',
      'q-severity': '零到十分，現在幾分？是不是這輩子最痛的一次？',
    }, { 'q-radiate': '發作那一刻', 'q-duration': '跟以前比' }),
    ...HISTORY,
    ...REVIEW,
  ],
  exams: [
    { id: 'x-look', part: '整體', label: '意識與外觀', explain: '我先看一下您整體的樣子，也會問您幾個簡單的問題：今天幾號、現在在哪裡。', weight: 2 },
    { id: 'x-head', part: '頭頸', label: '頭皮、顳動脈與鼻竇', explain: '我要摸一下您的頭皮和太陽穴的血管，再按一按鼻子兩旁。', weight: 1 },
    { id: 'x-eyes', part: '頭頸', label: '瞳孔與眼底', explain: '我要用燈照您的眼睛，看瞳孔的大小和反應，再看眼睛的底部。光會有點刺眼，很快就好。', weight: 2 },
    { id: 'x-neck', part: '頭頸', label: '頸部僵硬', explain: '請您把下巴慢慢往胸口靠，我看脖子會不會硬、會不會痛。不舒服就停。', weight: 2 },
    { id: 'x-cn', part: '神經', label: '腦神經', explain: '請您眼睛跟著我的手指動，再笑一下、把舌頭伸出來，說一句話給我聽。', weight: 2 },
    { id: 'x-motor', part: '神經', label: '肌力與漂移', explain: '請您兩手往前平舉、手心朝上、閉上眼睛十秒鐘。接著我會請您用力推我、拉我。', weight: 2 },
    { id: 'x-sense', part: '神經', label: '感覺與反射', explain: '我要輕輕碰您的手和腳，請告訴我兩邊感覺一不一樣；再用小槌子敲膝蓋，劃一下腳底。', weight: 1 },
    { id: 'x-gait', part: '神經', label: '協調與步態', explain: '請您用手指碰我的手指、再碰自己的鼻尖；可以的話，下床走幾步直線給我看，我會在旁邊扶著。', weight: 1 },
    { id: 'x-heart-lung', part: '胸部', label: '心肺聽診', explain: '我要聽您的心臟和兩邊的肺，需要把衣服解開一點。', weight: 1 },
    { id: 'x-skin', part: '四肢', label: '皮膚與末梢', explain: '我要看一下您的皮膚有沒有疹子或出血點，也摸一下手腳的溫度。', weight: 1 },
  ],
  tests: [
    { id: 't-ct', label: '頭部電腦斷層（不打顯影劑）', kind: 'order', cost: 10, delay: 110 },
    { id: 't-blood', label: '抽血（血球、凝血、血液培養）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
    { id: 't-lp', label: '腰椎穿刺（請醫師評估）', kind: 'order', cost: 10 },
  ],
};
