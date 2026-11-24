// Threads 的日程（每日一案 01–10、歸航記、公告）：日期對得上、文字放得下、圖和影片都在、不會重複發
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alreadyPosted, checkToken, headOf, lastDate, main, pick, pickId, taipeiDate } from './post.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const schedule = JSON.parse(readFileSync(join(here, 'schedule.json'), 'utf8'));

test('日程：每日一案 01–10 照舊，接著歸航記一天一則、日期連續；每一則都放得進 Threads、不重複', () => {
  const daily = schedule.filter((d) => d.date).sort((x, y) => x.date.localeCompare(y.date));
  daily.forEach((d, i) => { if (i) assert.equal(Date.parse(d.date) - Date.parse(daily[i - 1].date), 86_400_000, d.date + ' 沒有接著前一天'); });
  assert.equal(daily.filter((d) => !d.head).length, 10, '已經發過的每日一案是十則');
  const journey = daily.filter((d) => d.head?.startsWith('【歸航記'));
  assert.equal(journey[0].date, '2026-11-23');
  journey.forEach((d, i) => assert.equal(d.no, i + 1));
  assert.equal(new Set(daily.filter((d) => !d.id.startsWith('peril-')).map((d) => d.id)).size, daily.filter((d) => !d.id.startsWith('peril-')).length, '有病人重複發了');
  assert.equal(journey.filter((d) => d.id.startsWith('peril-')).length, 12, '十二劫各一則介紹');
  for (const d of schedule) {
    assert.ok(d.text.length <= 500, headOf(d) + ' 超過 500 字元');
    assert.ok(d.text.startsWith(headOf(d)), headOf(d) + ' 的開頭不對');
    // 2026-11-25 起改成依文獻的說法；之前已經發出去的照當時的文字留著
    const posted = (d.date && d.date <= '2026-11-24') || d.id === 'launch-guihang' || d.id === 'ai-build';
    assert.ok(d.text.includes(posted ? '還沒經過臨床老師審查' : '依文獻與臨床指引撰寫'), headOf(d) + ' 少了內容來源的說明');
    assert.ok(d.text.includes('不能'), headOf(d) + ' 少了不能取代臨床判斷（或不能當教材）的提醒');
    const file = join(here, '../app/public', d.image ?? d.video);
    assert.ok(existsSync(file), '少了檔：' + (d.image ?? d.video));
    assert.ok(statSync(file).size < (d.video ? 1024 : 8) * 1024 * 1024, file + ' 太大');
  }
  assert.equal(new Set(schedule.map(headOf)).size, schedule.length, '每一則的開頭要不一樣，才認得出發過沒有');
});

