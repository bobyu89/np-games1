import test from 'node:test';
import assert from 'node:assert/strict';
import { caseById } from '../data/index.ts';
import { idealActions, run } from '../core/autoplay.ts';
import { scoreSession } from '../core/scoring.ts';
import { record, recordTrial } from './progress.ts';
import { dayTitle, diaryOf, linesOf, withNote } from './diary.ts';
import type { Save } from './store.ts';

const blank = (): Save => ({ v: 3, beats: [], cases: {}, takeaways: [], hero: 'cheng', trials: [] });
const at = (d: number, h = 9) => new Date(2026, 10, d, h, 0).getTime();

test('日期的寫法', () => {
  assert.equal(dayTitle('2026-11-23'), '11 月 23 日（一）');
  assert.equal(dayTitle('2027-01-01'), '1 月 1 日（五）');
});

test('一天一頁：委託、試弓、陷阱和帶回去的話都寫進去；新的在前面；今天一定有一頁', () => {
  const c = caseById('c01a'), good = run(c, idealActions(c)), bad = run(c, []);
  let s = record(blank(), c, good, scoreSession(c, good), 600, '下次先量生命徵象', at(22));
  s = record(s, c, bad, scoreSession(c, bad), 60, null, at(23, 8));
  s = recordTrial(s, c, good, scoreSession(c, good), 800, false, at(23, 20));
  const pages = diaryOf(s, at(24));
  assert.deepEqual(pages.map((p) => p.day), ['2026-11-24', '2026-11-23', '2026-11-22']);
  assert.match(pages[0].lines[0], /還沒有結案/);
  const d23 = pages[1].lines.join('');
  assert.match(d23, /結案了 1 張委託：.+（胸痛）\d+ 分，診斷還沒對/);
  assert.match(d23, /考了 1 次試弓：.+（胸痛）\d+ 分，及格/);
  assert.match(d23, /被困住的：獨眼巨人之劫（過早結束）/);
  assert.doesNotMatch(d23, /過了：獨眼巨人之劫/, '同一天又困住又過了，只寫困住');
  assert.match(pages[2].lines.join(''), /過了：獨眼巨人之劫。.*帶回公會的話：「下次先量生命徵象」/);
  assert.equal(pages[1].plays[0].trial, false, '早的在前面');
});

test('自己寫的一句：存起來、去掉頭尾空白、最多 500 字；寫空的就不顯示', () => {
  let s = withNote(blank(), '2026-11-20', '  胸痛要先想到 ACS  ', 1);
  let p = diaryOf(s, at(24)).find((x) => x.day === '2026-11-20')!;
  assert.equal(p.note, '胸痛要先想到 ACS');
  assert.match(p.lines[0], /還沒有結案/);
  s = withNote(s, '2026-11-20', '', 2);
  assert.equal(diaryOf(s, at(24)).some((x) => x.day === '2026-11-20'), false, '刪掉了，那一天也沒有其他紀錄就不列');
  s = withNote(s, '2026-11-21', 'x'.repeat(600), 3);
  assert.equal(s.notes?.['2026-11-21'].text.length, 500);
});

test('只有打卡、細節已經不在的日子：照實說', () => {
  assert.match(linesOf([], true)[0], /有打卡/);
});
