// 考試倒數：照日期算，不管幾點；當天是 0；過了就不顯示
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAM, countdownText, daysLeft } from './exam.ts';

test('考試倒數：還有幾天', () => {
  assert.equal(EXAM.date, '2026-12-05');
  assert.equal(daysLeft(new Date(2026, 10, 13, 9, 0)), 22);        // 11 月 13 日早上
  assert.equal(daysLeft(new Date(2026, 10, 13, 23, 59)), 22);       // 同一天深夜，還是 22
  assert.equal(daysLeft(new Date(2026, 11, 4, 23, 59)), 1);
  assert.equal(daysLeft(new Date(2026, 11, 5, 0, 0)), 0); assert.equal(daysLeft(new Date(2026, 11, 5, 18, 0)), 0);
  assert.equal(daysLeft(new Date(2026, 11, 6, 0, 0)), null);
  assert.equal(daysLeft(new Date(2026, 0, 1)), 338);
  assert.equal(countdownText(22), '距離考試還有 22 天'); assert.equal(countdownText(0), '考試就是今天'); assert.equal(countdownText(null), null);
});
