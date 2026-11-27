// 用真的瀏覽器走一遍新的流程：今天卡、今日之劫、錯題複習、連戰、速記頁。
// 先 vite build，再用 vite preview 開一個本機的伺服器；時間用 Playwright 的假時鐘，試弓的 15 分鐘一下子就到。
// 跑法：npm run e2e（CI 在「檢查和建置」裡跑）。
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { preview, type PreviewServer } from 'vite';
import { chromium, type Browser, type Page } from 'playwright';
import { BEATS } from '../src/ui/progress.ts';

const NOW = new Date('2026-11-27T09:00:00');   // 11-27：今日之劫是林秋（胸痛）；口試前 8 天，考前衝刺開著
let server: PreviewServer, browser: Browser, url = '';

before(async () => {
  server = await preview({ preview: { port: 0, strictPort: false }, logLevel: 'silent' });
  url = server.resolvedUrls!.local[0];
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await new Promise<void>((r) => server.httpServer.close(() => r())); });

const day = (d: string) => new Date(d + 'T10:00:00').getTime();
const rec = { best: 80, safety: 'met', plays: 1, seconds: 600, found: true, concern: true, reads: [] };
/** 第一章走完（試弓開放）、故事都看過的存檔 */
function saveWith(more: Record<string, unknown> = {}) {
  return { v: 3, beats: ['trailer', ...BEATS.map((b) => b.id)], cases: Object.fromEntries(['c01a', 'c01b', 'c01c', 'c01d'].map((id) => [id, rec])), takeaways: [], hero: 'cheng', trials: [], plays: [], days: [], ...more };
}
async function open(save: object): Promise<Page> {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  p.on('pageerror', (e) => errors.push(e.message));
  (p as unknown as { errors: string[] }).errors = errors;
  await p.clock.install({ time: NOW });
  await p.addInitScript((s) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('mist-guild.v1', JSON.stringify(s));
  }, save);
  await p.goto(url);
  await p.clock.runFor(1000);
  await p.getByText('繼續遊戲').first().click();
  await p.clock.runFor(1500);
  return p;
}
const errorsOf = (p: Page) => (p as unknown as { errors: string[] }).errors;
const stored = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('mist-guild.v1')!));
/** 進場之後讓試弓的時間走完，按結案後的那一顆按鈕 */
async function timeUp(p: Page) {
  await p.clock.runFor(2000);
  await p.clock.fastForward(15 * 60 * 1000 + 3000);
  await p.clock.runFor(1000); await p.clock.runFor(4000);
  await p.locator('.acts.one .act').click();
  await p.clock.runFor(800);
}
async function finishDebrief(p: Page) {
  for (let i = 0; i < 2; i++) { await p.getByRole('button', { name: '下一步' }).click(); await p.clock.runFor(300); }
  const label = await p.locator('.acts .act.demo').innerText();
  await p.locator('.acts .act.demo').click();
  await p.clock.runFor(1200);
  return label;
}

test('今天卡：今日之劫和衝刺試弓都在；考完今日之劫，兩件都打勾（今日之劫也算今天的試弓）', async () => {
  const p = await open(saveWith());
  const card = p.locator('.today-card');
  assert.match(await card.innerText(), /今日之劫：林秋（胸痛）/);
  assert.match(await card.innerText(), /衝刺試弓/);
  assert.match(await card.innerText(), /距離口試還有 8 天/);
  await card.getByRole('button', { name: '閱題' }).click();
  await p.clock.runFor(400);
  assert.equal(await p.locator('.sheet h2').innerText(), '今日之劫：閱題');
  await p.getByRole('button', { name: '進場，開始倒數' }).click();
  await timeUp(p);
  assert.match(await p.locator('.top .who').innerText(), /^試弓/);
  await finishDebrief(p);
  assert.equal((await stored(p)).trials.length, 1);
  // 今日之劫也是一場試弓：考完，今天的衝刺試弓一起算完成
  assert.match(await p.locator('.today-card').innerText(), /都做完了/);
  assert.deepEqual(errorsOf(p), []);
  await p.close();
});

test('錯題複習：三天前試弓錯的那一位，今天出現在今天卡，按重考到閱題', async () => {
  const miss = { at: day('2026-11-24'), caseId: 'c02b', score: 40, trial: true, found: false, trapped: true, takeaway: null };
  const p = await open(saveWith({ plays: [miss], trials: [{ at: miss.at, caseId: 'c02b', score: 40, safety: 'review', seconds: 900, timeUp: true, found: false }] }));
  const row = p.locator('.today-card li', { hasText: '錯題複習' });
  assert.match(await row.innerText(), /第 1 次複習/);
  await row.getByRole('button', { name: '重考' }).click();
  await p.clock.runFor(400);
  assert.equal(await p.locator('.sheet h2').innerText(), '錯題複習：閱題');
  assert.deepEqual(errorsOf(p), []);
  await p.close();
});

test('連戰：兩站連著考，一站交卷就記成績；兩站的回顧都從第一頁開始，最後回公會', async () => {
  const p = await open(saveWith());
  await p.locator('.quest', { hasText: '試弓・連戰' }).click();
  await p.clock.runFor(400);
  await p.getByRole('button', { name: '連戰：兩站' }).click();
  await p.clock.runFor(400);
  assert.equal(await p.locator('.sheet h2').innerText(), '連戰・第 1 站：閱題');
  await p.getByRole('button', { name: '進場，開始倒數' }).click();
  await p.clock.runFor(2000); await p.clock.fastForward(15 * 60 * 1000 + 3000); await p.clock.runFor(1000); await p.clock.runFor(4000);
  assert.equal(await p.locator('.acts.one .act').innerText(), '進下一站');
  await p.locator('.acts.one .act').click(); await p.clock.runFor(800);
  assert.equal(await p.locator('.sheet h2').innerText(), '連戰・第 2 站：閱題');
  assert.equal((await stored(p)).trials.length, 1, '第一站已經記下');
  await p.getByRole('button', { name: '進場，開始倒數' }).click();
  await timeUp(p);
  assert.equal(await finishDebrief(p), '看下一站的回顧');
  assert.ok(await p.getByRole('button', { name: '下一步' }).isVisible(), '第二站的回顧從第一頁開始');
  await finishDebrief(p);
  const s = await stored(p);
  assert.equal(s.trials.length, 2);
  assert.notEqual(s.trials[0].caseId, s.trials[1].caseId);
  assert.ok(await p.locator('.today-card').isVisible(), '回到公會');
  assert.deepEqual(errorsOf(p), []);
  await p.close();
});

test('速記頁：用到才下載，十二種主訴都在', async () => {
  const p = await open(saveWith());
  await p.locator('.quest', { hasText: '考前速記頁' }).click();
  // 用到才下載：等那一包載完
  for (let i = 0; i < 40 && !(await p.locator('.note-sec').count()); i++) { await p.clock.runFor(100); await p.waitForTimeout(50); }
  assert.equal(await p.locator('.note-sec').count(), 12);
  assert.deepEqual(errorsOf(p), []);
  await p.close();
});
