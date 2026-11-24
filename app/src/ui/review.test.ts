import test from 'node:test';
import assert from 'node:assert/strict';
import type { PlayRecord } from './store.ts';
import { REVIEW_GAPS, missed, reviewDue, reviewPlan } from './review.ts';

const at = (day: string, h = 12) => new Date(day + 'T' + String(h).padStart(2, '0') + ':00:00').getTime();
const play = (day: string, caseId: string, ok: boolean, more: Partial<PlayRecord> = {}): PlayRecord => ({ at: at(day), caseId, score: 70, trial: true, found: ok, trapped: false, takeaway: null, ...more });

test('算錯：診斷沒對，或掉進陷阱', () => {
  assert.equal(missed({ found: false, trapped: false }), true);
  assert.equal(missed({ found: true, trapped: true }), true);
  assert.equal(missed({ found: true, trapped: null }), false);
});

test('錯了之後 3 天到期；到期之前不出現', () => {
  const save = { plays: [play('2026-11-20', 'c01a', false)] };
  assert.deepEqual(REVIEW_GAPS, [3, 7]);
  assert.deepEqual(reviewPlan(save).map((r) => [r.caseId, r.round, r.due, r.trial]), [['c01a', 1, '2026-11-23', true]]);
  assert.equal(reviewDue(save, '2026-11-22').length, 0);
  assert.equal(reviewDue(save, '2026-11-23').length, 1);
  assert.equal(reviewDue(save, '2026-12-01').length, 1, '過期了還是在');
});

test('隔夠久再做對：進到第二次（再 7 天）；再對就畢業', () => {
  const plays = [play('2026-11-20', 'c01a', false), play('2026-11-24', 'c01a', true)];
  assert.deepEqual(reviewPlan({ plays }).map((r) => [r.round, r.due]), [[2, '2026-12-01']]);
  plays.push(play('2026-12-02', 'c01a', true));
  assert.deepEqual(reviewPlan({ plays }), []);
});

test('太早重做不算一次複習；複習時又錯，從頭算', () => {
  assert.deepEqual(reviewPlan({ plays: [play('2026-11-20', 'c01a', false), play('2026-11-20', 'c01a', true, { at: at('2026-11-20', 18) })] }).map((r) => [r.round, r.due]), [[1, '2026-11-23']]);
  const again = [play('2026-11-20', 'c01a', false), play('2026-11-24', 'c01a', true), play('2026-12-01', 'c01a', true, { trapped: true })];
  assert.deepEqual(reviewPlan({ plays: again }).map((r) => [r.round, r.due, r.why.trapped]), [[1, '2026-12-04', true]]);
});

test('從來沒錯過的不出現；照到期日排；委託錯的就用委託重接；不在意存檔裡的順序', () => {
  const plays = [play('2026-11-22', 'c02a', false, { trial: false }), play('2026-11-18', 'c01b', true), play('2026-11-19', 'c01c', false)];
  assert.deepEqual(reviewPlan({ plays }).map((r) => [r.caseId, r.due, r.trial]), [['c01c', '2026-11-22', true], ['c02a', '2026-11-25', false]]);
  assert.deepEqual(reviewPlan({}), []);
});
