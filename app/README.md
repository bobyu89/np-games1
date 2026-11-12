# 霧脈公會：互動原型

繪本畫風的可以玩的版本。三章、五隻症影、十六張委託：第一章是胸痛（鐵翅蛾）的四位病人，第二章是喘（風箱蛙）和腹痛（結繩蟹）各四位，第三章是發燒（餘燼蜥）和頭痛（篤篤鳥）各兩位。前兩章每隻症影的四個真身都有一位病人；第三章還有四個真身沒有病人。第二章走完會升一階、少一層提示。

![第二章後來補上的四位病人：柯蒲（肺炎）、岳楊（氣胸，出診到碼頭）、龔椿（胰臟炎）、鄔桃（憩室炎）](../docs/art/app-prototype.jpg)

## 怎麼跑

```bash
npm install
```

```bash
npm run dev
```

其他指令：

| 指令 | 做什麼 |
|---|---|
| `npm test` | 規則和評分的測試（46 項） |
| `npm run cases` | 檢查所有病例，印出一張總表 |
| `npm run review` | 產生給臨床老師的審查清單，寫到 [`docs/review/`](../docs/review/README.md) |
| `python3 tools/review_docx.py 審查清單.docx` | 把審查清單轉成一份 Word 檔（要先裝 pandoc） |
| `npm run check` | 型別檢查 |
| `npm run build` | 型別檢查之後打包到 `dist/`，是純靜態檔，放到任何主機都能跑 |
| `python3 tools/convert_script.py 教案.docx --id c02a` | 把一份 OSCE 教案轉成病例的底稿，寫到 `drafts/`（見 [`src/data/README.md`](src/data/README.md)） |

需要 Node 22.18 以上（測試直接跑 TypeScript，不用另外編譯）。字體從 Google Fonts 載入。

## 一張委託怎麼走

1. **公會**：故事的段落、選主角、委託板、圖鑑。完成一張委託，下一張才會貼上板子。
2. **閱題**：病人的資料，和進門前先想的三件事。
3. **病室**：症影底下掛著四盞燈，是四個可能的真身。行動排成一排七個分頁，順序和考站一樣：

   | 階段 | 分頁 | 內容 |
   |---|---|---|
   | 一、問診 | 開場 | 洗手、自我介紹並核對身分、說明流程和隱私 |
   | | 主訴 | OLD CARTS 十題：怎麼不舒服、何時開始、位置、持續多久、性質、伴隨症狀、加重與緩解、會傳到哪、處理過嗎、幾分 |
   | | 病史 | 慢性病與控制、家族史、住院手術外傷、用藥與過敏、菸酒檳榔、工作與接觸史、飲食睡眠壓力、擔心什麼 |
   | | 系統 | 系統回顧四題：全身與頭頸、心肺、腸胃與泌尿、四肢 |
   | 二、評估 | 評估 | 生命徵象，再照模組做：整體、頭頸、胸部、心臟、腹部、四肢。動手之前先說明 |
   | 三、診斷 | 診斷 | 一句話說出問題，選最可能的真身和還要排除的 |
   | 四、檢查 | 檢查 | 提出檢查、向醫師回報、重測、觀察、向病人說明、結案 |

   - 後面的分頁要做完前一段才打開；前面的隨時可以回去補。
   - **解讀**：拿到關鍵的線索，要選它讓哪一個真身更像或比較不像。選對，霧才散、那盞燈才亮或暗掉；選錯，岑禾會說為什麼。
   - **岑禾的提問**：解讀到第三條，她會問一次「你最擔心哪一個」。
   - **值班鐘**在畫面最下面，隨時可以敲。
4. **回顧**：蒐集（哪一刻最影響判斷）→ 分析（分數、每一項的理由、你的想法怎麼變）→ 摘要（選一件下次要做到的事、這一關寫回圖鑑的線索）。

幾個刻意的設計：

