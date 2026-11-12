# 給臨床老師的審查清單

《霧脈公會》現在有 48 個病例、12 個主訴。**全部都還沒經過臨床老師審查，不能當教材。**這份清單把每一關裡「有對錯」的地方攤開，請老師逐項看。

這一頁和各主訴的檔案都是程式從病例檔產生的（在 `app/` 底下跑 `npm run review`）。不要手改；病例改了，重跑一次就會更新。

## 怎麼審

每個主訴一份檔案。先看四個診斷分得合不合理，再一位一位看病人。每一位病人請看這七件事：

1. **故事**：年齡、職業、病程、生命徵象，合不合理？
2. **診斷和線索**：這個診斷，和病人說的、評估到的，對不對得上？
3. **要解讀的線索**：每一條的「指向」對不對？「理由」那句話有沒有說錯、說得太滿？
4. **安全行動**：該不該敲值班鐘、時間限制合不合理、最關鍵的檢查是不是那一項？
5. **回報和說明的選項**：標「對」的是不是真的對，標「錯」的是不是真的錯？有沒有超出專科護理師可以做的範圍？
6. **教學重點**：敘述有沒有超出引用的文獻？
7. **用語**：病人的話像不像病人會說的？有沒有不合臨床習慣的講法？

每一列後面有「☐同意 ☐要改」。每一位病人最後有一個整體的四點評分（4 可以用、3 小修、2 大修、1 不適合），和專家效度常用的四點量表同一個刻度；這只是方便彙整，不是正式的效度工具。

## 索引

