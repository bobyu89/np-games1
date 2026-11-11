import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, caseById } from '../data/index.ts';
import { C01A } from '../data/c01a.ts';
import { resolveCase } from './module.ts';
import { createSession, perform, stability, veil, lights, hintFor, COMMIT_AFTER } from './engine.ts';
import { scoreSession, moments, takeaways, trajectory, harvest } from './scoring.ts';
import { validateCase } from './validate.ts';
import { idealActions, run, step } from './autoplay.ts';
import type { Action } from './types.ts';

const A = caseById('c01a'), B = caseById('c01b');
const ask = (id: string): Action => ({ type: 'ask', id });
const exam = (id: string, explain = true): Action => ({ type: 'exam', id, explain });
const row = (c: typeof A, actions: Action[], id: string, wrong = false) => scoreSession(c, run(c, actions, wrong)).rows.find((r) => r.id === id)!;

// ── 病例模組 ──
test('每個病例都通過檢查器', () => { for (const c of CASES) assert.deepEqual(validateCase(c), [], c.id); });

test('每個病例照理想的打法，都能安全達成、九十分以上', () => {
  for (const c of CASES) {
    const s = run(c, idealActions(c)), sc = scoreSession(c, s);
    assert.equal(sc.safety, 'met', c.id + ' ' + sc.safetyNote);
    assert.ok(sc.total >= 90, c.id + ' 總分 ' + sc.total + ' ' + sc.rows.map((r) => r.id + ' ' + r.got).join(' '));
    assert.equal(sc.rows.reduce((n, r) => n + r.max, 0), 100);
    assert.ok(sc.data <= 55 && sc.reason <= 45);
    assert.equal(veil(c, s), 0);
  }
});

test('同一個主訴的病例，畫面上的選項一模一樣', () => {
  const shape = (c: typeof A) => JSON.stringify([c.questions.map((q) => [q.id, q.label, q.ask]), c.exams.map((e) => [e.id, e.label]), c.tests.map((t) => [t.id, t.label]), c.forms.map((f) => f.id)]);
  assert.equal(shape(A), shape(B));
  assert.notEqual(A.answer.truth, B.answer.truth);
});

test('病例少寫一題的回答，合併的時候就會報錯', () => {
  const { 'q-onset': _drop, ...rest } = C01A.answers; void _drop;
  assert.throws(() => resolveCase(COMPLAINTS[0], { ...C01A, answers: rest }), /q-onset/);
  assert.throws(() => resolveCase(COMPLAINTS[0], { ...C01A, answers: { ...C01A.answers, 'q-nope': { say: 'x' } } }), /q-nope/);
});

test('檢查器抓得到常見的錯', () => {
  const has = (c: typeof A, word: string) => assert.ok(validateCase(c).some((e) => e.includes(word)), word + ' → ' + validateCase(c).join('｜'));
  has({ ...A, safety: [{ type: 'call', points: 5 }] }, '9 分');
  has({ ...A, answer: { ...A.answer, truth: 'nope' } }, 'nope');
  has({ ...A, clues: A.clues.map((k) => (k.id === 'c-tear' ? { ...k, why: undefined } : k)) }, '為什麼');
  has({ ...B, clues: B.clues.map((k) => (k.tell?.form === 'dissection' ? { ...k, tell: undefined, why: undefined } : k)) }, '比較不像');
  has({ ...A, forms: A.forms.slice(0, 3) }, '四個真身');
});

// ── 規則 ──
test('同樣的行動順序，結果一模一樣；行動不會改到原本的對局', () => {
  assert.deepEqual(run(A, idealActions(A)), run(A, idealActions(A)));
  const s0 = createSession(A), snap = JSON.stringify(s0);
  perform(A, s0, ask('q-onset'));
  assert.equal(JSON.stringify(s0), snap);
});

test('沒量過生命徵象就是不知道', () => {
  assert.equal(run(A, [ask('q-intro')]).vitalsSeen, null);
  assert.equal(run(A, [{ type: 'vitals' }]).vitalsSeen!.v.bp, '103/68');
});

test('拿到要解讀的線索，要先解讀才能做下一件事；解讀不扣時間', () => {
  const s = perform(A, createSession(A), ask('q-onset')).session;
  assert.deepEqual(s.pending, ['c-onset']);
  assert.equal(perform(A, s, ask('q-quality')).events[0].type, 'reject');
  const r = perform(A, s, { type: 'read', clue: 'c-onset', form: 'acs' });
  assert.equal(r.session.time, s.time);
  assert.deepEqual(r.session.reads.map((k) => k.ok), [true]);
  assert.equal(perform(A, s, { type: 'read', clue: 'c-onset', form: 'msk' }).session.reads[0].ok, false);
});

