import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN, SPARE, phaseSplit, timingNote } from './timing.ts';

test('建議的分配加起來是 15 分鐘', () => {
  assert.equal(PLAN.reduce((n, p) => n + p.sec, 0) + SPARE, 15 * 60);
});

test('每一段花多久：照進到下一段的時間切；沒記到時間的舊對局是 null', () => {
  assert.equal(phaseSplit({ phase: 4 }, 600), null);
  const s = phaseSplit({ phase: 4, phaseAt: [360, 600, 700] }, 880)!;
  assert.deepEqual(s.map((x) => [x.key, x.sec, x.reached]), [['ask', 360, true], ['exam', 240, true], ['dx', 100, true], ['plan', 180, true]]);
});

test('時間到還沒走到的段落：花 0 秒、標成沒走到，回饋會說', () => {
  const s = phaseSplit({ phase: 2, phaseAt: [700] }, 900)!;
  assert.deepEqual(s.map((x) => [x.sec, x.reached]), [[700, true], [200, true], [0, false], [0, false]]);
  const note = timingNote(s, true);
  assert.ok(note.includes('時間到的時候') && note.includes('下診斷、檢查、回報、說明'));
  assert.ok(note.includes('問診比建議多花了 6 分 40 秒'));
});

test('節奏都對的時候說一句好話；記到的時間不會倒退', () => {
  const s = phaseSplit({ phase: 4, phaseAt: [300, 540, 660] }, 840)!;
  assert.equal(timingNote(s, false), '每一段都在建議的時間附近，節奏是對的。');
  const weird = phaseSplit({ phase: 4, phaseAt: [500, 400, 450] }, 300)!;
  assert.ok(weird.every((x) => x.sec >= 0));
});
