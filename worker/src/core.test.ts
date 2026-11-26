import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { CAP, EXTRA_COLUMNS, REPORT_CAP, SCHEMA, add, migrate, addReport, csv, dayOf, listReports, parse, parseReport, summary, type Exec, type Value } from './core.ts';

const NOW = Date.UTC(2026, 10, 12, 4, 0, 0) / 1000;   // 台北時間 2026-11-12 中午
function fresh(): Exec {
  const db = new DatabaseSync(':memory:');
  const exec: Exec = (sql, ...p) => db.prepare(sql).all(...p) as Record<string, Value>[];
  migrate(exec);
  return exec;
}
const dev = (n: number) => n.toString(16).padStart(16, '0');
const pack = (d: number, e: object[], more: object = {}) => ({ v: 1, d: dev(d), b: '2026-11-12.abc1234', pf: 'ios', pwa: 0, e, ...more });
const send = (exec: Exec, body: object, now = NOW) => add(exec, parse(body, now) ?? [], now);

test('日期照台北時間切', () => {
  assert.equal(dayOf(Date.UTC(2026, 10, 12, 15, 59) / 1000), '2026-11-12');
  assert.equal(dayOf(Date.UTC(2026, 10, 12, 16, 0) / 1000), '2026-11-13');
});

test('不像話的整包不收；個別不對的事件略過', () => {
  for (const junk of [null, 'x', {}, { v: 2, d: dev(1), e: [] }, { v: 1, d: 'not-hex', e: [] }, { v: 1, d: dev(1) }]) assert.equal(parse(junk, NOW), null);
  const rows = parse(pack(1, [{ t: 'open', at: NOW }, { t: 'hack', at: NOW }, { t: 'start', at: NOW }, { t: 'start', c: '../etc', at: NOW }, { t: 'done', c: 'c01a', at: NOW, sc: 250, sf: 'great', sec: -5, f: 1, n: 1 }, 7 as never]), NOW)!;
  assert.deepEqual(rows.map((r) => r.type + ':' + r.case_id), ['open:', 'done:c01a']);
  assert.deepEqual([rows[1].score, rows[1].safety, rows[1].secs, rows[1].found, rows[1].plays], [null, null, null, 1, 1]);
});

test('多出來的欄位不會被存：只留認得的那幾個', () => {
  const exec = fresh();
  send(exec, pack(1, [{ t: 'done', c: 'c01a', at: NOW, sc: 80, name: '王小明', note: '<script>', ip: '1.2.3.4' }], { email: 'a@b.c', ua: 'Mozilla' }));
  const text = csv(exec, null, NOW);
  for (const leak of ['王小明', 'script', '1.2.3.4', 'a@b.c', 'Mozilla']) assert.ok(!text.includes(leak), leak);
  assert.equal(text.trim().split('\n').length, 2);
});

test('版本和平台亂填會被換掉；時間差太多用收到的時間', () => {
  const [r] = parse(pack(1, [{ t: 'open', at: NOW - 400 * 86400 }], { b: 'x'.repeat(99), pf: 'toaster', pwa: 'yes' }), NOW)!;
  assert.deepEqual([r.build, r.pf, r.pwa, r.at], ['unknown', 'other', 0, NOW]);
  const [late] = parse(pack(1, [{ t: 'open', at: NOW - 3 * 86400 }]), NOW)!;
  assert.equal(late.day, '2026-11-09', '離線三天後才送出來的，算在發生的那一天');
});

test('同一件事重送不會算兩次', () => {
  const exec = fresh(), body = pack(1, [{ t: 'start', c: 'c01a', at: NOW, n: 1 }, { t: 'done', c: 'c01a', at: NOW + 600, sc: 90, sf: 'met', n: 1 }]);
  assert.equal(send(exec, body), 2);
  assert.equal(send(exec, body), 0);
  assert.equal(summary(exec, null, NOW).totals.dones, 1);
});

