# np-games1

給專科護理師（NP）學員的臨床推理遊戲。目前的方向草案：**像素風、回合制、對應 CDSS 臨床推理訓練系統的步驟，從主訴拆解到鑑別診斷**。

## 現在做到哪

工作順序是 **設計目標 → 架構 → 內容**，每一階段確認了才往下。

| 階段 | 文件 | 狀態 |
|---|---|---|
| 1. 設計目標 | [`docs/01-design-goals.md`](docs/01-design-goals.md) | 🟡 草稿，等確認 |
| 2. 架構 | 還沒開始（流程草稿：[`docs/FLOW-v1.md`](docs/FLOW-v1.md)） | ⏸ |
| 3. 內容 | 還沒開始（美術候選：[`docs/ART-v2.md`](docs/ART-v2.md)） | ⏸ |

## 先前的探索（sepsis 方向，留著當參考）

- 最早的設計文件：[`docs/GDD-v0.md`](docs/GDD-v0.md)
- 3D 可行性評估：[`docs/PLAN-3D.md`](docs/PLAN-3D.md)
- 2D 灰盒原型：[`prototypes/sepsis-greybox/`](prototypes/sepsis-greybox/README.md)（完整流程和研究紀錄；用瀏覽器打開 `index.html` 就能玩）
- 3D 視覺試作：[`prototypes/sepsis-3d/`](prototypes/sepsis-3d/README.md)（佈陣和自動處置；`npx serve prototypes/sepsis-3d`）
- 3D 模型產生器：[`tools/blender/`](tools/blender/README.md)

> 本遊戲為教學用的簡化模型，不能取代臨床判斷和院內 protocol。
