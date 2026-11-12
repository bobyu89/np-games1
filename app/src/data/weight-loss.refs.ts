// 體重減輕這個主訴用到的文獻，和要併進共用清單的幾樣東西。書目資料用 PubMed 核對過。
// 整合的時候：REF_CHECK_ADD 併進 shared.ts 的 REF_CHECK，REVIEW_ASKS_ADD 併進 REVIEW_ASKS，AFTER_ADD 併進 progress.ts 的 after。

export const WONG_2014 = { id: 'wong2014', text: 'Wong, C. J. (2014). Involuntary weight loss. Medical Clinics of North America, 98(3), 625–643.', doi: '10.1016/j.mcna.2014.01.012' };
export const ROSS_2016 = { id: 'ross2016', text: 'Ross, D. S., et al. (2016). 2016 American Thyroid Association guidelines for diagnosis and management of hyperthyroidism and other causes of thyrotoxicosis. Thyroid, 26(10), 1343–1421.', doi: '10.1089/thy.2016.0229' };
export const KROENKE_2003 = { id: 'kroenke2003', text: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2003). The Patient Health Questionnaire-2: Validity of a two-item depression screener. Medical Care, 41(11), 1284–1292.', doi: '10.1097/01.MLR.0000093487.78664.3C' };
export const LICHTENSTEIN_2018 = { id: 'lichtenstein2018', text: 'Lichtenstein, G. R., Loftus, E. V., Isaacs, K. L., Regueiro, M. D., Gerson, L. B., & Sands, B. E. (2018). ACG clinical guideline: Management of Crohn\'s disease in adults. American Journal of Gastroenterology, 113(4), 481–517.', doi: '10.1038/ajg.2018.27' };

/** 教學重點對過摘要的文獻 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  wong2014: { level: 'abstract' },
  kroenke2003: { level: 'abstract' },
  ross2016: { level: 'abstract', note: '只有「先確定原因再談治療」「葛瑞夫茲氏病有三種治療」對過摘要；症狀和要回來的警訊沒有對到原文' },
  lichtenstein2018: { level: 'abstract', note: '摘要只支持「原因不明的慢性發炎、發生率增加」；口腔潰瘍、瘻管等臨床表現沒有對到原文' },
};

/** 寫的時候就沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**體重減輕的四個診斷**：惡性腫瘤、內分泌與代謝、腸胃與吸收、身心與生活。教案的病人是甲狀腺亢進，另外三位是補上的。這四位都算穩定、不敲值班鐘，會不會讓學員以為「瘦的人都不急」？糖尿病酮酸中毒和甲狀腺風暴只在回顧裡提到，沒有病人。',
  '**體重減輕（C11D）**：自傷的念頭寫成「直接問」。問到之後寫成：報告醫師、告訴家人、今天不讓他一個人回去、把助眠的藥水收起來；有念頭但沒有計畫時，不敲值班鐘。怎麼問、問到之後專科護理師該做到哪裡、什麼情況才算急，請照院內的自殺防治流程看。這幾句沒有引用文獻。',
  '**體重減輕（C11D）**：兩題憂鬱篩檢用在 78 歲的長者身上；原始研究是在基層和婦產科門診做的。認知只做了很短的篩檢（記三樣東西、日期）。假牙鬆脫、獨自吃飯、喝酒助眠都放在「身心與生活」這個診斷底下。這樣合不合適？',
  '**體重減輕（C11B）**：左鎖骨上的淋巴結、家族史、醃燻食物和抽菸，當成指向胃腫瘤的線索，沒有另外引用文獻。「腸胃與吸收」（潰瘍出血）設計成排除不了，要胃鏡才分得出來。檢查出來之前說到哪裡，照 C05D 的做法。',
  '**體重減輕（C11C）**：克隆氏症的臨床表現（口腔潰瘍、肛門瘻管、右下腹摸到增厚的腸段、關節和皮膚）不在引用指引的摘要裡，是一般的教法。「帶血的腹瀉先不給止瀉藥，要先問過醫師」也沒有引用文獻。肛門周圍的視診放在「腹部與肛門」這一項裡，寫成先說明、徵得同意、拉上簾子；考站會不會要求做，請老師確認。',
  '**體重減輕（C11A）**：甲狀腺亢進要馬上回來的警訊（心跳很亂、高燒、躁動混亂、眼睛痛或複視）沒有另外引用文獻。「治療之後脾氣急和手抖多半會慢慢退」這句安慰的話，說得會不會太滿？',
];

/** 圖鑑「人物」那一頁，每位病人結案之後多的一行 */
export const AFTER_ADD: Record<string, string> = {
  c11a: '藥吃了三個月，手不抖了。她畫的那一批帆，線是直的。',
  c11b: '結果是他自己開口，要太太一起聽的。肉鋪交給了跟他十年的夥計；他每天下午還是會去坐一下。',
  c11c: '他送信的那條路上，每一間茅房在哪裡他都記得。只是現在用不太到了。',
  c11d: '假牙修好了。兒子改成五天回來一次。船塢的人說，那張板凳又有人坐了。',
};
