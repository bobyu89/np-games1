// 產生「每日一案」的圖和貼文：一天一張 1080×1350 的圖（app/public/social/NN.jpg）和一段文字（social/schedule.json）。
// 內容只用閱題卡上本來就給玩家看的（病人是誰、三行情境、進門前想的三件事），不含診斷。
//
// 用法（在專案的根目錄）：node social/make.mjs <第一天 YYYY-MM-DD>
// 需要 playwright（不在專案的相依套件裡，要另外裝）：圖是用遊戲自己的畫（app/src/art）在瀏覽器裡畫出來再截下來的。
// 改了第一天、病例的閱題卡或版型，就重跑一次，把產生的檔一起提交。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CASES, FINALE_ID } from '../app/src/data/index.ts';

const here = dirname(fileURLToPath(import.meta.url)), APP = resolve(here, '../app'), ART = join(APP, 'src/art'), FONT = join(APP, 'node_modules/@expo-google-fonts/lxgw-wenkai-tc');
const OUT = join(APP, 'public/social'), START = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(START ?? '')) { console.error('用法：node social/make.mjs <第一天 YYYY-MM-DD>'); process.exit(2); }
export const LINK = 'https://mist-guild.shiftguard-navicare.workers.dev';
const EXAM = new Date(2026, 11, 5);   // 口試的日期，和 app/src/ui/exam.ts 同一天

