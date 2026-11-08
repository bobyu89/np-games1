# 《黃金一小時》Game Design Document v0

> 暫定名稱｜類型：教學型自走棋（educational auto-battler）｜對象：NP 學員｜第一章：ICU Sepsis｜狀態：發想草案，待臨床專家審閱

---

## 0. 一句話定位

**你是 ICU 值班 NP：判讀病人、調度跨專業團隊、湊齊 sepsis bundle 羈絆，在黃金一小時內把病人從 septic shock 拉回來。**

設計主軸是 **「Bundle 就是羈絆」**。自走棋好玩在湊羈絆，臨床做得對在把 bundle 做完整，兩者的結構一樣。玩家為了贏去湊羈絆的同時，就是在練習完整執行 bundle。

> 我們只借用自走棋**類型**的機制（商店、羈絆、自動戰鬥、經濟）。角色、名稱、美術、介面全部自己做，不使用任何現有商業遊戲的素材或名稱。

---

## 1. 目標玩家與使用情境

| 項目 | 內容 |
|---|---|
| Persona | NP 學員：已有 RN 臨床經驗，正在接受專科護理師訓練。基本護理很熟，醫療決策和時效排序比較新 |
| 情境 A：課堂 | 一局 20–30 分鐘，投影或分組進行，結束後由教師帶 debrief |
| 情境 B：自學 | 手機一局 15 分鐘，系統自動產生 debrief |
| 設計含義 | 不教基本護理，要練的是 **辨識 → 排序 → 決策 → 協調** |

設計上採用的實證：
- Game-based learning 主要改善**認知層面**的學習成果（Kuruca Ozdemir & Dinc, 2022）→ 學習目標聚焦在知識應用和決策排序。
- **有時間限制的遊戲容易提高學生焦慮**（Tavares, 2022）→ 評估和調度階段不倒數，或只用寬鬆的計時，另外提供練習模式。
- 帶領者的 prebrief / **debrief** 是學習的關鍵（Quek et al., 2024）→ 每回合固定有交班 debrief。
- 在 sepsis 教育上，模擬、遊戲這類主動學習比單向授課成效好（Choy et al., 2022）。

---

## 2. 學習目標（Learning Objectives）

| # | 學習目標（完成後學員能夠…） | Bloom 層級 | 對應遊戲機制 | 評量方式 | 依據 |
|---|---|---|---|---|---|
| LO1 | 用 NEWS / MEWS / SIRS 篩檢 sepsis，並說明 qSOFA 不建議**單獨**當篩檢工具 | 應用 | 評估階段（偵查） | 情境題、評估正確率 | Evans et al., 2021 |
| LO2 | 列出 Hour-1 bundle 五要素 | 記憶／理解 | Bundle 羈絆 | 遊戲內羈絆完成率、前後測 | Levy et al., 2018 |
| LO3 | 依時效排出初始處置順序：先採血液培養但不能因此延誤；possible septic shock 時，抗生素最好在 1 小時內給 | 分析 | 站位決定出手順序、時間窗 | 回放 debrief、排序題 | Evans et al., 2021；Levy et al., 2018 |
| LO4 | 依血行動力學決定升壓策略：NE first-line、MAP ≥ 65 mmHg、可以先從周邊給以免延誤、NE 不夠時加 vasopressin | 應用 | 裝備系統 | 情境題 | Evans et al., 2021 |
| LO5 | 用 ISBAR 結構化交班 | 應用 | 回合結束的交班 debrief | 交班排序小題 | Müller et al., 2018 |

---

## 3. 核心循環

```
┌────────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. 評估     │ → │ 2. 調度     │ → │ 3. 佈陣   │ → │ 4. 自動處置    │ → │ 5. 交班       │
│ (偵查敵情)  │   │ (商店買人)  │   │ (站位排序) │   │ (自動戰鬥)     │   │ Debrief      │
└────────────┘   └────────────┘   └──────────┘   └──────────────┘   └──────┬───────┘
       ↑                                                                  │
       └──────────────────── 下一個病程階段（下一波）─────────────────────────┘
```

