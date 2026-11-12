// 主訴模組：感覺異常。症影是電絲鰻，底下有四個真身。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是感覺異常自己的。
// 這個主訴最重要的兩件事是「分布」和「時間」：麻的範圍畫出來是什麼形狀，是突然還是慢慢來的。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const PARESTHESIA: ComplaintDef = {
  id: 'paresthesia',
  name: '感覺異常',
  shadow: { name: '電絲鰻', look: 'eel', lore: '感覺異常的症影。游過的地方又麻又刺，像有細細的電。它從哪一段神經游過去，麻的地方就畫出那一段的形狀。' },
  forms: [
    { id: 'brain', name: '腦', mark: '腦', danger: true, blurb: '腦的血管堵住或破掉：中風、暫時性腦缺血。' },
    { id: 'cord', name: '脊髓與神經根', mark: '髓', danger: true, blurb: '脊髓或神經根出了問題：脊髓的病變、頸椎或腰椎的壓迫。' },
    { id: 'nerve', name: '周邊神經', mark: '末', danger: false, blurb: '手腳末端的神經：糖尿病的神經病變、腕隧道症候群。' },
    { id: 'metabolic', name: '代謝與其他', mark: '代', danger: false, blurb: '不是哪一條神經壞了：過度換氣、電解質不平衡這一類全身性的原因。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始的？是一下子就麻了，還是慢慢麻起來的？最後一次完全正常，是什麼時候？',
      'q-location': '麻在哪裡？請用手指把範圍畫給我看。一邊還是兩邊？到哪裡為止？',
      'q-duration': '是一直麻，還是一陣一陣的？有沒有越來越往上、越來越大片？',
      'q-character': '是怎麼樣的感覺？麻麻的、像針在刺、像火在燒、像有電，還是摸了沒感覺？',
      'q-assoc': '除了麻，會不會沒力、東西拿不住？講話會不會不清楚、臉會不會歪？走路穩不穩？大小便有沒有變？',
      'q-factors': '什麼時候最明顯？晚上、天黑、低頭、手用久了、緊張的時候？什麼會讓它好一點？',
      'q-radiate': '會不會像電一樣竄？從脖子竄到手，還是從腰竄到腳？咳嗽、打噴嚏會不會更明顯？',
      'q-treat': '看過大夫、吃過什麼藥、自己做過什麼處理嗎？有沒有用？',
      'q-severity': '這個麻對您的影響有多大？會不會拿不住東西、扣不了扣子、踩不到地、睡不著？',
    }, { 'q-location': '畫出範圍', 'q-duration': '一直或一陣', 'q-radiate': '會不會竄', 'q-severity': '影響多大' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 從上到下：先看腦（言語、臉、手的平舉），再看感覺的分布和種類，最後是反射、步態和脊椎。兩腳麻的人，鞋襪要脫
  exams: [
    { id: 'x-look', part: '整體', label: '意識與言語', explain: '我先看一下您整體的樣子，也請您說一句話、告訴我今天幾號。', weight: 2 },
    { id: 'x-face', part: '頭頸', label: '臉與腦神經', explain: '請您笑一下、閉緊眼睛、把舌頭伸出來，眼睛跟著我的手指動。我也會輕輕碰您兩邊的臉。', weight: 2 },
    { id: 'x-arms', part: '神經', label: '平舉與肌力', explain: '請您兩手往前平舉、手心朝上、閉上眼睛十秒。接著握我的手、推我、拉我；腳也一樣。', weight: 2 },
    { id: 'x-touch', part: '神經', label: '感覺的分布', explain: '我會用棉花和鈍的針輕輕碰您的手和腳。請閉上眼睛，告訴我碰到哪裡、兩邊一不一樣。', weight: 2 },
    { id: 'x-vib', part: '神經', label: '震動覺與位置覺', explain: '我把音叉放在您的腳趾和手指上，有感覺到震動請說。接著我會動您的腳趾，請說是往上還是往下。', weight: 2 },
    { id: 'x-foot', part: '四肢', label: '尼龍絲與足部', explain: '請讓我把您的鞋襪脫掉。我要看腳底和趾縫，再用一根細細的尼龍絲碰幾個點，有感覺就說「有」。', weight: 2 },
    { id: 'x-reflex', part: '神經', label: '反射', explain: '我用小槌子敲您的手肘、膝蓋和腳跟，再劃一下腳底。', weight: 1 },
    { id: 'x-gait', part: '神經', label: '協調與步態', explain: '請用手指碰我的手指、再碰自己的鼻尖。可以的話，下床走幾步；再把兩腳併攏站好、閉上眼睛。我會在旁邊扶著。', weight: 2 },
    { id: 'x-spine', part: '背部', label: '頸部與脊椎', explain: '我要摸一下您的脖子和背，請慢慢低頭、抬頭、左右轉。會麻或會痛請馬上說。', weight: 1 },
    { id: 'x-heart-lung', part: '胸部', label: '心肺與呼吸', explain: '我要聽您的心臟和兩邊的肺，也看一下呼吸的快慢和深淺。', weight: 1 },
  ],
  tests: [
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 40 },
    { id: 't-ct', label: '頭部電腦斷層（不打顯影劑）', kind: 'order', cost: 10, delay: 110 },
    { id: 't-blood', label: '抽血（血球、電解質、維生素 B12、糖化血色素）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
  ],
};
