// 主訴模組：腫脹。症影是漲水豚，底下有四個真身。
// 教案把腫脹分成單側和雙側。這裡照同一個想法：先分「兩邊都腫（全身的水多了）」還是「只腫一邊（局部回不去）」，
// 兩邊都腫的再分心臟、腎臟、肝臟三條路。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是腫脹自己的：兩邊比著看、用尺量、按下去看凹洞。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const SWELLING: ComplaintDef = {
  id: 'swelling',
  name: '腫脹',
  shadow: { name: '漲水豚', look: 'puffer', lore: '腫脹的症影。一碰就鼓起來。它只讓你看見水，不告訴你水是從哪裡多出來的，還是從哪裡回不去。' },
  forms: [
    { id: 'cardiac', name: '心臟', mark: '心', danger: true, blurb: '心臟打不出去，水往回積：心衰竭。兩邊一起腫，常常跟著喘。' },
    { id: 'renal', name: '腎臟', mark: '腎', danger: true, blurb: '腎臟把蛋白漏掉，或是排不出水：腎病症候群、腎衰竭。兩邊一起腫，眼皮也腫。' },
    { id: 'hepatic', name: '肝臟', mark: '肝', danger: false, blurb: '肝臟硬了，水積在肚子和腳：肝硬化合併腹水。' },
    { id: 'local', name: '局部', mark: '局', danger: true, blurb: '只有一邊，水回不去：深部靜脈栓塞、蜂窩性組織炎、淋巴水腫。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始腫的？是突然腫起來，還是慢慢腫？',
      'q-location': '腫在哪裡？一邊還是兩邊？腳、肚子、臉和眼皮，哪些地方有？',
      'q-duration': '一天裡什麼時候最腫？早上起來，還是站了一天之後？睡一覺會消嗎？',
      'q-character': '腫的地方按下去會不會凹一個洞？會不會痛、發紅、發燙？',
      'q-assoc': '除了腫，還有別的不舒服嗎？喘、躺不平、小便有泡泡或變少、肚子脹、眼白變黃、胸痛？',
      'q-factors': '什麼會讓它更腫，什麼會消一點？久站、吃得鹹、把腳抬高、走路？',
      'q-radiate': '這段時間體重有沒有變？鞋子、戒指、褲頭有沒有變緊？小便的量跟平常比呢？',
      'q-treat': '這段時間看過大夫、吃過什麼藥嗎？有沒有自己處理過？',
      'q-severity': '現在腫到影響走路、穿鞋或呼吸了嗎？能平躺嗎？',
    }, { 'q-location': '腫在哪裡', 'q-duration': '一天裡的變化', 'q-character': '按下去怎樣', 'q-radiate': '體重與尿量', 'q-severity': '影響多大' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 腫脹的評估：先看全身的水（臉、頸靜脈、心、肺、肚子、肝的記號），再把兩隻腳比著看、量、按
  exams: [
    { id: 'x-look', part: '整體', label: '整體、臉與眼皮', explain: '我先看一下您整體的樣子、呼吸，還有臉和眼皮有沒有腫。', weight: 2 },
    { id: 'x-jvp', part: '頭頸', label: '頸靜脈', explain: '我要看脖子的血管有沒有鼓起來，請把頭稍微轉向左邊。', weight: 2 },
    { id: 'x-heart', part: '心臟', label: '心臟聽診', explain: '我要聽您的心臟，聽診器會放在胸口幾個位置，需要把衣服解開一點。', weight: 1 },
    { id: 'x-lung', part: '胸部', label: '肺部叩診與聽診', explain: '我要敲一敲、再聽您兩邊的呼吸聲，背後也會聽，請慢慢深呼吸。', weight: 2 },
    { id: 'x-abd', part: '腹部', label: '腹部與腹水', explain: '我要看、聽、敲、摸您的肚子。等一下會請您側躺，我再敲一次，看肚子裡有沒有水。', weight: 2 },
    { id: 'x-liver', part: '皮膚', label: '黃疸與肝的記號', explain: '我要看您的眼白、胸口和手掌的皮膚，找幾個跟肝臟有關的記號。', weight: 1 },
    { id: 'x-compare', part: '四肢', label: '兩腳比較與腿圍', explain: '我要把兩隻腳並排比一比，再用尺在同一個高度量兩邊的小腿。請把褲管捲起來、鞋襪脫掉。', weight: 2 },
    { id: 'x-pitting', part: '四肢', label: '凹陷性水腫的範圍', explain: '我要用手指在腳背、小腿和後腰按幾秒鐘，看會不會留下凹洞、腫到多高。', weight: 2 },
    { id: 'x-calf', part: '四肢', label: '小腿壓痛與皮膚', explain: '我要輕輕按兩邊的小腿，摸一摸皮膚的溫度，看有沒有紅、有沒有傷口。會痛請馬上說。', weight: 2 },
    { id: 'x-perfusion', part: '四肢', label: '末梢、脈搏與雙手', explain: '我要摸您的手和腳，看溫度和腳背的脈搏；也請您兩手往前平舉、手腕往上翹幾秒鐘。', weight: 1 },
  ],
  tests: [
    { id: 't-urine', label: '驗尿（尿蛋白）', kind: 'order', cost: 10, delay: 60 },
    { id: 't-blood', label: '抽血（白蛋白、腎肝指數、心臟指數）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10, delay: 100 },
    { id: 't-us', label: '下肢靜脈超音波', kind: 'order', cost: 10, delay: 110 },
  ],
};
