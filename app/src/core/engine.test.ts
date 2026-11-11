import test from 'node:test';
import assert from 'node:assert/strict';
import { C01A } from '../data/c01a.ts';
import { createSession, perform, replay, stability, veil, hintFor } from './engine.ts';
import { scoreSession, moments, takeaways } from './scoring.ts';
import { validateCase } from './validate.ts';
import type { Action, Board } from './types.ts';

const c = C01A;
const ask = (id: string): Action => ({ type: 'ask', id });
const exam = (id: string, explain = true): Action => ({ type: 'exam', id, explain });
const goodBoard: Board = { summary: 's-best', likely: 'acs', exclude: ['dissection', 'pe'], support: ['c-onset', 'c-pressure', 'c-sweat'], against: ['c-notear', 'c-botharms'] };

// 理想的打法：先量生命徵象、敲鐘、提心電圖，再補病史和評估
const ideal: Action[] = [
  ask('q-intro'), { type: 'vitals' }, ask('q-onset'), { type: 'call' }, { type: 'test', id: 't-ecg' }, ask('q-quality'), ask('q-radiate'), ask('q-assoc'),
  { type: 'report', a: 'a-acs', r: ['r-come', 'r-ecg', 'r-monitor'] }, ask('q-tear'), exam('x-look'), exam('x-botharms'), exam('x-heart'), exam('x-lungs'), exam('x-perfusion'),
  { type: 'vitals' }, ask('q-provoke'), ask('q-pmh'), ask('q-meds'), ask('q-family'), ask('q-smoke'), ask('q-immob'), ask('q-concern'), ask('q-worse'), ask('q-sob'),
  exam('x-jvp'), exam('x-legs'), exam('x-chestwall'), { type: 'test', id: 't-blood' },
  { type: 'board', board: goodBoard }, { type: 'explain', ids: ['e-why', 'e-plan', 'e-warn', 'e-concern'] }, { type: 'close' },
];

test('示範病例通過檢查器', () => assert.deepEqual(validateCase(c), []));

test('檢查器抓得到指錯的線索', () => {
  const bad = { ...c, questions: [...c.questions, { ...c.questions[2], id: 'q-x', clue: 'c-nope' }] };
  assert.ok(validateCase(bad).some((e) => e.includes('c-nope')));
});

test('同樣的行動順序，結果一模一樣', () => {
  assert.deepEqual(replay(c, ideal), replay(c, ideal));
  assert.deepEqual(scoreSession(c, replay(c, ideal)), scoreSession(c, replay(c, ideal)));
});

test('行動不會改到原本的對局', () => {
  const s0 = createSession(c), snap = JSON.stringify(s0);
  perform(c, s0, ask('q-onset'));
  assert.equal(JSON.stringify(s0), snap);
});

test('理想的打法：安全行動達成，分數在九成以上', () => {
  const s = replay(c, ideal), sc = scoreSession(c, s);
  assert.equal(sc.safety, 'met');
  assert.equal(s.worsenedAt, null);
  assert.ok(sc.total >= 90, '總分 ' + sc.total);
  assert.ok(sc.data <= 55 && sc.reason <= 45);
  assert.equal(sc.rows.reduce((n, r) => n + r.max, 0), 100);
  assert.ok(s.ecgRead, '醫師判讀了心電圖');
});

test('沒量過生命徵象就是不知道', () => {
  const s = replay(c, [ask('q-onset')]);
  assert.equal(s.vitalsSeen, null);
  assert.equal(replay(c, [{ type: 'vitals' }]).vitalsSeen!.v.bp, '103/68');
});

test('拖過第 4 分鐘還沒通報：病況變差，之後通報算延遲補救', () => {
  const eight = ['q-onset', 'q-quality', 'q-radiate', 'q-assoc', 'q-pmh', 'q-meds', 'q-family', 'q-smoke'].map(ask);
  let s = replay(c, eight.slice(0, 7));
  assert.equal(s.worsenedAt, null);
  const r = perform(c, s, eight[7]); s = r.session;
  assert.equal(s.worsenedAt, 240);
  assert.ok(r.events.some((e) => e.type === 'worsen'));
  // 手上的數字還是舊的，要重測才知道
  const v = perform(c, perform(c, replay(c, [{ type: 'vitals' }, ...eight]), { type: 'vitals' }).session, { type: 'call' }).session;
  assert.equal(v.vitalsSeen!.v.bp, '86/58');
  const sc = scoreSession(c, replay(c, [{ type: 'vitals' }, ...eight, { type: 'call' }, { type: 'test', id: 't-ecg' }, { type: 'close' }]));
  assert.equal(sc.safety, 'late');
});

test('一直不通報：第 8 分鐘岑禾接手，安全狀態是需要複核', () => {
  const many = c.questions.slice(0, 17).map((q) => ask(q.id));
  const s = replay(c, many);
  assert.equal(s.calledBy, 'mentor');
  assert.equal(scoreSession(c, replay(c, [...many, { type: 'close' }])).safety, 'review');
});