- **照順序做不會被罰。** 問診和評估花多久，病人都不會變差。
- **時間只在做行動的時候走。** 看字、解讀線索、下診斷都不扣時間。問診和評估整套做完，模擬的時鐘大約走 15 分鐘，和考站差不多。
- **沒量過就是不知道。** 生命徵象一開始沒有數字；病人變差之後要重測才知道。
- **四位病人的選項一模一樣，真身不一樣。** 林秋（心因性）下了診斷之後，兩分鐘內沒有通報會變差。簡晴（肌肉骨骼）很穩定，敲值班鐘反而是過度通報，要做的是把危險的真身一個一個排除。莫桐（胸腔腫瘤）不急，但不能當成老毛病放回去，說明的時候也不能搶著說出診斷。阮舟（血管急症，肺栓塞）年輕、沒有病史，喘和心跳快很容易被當成緊張；要看血氧和小腿。
- **每一隻症影有自己的四個真身。** 喘：心因性、氣道阻塞、肺部感染、突發急症。腹痛照四個象限：膽囊與膽道、胰臟與胃、闌尾、大腸憩室。問診的開場、病史和系統回顧三隻都一樣；主訴那一段的問法、檢查項目各自不同；腹痛的身體評估換成腹部的做法（看、聽、敲、摸）。
- **六位主角只有外表不同。** 葉澄、高遠、白芷、杜衡、蘇木、連翹能做的事、題目和分數完全一樣。
- **回報的內容來自你問到的東西。** 沒問他擔心什麼，說明的時候就沒有那一句可以選。
- **圖鑑只收你自己解讀對的線索。** 另外兩頁（人物、場景）是遇到了、去過了才打開；小圖直接用真正的場景畫出來，不是另外的圖檔。
- **地點會換。** 阮舟那一張是出診，在碼頭的貨棧；莫桐來的那天在下雨。

**和真實臨床不一樣的地方**：考站是整套問診和評估做完才說計畫。真實的急診不會等：疑似急性冠心症，心電圖要在到院 10 分鐘內做完。遊戲照考站的順序，這件事寫在林秋那一關的回顧裡。

長期怎麼推進（故事、圖鑑、階級），看 [`docs/06-progression.md`](../docs/06-progression.md)。

## 程式怎麼分

```
src/
  core/      規則核心：不碰畫面、沒有亂數、不看真實時間，也不認得任何一個特定的病例
    types.ts     病例格式（第 3 版）和對局的狀態
    module.ts    主訴模組 + 病例 → 完整的病例
    engine.ts    perform(病例, 對局, 行動) → 新的對局 + 發生的事
    scoring.ts   評分（55 / 45）、安全狀態、回顧和圖鑑用的資料
    validate.ts  病例檢查器
    autoplay.ts  照病例的資料走出理想的打法，用來驗證病例
  data/      內容：共用的骨架（skeleton.ts）、主訴模組（chest-pain.ts、dyspnea.ts、abdomen.ts）、
             病例（胸痛 c01a–d、喘 c02a–d、腹痛 c03a–d）、目錄（index.ts）
             怎麼寫新病例：data/README.md
  art/       繪本風的畫：色盤和畫筆、角色（含六位主角）、病室和碼頭的貨棧、五隻症影、公會大廳（Canvas，沒有圖檔）
  ui/        畫面（React）：公會、病室、各種紙片、回顧；progress.ts 管故事、解鎖和圖鑑；Portrait.tsx 畫圖鑑的小圖
tools/
  cases.ts            npm run cases
  review.ts           npm run review：從病例檔產生審查清單
  review_docx.py      把審查清單轉成 Word 檔
  convert_script.py   教案 → 病例的底稿（寫到 drafts/，不進版本控制）
```

規則核心和畫面是分開的：畫面只做兩件事，把行動送進 `perform`，把回傳的事件演出來。
之後要把規則搬到伺服器（答案不送到瀏覽器），`core/` 可以原封不動搬過去。

## 還沒有的

