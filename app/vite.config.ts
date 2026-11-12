import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fonts, offline } from './tools/static.ts';

// 這一版是哪一次提交建出來的：提交的日期加代號。同一次提交不管建幾次都一樣，離線快取才不會白白換版
const build = (() => { try { return execSync('git log -1 --format=%cs.%h', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev'; } catch { return 'dev'; } })();

// 整個遊戲是一包靜態檔（index.html、app.js、app.css、字體、圖示、sw.js），放到任何靜態主機都能跑。
// 檔名固定、路徑都是相對的，所以放在網域底下的哪一層都可以。
export default defineConfig({
  base: './',
  plugins: [react(), fonts(), offline()],
  define: { __BUILD__: JSON.stringify(build) },
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500,  // 48 個病例的文字都打包在同一個檔裡（約 1.2 MB，壓縮後約三分之一）
    rollupOptions: { output: { entryFileNames: 'app.js', chunkFileNames: 'app-[name].js', assetFileNames: 'app[extname]' } },
  },
});
