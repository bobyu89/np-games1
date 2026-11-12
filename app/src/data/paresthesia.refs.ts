// 感覺異常（c12）的文獻，和要交給目錄整合的資料。書目資料用 PubMed 核對過。
// 這個檔案不匯入 shared.ts，之後由 shared.ts 把下面三份「_ADD」併進去。

export const KOTHARI_1999 = { id: 'kothari1999', text: 'Kothari, R. U., Pancioli, A., Liu, T., Brott, T., & Broderick, J. (1999). Cincinnati Prehospital Stroke Scale: Reproducibility and validity. Annals of Emergency Medicine, 33(4), 373–378.', doi: '10.1016/s0196-0644(99)70299-4' };
export const POWERS_2019 = { id: 'powers2019', text: 'Powers, W. J., et al. (2019). Guidelines for the early management of patients with acute ischemic stroke: 2019 update to the 2018 guidelines for the early management of acute ischemic stroke: A guideline for healthcare professionals from the American Heart Association/American Stroke Association. Stroke, 50(12), e344–e418.', doi: '10.1161/STR.0000000000000211' };
export const POPBUSUI_2017 = { id: 'popbusui2017', text: 'Pop-Busui, R., Boulton, A. J. M., Feldman, E. L., Bril, V., Freeman, R., Malik, R. A., Sosenko, J. M., & Ziegler, D. (2017). Diabetic neuropathy: A position statement by the American Diabetes Association. Diabetes Care, 40(1), 136–154.', doi: '10.2337/dc16-2042' };
export const STABLER_2013 = { id: 'stabler2013', text: 'Stabler, S. P. (2013). Vitamin B12 deficiency. New England Journal of Medicine, 368(2), 149–160.', doi: '10.1056/NEJMcp1113996' };
export const CALLAHAM_1989 = { id: 'callaham1989', text: 'Callaham, M. (1989). Hypoxic hazards of traditional paper bag rebreathing in hyperventilating patients. Annals of Emergency Medicine, 18(6), 622–628.', doi: '10.1016/s0196-0644(89)80515-3' };

/** 教學重點對過摘要的文獻。沒列在這裡的（Powers、Pop-Busui、Stabler），只核對了書目 */
export const REF_CHECK_ADD: Record<string, { level: 'abstract'; note?: string }> = {
  kothari1999: { level: 'abstract', note: '摘要寫的是三項裡任何一項異常，由醫師評估時敏感度 66%、特異度 87%；所以遊戲裡也寫了「三樣都正常不能完全排除」' },
  callaham1989: { level: 'abstract' },
};

/** 寫的時候就知道沒把握、要請臨床老師特別看的地方 */
export const REVIEW_ASKS_ADD: string[] = [
  '**感覺異常的四個真身**：腦、脊髓與神經根、周邊神經、代謝與其他。教案的例子是糖尿病的神經病變（單股尼龍絲）；這裡另外補了中風、維生素 B12 缺乏的脊髓病變和過度換氣。這樣分合不合適？維生素 B12 缺乏同時會傷到周邊神經和脊髓，遊戲把它放在「脊髓」底下。',
  '**感覺異常（C12A）**：足部檢查寫「尼龍絲十個點只感覺到三個」，衛教寫「每天看腳、洗腳前用手試水溫、新鞋先穿短時間」，泡熱水和熱敷標成錯的選項。糖尿病神經病變的立場聲明沒有摘要，只核對了書目；檢查的點數和衛教的內容請對照院內的做法。夜裡灼痛的用藥寫成請醫師評估。',
  '**感覺異常（C12B）**：中風那一關寫了「最後一次正常的時間」「先測血糖」「吞嚥還沒評估之前不吃不喝」「血壓不要自己急著降」「能不能做打通血管的治療，由醫師依時間和影像決定」。指引的摘要沒有這些細節，只核對了書目；治療的時間窗沒有寫出數字。遊戲裡的時間用「時辰」和「刻」，半個時辰大約是一小時，請看會不會誤導。',
  '**感覺異常（C12B）**：變差之後寫成右手完全抬不起來、說不成句、血壓更高。這是為了讓玩家看得出惡化設計出來的。',
  '**感覺異常（C12C）**：維生素 B12 缺乏寫了胃切除、長期幾乎不吃肉蛋、長期吃制酸的藥、舌頭紅而光滑、大球性貧血、震動覺和位置覺先壞、膝反射增強合併踝反射減弱、兩側病理反射、低頭時的電麻。引用的綜論沒有摘要，只核對了書目。「補得早，神經回來的機會比較大」這句話有沒有說得太滿，請老師看。脊椎的影像寫成請醫師決定。',
  '**感覺異常（C12D）**：過度換氣那一關，「對著紙袋呼吸」標成錯的選項（文獻對過摘要）。「輕敲耳前嘴角會抽動」和「兩手抽緊」用來提示神經過度興奮，抽血的鈣寫成正常；這幾樣沒有另外引用文獻。年輕女性突然喘，遊戲用血氧、肺部聽診、心電圖、血糖和危險因子來排除危險的原因，沒有做肺栓塞的進一步檢查。這樣夠不夠，請老師決定。',
];

/** 圖鑑的人物頁：每位病人一行後來的事 */
export const AFTER_ADD: Record<string, string> = {
  c12a: '破皮兩個禮拜就收口了。他的櫃台後面多了一張矮凳，每天打烊前坐下來，看一次腳。',
  c12b: '她的右手後來拿得住筆了，字比以前歪一點。那帖讓血不結塊的藥，她再也沒有停過。',
  c12c: '針打到第三個月，他把竹杖收進了櫃子。天黑的台階，他還是會扶著走。',
  c12d: '那一晚她沒有上台。下一次又喘起來的時候，她自己數著拍子把氣慢慢吐完，然後唱了。',
};