test('解讀對了霧才全散，解讀錯只散一半；燈照著線索亮', () => {
  const right = run(A, [ask('q-onset')]), wrong = run(A, [ask('q-onset')], true), none = perform(A, createSession(A), ask('q-onset')).session;
  assert.ok(veil(A, right) < veil(A, wrong) && veil(A, wrong) < veil(A, none));
  assert.equal(veil(A, none), 1);
  const l = lights(A, run(A, [ask('q-onset'), ask('q-tear')]));
  assert.ok(l.acs > 0 && l.dissection < 0 && l.pe === 0);
});

test('解讀到第三條，岑禾會問你最擔心哪一個；回答之前不能做別的', () => {
  let s = createSession(A);
  for (const id of ['q-onset', 'q-quality', 'q-radiate']) { s = perform(A, s, ask(id)).session; s = perform(A, s, { type: 'read', clue: s.pending[0], form: 'acs' }).session; }
  assert.equal(s.reads.length, COMMIT_AFTER);
  assert.ok(s.needCommit);
  assert.equal(perform(A, s, ask('q-assoc')).events[0].type, 'reject');
  s = perform(A, s, { type: 'commit', form: 'msk' }).session;
  assert.ok(!s.needCommit);
  assert.deepEqual(s.commits.map((k) => k.form), ['msk']);
});

test('重複問同一題不會多拿線索，但時間照扣', () => {
  const s = run(A, [ask('q-pmh'), ask('q-pmh')]);
  assert.equal(s.clues.length, 1);
  assert.equal(s.time, 60);
});

// ── 會變差的病人（C01A）──
test('拖過第 4 分鐘還沒通報：病況變差，要重測才看得到新的數字', () => {
  const eight = ['q-pmh', 'q-meds', 'q-family', 'q-smoke', 'q-ros-cv', 'q-ros-resp', 'q-ros-gi', 'q-trauma'].map(ask);
  assert.equal(run(A, eight.slice(0, 7)).worsenedAt, null);
  const s = run(A, [{ type: 'vitals' }, ...eight]);
  assert.ok(s.worsenedAt !== null);
  assert.equal(s.vitalsSeen!.v.bp, '103/68');
  assert.equal(step(A, s, { type: 'vitals' }).vitalsSeen!.v.bp, '86/58');
  assert.equal(scoreSession(A, run(A, [...eight, { type: 'call' }, { type: 'test', id: 't-ecg' }, { type: 'close' }])).safety, 'late');
});

test('一直不通報：第 8 分鐘岑禾接手，安全狀態是需要複核', () => {
  const many = A.questions.slice(0, 17).map((q) => ask(q.id));
  assert.equal(run(A, many).calledBy, 'mentor');
  assert.equal(scoreSession(A, run(A, [...many, { type: 'close' }])).safety, 'review');
});

test('及時通報就不會變差；回報本身也算通報', () => {
  const s = run(A, [{ type: 'call' }, ...A.questions.map((q) => ask(q.id))]);
  assert.equal(s.worsenedAt, null);
  assert.ok(s.doctorHere);
  const viaReport = run(A, [{ type: 'report', a: 'a-acs', r: ['r-ecg'] }]);
  assert.equal(viaReport.calledBy, 'you');
  assert.ok(!viaReport.bell);
  assert.ok(viaReport.ordered.some((o) => o.id === 't-ecg'));
});

test('心電圖提出 2 分鐘後才有結果，結果也要解讀', () => {
  const s0 = run(A, [{ type: 'call' }, { type: 'test', id: 't-ecg' }]);
  assert.ok(!s0.results.includes('t-ecg'));
  let s = s0;
  for (let i = 0; i < 4; i++) s = perform(A, s, { type: 'watch' }).session;
  assert.ok(s.results.includes('t-ecg'));
  assert.deepEqual(s.pending, ['c-ecg']);
});

// ── 穩定的病人（C01B）──
test('穩定的病人不會變差，岑禾也不會接手', () => {
  const s = run(B, B.questions.map((q) => ask(q.id)));
  assert.equal(s.worsenedAt, null);
  assert.equal(s.calledBy, null);
  assert.equal(stability(B, s), stability(B, createSession(B)));
});

test('穩定的病人敲了值班鐘：安全行動只算部分達成', () => {
  const acts = idealActions(B), i = acts.findIndex((a) => a.type === 'report');
  const sc = scoreSession(B, run(B, [...acts.slice(0, i), { type: 'call' }, ...acts.slice(i)]));
  assert.equal(sc.safety, 'late');
  assert.ok(sc.safetyNote.includes('不需要敲值班鐘'));
});