### 3.1 評估階段 = 自走棋的「偵查對手」
- 顯示病人資料卡（虛構案例）：生命徵象、檢驗值、病史。
- 玩家選要用哪個評估工具、標出異常值。**判讀對越多項，揭露的敵方陣容越多**；沒評估到的部分維持「戰爭迷霧」。
- 這一關不是考試。評估做得好，換來的是**資訊優勢**：知道接下來要對付什麼，才知道該調度誰。對應 LO1。
- 陷阱選項：只用 qSOFA 判讀時，系統只揭露一部分資訊，debrief 會說明原因（Evans et al., 2021）。

### 3.2 調度階段（商店）
- 每回合商店隨機出 5 張角色卡，可以花點數「調度支援」刷新。
- 有限的資源點數迫使玩家**排優先順序**。

### 3.3 佈陣階段：站位就是出手順序
- 棋盤代表 ICU 床邊空間，**前排的角色先出手**。
- 所以「先 culture 再給抗生素」是靠站位排出來的。對應 LO3。

### 3.4 自動處置（戰鬥）
- 角色依站位和速度自動出手；敵人是病理過程，見 §4.4。
- **時間窗**：抗生素角色如果在戰鬥開始後 N 秒內出手，拿「黃金一小時」加成。
- **順序規則**：culture 比抗生素先出手 → 「培養加成」（之後的抗生素傷害提高）。但如果 culture 拖到抗生素錯過時間窗 → 扣分。對應指引「先採檢，但不能因此明顯延誤用藥」（Levy et al., 2018；Evans et al., 2021）。

### 3.5 交班 Debrief（每回合）
- 用 **ISBAR** 格式自動整理這一回合：Identify / Situation / Background / Assessment / Recommendation。
- 列出指引對照：bundle 做到幾項、抗生素在第幾秒給、漏了哪些元素，每一項附出處。
- 說明這回合用到的「遊戲簡化」（見 §6.3）。
- 課堂模式：教師可以暫停在這頁帶討論。

---

## 4. 系統設計

### 4.1 角色（v0 名單：10 名）

角色都是**職類原型**，不對應真實人物。

| 角色 | 費用 | 職能羈絆 | Bundle 元素 | 技能概念 |
|---|---|---|---|---|
| ICU 護理師 | 1 | 評估型 | Lactate | 「抽血」：量測乳酸，揭露敵人隱藏屬性 |
| ICU 護理師（輸液） | 1 | 處置型 | Crystalloid | 「快速輸液」：削弱「低血壓」 |
| 感控護理師 | 2 | 評估型 | Blood culture | 「培養採檢」：標記敵人，之後抗生素傷害提高 |
| 臨床藥師 | 2 | 協調型 | （輔助 Antimicrobials） | 「劑量優化」：提升抗生素效果 |
| 住院醫師 | 2 | 處置型 | Antimicrobials | 「開立廣效抗生素」：對菌群範圍傷害 |
| 呼吸治療師 | 2 | 處置型 | —（留給 ARDS 章） | 「氧療支援」：提高隊友存活 |
| **NP 學長姐** | 3 | **評估＋協調（同時算兩種）** | Lactate 或 Culture 擇一 | 「預立特定醫療流程」：場上有醫師角色（代表醫師監督）時才會發動，加快隊友出手 |
| 資深重症護理師 | 3 | 處置型 | Vasopressor | 「Titrate NE」：維持 MAP ≥ 65 的光環 |
| 主治醫師 | 4 | 協調型 | Vasopressor | 「監督」：讓 NP 的技能可以發動，並強化效果 |
| 外科醫師 | 4 | 處置型 | （額外：Source control） | 「感染源控制」：對 Boss 造成大量傷害 |

> NP 技能「預立特定醫療流程」，以及「要有醫師在場才能發動」的設計，參考的是《專科護理師於醫師監督下執行醫療業務辦法》的架構。衛福部 2023 年預告修正草案，內容包括重新定義「監督」，所以**內容凍結前要對照全國法規資料庫的現行條文和院內規範**。

### 4.2 羈絆

**A. Bundle 羈絆「Hour-1」（核心）**：計算場上**不重複**的 bundle 元素數量（Levy et al., 2018）。

| 門檻 | 效果（數值待平衡） |
|---|---|
| 3/5 | 全隊處置力 +15% |
| 5/5 | 「黃金一小時」：休克類敵人傷害大幅降低，乳酸堆積停止增加 |

五個元素：Lactate 量測、Blood culture、Broad-spectrum antimicrobials、Crystalloid 30 mL/kg、Vasopressor（MAP ≥ 65）。

