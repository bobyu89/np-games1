// 腫脹這一組病例的文獻，和要交給整合的人併進 shared.ts／progress.ts 的資料。
// 書目資料用 PubMed 核對過。心衰竭的兩篇（HEIDENREICH_2022、WANG_2005）已經在 shared.ts，病例直接從那裡匯入。

export const WELLS_2003 = { id: 'wells2003', text: 'Wells, P. S., Anderson, D. R., Rodger, M., Forgie, M., Kearon, C., Dreyer, J., Kovacs, G., Mitchell, M., Lewandowski, B., & Kovacs, M. J. (2003). Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. New England Journal of Medicine, 349(13), 1227–1235.', doi: '10.1056/NEJMoa023153' };
export const BIGGINS_2021 = { id: 'biggins2021', text: 'Biggins, S. W., Angeli, P., Garcia-Tsao, G., Ginès, P., Ling, S. C., Nadim, M. K., Wong, F., & Kim, W. R. (2021). Diagnosis, evaluation, and management of ascites, spontaneous bacterial peritonitis and hepatorenal syndrome: 2021 practice guidance by the American Association for the Study of Liver Diseases. Hepatology, 74(2), 1014–1048.', doi: '10.1002/hep.31884' };
export const HULL_2008 = { id: 'hull2008', text: 'Hull, R. P., & Goldsmith, D. J. A. (2008). Nephrotic syndrome in adults. BMJ, 336(7654), 1185–1189.', doi: '10.1136/bmj.39576.709711.80' };

/** 教學重點對過摘要的文獻。沒列在這裡的（Biggins、Hull）只核對了書目：兩篇在 PubMed 都沒有摘要 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  wells2003: { level: 'abstract', note: '摘要支持「評估起來不太可能、D-dimer 又陰性，可以不做超音波」；評估表的各個項目（例如小腿粗 3 公分）不在摘要裡' },
};

/** 寫的時候就知道沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**腫脹的四個真身**：心臟、腎臟、肝臟、局部。教案分成單側和雙側；這裡把雙側拆成三個器官，單側算一個「局部」（靜脈栓塞、蜂窩性組織炎、淋巴水腫）。藥物引起的腫（例如某些降血壓藥）、甲狀腺、營養不良沒有放進四盞，只在問診的用藥那一題篩。這樣分合不合適？',
  '**腫脹（C08A）**：腎病症候群的定義（大量蛋白尿、低白蛋白、水腫，常合併高血脂）和併發症（血栓、感染、急性腎損傷）引用的綜論沒有摘要，只核對了書目。「晨起眼皮先腫」「泡沫尿」當成指向腎臟的線索，是一般的教法。病人吃止痛藥粉和草藥這件事，遊戲寫成「報給醫師、請醫師告訴她能不能再吃」，沒有讓專科護理師直接叫她停。',
  '**腫脹（C08B）**：穆槐一開始血氧 88%、呼吸 30 下，遊戲仍然照考站的順序讓玩家先問診，下診斷之後兩分鐘沒通報才變差。這樣的病人真的會等嗎？回顧裡有寫「真實的情境一進門就要叫人」，請看夠不夠。變差之後的數字（血氧 82%、粉紅色泡沫痰）是設計出來的。氧氣和利尿劑一律寫成請醫師指示。',
  '**腫脹（C08B）**：「把腳抬高、讓他躺平」標成錯的請求，理由是會讓更多的水回到肺。這是設計上的判斷，沒有引用文獻。',
  '**腫脹（C08C）**：「先腫肚子、後腫腳」當成指向肝臟的線索，是一般的教法，沒有對到文獻。「第一次出現的腹水要抽出來檢查」「限鹽和利尿劑、要監測腎功能和電解質」引用的指引沒有摘要，只核對了書目。病人白天想睡、記性變差，是留給肝腦病變的伏筆，但評估時寫成沒有撲翼樣震顫；這樣安排會不會讓人混淆？',
  '**腫脹（C08D）**：兩邊小腿「差 3 公分以上有意義」是常用的評估表裡的項目，不在引用文獻的摘要裡。遊戲裡 D-dimer 沒有做成一項檢查，直接做超音波（因為她評估起來可能性高）。「調經的藥丸」是用來代替含雌激素的藥，當成血栓的危險因子。深部靜脈栓塞的病人算「穩定、今天做超音波、不敲值班鐘」，合不合理？',
];

/** 圖鑑「人物」那一頁，每位病人後來的事 */
export const AFTER_ADD: Record<string, string> = {
  c08a: '止痛藥粉她沒有再吃。染缸旁邊多了一張高腳凳，是老闆娘叫人搬來的。',
  c08b: '他在病室住了八天。回家那天，阿錶在巷口等；藥袋現在掛在鐘擺旁邊，鐘一響就吃。',
  c08c: '醬園交給了兒子，她只管試味道。每三個月回公會一次，這一次她沒有再忘。',
  c08d: '那一趟船她沒有上。下一趟，船東還是把管事的位子留給她；她的艙裡多了一條每個時辰要起來走一圈的規矩。',
};
