// 主訴模組：排泄物異常。症影是渾水獺，底下有四個真身。
// 開場、病史、系統回顧用共用的骨架；主訴那一段的問法和身體評估是這個主訴自己的。
// 問法繞著「顏色、樣子、血在哪裡」問，而且要問得讓病人說得出口；
// 評估多了躺著和站著的血壓、肛門指診（先說明、取得同意、請人陪同）。
import type { ComplaintDef } from '../core/module.ts';
import { HISTORY, OPENING, REVIEW, oldCarts } from './skeleton.ts';

export const EXCRETA: ComplaintDef = {
  id: 'excreta',
  name: '排泄物異常',
  shadow: { name: '渾水獺', look: 'otter', lore: '排泄物異常的症影。把水攪渾了就躲起來。水裡多了什麼顏色，要你自己低頭去看；來的人多半不好意思先開口。' },
  forms: [
    { id: 'upper', name: '上消化道', mark: '上', danger: true, blurb: '血從胃和十二指腸來：黑得像柏油的便、吐血。潰瘍、靜脈瘤。' },
    { id: 'lower', name: '下消化道', mark: '下', danger: true, blurb: '血從大腸和肛門來：鮮紅或暗紅的血、排便習慣改變。痔瘡、憩室、大腸的腫瘤。' },
    { id: 'urinary', name: '泌尿道', mark: '尿', danger: true, blurb: '尿裡有血：結石、感染、膀胱或腎臟的腫瘤。' },
    { id: 'biliary', name: '肝膽', mark: '膽', danger: true, blurb: '膽汁流不下去：尿像濃茶、便變成灰白色、皮膚和眼白發黃。' },
  ],
  questions: [
    ...OPENING,
    ...oldCarts({
      'q-cc': '今天是哪裡不舒服？大小便的事，在這裡都可以說。簾子我拉上了。',
      'q-onset': '什麼時候開始注意到不一樣的？是突然這樣，還是慢慢變的？',
      'q-location': '不一樣的是大便、小便，還是兩個都有？',
      'q-duration': '到現在多久了？是每一次都這樣，還是有時候有、有時候沒有？一天幾次？',
      'q-character': '是什麼顏色、什麼樣子？黑得像柏油、暗紅、鮮紅、灰白，還是像濃茶？是成形的、稀的，有沒有血塊？',
      'q-assoc': '還有別的不舒服嗎？肚子痛、想吐、吐過血、發燒、皮膚或眼睛變黃、身上癢？',
      'q-factors': '排的時候會痛嗎？會不會覺得解不乾淨、剛解完又想解？小便會刺痛、會急嗎？',
      'q-radiate': '血是混在裡面、包在外面，還是擦的時候才看到、滴在水裡？小便是一開始紅、最後紅，還是整泡都紅？',
      'q-treat': '這幾天吃過會讓顏色變的東西嗎？像是豬血、補血的藥、紅色的果子。有沒有吃止痛藥，或是自己買藥來吃、來擦？',
      'q-severity': '量大概多少？站起來會不會頭暈、眼前發黑？最近體重有沒有變？',
    }, { 'q-location': '大便還是小便', 'q-duration': '多久、幾次', 'q-character': '顏色與樣子', 'q-factors': '排的時候', 'q-radiate': '血在哪裡', 'q-treat': '吃了什麼', 'q-severity': '量與頭暈' }),
    ...HISTORY,
    ...REVIEW,
  ],
  // 先看整個人流了多少、黃不黃，再看肚子，最後才是肛門指診。指診之前一定要先說明、取得同意
  exams: [
    { id: 'x-look', part: '整體', label: '整體與膚色', explain: '我先看一下您整體的樣子、臉色和皮膚的顏色。', weight: 2 },
    { id: 'x-eyes', part: '頭頸', label: '眼白與結膜', explain: '我要在亮一點的地方看您的眼白，再把下眼皮翻一下，看裡面的顏色。', weight: 2 },
    { id: 'x-nodes', part: '頭頸', label: '鎖骨上淋巴結', explain: '我要摸一下您脖子和鎖骨上面的淋巴結，肩膀請放鬆。', weight: 1 },
    { id: 'x-ortho', part: '心臟', label: '躺著和站著的血壓', explain: '我要先量您躺著的血壓和心跳，再請您慢慢站起來量一次。站起來如果頭暈，馬上跟我說，我會扶著您。', weight: 2 },
    { id: 'x-abd-look', part: '腹部', label: '腹部視診與聽診', explain: '我要看您的肚子，再用聽診器聽腸子的聲音。請躺平、膝蓋彎起來，衣服拉到胸口下面。', weight: 1 },
    { id: 'x-abd-perc', part: '腹部', label: '腹部叩診', explain: '我要輕輕敲您肚子的幾個地方，也敲一下肝的大小。', weight: 1 },
    { id: 'x-abd-palp', part: '腹部', label: '腹部觸診', explain: '我要摸您的肚子，先輕再深，會摸肝和膽囊的位置，看有沒有腫塊。從不痛的地方開始，會痛請馬上說。', weight: 2 },
    { id: 'x-cva', part: '背部', label: '腰部敲擊與膀胱', explain: '請您坐起來，我要輕輕敲一下兩邊腰的後面；再摸一下下腹，看膀胱有沒有脹。', weight: 2 },
    { id: 'x-dre', part: '腹部', label: '肛門指診', explain: '接下來要檢查肛門。我會戴手套、沾潤滑的藥膏，用一根手指進去摸一圈，再看手套上的顏色。會有一點脹，很快就好。簾子是拉上的，我請同仁在旁邊陪著。您同意嗎？中間隨時可以喊停。', weight: 2 },
    { id: 'x-perfusion', part: '四肢', label: '末梢循環與皮膚', explain: '我要摸您的手和腳，看溫度和血液循環；也看一下手掌和皮膚，有沒有抓痕或瘀青。', weight: 1 },
  ],
  tests: [
    { id: 't-blood', label: '抽血（血球、肝膽腎、凝血）', kind: 'order', cost: 20, delay: 130 },
    { id: 't-urine', label: '驗尿', kind: 'order', cost: 10, delay: 60 },
    { id: 't-stool', label: '糞便潛血', kind: 'order', cost: 10, delay: 50 },
    { id: 't-us', label: '腹部超音波', kind: 'order', cost: 10, delay: 110 },
  ],
};
