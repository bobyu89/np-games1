# 給臨床老師的審查清單

《霧脈公會》現在有 12 個病例、3 個主訴。**全部都還沒經過臨床老師審查，不能當教材。**這份清單把每一關裡「有對錯」的地方攤開，請老師逐項看。

這一頁和各主訴的檔案都是程式從病例檔產生的（在 `app/` 底下跑 `npm run review`）。不要手改；病例改了，重跑一次就會更新。

## 怎麼審

每個主訴一份檔案。先看四個真身分得合不合理，再一位一位看病人。每一位病人請看這七件事：

1. **故事**：年齡、職業、病程、生命徵象，合不合理？
2. **診斷和線索**：這個真身，和病人說的、評估到的，對不對得上？
3. **要解讀的線索**：每一條的「指向」對不對？「理由」那句話有沒有說錯、說得太滿？
4. **安全行動**：該不該敲值班鐘、時間限制合不合理、最關鍵的檢查是不是那一項？
5. **回報和說明的選項**：標「對」的是不是真的對，標「錯」的是不是真的錯？有沒有超出專科護理師可以做的範圍？
6. **教學重點**：敘述有沒有超出引用的文獻？
7. **用語**：病人的話像不像病人會說的？有沒有不合臨床習慣的講法？

每一列後面有「☐同意 ☐要改」。每一位病人最後有一個整體的四點評分（4 可以用、3 小修、2 大修、1 不適合），和專家效度常用的四點量表同一個刻度；這只是方便彙整，不是正式的效度工具。

## 索引

| 代號 | 主訴 | 真身 | 病人 | 穩不穩定 | 狀態 | 在哪一份 |
|---|---|---|---|---|---|---|
| C01A | 胸痛 | 心因性 | 林秋，58 歲，港口的燈匠 | 不穩定 | 未審查 | [chest-pain.md](chest-pain.md) |
| C01B | 胸痛 | 肌肉骨骼 | 簡晴，42 歲，碼頭的搬運工 | 穩定 | 未審查 | [chest-pain.md](chest-pain.md) |
| C01C | 胸痛 | 胸腔腫瘤 | 莫桐，67 歲，退休的船塢填縫工 | 穩定 | 未審查 | [chest-pain.md](chest-pain.md) |
| C01D | 胸痛 | 血管急症 | 阮舟，35 歲，遠洋貨船的帳房 | 不穩定 | 未審查 | [chest-pain.md](chest-pain.md) |
| C02A | 喘 | 心因性 | 駱松，70 歲，退休的老船長 | 穩定 | 未審查 | [dyspnea.md](dyspnea.md) |
| C02B | 喘 | 氣道阻塞 | 霍樟，66 歲，燻魚坊的師傅 | 不穩定 | 未審查 | [dyspnea.md](dyspnea.md) |
| C02C | 喘 | 肺部感染 | 柯蒲，52 歲，漁市的拍賣人 | 穩定 | 未審查 | [dyspnea.md](dyspnea.md) |
| C02D | 喘 | 突發急症 | 岳楊，24 歲，修桅杆的索具工 | 不穩定 | 未審查 | [dyspnea.md](dyspnea.md) |
| C03A | 腹痛 | 膽囊與膽道 | 方苓，46 歲，港邊炸魚攤的老闆娘 | 穩定 | 未審查 | [abdomen.md](abdomen.md) |
| C03B | 腹痛 | 闌尾 | 邵棠，19 歲，船塢的學徒 | 穩定 | 未審查 | [abdomen.md](abdomen.md) |
| C03C | 腹痛 | 胰臟與胃 | 龔椿，48 歲，酒坊的釀酒師 | 不穩定 | 未審查 | [abdomen.md](abdomen.md) |
| C03D | 腹痛 | 大腸憩室 | 鄔桃，63 歲，麵包坊的老闆娘 | 穩定 | 未審查 | [abdomen.md](abdomen.md) |

## 每一關共用的設計

這幾項是所有病例共用的規則。請老師看它們本身合不合理。

**流程**：問診 → 身體評估 → 下診斷 → 檢查與處置。照考站的順序，整套做完才說計畫。真實的情境不會等：血氧低就先處理、先叫人。這一點寫在每一關的回顧裡。生命徵象和值班鐘任何時候都可以用，提早通報不扣分。

**時間**：做一件事，模擬的時鐘才會走。

| 行動 | 花多少時間 |
|---|---|
| 問一題 | 20 秒 |
| 量生命徵象 | 40 秒 |
| 做一項身體評估 | 20 秒 |
| 動手之前先說明 | 多 10 秒 |
| 陪著觀察 | 30 秒 |
| 敲值班鐘 | 5 秒 |
| 向醫師回報 | 30 秒 |
| 向病人說明 | 40 秒 |

