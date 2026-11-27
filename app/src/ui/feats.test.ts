import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import type { PlayRecord, Save } from './store.ts';
import { BADGES, badgesOf, gained, starsAll, starsOf } from './feats.ts';

const blank = (): Save => ({ v: 3, beats: [], cases: {}, takeaways: [], hero: null, trials: [], plays: [], days: [] });
const at = (day: string, h = 12) => new Date(day + 'T' + String(h).padStart(2, '0') + ':00:00').getTime();
const play = (caseId: string, day: string, found: boolean, more: Partial<PlayRecord> = {}): PlayRecord => ({ at: at(day), caseId, score: found ? 85 : 40, trial: false, found, trapped: false, takeaway: null, ...more });
const chest = CASES.filter((c) => c.complaint === 'chest-pain' && c.id !== FINALE_ID).map((c) => c.id);

test('熟練星：沒碰過 0、練過 1、3 場掌握度 0.6 以上 2、5 場 0.8 以上 3', () => {
  const w = (n: number, mastery: number | null, before = 0) => ({ complaint: 'x', name: 'x', n, found: 0, trapped: 0, score: null, mastery, before });
  assert.equal(starsOf(w(0, null)), 0); assert.equal(starsOf(w(0, null, 2)), 1);
  assert.equal(starsOf(w(2, 0.95)), 1); assert.equal(starsOf(w(3, 0.6)), 2); assert.equal(starsOf(w(4, 0.95)), 2);
  assert.equal(starsOf(w(5, 0.8)), 3); assert.equal(starsOf(w(5, 0.79)), 2);
});

test('升星和新勳章：這一場之前和之後比', () => {
  const before = { ...blank(), plays: [1, 2, 3, 4].map((d) => play(chest[d % 4], '2026-11-1' + d, true)) };
  const after = { ...before, plays: [play(chest[0], '2026-11-20', true), ...before.plays] };
  assert.equal(starsAll(before).find((x) => x.complaint === 'chest-pain')!.stars, 2);
  const g = gained(before, after);
  assert.deepEqual(g.stars.map((x) => [x.complaint, x.from, x.stars]), [['chest-pain', 2, 3]]);
  assert.ok(g.badges.some((b) => b.id === 'master'));
  assert.ok(badgesOf(before).some((b) => b.id === 'no-trap-3'), '連續三場沒掉陷阱');
});

test('勳章：每一個都有名字和怎麼拿；空的存檔一個都沒有', () => {
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length);
  for (const b of BADGES) assert.ok(b.name && b.how.endsWith('。'));
  assert.deepEqual(badgesOf(blank()), []);
});

test('勳章的條件：四燈全排、錯題畢業、試弓、十二島', () => {
  const c = CASES.find((x) => x.id === chest[0])!;
  const reads = c.forms.map((f) => ({ clue: 'c-' + f.id, text: '', form: f.id, dir: 1 as const }));
  const s = { ...blank(), cases: { [c.id]: { best: 80, safety: 'met' as const, plays: 1, seconds: 600, found: true, concern: true, reads } } };
  assert.ok(badgesOf(s).some((b) => b.id === 'four-lamps'));
  const grad = { ...blank(), plays: [play(chest[1], '2026-11-01', false), play(chest[1], '2026-11-04', true), play(chest[1], '2026-11-11', true)] };
  assert.ok(badgesOf(grad).some((b) => b.id === 'graduate'));
  assert.ok(!badgesOf({ ...grad, plays: grad.plays.slice(0, 2) }).some((b) => b.id === 'graduate'), '只做對一次還沒畢業');
  const t = { ...blank(), trials: [{ at: 1, caseId: chest[0], score: 82, safety: 'met' as const, seconds: 800, timeUp: false, found: true }] };
  assert.deepEqual(badgesOf(t).map((b) => b.id).filter((id) => ['first-pass', 'calm-80'].includes(id)).sort(), ['calm-80', 'first-pass']);
  const all = { ...blank(), plays: COMPLAINTS.map((m) => play(CASES.find((x) => x.complaint === m.id)!.id, '2026-11-20', true)) };
  assert.ok(badgesOf(all).some((b) => b.id === 'twelve'));
});
