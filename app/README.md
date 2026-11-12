# 霧脈公會：互動原型

繪本畫風的可以玩的版本。五章、十二隻症影、48 張委託：臨床老師教案的十二個主訴（胸痛、喘、腹痛、發燒、頭痛、背痛、腳痛、腫脹、排泄物異常、皮膚疹子、體重減輕、感覺異常）都有了，每個主訴四個真身、各一位病人。第二章走完會升一階、少一層提示。

![第四、五章的四位病人和他們的症影：辛桑（腹主動脈瘤，出診到碼頭；負石龜）、穆槐（心衰竭合併肺水腫；漲水豚）、韋茜（過敏性休克，出診到碼頭；點墨魷）、裴柚（老年憂鬱；啃月鼠）](../docs/art/app-prototype.jpg)

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
| `npm test` | 規則、評分和存檔的測試（54 項） |
| `npm run cases` | 檢查所有病例，印出一張總表 |
| `npm run review` | 產生給臨床老師的審查清單，寫到 [`docs/review/`](../docs/review/README.md) |
| `python3 tools/review_docx.py 審查清單.docx` | 把審查清單轉成一份 Word 檔（要先裝 pandoc） |
| `npm run check` | 型別檢查 |
| `npm run build` | 型別檢查之後打包到 `dist/`：純靜態檔，連字體和離線快取一起，放到任何主機都能跑 |
| `npm run preview` | 在本機打開建好的那一包（離線、安裝、換版要用這個才看得到；`npm run dev` 不會啟用） |
| `python3 tools/convert_script.py 教案.docx --id c02a` | 把一份 OSCE 教案轉成病例的底稿，寫到 `drafts/`（見 [`src/data/README.md`](src/data/README.md)） |

需要 Node 22.18 以上（測試直接跑 TypeScript，不用另外編譯）。

## 放到網路上（靜態版）

整個遊戲是 `dist/` 裡的一包靜態檔，沒有伺服器。為什麼先做靜態版、少了什麼，看 [`docs/04-system-design.md`](../docs/04-system-design.md) 第 9 節。

**GitHub Pages（已經設好）**：到 repo 的 Settings → Pages，把 Source 選成「GitHub Actions」；之後每次合併到 main，[`.github/workflows/app.yml`](../.github/workflows/app.yml) 會檢查、建置、放上去。同一個流程在每個 PR 上也會跑檢查（不部署）。

**別的靜態主機**（Cloudflare Pages、Netlify、自己的主機）：根目錄 `app`，建置指令 `npm run build`，輸出 `dist`。路徑都是相對的，放在網域底下的哪一層都可以。要用 HTTPS，離線和安裝才會啟用。

靜態版給玩家的東西：

| 項目 | 怎麼運作 |
|---|---|
| 離線可玩 | 第一次打開時把整包存在裝置上，之後沒有網路也能玩 |
| 裝到手機 | 加到主畫面，全螢幕、有圖示。Android 的 Chrome 會出現安裝的按鈕；iPhone 用 Safari 的「分享 → 加入主畫面」 |
| 換版 | 新版在背景下載好，大廳出現「有新的版本」，玩家按了才換上 |
| 接著做 | 每做一個行動就存一次；頁面被收掉、關掉、按了「回公會」，回來都接得上 |
| 進度帶著走 | 「設定」裡匯出（檔案或一段文字），到另一台匯入。進度只存在裝置上，沒有帳號 |
| 字體 | 建置時從完整的字體檔只留遊戲用到的字，跟著遊戲一起放，不連到別的網站 |
| 匿名的使用統計 | 預設沒有。照 [`stats/README.md`](../stats/README.md) 設定之後，玩家被問過、選「可以回傳」才會送；總表在網址後面加 `#stats` |

