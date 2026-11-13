# 霧脈公會放在 Cloudflare 的那一份

遊戲和後端放在同一個 Cloudflare Worker、同一個網址底下，用的是免費方案。

| 部分 | 內容 | 在哪 |
|---|---|---|
| 遊戲 | [`app/`](../app/README.md) 建出來的靜態檔。Cloudflare 直接給，不經過後端的程式，也不算 Worker 的請求數 | 網址的根目錄 |
| 後端 | 現在只有匿名的使用統計 | `/api/` 底下 |

為什麼放 Cloudflare、不放 GitHub Pages，看 [`docs/04-system-design.md`](../docs/04-system-design.md) 第 9.3 節。

## 第一次部署（一次性的設定）

做完下面四件、合併到 main，就會自動部署。金鑰直接貼進 GitHub 的 secrets，不要貼到別的地方。

1. **Cloudflare 的帳號和子網域**：登入 Cloudflare 儀表板 → Workers & Pages。頁面上會看到你的子網域（`某個名字.workers.dev`），第一次進去會請你取一個。**這個名字會出現在遊戲的網址裡**（`https://mist-guild.某個名字.workers.dev`）。想換名字要在第一次部署之前換；玩家開始玩之後再換，等於換了網址。
2. **Cloudflare 的 API 金鑰**：儀表板右上角的頭像 → My Profile → API Tokens → Create Token → 選「Edit Cloudflare Workers」這個範本 → Account Resources 選你的帳號、Zone Resources 選 All zones → 建立，把金鑰複製起來（只會顯示一次）。
3. **Cloudflare 的帳號代號**：儀表板 → Workers & Pages，右邊的 Account ID。
4. **在 GitHub 放 secret**：repo 的 Settings → Secrets and variables → Actions → New repository secret：

   | 名稱 | 值 | 一定要嗎 |
   |---|---|---|
   | `CLOUDFLARE_API_TOKEN` | 第 2 步的金鑰 | 要 |
   | `CLOUDFLARE_ACCOUNT_ID` | 第 3 步的帳號代號 | 要 |
   | `STATS_ADMIN_KEY` | 你自己想一組看統計總表用的密碼。長一點，不要和別的地方共用 | 不一定。**有放，匿名的使用統計才會開**（見下面） |

合併到 main 之後，「霧脈公會」這個流程（[`.github/workflows/app.yml`](../.github/workflows/app.yml)）會檢查、建置、部署；跑完的摘要裡會印出網址。前兩個 secret 沒放的話，部署那一步會失敗，並說明缺什麼；放好之後到 Actions 重跑就可以。

一部署就是公開的：知道網址的人都能玩。

## 之後怎麼更新

| 你要做的 | 會發生什麼 |
|---|---|
| 把修改合併到 main（程式、病例、文字都一樣） | 幾分鐘內自動檢查、建置、部署。檢查沒過就不會部署 |

玩家那一邊：

- 下次打開遊戲的時候，新版在背景下載好，大廳出現「有新的版本」；**玩家按了才換上**，委託做到一半不會被換掉。
- 進度留著。還沒結案的那一張也留著，除非新版把那張委託裡用到的題目拿掉了（那一張會被放掉，其他進度不受影響）。
- 沒有網路的玩家繼續用手上的舊版，連上網路之後才會看到新版。

要退回上一版：把那一次的修改在 GitHub 上還原（revert）再合併，會重新部署舊的內容。

**唯一會讓玩家的進度不見的是換網址**：進度是跟著網址存在裝置上的。所以網址（包括要不要用自己的網域）要在把連結發給學員之前決定好。

## 自己的網域

之後要掛自己的網域：網域的 nameserver 要先交給 Cloudflare，然後在 `wrangler.jsonc` 加一段，合併之後就會生效，HTTPS 的憑證 Cloudflare 會自己處理。

```jsonc
"routes": [{ "pattern": "你的網域", "custom_domain": true }]
```

## 匿名的使用統計

讓你看得到：有多少人在玩、玩到哪裡、哪一關卡住。

**沒有放 `STATS_ADMIN_KEY` 之前，遊戲不會詢問、也不會回傳任何東西。** 放了之後（下一次部署起），玩家第一次進大廳會被問一次，選「可以回傳」才會送；之後在「設定」裡可以改。想關掉：把 `STATS_ADMIN_KEY` 這個 secret 刪掉、到 Actions 重跑「霧脈公會」，遊戲就不再詢問和回傳。已經收到的資料還在 Cloudflare。

### 回傳什麼、不回傳什麼

| 會回傳 | 不會回傳 |
|---|---|
| 一組隨機的裝置代號（16 個十六進位的字，裝置上產生，和人沒有關聯） | 姓名、帳號、電子郵件（遊戲本來就沒有帳號） |
| 是哪一版、用手機還是電腦、是不是從主畫面圖示開的 | 瀏覽器的完整字串、螢幕大小 |
| 哪一張委託開始了、做到第幾段、回公會或放掉、有沒有結案 | 問了哪些題、選了哪些句子、任何文字 |
| 結案時的分數、安全行動的狀態、診斷對不對、花了多久、問了岑禾幾次 | 每一步的操作紀錄 |

後端**不存 IP**，也不存任何它不認得的欄位（多送的會被丟掉，有測試）。Cloudflare 本身處理連線時看得到 IP，這一點和任何網站一樣。

這些數字是**營運用的**：知道遊戲有沒有人用、哪裡要改。它們只包含選了「可以回傳」的人，而且匿名的端點擋不住有心人灌水。**如果之後要把它寫進研究或發表，那就是研究資料**：要先經過 IRB，同意的說明也要照 IRB 核准的版本改，現在這個詢問不算。

### 怎麼看

打開遊戲的網址，後面加 `#stats`，輸入 `STATS_ADMIN_KEY` 那一組密碼。可以選範圍、下載每一筆事件的 CSV。

## 端點

| 路徑 | 做什麼 | 要密碼 |
|---|---|---|
| `POST /api/e` | 收事件 | 不用 |
| `GET /api/stats?days=30` | 總表（JSON） | 要：`Authorization: Bearer 管理密碼` |
| `GET /api/export.csv?days=30` | 每一筆事件一列 | 要 |

只有遊戲自己（同一個網址）的網頁可以用；別的網站的網頁會被拒絕。要另外放行別的網址，改 `wrangler.jsonc` 裡的 `ALLOW_ORIGINS`。

一個裝置一天最多收 400 筆、全部一天最多 5 萬筆，超過的丟掉。同一件事重送不會算兩次。

## 程式

```
src/core.ts        檢查送進來的東西、存、算總表。不碰網路，測試直接用 SQLite 跑
src/core.test.ts   npm test
src/index.ts       Worker：/api/ 底下的路徑、誰可以用、管理密碼；資料放在一個 Durable Object 的 SQLite 裡
wrangler.jsonc     部署的設定：Worker 的名字、遊戲的靜態檔在哪、哪些路徑交給後端
```

資料放在 Durable Object 自己的 SQLite 裡，所以部署只要一個指令，不用另外建資料庫。Cloudflare 保留最近 30 天內任何時間點的還原。

在本機把遊戲和後端一起跑起來（和放在 Cloudflare 的時候一樣，同一個網址）：

```bash
cd ../app && VITE_STATS_URL=/api npm run build
```

```bash
cd ../worker && npm install
```

```bash
printf 'ADMIN_KEY=local-test-key\n' > .dev.vars
```

```bash
npm run dev
```

然後開 `http://127.0.0.1:8787`。建置的時候不給 `VITE_STATS_URL`，就是沒有開統計的那一種。
