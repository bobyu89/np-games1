// 靜態版要的兩件事，都在建置的時候做：
// 1. 字體：從完整的字體檔裡只留遊戲用到的字（兩個字重，各約 0.6 MB），跟著遊戲一起放，不再連到別人的網站。
// 2. 離線：列出建出來的每一個檔，寫成 sw.js，讓瀏覽器把整個遊戲存起來。
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(dir, f.name)) : [join(dir, f.name)]));
const sha = (...parts: (string | Buffer)[]) => parts.reduce((h, p) => h.update(p), createHash('sha256')).digest('hex');

const FONT = "'LXGW WenKai TC'";
const WEIGHTS = [['400', '400Regular/LXGWWenKaiTC_400Regular.ttf'], ['700', '700Bold/LXGWWenKaiTC_700Bold.ttf']] as const;

/** 遊戲裡會出現的每一個字：程式、病例、樣式和首頁裡出現過的，加上一般的英數符號 */
function usedText(root: string): string {
  const used = new Set<string>();
  for (let c = 0x20; c < 0x7f; c++) used.add(String.fromCharCode(c));
  const files = [...walk(join(root, 'src')).filter((f) => /\.(ts|tsx|js|css)$/.test(f)), join(root, 'index.html'), join(root, 'public', 'manifest.webmanifest')].filter(existsSync);
  for (const f of files) for (const ch of readFileSync(f, 'utf8')) if (ch.codePointAt(0)! >= 0x20) used.add(ch);
  return [...used].sort().join('');
}

export function fonts(): Plugin {
  let root = '', dev = false;
  const pkg = () => join(root, 'node_modules/@expo-google-fonts/lxgw-wenkai-tc');
  const face = (weight: string, url: string, format: string) => `@font-face{font-family:${FONT};font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('${format}')}`;
  return {
    name: 'mist-fonts',
    configResolved(c) { root = c.root; dev = c.command === 'serve'; },
    // 開發的時候直接用完整的字體檔；建置的時候換成精簡過的
    transformIndexHtml() {
      const css = WEIGHTS.map(([w, f]) => (dev ? face(w, '/@fs/' + join(pkg(), f).replace(/\\/g, '/'), 'truetype') : face(w, 'fonts/wenkai-' + w + '.woff2', 'woff2'))).join('');
      return [{ tag: 'style', children: css, injectTo: 'head' }];
    },
    async generateBundle() {
      const { default: subsetFont } = await import('subset-font');
      const text = usedText(root), cache = join(root, 'node_modules/.cache/mist-fonts');
      mkdirSync(cache, { recursive: true });
      for (const [w, f] of WEIGHTS) {
        const source = readFileSync(join(pkg(), f)), kept = join(cache, sha(text, source).slice(0, 20) + '-' + w + '.woff2');
        if (!existsSync(kept)) writeFileSync(kept, await subsetFont(source, text, { targetFormat: 'woff2' }));
        this.emitFile({ type: 'asset', fileName: 'fonts/wenkai-' + w + '.woff2', source: readFileSync(kept) });
      }
      // 字體是 SIL Open Font License 1.1，跟著字體檔一起放授權全文
      this.emitFile({ type: 'asset', fileName: 'fonts/OFL.txt', source: readFileSync(join(pkg(), 'LICENSE_FONT')) });
    },
  };
}

export function offline(): Plugin {
  let out = '', root = '';
  return {
    name: 'mist-offline',
    apply: 'build',
    configResolved(c) { root = c.root; out = resolve(c.root, c.build.outDir); },
    closeBundle() {
      // social/ 是發到 Threads 用的圖（每日一案）：放在同一個網站上讓 Threads 來抓，但不是遊戲的一部分，不存進玩家的裝置
      const files = walk(out).map((f) => relative(out, f).replace(/\\/g, '/')).filter((f) => f !== 'sw.js' && !f.endsWith('.txt') && !f.startsWith('social/')).sort();
      const build = sha(...files.flatMap((f) => [f, readFileSync(join(out, f))])).slice(0, 12);
      const isFont = (f: string) => f.startsWith('fonts/');
      // './' 是首頁本身：從主畫面的圖示打開、或是網址後面沒有檔名的時候用的。index.html 不另外存一份：
      // 有些主機（Cloudflare）會把它轉到 './'，存下來的是轉址過的回應，瀏覽器不肯拿來當頁面；要開它的時候用 './' 那一份
      const core = ['./', ...files.filter((f) => !isFont(f) && f !== 'index.html')], extra = files.filter(isFont);
      const sw = readFileSync(join(root, 'tools/sw.template.js'), 'utf8').replace('__BUILD__', build).replace('__CORE__', JSON.stringify(core)).replace('__EXTRA__', JSON.stringify(extra));
      writeFileSync(join(out, 'sw.js'), sw);
      console.log('離線快取：' + (core.length + extra.length) + ' 個檔，版本 ' + build);
    },
  };
}