// 順序：十二個主訴輪一圈（每個主訴的第一位），再輪第二位……四十八天不重複。終章的那一位不發
const ORDER = ['a', 'b', 'c', 'd'].flatMap((k) => Array.from({ length: 12 }, (_, i) => 'c' + String(i + 1).padStart(2, '0') + k));
const DATA = ORDER.map((id) => CASES.find((c) => c.id === id && c.id !== FINALE_ID)).map((c) => ({ id: c.id, complaint: c.complaintName, name: c.patient.name, look: c.patient.look, scene: c.scene, shadow: c.shadow.look, lines: c.reading.lines, prompts: c.reading.prompts }));
const pad = (n) => String(n).padStart(2, '0');
const dayOf = (i) => { const [y, m, d] = START.split('-').map(Number); return new Date(y, m - 1, d + i); };
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const countdown = (date) => { const n = Math.round((EXAM - date) / 86400000); return n > 0 ? '口試倒數 ' + n + ' 天' : n === 0 ? '口試就是今天' : ''; };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const CSS = `
  @font-face { font-family: WK; font-weight: 400; src: url(/f400.ttf); } @font-face { font-family: WK; font-weight: 700; src: url(/f700.ttf); }
  * { box-sizing: border-box; margin: 0; }
  :root { --page: #33443a; --paper: #f1e8d0; --ink: #2c2a25; --ochre: #dba941; --rust: #b4532b; --on: #efe6cf; --on-soft: #b9c7b0;
    --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.16 0 0 0 0 0.13 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
    --r-a: 13px 17px 12px 19px / 17px 12px 19px 13px; --r-b: 17px 12px 18px 13px / 12px 18px 13px 17px; }
  body { width: 540px; height: 675px; background: var(--grain), var(--page); font-family: WK, serif; color: var(--ink); padding: 20px 24px 15px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
  .paper { background: var(--grain), var(--paper); border: 2px solid var(--ink); border-radius: var(--r-a); box-shadow: 3px 4px 0 var(--ink); }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .tag { background: var(--grain), var(--ochre); border: 2px solid var(--ink); border-radius: var(--r-b); padding: 1px 13px; font-weight: 700; font-size: 17px; box-shadow: 2px 3px 0 var(--ink); transform: rotate(-1deg); }
  .tag.cd { background: var(--grain), var(--rust); color: var(--on); transform: rotate(1.2deg); font-size: 15.5px; }
  /* 插圖吃掉剩下的高度：字多的那幾天圖矮一點，字少的高一點 */
  .scene { padding: 5px; flex: 1 1 0; min-height: 168px; max-height: 258px; display: flex; } .scene canvas { display: block; flex: 1; min-height: 0; width: 100%; border-radius: 9px 12px 8px 13px / 12px 8px 13px 9px; }
  h1 { color: var(--on); font-size: 25px; font-weight: 700; line-height: 1.25; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  h1 small { font-size: 15px; font-weight: 400; color: var(--ochre); border: 1.5px solid var(--ochre); border-radius: 9px; padding: 0 8px; }
  .card { padding: 9px 14px 10px; font-size: 17px; line-height: 1.5; }
  .ask { color: var(--on); font-size: 15.5px; line-height: 1.5; }
  .ask b { display: block; color: var(--ochre); font-size: 15px; margin-bottom: 1px; letter-spacing: 0.04em; }
  .ask ol { padding-left: 1.35em; }
  .foot { margin-top: auto; display: flex; flex-direction: column; gap: 3px; align-items: center; }
  .kick { color: var(--on-soft); font-size: 14.5px; } .url { color: var(--on); font-size: 15.5px; font-weight: 700; border-bottom: 2px dashed var(--on-soft); }
  .note { color: var(--on-soft); font-size: 12px; }
`;
const html = (c, no, cd) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>
  <div class="top"><span class="tag">每日一案 ${pad(no)}</span>${cd ? `<span class="tag cd">${cd}</span>` : ''}</div>
  <div class="paper scene"><canvas id="ward"></canvas></div>
  <h1>${esc(c.lines[0].replace(/。$/, ''))}<small>主訴：${esc(c.complaint)}</small></h1>
  <div class="paper card">${c.lines.slice(1).map(esc).join('')}</div>
  <div class="ask"><b>進門之前，先想三件事</b><ol>${c.prompts.map((p) => '<li>' + esc(p) + '</li>').join('')}</ol></div>
  <div class="foot"><span class="kick">完整的問診、評估和回顧在《霧脈公會》：專科護理師口試的練習遊戲</span><span class="url">${LINK.replace('https://', '')}</span><span class="note">病例是草稿，還沒有經過臨床老師審查，不能當教材</span></div>
  <script type="module">
    import { createWard } from '/art/ward.js';
    await document.fonts.ready;
    const el = document.getElementById('ward'), s = createWard(el, { patient: ${JSON.stringify(c.look)}, scene: ${JSON.stringify(c.scene)}, hero: 'cheng', shadow: ${JSON.stringify(c.shadow)} });
    s.state.veil = 1; s.resize(el.clientWidth, el.clientHeight);
    let t = 7.3; for (let k = 0; k < 60; k++) { t += 0.03; s.update(t, 0.03); } s.render(); window.done = true;
  </script></body>`;
export const caption = (c, no, cd) => [
  '【每日一案 ' + pad(no) + (cd ? '｜' + cd : '') + '】',
  c.lines.join(''),
  '',
  '進門之前，先想三件事：',
  ...c.prompts.map((p, i) => (i + 1) + '. ' + p),
  '',
  '你會先問哪一句？留言說說看。',
  '完整的問診、評估和回顧在遊戲《霧脈公會》裡，免費、手機直接玩：',
  LINK,
  '',
  '＊病例是草稿，還沒經過臨床老師審查，不能當教材。',
].join('\n');

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.error('找不到 playwright。請先安裝（例如 npm i -g playwright），再跑一次。'); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(), schedule = [];
for (let i = 0; i < DATA.length; i++) {
  const no = i + 1, c = DATA[i], date = dayOf(i), cd = countdown(date);
  const page = await browser.newPage({ viewport: { width: 540, height: 675 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => { console.error('畫面錯誤', c.id, e.message); process.exitCode = 1; });
  await page.route('http://daily.test/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html(c, no, cd) });
    if (u.pathname === '/f400.ttf') return route.fulfill({ contentType: 'font/ttf', body: readFileSync(join(FONT, '400Regular/LXGWWenKaiTC_400Regular.ttf')) });
    if (u.pathname === '/f700.ttf') return route.fulfill({ contentType: 'font/ttf', body: readFileSync(join(FONT, '700Bold/LXGWWenKaiTC_700Bold.ttf')) });
    const f = join(ART, u.pathname.replace('/art/', '/'));
    return existsSync(f) ? route.fulfill({ contentType: 'text/javascript', body: readFileSync(f) }) : route.fulfill({ status: 404, body: 'no' });
  });
  await page.goto('http://daily.test/'); await page.waitForFunction('window.done === true', null, { timeout: 30000 }); await page.waitForTimeout(200);
  const h = await page.evaluate(() => document.body.scrollHeight);
  if (h > 675) { console.error('第 ' + no + ' 案的字放不下（' + h + '）'); process.exitCode = 1; }
  await page.screenshot({ path: join(OUT, pad(no) + '.jpg'), type: 'jpeg', quality: 84 }); await page.close();
  const text = caption(c, no, cd);
  if (text.length > 500) { console.error('第 ' + no + ' 案的貼文超過 500 字元'); process.exitCode = 1; }
  schedule.push({ no, date: iso(date), id: c.id, name: c.name, complaint: c.complaint, image: 'social/' + pad(no) + '.jpg', text });
}
await browser.close();
writeFileSync(join(here, 'schedule.json'), JSON.stringify(schedule, null, 1) + '\n');
console.log('寫好 ' + schedule.length + ' 天：' + schedule[0].date + ' 到 ' + schedule[schedule.length - 1].date);