- 只有胸痛、喘、腹痛、發燒、頭痛五個主訴；發燒和頭痛各只有兩位病人，另外兩個真身（發燒：呼吸道、非感染；頭痛：中樞感染、顱內壓升高）還沒有。其他主訴、資格試煉（真實倒數 15 分鐘）都還沒做。
- 提示只拿掉了第一層（第二章走完之後：線索的方向自己選、岑禾一張委託回答三次）。更後面的幾層還沒做。
- 每個真身只有一位病人，所以同一個真身還沒有「不典型的說法」可以練。有些鑑別沒有對應的病人：消化性潰瘍、從喘進來的肺栓塞，以及下腹的泌尿、婦科和疝氣。
- 腹痛的四個真身照位置分，有可能被只看「痛在哪裡」猜中。現在的做法是：沒有把另外三個排除就下診斷，安全行動會是「需要複核」。夠不夠要再看。
- 場景只有公會大廳、病室（含下雨天）和碼頭的貨棧。圖鑑裡另外兩格（燈塔的值夜房、船塢的工寮）還只是名字。
- 主角只有外表不同；故事裡的對話還不會因為選了誰而改變。
- 沒有伺服器。進度存在這台裝置的瀏覽器裡；**病例的答案現在在瀏覽器裡看得到**，正式版要搬到伺服器。
- 真身、回報和說明都是從清單選，還不能自己寫。
- 提示還沒有照階級一層一層拿掉（設計在 `docs/06-progression.md` 第 7 節）。
- 心電圖只有文字結果，沒有波形。

## 要知道的

- **病例還沒經過臨床老師審查，不能當教材。** 時間限制、分數的權重、哪些算安全行動，都是我依指引先訂的草稿。
- 問診和評估的骨架（開場、OLD CARTS、個人與過去病史、系統回顧、五個模組）參考臨床老師的 OSCE 教案；題目的文字和三位病人都是為這個專案重寫的，沒有用教案的原文。
- 畫是用程式畫的，角色、房間和構圖都是為這個專案重新設計的。
- 在真的手機上試過一次（改流程之前的版本）：系統字體調大的時候文字會疊在一起、對話被切掉。已經把版面改成跟著字的大小伸縮。這一版在模擬手機上重測過（390×760、385×700 字放大 1.25 倍、375×600），**還沒有在真的手機上確認**。
- 遊戲的分數是訓練用的，不代表正式甄審的成績。

## 病例的出處

