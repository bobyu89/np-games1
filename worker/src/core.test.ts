import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { CAP, SCHEMA, add, csv, dayOf, parse, summary, type Exec, type Value } from './core.ts';

const NOW = Date.UTC(2026, 10, 12, 4, 0, 0) / 1000;   // 台北時間 2026-11-12 中午
function fresh(): Exec {
  const db = new DatabaseSync(':memory:');
  const exec: Exec = (sql, ...p) => db.prepare(sql).all(...p) as Record<string, Value>[];
  SCHEMA.forEach((s) => exec(s));
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
  assert.deepEqual(all.totals, { devices: 3, finishers: 1, returning: 1, installed: 1, opens: 4, starts: 4, dones: 3, leaves: 1, drops: 1 });
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
