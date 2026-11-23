# 去背素材

遊戲裡每一個人物，單獨畫在透明背景上，貼齊人物裁切的正方形 PNG。名字和身分在 `index.json`。

- `patient-<病例>.png`：49 位病人，床上的上半身（床、被子、房間都不畫）
- `elder-*.png`：五島長老會的五位老醫生
- `resident-*.png`：五位常駐的人
- `guild-mentor.png`（孟拓）、`guild-doctor.png`（馬凱）：站著的全身；`guild-archivist.png`（費民）：坐在櫃台後面的上半身
- `hero-*.png`：六位主角，站著的全身

全部是遊戲用程式畫的（`app/src/art`），不是另外畫的圖。遊戲的畫改了，跑一次就會更新：

```bash
node trailer/cutouts.mjs
```

病例和人物都還是草稿，還沒經過臨床老師審查。