- Gulati, M., et al. (2021). 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR guideline for the evaluation and diagnosis of chest pain. *Circulation, 144*(22), e368–e454. https://doi.org/10.1161/CIR.0000000000001029
- Hamilton, W., Peters, T. J., Round, A., & Sharp, D. (2005). What are the clinical features of lung cancer before the diagnosis is made? A population based case-control study. *Thorax, 60*(12), 1059–1065. https://doi.org/10.1136/thx.2005.045880
- Austin, M. A., et al. (2010). Effect of high flow oxygen on mortality in chronic obstructive pulmonary disease patients in prehospital setting: Randomised controlled trial. *BMJ, 341*, c5462. https://doi.org/10.1136/bmj.c5462
- Banks, P. A., et al. (2013). Classification of acute pancreatitis—2012: Revision of the Atlanta classification and definitions by international consensus. *Gut, 62*(1), 102–111. https://doi.org/10.1136/gutjnl-2012-302779
- Baile, W. F., et al. (2000). SPIKES—A six-step protocol for delivering bad news: Application to the patient with cancer. *The Oncologist, 5*(4), 302–311. https://doi.org/10.1634/theoncologist.5-4-302
- Do, T. P., et al. (2019). Red and orange flags for secondary headaches in clinical practice: SNNOOP10 list. *Neurology, 92*(3), 134–144. https://doi.org/10.1212/WNL.0000000000006697
- Evans, L., et al. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. *Critical Care Medicine, 49*(11), e1063–e1143. https://doi.org/10.1097/CCM.0000000000005337
- Di Saverio, S., et al. (2020). Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. *World Journal of Emergency Surgery, 15*, 27. https://doi.org/10.1186/s13017-020-00306-3
- Headache Classification Committee of the International Headache Society. (2018). The International Classification of Headache Disorders, 3rd edition. *Cephalalgia, 38*(1), 1–211. https://doi.org/10.1177/0333102417738202
- Heidenreich, P. A., et al. (2022). 2022 AHA/ACC/HFSA guideline for the management of heart failure. *Circulation, 145*(18), e895–e1032. https://doi.org/10.1161/CIR.0000000000001063
- Hoh, B. L., et al. (2023). 2023 guideline for the management of patients with aneurysmal subarachnoid hemorrhage: A guideline from the American Heart Association/American Stroke Association. *Stroke, 54*(7), e314–e370. https://doi.org/10.1161/STR.0000000000000436
- Johnson, J. R., & Russo, T. A. (2018). Acute pyelonephritis in adults. *New England Journal of Medicine, 378*(1), 48–59. https://doi.org/10.1056/NEJMcp1702758
- Konstantinides, S. V., et al. (2020). 2019 ESC guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the European Respiratory Society (ERS). *European Heart Journal, 41*(4), 543–603. https://doi.org/10.1093/eurheartj/ehz405
- MacDuff, A., Arnold, A., & Harvey, J. (2010). Management of spontaneous pneumothorax: British Thoracic Society pleural disease guideline 2010. *Thorax, 65*(Suppl. 2), ii18–ii31. https://doi.org/10.1136/thx.2010.136986
- Metlay, J. P., et al. (2019). Diagnosis and treatment of adults with community-acquired pneumonia: An official clinical practice guideline of the American Thoracic Society and Infectious Diseases Society of America. *American Journal of Respiratory and Critical Care Medicine, 200*(7), e45–e67. https://doi.org/10.1164/rccm.201908-1581ST
- Peery, A. F., Shaukat, A., & Strate, L. L. (2021). AGA clinical practice update on medical management of colonic diverticulitis: Expert review. *Gastroenterology, 160*(3), 906–911.e1. https://doi.org/10.1053/j.gastro.2020.09.059
- Perry, J. J., et al. (2013). Clinical decision rules to rule out subarachnoid hemorrhage for acute headache. *JAMA, 310*(12), 1248–1255. https://doi.org/10.1001/jama.2013.278018
- Rao, S. V., et al. (2025). 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. *Journal of the American College of Cardiology, 85*(22), 2135–2237. https://doi.org/10.1016/j.jacc.2024.11.009
- Stevens, D. L., et al. (2014). Practice guidelines for the diagnosis and management of skin and soft tissue infections: 2014 update by the Infectious Diseases Society of America. *Clinical Infectious Diseases, 59*(2), e10–e52. https://doi.org/10.1093/cid/ciu444

- Wells, P. S., et al. (2001). Excluding pulmonary embolism at the bedside without diagnostic imaging: Management of patients with suspected pulmonary embolism presenting to the emergency department by using a simple clinical model and D-dimer. *Annals of Internal Medicine, 135*(2), 98–107. https://doi.org/10.7326/0003-4819-135-2-200107170-00010
- Wang, C. S., et al. (2005). Does this dyspneic patient in the emergency department have congestive heart failure? *JAMA, 294*(15), 1944–1956. https://doi.org/10.1001/jama.294.15.1944
- Yokoe, M., et al. (2018). Tokyo Guidelines 2018: Diagnostic criteria and severity grading of acute cholecystitis (with videos). *Journal of Hepato-Biliary-Pancreatic Sciences, 25*(1), 41–54. https://doi.org/10.1002/jhbp.515

二十二篇的書目資料都用 PubMed 核對過。教學重點對過摘要的有：Wang、Austin、Wells、Di Saverio、Peery、Do、Perry，以及 Banks 的嚴重度分級和 Stevens 的概括敘述。只核對了書目、內文沒有逐句對的有：胸痛、急性冠心症、心衰竭、肺栓塞、膽囊炎、肺炎、氣胸、敗血症、蜘蛛膜下腔出血的指引，腎盂腎炎的綜論、頭痛的分類，還有 Banks 的診斷條件（三樣裡有兩樣）。每一篇核對到哪裡、用在哪幾關，列在 [`docs/review/README.md`](../docs/review/README.md)。
