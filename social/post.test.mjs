// 每日一案的排程：日期對得上、文字放得下、圖都在、不會重複發
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alreadyPosted, checkToken, headOf, main, pick, taipeiDate } from './post.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const schedule = JSON.parse(readFileSync(join(here, 'schedule.json'), 'utf8'));

test('日程：四十八天、日期連續、每一則都放得進 Threads', () => {
  assert.equal(schedule.length, 48);
  assert.equal(new Set(schedule.map((d) => d.id)).size, 48, '有病例重複了');
  schedule.forEach((d, i) => {
    assert.equal(d.no, i + 1);
    if (i) assert.equal(Date.parse(d.date) - Date.parse(schedule[i - 1].date), 86_400_000, d.date + ' 沒有接著前一天');
    assert.ok(d.text.length <= 500, '第 ' + d.no + ' 案超過 500 字元');
    assert.ok(d.text.startsWith(headOf(d)), '第 ' + d.no + ' 案的開頭不對');
    assert.ok(d.text.includes('還沒經過臨床老師審查'), '第 ' + d.no + ' 案少了還沒審查的說明');
    const img = join(here, '../app/public', d.image);
    assert.ok(existsSync(img), '少了圖：' + d.image);
    assert.ok(statSync(img).size < 8 * 1024 * 1024, d.image + ' 超過 Threads 的 8 MB');
  });
});

test('口試那一天和前後：倒數寫在文字的第一行，考完就沒有', () => {
  const first = (date) => pick(schedule, date).text.split('\n')[0];
  assert.match(first('2026-12-04'), /口試倒數 1 天/);
  assert.match(first('2026-12-05'), /口試就是今天/);
  assert.doesNotMatch(first('2026-12-06'), /口試/);
  assert.equal(pick(schedule, '2026-01-01'), null);
});

test('今天是哪一天照臺灣時間算；發過的不會再發', () => {
  assert.equal(taipeiDate(new Date('2026-11-13T23:37:00Z')), '2026-11-14');   // 排程跑的時間：臺灣已經是隔天早上
  assert.equal(taipeiDate(new Date('2026-11-13T15:59:00Z')), '2026-11-13');
  const d = schedule[0];
  assert.ok(alreadyPosted([{ text: '別的' }, { text: d.text }], d));
  assert.ok(!alreadyPosted([{ text: schedule[1].text }, {}, { text: null }], d));
  assert.ok(!alreadyPosted([{ text: '【每日一案 10｜口試倒數 13 天】' }], schedule[0]));   // 01 不會被 10 誤認
});

test('權杖的狀況：寫出哪一天過期；短期的、撐不到日程走完的要提醒；不能發文的直接停', () => {
  const now = Date.parse('2026-11-13T12:00:00Z'), at = (iso) => Math.floor(Date.parse(iso) / 1000), last = schedule.at(-1).date;
  const scopes = ['threads_basic', 'threads_content_publish'];
  const long = checkToken({ issued_at: at('2026-11-13T11:00:00Z'), expires_at: at('2027-01-12T11:00:00Z'), scopes }, last, now);
  assert.deepEqual(long, ['權杖到 2027-01-12 過期（還有 59 天）。']);
  const short = checkToken({ issued_at: at('2026-11-13T11:30:00Z'), expires_at: at('2026-11-13T12:30:00Z'), scopes }, last, now);
  assert.equal(short.length, 2); assert.match(short[1], /短期權杖/);
  const old = checkToken({ issued_at: at('2026-10-20T00:00:00Z'), expires_at: at('2026-12-19T00:00:00Z'), scopes }, last, now);
  assert.equal(old.length, 2); assert.match(old[1], /撐不到/); assert.match(old[1], /2026-12-19/);
  assert.throws(() => checkToken({ expires_at: at('2027-01-12T11:00:00Z'), scopes: ['threads_basic'] }, last, now), /threads_content_publish/);
  assert.match(checkToken(null, last, now)[0], /查不到/);
});

test('沒有權杖：檢查完就停，不算錯；沒有排的日子什麼都不做', async () => {
  const lines = [], real = globalThis.fetch;
  globalThis.fetch = async () => new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg' } });
  try {
    assert.equal(await main({ POST_DATE: '2026-11-14' }, (t) => lines.push(t)), 'no-token');
    assert.equal(await main({ POST_DATE: '2027-06-01' }, (t) => lines.push(t)), 'none');
  } finally { globalThis.fetch = real; }
  assert.ok(lines.some((t) => t.includes('每日一案 02')));
});

test('整段流程（假的 Threads）：試跑不發；真的發是兩步；已經有就跳過；權杖不會出現在錯誤訊息裡', async () => {
  const real = globalThis.fetch, calls = [];
  let posts = [], fail = false;
  globalThis.fetch = async (url, init) => {
    const u = new URL(String(url)), method = init?.method ?? 'GET', params = method === 'GET' ? u.searchParams : init.body;
    if (u.hostname.endsWith('workers.dev')) return new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    calls.push(method + ' ' + u.pathname);
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
    if (fail) return json({ error: { message: 'Invalid token ' + params.get('access_token') } }, 400);
    if (u.pathname.endsWith('/me')) return json({ id: '42', username: 'mistguild' });
    if (u.pathname.endsWith('/debug_token')) { assert.equal(params.get('input_token'), 'secret-token'); return json({ data: { type: 'USER', is_valid: true, issued_at: 1794567600, expires_at: 1799751600, scopes: ['threads_basic', 'threads_content_publish'] } }); }
    if (u.pathname.endsWith('/42/threads') && method === 'GET') return json({ data: posts });
    if (u.pathname.endsWith('/42/threads') && method === 'POST') { assert.equal(params.get('media_type'), 'IMAGE'); assert.match(params.get('image_url'), /\/social\/02\.jpg$/); return json({ id: 'box1' }); }
    if (u.pathname.endsWith('/box1')) return json({ status: 'FINISHED' });
    if (u.pathname.endsWith('/42/threads_publish')) { assert.equal(params.get('creation_id'), 'box1'); return json({ id: 'post1' }); }
    return json({ error: { message: 'unexpected ' + u.pathname } }, 404);
  };
  const env = { POST_DATE: '2026-11-14', THREADS_ACCESS_TOKEN: 'secret-token' }, said = [], quiet = (t) => said.push(t);
  const timers = globalThis.setTimeout; globalThis.setTimeout = (f) => timers(f, 0);   // 測試不用真的等十秒
  try {
    assert.equal(await main({ ...env, DRY_RUN: '1' }, quiet), 'dry');
    assert.ok(!calls.some((c) => c.startsWith('POST')), '試跑不應該發任何東西');
    assert.ok(said.some((t) => /^權杖到 \d{4}-\d\d-\d\d 過期/.test(t)), '試跑要寫出權杖哪一天過期');
    assert.ok(!said.join('\n').includes('secret-token'), '紀錄裡不能有權杖');
    assert.equal(await main(env, quiet), 'posted');
    assert.deepEqual(calls.filter((c) => c.startsWith('POST')), ['POST /v1.0/42/threads', 'POST /v1.0/42/threads_publish']);
    posts = [{ text: schedule[1].text }];
    assert.equal(await main(env, quiet), 'exists');
    fail = true;
    await assert.rejects(main(env, quiet), (e) => !String(e.message).includes('secret-token') && String(e.message).includes('***'));
  } finally { globalThis.fetch = real; globalThis.setTimeout = timers; }
});