整套問診加身體評估大約 15 分鐘（模擬的時間）。時間的壓力從下診斷那一刻才開始算。

**評分**（訓練用，不代表正式甄審的成績）：

| 項目 | 分數 | 怎麼算 |
|------------|---|---------------------------|
| 焦點病史 | 25 | 問到的題目份量，達到全部的八成就拿滿 |
| 生命徵象與焦點身體評估 | 20 | 量了 5 分、之後重測 3 分、評估項目的份量 12 分（八成拿滿） |
| 取得同意與說明檢查 | 10 | 開場三件事 4 分、動手之前有說明的比例 6 分 |
| 問題摘要和優先的鑑別 | 15 | 問題摘要最多 5 分、最可能的問題 5 分、還要排除的最多 5 分 |
| 支持和反對的證據 | 10 | 線索解讀對的條數 |
| 照護、回報和重評 | 15 | 安全行動 9 分、回報 4 分、重評 2 分 |
| 對病人說明 | 5 | 說對的句子最多 3 分、回應病人擔心的事 2 分、說錯一句扣 1.5 分 |

前三項是「資料收集與診察」55 分，後四項是「推理與決策」45 分。安全行動另外有一個結果：達成、部分達成、需要複核。有一條沒做到，或是由岑禾接手通報，就是需要複核。

## 要特別請老師確認的地方

下面是寫的時候就知道沒把握的地方。

- **流程**：遊戲照考站的順序，整套問診和評估做完才下診斷、說計畫。會不會讓學員養成「先做完再處理」的習慣？回顧裡的提醒夠不夠？
- **敲值班鐘**：不穩定的病人，下診斷之後兩分鐘（模擬時間）沒有通報就會變差。這個時限合不合理？穩定的病人敲鐘算過度通報、少 1 分，會不會讓學員不敢叫人？
- **專科護理師可以做的範圍**：回報的選項都寫成「請同意…」「請您指示」。哪些可以照預立的醫療流程先做、哪些一定要先有醫囑，請照實際的規定看一遍。
- **胸痛（C01A）**：心電圖要在下診斷之後兩分鐘內提出。這是遊戲裡的模擬時間，不是指引的原文，請看這樣設計會不會誤導。
- **胸痛的「血管」**：這個真身底下只有肺栓塞一位病人（C01D），主動脈剝離沒有病人。
- **喘（C02B）**：氧氣的目標寫 88–92%。這個數字不在引用的那篇文獻的摘要裡，請確認數字和「照醫囑調」的寫法。
- **喘（C02D）**：回顧寫「氣胸開始壓迫時不等 X 光」。依據只核對到書目，請對照原文。
- **喘的「突發急症」**：這個真身底下放了氣胸和肺栓塞兩個病，合不合適？從喘進來的肺栓塞沒有病人。
- **腹痛的四個真身**：照位置分（膽囊與膽道、胰臟與胃、闌尾、大腸憩室）。為了避免學員只看位置就猜，方苓、邵棠、鄔桃這三關，沒有把另外三個排除就下診斷會是「需要複核」。這個做法夠不夠？
- **腹痛（C03C）**：胰臟炎的診斷條件（三樣裡有兩樣、脂肪酶超過正常上限三倍）沒有對到原文。
- **腹痛（C03D）**：遊戲裡的影像檢查只有腹部超音波，結果寫「醫師通常會再安排電腦斷層」。要不要把電腦斷層加成一項檢查？
- **沒有病人的鑑別**：消化性潰瘍，以及下腹的泌尿、婦科和疝氣。只在回顧的文字裡提到。
- **指引類的文獻**：胸痛、急性冠心症、心衰竭、肺栓塞、膽囊炎、肺炎、氣胸的指引，只核對了書目。引用它們的教學重點請對照原文。
- **甄審的規定**：遊戲的配分照 115 年度的口試。第一批玩家考的是下一年度，公告之後要再核對。

## 文獻

書目資料都用 PubMed 核對過。「教學重點對過摘要」的意思是：遊戲裡引用它的那幾句話，和摘要的內容對過。「只核對書目」的意思是：確認這篇文獻存在、書目正確，但遊戲裡的敘述沒有逐句對過原文。

