// 主訴模組：腳痛。症影是跛足鷺，底下有四個診斷。
// 教案把腳痛分成肌肉骨骼和血管兩類；這裡把肌肉骨骼再拆成「關節」和「肌肉與骨」，另外加上「神經」。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是腳痛自己的：
// 重點是把鞋襪脫掉、兩隻腳放在一起比。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const LEG_PAIN: ComplaintDef = {
  id: 'leg-pain',
  name: '腳痛',
  shadow: { name: '跛足鷺', look: 'heron', lore: '腳痛的症影。永遠只用一隻腳站著，另一隻縮在肚子底下，不讓人看。要牠把腳放下來，得先知道牠在護著什麼。' },
  place: 'yard',
  forms: [
    { id: 'vascular', name: '血管', mark: '脈', danger: true, blurb: '血送不到，或是回不來：急性肢體缺血、周邊動脈疾病、靜脈栓塞。' },
    { id: 'joint', name: '關節', mark: '節', danger: true, blurb: '關節裡面在發炎：痛風、化膿性關節炎。' },
    { id: 'bone', name: '肌肉與骨', mark: '骨', danger: true, blurb: '受傷之後的事：拉傷、骨折，最怕腔室症候群。' },
    { id: 'nerve', name: '神經', mark: '神', danger: false, blurb: '痛沿著一條線跑：坐骨神經痛、周邊神經病變。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？',
      'q-onset': '什麼時候開始痛的？是一下子痛起來，還是慢慢痛起來？痛之前有沒有受傷、撞到、被壓到？',
      'q-location': '痛在哪裡？一隻腳還是兩隻？是關節、小腿肚，還是一整條？請指給我看。',
      'q-duration': '是一直痛，還是一陣一陣？以前有過一樣的痛嗎？',
      'q-character': '是怎麼樣的痛？脹的、刺的、抽的、像火燒，還是像過電？',
      'q-assoc': '除了痛，那隻腳還有別的變化嗎？腫、紅、熱，還是變冰、變白、變麻、沒力？',
      'q-factors': '什麼會讓它更痛，什麼會好一點？踩地、走路、有人碰到、把腳抬高或放下來、咳嗽、彎腰？',
      'q-radiate': '痛會不會跑？是從腰或屁股往下傳，還是只釘在一個地方？',
      'q-treat': '痛了之後做過什麼處理？吃藥、冰敷、熱敷、包紮、推拿？有沒有用？',
      'q-severity': '零到十分，現在幾分？腳能不能踩地？腳趾動得了嗎？',
    }, { 'q-assoc': '腳的變化', 'q-severity': '幾分、能動嗎' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 兩隻腳比著看：先看、再摸溫度和脈搏，然後是小腿、關節、肌肉，最後是神經和腰
  exams: [
    { id: 'x-look', part: '整體', label: '整體外觀與步態', explain: '我先看一下您整體的樣子，還有您怎麼坐、怎麼站、怎麼走。', weight: 1 },
    { id: 'x-heart', part: '心臟', label: '心臟聽診與脈搏節律', explain: '我要聽您的心臟，也摸一下手腕的脈搏，看跳得規不規則。需要把衣服解開一點。', weight: 2 },
    { id: 'x-skin', part: '皮膚', label: '兩腳的外觀', explain: '請把兩腳的鞋襪都脫掉，褲管捲到膝蓋上面。我要把兩隻腳放在一起比：顏色、有沒有腫、有沒有傷口。', weight: 2 },
    { id: 'x-temp', part: '四肢', label: '皮膚溫度與微血管回填', explain: '我用手背摸您兩隻腳的溫度，再壓一下腳趾頭，看血色多快回來。', weight: 2 },
    { id: 'x-pulse', part: '四肢', label: '下肢脈搏', explain: '我要摸您兩邊鼠蹊、膝蓋後面、腳背和腳踝內側的脈搏，兩邊比一比。', weight: 2 },
    { id: 'x-calf', part: '四肢', label: '小腿圍與壓痛', explain: '我要比兩邊小腿的粗細，再輕輕捏一下小腿肚。會痛請馬上說。', weight: 1 },
    { id: 'x-joint', part: '四肢', label: '關節', explain: '我要看、再輕輕摸您的關節，請您自己動一下，再讓我幫您動。我會很輕，痛了就停。', weight: 2 },
    { id: 'x-stretch', part: '四肢', label: '肌肉張力與被動伸展', explain: '我要摸小腿的肌肉繃不繃，再輕輕把您的腳趾往上、往下扳。會痛請馬上說，我就停。', weight: 2 },
    { id: 'x-neuro', part: '神經', label: '感覺、肌力與反射', explain: '我要碰您兩隻腳的幾個地方，請告訴我兩邊感覺一不一樣；再請您用力勾腳、踩我的手，最後敲一下膝蓋和腳跟。', weight: 2 },
    { id: 'x-slr', part: '背部', label: '腰椎與直腿抬高', explain: '我要按一下您的腰，再請您躺平，我把您的腿伸直、慢慢抬高。腳會麻、會痛就告訴我，我就停。', weight: 1 },
  ],
  tests: [
    { id: 't-doppler', label: '下肢血管超音波', kind: 'order', cost: 10, delay: 100 },
    { id: 't-blood', label: '抽血（血球、尿酸、發炎指數、肌肉酵素）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-xray', label: 'X 光（患處）', kind: 'order', cost: 10, delay: 100 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 90 },
  ],
};
