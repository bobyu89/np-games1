// 背痛（c06）用的文獻，和要交給總目錄整合的三樣東西。書目資料用 PubMed 核對過。
export const CHOU_2011 = { id: 'chou2011', text: 'Chou, R., Qaseem, A., Owens, D. K., & Shekelle, P. (2011). Diagnostic imaging for low back pain: Advice for high-value health care from the American College of Physicians. Annals of Internal Medicine, 154(3), 181–189.', doi: '10.7326/0003-4819-154-3-201102010-00008' };
export const DOWNIE_2013 = { id: 'downie2013', text: 'Downie, A., et al. (2013). Red flags to screen for malignancy and fracture in patients with low back pain: Systematic review. BMJ, 347, f7095.', doi: '10.1136/bmj.f7095' };
export const GARDNER_2011 = { id: 'gardner2011', text: 'Gardner, A., Gardner, E., & Morley, T. (2011). Cauda equina syndrome: A review of the current clinical and medico-legal position. European Spine Journal, 20(5), 690–697.', doi: '10.1007/s00586-010-1668-3' };
export const TURK_2016 = { id: 'turk2016', text: 'Türk, C., et al. (2016). EAU guidelines on diagnosis and conservative management of urolithiasis. European Urology, 69(3), 468–474.', doi: '10.1016/j.eururo.2015.07.040' };
export const CHAIKOF_2018 = { id: 'chaikof2018', text: 'Chaikof, E. L., et al. (2018). The Society for Vascular Surgery practice guidelines on the care of patients with an abdominal aortic aneurysm. Journal of Vascular Surgery, 67(1), 2–77.e2.', doi: '10.1016/j.jvs.2017.10.044' };

/** 教學重點對過摘要的文獻 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  chou2011: { level: 'abstract' },
  downie2013: { level: 'abstract' },
  gardner2011: { level: 'abstract' },
  turk2016: { level: 'abstract', note: '「堵住又感染、尿不出來不能等」不在摘要裡，遊戲裡沒有把這一句掛在這篇文獻上' },
  chaikof2018: { level: 'abstract', note: '只引用摘要裡的兩句（破裂時 90 分鐘內開始處置、4.0 到 4.9 公分每 12 個月追蹤）；症狀和危險因子不在摘要裡' },
};

/** 寫的時候沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**背痛的四個真身**：肌肉骨骼、泌尿、脊椎與神經、血管與內臟。教案分成泌尿和骨骼兩類；這裡把「骨骼」拆成一般的肌肉骨骼和不能等的脊椎問題，再加上血管。胰臟、帶狀疱疹和婦科來的背痛沒有放進四盞。這樣分合不合適？',
  '**背痛（C06A）**：沒有紅旗的急性下背痛，回報時「馬上照腰椎的片子」標成錯的選項（依引用文獻的摘要）。「不用整天躺著、照常活動」「多半幾天到幾個禮拜會好」是一般的教法，沒有掛文獻。請老師決定要不要保留。',
  '**背痛的評估**：加了「會陰的感覺和肛門收縮」。遊戲裡寫成先說明、取得同意、有人陪同才做。專科護理師在考站和實務上做到哪裡，請老師確認。',
  '**背痛（C06B）**：結石「堵住又感染、尿不出來、只有一顆腎臟」不能等，是一般的教法，不在引用文獻的摘要裡。止痛和止吐寫成請醫師評估。',
  '**背痛（C06C）**：馬尾症候群變差之後寫成「尿失禁而不自覺、右腳掌翹不起來」，生命徵象幾乎不變，這是為了讓玩家看得出惡化設計出來的。「慢一個鐘頭就少一分力氣」是岑禾的台詞，不是文獻的數字。導尿、磁振造影和後送都寫成請醫師決定。',
  '**背痛（C06D）**：有症狀的腹主動脈瘤寫成「摸到搏動的腫塊就不要再按」「輸液和血壓的目標由醫師決定」。危險因子（年紀、抽菸、高血壓、家族史）和「常被當成閃到腰或腎絞痛」是一般的教法，不在引用文獻的摘要裡。變差之後的生命徵象是設計出來的。',
];

/** 圖鑑的人物頁：四位病人後來的事 */
export const AFTER_ADD: Record<string, string> = {
  c06a: '第五天他回碼頭做輕的活。現在抬箱子之前，他會先蹲下去。',
  c06b: '石頭在第三天夜裡掉了出來，他用紙包著帶來給公會看。帳桌上從此多了一只大茶壺。',
  c06c: '當天夜裡就開了刀。三個月後，她自己走進織坊；孩子說，媽媽現在走路比以前慢一點。',
  c06d: '是兒子點的頭。血管修好了。他回家之後做的第一件事，是把那張沒去的回診單補上。',
};
