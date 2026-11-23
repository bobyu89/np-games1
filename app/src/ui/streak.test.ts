import test from 'node:test';
import assert from 'node:assert/strict';
import { addDay, dayKey, isDay, monthGrid, shift, streakOf, DAYS_KEPT } from './streak.ts';

test('日期：當地日期、前後幾天、跨月跨年', () => {
  assert.equal(dayKey(new Date(2026, 10, 23, 23, 59).getTime()), '2026-11-23');
  assert.equal(shift('2026-11-30', 1), '2026-12-01');
  assert.equal(shift('2027-01-01', -1), '2026-12-31');
  assert.ok(isDay('2026-02-28') && !isDay('2026-13-01') && !isDay('x') && !isDay(20261123));
});

test('連續天數：每天都有就一直加；今天還沒來，昨天的照算', () => {
  const days = ['2026-11-20', '2026-11-21', '2026-11-22'];
  assert.deepEqual(streakOf(days, '2026-11-22'), { count: 3, today: true, restUsed: false, best: 3, total: 3 });
  const s = streakOf(days, '2026-11-23');
  assert.equal(s.count, 3); assert.equal(s.today, false);
  assert.equal(streakOf([], '2026-11-23').count, 0);
});

test('每個月可以休息一天：缺一天接得起來、不算天數；同一個月缺第二天就斷', () => {
  const one = ['2026-11-18', '2026-11-19', '2026-11-21', '2026-11-22'];
  const s = streakOf(one, '2026-11-22');
  assert.equal(s.count, 4); assert.equal(s.restUsed, true);
  const two = ['2026-11-15', '2026-11-17', '2026-11-18', '2026-11-20', '2026-11-21'];
  assert.equal(streakOf(two, '2026-11-21').count, 4, '21、20 號，19 號休息，18、17 號接上；16 號再缺就斷，15 號不算');
  assert.equal(streakOf(['2026-11-18', '2026-11-21'], '2026-11-21').count, 1, '連缺兩天就斷');
  // 跨月：十月底休息一天、十一月再休息一天，兩個月各一次，接得起來
  const cross = ['2026-10-29', '2026-10-31', '2026-11-01', '2026-11-03'];
  assert.equal(streakOf(cross, '2026-11-03').count, 4);
});

test('昨天沒來、今天還沒來：用這個月的休息日接著，今天來練就不會斷；再過一天沒來就斷', () => {
  const days = ['2026-11-19', '2026-11-20', '2026-11-21'];
  assert.equal(streakOf(days, '2026-11-23').count, 3);
  assert.equal(streakOf(days, '2026-11-24').count, 0);
  assert.equal(streakOf([...days, '2026-11-23'], '2026-11-23').count, 4);
});

test('最長的一段：斷了之後還記得', () => {
  const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-20', '2026-11-21'];
  const s = streakOf(days, '2026-11-21');
  assert.equal(s.count, 2); assert.equal(s.best, 5); assert.equal(s.total, 7);
});

test('存的天數：不重複、排好、壞掉的丟掉、最多兩年左右', () => {
  assert.deepEqual(addDay(['2026-11-02', 'junk', '2026-11-01'], '2026-11-02'), ['2026-11-01', '2026-11-02']);
  let many: string[] = [];
  for (let i = 0; i < DAYS_KEPT + 50; i++) many.push(shift('2024-01-01', i));
  many = addDay(many, '2030-01-01');
  assert.equal(many.length, DAYS_KEPT); assert.equal(many.at(-1), '2030-01-01');
});

test('日曆：星期日開頭，前面補空格', () => {
  const g = monthGrid(['2026-11-03'], '2026-11');   // 2026-11-01 是星期日
  assert.equal(g[0]?.n, 1); assert.equal(g.length, 30);
  assert.equal(g.find((c) => c?.day === '2026-11-03')?.done, true);
  const dec = monthGrid([], '2026-12');             // 2026-12-01 是星期二
  assert.deepEqual(dec.slice(0, 3), [null, null, { day: '2026-12-01', n: 1, done: false }]);
});
