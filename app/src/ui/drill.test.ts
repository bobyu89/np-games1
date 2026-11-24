import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/index.ts';
import type { Save } from './store.ts';
import { DRILLS, buildDrill, drillCases, factsOf, readOk } from './drill.ts';

const blank = (): Pick<Save, 'cases' | 'trials' | 'plays'> => ({ cases: {}, trials: [], plays: [] });
const rec = { best: 80, safety: 'met' as const, plays: 1, seconds: 600, found: true, concern: true, reads: [] };

test('只從看過的病人出題：沒看過就沒有題目', () => {
  assert.equal(drillCases(blank()).length, 0);
  for (const d of DRILLS) assert.deepEqual(buildDrill(d.kind, blank(), 1), []);
  const s = { ...blank(), cases: { c01a: rec }, trials: [{ at: 1, caseId: 'c03b', score: 50, safety: 'met' as const, seconds: 900, timeUp: true, found: false }] };
  assert.deepEqual(drillCases(s).map((c) => c.id).sort(), ['c01a', 'c03b']);
  for (const d of DRILLS) for (const it of buildDrill(d.kind, s, 7)) assert.ok(['c01a', 'c03b'].includes(it.c.id));
});

test('線索解讀：題數照設定、同一個種子同一組題目；還沒解讀對過的先出', () => {
  const ids = CASES.slice(0, 12).map((c) => c.id), s = { ...blank(), cases: Object.fromEntries(ids.map((id) => [id, rec])) };
  const a = buildDrill('read', s, 42), b = buildDrill('read', s, 42);
  assert.equal(a.length, 6);
  assert.deepEqual(a.map((x) => x.kind === 'read' && x.clue.id + x.c.id), b.map((x) => x.kind === 'read' && x.clue.id + x.c.id));
  for (const x of a) assert.ok(x.kind === 'read' && x.clue.tell && x.fresh);
  const perCase = new Map<string, number>(); a.forEach((x) => perCase.set(x.c.id, (perCase.get(x.c.id) ?? 0) + 1));
  assert.ok([...perCase.values()].every((n) => n <= 2), '同一位病人一輪最多兩題');
  // 只看過一位：線索不夠分散，就照樣出滿（同一位可以超過兩題）
  assert.equal(buildDrill('read', { ...blank(), cases: { c01a: rec } }, 3).length, 6);
});

test('線索解讀的對錯：主要的解讀和 alsoOk 都算，方向錯不算', () => {
  for (const c of CASES) for (const k of c.clues.filter((x) => x.tell)) {
    assert.ok(readOk(k, k.tell!), c.id + ' ' + k.id);
    assert.ok(!readOk(k, { form: k.tell!.form, dir: k.tell!.dir === 1 ? -1 : 1 }) || (k.alsoOk ?? []).some((t) => t.form === k.tell!.form), c.id + ' ' + k.id);
    for (const t of k.alsoOk ?? []) assert.ok(readOk(k, t));
  }
});

test('問題摘要和回報：每一題都有最好的那一句；給的資料不空、不超過上限', () => {
  const s = { ...blank(), cases: Object.fromEntries(CASES.map((c) => [c.id, rec])) };
  for (const kind of ['summary', 'sbar'] as const) {
    const items = buildDrill(kind, s, 5);
    assert.equal(items.length, 4);
    for (const it of items) {
      assert.ok(it.kind === kind && it.best.length >= 1 && it.best.every((id) => it.options.some((o) => o.id === id)));
    }
  }
  for (const c of CASES) { const f = factsOf(c); assert.ok(f.pos.length >= 1 && f.pos.length <= 8 && f.neg.length <= 4, c.id); }
});
