import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, caseById } from '../data/index.ts';
import { C01A } from '../data/c01a.ts';
import { resolveCase } from './module.ts';
import { createSession, perform, stability, veil, lights, hintFor, COMMIT_AFTER, COST } from './engine.ts';
import { scoreSession, moments, takeaways, trajectory, harvest } from './scoring.ts';
import { validateCase } from './validate.ts';
import { idealActions, run, step } from './autoplay.ts';
import type { Action } from './types.ts';

const A = caseById('c01a'), B = caseById('c01b'), C = caseById('c01c'), D = caseById('c01d');
const ask = (id: string): Action => ({ type: 'ask', id });
const exam = (id: string, explain = true): Action => ({ type: 'exam', id, explain });
const row = (c: typeof A, actions: Action[], id: string, wrong = false) => scoreSession(c, run(c, actions, wrong)).rows.find((r) => r.id === id)!;

const next: Action = { type: 'advance' }, watch: Action = { type: 'watch' };
const times = (a: Action, n: number): Action[] => Array.from({ length: n }, () => a);
/** 理想的打法，走到下完診斷為止 */
const toDx = (c: typeof A): Action[] => { const acts = idealActions(c); return acts.slice(0, acts.findIndex((a) => a.type === 'board') + 1); };
const dx = (c: typeof A, likely = c.answer.truth): Action => ({ type: 'board', board: { summary: 's-best', likely, exclude: [] } });

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

test('同一個主訴的病例，畫面上的選項一模一樣，真身各不相同', () => {
  const shape = (c: typeof A) => JSON.stringify([c.questions.map((q) => [q.id, q.label, q.ask]), c.exams.map((e) => [e.id, e.part, e.label]), c.tests.map((t) => [t.id, t.label]), c.forms.map((f) => f.id)]);
  for (const c of [B, C, D]) assert.equal(shape(A), shape(c));
  // 四位病人，四個真身各一位
  assert.deepEqual([A, B, C, D].map((c) => c.answer.truth).sort(), A.forms.map((f) => f.id).sort());
});

test('問題庫照骨架排：開場、主訴、病史、系統回顧；評估照五個模組', () => {
  assert.deepEqual([...new Set(A.questions.map((q) => q.group))], ['open', 'cc', 'hx', 'ros']);
  assert.deepEqual(A.questions.filter((q) => q.group === 'open').map((q) => q.id), ['q-wash', 'q-intro', 'q-explain']);
  assert.equal(A.questions.filter((q) => q.group === 'cc').length, 10);
  assert.deepEqual(A.questions.filter((q) => q.group === 'ros').map((q) => q.id), ['q-ros-gen', 'q-ros-cp', 'q-ros-gi', 'q-ros-limb']);
  assert.equal(A.questions.length, 25);
  assert.deepEqual([...new Set(A.exams.map((e) => e.part))], ['整體', '頭頸', '胸部', '心臟', '腹部', '四肢']);
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
  has({ ...A, clues: A.clues.map((k) => (k.id === 'c-character' ? { ...k, why: undefined } : k)) }, '為什麼');
  has({ ...B, clues: B.clues.map((k) => (k.tell?.form === 'vascular' ? { ...k, tell: undefined, why: undefined } : k)) }, '比較不像');
  has({ ...A, forms: A.forms.slice(0, 3) }, '四個真身');
  has({ ...A, questions: A.questions.filter((q) => q.group !== 'ros') }, '少了一段');
  has({ ...A, title: 'TODO 委託的標題' }, 'TODO');
  has({ ...B, clues: B.clues.map((k) => (k.id === 'c-location' ? { ...k, alsoOk: [{ form: 'cardiac', dir: -1 as const }] } : k)) }, '方向');
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
  assert.equal(perform(A, s, ask('q-character')).events[0].type, 'reject');
  const r = perform(A, s, { type: 'read', clue: 'c-onset', form: 'cardiac' });
  assert.equal(r.session.time, s.time);
  assert.deepEqual(r.session.reads.map((k) => k.ok), [true]);
  assert.equal(perform(A, s, { type: 'read', clue: 'c-onset', form: 'msk' }).session.reads[0].ok, false);
});

