import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 輸出固定的檔名（app.js、app.css），方便放到任何靜態主機，也方便包成單頁
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: { output: { entryFileNames: 'app.js', chunkFileNames: 'app-[name].js', assetFileNames: 'app[extname]' } },
  },
});