> 規則用「不重複元素」而不是「角色數量」來計算，目的是逼玩家把 bundle 做完整，不能只堆同一種處置。這對應 bundle「完整執行」的概念。

**B. 職能羈絆**

| 羈絆 | 門檻 | 效果概念 |
|---|---|---|
| 評估型 | 2 / 4 | 評估階段多揭露 1 / 2 項敵情；暴擊率提高 |
| 處置型 | 2 / 4 | 處置力提高 |
| 協調型 | 2 / 3 | 隊友出手速度提高 |

**C. 專科羈絆**（v1 才做）：ICU、感染科、外科……

### 4.3 裝備（醫材／藥物）

| 裝備 | 合成 | 效果 | 教學點 | 依據 |
|---|---|---|---|---|
| Norepinephrine | 基礎，**單獨就能用** | 升壓 | 可以先從周邊給，不要因為等 CVC 而延誤升壓 | Evans et al., 2021 |
| NE + CVC | 合成 | 升壓效果持續更久 | — | — |
| NE + Vasopressin | 合成 | 「雙升壓」 | NE 不夠時，建議加 vasopressin，而不是一直拉高 NE 劑量 | Evans et al., 2021（弱建議） |
| NE + A-line | 合成 | 「精準滴定」 | 使用升壓劑時，建議盡早改用侵入性動脈血壓監測 | Evans et al., 2021（弱建議） |
| Balanced crystalloid | 基礎 | 輸液，效果略優於 NS | 建議用 balanced crystalloid，優先於 normal saline | Evans et al., 2021（弱建議） |
| Normal saline | 基礎 | 輸液 | — | — |
| ⚠️ HES（陷阱卡） | 會出現在商店 | 裝上後出現「AKI」debuff | **不建議**用 starches 做液體復甦 | Evans et al., 2021（強建議反對） |

> 合成配方**必須符合臨床邏輯**；每個配方在資料檔裡都要有 `source` 欄位（見 §7）。

### 4.4 敵人（Sepsis 章）

敵人是**病理過程**，不是病人。不擬人化病人，也不嘲諷任何職類。

| 敵人 | 類型 | 機制 | 克制方式 |
|---|---|---|---|
| 菌群 | 小怪，數量多 | 持續累積傷害 | Antimicrobials（先被 culture 標記的話傷害更高） |
| 低血壓 | 坦克 | 血量高，讓隊友處置力下降 | Crystalloid → Vasopressor |
| 乳酸堆積 | Debuff 型 | **隨時間增加**（製造時間壓力） | 有效灌流才會讓它消退：用 lactate 下降來引導復甦（Evans et al., 2021，弱建議） |
| 器官衰竭 MODS | Boss，分階段 | 每個階段召喚一個器官系統的小怪（呼吸、心血管、腎……） | 完整 bundle ＋ 感染源控制 |

### 4.5 經濟（資源點數）
- 每回合基本 5 點；每存 10 點，利息 +1（上限 +5）；連勝或連敗都有加成。
- 教學意義：資源有限，逼玩家排優先順序。

### 4.6 病人安全指數（玩家血量）
- 起始 100。輸掉一回合，依剩下的敵人強度扣分。
- 歸零時進入 **「M&M 檢討」debrief**。用 just culture 的精神設計：重點是檢討哪裡可以做得更好，不是懲罰。

### 4.7 院務事件（每局的變化，第 2、4 回合三選一）

| 事件 | 效果 | 臨床連結 |
|---|---|---|
| Sepsis 電子警示上線 | 評估階段自動揭露 1 項 | 指引建議醫院建立 sepsis 改善計畫，包括篩檢（Evans et al., 2021） |
| 抗生素管理計畫 ASP | 藥師效果提高 | — |
| 快速反應小組上線 | 評估型羈絆門檻 −1 | — |
| 夜班人力短缺 | 上場人數 −1，資源點數 +3 | 練習在資源限制下排優先順序 |

---

## 5. 第一章：一位 septic shock 病人的黃金一小時

> 以下是**虛構的教學案例**，數值只是示意，需要臨床專家審閱。

病人：68 歲，社區型肺炎入住 ICU。