test('解讀對了霧才全散，解讀錯只散一半；燈照著線索亮', () => {
  const right = run(A, [ask('q-onset')]), wrong = run(A, [ask('q-onset')], true), none = perform(A, createSession(A), ask('q-onset')).session;
  assert.ok(veil(A, right) < veil(A, wrong) && veil(A, wrong) < veil(A, none));
  assert.equal(veil(A, none), 1);
  const l = lights(A, run(A, [ask('q-onset'), ask('q-surgery')]));
  assert.ok(l.cardiac > 0 && l.vascular < 0 && l.tumor === 0);
});

test('解讀到第三條，岑禾會問你最擔心哪一個；回答之前不能做別的', () => {
  let s = createSession(A);
  for (const id of ['q-onset', 'q-character', 'q-assoc']) { s = perform(A, s, ask(id)).session; s = perform(A, s, { type: 'read', clue: s.pending[0], form: 'cardiac' }).session; }
  assert.equal(s.reads.length, COMMIT_AFTER);
  assert.ok(s.needCommit);
  assert.equal(perform(A, s, ask('q-radiate')).events[0].type, 'reject');
  s = perform(A, s, { type: 'commit', form: 'msk' }).session;
  assert.ok(!s.needCommit);
  assert.deepEqual(s.commits.map((k) => k.form), ['msk']);
});

test('重複問同一題不會多拿線索，但時間照扣', () => {
  const s = run(A, [ask('q-pmh'), ask('q-pmh')]);
  assert.equal(s.clues.length, 1);
  assert.equal(s.time, COST.ask * 2);
});

// ── 順序：問診 → 評估 → 診斷 → 檢查 ──
test('不能跳到後面：沒問完不能評估，沒評估完不能下診斷，沒下診斷不能做檢查', () => {
  const s1 = createSession(A), rejected = (s: typeof s1, a: Action) => perform(A, s, a).events[0].type === 'reject';
  assert.ok(rejected(s1, exam('x-heart')) && rejected(s1, dx(A)) && rejected(s1, { type: 'test', id: 't-ecg' }));
  const s2 = run(A, [next]);
  assert.equal(s2.phase, 2);
  assert.ok(!rejected(s2, exam('x-heart')) && rejected(s2, dx(A)) && rejected(s2, { type: 'test', id: 't-ecg' }));
  const s3 = run(A, [next, next]);
  assert.equal(s3.phase, 3);
  assert.ok(rejected(s3, { type: 'test', id: 't-ecg' }) && rejected(s3, { type: 'report', a: 'a-acs', r: [] }) && rejected(s3, { type: 'explain', ids: ['e-why'] }));
  assert.ok(rejected(s3, next));
  const s4 = perform(A, s3, dx(A)).session;
  assert.equal(s4.phase, 4);
  assert.equal(s4.dxAt, s3.time);
  assert.ok(!rejected(s4, { type: 'test', id: 't-ecg' }));
});

test('可以回頭補做：進到後面的階段，前面的問診和評估都還能做', () => {
  const s = run(A, [...toDx(A).filter((a) => a.type !== 'ask' && a.type !== 'exam'), ask('q-family'), exam('x-legs')]);
  assert.equal(s.phase, 4);
  assert.ok(s.asked.includes('q-family') && s.examined.some((e) => e.id === 'x-legs'));
});

test('只寫了摘要、沒選最可能的，不算下了診斷', () => {
  const s = run(A, [next, next, { type: 'board', board: { summary: 's-best', likely: null, exclude: [] } }]);
  assert.equal(s.dxAt, null);
  assert.equal(s.phase, 3);
});

test('整套問診和評估做完，模擬的時間大約是考站的 15 分鐘', () => {
  const t = run(A, toDx(A)).time;
  assert.ok(t >= 12 * 60 && t <= 16 * 60, '用了 ' + t + ' 秒');
});