| 文獻 | 核對到哪裡 | 哪幾關用到 |
|------------------------|------------|------|
| Austin, M. A., Wills, K. E., Blizzard, L., Walters, E. H., & Wood-Baker, R. (2010). Effect of high flow oxygen on mortality in chronic obstructive pulmonary disease patients in prehospital setting: Randomised controlled trial. BMJ, 341, c5462. https://doi.org/10.1136/bmj.c5462 | 教學重點對過摘要（「血氧目標 88–92%」這個數字不在摘要裡） | C02B |
| Baile, W. F., Buckman, R., Lenzi, R., Glober, G., Beale, E. A., & Kudelka, A. P. (2000). SPIKES—A six-step protocol for delivering bad news: Application to the patient with cancer. The Oncologist, 5(4), 302–311. https://doi.org/10.1634/theoncologist.5-4-302 | 只核對書目 | C01C |
| Banks, P. A., et al. (2013). Classification of acute pancreatitis—2012: Revision of the Atlanta classification and definitions by international consensus. Gut, 62(1), 102–111. https://doi.org/10.1136/gutjnl-2012-302779 | 教學重點對過摘要（只有嚴重度分級對過摘要；診斷條件「三樣裡有兩樣」沒有對到原文） | C03C |
| Di Saverio, S., et al. (2020). Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World Journal of Emergency Surgery, 15, 27. https://doi.org/10.1186/s13017-020-00306-3 | 教學重點對過摘要 | C03B |
| Gulati, M., et al. (2021). 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR guideline for the evaluation and diagnosis of chest pain. Circulation, 144(22), e368–e454. https://doi.org/10.1161/CIR.0000000000001029 | 只核對書目 | C01A、C01B、C01C、C01D、C03A、C03C |
| Hamilton, W., Peters, T. J., Round, A., & Sharp, D. (2005). What are the clinical features of lung cancer before the diagnosis is made? A population based case-control study. Thorax, 60(12), 1059–1065. https://doi.org/10.1136/thx.2005.045880 | 只核對書目 | C01C |
| Heidenreich, P. A., et al. (2022). 2022 AHA/ACC/HFSA guideline for the management of heart failure. Circulation, 145(18), e895–e1032. https://doi.org/10.1161/CIR.0000000000001063 | 只核對書目 | C02A |
| Konstantinides, S. V., et al. (2020). 2019 ESC guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the European Respiratory Society (ERS). European Heart Journal, 41(4), 543–603. https://doi.org/10.1093/eurheartj/ehz405 | 只核對書目 | C01D |
| MacDuff, A., Arnold, A., & Harvey, J. (2010). Management of spontaneous pneumothorax: British Thoracic Society pleural disease guideline 2010. Thorax, 65(Suppl. 2), ii18–ii31. https://doi.org/10.1136/thx.2010.136986 | 只核對書目 | C02D |
| Metlay, J. P., et al. (2019). Diagnosis and treatment of adults with community-acquired pneumonia: An official clinical practice guideline of the American Thoracic Society and Infectious Diseases Society of America. American Journal of Respiratory and Critical Care Medicine, 200(7), e45–e67. https://doi.org/10.1164/rccm.201908-1581ST | 只核對書目 | C02C |
| Peery, A. F., Shaukat, A., & Strate, L. L. (2021). AGA clinical practice update on medical management of colonic diverticulitis: Expert review. Gastroenterology, 160(3), 906–911.e1. https://doi.org/10.1053/j.gastro.2020.09.059 | 教學重點對過摘要 | C03D |
| Rao, S. V., et al. (2025). 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. Journal of the American College of Cardiology, 85(22), 2135–2237. https://doi.org/10.1016/j.jacc.2024.11.009 | 只核對書目 | C01A |
| Wang, C. S., FitzGerald, J. M., Schulzer, M., Mak, E., & Ayas, N. T. (2005). Does this dyspneic patient in the emergency department have congestive heart failure? JAMA, 294(15), 1944–1956. https://doi.org/10.1001/jama.294.15.1944 | 教學重點對過摘要 | C02A、C02B、C02C |
| Wells, P. S., et al. (2001). Excluding pulmonary embolism at the bedside without diagnostic imaging: Management of patients with suspected pulmonary embolism presenting to the emergency department by using a simple clinical model and D-dimer. Annals of Internal Medicine, 135(2), 98–107. https://doi.org/10.7326/0003-4819-135-2-200107170-00010 | 教學重點對過摘要 | C01D |
| Yokoe, M., et al. (2018). Tokyo Guidelines 2018: Diagnostic criteria and severity grading of acute cholecystitis (with videos). Journal of Hepato-Biliary-Pancreatic Sciences, 25(1), 41–54. https://doi.org/10.1002/jhbp.515 | 只核對書目 | C03A |