| 代號 | 主訴 | 診斷 | 病人 | 穩不穩定 | 狀態 | 在哪一份 |
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
| C04A | 發燒 | 泌尿道 | 溫荷，34 歲，碼頭補網的女工 | 穩定 | 未審查 | [fever.md](fever.md) |
| C04B | 發燒 | 皮膚與軟組織 | 涂柏，71 歲，退休的老漁夫 | 不穩定 | 未審查 | [fever.md](fever.md) |
| C04C | 發燒 | 呼吸道 | 池榆，47 歲，遠洋貨船上的廚子 | 穩定 | 未審查 | [fever.md](fever.md) |
| C04D | 發燒 | 非感染 | 尤杉，45 歲，船塢的修船木匠 | 穩定 | 未審查 | [fever.md](fever.md) |
| C05A | 頭痛 | 原發性頭痛 | 喬芸，29 歲，公會帳房的書記 | 穩定 | 未審查 | [headache.md](headache.md) |
| C05B | 頭痛 | 顱內出血 | 魏葵，52 歲，魚市的秤手 | 不穩定 | 未審查 | [headache.md](headache.md) |
| C05C | 頭痛 | 中樞感染 | 賀楓，24 歲，貨船上的甲板水手 | 不穩定 | 未審查 | [headache.md](headache.md) |
| C05D | 頭痛 | 顱內壓升高 | 季蘭，58 歲，染坊的老闆娘 | 穩定 | 未審查 | [headache.md](headache.md) |
| C06A | 背痛 | 肌肉骨骼 | 石竹，38 歲，碼頭的搬運工 | 穩定 | 未審查 | [back-pain.md](back-pain.md) |
| C06B | 背痛 | 泌尿 | 甘棗，45 歲，鹽倉的帳房 | 穩定 | 未審查 | [back-pain.md](back-pain.md) |
| C06C | 背痛 | 脊椎與神經 | 藍桂，44 歲，織帆的女工 | 不穩定 | 未審查 | [back-pain.md](back-pain.md) |
| C06D | 背痛 | 血管與內臟 | 辛桑，72 歲，退休的船東 | 不穩定 | 未審查 | [back-pain.md](back-pain.md) |
| C07A | 腳痛 | 關節 | 戚杏，52 歲，港邊酒館的老闆 | 穩定 | 未審查 | [leg-pain.md](leg-pain.md) |
| C07B | 腳痛 | 血管 | 樂梧，68 歲，退休的領港人 | 不穩定 | 未審查 | [leg-pain.md](leg-pain.md) |
| C07C | 腳痛 | 肌肉與骨 | 孟榛，27 歲，船塢的鉚工 | 不穩定 | 未審查 | [leg-pain.md](leg-pain.md) |
| C07D | 腳痛 | 神經 | 祁柳，58 歲，魚市的攤販 | 穩定 | 未審查 | [leg-pain.md](leg-pain.md) |
| C08A | 腫脹 | 腎臟 | 紀蓮，34 歲，染坊的女工 | 穩定 | 未審查 | [swelling.md](swelling.md) |
| C08B | 腫脹 | 心臟 | 穆槐，76 歲，退休的鐘匠 | 不穩定 | 未審查 | [swelling.md](swelling.md) |
| C08C | 腫脹 | 肝臟 | 譚菊，57 歲，醬園的老闆娘 | 穩定 | 未審查 | [swelling.md](swelling.md) |
| C08D | 腫脹 | 局部 | 包梨，41 歲，遠洋商船的管事 | 穩定 | 未審查 | [swelling.md](swelling.md) |
| C09A | 排泄物異常 | 上消化道 | 寧樺，63 歲，箍木桶的木桶匠 | 不穩定 | 未審查 | [excreta.md](excreta.md) |
| C09B | 排泄物異常 | 下消化道 | 聞檀，56 歲，香料鋪的掌櫃 | 穩定 | 未審查 | [excreta.md](excreta.md) |
| C09C | 排泄物異常 | 泌尿道 | 厲芹，60 歲，調漆上漆的漆匠 | 穩定 | 未審查 | [excreta.md](excreta.md) |
| C09D | 排泄物異常 | 肝膽 | 雷榕，69 歲，乾貨行的老闆娘 | 穩定 | 未審查 | [excreta.md](excreta.md) |
| C10A | 皮膚疹子 | 感染 | 鄒薇，67 歲，茶館的老闆娘 | 穩定 | 未審查 | [rash.md](rash.md) |
| C10B | 皮膚疹子 | 過敏與藥物 | 韋茜，31 歲，海產攤的幫手 | 不穩定 | 未審查 | [rash.md](rash.md) |
| C10C | 皮膚疹子 | 發炎與免疫 | 麥萱，26 歲，繡坊的繡娘 | 穩定 | 未審查 | [rash.md](rash.md) |
| C10D | 皮膚疹子 | 出血與血管 | 申蓉，35 歲，藥鋪的夥計 | 穩定 | 未審查 | [rash.md](rash.md) |
| C11A | 體重減輕 | 內分泌與代謝 | 晏梅，33 歲，帆廠畫帆的畫工 | 穩定 | 未審查 | [weight-loss.md](weight-loss.md) |
| C11B | 體重減輕 | 惡性腫瘤 | 屠楠，64 歲，市場肉鋪的老闆 | 穩定 | 未審查 | [weight-loss.md](weight-loss.md) |
| C11C | 體重減輕 | 腸胃與吸收 | 席橘，29 歲，跑霧港和鄰鎮的信差 | 穩定 | 未審查 | [weight-loss.md](weight-loss.md) |
| C11D | 體重減輕 | 身心與生活 | 裴柚，78 歲，退休的老船匠 | 穩定 | 未審查 | [weight-loss.md](weight-loss.md) |
| C12A | 感覺異常 | 周邊神經 | 汪茗，54 歲，茶商 | 穩定 | 未審查 | [paresthesia.md](paresthesia.md) |
| C12B | 感覺異常 | 腦 | 焦菱，66 歲，當鋪的掌櫃 | 不穩定 | 未審查 | [paresthesia.md](paresthesia.md) |
| C12C | 感覺異常 | 脊髓與神經根 | 鮑藤，62 歲，退休的廚子 | 穩定 | 未審查 | [paresthesia.md](paresthesia.md) |
| C12D | 感覺異常 | 代謝與其他 | 祝葦，28 歲，歌樓的歌手 | 穩定 | 未審查 | [paresthesia.md](paresthesia.md) |

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
- **胸痛的「血管」**：這個診斷底下只有肺栓塞一位病人（C01D），主動脈剝離沒有病人。
- **喘（C02B）**：氧氣的目標寫 88–92%。這個數字不在引用的那篇文獻的摘要裡，請確認數字和「照醫囑調」的寫法。
- **喘（C02D）**：回顧寫「氣胸開始壓迫時不等 X 光」。依據只核對到書目，請對照原文。
- **喘的「突發急症」**：這個診斷底下放了氣胸和肺栓塞兩個病，合不合適？從喘進來的肺栓塞沒有病人。
- **腹痛的四個診斷**：照位置分（膽囊與膽道、胰臟與胃、闌尾、大腸憩室）。為了避免學員只看位置就猜，方苓、邵棠、鄔桃這三關，沒有把另外三個排除就下診斷會是「需要複核」。這個做法夠不夠？
- **腹痛（C03C）**：胰臟炎的診斷條件（三樣裡有兩樣、脂肪酶超過正常上限三倍）沒有對到原文。
- **腹痛（C03D）**：遊戲裡的影像檢查只有腹部超音波，結果寫「醫師通常會再安排電腦斷層」。要不要把電腦斷層加成一項檢查？
- **沒有病人的鑑別**：消化性潰瘍，以及下腹的泌尿、婦科和疝氣。只在回顧的文字裡提到。
- **發燒的四個診斷**：呼吸道、泌尿道、皮膚與軟組織、非感染。教案分成感染和非感染兩類；這裡把感染照源頭拆成三個。肚子裡的感染和腦膜炎沒有放進這四個診斷（腦膜炎放在頭痛底下），只在回顧裡提到。這樣分合不合適？
- **發燒（C04C）**：懷疑肺結核時，寫「請病人戴上口罩、移到單獨而且通風的房間，照顧的人戴 N95」，通報寫成由醫師和院方處理。隔離的做法、誰可以先做、要不要先通報，請照院內感染管制的規定看。咳嗽幾週要想到結核，遊戲裡沒有寫死一個數字。
- **發燒（C04C）**：這一關「非感染」故意設計成排除不了：發燒、盜汗、體重減輕，腫瘤也會這樣。所以安全行動只要求排除泌尿道和皮膚。這樣設計合不合理？
- **發燒（C04D）**：藥物熱的線索用了「燒到 38.6 度、心跳只有 84」「人看起來不像在發燒」「軀幹的疹子」「嗜酸性球上升」。這幾項不在引用文獻的摘要裡，是一般的教法，請確認說法有沒有太滿。停藥寫成「請醫師評估」，不是專科護理師自己停。
- **發燒（C04D）**：要馬上回來的警訊寫了嘴巴破、眼睛紅、臉腫、皮膚起水泡或脫皮、喘。是在防嚴重的藥物反應，沒有另外引用文獻。
- **發燒（C04B）**：敗血症的處理寫「量乳酸、用抗生素之前留血液培養、盡快給抗生素和輸液」。指引沒有摘要，只核對了書目；「一張委託裡該由誰做哪一步」也請照實際的規定看。
- **發燒（C04B）**：老人家在家量到 37.8 度、到院 38.4 度，用來教「燒不高不代表不嚴重」。數字合不合理？
- **頭痛的四個診斷**：原發性頭痛、顱內出血、中樞感染、顱內壓升高。顳動脈炎、急性青光眼、一氧化碳中毒、止痛藥過度使用沒有放進四個診斷，只在問診和評估裡各有一題在篩。
- **頭痛（C05A）**：沒有紅旗的典型偏頭痛，回報時「請同意馬上做頭部電腦斷層」標成錯的選項。這一點沒有引用文獻，是設計上的判斷，請老師決定要不要保留。
- **頭痛（C05A）**：偏頭痛的診斷條件（單側、搏動性、活動加重、噁心或畏光怕吵、持續幾小時到三天）只核對了書目。
- **頭痛（C05B）**：變差之後的生命徵象寫成血壓升高、心跳變慢、一邊瞳孔變大。這是為了讓玩家看得出「在惡化」，數字和時間都是設計出來的，請看會不會誤導。血壓「要不要降、降到多少」一律寫成請醫師指示。
- **頭痛（C05C）**：懷疑細菌性腦膜炎時，寫「血液培養先留、抗生素不要因為等斷層或腰椎穿刺而延後」，以及「先讓病人戴口罩、照顧的人做飛沫防護」。指引沒有摘要，只核對了書目；時限和隔離的做法請對照原文和院內規定。腿上的出血點用來提示腦膜炎雙球菌，沒有寫出菌名。
- **頭痛（C05C）**：變差之後寫成血壓掉、意識更差、出血點變多。數字是設計出來的。
- **頭痛（C05D）**：診斷是顱內壓升高（乳癌病史，懷疑腦部轉移）。遊戲把她當成「穩定、今天就要請醫師看和安排影像，但不用敲值班鐘」。有視神經盤水腫的病人這樣算不算太慢，請老師決定。慢性硬腦膜下出血也在這個診斷底下，但沒有病人。
- **頭痛的評估**：加了一組神經學檢查（腦神經、肌力與漂移、感覺與反射、協調與步態）和眼底。專科護理師在考站會不會被要求做眼底鏡，請老師確認。
- **指引類的文獻**：胸痛、急性冠心症、心衰竭、肺栓塞、膽囊炎、肺炎、氣胸、敗血症、蜘蛛膜下腔出血的指引，以及腎盂腎炎的綜論、頭痛的分類、結核病的診斷指引和細菌性腦膜炎的指引，只核對了書目。引用它們的教學重點請對照原文。
- **甄審的規定**：遊戲的配分照 115 年度的口試。第一批玩家考的是下一年度，公告之後要再核對。
- **背痛的四個診斷**：肌肉骨骼、泌尿、脊椎與神經、血管與內臟。教案分成泌尿和骨骼兩類；這裡把「骨骼」拆成一般的肌肉骨骼和不能等的脊椎問題，再加上血管。胰臟、帶狀疱疹和婦科來的背痛沒有放進四個診斷。這樣分合不合適？
- **背痛（C06A）**：沒有紅旗的急性下背痛，回報時「馬上照腰椎的片子」標成錯的選項（依引用文獻的摘要）。「不用整天躺著、照常活動」「多半幾天到幾個禮拜會好」是一般的教法，沒有掛文獻。請老師決定要不要保留。
- **背痛的評估**：加了「會陰的感覺和肛門收縮」。遊戲裡寫成先說明、取得同意、有人陪同才做。專科護理師在考站和實務上做到哪裡，請老師確認。
- **背痛（C06B）**：結石「堵住又感染、尿不出來、只有一顆腎臟」不能等，是一般的教法，不在引用文獻的摘要裡。止痛和止吐寫成請醫師評估。
- **背痛（C06C）**：馬尾症候群變差之後寫成「尿失禁而不自覺、右腳掌翹不起來」，生命徵象幾乎不變，這是為了讓玩家看得出惡化設計出來的。「慢一個鐘頭就少一分力氣」是岑禾的台詞，不是文獻的數字。導尿、磁振造影和後送都寫成請醫師決定。
- **背痛（C06D）**：有症狀的腹主動脈瘤寫成「摸到搏動的腫塊就不要再按」「輸液和血壓的目標由醫師決定」。危險因子（年紀、抽菸、高血壓、家族史）和「常被當成閃到腰或腎絞痛」是一般的教法，不在引用文獻的摘要裡。變差之後的生命徵象是設計出來的。
- **腳痛的四個診斷**：血管、關節、肌肉與骨、神經。教案分成肌肉骨骼和血管兩類；這裡把肌肉骨骼拆成兩個，再加上神經。深部靜脈栓塞放在「血管」底下，但病人在腫脹那一組（C08D）；蜂窩性組織炎沒有放進這四個診斷（在發燒那一組）。這樣分合不合適？
- **腳痛（C07A）**：痛風和化膿性關節炎在同一個診斷（關節）底下，用「沒有發燒、沒有傷口或打針、以前同一處自己好過、關節還有一點活動度」當成先不抽關節液的憑據。這個門檻夠不夠安全？「可以冰敷，熱敷和包緊不行」是一般的教法，沒有掛文獻。
- **腳痛（C07B）**：急性肢體缺血的指引沒有摘要，只核對了書目。「不抬高、不熱敷、保暖、腳放平或稍微垂著」和「抗凝血的藥請醫師指示」的寫法，請對照實際的做法。變差之後的表現（花斑、腳趾不能動）和時間是設計出來的。
- **腳痛（C07C）**：這一關的安全行動沒有照其他不穩定的關卡（通報 6 分＋檢查 3 分），改成通報 6 分、「鬆開包紮並把腳放到和心臟一樣高」2 分、X 光 1 分。鬆開包紮誰可以先做、腳要放多高，請老師確認。「脈搏摸得到不能排除」「被動伸展劇痛是最早的徵象」是一般的教法，不在引用文獻的摘要裡。
- **腳痛（C07D）**：沒有警訊的坐骨神經痛，這一關沒有非做不可的檢查；影像寫成請醫師評估，錯的選項是「臥床兩個禮拜」。「多數在幾個禮拜裡會慢慢好」「長時間臥床沒有幫助」沒有掛文獻；引用的綜論沒有摘要，只核對了書目。她已經有大腳趾背屈無力，算「穩定、不敲鐘、約回來看力氣」合不合理？
- **腳痛的評估**：直腿抬高、被動伸展腳趾、動發炎的關節，都會引發疼痛。說明的句子都寫了「痛了就停」，請看夠不夠。
- **腫脹的四個診斷**：心臟、腎臟、肝臟、局部。教案分成單側和雙側；這裡把雙側拆成三個器官，單側算一個「局部」（靜脈栓塞、蜂窩性組織炎、淋巴水腫）。藥物引起的腫（例如某些降血壓藥）、甲狀腺、營養不良沒有放進四個診斷，只在問診的用藥那一題篩。這樣分合不合適？
- **腫脹（C08A）**：腎病症候群的定義（大量蛋白尿、低白蛋白、水腫，常合併高血脂）和併發症（血栓、感染、急性腎損傷）引用的綜論沒有摘要，只核對了書目。「晨起眼皮先腫」「泡沫尿」當成指向腎臟的線索，是一般的教法。病人吃止痛藥粉和草藥這件事，遊戲寫成「報給醫師、請醫師告訴她能不能再吃」，沒有讓專科護理師直接叫她停。
- **腫脹（C08B）**：穆槐一開始血氧 88%、呼吸 30 下，遊戲仍然照考站的順序讓玩家先問診，下診斷之後兩分鐘沒通報才變差。這樣的病人真的會等嗎？回顧裡有寫「真實的情境一進門就要叫人」，請看夠不夠。變差之後的數字（血氧 82%、粉紅色泡沫痰）是設計出來的。氧氣和利尿劑一律寫成請醫師指示。
- **腫脹（C08B）**：「把腳抬高、讓他躺平」標成錯的請求，理由是會讓更多的水回到肺。這是設計上的判斷，沒有引用文獻。
- **腫脹（C08C）**：「先腫肚子、後腫腳」當成指向肝臟的線索，是一般的教法，沒有對到文獻。「第一次出現的腹水要抽出來檢查」「限鹽和利尿劑、要監測腎功能和電解質」引用的指引沒有摘要，只核對了書目。病人白天想睡、記性變差，是留給肝腦病變的伏筆，但評估時寫成沒有撲翼樣震顫；這樣安排會不會讓人混淆？
- **腫脹（C08D）**：兩邊小腿「差 3 公分以上有意義」是常用的評估表裡的項目，不在引用文獻的摘要裡。遊戲裡 D-dimer 沒有做成一項檢查，直接做超音波（因為她評估起來可能性高）。「調經的藥丸」是用來代替含雌激素的藥，當成血栓的危險因子。深部靜脈栓塞的病人算「穩定、今天做超音波、不敲值班鐘」，合不合理？
- **排泄物異常的四個診斷**：上消化道、下消化道、泌尿道、肝膽。腹瀉、便秘這一類「次數和形狀」的問題沒有自己的一個診斷，只在問診裡問。這樣分合不合適？
- **肛門指診（C09A 到 C09D）**：四關都把肛門指診放進身體評估，寫成「說明、取得同意、請同仁陪同」之後由專科護理師做。在考站和實際的規定裡，這一項由誰做、要不要改成「向醫師提出」，請老師決定。病人拒絕的時候怎麼處理，遊戲裡只在回顧提了一句。
- **排泄物異常（C09A）**：躺著和站著的血壓（104/64、心跳 112；站起來 86/54、心跳 134）、血色素 7.8、「尿素氮偏高是上消化道出血常見的樣子」，都是設計出來的數字和一般的教法，不在引用文獻的摘要裡。讓一個可能在出血的人站起來量血壓合不合適？回報裡寫「平躺、禁食、放兩條粗的靜脈管路」由專科護理師先做，輸血、輸液、停止痛藥和內視鏡的時間請醫師指示，這條線畫得對不對？
- **排泄物異常（C09B）**：用「血混在便裡、便變細、解不乾淨、排便習慣改變」和痔瘡分開，肛門指診寫成在直腸摸到硬而不平的腫塊、外痔沒有出血。這幾句分辨的說法是一般的教法，沒有另外引用文獻。
- **排泄物異常（C09C）**：引用的是顯微血尿的指引；這位病人是不痛的肉眼血尿。「整泡紅、開頭紅、最後紅各代表哪一段」「尿裡的紅血球形狀正常、沒有蛋白，比較不像腎絲球的問題」「花柳病多半會痛、會有分泌物」是一般的教法。超音波寫成看得到膀胱壁上的病灶，是為了讓玩家有東西解讀，請看會不會誤導。
- **排泄物異常（C09D）**：「黃疸、摸得到脹大而不痛的膽囊，堵住它的多半不是結石」是傳統的教法，沒有另外引用文獻。她沒有發燒、不痛，遊戲把她算成穩定、不敲鐘；合併發燒、畏寒、腹痛才是急症，這一點只寫在說明的警訊和回顧裡。這樣算合不合理？
- **皮膚疹子的四個診斷**：感染、過敏與藥物、發炎與免疫、出血與血管。教案只有一份；這裡照「疹子在說什麼」拆成四個。這樣分合不合適？
- **皮膚疹子（C10A）**：帶狀疱疹沒有設「非做不可的檢查」，安全行動是排除過敏和出血、交代什麼情況要回來、不敲鐘。「抗病毒藥越早開始越好」寫在回顧裡，沒有寫死幾個小時，也沒有掛文獻。懷孕的女兒和小孩怎麼避開，寫成「結痂之前不要碰到疹子，細節請醫師補充」，請確認說法。
- **皮膚疹子（C10B）**：過敏性休克的判斷寫成「皮膚，加上呼吸道、血壓或腸胃裡的任何一樣」。這是一般的教法，引用的文獻摘要裡沒有準則的內容。腎上腺素寫成「請您指示，我已經備好」；專科護理師能不能照預立的流程先給、劑量和途徑，請照院內的規定看。擺位寫成「躺下、腳墊高；躺著更喘就半坐；不要自己站起來」，也請確認。
- **皮膚疹子（C10B）**：這一關「下診斷之後三分鐘內提出檢查」的安全行動掛在抽血上，是因為回報裡「腎上腺素請您指示……靜脈管路和抽血一起做」這一句等於提出抽血。真正要緊的是叫人和備藥，不是那一管血。這樣設計會不會誤導？變差之後的生命徵象是設計出來的。
- **皮膚疹子（C10C）**：紅斑性狼瘡用蝴蝶斑、光敏感、對稱的關節炎、口腔潰瘍、掉髮、蛋白尿和血尿、血球偏低來寫。引用的是分類標準（研究用），不是診斷流程。說明裡「病控制住了，斑多半會淡下去」請確認有沒有說得太滿。
- **皮膚疹子（C10D）**：血小板 8,000、口腔有血泡、月經過多的病人，遊戲算「穩定、今天抽血、不敲鐘、不放她回去」。這樣合不合理？「不給會影響血小板的止痛退燒藥、不打肌肉針」是一般的做法，沒有掛文獻。
- **體重減輕的四個診斷**：惡性腫瘤、內分泌與代謝、腸胃與吸收、身心與生活。教案的病人是甲狀腺亢進，另外三位是補上的。這四位都算穩定、不敲值班鐘，會不會讓學員以為「瘦的人都不急」？糖尿病酮酸中毒和甲狀腺風暴只在回顧裡提到，沒有病人。
- **體重減輕（C11D）**：自傷的念頭寫成「直接問」。問到之後寫成：報告醫師、告訴家人、今天不讓他一個人回去、把助眠的藥水收起來；有念頭但沒有計畫時，不敲值班鐘。怎麼問、問到之後專科護理師該做到哪裡、什麼情況才算急，請照院內的自殺防治流程看。這幾句沒有引用文獻。
- **體重減輕（C11D）**：兩題憂鬱篩檢用在 78 歲的長者身上；原始研究是在基層和婦產科門診做的。認知只做了很短的篩檢（記三樣東西、日期）。假牙鬆脫、獨自吃飯、喝酒助眠都放在「身心與生活」這個診斷底下。這樣合不合適？
- **體重減輕（C11B）**：左鎖骨上的淋巴結、家族史、醃燻食物和抽菸，當成指向胃腫瘤的線索，沒有另外引用文獻。「腸胃與吸收」（潰瘍出血）設計成排除不了，要胃鏡才分得出來。檢查出來之前說到哪裡，照 C05D 的做法。
- **體重減輕（C11C）**：克隆氏症的臨床表現（口腔潰瘍、肛門瘻管、右下腹摸到增厚的腸段、關節和皮膚）不在引用指引的摘要裡，是一般的教法。「帶血的腹瀉先不給止瀉藥，要先問過醫師」也沒有引用文獻。肛門周圍的視診放在「腹部與肛門」這一項裡，寫成先說明、徵得同意、拉上簾子；考站會不會要求做，請老師確認。
- **體重減輕（C11A）**：甲狀腺亢進要馬上回來的警訊（心跳很亂、高燒、躁動混亂、眼睛痛或複視）沒有另外引用文獻。「治療之後脾氣急和手抖多半會慢慢退」這句安慰的話，說得會不會太滿？
- **感覺異常的四個診斷**：腦、脊髓與神經根、周邊神經、代謝與其他。教案的例子是糖尿病的神經病變（單股尼龍絲）；這裡另外補了中風、維生素 B12 缺乏的脊髓病變和過度換氣。這樣分合不合適？維生素 B12 缺乏同時會傷到周邊神經和脊髓，遊戲把它放在「脊髓」底下。
- **感覺異常（C12A）**：足部檢查寫「尼龍絲十個點只感覺到三個」，衛教寫「每天看腳、洗腳前用手試水溫、新鞋先穿短時間」，泡熱水和熱敷標成錯的選項。糖尿病神經病變的立場聲明沒有摘要，只核對了書目；檢查的點數和衛教的內容請對照院內的做法。夜裡灼痛的用藥寫成請醫師評估。
- **感覺異常（C12B）**：中風那一關寫了「最後一次正常的時間」「先測血糖」「吞嚥還沒評估之前不吃不喝」「血壓不要自己急著降」「能不能做打通血管的治療，由醫師依時間和影像決定」。指引的摘要沒有這些細節，只核對了書目；治療的時間窗沒有寫出數字。遊戲裡的時間用「時辰」和「刻」，半個時辰大約是一小時，請看會不會誤導。
- **感覺異常（C12B）**：變差之後寫成右手完全抬不起來、說不成句、血壓更高。這是為了讓玩家看得出惡化設計出來的。
- **感覺異常（C12C）**：維生素 B12 缺乏寫了胃切除、長期幾乎不吃肉蛋、長期吃制酸的藥、舌頭紅而光滑、大球性貧血、震動覺和位置覺先壞、膝反射增強合併踝反射減弱、兩側病理反射、低頭時的電麻。引用的綜論沒有摘要，只核對了書目。「補得早，神經回來的機會比較大」這句話有沒有說得太滿，請老師看。脊椎的影像寫成請醫師決定。
- **感覺異常（C12D）**：過度換氣那一關，「對著紙袋呼吸」標成錯的選項（文獻對過摘要）。「輕敲耳前嘴角會抽動」和「兩手抽緊」用來提示神經過度興奮，抽血的鈣寫成正常；這幾樣沒有另外引用文獻。年輕女性突然喘，遊戲用血氧、肺部聽診、心電圖、血糖和危險因子來排除危險的原因，沒有做肺栓塞的進一步檢查。這樣夠不夠，請老師決定。