// ── 會變差的病人（C01A）──
test('問診和評估花多久都不會變差：照順序做不會被罰', () => {
  const slow = run(A, [...A.questions.map((q) => ask(q.id)), ...A.questions.map((q) => ask(q.id)), next, ...A.exams.map((e) => exam(e.id)), ...A.exams.map((e) => exam(e.id))]);
  assert.ok(slow.time > 20 * 60);
  assert.equal(slow.worsenedAt, null);
  assert.equal(slow.calledBy, null);
});

test('下了診斷卻拖著不通報：2 分鐘後變差，要重測才看得到新的數字', () => {
  assert.equal(run(A, [...toDx(A), ...times(watch, 3)]).worsenedAt, null);
  const s = run(A, [...toDx(A), ...times(watch, 4)]);
  assert.ok(s.worsenedAt !== null);
  assert.equal(s.vitalsSeen!.v.bp, '103/68');
  assert.equal(step(A, s, { type: 'vitals' }).vitalsSeen!.v.bp, '86/58');
  assert.equal(scoreSession(A, run(A, [...toDx(A), ...times(watch, 4), { type: 'call' }, { type: 'test', id: 't-ecg' }, { type: 'close' }])).safety, 'late');
});

test('一直不通報：下診斷 5 分鐘後岑禾接手，安全狀態是需要複核', () => {
  const s = run(A, [...toDx(A), ...times(watch, 10)]);
  assert.equal(s.calledBy, 'mentor');
  assert.equal(scoreSession(A, run(A, [...toDx(A), ...times(watch, 10), { type: 'close' }])).safety, 'review');
});

test('及時通報就不會變差；回報本身也算通報；提早敲鐘也可以', () => {
  const s = run(A, [...toDx(A), { type: 'call' }, ...times(watch, 6)]);
  assert.equal(s.worsenedAt, null);
  assert.ok(s.doctorHere);
  const viaReport = run(A, [...toDx(A), { type: 'report', a: 'a-acs', r: ['r-ecg'] }]);
  assert.equal(viaReport.calledBy, 'you');
  assert.ok(!viaReport.bell);
  assert.ok(viaReport.ordered.some((o) => o.id === 't-ecg'));
  const acts = idealActions(A).filter((a) => a.type !== 'call');
  const early = scoreSession(A, run(A, [{ type: 'vitals' }, { type: 'call' }, ...acts]));
  assert.equal(early.safety, 'met');
});

test('心電圖提出一分半之後才有結果，結果也要解讀', () => {
  const s0 = run(A, [...toDx(A), { type: 'call' }, { type: 'test', id: 't-ecg' }]);
  assert.ok(!s0.results.includes('t-ecg'));
  let s = s0;
  for (let i = 0; i < 3; i++) s = perform(A, s, watch).session;
  assert.ok(s.results.includes('t-ecg'));
  assert.deepEqual(s.pending, ['c-ecg']);
});

test('肺栓塞那一位：下了診斷不通報一樣會變差；X 光乾淨反而是線索；圖鑑的第四盞燈亮了', () => {
  assert.equal(D.answer.truth, 'vascular');
  assert.equal(D.scene, 'dock');
  const late = run(D, [...toDx(D), ...times(watch, 4)]);
  assert.ok(late.worsenedAt !== null);
  assert.equal(step(D, late, { type: 'vitals' }).vitalsSeen!.v.spo2, 85);
  const s = run(D, idealActions(D));
  assert.ok(s.reads.some((r) => r.clue === 'c-cxr' && r.ok) && s.reads.some((r) => r.clue === 'c-legs' && r.ok));
  assert.ok(lights(D, s).vascular > lights(D, s).cardiac);
  // 把低血氧當成緊張：回報零分的那一句
  const acts = idealActions(D).map((a) => (a.type === 'report' ? { ...a, a: 'a-anxious' } : a));
  assert.ok(row(D, acts, 'care').got < row(D, idealActions(D), 'care').got);
});