| 回合 | 病程階段（vignette 示意） | 敵人組成 | 教學重點 |
|---|---|---|---|
| 1 | 發燒、RR 24、HR 112、BP 尚可、意識清楚 | 菌群 ×3 | 篩檢工具：NEWS / SIRS，不單用 qSOFA（LO1） |
| 2 | Lactate 2.6 mmol/L、WBC ↑ | 菌群 ×4 + 乳酸堆積 | 量測並追蹤 lactate；先培養再給抗生素（LO2、LO3） |
| 3 | 輸液後 MAP 58 mmHg、lactate 4.2 | 低血壓 ×2 + 菌群 + 乳酸堆積 | 30 mL/kg crystalloid；NE first-line；可以先從周邊給（LO4） |
| 4 | 院務事件；NE 需求一直上升 | 強化版低血壓 | 加 vasopressin，還是繼續拉高 NE？（LO4） |
| 5 | MODS | Boss：器官衰竭 | 感染源控制、bundle 完成度總結、ISBAR 交班（LO5） |

---

## 6. 臨床正確性守則

1. **每條臨床規則都要有出處**：資料檔裡每個角色、羈絆、裝備、敵人的臨床效果都要有 `source` 欄位（指引名稱、版本、建議主題）。
2. **專家審查與內容效度**：至少由一位 ICU 主治、一位資深 NP、一位 NP 教師審閱，用 I-CVI / S-CVI 計算內容效度，並註明 S-CVI 用哪種方法算（Polit & Beck, 2006）。
3. **每個遊戲簡化都要明講**：例如遊戲裡「輸液」是一次性效果；但實際上指引建議用動態指標評估 fluid responsiveness，不要只靠身體檢查或靜態參數（Evans et al., 2021）。這些簡化要在 debrief 裡逐條說明。
4. **指引版本管理**：資料檔記錄指引版本；內容凍結前確認有沒有新版 SSC。
5. **執業範疇**：NP 角色的能力要符合台灣現行法規和院內規範（見 §4.1 附註）。
6. **免責聲明**：本遊戲是教學用的簡化模型，不能取代臨床判斷和院內 protocol。

---

## 7. 技術架構

- **平台**：網頁（手機＋課堂投影），TypeScript + Vite + Phaser 4。
- **原則**
  - **資料驅動**：角色、羈絆、裝備、波次全部寫成 JSON，臨床專家不碰程式也能審閱、修改。
  - **戰鬥模擬是純邏輯、結果可重現**（seeded RNG，跟畫面分開）→ 可以寫單元測試，debrief 也能「重播並逐步解說」。
  - **完整記錄每次出手**（event log）→ debrief 和研究用的學習數據都從這裡來。

```
src/
  sim/        # 純邏輯戰鬥模擬：不依賴畫面，可單元測試
  data/       # units.json / traits.json / items.json / waves.json（含 source 欄位）
  scenes/     # Assess / Shop / Board / Combat / Debrief
  ui/
prototypes/
  sepsis-greybox/   # 拋棄式原型，不 import 進正式程式
docs/
```

資料格式範例：

```json
{
  "id": "icu_rn_culture",
  "name": "感控護理師",
  "cost": 2,
  "roles": ["assessor"],
  "bundleElements": ["blood_culture"],
  "skill": { "op": "mark", "target": "pathogen", "bonusTo": "antimicrobials" },
  "source": "Levy MM, et al. SSC Bundle 2018 update — blood cultures before antibiotics"
}
```

**參考的 skills**（[awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)）：`prototype-fast`、`card-game`（資料驅動的效果、可重現的隨機數）、`tower-defense`（波次和經濟曲線）、`game-ai`（選目標）、`game-ui-ux`、`game-feel`、`phaser-core`。

---

## 8. 下一步：灰盒原型

```text
QUESTION:   「湊齊 Hour-1 bundle 羈絆」會不會讓 NP 學員想再玩一局？
CORE VERB:  買角色 + 調站位湊羈絆
THROWAWAY:  是（prototypes/sepsis-greybox/，用色塊 + 文字，不做美術）
SCOPE:      §4.1 的 10 名角色、Hour-1 + 職能羈絆、§5 的 5 回合、先不做裝備
TIMEBOX:    一次做完
KEEP IF:    學員沒人提醒就主動再玩一局，玩完說得出 ≥ 3 個 bundle 元素
KILL IF:    要先解釋才覺得好玩，或羈絆玩起來只像在背書
```