test('一個裝置一天收到上限就不收了，別的裝置不受影響', () => {
  const exec = fresh();
  let saved = 0;
  for (let i = 0; i < 10; i++) saved += send(exec, pack(1, Array.from({ length: 50 }, (_, k) => ({ t: 'start', c: 'c01a', at: NOW - i * 100 - k }))));
  assert.equal(saved, CAP.perDevice);
  assert.equal(send(exec, pack(2, [{ t: 'open', at: NOW }])), 1);
});

test('總表：人數、每一關、卡在哪一段、玩得多深', () => {
  const exec = fresh(), D = 86400;
  // 裝置 1：昨天和今天都來，結案兩張，其中一張玩了兩次；從主畫面開
  send(exec, pack(1, [{ t: 'open', at: NOW - D }, { t: 'start', c: 'c01a', at: NOW - D + 10, n: 1 }, { t: 'done', c: 'c01a', at: NOW - D + 700, sc: 60, sf: 'late', sec: 690, f: 0, h: 2, n: 1 }], { pwa: 1 }));
  send(exec, pack(1, [{ t: 'open', at: NOW }, { t: 'start', c: 'c01a', at: NOW + 10, n: 2 }, { t: 'done', c: 'c01a', at: NOW + 500, sc: 90, sf: 'met', sec: 490, f: 1, h: 0, n: 2 }, { t: 'start', c: 'c01b', at: NOW + 600, n: 1 }, { t: 'done', c: 'c01b', at: NOW + 1300, sc: 80, sf: 'met', sec: 700, f: 1, h: 1, n: 1 }], { pwa: 1 }));
  // 裝置 2：今天來，接了一張，做到評估就回公會，後來放掉
  send(exec, pack(2, [{ t: 'open', at: NOW }, { t: 'start', c: 'c01a', at: NOW + 5, n: 1 }, { t: 'leave', c: 'c01a', at: NOW + 200, ph: 2 }, { t: 'drop', c: 'c01a', at: NOW + 300, ph: 2 }], { pf: 'android' }));
  // 裝置 3：四十天前來過一次
  send(exec, pack(3, [{ t: 'open', at: NOW - 40 * D }], { pf: 'desktop', b: '2026-10-01.old0000' }));

  const all = summary(exec, null, NOW);
  assert.deepEqual(all.totals, { devices: 3, finishers: 1, returning: 1, installed: 1, opens: 4, starts: 4, dones: 3, leaves: 1, drops: 1, trials: 0, trialPass: 0 });
  const a = all.cases.find((c) => c.case_id === 'c01a')!;
  assert.deepEqual([a.starts, a.dones, a.starters, a.finishers, a.firstScore, a.score, a.met, a.late, a.review, a.found, a.secs, a.hints], [3, 2, 2, 1, 60, 75, 1, 1, 0, 1, 590, 1]);
  assert.deepEqual(a.stuck, [0, 2, 0, 0]);
  assert.deepEqual(all.depth.map((d) => d.devices), [2, 1, 0, 0, 0, 0]);
  assert.deepEqual(all.platforms, [{ pf: 'android', devices: 1 }, { pf: 'desktop', devices: 1 }, { pf: 'ios', devices: 1 }]);
  assert.equal(all.days[0].day, '2026-11-12');
  assert.deepEqual([all.days[0].devices, all.days[0].starts, all.days[0].dones], [2, 3, 2]);

  const week = summary(exec, 7, NOW);
  assert.equal(week.since, '2026-11-06');
  assert.equal(week.totals.devices, 2, '四十天前的那一台不算在最近七天');
  assert.equal(summary(exec, 1, NOW).totals.dones, 2, '只看今天');
  assert.equal(csv(exec, 7, NOW).trim().split('\n').length, 1 + 12);
});

