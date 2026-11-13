# 霧脈公會放在 Cloudflare 的那一份

遊戲和後端放在同一個 Cloudflare Worker、同一個網址底下，用的是免費方案。

| 部分 | 內容 | 在哪 |
|---|---|---|
| 遊戲 | [`app/`](../app/README.md) 建出來的靜態檔。Cloudflare 直接給，不經過後端的程式，也不算 Worker 的請求數 | 網址的根目錄 |
| 後端 | 匿名的使用統計；登入和進度同步（選用） | `/api/` 底下 |

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
   | `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` | Google 登入用的代號和密鑰 | 不一定。有放才有 Google 登入（見下面） |
   | `LINE_CHANNEL_ID`、`LINE_CHANNEL_SECRET` | LINE 登入用的代號和密鑰 | 不一定。有放才有 LINE 登入（見下面） |

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

## 登入和進度同步（選用）

玩家可以用 Google 或 LINE 登入，進度會在雲端多存一份：換手機、換瀏覽器、清掉瀏覽器資料，登入就接得上。**不登入照樣能玩。** 設計和限制寫在 [`docs/04-system-design.md`](../docs/04-system-design.md) 第 9.7 節。

**哪一家的代號和密鑰沒有放，那一家的按鈕就不會出現；兩家都沒放，遊戲裡就沒有登入這件事。** 可以只開一家。

### 存什麼、不存什麼

| 會存 | 不會存 |
|---|---|
| 帳號的代號：登入服務給的使用者代號，加上只有這個資料庫知道的一段亂數，再雜湊過 | 姓名、電子郵件、頭像（登入的時候只要求 `openid`，本來就拿不到） |
| 用哪一家登入、建立和最後使用的時間 | 登入服務原本的使用者代號 |
| 進度：和「設定 → 匯出進度」同一種格式，只有代號和分數 | 做到一半的那一張委託（只留在那一台）、任何文字輸入 |
| 登入狀態的雜湊（瀏覽器手上那一段亂數，資料庫裡沒有） | IP |

帳號和匿名的使用統計是**兩個分開的資料庫**，沒有共同的欄位，對不起來。玩家自己可以登出，也可以把雲端的資料連同帳號一起刪掉。

如果之後要拿帳號的資料做研究或發表，要先經過 IRB。

### 開 Google 登入

網址以實際部署的為準；下面用 `https://你的網址` 代替。

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 開一個專案。
2. 設定 OAuth 同意畫面（Google Auth Platform）：使用者類型選 External，填應用程式名稱和支援信箱。
3. **把它發布成正式版**（Audience → Publish app）。停在測試模式，只有你列在名單上的人能登入，最多 100 人。只要求基本的登入（`openid`），不需要送審。
4. 建一個 OAuth 用戶端（Clients → Create client）：類型選 Web application；**Authorized redirect URIs** 填 `https://你的網址/api/auth/google/callback`。
5. 把畫面上的 Client ID 和 Client secret 放進 GitHub 的 secrets：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`。

### 開 LINE 登入

1. 到 [LINE Developers Console](https://developers.line.biz/console/)，建一個 Provider，底下建一個 **LINE Login** 的 channel，App types 勾 Web app。
2. 在 channel 的 LINE Login 分頁，**Callback URL** 填 `https://你的網址/api/auth/line/callback`。
3. Basic settings 分頁有 Channel ID 和 Channel secret，放進 GitHub 的 secrets：`LINE_CHANNEL_ID`、`LINE_CHANNEL_SECRET`。
4. **把 channel 的狀態從 Developing 改成 Published。** 還在 Developing 的時候，只有這個 channel 的管理者和測試者能登入。

兩家都一樣：secret 放好之後，到 Actions 重跑「霧脈公會」（或是下一次合併），部署完的摘要會印出要登記的回呼網址。之後換了網址（例如掛上自己的網域），兩邊的回呼網址都要加上新的。

想關掉某一家：到 Cloudflare 儀表板 → Worker `mist-guild` → Settings → Variables and Secrets，把那一家的兩個 secret 刪掉（光刪 GitHub 那邊的不夠，Worker 手上還留著）。已經有的帳號和雲端進度還在資料庫裡。

### 要知道的事

- Google 和 LINE 是兩個各自的帳號，進度不互通。
- Google 不讓人在別的 App 的內建瀏覽器裡登入。在 LINE 裡面開遊戲的人，畫面上只會看到 LINE 登入。
- 打開遊戲的時候，會問後端一次「開了哪幾種登入、現在有沒有登入」。這個請求不帶任何資料；和要不要回傳統計無關。

## 匿名的使用統計

讓你看得到：有多少人在玩、玩到哪裡、哪一關卡住。

**沒有放 `STATS_ADMIN_KEY` 之前，遊戲不會詢問、也不會回傳任何東西。** 放了之後（下一次部署起），玩家第一次進大廳會被問一次，選「可以回傳」才會送；之後在「設定」裡可以改。想關掉：把 `STATS_ADMIN_KEY` 這個 secret 刪掉、到 Actions 重跑「霧脈公會」，遊戲就不再詢問和回傳。已經收到的資料還在 Cloudflare。

### 回傳什麼、不回傳什麼

| 會回傳 | 不會回傳 |
|---|---|
| 一組隨機的裝置代號（16 個十六進位的字，裝置上產生，和人沒有關聯） | 姓名、帳號、電子郵件（有登入的人也一樣：統計和帳號是分開存的） |
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
| `GET /api/me` | 開了哪幾種登入、現在有沒有登入 | 不用 |
| `GET /api/auth/google/start`、`/api/auth/line/start` | 把人送去登入 | 不用 |
| `GET /api/auth/…/callback` | 登入完被送回來：換身分憑證、記下登入狀態、回到遊戲 | 不用（要對得上剛才那一次） |
| `GET /api/save`、`PUT /api/save` | 讀、寫雲端那一份進度 | 要登入 |
| `POST /api/signout` | 登出這一台 | — |
| `DELETE /api/account` | 刪掉帳號和雲端的進度 | 要登入 |

只有遊戲自己（同一個網址）的網頁可以用；別的網站的網頁會被拒絕。會改東西的請求（寫進度、登出、刪帳號）一定要是遊戲自己的網頁送的。要另外放行別的網址，改 `wrangler.jsonc` 裡的 `ALLOW_ORIGINS`。

一個裝置一天最多收 400 筆、全部一天最多 5 萬筆，超過的丟掉。同一件事重送不會算兩次。

## 程式

```
src/core.ts           統計：檢查送進來的東西、存、算總表。不碰網路，測試直接用 SQLite 跑
src/accounts.ts       帳號：登入到一半的狀態、帳號的代號、登入狀態、雲端的進度、檢查身分憑證。一樣不碰網路
src/*.test.ts         npm test
src/index.ts          Worker：/api/ 底下的路徑、誰可以用、管理密碼、登入的流程；資料放在兩個 Durable Object 的 SQLite 裡
wrangler.jsonc     部署的設定：Worker 的名字、遊戲的靜態檔在哪、哪些路徑交給後端
```

資料放在 Durable Object 自己的 SQLite 裡（統計一個、帳號一個），所以部署只要一個指令，不用另外建資料庫。Cloudflare 保留最近 30 天內任何時間點的還原。

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

要在本機試登入：`.dev.vars` 裡加上 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`（或 LINE 的那兩個）。測試的時候可以用 `GOOGLE_AUTH_URL`、`GOOGLE_TOKEN_URL`（LINE 是 `LINE_AUTH_URL`、`LINE_TOKEN_URL`）把登入服務換成本機的假服務；正式環境不要設這幾個。
