// 排泄物異常（c09）用的文獻，和要交給目錄整合的資料。書目資料用 PubMed 核對過。
// 這個檔案不匯入 shared.ts，之後由 shared.ts 把下面三樣併進去。

export const LAINE_2021 = { id: 'laine2021', text: 'Laine, L., Barkun, A. N., Saltzman, J. R., Martel, M., & Leontiadis, G. I. (2021). ACG clinical guideline: Upper gastrointestinal and ulcer bleeding. American Journal of Gastroenterology, 116(5), 899–917.', doi: '10.14309/ajg.0000000000001245' };
// shared.ts 已經有一篇 Hamilton 2005（肺癌的那一篇），所以這一篇的代號另外取
export const HAMILTON_2005_CRC = { id: 'hamilton2005crc', text: 'Hamilton, W., Round, A., Sharp, D., & Peters, T. J. (2005). Clinical features of colorectal cancer before diagnosis: A population-based case-control study. British Journal of Cancer, 93(4), 399–405.', doi: '10.1038/sj.bjc.6602714' };
export const BAROCAS_2020 = { id: 'barocas2020', text: 'Barocas, D. A., et al. (2020). Microhematuria: AUA/SUFU guideline. The Journal of Urology, 204(4), 778–786.', doi: '10.1097/JU.0000000000001297' };
export const WINGER_2011 = { id: 'winger2011', text: 'Winger, J., & Michelfelder, A. (2011). Diagnostic approach to the patient with jaundice. Primary Care: Clinics in Office Practice, 38(3), 469–482.', doi: '10.1016/j.pop.2011.05.004' };

/** 教學重點對過摘要的文獻 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  laine2021: { level: 'abstract', note: '對過摘要的是：先評估風險、輸血門檻 7 g/dL、24 小時內做內視鏡。「尿素氮偏高」不在摘要裡，遊戲裡沒有掛在這篇上' },
  hamilton2005crc: { level: 'abstract', note: '摘要支持的是哪些線索和大腸直腸癌有關、單獨看機會都不高；「血混在便裡」「解不乾淨」這些和痔瘡分辨的說法不在摘要裡' },
  barocas2020: { level: 'abstract', note: '這是顯微血尿的指引；遊戲裡的病人是肉眼血尿' },
  winger2011: { level: 'abstract', note: '「摸得到脹大而不痛的膽囊」不在摘要裡，遊戲裡沒有掛在這篇上' },
};

/** 寫的時候沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**排泄物異常的四個診斷**：上消化道、下消化道、泌尿道、肝膽。腹瀉、便秘這一類「次數和形狀」的問題沒有自己的一個診斷，只在問診裡問。這樣分合不合適？',
  '**肛門指診（C09A 到 C09D）**：四關都把肛門指診放進身體評估，寫成「說明、取得同意、請同仁陪同」之後由專科護理師做。在考站和實際的規定裡，這一項由誰做、要不要改成「向醫師提出」，請老師決定。病人拒絕的時候怎麼處理，遊戲裡只在回顧提了一句。',
  '**排泄物異常（C09A）**：躺著和站著的血壓（104/64、心跳 112；站起來 86/54、心跳 134）、血色素 7.8、「尿素氮偏高是上消化道出血常見的樣子」，都是設計出來的數字和一般的教法，不在引用文獻的摘要裡。讓一個可能在出血的人站起來量血壓合不合適？回報裡寫「平躺、禁食、放兩條粗的靜脈管路」由專科護理師先做，輸血、輸液、停止痛藥和內視鏡的時間請醫師指示，這條線畫得對不對？',
  '**排泄物異常（C09B）**：用「血混在便裡、便變細、解不乾淨、排便習慣改變」和痔瘡分開，肛門指診寫成在直腸摸到硬而不平的腫塊、外痔沒有出血。這幾句分辨的說法是一般的教法，沒有另外引用文獻。',
  '**排泄物異常（C09C）**：引用的是顯微血尿的指引；這位病人是不痛的肉眼血尿。「整泡紅、開頭紅、最後紅各代表哪一段」「尿裡的紅血球形狀正常、沒有蛋白，比較不像腎絲球的問題」「花柳病多半會痛、會有分泌物」是一般的教法。超音波寫成看得到膀胱壁上的病灶，是為了讓玩家有東西解讀，請看會不會誤導。',
  '**排泄物異常（C09D）**：「黃疸、摸得到脹大而不痛的膽囊，堵住它的多半不是結石」是傳統的教法，沒有另外引用文獻。她沒有發燒、不痛，遊戲把她算成穩定、不敲鐘；合併發燒、畏寒、腹痛才是急症，這一點只寫在說明的警訊和回顧裡。這樣算合不合理？',
];

/** 圖鑑「人物」那一頁，每位病人後來的事 */
export const AFTER_ADD: Record<string, string> = {
  c09a: '血止住了。膝蓋還是痛，但藥是醫師重新開的，飯後才吃。工坊的牆上多了一行炭筆字：「黑的要講」。',
  c09b: '那個東西切掉了。回診那天他帶了太太一起來；這一次，是他自己先開口問的。',
  c09c: '膀胱鏡做了，裡面的東西也刮掉了。他戒了菸，調漆的時候開始戴手套。那件事，他自己跟太太說了。',
  c09d: '結果是兒子、媳婦陪她一起聽的。乾貨行現在由媳婦顧，她每天下午去櫃台坐一個時辰。',
};
