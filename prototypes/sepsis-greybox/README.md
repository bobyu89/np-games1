# 《黃金一小時》灰盒原型 v0.1

這是**拋棄式原型**，只用來回答一個問題（見 [`docs/GDD-v0.md`](../../docs/GDD-v0.md) §8）：

> **「湊齊 Hour-1 bundle 羈絆」會不會讓 NP 學員想再玩一局？**

畫面只用色塊和文字，沒有美術。如果決定保留，正式版要重寫，不直接沿用這裡的程式。

## 怎麼開

- **最快的方式**：直接用瀏覽器打開 `index.html`（不需要安裝任何東西）。
- 想用手機在同一個網路裡試玩：

```bash
npx serve prototypes/sepsis-greybox
```

## 一局的流程

1. **評估**：點出異常值、選評估工具（qSOFA／SIRS／NEWS2，第 5 回合是 SOFA）。判讀越準，揭露的敵情越多。
2. **調度**：用資源點數招募角色。商店至少會有一張卡能補上你缺的 bundle 元素。
3. **佈陣**：床邊 8 格，編號就是出手順序；第 n 位在第 15×n 分鐘第一次出手。
4. **自動處置**：時間軸 0–150 分鐘。疑似 septic shock 的回合，第一劑抗生素超過 60 分鐘要扣分。
5. **交班 debrief**：ISBAR 摘要、bundle 執行時間、指引對照（附出處）、遊戲簡化說明。

第 2、4 回合開始時有院務事件三選一。五回合（第一章）結束，或病人安全指數歸零（進入 M&M 檢討）就結束。

## 檔案

| 檔案 | 內容 |
|---|---|
| `data.js` | 角色、羈絆、敵人、5 回合病例、院務事件、指引提醒。**臨床內容都在這裡**，每條都有 `source` |
| `sim.js` | 純邏輯：羈絆計算、評估、戰鬥模擬、debrief、商店。不碰畫面，同一個 seed 結果一定相同 |
| `app.js` | 畫面、互動、研究紀錄 |
| `index.html` | 版面與樣式 |
| `sim.test.js` | 自動測試（臨床規則＋平衡底線） |

臨床專家審閱時，只需要看 `data.js`。

## 測試

```bash
node --test prototypes/sepsis-greybox/sim.test.js
```

測試把下列規則鎖住，之後調數值時不會不小心改壞：

- 羈絆只算不重複元素；NP 同時算評估型和協調型
- 先培養再給抗生素才有加成；septic shock 回合抗生素超過 60 分鐘要扣分
- NP 的「預立特定醫療流程」要場上有醫師角色才會發動
- 沒量測的乳酸不能被處置，開始輸液前會一直上升
- **平衡底線**：完整 bundle 能控制 septic shock；第 3 回合缺升壓、缺輸液或沒量乳酸就控制不住；完美玩法五回合總扣分 < 50
- 商店保底一定會出現能補缺項的角色
- 資料完整性：每條臨床規則都有出處

## 研究紀錄

結束畫面可以「儲存紀錄（.json）」或「複製紀錄」。紀錄**只存在這台裝置**，不會自動上傳；參與者代號選填，畫面上提醒不要輸入真實姓名。

同一台裝置連續玩多局（「再玩一局」）會全部放在同一份紀錄裡，`plays.length − 1` 就是主動重玩的次數。

```text
{
  schema: "golden-hour-greybox-log", schemaVersion: 1, gameVersion, exportedAt, participant,
  plays: [{
    sessionId, playIndex, replayOf, seed, startedAt, endedAt,
    outcome: "complete" | "gameover", finalSafety, roundsCompleted, augments,
    preRecall, postRecall,                 // 前後測：自由回想 Hour-1 bundle 元素
    rounds: [{
      round, augment,
      assessment: { tool, quality, flagged, correct, falseFlags, missed, reveal, total, ms },
      prep: { buys, sells, rerolls, ms, board, bench, goldLeft, traits },
      combat: { win, damage, pressure, remainingThreat, penalties, endTime,
                metrics: { bundleOnBoard, bundlePresent, executed, executedCount,
                           cultureBeforeAbx, abxAt, abxOnTime, lactateMeasured,
                           sourceControlAt, protocolAt, protocolBlocked } },
      safetyAfter, debriefMs, debriefNotes
    }],
    events: [{ ms, round, phase, type, ... }]   // 每個操作，含毫秒時間戳
  }]
}
```

對應 GDD 的保留／放棄標準：

| 標準 | 紀錄裡看哪裡 |
|---|---|
| 主動再玩一局 | `plays.length`、`replay_click` 事件 |
| 說得出 ≥ 3 個 bundle 元素 | `postRecall`（對照 `preRecall`） |
| 評估準確度 | `rounds[].assessment` |
| Bundle 完成度、抗生素時間 | `rounds[].combat.metrics` |

## 試玩建議

3–5 位 NP 學員加 1 位臨床教師。不要先解釋玩法，請學員邊玩邊說出想法（think-aloud），記下卡住的地方。玩完收紀錄檔。

> 教學用簡化模型，不能取代臨床判斷和院內 protocol。病例是虛構的，數值待臨床專家審閱。