test('沒有把危險的真身排除就說沒事：需要複核', () => {
  const quick: Action[] = [ask('q-intro'), { type: 'vitals' }, ask('q-quality'), exam('x-chestwall'), { type: 'test', id: 't-ecg' },
    { type: 'board', board: { summary: 's-best', likely: 'msk', exclude: [] } }, { type: 'explain', ids: ['e-why', 'e-warn'] }, { type: 'close' }];
  const sc = scoreSession(B, run(B, quick));
  assert.equal(sc.safety, 'review');
  assert.ok(sc.safetyNote.includes('主動脈剝離') && sc.safetyNote.includes('肺栓塞'));
});

test('回報穩定的病人不會把醫師叫來', () => {
  const s = run(B, [{ type: 'report', a: 'a-msk', r: ['r-read', 'r-plan'] }]);
  assert.equal(s.calledAt, null);
  assert.ok(s.ordered.some((o) => o.id === 't-ecg'));
});

// ── 評分 ──
test('不說明就動手：同意與說明那一項拿不到評估的分', () => {
  assert.equal(row(A, [ask('q-intro'), exam('x-heart', true)], 'consent').got, 10);
  assert.equal(row(A, [ask('q-intro'), exam('x-heart', false)], 'consent').got, 4);
});

test('線索都解讀錯：證據那一項是零分', () => {
  const acts = idealActions(A);
  assert.equal(row(A, acts, 'evidence').got, 10);
  assert.equal(row(A, acts, 'evidence', true).got, 0);
});

test('沒問擔心什麼，就沒有那一句說明可以選', () => {
  assert.deepEqual(run(A, [{ type: 'explain', ids: ['e-why', 'e-concern'] }]).explained, ['e-why']);
});

test('什麼都不做就結案：分數很低，需要複核', () => {
  for (const c of CASES) {
    const sc = scoreSession(c, run(c, [{ type: 'close' }]));
    assert.ok(sc.total <= 5, c.id + ' 總分 ' + sc.total);
    assert.equal(sc.safety, 'review');
  }
});

test('結案之後不能再行動', () => {
  assert.equal(perform(A, run(A, [{ type: 'close' }]), ask('q-onset')).events[0].type, 'reject');
});

// ── 提示和回顧 ──
test('提示會跟著狀況變，而且不講出真身', () => {
  assert.ok(hintFor(A, createSession(A)).includes('血壓'));
  assert.ok(hintFor(A, run(A, [{ type: 'vitals' }])).includes('叫人'));
  assert.ok(hintFor(A, run(A, [{ type: 'vitals' }, { type: 'call' }])).includes('心電圖'));
  assert.ok(hintFor(B, run(B, [{ type: 'vitals' }, { type: 'test', id: 't-ecg' }])).includes('那盞燈'));
  for (const c of CASES) assert.ok(hintFor(c, run(c, idealActions(c).slice(0, -1))).includes('提交'));
});

test('回顧：時間點照順序；看得出想法有沒有跟著線索變', () => {
  const s = run(A, idealActions(A)), m = moments(A, s);
  assert.ok(m.length >= 4);
  assert.deepEqual(m.map((k) => k.t), [...m.map((k) => k.t)].sort((a, b) => a - b));
  assert.ok(trajectory(A, s).verdict.includes('一開始的判斷就對了'));
  // 中途說是拉傷，結案改成急性冠心症
  let cur = createSession(A);
  for (const id of ['q-onset', 'q-quality', 'q-radiate']) { cur = perform(A, cur, ask(id)).session; cur = perform(A, cur, { type: 'read', clue: cur.pending[0], form: 'acs' }).session; }
  cur = perform(A, cur, { type: 'commit', form: 'msk' }).session;
  cur = perform(A, cur, { type: 'board', board: { summary: 's-best', likely: 'acs', exclude: [] } }).session;
  cur = perform(A, cur, { type: 'close' }).session;
  assert.ok(trajectory(A, cur).verdict.includes('跟著線索改了想法'));
  assert.ok(takeaways(A, cur, scoreSession(A, cur)).length <= 4);
});

test('可以寫進圖鑑的：解讀對的線索、有沒有認出真身', () => {
  const h = harvest(B, run(B, idealActions(B)));
  assert.ok(h.found && h.concern);
  assert.ok(h.reads.some((r) => r.form === 'msk' && r.dir === 1) && h.reads.some((r) => r.form === 'acs' && r.dir === -1));
  assert.equal(harvest(B, run(B, idealActions(B), true)).reads.length, 0);
});
