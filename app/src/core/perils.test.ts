// 劫的回顧：理想的打法每一劫都過；每一劫照它的陷阱故意犯一次錯，一定會被困住
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS } from '../data/index.ts';
import { PERILS, CANTOS } from '../data/odyssey.ts';
import { idealActions, run } from './autoplay.ts';
import { perilOf } from './perils.ts';
import type { CaseDef, Session } from './types.ts';

test('十二種劫影各有一劫，每一劫都在一篇篇章裡', () => {
  assert.equal(Object.keys(PERILS).length, 12);
  for (const m of COMPLAINTS) {
    assert.ok(PERILS[m.id], m.id + ' 沒有對到一劫');
    assert.equal(CANTOS.filter((k) => k.perils.includes(m.id)).length, 1, m.id + ' 要剛好在一篇裡');
  }
});

test('理想的打法：四十九位病人都過了那一劫', () => {
  for (const c of CASES) {
    const r = perilOf(c, run(c, idealActions(c)));
    assert.ok(r, c.id);
    assert.equal(r.trapped, false, c.id + '：' + r.why);
  }
});

/** 每一劫的陷阱：把理想打法的紀錄改成掉進去的樣子 */
const TRAPS: Record<string, (c: CaseDef, s: Session) => Session> = {
  'chest-pain': (_c, s) => ({ ...s, board: { ...s.board, exclude: [] } }),
  dyspnea: (c, s) => ({ ...s, report: { ...s.report!, r: [...s.report!.r, c.sbar.requests.find((q) => !q.ok)!.id] } }),
  abdomen: (c, s) => ({ ...s, asked: s.asked.filter((id) => c.questions.find((q) => q.id === id)?.group !== 'cc') }),
  fever: (c, s) => ({ ...s, report: { ...s.report!, r: [...s.report!.r, c.sbar.requests.find((q) => !q.ok)!.id] } }),
  headache: (c, s) => ({ ...s, board: { ...s.board, summary: [...c.summaries].sort((a, b) => a.score - b.score)[0].id } }),
  'back-pain': (c, s) => (c.timeline.worsenAfter !== undefined ? { ...s, calledAt: null } : { ...s, vitalsLog: [] }),
  'leg-pain': (_c, s) => ({ ...s, examined: s.examined.map((k) => ({ ...k, explained: false })) }),
  swelling: (c, s) => ({ ...s, examined: s.examined.filter((k) => c.exams.find((e) => e.id === k.id)?.part !== '腹部') }),
  excreta: (_c, s) => ({ ...s, asked: s.asked.filter((id) => id !== 'q-concern') }),
  rash: (_c, s) => ({ ...s, vitalsLog: [] }),
  'weight-loss': (c, s) => ({ ...s, asked: s.asked.filter((id) => c.questions.find((q) => q.id === id)?.group !== 'hx' || id === 'q-concern') }),
  paresthesia: (c, s) => ({ ...s, board: { ...s.board, likely: c.forms.find((f) => f.id !== c.answer.truth)!.id } }),
};

test('故意掉進陷阱：每一位都被困住，也說得出是哪一個動作', () => {
  for (const c of CASES) {
    const s = TRAPS[c.complaint](c, run(c, idealActions(c))), r = perilOf(c, s)!;
    assert.equal(r.trapped, true, c.id + ' 應該被困住');
    assert.ok(r.why.length > 6 && r.why !== r.peril.pass, c.id);
  }
});

test('劫的名字不會跑進病室：病例的文字裡沒有任何一劫的名字', () => {
  const names = Object.values(PERILS).map((p) => p.name.replace('之劫', ''));
  for (const c of CASES) {
    const { closing: _closing, ...lines } = c.lines;
    const text = JSON.stringify([c.questions, c.exams, c.tests, c.summaries, c.sbar, c.explain, lines, c.reading]);
    for (const n of names) assert.ok(!text.includes(n), c.id + ' 出現了 ' + n);
  }
});