## 文獻

書目資料都用 PubMed 核對過。「教學重點對過摘要」的意思是：遊戲裡引用它的那幾句話，和摘要的內容對過。「只核對書目」的意思是：確認這篇文獻存在、書目正確，但遊戲裡的敘述沒有逐句對過原文。

| 文獻 | 核對到哪裡 | 哪幾關用到 |
|------------------------|------------|------|
| Aringer, M., et al. (2019). 2019 European League Against Rheumatism/American College of Rheumatology classification criteria for systemic lupus erythematosus. Annals of the Rheumatic Diseases, 78(9), 1151–1159. https://doi.org/10.1136/annrheumdis-2018-214819 | 教學重點對過摘要 | C10C |
| Austin, M. A., Wills, K. E., Blizzard, L., Walters, E. H., & Wood-Baker, R. (2010). Effect of high flow oxygen on mortality in chronic obstructive pulmonary disease patients in prehospital setting: Randomised controlled trial. BMJ, 341, c5462. https://doi.org/10.1136/bmj.c5462 | 教學重點對過摘要（「血氧目標 88–92%」這個數字不在摘要裡） | C02B |
| Baile, W. F., Buckman, R., Lenzi, R., Glober, G., Beale, E. A., & Kudelka, A. P. (2000). SPIKES—A six-step protocol for delivering bad news: Application to the patient with cancer. The Oncologist, 5(4), 302–311. https://doi.org/10.1634/theoncologist.5-4-302 | 只核對書目 | C01C、C05D、C09B、C11B |
| Banks, P. A., et al. (2013). Classification of acute pancreatitis—2012: Revision of the Atlanta classification and definitions by international consensus. Gut, 62(1), 102–111. https://doi.org/10.1136/gutjnl-2012-302779 | 教學重點對過摘要（只有嚴重度分級對過摘要；診斷條件「三樣裡有兩樣」沒有對到原文） | C03C |
| Barocas, D. A., et al. (2020). Microhematuria: AUA/SUFU guideline. The Journal of Urology, 204(4), 778–786. https://doi.org/10.1097/JU.0000000000001297 | 教學重點對過摘要（這是顯微血尿的指引；遊戲裡的病人是肉眼血尿） | C09C |
| Biggins, S. W., Angeli, P., Garcia-Tsao, G., Ginès, P., Ling, S. C., Nadim, M. K., Wong, F., & Kim, W. R. (2021). Diagnosis, evaluation, and management of ascites, spontaneous bacterial peritonitis and hepatorenal syndrome: 2021 practice guidance by the American Association for the Study of Liver Diseases. Hepatology, 74(2), 1014–1048. https://doi.org/10.1002/hep.31884 | 只核對書目 | C08C |
| Björck, M., et al. (2020). Editor's choice – European Society for Vascular Surgery (ESVS) 2020 clinical practice guidelines on the management of acute limb ischaemia. European Journal of Vascular and Endovascular Surgery, 59(2), 173–218. https://doi.org/10.1016/j.ejvs.2019.09.006 | 只核對書目 | C07B |
| Callaham, M. (1989). Hypoxic hazards of traditional paper bag rebreathing in hyperventilating patients. Annals of Emergency Medicine, 18(6), 622–628. https://doi.org/10.1016/s0196-0644(89)80515-3 | 教學重點對過摘要 | C12D |
| Chaikof, E. L., et al. (2018). The Society for Vascular Surgery practice guidelines on the care of patients with an abdominal aortic aneurysm. Journal of Vascular Surgery, 67(1), 2–77.e2. https://doi.org/10.1016/j.jvs.2017.10.044 | 教學重點對過摘要（只引用摘要裡的兩句（破裂時 90 分鐘內開始處置、4.0 到 4.9 公分每 12 個月追蹤）；症狀和危險因子不在摘要裡） | C06D |
| Chou, R., Qaseem, A., Owens, D. K., & Shekelle, P. (2011). Diagnostic imaging for low back pain: Advice for high-value health care from the American College of Physicians. Annals of Internal Medicine, 154(3), 181–189. https://doi.org/10.7326/0003-4819-154-3-201102010-00008 | 教學重點對過摘要 | C06A |
| Di Saverio, S., et al. (2020). Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World Journal of Emergency Surgery, 15, 27. https://doi.org/10.1186/s13017-020-00306-3 | 教學重點對過摘要 | C03B |
| Do, T. P., et al. (2019). Red and orange flags for secondary headaches in clinical practice: SNNOOP10 list. Neurology, 92(3), 134–144. https://doi.org/10.1212/WNL.0000000000006697 | 教學重點對過摘要 | C05A、C05B、C05D |
| Downie, A., et al. (2013). Red flags to screen for malignancy and fracture in patients with low back pain: Systematic review. BMJ, 347, f7095. https://doi.org/10.1136/bmj.f7095 | 教學重點對過摘要 | C06A |
| Dworkin, R. H., et al. (2007). Recommendations for the management of herpes zoster. Clinical Infectious Diseases, 44(Suppl. 1), S1–S26. https://doi.org/10.1086/510206 | 教學重點對過摘要（摘要支持「抗病毒藥是第一線」；幾小時之內要開始用藥沒有對到原文，遊戲裡沒有寫死時間） | C10A |
| Evans, L., et al. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. Critical Care Medicine, 49(11), e1063–e1143. https://doi.org/10.1097/CCM.0000000000005337 | 只核對書目 | C04A、C04B |
| Gardner, A., Gardner, E., & Morley, T. (2011). Cauda equina syndrome: A review of the current clinical and medico-legal position. European Spine Journal, 20(5), 690–697. https://doi.org/10.1007/s00586-010-1668-3 | 教學重點對過摘要 | C06C |
| Gulati, M., et al. (2021). 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR guideline for the evaluation and diagnosis of chest pain. Circulation, 144(22), e368–e454. https://doi.org/10.1161/CIR.0000000000001029 | 只核對書目 | C01A、C01B、C01C、C01D、C03A、C03C |
| Hamilton, W., Peters, T. J., Round, A., & Sharp, D. (2005). What are the clinical features of lung cancer before the diagnosis is made? A population based case-control study. Thorax, 60(12), 1059–1065. https://doi.org/10.1136/thx.2005.045880 | 只核對書目 | C01C |
| Hamilton, W., Round, A., Sharp, D., & Peters, T. J. (2005). Clinical features of colorectal cancer before diagnosis: A population-based case-control study. British Journal of Cancer, 93(4), 399–405. https://doi.org/10.1038/sj.bjc.6602714 | 教學重點對過摘要（摘要支持的是哪些線索和大腸直腸癌有關、單獨看機會都不高；「血混在便裡」「解不乾淨」這些和痔瘡分辨的說法不在摘要裡） | C09B |
| Headache Classification Committee of the International Headache Society. (2018). The International Classification of Headache Disorders, 3rd edition. Cephalalgia, 38(1), 1–211. https://doi.org/10.1177/0333102417738202 | 只核對書目 | C05A |
| Heidenreich, P. A., et al. (2022). 2022 AHA/ACC/HFSA guideline for the management of heart failure. Circulation, 145(18), e895–e1032. https://doi.org/10.1161/CIR.0000000000001063 | 只核對書目 | C02A、C08B |
| Hoh, B. L., et al. (2023). 2023 guideline for the management of patients with aneurysmal subarachnoid hemorrhage: A guideline from the American Heart Association/American Stroke Association. Stroke, 54(7), e314–e370. https://doi.org/10.1161/STR.0000000000000436 | 只核對書目 | C05B |
| Hull, R. P., & Goldsmith, D. J. A. (2008). Nephrotic syndrome in adults. BMJ, 336(7654), 1185–1189. https://doi.org/10.1136/bmj.39576.709711.80 | 只核對書目 | C08A |
| Janssens, H. J. E. M., Fransen, J., van de Lisdonk, E. H., van Riel, P. L. C. M., van Weel, C., & Janssen, M. (2010). A diagnostic rule for acute gouty arthritis in primary care without joint fluid analysis. Archives of Internal Medicine, 170(13), 1120–1126. https://doi.org/10.1001/archinternmed.2010.196 | 教學重點對過摘要 | C07A |
| Johnson, J. R., & Russo, T. A. (2018). Acute pyelonephritis in adults. New England Journal of Medicine, 378(1), 48–59. https://doi.org/10.1056/NEJMcp1702758 | 只核對書目 | C04A |
| Konstantinides, S. V., et al. (2020). 2019 ESC guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the European Respiratory Society (ERS). European Heart Journal, 41(4), 543–603. https://doi.org/10.1093/eurheartj/ehz405 | 只核對書目 | C01D |
| Kothari, R. U., Pancioli, A., Liu, T., Brott, T., & Broderick, J. (1999). Cincinnati Prehospital Stroke Scale: Reproducibility and validity. Annals of Emergency Medicine, 33(4), 373–378. https://doi.org/10.1016/s0196-0644(99)70299-4 | 教學重點對過摘要（摘要寫的是三項裡任何一項異常，由醫師評估時敏感度 66%、特異度 87%；所以遊戲裡也寫了「三樣都正常不能完全排除」） | C12B |
| Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2003). The Patient Health Questionnaire-2: Validity of a two-item depression screener. Medical Care, 41(11), 1284–1292. https://doi.org/10.1097/01.MLR.0000093487.78664.3C | 教學重點對過摘要 | C11D |
| Laine, L., Barkun, A. N., Saltzman, J. R., Martel, M., & Leontiadis, G. I. (2021). ACG clinical guideline: Upper gastrointestinal and ulcer bleeding. American Journal of Gastroenterology, 116(5), 899–917. https://doi.org/10.14309/ajg.0000000000001245 | 教學重點對過摘要（對過摘要的是：先評估風險、輸血門檻 7 g/dL、24 小時內做內視鏡。「尿素氮偏高」不在摘要裡，遊戲裡沒有掛在這篇上） | C09A |
| Lewinsohn, D. M., et al. (2017). Official American Thoracic Society/Infectious Diseases Society of America/Centers for Disease Control and Prevention clinical practice guidelines: Diagnosis of tuberculosis in adults and children. Clinical Infectious Diseases, 64(2), 111–115. https://doi.org/10.1093/cid/ciw778 | 只核對書目 | C04C |
| Lichtenstein, G. R., Loftus, E. V., Isaacs, K. L., Regueiro, M. D., Gerson, L. B., & Sands, B. E. (2018). ACG clinical guideline: Management of Crohn's disease in adults. American Journal of Gastroenterology, 113(4), 481–517. https://doi.org/10.1038/ajg.2018.27 | 教學重點對過摘要（摘要只支持「原因不明的慢性發炎、發生率增加」；口腔潰瘍、瘻管等臨床表現沒有對到原文） | C11C |
| MacDuff, A., Arnold, A., & Harvey, J. (2010). Management of spontaneous pneumothorax: British Thoracic Society pleural disease guideline 2010. Thorax, 65(Suppl. 2), ii18–ii31. https://doi.org/10.1136/thx.2010.136986 | 只核對書目 | C02D |
| Metlay, J. P., et al. (2019). Diagnosis and treatment of adults with community-acquired pneumonia: An official clinical practice guideline of the American Thoracic Society and Infectious Diseases Society of America. American Journal of Respiratory and Critical Care Medicine, 200(7), e45–e67. https://doi.org/10.1164/rccm.201908-1581ST | 只核對書目 | C02C |
| Neunert, C., et al. (2019). American Society of Hematology 2019 guidelines for immune thrombocytopenia. Blood Advances, 3(23), 3829–3866. https://doi.org/10.1182/bloodadvances.2019000966 | 教學重點對過摘要 | C10D |
| Patel, R. A., & Gallagher, J. C. (2010). Drug fever. Pharmacotherapy, 30(1), 57–69. https://doi.org/10.1592/phco.30.1.57 | 教學重點對過摘要（相對性的心跳慢、疹子和嗜酸性球不在摘要裡，遊戲裡沒有把這幾項掛在這篇文獻上） | C04D |
| Peery, A. F., Shaukat, A., & Strate, L. L. (2021). AGA clinical practice update on medical management of colonic diverticulitis: Expert review. Gastroenterology, 160(3), 906–911.e1. https://doi.org/10.1053/j.gastro.2020.09.059 | 教學重點對過摘要 | C03D |
| Perry, J. J., et al. (2013). Clinical decision rules to rule out subarachnoid hemorrhage for acute headache. JAMA, 310(12), 1248–1255. https://doi.org/10.1001/jama.2013.278018 | 教學重點對過摘要 | C05B |
| Pop-Busui, R., Boulton, A. J. M., Feldman, E. L., Bril, V., Freeman, R., Malik, R. A., Sosenko, J. M., & Ziegler, D. (2017). Diabetic neuropathy: A position statement by the American Diabetes Association. Diabetes Care, 40(1), 136–154. https://doi.org/10.2337/dc16-2042 | 只核對書目 | C12A |
| Powers, W. J., et al. (2019). Guidelines for the early management of patients with acute ischemic stroke: 2019 update to the 2018 guidelines for the early management of acute ischemic stroke: A guideline for healthcare professionals from the American Heart Association/American Stroke Association. Stroke, 50(12), e344–e418. https://doi.org/10.1161/STR.0000000000000211 | 只核對書目 | C12B |
| Rao, S. V., et al. (2025). 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. Journal of the American College of Cardiology, 85(22), 2135–2237. https://doi.org/10.1016/j.jacc.2024.11.009 | 只核對書目 | C01A |
| Ropper, A. H., & Zafonte, R. D. (2015). Sciatica. New England Journal of Medicine, 372(13), 1240–1248. https://doi.org/10.1056/NEJMra1410151 | 只核對書目 | C07D |
| Ross, D. S., et al. (2016). 2016 American Thyroid Association guidelines for diagnosis and management of hyperthyroidism and other causes of thyrotoxicosis. Thyroid, 26(10), 1343–1421. https://doi.org/10.1089/thy.2016.0229 | 教學重點對過摘要（只有「先確定原因再談治療」「葛瑞夫茲氏病有三種治療」對過摘要；症狀和要回來的警訊沒有對到原文） | C11A |
| Sampson, H. A., et al. (2006). Second symposium on the definition and management of anaphylaxis: Summary report—Second National Institute of Allergy and Infectious Disease/Food Allergy and Anaphylaxis Network symposium. Journal of Allergy and Clinical Immunology, 117(2), 391–397. https://doi.org/10.1016/j.jaci.2005.12.1303 | 教學重點對過摘要（摘要只說明會議訂了臨床的判斷準則；準則的內容沒有對到原文，遊戲裡寫在回顧的文字、不掛在這篇文獻上） | C10B |
| Stabler, S. P. (2013). Vitamin B12 deficiency. New England Journal of Medicine, 368(2), 149–160. https://doi.org/10.1056/NEJMcp1113996 | 只核對書目 | C12C |
| Stevens, D. L., et al. (2014). Practice guidelines for the diagnosis and management of skin and soft tissue infections: 2014 update by the Infectious Diseases Society of America. Clinical Infectious Diseases, 59(2), e10–e52. https://doi.org/10.1093/cid/ciu444 | 教學重點對過摘要（摘要只支持「從輕微到壞死性筋膜炎都有、要靠臨床評估及早認出」；壞死性感染的警訊沒有對到原文） | C04B |
| Türk, C., et al. (2016). EAU guidelines on diagnosis and conservative management of urolithiasis. European Urology, 69(3), 468–474. https://doi.org/10.1016/j.eururo.2015.07.040 | 教學重點對過摘要（「堵住又感染、尿不出來不能等」不在摘要裡，遊戲裡沒有把這一句掛在這篇文獻上） | C06B |
| van de Beek, D., de Gans, J., Spanjaard, L., Weisfelt, M., Reitsma, J. B., & Vermeulen, M. (2004). Clinical features and prognostic factors in adults with bacterial meningitis. New England Journal of Medicine, 351(18), 1849–1859. https://doi.org/10.1056/NEJMoa040845 | 教學重點對過摘要 | C05C |
| van de Beek, D., et al. (2016). ESCMID guideline: Diagnosis and treatment of acute bacterial meningitis. Clinical Microbiology and Infection, 22(Suppl. 3), S37–S62. https://doi.org/10.1016/j.cmi.2016.01.007 | 只核對書目 | C05C |
| von Keudell, A. G., Weaver, M. J., Appleton, P. T., Bae, D. S., Dyer, G. S. M., Heng, M., Jupiter, J. B., & Vrahas, M. S. (2015). Diagnosis and treatment of acute extremity compartment syndrome. The Lancet, 386(10000), 1299–1310. https://doi.org/10.1016/S0140-6736(15)00277-9 | 教學重點對過摘要（「脈搏摸得到不能排除」「被動伸展劇痛是最早的徵象」不在摘要裡，遊戲裡沒有把這兩句掛在這篇文獻上） | C07C |
| Wang, C. S., FitzGerald, J. M., Schulzer, M., Mak, E., & Ayas, N. T. (2005). Does this dyspneic patient in the emergency department have congestive heart failure? JAMA, 294(15), 1944–1956. https://doi.org/10.1001/jama.294.15.1944 | 教學重點對過摘要 | C02A、C02B、C02C、C08B |
| Wells, P. S., Anderson, D. R., Rodger, M., Forgie, M., Kearon, C., Dreyer, J., Kovacs, G., Mitchell, M., Lewandowski, B., & Kovacs, M. J. (2003). Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. New England Journal of Medicine, 349(13), 1227–1235. https://doi.org/10.1056/NEJMoa023153 | 教學重點對過摘要（摘要支持「評估起來不太可能、D-dimer 又陰性，可以不做超音波」；評估表的各個項目（例如小腿粗 3 公分）不在摘要裡） | C08D |
| Wells, P. S., et al. (2001). Excluding pulmonary embolism at the bedside without diagnostic imaging: Management of patients with suspected pulmonary embolism presenting to the emergency department by using a simple clinical model and D-dimer. Annals of Internal Medicine, 135(2), 98–107. https://doi.org/10.7326/0003-4819-135-2-200107170-00010 | 教學重點對過摘要 | C01D |
| Winger, J., & Michelfelder, A. (2011). Diagnostic approach to the patient with jaundice. Primary Care: Clinics in Office Practice, 38(3), 469–482. https://doi.org/10.1016/j.pop.2011.05.004 | 教學重點對過摘要（「摸得到脹大而不痛的膽囊」不在摘要裡，遊戲裡沒有掛在這篇上） | C09D |
| Wong, C. J. (2014). Involuntary weight loss. Medical Clinics of North America, 98(3), 625–643. https://doi.org/10.1016/j.mcna.2014.01.012 | 教學重點對過摘要 | C11A、C11B、C11C、C11D |
| Yokoe, M., et al. (2018). Tokyo Guidelines 2018: Diagnostic criteria and severity grading of acute cholecystitis (with videos). Journal of Hepato-Biliary-Pancreatic Sciences, 25(1), 41–54. https://doi.org/10.1002/jhbp.515 | 只核對書目 | C03A |
