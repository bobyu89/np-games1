// 皮膚疹子（c10）用到的文獻，和要交給目錄整合的資料。書目資料用 PubMed 核對過。
export const SAMPSON_2006 = { id: 'sampson2006', text: 'Sampson, H. A., et al. (2006). Second symposium on the definition and management of anaphylaxis: Summary report—Second National Institute of Allergy and Infectious Disease/Food Allergy and Anaphylaxis Network symposium. Journal of Allergy and Clinical Immunology, 117(2), 391–397.', doi: '10.1016/j.jaci.2005.12.1303' };
export const DWORKIN_2007 = { id: 'dworkin2007', text: 'Dworkin, R. H., et al. (2007). Recommendations for the management of herpes zoster. Clinical Infectious Diseases, 44(Suppl. 1), S1–S26.', doi: '10.1086/510206' };
export const NEUNERT_2019 = { id: 'neunert2019', text: 'Neunert, C., et al. (2019). American Society of Hematology 2019 guidelines for immune thrombocytopenia. Blood Advances, 3(23), 3829–3866.', doi: '10.1182/bloodadvances.2019000966' };
export const ARINGER_2019 = { id: 'aringer2019', text: 'Aringer, M., et al. (2019). 2019 European League Against Rheumatism/American College of Rheumatology classification criteria for systemic lupus erythematosus. Annals of the Rheumatic Diseases, 78(9), 1151–1159.', doi: '10.1136/annrheumdis-2018-214819' };

/** 教學重點對過摘要的文獻 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  sampson2006: { level: 'abstract', note: '摘要只說明會議訂了臨床的判斷準則；準則的內容沒有對到原文，遊戲裡寫在回顧的文字、不掛在這篇文獻上' },
  dworkin2007: { level: 'abstract', note: '摘要支持「抗病毒藥是第一線」；幾小時之內要開始用藥沒有對到原文，遊戲裡沒有寫死時間' },
  neunert2019: { level: 'abstract' },
  aringer2019: { level: 'abstract' },
};

/** 寫的時候沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**皮膚疹子的四個真身**：感染、過敏與藥物、發炎與免疫、出血與血管。教案只有一份；這裡照「疹子在說什麼」拆成四個。這樣分合不合適？',
  '**皮膚疹子（C10A）**：帶狀疱疹沒有設「非做不可的檢查」，安全行動是排除過敏和出血、交代什麼情況要回來、不敲鐘。「抗病毒藥越早開始越好」寫在回顧裡，沒有寫死幾個小時，也沒有掛文獻。懷孕的女兒和小孩怎麼避開，寫成「結痂之前不要碰到疹子，細節請醫師補充」，請確認說法。',
  '**皮膚疹子（C10B）**：過敏性休克的判斷寫成「皮膚，加上呼吸道、血壓或腸胃裡的任何一樣」。這是一般的教法，引用的文獻摘要裡沒有準則的內容。腎上腺素寫成「請您指示，我已經備好」；專科護理師能不能照預立的流程先給、劑量和途徑，請照院內的規定看。擺位寫成「躺下、腳墊高；躺著更喘就半坐；不要自己站起來」，也請確認。',
  '**皮膚疹子（C10B）**：這一關「下診斷之後三分鐘內提出檢查」的安全行動掛在抽血上，是因為回報裡「腎上腺素請您指示……靜脈管路和抽血一起做」這一句等於提出抽血。真正要緊的是叫人和備藥，不是那一管血。這樣設計會不會誤導？變差之後的生命徵象是設計出來的。',
  '**皮膚疹子（C10C）**：紅斑性狼瘡用蝴蝶斑、光敏感、對稱的關節炎、口腔潰瘍、掉髮、蛋白尿和血尿、血球偏低來寫。引用的是分類標準（研究用），不是診斷流程。說明裡「病控制住了，斑多半會淡下去」請確認有沒有說得太滿。',
  '**皮膚疹子（C10D）**：血小板 8,000、口腔有血泡、月經過多的病人，遊戲算「穩定、今天抽血、不敲鐘、不放她回去」。這樣合不合理？「不給會影響血小板的止痛退燒藥、不打肌肉針」是一般的做法，沒有掛文獻。',
];

/** 圖鑑人物頁的「後來的事」 */
export const AFTER_ADD: Record<string, string> = {
  c10a: '水泡十天後結了痂。那陣子女兒沒有回茶館；孩子滿月那天，是她親手抱的。',
  c10b: '她在公會躺到隔天早上。現在她的攤位上掛著一塊小木牌：「貝類，我不試吃。」',
  c10c: '她換到繡坊裡背光的位置，帽子還是戴著。臉上的斑淡了；每個月的小便，她自己記得來驗。',
  c10d: '血小板慢慢回來了。那片玻璃放在藥鋪的櫃台上，她已經用它，請過三位客人來公會。',
};