// ── 穩定的病人（C01B、C01C）──
test('穩定的病人不會變差，岑禾也不會接手', () => {
  for (const c of [B, C]) {
    const s = run(c, [...toDx(c), ...times(watch, 14)]);
    assert.equal(s.worsenedAt, null);
    assert.equal(s.calledBy, null);
    assert.equal(stability(c, s), stability(c, createSession(c)));
  }
});

test('穩定的病人敲了值班鐘：安全行動只算部分達成', () => {
  for (const c of [B, C]) {
    const acts = idealActions(c), i = acts.findIndex((a) => a.type === 'report');
    const sc = scoreSession(c, run(c, [...acts.slice(0, i), { type: 'call' }, ...acts.slice(i)]));
    assert.equal(sc.safety, 'late');
    assert.ok(sc.safetyNote.includes('不需要敲值班鐘'));
  }
});

test('沒有把危險的真身排除就說沒事：需要複核', () => {
  const quick: Action[] = [ask('q-intro'), next, { type: 'vitals' }, exam('x-chest-touch'), next, { type: 'board', board: { summary: 's-best', likely: 'msk', exclude: [] } },
    { type: 'test', id: 't-ecg' }, { type: 'explain', ids: ['e-why', 'e-warn'] }, { type: 'close' }];
  const sc = scoreSession(B, run(B, quick));
  assert.equal(sc.safety, 'review');
  assert.ok(sc.safetyNote.includes('血管急症') && sc.safetyNote.includes('胸腔腫瘤'));
});

test('下了診斷，關鍵的檢查拖太久才提出：部分達成', () => {
  const acts = idealActions(B).filter((a) => !(a.type === 'test' && a.id === 't-ecg')), i = acts.findIndex((a) => a.type === 'report');
  const late = scoreSession(B, run(B, [...acts.slice(0, i), ...times(watch, 11), { type: 'test', id: 't-ecg' }, ...acts.slice(i)]));
  assert.equal(late.safety, 'late');
  assert.ok(late.safetyNote.includes('心電圖'));
});

test('回報穩定的病人不會把醫師叫來', () => {
  const s = run(B, [...toDx(B), { type: 'report', a: 'a-msk', r: ['r-read', 'r-plan'] }]);
  assert.equal(s.calledAt, null);
  assert.ok(s.ordered.some((o) => o.id === 't-ecg'));
});

test('腫瘤那一位：關鍵的檢查是胸部 X 光；沒照就放回去要複核；搶著說出診斷會扣分', () => {
  assert.equal(C.answer.truth, 'tumor');
  const acts = idealActions(C);
  const noCxr = scoreSession(C, run(C, acts.filter((a) => !(a.type === 'test' && a.id === 't-cxr')).map((a) => (a.type === 'report' ? { ...a, r: a.r.filter((id) => id !== 'r-cxr') } : a))));
  assert.equal(noCxr.safety, 'review');
  assert.ok(noCxr.safetyNote.includes('胸部 X 光'));
  const blunt = acts.map((a) => (a.type === 'explain' ? { ...a, ids: ['e-why', 'e-warn', 'e-blunt'] } : a));
  assert.ok(row(C, blunt, 'explain').got < row(C, acts, 'explain').got);
  const s = run(C, acts);
  assert.ok(s.results.includes('t-cxr') && s.reads.some((r) => r.clue === 'c-cxr' && r.ok));
});

// ── 第二章：喘、腹痛 ──
test('三隻症影各有自己的四個真身、自己的檢查；同一隻底下的病例選項一樣', () => {
  assert.deepEqual(COMPLAINTS.map((m) => m.id), ['chest-pain', 'dyspnea', 'abdomen']);
  for (const m of COMPLAINTS) {
    const mine = CASES.filter((c) => c.complaint === m.id);
    assert.ok(mine.length >= 2, m.id);
    assert.equal(m.forms.length, 4);
    assert.ok(m.shadow.look, m.id + ' 沒有寫症影的樣子');
    const shape = (c: typeof A) => JSON.stringify([c.questions.map((q) => [q.id, q.label, q.ask]), c.exams.map((e) => [e.id, e.part, e.label]), c.tests.map((t) => [t.id, t.label])]);
    mine.forEach((c) => assert.equal(shape(c), shape(mine[0]), c.id));
    assert.equal(new Set(mine.map((c) => c.answer.truth)).size, mine.length, m.id + ' 有兩位病人是同一個真身');
    // 開場、病史、系統回顧每一隻都一樣；只有主訴那一段的問法不同
    const shared = (c: typeof A) => JSON.stringify(c.questions.filter((q) => q.group !== 'cc').map((q) => [q.id, q.ask]));
    assert.equal(shared(mine[0]), shared(A));
  }
});

