// 主訴模組：胸痛。症影是鐵翅蛾，底下有四個真身。
// 這裡的問題、評估和檢查，胸痛的每個病例都共用；病例只寫病人怎麼回答。
import type { ComplaintDef } from '../core/module.ts';

export const CHEST_PAIN: ComplaintDef = {
  id: 'chest-pain',
  name: '胸痛',
  shadow: { name: '鐵翅蛾', lore: '胸痛的症影。翅膀像鐵片一樣壓在胸口。同樣的外形底下，可能是好幾種不同的病。' },
  forms: [
    { id: 'acs', name: '急性冠心症', mark: '心', danger: true, blurb: '心臟的血管堵住或快要堵住。' },
    { id: 'dissection', name: '主動脈剝離', mark: '脈', danger: true, blurb: '主動脈的內層裂開。' },
    { id: 'pe', name: '肺栓塞', mark: '肺', danger: true, blurb: '血塊堵住肺的血管。' },
    { id: 'msk', name: '胸壁疼痛', mark: '壁', danger: false, blurb: '胸壁的肌肉、肋骨或軟骨發炎或拉傷。' },
  ],
  questions: [
    { id: 'q-intro', group: 'open', label: '自我介紹', ask: '您好，我是今天照顧您的專科護理師。先跟您確認名字，接下來我會問幾個問題、做一些檢查，可以嗎？', weight: 0 },
    { id: 'q-concern', group: 'open', label: '擔心什麼', ask: '您現在最擔心的是什麼？', weight: 2 },

    { id: 'q-onset', group: 'cc', label: '何時開始', ask: '現在還在痛嗎？什麼時候開始的？', weight: 3 },
    { id: 'q-quality', group: 'cc', label: '位置與性質', ask: '是怎麼樣的痛？在哪個位置？', weight: 3 },
    { id: 'q-radiate', group: 'cc', label: '會傳到哪', ask: '會痛到別的地方嗎？', weight: 3 },
    { id: 'q-severity', group: 'cc', label: '幾分痛', ask: '零到十分，現在大概幾分？', weight: 1 },
    { id: 'q-provoke', group: 'cc', label: '誘發', ask: '那時候在做什麼？出力、走路的時候會這樣嗎？', weight: 3 },
    { id: 'q-worse', group: 'cc', label: '加重', ask: '深呼吸、咳嗽、轉身或按胸口，會更痛嗎？', weight: 2 },
    { id: 'q-tear', group: 'cc', label: '撕裂、背痛', ask: '有沒有像被撕開的感覺？會痛到背後嗎？', weight: 2 },
    { id: 'q-relief', group: 'cc', label: '緩解', ask: '有什麼會讓它好一點？吃過或用過什麼藥嗎？', weight: 1 },
    { id: 'q-assoc', group: 'cc', label: '伴隨症狀', ask: '還有哪裡不舒服？會冒冷汗或想吐嗎？', weight: 3 },
    { id: 'q-sob', group: 'cc', label: '喘、昏倒', ask: '會喘嗎？有沒有頭暈或快昏倒？', weight: 2 },

    { id: 'q-pmh', group: 'hx', label: '過去病史', ask: '以前有什麼病？', weight: 2 },
    { id: 'q-meds', group: 'hx', label: '用藥與過敏', ask: '現在吃什麼藥？有沒有對什麼藥過敏？', weight: 2 },
    { id: 'q-family', group: 'hx', label: '家族史', ask: '家裡有人心臟出過事嗎？那時候幾歲？', weight: 2 },
    { id: 'q-smoke', group: 'hx', label: '菸酒', ask: '抽菸、喝酒嗎？', weight: 2 },
    { id: 'q-immob', group: 'hx', label: '久坐、腿腫', ask: '最近有沒有長時間坐著不動、腿腫，或是剛開過刀？', weight: 2 },

    { id: 'q-ros-cv', group: 'ros', label: '心悸、腳腫', ask: '會心悸嗎？晚上會喘到要坐起來、腳會腫嗎？', weight: 1 },
    { id: 'q-ros-resp', group: 'ros', label: '咳嗽、發燒', ask: '有咳嗽、咳血或發燒嗎？', weight: 1 },
    { id: 'q-ros-gi', group: 'ros', label: '火燒心', ask: '有火燒心、吐酸水嗎？跟吃東西有關係嗎？', weight: 1 },
    { id: 'q-trauma', group: 'ros', label: '外傷', ask: '最近胸口有沒有撞到或拉傷？', weight: 1 },
  ],
  exams: [
    { id: 'x-look', label: '觀察外觀', explain: '我先看一下您整體的樣子和呼吸。', weight: 2 },
    { id: 'x-botharms', label: '量兩手血壓', explain: '我要量您兩隻手的血壓，比較兩邊有沒有差別，袖帶會緊一下。', weight: 2 },
    { id: 'x-heart', label: '聽心臟', explain: '我要聽您的心臟，會把聽診器放在胸口幾個位置，需要把衣服解開一點。', weight: 2 },
    { id: 'x-lungs', label: '聽肺部', explain: '我要聽您兩邊的呼吸聲，前面和背後都會聽，請您慢慢呼吸。', weight: 2 },
    { id: 'x-jvp', label: '看頸靜脈', explain: '我要看一下您脖子的血管，請把頭稍微轉向左邊。', weight: 1 },
    { id: 'x-perfusion', label: '摸手腳末梢', explain: '我要摸您的手和腳，看溫度和血液循環，會壓一下指甲。', weight: 2 },
    { id: 'x-legs', label: '脈搏與小腿', explain: '我要摸您手腕和腳背的脈搏，再看一下兩邊的小腿。', weight: 1 },
    { id: 'x-chestwall', label: '按壓胸壁', explain: '我要輕輕按您胸口幾個地方，看按了會不會出現一樣的痛，會痛請馬上說。', weight: 2 },
    { id: 'x-abd', label: '摸肚子', explain: '我要摸一下您的肚子，特別是上腹的位置，請把腿稍微彎起來。', weight: 1 },
  ],
  tests: [
    { id: 't-record', label: '公會的舊紀錄', kind: 'record', cost: 20 },
    { id: 't-ecg', label: '12 導程心電圖', kind: 'order', cost: 10, delay: 120 },
    { id: 't-glucose', label: '指尖血糖', kind: 'order', cost: 10, delay: 60 },
    { id: 't-blood', label: '抽血（含心肌旋蛋白）', kind: 'order', cost: 20 },
    { id: 't-cxr', label: '胸部 X 光', kind: 'order', cost: 10 },
  ],
};
