// 定時器那一邊的發文：沒有權杖不動、有權杖照兩步發、不回頭抓自己的網址、今天沒有排就不動
import test from 'node:test';
import assert from 'node:assert/strict';
import schedule from '../../social/schedule.json' with { type: 'json' };
import { taipeiDate } from '../../social/core.mjs';
import { daily } from './daily.ts';

test('每日一案的定時器', async () => {
  const real = globalThis.fetch, timers = globalThis.setTimeout, RealDate = Date, calls: string[] = [];
  let posts: { text: string }[] = [];
  // 把「今天」定在日程的第二天早上（排程跑的時間：UTC 是前一天的 23:37）
  const at = new RealDate('2026-11-13T23:37:00Z').getTime();
  globalThis.Date = class extends RealDate { constructor(...a: []) { if (a.length) super(...a); else super(at); } static now() { return at; } } as DateConstructor;
  globalThis.setTimeout = ((f: () => void) => timers(f, 0)) as typeof setTimeout;   // 測試不用真的等十秒
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url)), method = init?.method ?? 'GET', params = method === 'GET' ? u.searchParams : init!.body as URLSearchParams;
    calls.push(method + ' ' + u.host + u.pathname);
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
    assert.equal(u.host, 'threads.test', '只能連 Threads，不能回頭抓自己的網址');
    assert.equal(params.get('access_token'), 'secret-token');
    if (u.pathname.endsWith('/me')) return json({ id: '42', username: 'mistguild' });
    if (u.pathname.endsWith('/debug_token')) return json({ data: { issued_at: 1794567600, expires_at: 1799751600, scopes: ['threads_basic', 'threads_content_publish'] } });
    if (u.pathname.endsWith('/42/threads') && method === 'GET') return json({ data: posts });
    if (u.pathname.endsWith('/42/threads') && method === 'POST') { assert.match(params.get('image_url')!, /^https:\/\/.+\/social\/02\.jpg$/); assert.equal(params.get('text'), schedule[1].text); return json({ id: 'box1' }); }
    if (u.pathname.endsWith('/box1')) return json({ status: 'FINISHED' });
    if (u.pathname.endsWith('/42/threads_publish')) { assert.equal(params.get('creation_id'), 'box1'); return json({ id: 'post1' }); }
    return json({ error: { message: 'unexpected ' + u.pathname } }, 404);
  }) as typeof fetch;
  const said: string[] = [], log = (t: string) => { said.push(t); };
  const env = { THREADS_ACCESS_TOKEN: 'secret-token', THREADS_API: 'https://threads.test/v1.0' };
  try {
    assert.equal(taipeiDate(), '2026-11-14');
    assert.equal(await daily({}, log), 'no-token');
    assert.equal(calls.length, 0, '沒有權杖：哪裡都不連');
    assert.equal(await daily(env, log), 'posted');
    assert.deepEqual(calls.filter((c) => c.startsWith('POST')), ['POST threads.test/v1.0/42/threads', 'POST threads.test/v1.0/42/threads_publish']);
    posts = [{ text: schedule[1].text }]; calls.length = 0;
    assert.equal(await daily(env, log), 'exists');
    assert.ok(!calls.some((c) => c.startsWith('POST')), '帳號上已經有了（例如 GitHub 那一邊先發了），不發第二次');
    assert.ok(!said.join('\n').includes('secret-token'), '紀錄裡不能有權杖');
  } finally { globalThis.fetch = real; globalThis.setTimeout = timers; globalThis.Date = RealDate; }
});
