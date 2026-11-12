# np-games1

給專科護理師（NP）學員的臨床推理遊戲。方向：**回合制的 NP OSCE 角色扮演遊戲。你是霧脈公會的見習專科護理師，每一關是一個主訴，在時限內照臨床推理的步驟把它拆開。世界是奇幻的，臨床是真的。**

## 現在做到哪

工作順序是 **設計目標 → 架構 → 內容**，每一階段確認了才往下。

| 階段 | 文件 | 狀態 |
|---|---|---|
| 1. 設計目標 | [`docs/01-design-goals.md`](docs/01-design-goals.md) | ✅ v1.5 |
| 1. 遊戲企劃 | [`docs/05-game-design.md`](docs/05-game-design.md) | ✅ v2 已確認。對齊甄審、不猜題的題庫做法、世界觀、主線、玩法、評分 |
| 2. 架構：遊戲規則 | [`docs/02-architecture.md`](docs/02-architecture.md) | ✅ 設計已確認，可以玩的空殼做好了：[`game/`](game/README.md) |
| 2. 架構：整體系統 | [`docs/04-system-design.md`](docs/04-system-design.md) | 🟡 草稿。玩家身分和主機已定，等遊戲企劃確認後再做 |
| 3. 內容：美術方向 | [繪本版](prototypes/style-frame-storybook/README.md) | ✅ 定案：手繪繪本風（2026-11-12）。[3D 像素版](prototypes/style-frame/README.md)留著當紀錄 |
| 3. 內容：互動原型 | [`app/`](app/README.md) | 🟡 第一章四張委託（同一隻症影、四個真身各一位），三位主角可以選，圖鑑有症影、人物、場景三頁，等你試玩 |
| 3. 內容：長期的推進 | [`docs/06-progression.md`](docs/06-progression.md) | 🟡 故事線、圖鑑、階級的設計。第一章以外是提案，等你確認 |
| 3. 內容：病例 | [怎麼寫新病例](app/src/data/README.md) | 🟡 病例模組和教案轉換工具做好了；四個胸痛病例是草稿，還沒經過臨床老師審查 |

## 互動原型

![選主角、出診到碼頭的貨棧、圖鑑的人物和場景](docs/art/app-prototype.jpg)

繪本畫風的可以玩的版本。第一章有四張委託：林秋、簡晴、莫桐和阮舟，同樣是胸痛，四個人是四個不同的真身。序章之後從三位見習專科護理師裡選一位當主角。

每一張委託照考站的順序走：**問診（開場、主訴、病史、系統回顧）→ 評估（從頭到腳五個模組）→ 診斷 → 檢查**。症影底下掛著四盞燈，拿到關鍵的線索要判斷它讓哪一盞更像、哪一盞比較不像；解讀對的線索會寫回圖鑑。圖鑑另外有「人物」和「場景」兩頁，遇到的人、去過的地方（例如出診的碼頭貨棧）會一張一張打開。

問診和評估的骨架參考臨床老師的 OSCE 教案，文字是重寫的。手上有教案的話，`app/tools/convert_script.py` 可以先轉出一份病例的底稿。

```bash
cd app
```

```bash
npm install
```

```bash
npm run dev
```

怎麼玩、程式怎麼分、還沒有什麼，看 [`app/README.md`](app/README.md)。

## 風格定稿

同一個場景做過兩種畫風來對照，最後選了繪本版。

| 繪本版（定案） | 3D 像素版（紀錄） |
|---|---|
| ![繪本版的病室](docs/art/style-frame-storybook.png) | ![3D 像素版的病室](docs/art/style-frame.png) |
| [`prototypes/style-frame-storybook/`](prototypes/style-frame-storybook/README.md) | [`prototypes/style-frame/`](prototypes/style-frame/README.md) |

## 舊的空殼

架構階段做的 2D 版本，已經被 `app/` 取代，留著當紀錄。

![示範關卡的八個畫面](docs/art/game-shell.png)

```bash
npx serve game
```

細節看 [`game/README.md`](game/README.md)：怎麼檢查、怎麼加病例、病例檔格式、規則的數值。

這個空殼的直式操作太多下、回饋太弱。整體系統設計確認後，規則核心留用，畫面會重做。

## 先前的探索（sepsis 自走棋方向，留著當參考）

- 最早的設計文件：[`docs/GDD-v0.md`](docs/GDD-v0.md)
- 3D 可行性評估：[`docs/PLAN-3D.md`](docs/PLAN-3D.md)
- 2D 灰盒原型：[`prototypes/sepsis-greybox/`](prototypes/sepsis-greybox/README.md)（完整流程和研究紀錄；用瀏覽器打開 `index.html` 就能玩）
- 3D 視覺試作：[`prototypes/sepsis-3d/`](prototypes/sepsis-3d/README.md)（佈陣和自動處置；`npx serve prototypes/sepsis-3d`）
- 3D 模型產生器：[`tools/blender/`](tools/blender/README.md)

> 本遊戲為教學用的簡化模型，不能取代臨床判斷和院內 protocol。