test('及時通報就不會變差', () => {
  const s = replay(c, [{ type: 'call' }, ...c.questions.map((q) => ask(q.id))]);
  assert.equal(s.worsenedAt, null);
  assert.ok(s.doctorHere);
});

test('重複問同一題不會多拿線索，但時間照扣', () => {
  const s = replay(c, [ask('q-onset'), ask('q-onset')]);
  assert.equal(s.clues.length, 1);
  assert.equal(s.asked.length, 1);
  assert.equal(s.time, 60);
});

test('心電圖提出 2 分鐘後才有結果', () => {
  let s = replay(c, [{ type: 'call' }, { type: 'test', id: 't-ecg' }]);
  assert.ok(!s.results.includes('t-ecg'));
  s = replay(c, [{ type: 'call' }, { type: 'test', id: 't-ecg' }, { type: 'watch' }, { type: 'watch' }, { type: 'watch' }, { type: 'watch' }]);
  assert.ok(s.results.includes('t-ecg') && s.clues.includes('c-ecg'));
});

test('回報裡要求心電圖，等於提出心電圖', () => {
  const s = replay(c, [{ type: 'call' }, { type: 'report', a: 'a-acs', r: ['r-ecg'] }]);
  assert.ok(s.ordered.some((o) => o.id === 't-ecg'));
});

test('還沒敲鐘不能回報；結案之後不能再行動', () => {
  assert.equal(perform(c, createSession(c), { type: 'report', a: 'a-acs', r: [] }).events[0].type, 'reject');
  const done = replay(c, [{ type: 'close' }]);
  assert.equal(perform(c, done, ask('q-onset')).events[0].type, 'reject');
});

test('沒問他擔心什麼，就沒有那一句說明可以選', () => {
  const s = replay(c, [{ type: 'explain', ids: ['e-why', 'e-concern'] }]);
  assert.deepEqual(s.explained, ['e-why']);
});

test('不說明就動手：同意與說明那一項拿不到評估的分', () => {
  const told = scoreSession(c, replay(c, [ask('q-intro'), exam('x-heart', true)])).rows.find((r) => r.id === 'consent')!.got;
  const silent = scoreSession(c, replay(c, [ask('q-intro'), exam('x-heart', false)])).rows.find((r) => r.id === 'consent')!.got;
  assert.equal(told, 10); assert.equal(silent, 4);
});

test('什麼都不做就結案：分數很低，需要複核', () => {
  const sc = scoreSession(c, replay(c, [{ type: 'close' }]));
  assert.ok(sc.total <= 5, '總分 ' + sc.total);
  assert.equal(sc.safety, 'review');
});

test('太早認定是拉傷：推理的分數拿不到', () => {
  const wrong: Board = { summary: 's-anchor', likely: 'msk', exclude: [], support: ['c-onset'], against: [] };
  const sc = scoreSession(c, replay(c, [ask('q-onset'), { type: 'board', board: wrong }, { type: 'close' }]));
  assert.equal(sc.rows.find((r) => r.id === 'ddx')!.got, 0);
  assert.equal(sc.rows.find((r) => r.id === 'evidence')!.got, 0);
});

test('霧和穩定度', () => {
  const s0 = createSession(c);
  assert.equal(veil(c, s0), 1);
  assert.ok(veil(c, replay(c, ideal.slice(0, 8))) < 0.8);
  assert.equal(veil(c, replay(c, ideal)), 0);
  const late = replay(c, c.questions.slice(0, 10).map((q) => ask(q.id)));
  const early = replay(c, [{ type: 'call' }, ...c.questions.slice(0, 10).map((q) => ask(q.id))]);
  assert.ok(stability(c, early) > stability(c, late) + 20);
});

test('提示會跟著狀況變', () => {
  assert.equal(hintFor(c, createSession(c)), c.hints.find((h) => h.id === 'h-vitals')!.text);
  assert.equal(hintFor(c, replay(c, [{ type: 'vitals' }])), c.hints.find((h) => h.id === 'h-call')!.text);
  assert.equal(hintFor(c, replay(c, [{ type: 'vitals' }, { type: 'call' }])), c.hints.find((h) => h.id === 'h-ecg')!.text);
  assert.equal(hintFor(c, replay(c, ideal.slice(0, -1))), c.hints.find((h) => h.id === 'h-close')!.text);
});

test('回顧：時間點照順序，下次要做到的事不超過四項', () => {
  const s = replay(c, ideal), m = moments(c, s);
  assert.ok(m.length >= 3);
  assert.deepEqual(m.map((k) => k.t), [...m.map((k) => k.t)].sort((a, b) => a - b));
  assert.ok(m.find((k) => k.id === 'call')!.clues.includes('c-onset'));
  const t = takeaways(c, replay(c, [{ type: 'close' }]), scoreSession(c, replay(c, [{ type: 'close' }])));
  assert.ok(t.length >= 3 && t.length <= 4);
});
