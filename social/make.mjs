// 產生 Threads 的日程（social/schedule.json）和圖（app/public/social/）。日程有三段：
//   1. 每日一案 01–10：2026-11-13 到 11-22 已經發過的，原樣留著（圖 01.jpg–10.jpg 不動）
//   2. 公告：《霧脈公會：歸航記》的更新，附前導片（app/public/social/trailer-vertical.mp4）。沒有日期，手動發（POST_ID=launch-guihang）
//      另一則「跟 AI 一起做的」（POST_ID=ai-build），掛 AI 的主題標籤
//   主題標籤（tag）：Threads 一則只能一個。歸航記每天掛「護理」；01–10 和公告已經發過，不加
//   3. 歸航記：照《奧德賽》的順序走十二劫。每一劫先一則介紹（劫影、神話、在霧海裡是哪個症狀、最容易掉進的陷阱、那座島的四位病人），
//      接著那座島還沒發過的病人一天一位（閱題卡：病人是誰、三行情境、進門前想的三件事）。圖是 gNN.jpg。
// 內容只用閱題卡上本來就給玩家看的，不含診斷。口試倒數拿掉了（研究主持人 2026-11-22：之後用英雄旅程發文，不用管口試）。
//
// 用法（在專案的根目錄）：node social/make.mjs <歸航記的第一天 YYYY-MM-DD>
// 需要 playwright（不在專案的相依套件裡，要另外裝）：圖是用遊戲自己的畫（app/src/art）在瀏覽器裡畫出來再截下來的。
// 改了第一天、病例的閱題卡或版型，就重跑一次，把產生的檔一起提交。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CASES, COMPLAINTS, FINALE_ID } from '../app/src/data/index.ts';
import { ISLANDS, ISLAND_OF } from '../app/src/data/islands.ts';
import { PERILS } from '../app/src/data/odyssey.ts';
import { ODYSSEY } from '../trailer/composition.mjs';

const here = dirname(fileURLToPath(import.meta.url)), APP = resolve(here, '../app'), ART = join(APP, 'src/art'), FONT = join(APP, 'node_modules/@expo-google-fonts/lxgw-wenkai-tc');
const OUT = join(APP, 'public/social'), CUT = resolve(here, '../assets/cutouts'), START = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(START ?? '')) { console.error('用法：node social/make.mjs <歸航記的第一天 YYYY-MM-DD>'); process.exit(2); }
export const LINK = 'https://mist-guild.shiftguard-navicare.workers.dev';