test('試弓另外算：不混進每一關的表，也不算「結案」', () => {
  const exec = fresh();
  send(exec, pack(1, [{ t: 'start', c: 'c01a', at: NOW }, { t: 'done', c: 'c01a', at: NOW + 600, sc: 80, sf: 'met', sec: 600, n: 1, f: 1 }, { t: 'trial', c: 'c07b', at: NOW + 900, sc: 72, sf: 'met', sec: 850, f: 1 }]));
  send(exec, pack(2, [{ t: 'trial', c: 'c01a', at: NOW + 50, sc: 41, sf: 'review', sec: 900, f: 0 }]));
  const s = summary(exec, null, NOW + 1000);
  assert.equal(s.totals.trials, 2);
  assert.equal(s.totals.trialPass, 1);
  assert.equal(s.totals.dones, 1);
  assert.equal(s.totals.finishers, 1, '只考試煉、沒有結案過委託的裝置不算');
  assert.deepEqual(s.cases.map((c) => c.case_id), ['c01a'], '只被試煉抽到的 c07b 不會出現在每一關的表裡');
  assert.equal(s.cases[0].score, 80, '試煉的分數沒有混進委託的平均');
});

test('玩家的回報：只留認得的欄位、有長度和每天的上限、新的在前面', () => {
  const exec = fresh();
  for (const junk of [null, {}, { v: 1, kind: 'content' }, { v: 1, kind: 'nope', text: '有問題' }, { v: 2, kind: 'content', text: '有問題' }, { v: 1, kind: 'content', text: ' ' }, { v: 1, kind: 'content', text: 'x'.repeat(REPORT_CAP.text + 1) }]) assert.equal(parseReport(junk, NOW), null);
  const r = parseReport({ v: 1, kind: 'content', text: '  林秋的心電圖\u0007寫反了\n第二行  ', c: 'c01a', place: 'debrief', b: '2026-11-13.abc1234', pf: 'ios', name: '某某', email: 'a@b.c', device: 'abc' }, NOW)!;
  assert.deepEqual(r, { at: NOW, day: dayOf(NOW), build: '2026-11-13.abc1234', pf: 'ios', kind: 'content', place: 'debrief', case_id: 'c01a', text: '林秋的心電圖寫反了\n第二行' });
  assert.equal(parseReport({ v: 1, kind: 'idea', text: '想要夜間模式', c: '../x', place: 'nowhere', b: '<script>', pf: 'toaster' }, NOW)!.case_id, '');
  assert.equal(addReport(exec, r), true);
  assert.equal(addReport(exec, { ...parseReport({ v: 1, kind: 'idea', text: '想要夜間模式' }, NOW + 60)! }), true);
  const list = listReports(exec, null, NOW + 100);
  assert.deepEqual(list.map((x) => x.text), ['想要夜間模式', '林秋的心電圖寫反了\n第二行']);
  assert.deepEqual(Object.keys(list[0]).sort(), ['at', 'build', 'case_id', 'day', 'kind', 'pf', 'place', 'text']);
  for (let i = 0; i < REPORT_CAP.perDay; i++) addReport(exec, { ...r, text: '灌水 ' + i });
  assert.equal(addReport(exec, r), false, '今天滿了');
  assert.equal(addReport(exec, { ...r, at: NOW + 86_400, day: dayOf(NOW + 86_400) }), true, '隔天又可以');
});

test('舊的資料庫：開起來補上新欄位，舊的事件留著、新欄位是空的；再開一次也不會壞', () => {
  const db = new DatabaseSync(':memory:');
  const exec: Exec = (sql, ...p) => db.prepare(sql).all(...p) as Record<string, Value>[];
  SCHEMA.forEach((s) => exec(s));
  exec("INSERT INTO events (at, day, device, build, pf, pwa, type, case_id, score, found) VALUES (?, ?, ?, 'old', 'ios', 0, 'done', 'c01a', 70, 1)", NOW, dayOf(NOW), dev(9));
  migrate(exec); migrate(exec);
  const cols = exec("SELECT name FROM pragma_table_info('events')").map((r) => String(r.name));
  for (const [name] of EXTRA_COLUMNS) assert.ok(cols.includes(name), name);
  const s = summary(exec, null, NOW);
  assert.equal(s.totals.dones, 1);
  assert.deepEqual([s.learning.first.n, s.learning.retry.n, s.learning.recall.n], [0, 0, 0], '舊版的事件不算進練習的指標');
});

