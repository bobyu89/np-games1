// 腳痛這一組病例用到的文獻，和要整合進共用檔案的資料。書目資料用 PubMed 核對過。
export const JANSSENS_2010 = { id: 'janssens2010', text: 'Janssens, H. J. E. M., Fransen, J., van de Lisdonk, E. H., van Riel, P. L. C. M., van Weel, C., & Janssen, M. (2010). A diagnostic rule for acute gouty arthritis in primary care without joint fluid analysis. Archives of Internal Medicine, 170(13), 1120–1126.', doi: '10.1001/archinternmed.2010.196' };
export const BJORCK_2020 = { id: 'bjorck2020', text: 'Björck, M., et al. (2020). Editor\'s choice – European Society for Vascular Surgery (ESVS) 2020 clinical practice guidelines on the management of acute limb ischaemia. European Journal of Vascular and Endovascular Surgery, 59(2), 173–218.', doi: '10.1016/j.ejvs.2019.09.006' };
export const VONKEUDELL_2015 = { id: 'vonkeudell2015', text: 'von Keudell, A. G., Weaver, M. J., Appleton, P. T., Bae, D. S., Dyer, G. S. M., Heng, M., Jupiter, J. B., & Vrahas, M. S. (2015). Diagnosis and treatment of acute extremity compartment syndrome. The Lancet, 386(10000), 1299–1310.', doi: '10.1016/S0140-6736(15)00277-9' };
export const ROPPER_2015 = { id: 'ropper2015', text: 'Ropper, A. H., & Zafonte, R. D. (2015). Sciatica. New England Journal of Medicine, 372(13), 1240–1248.', doi: '10.1056/NEJMra1410151' };

/** 教學重點對過摘要的文獻。沒列在這裡的（Björck、Ropper），只核對了書目 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  janssens2010: { level: 'abstract' },
  vonkeudell2015: { level: 'abstract', note: '「脈搏摸得到不能排除」「被動伸展劇痛是最早的徵象」不在摘要裡，遊戲裡沒有把這兩句掛在這篇文獻上' },
};

/** 寫的時候沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**腳痛的四個診斷**：血管、關節、肌肉與骨、神經。教案分成肌肉骨骼和血管兩類；這裡把肌肉骨骼拆成兩個，再加上神經。深部靜脈栓塞放在「血管」底下，但病人在腫脹那一組（C08D）；蜂窩性組織炎沒有放進這四個診斷（在發燒那一組）。這樣分合不合適？',
  '**腳痛（C07A）**：痛風和化膿性關節炎在同一個診斷（關節）底下，用「沒有發燒、沒有傷口或打針、以前同一處自己好過、關節還有一點活動度」當成先不抽關節液的憑據。這個門檻夠不夠安全？「可以冰敷，熱敷和包緊不行」是一般的教法，沒有掛文獻。',
  '**腳痛（C07B）**：急性肢體缺血的指引沒有摘要，只核對了書目。「不抬高、不熱敷、保暖、腳放平或稍微垂著」和「抗凝血的藥請醫師指示」的寫法，請對照實際的做法。變差之後的表現（花斑、腳趾不能動）和時間是設計出來的。',
  '**腳痛（C07C）**：這一關的安全行動沒有照其他不穩定的關卡（通報 6 分＋檢查 3 分），改成通報 6 分、「鬆開包紮並把腳放到和心臟一樣高」2 分、X 光 1 分。鬆開包紮誰可以先做、腳要放多高，請老師確認。「脈搏摸得到不能排除」「被動伸展劇痛是最早的徵象」是一般的教法，不在引用文獻的摘要裡。',
  '**腳痛（C07D）**：沒有警訊的坐骨神經痛，這一關沒有非做不可的檢查；影像寫成請醫師評估，錯的選項是「臥床兩個禮拜」。「多數在幾個禮拜裡會慢慢好」「長時間臥床沒有幫助」沒有掛文獻；引用的綜論沒有摘要，只核對了書目。她已經有大腳趾背屈無力，算「穩定、不敲鐘、約回來看力氣」合不合理？',
  '**腳痛的評估**：直腿抬高、被動伸展腳趾、動發炎的關節，都會引發疼痛。說明的句子都寫了「痛了就停」，請看夠不夠。',
];

/** 圖鑑的人物頁：每位病人後來的事 */
export const AFTER_ADD: Record<string, string> = {
  c07a: '包場那一晚，是大兒子站的櫃台。他自己現在那一杯，換成了茶。',
  c07b: '腳保住了。那顆會讓他瘀青的藥換了一種；這一次，他沒有再自己停。',
  c07c: '那一船照常下了水，龍骨那一排少了他。三個月後他回到船塢，工頭把位置留著。',
  c07d: '殺魚的檯子墊高了一塊磚。搬魚桶的事，隔壁攤的少年每天早上來幫一趟。',
};
