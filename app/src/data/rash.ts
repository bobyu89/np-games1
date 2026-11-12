// 主訴模組：皮膚疹子。症影是點墨魷，底下有四個真身。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是疹子自己的：
// 問法繞著「怎麼開始、長在哪、之前碰了什麼、疹子以外還有什麼」，評估是把疹子看清楚，再看皮膚以外的地方。
// 疹子常常長在衣服底下：每一項評估的說明都把隱私寫進去。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const RASH: ComplaintDef = {
  id: 'rash',
  name: '皮膚疹子',
  shadow: { name: '點墨魷', look: 'squid', lore: '皮膚疹子的症影。游過哪裡，就在哪裡留下墨點。點是什麼顏色、壓了褪不褪、排成什麼樣子，都是它寫的字。要讀的人自己湊近去看。' },
  forms: [
    { id: 'infect', name: '感染', mark: '感', danger: true, blurb: '病毒或細菌留下的疹子：帶狀疱疹、蜂窩性組織炎、病毒疹。' },
    { id: 'allergy', name: '過敏與藥物', mark: '敏', danger: true, blurb: '身體對吃的、用的、碰的東西起反應：蕁麻疹、藥物疹，最重的是過敏性休克。' },
    { id: 'immune', name: '發炎與免疫', mark: '免', danger: false, blurb: '皮膚自己在發炎，或是免疫系統在攻擊自己：濕疹、乾癬、紅斑性狼瘡。' },
    { id: 'bleed', name: '出血與血管', mark: '紫', danger: true, blurb: '血跑到皮膚裡，壓了不褪色：紫斑、血小板太低、血管發炎。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '疹子是什麼時候出來的？是一下子冒出來，還是幾天裡慢慢多起來？',
      'q-location': '最先長在哪裡？現在哪些地方有？是只有一邊，還是兩邊都有？',
      'q-duration': '出來之後有沒有變？會不會這裡消了、那裡又長？以前長過一樣的嗎？',
      'q-character': '會痛、會癢，還是沒什麼感覺？是哪一種痛：刺的、燒的，還是一碰就痛？',
      'q-assoc': '除了疹子，還有哪裡不舒服？發燒、喉嚨緊、喘、嘴巴或眼睛破、關節痛、哪裡在流血？',
      'q-factors': '什麼會讓它更厲害，什麼會好一點？曬太陽、熱、抓、摩擦、碰到水？',
      'q-radiate': '疹子出來之前，有沒有吃了、擦了、碰了什麼新的東西？新的藥、沒吃過的食物、被蟲咬？',
      'q-treat': '擦過藥、吃過藥嗎？有沒有用？',
      'q-severity': '現在最困擾您的是什麼？睡得著嗎？呼吸、吞口水有沒有不順？',
    }, { 'q-location': '長在哪裡', 'q-duration': '怎麼變化', 'q-character': '痛或癢', 'q-radiate': '之前碰了什麼', 'q-severity': '影響多大' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 先把疹子看清楚（分布、型態、壓了褪不褪），再看皮膚以外的地方（黏膜、淋巴結、關節、呼吸、循環）
  exams: [
    { id: 'x-look', part: '整體', label: '整體與呼吸', explain: '我先看一下您整體的樣子，也聽一下您說話的聲音和呼吸。', weight: 2 },
    { id: 'x-spread', part: '皮膚', label: '疹子的分布', explain: '我要看疹子長在哪些地方。簾子我拉上了，一次只請您露出一個部位，看完就蓋回去。', weight: 2 },
    { id: 'x-shape', part: '皮膚', label: '疹子的型態', explain: '我要靠近一點看疹子的樣子，也會輕輕摸一下：是平的、凸的，有沒有水泡。會痛請馬上說。', weight: 2 },
    { id: 'x-press', part: '皮膚', label: '按壓褪不褪色', explain: '我要拿一片玻璃輕輕壓在疹子上，看顏色會不會褪掉。不會痛。', weight: 2 },
    { id: 'x-mucosa', part: '頭頸', label: '口腔與眼睛', explain: '我要看您的嘴唇、嘴巴裡面和眼睛，請把嘴張開。', weight: 2 },
    { id: 'x-scalp', part: '頭頸', label: '頭皮與指甲', explain: '我要撥開頭髮看一下頭皮，也看一下您的指甲。', weight: 1 },
    { id: 'x-nodes', part: '頭頸', label: '淋巴結', explain: '我要摸脖子和腋下的淋巴結，肩膀請放鬆。', weight: 1 },
    { id: 'x-joints', part: '四肢', label: '關節', explain: '我要看您的手指、手腕和膝蓋，摸一摸有沒有腫、熱或痛。', weight: 1 },
    { id: 'x-chest-listen', part: '胸部', label: '胸部聽診', explain: '我要聽您兩邊的呼吸聲，請慢慢深呼吸。', weight: 2 },
    { id: 'x-perfusion', part: '四肢', label: '末梢循環', explain: '我要摸您的手和腳，看溫度和血液循環，會壓一下指尖。', weight: 1 },
  ],
  tests: [
    { id: 't-blood', label: '抽血（血球、血小板、發炎指數）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-urine', label: '驗尿', kind: 'order', cost: 10, delay: 60 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
    { id: 't-swab', label: '皮膚或水泡的檢體（請醫師評估）', kind: 'order', cost: 10 },
  ],
};
