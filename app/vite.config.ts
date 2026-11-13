import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fonts, offline } from './tools/static.ts';

// 這一版是哪一次提交建出來的：最後一次動到遊戲本身（app/ 底下，說明文件不算）的那次提交，日期加代號。
// 只改了後端或文件的時候，建出來的遊戲一個字都不會變，玩家就不會平白看到「有新的版本」。
// 歷史不完整（只抓了最後一次提交）而找不到的時候，退回用最後一次提交。
const here = fileURLToPath(new URL('.', import.meta.url));
const lastCommit = (...paths: string[]) => { try { return execFileSync('git', ['log', '-1', '--format=%cs.%h', ...paths], { cwd: here, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
// public/social 是發到 Threads 用的圖，換圖不算遊戲換版
const build = lastCommit('--', '.', ':(exclude)*.md', ':(exclude)public/social') || lastCommit() || 'dev';

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