test('喘：氣吐不出去的那一位，氧氣衝到最高是錯的；把它當成心臟也是錯的', () => {
  const E = caseById('c02b'), acts = idealActions(E);
  assert.equal(E.answer.truth, 'airway');
  const withHigh = acts.map((a) => (a.type === 'report' ? { ...a, r: [...a.r, 'r-o2high'] } : a));
  assert.ok(row(E, withHigh, 'care').got < row(E, acts, 'care').got);
  const asHeart = acts.map((a) => (a.type === 'report' ? { ...a, a: 'a-hf' } : a));
  assert.ok(row(E, asHeart, 'care').got < row(E, acts, 'care').got);
  // 下了診斷不通報一樣會變差
  assert.ok(run(E, [...toDx(E), ...times(watch, 4)]).worsenedAt !== null);
  // 慢慢變喘的那一位很穩定，不會變差
  assert.equal(run(caseById('c02a'), [...toDx(caseById('c02a')), ...times(watch, 12)]).worsenedAt, null);
});

test('腹痛：評估照看、聽、敲、摸的順序；讓病人吃東西或灌腸是錯的', () => {
  const F = caseById('c03a'), G = caseById('c03b');
  const abd = F.exams.filter((e) => e.part === '腹部').map((e) => e.id);
  assert.deepEqual(abd.slice(0, 4), ['x-abd-look', 'x-abd-perc', 'x-abd-light', 'x-abd-deep']);
  for (const [c, bad] of [[F, 'r-eat'], [G, 'r-enema']] as const) {
    const acts = idealActions(c), worse = acts.map((a) => (a.type === 'report' ? { ...a, r: [...a.r, bad] } : a));
    assert.ok(row(c, worse, 'care').got < row(c, acts, 'care').got, c.id);
  }
  // 只憑位置就下診斷、沒有把其他三個排除：需要複核
  const quick: Action[] = [ask('q-intro'), ask('q-location'), next, { type: 'vitals' }, exam('x-abd-deep'), next, dx(G), { type: 'test', id: 't-us' }, { type: 'explain', ids: ['e-why', 'e-warn'] }, { type: 'close' }];
  assert.equal(scoreSession(G, run(G, quick)).safety, 'review');
});

test('三隻症影的四個真身，每一個都有一位病人', () => {
  for (const m of COMPLAINTS) {
    const truths = CASES.filter((c) => c.complaint === m.id).map((c) => c.answer.truth).sort();
    assert.deepEqual(truths, m.forms.map((f) => f.id).sort(), m.id);
  }
  assert.equal(CASES.length, 12);
});

test('第二章不穩定的三位：下了診斷不通報會變差；穩定的三位不會', () => {
  for (const id of ['c02b', 'c02d', 'c03c']) {
    const c = caseById(id);
    assert.ok(run(c, [...toDx(c), ...times(watch, 4)]).worsenedAt !== null, id);
    assert.equal(scoreSession(c, run(c, [...toDx(c), ...times(watch, 10), { type: 'close' }])).safety, 'review', id);
  }
  for (const id of ['c02a', 'c02c', 'c03a', 'c03b', 'c03d']) {
    const c = caseById(id);
    assert.equal(run(c, [...toDx(c), ...times(watch, 12)]).worsenedAt, null, id);
  }
});