test('練習的指標：錯題複習 vs 一般、自己先寫有沒有想到、刻意練習；只收 0 和 1，不收字', () => {
  const exec = fresh();
  send(exec, pack(1, [
    { t: 'done', c: 'c01a', at: NOW, sc: 60, f: 0, n: 1, tr: 1, rv: 0, w: 0 },
    { t: 'trial', c: 'c02a', at: NOW + 1, sc: 70, f: 1, tr: 0, rv: 0, w: 1 },
    { t: 'trial', c: 'c01a', at: NOW + 2, sc: 85, f: 1, tr: 0, rv: 1 },
    { t: 'done', c: 'c03a', at: NOW + 3, sc: 80, f: 1, tr: 'yes', rv: 2, w: '主動脈剝離' },
    { t: 'drill', dk: 'read', ok: 4, of: 6, at: NOW + 4 },
    { t: 'drill', dk: 'read', ok: 9, of: 6, at: NOW + 5 },
    { t: 'drill', dk: 'summary', ok: 3, of: 4, at: NOW + 6, c: 'c01a' },
    { t: 'drill', dk: 'hack', ok: 1, of: 1, at: NOW + 7 },
    { t: 'start', c: 'c04a', at: NOW + 8, tr: 1, rv: 1, w: 1 },
  ]));
  const l = summary(exec, null, NOW).learning;
  assert.deepEqual(l.first, { n: 2, found: 1, trapped: 1 });
  assert.deepEqual(l.retry, { n: 1, found: 1, trapped: 0 });
  assert.deepEqual(l.recall, { n: 2, hit: 1, devices: 1 });
  assert.deepEqual(l.drills, [{ kind: 'read', rounds: 2, devices: 1, ok: 4, total: 12 }, { kind: 'summary', rounds: 1, devices: 1, ok: 3, total: 4 }]);
  const text = csv(exec, null, NOW);
  assert.ok(!text.includes('主動脈'));
  assert.ok(text.split('\n')[0].endsWith('trapped,review,recall,drill,ok,total'));
  const start = exec("SELECT trapped, review, recall, drill FROM events WHERE type = 'start'")[0];
  assert.deepEqual([start.trapped, start.review, start.recall, start.drill], [null, null, null, null], '只有結案和試弓收這幾欄');
  assert.equal(exec("SELECT case_id FROM events WHERE type = 'drill' AND drill = 'summary'")[0].case_id, '', '刻意練習不記哪一位病人');
});

test('照週分開：星期一開頭，跨週的分到兩週；每天多試弓和刻意練習的次數', () => {
  const exec = fresh();
  const wed = Date.UTC(2026, 10, 25, 4) / 1000, mon = Date.UTC(2026, 10, 23, 4) / 1000, sun = Date.UTC(2026, 10, 22, 4) / 1000;
  send(exec, pack(1, [
    { t: 'done', c: 'c01a', at: wed, f: 1, rv: 0, w: 1 }, { t: 'trial', c: 'c01b', at: mon, f: 0, rv: 1 },
    { t: 'done', c: 'c01c', at: sun, f: 1, rv: 0 }, { t: 'drill', dk: 'read', ok: 5, of: 6, at: wed + 1 },
  ]), wed + 60);
  const s = summary(exec, null, wed + 60);
  assert.deepEqual(s.weeks.map((w) => w.week), ['2026-11-16', '2026-11-23']);
  assert.deepEqual(s.weeks[1], { week: '2026-11-23', first: { n: 1, found: 1 }, retry: { n: 1, found: 0 }, recall: { n: 1, hit: 1 }, drill: { ok: 5, total: 6 } });
  assert.deepEqual(s.weeks[0].first, { n: 1, found: 1 });
  const d = s.days.find((x) => x.day === '2026-11-25')!;
  assert.deepEqual([d.dones, d.trials, d.drills], [1, 0, 1]);
});