**試玩計畫**：3–5 位 NP 學員加 1 位臨床教師，用 think-aloud（邊玩邊說出想法），觀察卡在哪裡；玩完做 5 題 bundle 小測。

---

## 9. 評估設計（如果要發表；待決定）

- **設計**：先做 pilot（單組前後測）→ 再做跟傳統授課比較的對照研究。
- **指標**：Kirkpatrick Level 1（滿意度、使用性）、Level 2（知識前後測，題目對應 LO1–5）；遊戲內行為數據（bundle 完成率、抗生素出手時間）。
- **工具效度**：知識測驗做 CVI（Polit & Beck, 2006）。
- **倫理與報告**：送 IRB；隨機對照試驗依 CONSORT 2025 撰寫。

---

## 10. 待決問題

- [ ] 要不要當研究發表？（影響 §9）
- [ ] 平台優先順序：課堂投影還是學員手機？
- [ ] 一局的目標長度
- [ ] 美術風格（Q 版？像素？）
- [ ] 第二章：ARDS、AKI，或 ICU Liberation（ABCDEF bundle 當 6 階羈絆，參考 Pun et al., 2019 看到的劑量效應）
- [ ] 需不需要中英對照

---

## References

- Choy, C. L., Liaw, S. Y., Goh, E. L., See, K. C., & Chua, W. L. (2022). Impact of sepsis education for healthcare professionals and students on learning and patient outcomes: A systematic review. *Journal of Hospital Infection, 122*, 84–95. https://doi.org/10.1016/j.jhin.2022.01.004
- Evans, L., Rhodes, A., Alhazzani, W., Antonelli, M., Coopersmith, C. M., French, C., ... Levy, M. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. *Critical Care Medicine, 49*(11), e1063–e1143. https://doi.org/10.1097/CCM.0000000000005337
- Hunicke, R., LeBlanc, M., & Zubek, R. (2004). MDA: A formal approach to game design and game research. In *Proceedings of the AAAI Workshop on Challenges in Game AI*.
- Kuruca Ozdemir, E., & Dinc, L. (2022). Game-based learning in undergraduate nursing education: A systematic review of mixed-method studies. *Nurse Education in Practice, 62*, 103375. https://doi.org/10.1016/j.nepr.2022.103375
- Levy, M. M., Evans, L. E., & Rhodes, A. (2018). The Surviving Sepsis Campaign bundle: 2018 update. *Critical Care Medicine, 46*(6), 997–1000. https://doi.org/10.1097/CCM.0000000000003119
- Müller, M., Jürgens, J., Redaèlli, M., Klingberg, K., Hautz, W. E., & Stock, S. (2018). Impact of the communication and patient hand-off tool SBAR on patient safety: A systematic review. *BMJ Open, 8*(8), e022202. https://doi.org/10.1136/bmjopen-2018-022202
- Polit, D. F., & Beck, C. T. (2006). The content validity index: Are you sure you know what's being reported? Critique and recommendations. *Research in Nursing & Health, 29*(5), 489–497. https://doi.org/10.1002/nur.20147
- Pun, B. T., Balas, M. C., Barnes-Daly, M. A., Thompson, J. L., Aldrich, J. M., Barr, J., ... Ely, E. W. (2019). Caring for critically ill patients with the ABCDEF bundle: Results of the ICU Liberation Collaborative in over 15,000 adults. *Critical Care Medicine, 47*(1), 3–14. https://doi.org/10.1097/CCM.0000000000003482
- Quek, L. H., Tan, A. J. Q., Sim, M. J. J., Ignacio, J., Harder, N., Lamb, A., Chua, W. L., Lau, S. T., & Liaw, S. Y. (2024). Educational escape rooms for healthcare students: A systematic review. *Nurse Education Today, 132*, 106004. https://doi.org/10.1016/j.nedt.2023.106004
- Tavares, N. (2022). The use and impact of game-based learning on the learning experience and knowledge retention of nursing undergraduate students: A systematic literature review. *Nurse Education Today, 117*, 105484. https://doi.org/10.1016/j.nedt.2022.105484
- 衛生福利部（2023）。預告修正「專科護理師於醫師監督下執行醫療業務辦法」草案。https://www.mohw.gov.tw/cp-18-73525-1.html
