// 畫 App 的圖示：霧裡的一雙眼睛，底下掛著一盞燈。用遊戲自己的畫筆（src/art/sketch.js）畫，所以和遊戲是同一個筆觸。
// 圖示已經放在 public/ 裡，平常不用跑；要改圖的時候才跑：node tools/icons.mjs（要有 playwright）
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');

const PAGE = `<!doctype html><canvas id="c" width="512" height="512"></canvas><script type="module">
import { C, K, TAU, shape, ell, wline, dot } from 'http://icons.local/src/art/sketch.js';
window.draw = (px, pad) => {
  const cv = document.getElementById('c'); cv.width = cv.height = px;
  const g = cv.getContext('2d'), s = px / 100;
  g.setTransform(s, 0, 0, s, 0, 0); K.seed = 0; K.boil = 0;
  g.fillStyle = '#33443a'; g.fillRect(0, 0, 100, 100);
  // pad：可遮罩的圖示要把東西縮在中間，四周留給系統裁
  g.translate(50, 50); g.scale(pad, pad); g.translate(-50, -50);
  for (let i = 0; i < 26; i++) dot(g, (i * 37.7) % 100, (i * 61.3) % 100, 0.5 + (i % 3) * 0.25, 'rgba(239, 230, 207, 0.10)');
  // 霧
  const puffs = [[30, 47, 15], [46, 37, 19], [65, 41, 16], [73, 52, 12], [55, 54, 17], [38, 56, 14]];
  puffs.forEach(([x, y, r], i) => {
    const pts = []; for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU, rr = r * (1 + 0.075 * Math.sin(a * 5 + i * 1.3) + 0.06 * Math.sin(a * 3 + i * 2.1)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86]); }
    shape(g, pts, { fill: C.fog, stroke: C.fogLine, lw: 1.1, double: false, step: 99, amp: 0.4, seed: 3000 + i });
  });
  puffs.forEach(([x, y, r], i) => wline(g, [[x - r * 0.45, y + r * 0.1], [x - r * 0.25, y - r * 0.32], [x + r * 0.05, y - r * 0.2]], C.fogLine, 1.1, { seed: 3100 + i }));
  // 霧裡的眼睛
  [-7.5, 7.5].forEach((dx) => { dot(g, 51 + dx, 45, 5.6, C.ink); dot(g, 51 + dx, 45, 4.7, C.ochre); dot(g, 51 + dx - 1.2, 46.2, 2.3, C.ink); dot(g, 51 + dx + 1.3, 43.4, 0.9, C.cream); });
  // 一盞亮著的燈
  wline(g, [[51, 64], [51, 71]], C.ink, 1.3, { amp: 0.1 });
  const glow = g.createRadialGradient(51, 81, 4, 51, 81, 19); glow.addColorStop(0, 'rgba(255, 233, 166, 0.55)'); glow.addColorStop(1, 'rgba(255, 233, 166, 0)');
  g.fillStyle = glow; g.fillRect(30, 60, 42, 42);
  shape(g, ell(51, 82, 9.4, 8.8, 16), { fill: C.ochre, lw: 1.4, step: 99, amp: 0.2, double: false });
  shape(g, [[46, 70.6], [56, 70.6], [55, 74.4], [47, 74.4]], { fill: C.brass, lw: 1.1, step: 99, amp: 0.15, double: false });
  wline(g, [[51, 74.6], [51, 90.6]], 'rgba(44, 42, 37, 0.32)', 0.9, { amp: 0.1 });
  wline(g, [[45.6, 76.6], [44.6, 82], [45.8, 87.6]], 'rgba(44, 42, 37, 0.28)', 0.8, { amp: 0.1 });
  wline(g, [[56.4, 76.6], [57.4, 82], [56.2, 87.6]], 'rgba(44, 42, 37, 0.28)', 0.8, { amp: 0.1 });
};
window.ready = true;
</script>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('http://icons.local/**', (r) => (new URL(r.request().url()).pathname === '/' ? r.fulfill({ contentType: 'text/html', body: PAGE }) : r.fulfill({ path: join(root, new URL(r.request().url()).pathname) })));
await page.goto('http://icons.local/');
await page.waitForFunction('window.ready');
for (const [name, px, pad] of [['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['icon-maskable-512.png', 512, 0.74], ['apple-touch-icon.png', 180, 0.9], ['favicon.png', 64, 1.06]]) {
  await page.evaluate(([p, k]) => window.draw(p, k), [px, pad]);
  await page.locator('#c').screenshot({ path: join(root, 'public', name), omitBackground: false });
  console.log('畫好', name);
}
await browser.close();
