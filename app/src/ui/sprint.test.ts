import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import type { PlayRecord, Save } from './store.ts';
import { RECENT, SPRINT_DAYS, pickSprint, sprintOf, weakness, whyWeak } from './sprint.ts';

const at = (day: string) => new Date(day + 'T12:00:00').getTime();
const play = (caseId: string, day: string, found: boolean, more: Partial<PlayRecord> = {}): PlayRecord => ({ at: at(day), caseId, score: found ? 80 : 40, trial: true, found, trapped: false, takeaway: null, ...more });
const first = (complaint: string) => CASES.find((c) => c.complaint === complaint && c.id !== FINALE_ID)!.id;
const base = (plays: PlayRecord[]): Pick<Save, 'plays' | 'cases' | 'trials'> => ({ plays, cases: {}, trials: [] });

test('最弱的主訴：沒練過的排最前面，再來是掌握度低的；十二種都在', () => {
  const ids = COMPLAINTS.map((m) => m.id);
  // 除了最後一種，每一種都練過一場、全對；第一種錯而且掉進陷阱
  const plays = ids.slice(0, -1).map((id, i) => play(first(id), '2026-11-20', i !== 0, i === 0 ? { trapped: true } : {}));
  const w = weakness({ plays });
  assert.equal(w.length, 12);
  assert.equal(w[0].complaint, ids[ids.length - 1]); assert.equal(w[0].mastery, null); assert.equal(whyWeak(w[0]), '還沒練過');
  assert.equal(w[1].complaint, ids[0]);
  assert.equal(whyWeak(w[1]), '診斷對 0／1・掉進陷阱 1 次・平均 40 分');
});

test('只看每一種最近幾場：以前錯、最近都對，就不算弱', () => {
  const id = first(COMPLAINTS[0].id);
  const old = Array.from({ length: 4 }, (_, i) => play(id, '2026-11-0' + (i + 1), false));
  const recent = Array.from({ length: RECENT }, (_, i) => play(id, '2026-11-1' + i, true));
  const w = weakness({ plays: [...old, ...recent] }).find((x) => x.complaint === COMPLAINTS[0].id)!;
  assert.deepEqual([w.n, w.found], [RECENT, RECENT]);
});

test('衝刺抽題：只從最弱的三種裡抽；同一種裡沒遇過的先；不抽終章那一位', () => {
  const ids = COMPLAINTS.map((m) => m.id);
  const plays = ids.map((id, i) => play(first(id), '2026-11-20', i >= 3));   // 前三種都錯
  const weak3 = weakness({ plays }).slice(0, 3).map((w) => w.complaint);
  assert.deepEqual([...weak3].sort(), ids.slice(0, 3).sort());
  const s = base(plays);
  const got = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const c = pickSprint(s, i / 300);
    assert.ok(weak3.includes(c.complaint)); assert.notEqual(c.id, FINALE_ID);
    assert.notEqual(c.id, first(c.complaint), '練過的那一位先不抽');
    got.add(c.complaint);
  }
  assert.equal(got.size, 3, '三種都抽得到');
});

test('衝刺期間：口試前兩週到前一天；當天和之後不顯示；每天有沒有考試弓', () => {
  assert.equal(sprintOf({ plays: [] }, new Date(2026, 10, 20, 9)), null, '前 15 天還沒開始');
  assert.equal(sprintOf({ plays: [] }, new Date(2026, 11, 5, 9)), null, '口試當天');
  assert.equal(sprintOf({ plays: [] }, new Date(2026, 11, 6, 9)), null, '口試過了');
  const s = sprintOf({ plays: [play('c01a', '2026-11-25', true), play('c01b', '2026-11-26', false), play('c01c', '2026-11-24', true, { trial: false })] }, new Date(2026, 10, 26, 9))!;
  assert.equal(s.daysLeft, 9);
  assert.equal(s.days.length, SPRINT_DAYS + 1);
  assert.equal(s.days[0].day, '2026-11-21'); assert.equal(s.days.at(-1)!.state, 'exam');
  assert.deepEqual([s.trialToday, s.trialDays], [true, 2], '委託不算試弓');
  assert.equal(s.days.find((d) => d.day === '2026-11-26')!.state, 'today');
  assert.equal(s.days.find((d) => d.day === '2026-11-27')!.state, 'later');
});

test('以前結案過、最近沒練的：排在完全沒碰過的後面、練過的前面', () => {
  const ids = COMPLAINTS.map((m) => m.id);
  const rec = { best: 90, safety: 'met' as const, plays: 1, seconds: 600, found: true, concern: true, reads: [] };
  const plays = ids.slice(2).map((id) => play(first(id), '2026-11-20', false));   // 第三種以後都練過（全錯）
  const w = weakness({ plays, cases: { [first(ids[1])]: rec } });
  assert.deepEqual(w.slice(0, 3).map((x) => x.complaint), [ids[0], ids[1], ids[2]]);
  assert.equal(whyWeak(w[1]), '最近沒練過（之前結案 1 位）');
});
