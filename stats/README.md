# 匿名的使用統計

讓你看得到：有多少人在玩、玩到哪裡、哪一關卡住。遊戲本身還是靜態的；這是另外一個很小的端點，放在 Cloudflare Workers（免費額度內）。

**沒有設定之前，遊戲不會詢問、也不會回傳任何東西。** 設定了之後，玩家第一次進大廳會被問一次，選「可以回傳」才會送；之後在「設定」裡可以改。

## 回傳什麼、不回傳什麼

| 會回傳 | 不會回傳 |
|---|---|
| 一組隨機的裝置代號（16 個十六進位的字，裝置上產生，和人沒有關聯） | 姓名、帳號、電子郵件（遊戲本來就沒有帳號） |
| 是哪一版、用手機還是電腦、是不是從主畫面圖示開的 | 瀏覽器的完整字串、螢幕大小 |
| 哪一張委託開始了、做到第幾段、回公會或放掉、有沒有結案 | 問了哪些題、選了哪些句子、任何文字 |
| 結案時的分數、安全行動的狀態、診斷對不對、花了多久、問了岑禾幾次 | 每一步的操作紀錄 |

端點這一邊**不存 IP**，也不存任何它不認得的欄位（多送的會被丟掉，有測試）。Cloudflare 本身處理連線時看得到 IP，這一點和任何網站一樣。

這些數字是**營運用的**：知道遊戲有沒有人用、哪裡要改。它們只包含選了「可以回傳」的人，而且匿名的端點擋不住有心人灌水。**如果之後要把它寫進研究或發表，那就是研究資料**：要先經過 IRB，同意的說明也要照 IRB 核准的版本改，現在這個詢問不算。

## 怎麼看

打開遊戲的網址，後面加 `#stats`（例如 `https://bobyu89.github.io/np-games1/#stats`），輸入管理密碼。可以選範圍、下載每一筆事件的 CSV。

## 怎麼開起來（一次性的設定）

要做四件事。前三件做完、合併到 main，端點就會自動部署；第四件做完，遊戲才會開始詢問和回傳。

1. **Cloudflare 的 API 金鑰**：Cloudflare 儀表板右上角的頭像 → My Profile → API Tokens → Create Token → 選「Edit Cloudflare Workers」這個範本 → Account Resources 選你的帳號 → 建立，把金鑰複製起來（只會顯示一次）。
2. **Cloudflare 的帳號代號**：儀表板 → Workers & Pages，右邊的 Account ID。
3. **在 GitHub 放三個 secret**：repo 的 Settings → Secrets and variables → Actions → New repository secret，各加一個：

   | 名稱 | 值 |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | 第 1 步的金鑰 |
   | `CLOUDFLARE_ACCOUNT_ID` | 第 2 步的帳號代號 |
   | `STATS_ADMIN_KEY` | 你自己想一組看總表用的密碼。長一點，不要和別的地方共用 |

   之後「統計端點」這個流程（`.github/workflows/stats.yml`）跑完，摘要裡會印出端點的網址，長得像 `https://mist-guild-stats.你的子網域.workers.dev`。
4. **告訴遊戲端點在哪裡**：同一頁切到 Variables → New repository variable，名稱 `STATS_URL`，值填上面那個網址。然後到 Actions 重跑一次「霧脈公會」，讓遊戲重新建置。

想關掉：把 `STATS_URL` 這個變數刪掉、重跑「霧脈公會」，遊戲就不再詢問和回傳。已經收到的資料還在 Cloudflare；要一起刪，到 Cloudflare 儀表板把 `mist-guild-stats` 這個 Worker 刪掉。

遊戲如果不是放在 `https://bobyu89.github.io`，要改 `wrangler.jsonc` 裡的 `ALLOW_ORIGINS`：端點只收名單裡的網址送來的東西。

## 端點

| 路徑 | 做什麼 | 要密碼 |
|---|---|---|
| `POST /e` | 收事件 | 不用 |
| `GET /stats?days=30` | 總表（JSON） | 要：`Authorization: Bearer 管理密碼` |
| `GET /export.csv?days=30` | 每一筆事件一列 | 要 |

一個裝置一天最多收 400 筆、全部一天最多 5 萬筆，超過的丟掉。同一件事重送不會算兩次。

## 程式

```
src/core.ts        檢查送進來的東西、存、算總表。不碰網路，測試直接用 SQLite 跑
src/core.test.ts   npm test
src/index.ts       Worker：路徑、允許的網址、管理密碼；資料放在一個 Durable Object 的 SQLite 裡
wrangler.jsonc     部署的設定
```

資料放在 Durable Object 自己的 SQLite 裡，所以部署只要一個指令，不用另外建資料庫。Cloudflare 保留最近 30 天內任何時間點的還原。

在本機跑：

```bash
npm install
```

```bash
printf 'ADMIN_KEY=local-test-key\n' > .dev.vars
```

```bash
npm run dev
```

遊戲那一邊用 `VITE_STATS_URL=http://127.0.0.1:8787 npm run build` 建一份，就會連到本機的端點。