test('胰臟炎那一位：關鍵的檢查是抽血，結果這一關等得到；氣胸那一位：叫他起來深呼吸是錯的', () => {
  const P = caseById('c03c'), s = run(P, idealActions(P));
  assert.ok(s.results.includes('t-blood') && s.reads.some((r) => r.clue === 'c-blood' && r.ok));
  assert.ok(s.testRead);
  const X = caseById('c02d'), acts = idealActions(X);
  const worse = acts.map((a) => (a.type === 'report' ? { ...a, r: [...a.r, 'r-breathe'] } : a));
  assert.ok(row(X, worse, 'care').got < row(X, acts, 'care').got);
});

// ── 評分 ──
test('開場三件事和動手前的說明，都算在同意與說明那一項', () => {
  const open = ['q-wash', 'q-intro', 'q-explain'].map(ask);
  assert.equal(row(A, [...open, next, exam('x-heart', true)], 'consent').got, 10);
  assert.equal(row(A, [...open, next, exam('x-heart', false)], 'consent').got, 4);
  assert.equal(row(A, [ask('q-intro'), next, exam('x-heart', true)], 'consent').got, 7.3);
});

test('線索都解讀錯：證據那一項是零分', () => {
  const acts = idealActions(A);
  assert.equal(row(A, acts, 'evidence').got, 10);
  assert.equal(row(A, acts, 'evidence', true).got, 0);
});

test('沒問擔心什麼，就沒有那一句說明可以選', () => {
  assert.deepEqual(run(A, [next, next, dx(A), { type: 'explain', ids: ['e-why', 'e-concern'] }]).explained, ['e-why']);
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
test('提示跟著階段走，而且不講出真身', () => {
  assert.ok(hintFor(A, createSession(A)).includes('開場'));
  assert.ok(hintFor(A, run(A, A.questions.map((q) => ask(q.id)))).includes('評估'));
  assert.ok(hintFor(A, run(A, [next])).includes('血壓'));
  assert.ok(hintFor(A, run(A, [next, next])).includes('最可能'));
  assert.ok(hintFor(A, run(A, toDx(A))).includes('該讓誰知道'));
  assert.ok(hintFor(A, run(A, [...toDx(A), { type: 'call' }])).includes('心電圖'));
  assert.ok(hintFor(C, run(C, toDx(C))).includes('胸部 X 光'));
  for (const c of CASES) {
    assert.ok(hintFor(c, run(c, idealActions(c).slice(0, -1))).includes('提交'));
    for (const f of c.forms) assert.ok(!hintFor(c, run(c, [next, next])).includes(f.name));
  }
});

test('回顧：時間點照順序；看得出想法有沒有跟著線索變', () => {
  const s = run(A, idealActions(A)), m = moments(A, s);
  assert.ok(m.length >= 4);
  assert.deepEqual(m.map((k) => k.t), [...m.map((k) => k.t)].sort((a, b) => a - b));
  assert.ok(trajectory(A, s).verdict.includes('一開始的判斷就對了'));
  // 中途說是肌肉骨骼，下診斷的時候改成心因性
  let cur = createSession(A);
  for (const id of ['q-onset', 'q-character', 'q-assoc']) { cur = perform(A, cur, ask(id)).session; cur = perform(A, cur, { type: 'read', clue: cur.pending[0], form: 'cardiac' }).session; }
  cur = perform(A, cur, { type: 'commit', form: 'msk' }).session;
  for (const a of [next, next, dx(A, 'cardiac'), { type: 'close' } as Action]) cur = perform(A, cur, a).session;
  assert.ok(trajectory(A, cur).verdict.includes('跟著線索改了想法'));
  assert.ok(takeaways(A, cur, scoreSession(A, cur)).length <= 4);
});

test('可以寫進圖鑑的：解讀對的線索、有沒有認出真身', () => {
  const h = harvest(B, run(B, idealActions(B)));
  assert.ok(h.found && h.concern);
  assert.ok(h.reads.some((r) => r.form === 'msk' && r.dir === 1) && h.reads.some((r) => r.form === 'cardiac' && r.dir === -1));
  assert.equal(harvest(B, run(B, idealActions(B), true)).reads.length, 0);
});