test('歸航記：拿掉口試倒數；公告沒有日期、附前導片，只能指定發', () => {
  for (const d of schedule.filter((x) => x.head)) assert.doesNotMatch(d.text, /口試倒數|口試就是今天/);
  for (const d of schedule.filter((x) => x.head?.startsWith('【歸航記'))) assert.equal(d.tag, '護理', headOf(d) + ' 沒有掛「護理」');
  for (const d of schedule.filter((x) => x.tag)) assert.ok(d.tag.length <= 50 && !/[.&]/.test(d.tag), '主題標籤不合 Threads 的規定：' + d.tag);
  const ai = pickId(schedule, 'ai-build');
  assert.ok(ai && ai.date === null && ai.tag === 'AI' && ai.video === 'social/trailer-vertical.mp4');
  const launch = pickId(schedule, 'launch-guihang');
  assert.ok(launch && launch.date === null && launch.video === 'social/trailer-vertical.mp4');
  assert.equal(pick(schedule, '2026-11-23').id, 'peril-1');
  assert.equal(lastDate(schedule), schedule.filter((d) => d.date).map((d) => d.date).sort().at(-1));
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

test('整段流程（假的 Threads）：試跑做到發布的前一步；真的發是兩步；已經有就跳過；權杖不會出現在錯誤訊息裡', async () => {
  const real = globalThis.fetch, calls = [];
  let posts = [], fail = false, boxStatus = 'FINISHED';
  globalThis.fetch = async (url, init) => {
    const u = new URL(String(url)), method = init?.method ?? 'GET', params = method === 'GET' ? u.searchParams : init.body;
    if (u.hostname.endsWith('workers.dev')) return new Response(method === 'HEAD' ? null : 'x', { status: 200, headers: { 'content-type': u.pathname.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' } });
    calls.push(method + ' ' + u.pathname);
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
    if (fail) return json({ error: { message: 'Invalid token ' + params.get('access_token') } }, 400);
    if (u.pathname.endsWith('/me')) return json({ id: '42', username: 'mistguild' });
    if (u.pathname.endsWith('/debug_token')) { assert.equal(params.get('input_token'), 'secret-token'); return json({ data: { type: 'USER', is_valid: true, issued_at: 1794567600, expires_at: 1799751600, scopes: ['threads_basic', 'threads_content_publish'] } }); }
    if (u.pathname.endsWith('/42/threads') && method === 'GET') return json({ data: posts });
    if (u.pathname.endsWith('/42/threads') && method === 'POST') {
      if (params.get('media_type') === 'VIDEO') {
        assert.match(params.get('video_url'), /\/social\/trailer-vertical\.mp4$/);
        if (params.get('text').startsWith('【霧脈公會：跟 AI')) assert.equal(params.get('topic_tag'), 'AI');
        else { assert.match(params.get('text'), /^【霧脈公會：歸航記】/); assert.equal(params.get('topic_tag'), null, '公告沒有標籤'); }
        return json({ id: 'box1' });
      }
      assert.equal(params.get('topic_tag'), null, '每日一案 02 沒有標籤');
      assert.equal(params.get('media_type'), 'IMAGE'); assert.match(params.get('image_url'), /\/social\/02\.jpg$/); return json({ id: 'box1' });
    }
    if (u.pathname.endsWith('/box1')) return json({ status: boxStatus, error_message: boxStatus === 'ERROR' ? 'FAILED_DOWNLOADING_IMAGE' : undefined });
    if (u.pathname.endsWith('/42/threads_publish')) { assert.equal(params.get('creation_id'), 'box1'); return json({ id: 'post1' }); }
    return json({ error: { message: 'unexpected ' + u.pathname } }, 404);
  };
  const env = { POST_DATE: '2026-11-14', THREADS_ACCESS_TOKEN: 'secret-token' }, said = [], quiet = (t) => said.push(t);
  const timers = globalThis.setTimeout; globalThis.setTimeout = (f) => timers(f, 0);   // 測試不用真的等十秒
  try {
    assert.equal(await main({ ...env, DRY_RUN: '1' }, quiet), 'dry');
    assert.deepEqual(calls.filter((c) => c.startsWith('POST')), ['POST /v1.0/42/threads'], '試跑只交出圖和文字，不發布');
    assert.ok(said.some((t) => t.includes('處理好了，只差發布')), '試跑要說 Threads 收下了');
    assert.ok(said.some((t) => /^權杖到 \d{4}-\d\d-\d\d 過期/.test(t)), '試跑要寫出權杖哪一天過期');
    assert.ok(!said.join('\n').includes('secret-token'), '紀錄裡不能有權杖');
    calls.length = 0;
    assert.equal(await main(env, quiet), 'posted');
    assert.deepEqual(calls.filter((c) => c.startsWith('POST')), ['POST /v1.0/42/threads', 'POST /v1.0/42/threads_publish']);
    boxStatus = 'ERROR';
    await assert.rejects(main({ ...env, DRY_RUN: '1' }, quiet), /沒有處理好這張圖/, 'Threads 收不下圖，試跑就要失敗');
    boxStatus = 'FINISHED';
    posts = [{ text: schedule[1].text }];
    assert.equal(await main(env, quiet), 'exists');
    // 公告：指定 id，發的是影片
    posts = []; calls.length = 0;
    assert.equal(await main({ THREADS_ACCESS_TOKEN: 'secret-token', POST_ID: 'launch-guihang' }, quiet), 'posted');
    assert.deepEqual(calls.filter((c) => c.startsWith('POST')), ['POST /v1.0/42/threads', 'POST /v1.0/42/threads_publish']);
    posts = [{ text: pickId(schedule, 'launch-guihang').text }];
    assert.equal(await main({ THREADS_ACCESS_TOKEN: 'secret-token', POST_ID: 'launch-guihang' }, quiet), 'exists', '公告發過就不再發');
    posts = [];
    assert.equal(await main({ THREADS_ACCESS_TOKEN: 'secret-token', POST_ID: 'ai-build' }, quiet), 'posted');
    assert.equal(await main({ THREADS_ACCESS_TOKEN: 'secret-token', POST_ID: 'nope' }, quiet), 'none');
    fail = true;
    await assert.rejects(main(env, quiet), (e) => !String(e.message).includes('secret-token') && String(e.message).includes('***'));
  } finally { globalThis.fetch = real; globalThis.setTimeout = timers; }
});
