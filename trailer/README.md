# 前導片（HyperFrames）

《歸航記：專科護理師的臨床推理之旅》的前導片，60 秒。配樂是海浪和鐘聲，用 `music.mjs` 程式合成（固定種子，每次輸出都一樣；沒有音檔、沒有版權問題），鐘聲對著分鏡：開場低鐘、十二劫影一隻一聲、燈塔亮起的和弦、片名的大鐘。用 [HyperFrames](https://github.com/heygen-com/hyperframes)（Apache-2.0）把 HTML 逐格輸出成影片。

- `composition.html`：分鏡、字幕和運鏡（GSAP 時間軸）。橫式和直式共用這一份，寬高由 `make.mjs` 換上。
- `make.mjs`：一次做完。
  1. 開遊戲的開發伺服器，用 `app/tools/stills.html` 一張一張截靜態圖：標題、大廳、病室、十二劫影、五位長老、燈塔，和照遊戲畫的航海圖。美術都是遊戲本身用程式畫的，沒有另外的圖檔。
  2. 字體用遊戲的霞鶩文楷（SIL OFL 1.1），只留前導片用到的字。
  3. 輸出橫式 1920×1080 和直式 1080×1920，再用 ffmpeg 壓成：
     - `app/public/trailer/trailer.mp4`（橫式 720p）和 `trailer-vertical.mp4`（直式 720p）：遊戲第一次打開、選主角之前播，手機直向的時候播直式。不進離線快取。
     - `app/public/social/trailer-vertical.mp4`（直式 1080p）：Threads 用。

```bash
cd trailer && npm install
```

```bash
node make.mjs
```

要 Node 22 以上、ffmpeg 和 Chrome（`npx hyperframes doctor` 會檢查）。整支輸出約 7 分鐘。`--stills` 只重截靜態圖，`--only=landscape` 或 `--only=portrait` 只做一個版本，`--reuse` 不重新逐格輸出、只重新壓縮配上聲音（只改配樂的時候用，約 2 分鐘）。
執行時關掉了 HyperFrames 的使用統計（`HYPERFRAMES_NO_TELEMETRY=1`、`DO_NOT_TRACK=1`）。

字幕只講世界觀，不講任何一位病人的診斷。病例和劫的陷阱都還沒經過臨床老師審查，片尾照樣寫上這一句。