// 已經發過的每日一案（2026-11-13 到 11-22），原樣留著
const OLD = JSON.parse(readFileSync(join(here, 'schedule.json'), 'utf8')).filter((d) => d.head === undefined && d.date && d.date <= '2026-11-22');
const POSTED = new Set(OLD.map((d) => d.id));
const caseData = (c) => ({ id: c.id, complaint: c.complaintName, name: c.patient.name, look: c.patient.look, scene: c.scene, shadow: c.shadow.look, lines: c.reading.lines, prompts: c.reading.prompts });
const NUM = '一二三四五六七八九十', numZh = (n) => (n <= 10 ? NUM[n - 1] : '十' + NUM[n - 11]);
// 十二劫，照《奧德賽》的順序（跟前導片同一份）。每一劫：島、症狀、劫影、神話、陷阱、那座島的四位病人
const PERIL_DATA = ODYSSEY.map(([island, short], k) => {
  const m = COMPLAINTS.find((x) => ISLAND_OF[x.place ?? 'ward'] === island), p = PERILS[m.id];
  const patients = CASES.filter((c) => c.complaint === m.id && c.id !== FINALE_ID).map(caseData);
  return { n: k + 1, island: ISLANDS[island].name, complaint: m.name, shadow: m.shadow.name, look: m.shadow.look, peril: p.name.replace('之劫', ''), myth: p.myth, short, trap: p.trap, patients };
});
const pad = (n) => String(n).padStart(2, '0');
const dayOf = (i) => { const [y, m, d] = START.split('-').map(Number); return new Date(y, m - 1, d + i); };
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
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
  <div class="top"><span class="tag">歸航記 ${pad(no)}</span>${cd ? `<span class="tag cd">${cd}</span>` : ''}</div>
  <div class="paper scene"><canvas id="ward"></canvas></div>
  <h1>${esc(c.lines[0].replace(/。$/, ''))}<small>主訴：${esc(c.complaint)}</small></h1>
  <div class="paper card">${c.lines.slice(1).map(esc).join('')}</div>
  <div class="ask"><b>進門之前，先想三件事</b><ol>${c.prompts.map((p) => '<li>' + esc(p) + '</li>').join('')}</ol></div>
  <div class="foot"><span class="kick">完整的問診、評估和回顧在《霧脈公會：歸航記》</span><span class="url">${LINK.replace('https://', '')}</span><span class="note">病例是草稿，還沒有經過臨床老師審查，不能當教材</span></div>
  <script type="module">
    import { createWard } from '/art/ward.js';
    await document.fonts.ready;
    const el = document.getElementById('ward'), s = createWard(el, { patient: ${JSON.stringify(c.look)}, scene: ${JSON.stringify(c.scene)}, hero: 'cheng', shadow: ${JSON.stringify(c.shadow)} });
    s.state.veil = 1; s.resize(el.clientWidth, el.clientHeight);
    let t = 7.3; for (let k = 0; k < 60; k++) { t += 0.03; s.update(t, 0.03); } s.render(); window.done = true;
  </script></body>`;
export const HEAD = (no) => '【歸航記 ' + pad(no);
export const caption = (c, no, cd) => [
  HEAD(no) + '｜' + cd + '】',
  c.lines.join(''),
  '',
  '進門之前，先想三件事：',
  ...c.prompts.map((p, i) => (i + 1) + '. ' + p),
  '',
  '你會先問哪一句？留言說說看。',
  '完整的問診、評估和回顧在遊戲《霧脈公會：歸航記》裡，免費、手機直接玩：',
  LINK,
  '',
  '＊病例是草稿，還沒經過臨床老師審查，不能當教材。',
].join('\n');

// 每一劫的介紹：劫影、神話、在霧海裡是哪個症狀、陷阱、那座島的四位病人
const introHtml = (p, no) => `<!doctype html><meta charset="utf-8"><style>${CSS}
  .sea { background: radial-gradient(ellipse at 50% 55%, #4a6a5f 0%, #24342e 75%); position: relative; padding: 0; overflow: hidden; }
  .sea canvas { width: 100%; height: 100%; } .sea .isle { position: absolute; right: 12px; bottom: 4px; color: rgba(239,230,207,.14); font-size: 46px; font-weight: 700; letter-spacing: .08em; }
  .myth { color: var(--on-soft); font-size: 16px; line-height: 1.5; }
  h1 b { background: var(--grain), var(--paper); color: var(--ink); border: 2px solid var(--ink); border-radius: var(--r-b); padding: 0 10px; box-shadow: 2px 3px 0 var(--ink); }
  .pts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; } .pts figure { text-align: center; color: var(--on); font-size: 13.5px; } .pts img { width: 100%; aspect-ratio: 1; object-fit: contain; display: block; }
</style><body>
  <div class="top"><span class="tag">歸航記 ${pad(no)}</span><span class="tag cd">第${numZh(p.n)}劫・${esc(p.peril)}</span></div>
  <div class="paper scene sea"><canvas id="beast"></canvas><span class="isle">${esc(p.island)}</span></div>
  <p class="myth">《奧德賽》裡：${esc(p.short)}</p>
  <h1>在霧海裡，這一劫是 <b>${esc(p.complaint)}</b></h1>
  <div class="paper card"><b>最容易掉進去的陷阱：</b>${esc(p.trap)}</div>
  <div class="ask"><b>${esc(p.island)}的病人，接下來幾天一位一位來</b><div class="pts">${p.patients.map((c) => `<figure><img src="/cut/patient-${c.id}.png" /><figcaption>${esc(c.name)}</figcaption></figure>`).join('')}</div></div>
  <div class="foot"><span class="kick">《霧脈公會：歸航記》：專科護理師的臨床推理遊戲</span><span class="url">${LINK.replace('https://', '')}</span><span class="note">病例是草稿，還沒有經過臨床老師審查，不能當教材</span></div>
  <script type="module">
    import { createWard } from '/art/ward.js';
    await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    const el = document.getElementById('beast'), s = createWard(el, { patient: 'lin', shadow: ${JSON.stringify(p.look)}, solo: true, view: { w: 150, h: 115, cx: 178, cy: 84 } });
    s.resize(el.clientWidth, el.clientHeight);
    let t = 2; for (let k = 0; k < 40; k++) { t += 0.03; s.update(t, 0.03); } s.render(); window.done = true;
  </script></body>`;
export const introCaption = (p, no) => [
  HEAD(no) + '｜第' + numZh(p.n) + '劫・' + p.peril + '】',
  '《奧德賽》裡，' + p.myth,
  '',
  '在《霧脈公會》的霧海裡，這一劫是「' + p.complaint + '」。',
  p.trap,
  '',
  '接下來幾天，' + p.island + '的病人會一位一位來。你被這一劫困住過嗎？留言說說看。',
  '遊戲免費、手機直接玩：',
  LINK,
  '',
  '＊病例是草稿，還沒經過臨床老師審查，不能當教材。',
].join('\n');

// 公告：這一次的更新，附前導片
export const LAUNCH = {
  no: 0, date: null, id: 'launch-guihang', name: '歸航記更新', head: '【霧脈公會：歸航記】', video: 'social/trailer-vertical.mp4',
  text: [
    '【霧脈公會：歸航記】更新了',
    '這是給專科護理師的臨床推理遊戲。這一次，我們用《奧德賽》重新串起整個故事：一個人在海上漂流十年，一關一關認出眼前的危險，才回到家。',
    '',
    '・霧海十二座島，一座島一種症狀',
    '・每一劫，都是那個主訴最容易掉進去的推理陷阱，結案後告訴你有沒有被困住',
    '・地圖上看得到自己走到哪裡，首頁直接告訴你下一步',
    '',
    '明天開始，每天一則「歸航記」：照史詩的順序一劫一劫走，帶你認識每座島上的病人。',
    '免費、手機直接玩：',
    LINK,
    '',
    '＊病例是草稿，還沒經過臨床老師審查，不能當教材。',
  ].join('\n'),
};

// 用 AI 做遊戲的角度，掛 AI 標籤，給看 AI 的人
export const AI_BUILD = {
  no: 0, date: null, id: 'ai-build', name: '跟 AI 一起做的', head: '【霧脈公會：跟 AI 一起做的臨床推理遊戲】', video: 'social/trailer-vertical.mp4', tag: 'AI',
  text: [
    '【霧脈公會：跟 AI 一起做的臨床推理遊戲】',
    '這是給專科護理師練臨床推理的遊戲：病人進門，你問診、找線索、排鑑別診斷，最後說出判斷和理由。',
    '',
    '大部分的程式和畫面，是跟 AI（Claude Code）一起寫出來的：',
    '・四十多位病人、十二隻劫影、整片霧海，都是用程式畫的，不是生成圖',
    '・前導片用 HyperFrames 把遊戲畫面一格一格錄成影片，海浪和鐘聲也是程式合成的',
    '・故事借《奧德賽》：十二劫，各是一種最容易掉進去的推理陷阱',
    '',
    'AI 很會寫程式、做畫面；但病例寫得對不對，還是要臨床老師來看。所以每一則都標著還沒審查。',
    '',
    '手機直接玩：',
    LINK,
    '',
    '＊病例是草稿，還沒經過臨床老師審查，不能當教材。',
  ].join('\n'),
};
export const TAG = '護理';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.error('找不到 playwright。請先安裝（例如 npm i -g playwright），再跑一次。'); process.exit(1); }
mkdirSync(OUT, { recursive: true });
// 歸航記的排法：一劫一則介紹，接著那座島還沒發過的病人
const PLAN = PERIL_DATA.flatMap((p) => [{ intro: p }, ...p.patients.map((c, j) => ({ c, label: '第' + numZh(p.n) + '劫・' + p.peril + ' ' + (j + 1) + '／' + p.patients.length })).filter((x) => !POSTED.has(x.c.id))]);
const browser = await chromium.launch(), schedule = [...OLD, LAUNCH, AI_BUILD];
for (let i = 0; i < PLAN.length; i++) {
  const no = i + 1, x = PLAN[i], date = dayOf(i), file = 'g' + pad(no) + '.jpg';
  const page = await browser.newPage({ viewport: { width: 540, height: 675 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => { console.error('畫面錯誤', no, e.message); process.exitCode = 1; });
  await page.route('http://daily.test/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: x.intro ? introHtml(x.intro, no) : html(x.c, no, x.label) });
    if (u.pathname === '/f400.ttf') return route.fulfill({ contentType: 'font/ttf', body: readFileSync(join(FONT, '400Regular/LXGWWenKaiTC_400Regular.ttf')) });
    if (u.pathname === '/f700.ttf') return route.fulfill({ contentType: 'font/ttf', body: readFileSync(join(FONT, '700Bold/LXGWWenKaiTC_700Bold.ttf')) });
    if (u.pathname.startsWith('/cut/')) { const f = join(CUT, u.pathname.slice(5)); return existsSync(f) ? route.fulfill({ contentType: 'image/png', body: readFileSync(f) }) : route.fulfill({ status: 404, body: 'no' }); }
    const f = join(ART, u.pathname.replace('/art/', '/'));
    return existsSync(f) ? route.fulfill({ contentType: 'text/javascript', body: readFileSync(f) }) : route.fulfill({ status: 404, body: 'no' });
  });
  await page.goto('http://daily.test/'); await page.waitForFunction('window.done === true', null, { timeout: 30000 }); await page.waitForTimeout(200);
  const h = await page.evaluate(() => document.body.scrollHeight);
  if (h > 675) { console.error('歸航記 ' + no + ' 的字放不下（' + h + '）'); process.exitCode = 1; }
  await page.screenshot({ path: join(OUT, file), type: 'jpeg', quality: 84 }); await page.close();
  const text = x.intro ? introCaption(x.intro, no) : caption(x.c, no, x.label);
  if (text.length > 500) { console.error('歸航記 ' + no + ' 的貼文超過 500 字元（' + text.length + '）'); process.exitCode = 1; }
  schedule.push(x.intro
    ? { no, date: iso(date), id: 'peril-' + x.intro.n, head: HEAD(no), name: x.intro.peril, complaint: x.intro.complaint, image: 'social/' + file, tag: TAG, text }
    : { no, date: iso(date), id: x.c.id, head: HEAD(no), name: x.c.name, complaint: x.c.complaint, image: 'social/' + file, tag: TAG, text });
}
await browser.close();
writeFileSync(join(here, 'schedule.json'), JSON.stringify(schedule, null, 1) + '\n');
const days = schedule.filter((d) => d.head?.startsWith('【歸航記'));
console.log('歸航記 ' + days.length + ' 天：' + days[0].date + ' 到 ' + days.at(-1).date + '；另有手動發的兩則（' + LAUNCH.id + '、' + AI_BUILD.id + '）');
