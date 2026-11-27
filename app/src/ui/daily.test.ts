import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAILY } from '../data/daily.ts';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import { dailyCase, dailyDone } from './daily.ts';

const schedule = JSON.parse(readFileSync(new URL('../../../social/schedule.json', import.meta.url), 'utf8')) as { date?: string; id: string; complaint?: string }[];

test('今日之劫和 Threads 的排程一致：每一天同一位；發劫的介紹那天，是那一種主訴的第一位', () => {
  const dated = schedule.filter((x) => x.date);
  assert.equal(DAILY.length, dated.length, '排程改了要重新產生 data/daily.ts');
  for (const x of dated) {
    const id = DAILY.find(([d]) => d === x.date)?.[1];
    assert.ok(id, x.date + ' 不在 daily.ts');
    if (/^c\d{2}[a-z]$/.test(x.id)) assert.equal(id, x.id, x.date);
    else assert.equal(CASES.find((c) => c.id === id)!.complaint, COMPLAINTS.find((m) => m.name === x.complaint)!.id, x.date);
  }
});

test('排程以外的日子：同一天同一位、不抽終章；今天做過這一位才算完成', () => {
  const a = dailyCase('2030-01-01');
  assert.equal(a.id, dailyCase('2030-01-01').id); assert.notEqual(a.id, FINALE_ID);
  assert.equal(dailyCase('2026-11-28').id, 'c01b');
  const at = new Date('2026-11-28T09:00:00').getTime();
  assert.ok(dailyDone({ plays: [{ at, caseId: 'c01b', score: 70, trial: true, found: true, trapped: false, takeaway: null }] }, '2026-11-28'));
  assert.ok(!dailyDone({ plays: [{ at, caseId: 'c01c', score: 70, trial: true, found: true, trapped: false, takeaway: null }] }, '2026-11-28'));
});