字體是 [LXGW WenKai TC](https://github.com/lxgw/LxgwWenkaiTC)（SIL Open Font License 1.1），授權全文跟著字體檔放在 `dist/fonts/OFL.txt`。

## 一張委託怎麼走

1. **公會**：第一次打開先說明這是什麼，再選主角，然後才是序章（這是哪裡、你是誰、出了什麼事、你要做什麼）。之後是委託板和圖鑑；完成一張委託，下一張才會貼上板子。第一張委託岑禾會一步一步帶。
2. **閱題**：病人的資料，和進門前先想的三件事。
3. **病室**：畫面上掛著四盞燈，是這個主訴四個可能的診斷（圖鑑裡叫「真身」）。行動排成一排七個分頁，順序和考站一樣：

   | 階段 | 分頁 | 內容 |
   |---|---|---|
   | 一、問診 | 開場 | 洗手、自我介紹並核對身分、說明流程和隱私 |
   | | 主訴 | OLD CARTS 十題：怎麼不舒服、何時開始、位置、持續多久、性質、伴隨症狀、加重與緩解、會傳到哪、處理過嗎、幾分 |
   | | 病史 | 慢性病與控制、家族史、住院手術外傷、用藥與過敏、菸酒檳榔、工作與接觸史、飲食睡眠壓力、擔心什麼 |
   | | 系統 | 系統回顧四題：全身與頭頸、心肺、腸胃與泌尿、四肢 |
   | 二、評估 | 評估 | 生命徵象，再照模組做：整體、頭頸、胸部、心臟、腹部、四肢。動手之前先說明 |
   | 三、診斷 | 診斷 | 一句話說出問題，選最可能的診斷和還要排除的 |
   | 四、檢查 | 檢查 | 提出檢查、向醫師回報、重測、觀察、向病人說明、結案 |

   - 後面的分頁要做完前一段才打開；前面的隨時可以回去補。
   - **解讀**：拿到關鍵的線索，要選它讓哪一個診斷更像或比較不像。選對，霧才散、那盞燈才亮或暗掉；選錯，岑禾會說為什麼。
   - **岑禾的提問**：解讀到第三條，她會問一次「你最擔心哪一個」。
   - **值班鐘**在畫面最下面，隨時可以敲。
4. **回顧**：蒐集（哪一刻最影響判斷）→ 分析（分數、每一項的理由、你的想法怎麼變）→ 摘要（選一件下次要做到的事、這一關寫回圖鑑的線索）。

幾個刻意的設計：

- **病室裡講臨床的話。** 進了病室到看完回顧，畫面上的字只用臨床本來的說法：診斷、排除、更像、比較不像。「真身」「症影」和症影的名字，只出現在公會、故事、圖鑑，還有結案時岑禾的那一句。判讀的時候不用先把世界觀的詞翻譯回來。病例檢查器會擋（`npm run cases`）。

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
  data/      內容：共用的骨架（skeleton.ts）、十二個主訴模組（chest-pain.ts、dyspnea.ts … paresthesia.ts）、
             48 個病例（c01a … c12d）、第四章以後每個主訴自己的文獻（*.refs.ts）、目錄（index.ts、extras.ts）
             怎麼寫新病例：data/README.md
  art/       繪本風的畫：色盤和畫筆、角色（含六位主角）、病室和碼頭的貨棧、十二隻症影、每位病人床邊的隨身物、公會大廳（Canvas，沒有圖檔）
  ui/        畫面（React）：公會、病室、各種紙片、回顧、設定；progress.ts 管故事、解鎖和圖鑑；Portrait.tsx 畫圖鑑的小圖；
             store.ts 存進度和還沒結案的那一場；backup.ts 匯出匯入；pwa.ts 離線、換版、安裝；
             stats.ts 匿名的使用統計（要另外開）；StatsPage.tsx 給管理者看的總表
public/      圖示和 manifest（裝到手機用）
tools/
  static.ts           建置時做的兩件事：精簡字體、產生離線快取（sw.js）
  sw.template.js      離線快取的樣板
  icons.mjs           畫 App 的圖示（用遊戲自己的畫筆）
  cases.ts            npm run cases
  check_draft.ts      還沒登記的主訴和病例，先單獨檢查
  review.ts           npm run review：從病例檔產生審查清單
  review_docx.py      把審查清單轉成 Word 檔
  convert_script.py   教案 → 病例的底稿（寫到 drafts/，不進版本控制）
```

規則核心和畫面是分開的：畫面只做兩件事，把行動送進 `perform`，把回傳的事件演出來。
現在是靜態版，規則在瀏覽器裡跑。之後如果要把規則搬到伺服器（答案不送到瀏覽器），`core/` 可以原封不動搬過去。

## 還沒有的

- 資格試煉（真實倒數 15 分鐘、沒有提示）還沒做。終章（兩張委託同時送到）也還沒做。
- 第四、五章的 28 位病人是分七路同時寫、再整合的。檢查和瀏覽器試玩都過了，但我沒有逐字讀完每一個病例檔；這 28 位比前面 20 位更需要臨床老師逐項看。
- 提示只拿掉了第一層（第二章走完之後：線索的方向自己選、岑禾一張委託回答三次）。更後面的幾層還沒做。
- 每個真身只有一位病人，所以同一個真身還沒有「不典型的說法」可以練。
- 腹痛的四個真身照位置分，有可能被只看「痛在哪裡」猜中。現在的做法是：沒有把另外三個排除就下診斷，安全行動會是「需要複核」。夠不夠要再看。
- 場景只有公會大廳、病室（含下雨天）和碼頭的貨棧。圖鑑裡另外兩格（燈塔的值夜房、船塢的工寮）還只是名字。
- 主角只有外表不同；故事裡的對話還不會因為選了誰而改變。
- 沒有伺服器（靜態版）。**病例的答案在瀏覽器裡看得到**；進度只存在裝置上、不會自動同步。想知道大家怎麼玩，要另外把匿名的使用統計開起來（[`stats/`](../stats/README.md)）；什麼時候才需要更多的伺服器，看 `docs/04-system-design.md` 第 9.5 節。
- 離線、安裝、換版只在無頭瀏覽器裡測過，還沒有在真的 iPhone 和 Android 手機上裝過。
- 真身、回報和說明都是從清單選，還不能自己寫。
- 心電圖只有文字結果，沒有波形。

## 要知道的

- **病例還沒經過臨床老師審查，不能當教材。** 時間限制、分數的權重、哪些算安全行動，都是我依指引先訂的草稿。
- 問診和評估的骨架（開場、OLD CARTS、個人與過去病史、系統回顧、五個模組）參考臨床老師的 OSCE 教案；題目的文字和三位病人都是為這個專案重寫的，沒有用教案的原文。
- 畫是用程式畫的，角色、房間和構圖都是為這個專案重新設計的。
- 在真的手機上試過一次（改流程之前的版本）：系統字體調大的時候文字會疊在一起、對話被切掉。已經把版面改成跟著字的大小伸縮。這一版在模擬手機上重測過（390×760、385×700 字放大 1.25 倍、375×600），**還沒有在真的手機上確認**。
- 遊戲的分數是訓練用的，不代表正式甄審的成績。

## 病例的出處

- Aringer, M., et al. (2019). 2019 European League Against Rheumatism/American College of Rheumatology classification criteria for systemic lupus erythematosus. *Annals of the Rheumatic Diseases, 78*(9), 1151–1159. https://doi.org/10.1136/annrheumdis-2018-214819
- Austin, M. A., Wills, K. E., Blizzard, L., Walters, E. H., & Wood-Baker, R. (2010). Effect of high flow oxygen on mortality in chronic obstructive pulmonary disease patients in prehospital setting: Randomised controlled trial. *BMJ, 341*, c5462. https://doi.org/10.1136/bmj.c5462
- Baile, W. F., Buckman, R., Lenzi, R., Glober, G., Beale, E. A., & Kudelka, A. P. (2000). SPIKES—A six-step protocol for delivering bad news: Application to the patient with cancer. *The Oncologist, 5*(4), 302–311. https://doi.org/10.1634/theoncologist.5-4-302
- Banks, P. A., et al. (2013). Classification of acute pancreatitis—2012: Revision of the Atlanta classification and definitions by international consensus. *Gut, 62*(1), 102–111. https://doi.org/10.1136/gutjnl-2012-302779
- Barocas, D. A., et al. (2020). Microhematuria: AUA/SUFU guideline. *The Journal of Urology, 204*(4), 778–786. https://doi.org/10.1097/JU.0000000000001297
- Biggins, S. W., Angeli, P., Garcia-Tsao, G., Ginès, P., Ling, S. C., Nadim, M. K., Wong, F., & Kim, W. R. (2021). Diagnosis, evaluation, and management of ascites, spontaneous bacterial peritonitis and hepatorenal syndrome: 2021 practice guidance by the American Association for the Study of Liver Diseases. *Hepatology, 74*(2), 1014–1048. https://doi.org/10.1002/hep.31884
- Björck, M., et al. (2020). Editor's choice – European Society for Vascular Surgery (ESVS) 2020 clinical practice guidelines on the management of acute limb ischaemia. *European Journal of Vascular and Endovascular Surgery, 59*(2), 173–218. https://doi.org/10.1016/j.ejvs.2019.09.006
- Callaham, M. (1989). Hypoxic hazards of traditional paper bag rebreathing in hyperventilating patients. *Annals of Emergency Medicine, 18*(6), 622–628. https://doi.org/10.1016/s0196-0644(89)80515-3
- Chaikof, E. L., et al. (2018). The Society for Vascular Surgery practice guidelines on the care of patients with an abdominal aortic aneurysm. *Journal of Vascular Surgery, 67*(1), 2–77.e2. https://doi.org/10.1016/j.jvs.2017.10.044
- Chou, R., Qaseem, A., Owens, D. K., & Shekelle, P. (2011). Diagnostic imaging for low back pain: Advice for high-value health care from the American College of Physicians. *Annals of Internal Medicine, 154*(3), 181–189. https://doi.org/10.7326/0003-4819-154-3-201102010-00008
- Di Saverio, S., et al. (2020). Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. *World Journal of Emergency Surgery, 15*, 27. https://doi.org/10.1186/s13017-020-00306-3
- Do, T. P., et al. (2019). Red and orange flags for secondary headaches in clinical practice: SNNOOP10 list. *Neurology, 92*(3), 134–144. https://doi.org/10.1212/WNL.0000000000006697
- Downie, A., et al. (2013). Red flags to screen for malignancy and fracture in patients with low back pain: Systematic review. *BMJ, 347*, f7095. https://doi.org/10.1136/bmj.f7095
- Dworkin, R. H., et al. (2007). Recommendations for the management of herpes zoster. *Clinical Infectious Diseases, 44*(Suppl. 1), S1–S26. https://doi.org/10.1086/510206
- Evans, L., et al. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. *Critical Care Medicine, 49*(11), e1063–e1143. https://doi.org/10.1097/CCM.0000000000005337
- Gardner, A., Gardner, E., & Morley, T. (2011). Cauda equina syndrome: A review of the current clinical and medico-legal position. *European Spine Journal, 20*(5), 690–697. https://doi.org/10.1007/s00586-010-1668-3
- Gulati, M., et al. (2021). 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR guideline for the evaluation and diagnosis of chest pain. *Circulation, 144*(22), e368–e454. https://doi.org/10.1161/CIR.0000000000001029
- Hamilton, W., Peters, T. J., Round, A., & Sharp, D. (2005). What are the clinical features of lung cancer before the diagnosis is made? A population based case-control study. *Thorax, 60*(12), 1059–1065. https://doi.org/10.1136/thx.2005.045880
- Hamilton, W., Round, A., Sharp, D., & Peters, T. J. (2005). Clinical features of colorectal cancer before diagnosis: A population-based case-control study. *British Journal of Cancer, 93*(4), 399–405. https://doi.org/10.1038/sj.bjc.6602714
- Headache Classification Committee of the International Headache Society. (2018). *The International Classification of Headache Disorders, 3*rd edition. Cephalalgia, 38(1), 1–211. https://doi.org/10.1177/0333102417738202
- Heidenreich, P. A., et al. (2022). 2022 AHA/ACC/HFSA guideline for the management of heart failure. *Circulation, 145*(18), e895–e1032. https://doi.org/10.1161/CIR.0000000000001063
- Hoh, B. L., et al. (2023). 2023 guideline for the management of patients with aneurysmal subarachnoid hemorrhage: A guideline from the American Heart Association/American Stroke Association. *Stroke, 54*(7), e314–e370. https://doi.org/10.1161/STR.0000000000000436
- Hull, R. P., & Goldsmith, D. J. A. (2008). Nephrotic syndrome in adults. *BMJ, 336*(7654), 1185–1189. https://doi.org/10.1136/bmj.39576.709711.80
- Janssens, H. J. E. M., Fransen, J., van de Lisdonk, E. H., van Riel, P. L. C. M., van Weel, C., & Janssen, M. (2010). A diagnostic rule for acute gouty arthritis in primary care without joint fluid analysis. *Archives of Internal Medicine, 170*(13), 1120–1126. https://doi.org/10.1001/archinternmed.2010.196
- Johnson, J. R., & Russo, T. A. (2018). Acute pyelonephritis in adults. *New England Journal of Medicine, 378*(1), 48–59. https://doi.org/10.1056/NEJMcp1702758
- Konstantinides, S. V., et al. (2020). 2019 ESC guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the European Respiratory Society (ERS). *European Heart Journal, 41*(4), 543–603. https://doi.org/10.1093/eurheartj/ehz405
- Kothari, R. U., Pancioli, A., Liu, T., Brott, T., & Broderick, J. (1999). Cincinnati Prehospital Stroke Scale: Reproducibility and validity. *Annals of Emergency Medicine, 33*(4), 373–378. https://doi.org/10.1016/s0196-0644(99)70299-4
- Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2003). The Patient Health Questionnaire-2: Validity of a two-item depression screener. *Medical Care, 41*(11), 1284–1292. https://doi.org/10.1097/01.MLR.0000093487.78664.3C
- Laine, L., Barkun, A. N., Saltzman, J. R., Martel, M., & Leontiadis, G. I. (2021). ACG clinical guideline: Upper gastrointestinal and ulcer bleeding. *American Journal of Gastroenterology, 116*(5), 899–917. https://doi.org/10.14309/ajg.0000000000001245
- Lewinsohn, D. M., et al. (2017). Official American Thoracic Society/Infectious Diseases Society of America/Centers for Disease Control and Prevention clinical practice guidelines: Diagnosis of tuberculosis in adults and children. *Clinical Infectious Diseases, 64*(2), 111–115. https://doi.org/10.1093/cid/ciw778
- Lichtenstein, G. R., Loftus, E. V., Isaacs, K. L., Regueiro, M. D., Gerson, L. B., & Sands, B. E. (2018). ACG clinical guideline: Management of Crohn's disease in adults. *American Journal of Gastroenterology, 113*(4), 481–517. https://doi.org/10.1038/ajg.2018.27
- MacDuff, A., Arnold, A., & Harvey, J. (2010). Management of spontaneous pneumothorax: British Thoracic Society pleural disease guideline 2010. *Thorax, 65*(Suppl. 2), ii18–ii31. https://doi.org/10.1136/thx.2010.136986
- Metlay, J. P., et al. (2019). Diagnosis and treatment of adults with community-acquired pneumonia: An official clinical practice guideline of the American Thoracic Society and Infectious Diseases Society of America. *American Journal of Respiratory and Critical Care Medicine, 200*(7), e45–e67. https://doi.org/10.1164/rccm.201908-1581ST
- Neunert, C., et al. (2019). American Society of Hematology 2019 guidelines for immune thrombocytopenia. *Blood Advances, 3*(23), 3829–3866. https://doi.org/10.1182/bloodadvances.2019000966
- Patel, R. A., & Gallagher, J. C. (2010). Drug fever. *Pharmacotherapy, 30*(1), 57–69. https://doi.org/10.1592/phco.30.1.57
- Peery, A. F., Shaukat, A., & Strate, L. L. (2021). AGA clinical practice update on medical management of colonic diverticulitis: Expert review. *Gastroenterology, 160*(3), 906–911.e1. https://doi.org/10.1053/j.gastro.2020.09.059
- Perry, J. J., et al. (2013). Clinical decision rules to rule out subarachnoid hemorrhage for acute headache. *JAMA, 310*(12), 1248–1255. https://doi.org/10.1001/jama.2013.278018
- Pop-Busui, R., Boulton, A. J. M., Feldman, E. L., Bril, V., Freeman, R., Malik, R. A., Sosenko, J. M., & Ziegler, D. (2017). Diabetic neuropathy: A position statement by the American Diabetes Association. *Diabetes Care, 40*(1), 136–154. https://doi.org/10.2337/dc16-2042
- Powers, W. J., et al. (2019). Guidelines for the early management of patients with acute ischemic stroke: 2019 update to the 2018 guidelines for the early management of acute ischemic stroke: A guideline for healthcare professionals from the American Heart Association/American Stroke Association. *Stroke, 50*(12), e344–e418. https://doi.org/10.1161/STR.0000000000000211
- Rao, S. V., et al. (2025). 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. *Journal of the American College of Cardiology, 85*(22), 2135–2237. https://doi.org/10.1016/j.jacc.2024.11.009
- Ropper, A. H., & Zafonte, R. D. (2015). Sciatica. *New England Journal of Medicine, 372*(13), 1240–1248. https://doi.org/10.1056/NEJMra1410151
- Ross, D. S., et al. (2016). 2016 American Thyroid Association guidelines for diagnosis and management of hyperthyroidism and other causes of thyrotoxicosis. *Thyroid, 26*(10), 1343–1421. https://doi.org/10.1089/thy.2016.0229
- Sampson, H. A., et al. (2006). Second symposium on the definition and management of anaphylaxis: Summary report—Second National Institute of Allergy and Infectious Disease/Food Allergy and Anaphylaxis Network symposium. *Journal of Allergy and Clinical Immunology, 117*(2), 391–397. https://doi.org/10.1016/j.jaci.2005.12.1303
- Stabler, S. P. (2013). Vitamin B12 deficiency. *New England Journal of Medicine, 368*(2), 149–160. https://doi.org/10.1056/NEJMcp1113996
- Stevens, D. L., et al. (2014). Practice guidelines for the diagnosis and management of skin and soft tissue infections: 2014 update by the Infectious Diseases Society of America. *Clinical Infectious Diseases, 59*(2), e10–e52. https://doi.org/10.1093/cid/ciu444
- Türk, C., et al. (2016). EAU guidelines on diagnosis and conservative management of urolithiasis. *European Urology, 69*(3), 468–474. https://doi.org/10.1016/j.eururo.2015.07.040
- van de Beek, D., de Gans, J., Spanjaard, L., Weisfelt, M., Reitsma, J. B., & Vermeulen, M. (2004). Clinical features and prognostic factors in adults with bacterial meningitis. *New England Journal of Medicine, 351*(18), 1849–1859. https://doi.org/10.1056/NEJMoa040845
- van de Beek, D., et al. (2016). ESCMID guideline: Diagnosis and treatment of acute bacterial meningitis. *Clinical Microbiology and Infection, 22*(Suppl. 3), S37–S62. https://doi.org/10.1016/j.cmi.2016.01.007
- von Keudell, A. G., Weaver, M. J., Appleton, P. T., Bae, D. S., Dyer, G. S. M., Heng, M., Jupiter, J. B., & Vrahas, M. S. (2015). Diagnosis and treatment of acute extremity compartment syndrome. *The Lancet, 386*(10000), 1299–1310. https://doi.org/10.1016/S0140-6736(15)00277-9
- Wang, C. S., FitzGerald, J. M., Schulzer, M., Mak, E., & Ayas, N. T. (2005). *Does this dyspneic patient in the emergency department have congestive heart failure? JAMA, 294*(15), 1944–1956. https://doi.org/10.1001/jama.294.15.1944
- Wells, P. S., Anderson, D. R., Rodger, M., Forgie, M., Kearon, C., Dreyer, J., Kovacs, G., Mitchell, M., Lewandowski, B., & Kovacs, M. J. (2003). Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. *New England Journal of Medicine, 349*(13), 1227–1235. https://doi.org/10.1056/NEJMoa023153
- Wells, P. S., et al. (2001). Excluding pulmonary embolism at the bedside without diagnostic imaging: Management of patients with suspected pulmonary embolism presenting to the emergency department by using a simple clinical model and D-dimer. *Annals of Internal Medicine, 135*(2), 98–107. https://doi.org/10.7326/0003-4819-135-2-200107170-00010
- Winger, J., & Michelfelder, A. (2011). Diagnostic approach to the patient with jaundice. *Primary Care: Clinics in Office Practice, 38*(3), 469–482. https://doi.org/10.1016/j.pop.2011.05.004
- Wong, C. J. (2014). Involuntary weight loss. *Medical Clinics of North America, 98*(3), 625–643. https://doi.org/10.1016/j.mcna.2014.01.012
- Yokoe, M., et al. (2018). Tokyo Guidelines 2018: Diagnostic criteria and severity grading of acute cholecystitis (with videos). *Journal of Hepato-Biliary-Pancreatic Sciences, 25*(1), 41–54. https://doi.org/10.1002/jhbp.515

這 55 篇的書目資料都用 PubMed 核對過（前三章的 26 篇是寫的時候逐篇查的；第四、五章的 29 篇是分頭寫的時候各自查的，整合之後我再逐篇確認 PubMed 上有這一筆、DOI 對得上）。其中 33 篇，引用它的教學重點對過摘要；其餘的（多半是沒有摘要的指引和綜論）只核對了書目，內文沒有逐句對。每一篇核對到哪裡、用在哪幾關，列在 [`docs/review/README.md`](../docs/review/README.md)。寫的時候就沒把握的地方有 71 條，也列在那裡。
