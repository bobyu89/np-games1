// 選項的外形不能洩題：對的那一句不能總是最長、最完整的那一句；顯示的順序也不能總是對的在前面
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from './index.ts';
import { shuffled } from '../core/order.ts';

const len = (t: string) => [...t].length;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** 單選題：對的那一句，至少要有一個錯的跟它差不多長；每一個錯的都不能短得太明顯 */
function single(id: string, what: string, right: string, wrongs: string[], out: string[]) {
  const r = len(right), w = wrongs.map(len);
  if (Math.max(...w) < 0.9 * r) out.push(`${id} ${what}：對的 ${r} 字，最長的錯的只有 ${Math.max(...w)} 字`);
  for (const [i, n] of w.entries()) if (n < 0.65 * r) out.push(`${id} ${what}：錯的「${wrongs[i].slice(0, 12)}…」只有 ${n} 字（對的 ${r} 字）`);
}

test('一句話摘要和回報的判斷：對的那一句不會一眼就看得出來', () => {
  const out: string[] = [];
  let longestSum = 0, longestAsm = 0;
  for (const c of CASES) {
    const best = c.summaries.find((k) => k.score === Math.max(...c.summaries.map((x) => x.score)))!;
    single(c.id, '摘要', best.text, c.summaries.filter((k) => k !== best).map((k) => k.text), out);
    if (c.summaries.every((k) => k === best || len(k.text) < len(best.text))) longestSum++;
    const top = c.sbar.assessments.find((k) => k.score === Math.max(...c.sbar.assessments.map((x) => x.score)))!;
    single(c.id, '回報的判斷', top.text, c.sbar.assessments.filter((k) => k !== top).map((k) => k.text), out);
    if (c.sbar.assessments.every((k) => k === top || len(k.text) < len(top.text))) longestAsm++;
  }
  // 挑最長的那一句，不能比亂猜好太多（四選一亂猜是四分之一）
  if (longestSum > CASES.length * 0.45) out.push(`摘要：${longestSum}／${CASES.length} 張，對的剛好是最長的`);
  if (longestAsm > CASES.length * 0.55) out.push(`回報的判斷：${longestAsm}／${CASES.length} 張，對的剛好是最長的`);
  assert.deepEqual(out, []);
});

test('向病人說明和回報的請求：錯的句子跟對的差不多長', () => {
  const out: string[] = [];
  for (const c of CASES) {
    const ok = c.explain.filter((e) => e.ok).map((e) => len(e.text)), bad = c.explain.filter((e) => !e.ok).map((e) => len(e.text));
    if (avg(bad) < 0.8 * avg(ok)) out.push(`${c.id} 說明：對的平均 ${avg(ok).toFixed(0)} 字，錯的平均 ${avg(bad).toFixed(0)} 字`);
    const rok = c.sbar.requests.filter((e) => e.ok).map((e) => len(e.text)), rbad = c.sbar.requests.filter((e) => !e.ok).map((e) => len(e.text));
    if (rbad.length && avg(rbad) < 0.8 * avg(rok)) out.push(`${c.id} 請求：對的平均 ${avg(rok).toFixed(0)} 字，錯的平均 ${avg(rbad).toFixed(0)} 字`);
  }
  assert.deepEqual(out, []);
});

test('選項顯示的順序：同一張委託固定，對的那一句不會總是在第一個', () => {
  let first = 0;
  for (const c of CASES) {
    const a = shuffled(c.id, c.summaries).map((k) => k.id), b = shuffled(c.id, c.summaries).map((k) => k.id);
    assert.deepEqual(a, b);
    assert.deepEqual([...a].sort(), c.summaries.map((k) => k.id).sort());
    const best = c.summaries.reduce((x, y) => (y.score > x.score ? y : x));
    if (a[0] === best.id) first++;
  }
  assert.ok(first < CASES.length * 0.45, `對的摘要排在第一個的有 ${first}／${CASES.length} 張`);
});
