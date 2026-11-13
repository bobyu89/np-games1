import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, caseById } from '../data/index.ts';
import { idealActions, run } from '../core/autoplay.ts';
import { scoreSession } from '../core/scoring.ts';
import { record } from './progress.ts';
import { mergeSaves, packSave, readBackup, sameSave, validRun } from './backup.ts';
import type { Run, Save } from './store.ts';

const blank = (): Save => ({ v: 3, beats: [], cases: {}, takeaways: [], hero: null, trials: [] });
/** 照最好的打法玩過幾關之後的存檔 */
const played = (ids: string[]): Save => ids.reduce<Save>((save, id) => { const c = caseById(id), s = run(c, idealActions(c)); return record(save, c, s, scoreSession(c, s), 600, '下次先量生命徵象'); }, { ...blank(), beats: ['prologue'], hero: 'du' });

test('匯出再匯入，進度一模一樣', () => {
  const save = played(['c01a', 'c02b', 'c07c', 'c11d']);
  const back = readBackup(packSave(save, 'test'), CASES);
  assert.ok(back.ok);
  assert.deepEqual(back.save, save);
  assert.equal(back.dropped, 0);
});

test('48 關都玩過的進度，匯出的文字短到可以複製貼上', () => {
  const text = packSave(played(CASES.map((c) => c.id)), 'test');
  assert.ok(text.length < 20_000, '現在是 ' + text.length + ' 個字');
  assert.ok(!text.includes('胸'), '線索的文字不應該在裡面');
});

test('不是進度的東西讀不進來，而且說得出原因', () => {
  for (const junk of ['', '你好', '{', '[]', '{"app":"other","kind":"save","v":3}', JSON.stringify({ app: 'mist-guild', kind: 'save', v: 2, cases: {} })]) {
    const r = readBackup(junk, CASES);
    assert.equal(r.ok, false, junk);
    assert.ok(!r.ok && r.why.length > 0);
  }
  const newer = readBackup(JSON.stringify({ app: 'mist-guild', kind: 'save', v: 5, cases: {} }), CASES);   // 現在的格式是第 4 版
  assert.ok(!newer.ok && newer.why.includes('更新'));
});

test('亂填的欄位會被修掉；這一版沒有的病例和線索略過', () => {
  const raw = { app: 'mist-guild', kind: 'save', v: 3, at: 'not a date', build: 'x', hero: 42, beats: ['prologue', 7, 'prologue'], takeaways: ['a', 'b', 'c', 'd', 'e', 'f'],
    cases: { c01a: [250, 9, -3, 'x', 1, 0, ['no-such-clue', caseById('c01a').clues.find((k) => k.tell)!.id]], c99z: [90, 0, 1, 10, 1, 1, []], c01b: 'nope' } };
  const r = readBackup(JSON.stringify(raw), CASES);
  assert.ok(r.ok);
  assert.equal(r.at, null);
  assert.equal(r.dropped, 2);
  assert.equal(r.save.hero, null);
  assert.deepEqual(r.save.beats, ['prologue']);
  assert.equal(r.save.takeaways.length, 5);
  const a = r.save.cases.c01a;
  assert.deepEqual([a.best, a.safety, a.plays, a.seconds, a.found, a.concern, a.reads.length], [100, 'review', 1, 0, true, false, 1]);
  assert.equal(Object.keys(r.save.cases).length, 1);
});

test('還沒結案的那一場：內容對得上才接著做', () => {
  const c = caseById('c06c'), actions = idealActions(c), half = run(c, actions.slice(0, Math.floor(actions.length / 2)), false, 1);
  const mine: Run = { v: 1, caseId: c.id, session: half, seconds: 120, at: 0 };
  assert.ok(validRun(c, JSON.parse(JSON.stringify(mine)) as Run), '存進去再讀出來還是可以用');
  assert.equal(validRun(caseById('c06d'), mine), false, '不是這一張委託');
  assert.equal(validRun(undefined, mine), false);
  assert.equal(validRun(c, null), false);
  assert.equal(validRun(c, { ...mine, session: { ...half, asked: [...half.asked, 'q-removed'] } }), false, '提到這一版沒有的題目');
  assert.equal(validRun(c, { ...mine, session: { ...half, board: { ...half.board, likely: 'no-such-form' } } }), false);
  assert.equal(validRun(c, { ...mine, session: { caseId: c.id } as never }), false, '壞掉的資料');
});

test('兩台的進度併起來：每個病例留比較好的那一次，線索和故事兩邊加起來', () => {
  const phone = played(['c01a', 'c01b']), laptop = played(['c01a', 'c02a']);
  // 手機上的 c01a 分數比較低、少解讀一條線索；筆電上的沒有回應病人在意的事
  phone.cases.c01a = { ...phone.cases.c01a, best: 61, safety: 'late', plays: 3, reads: phone.cases.c01a.reads.slice(1) };
  laptop.cases.c01a = { ...laptop.cases.c01a, concern: false, plays: 1 };
  phone.beats = ['prologue', 'ch1-second']; laptop.beats = ['prologue', 'ch2-open'];
  phone.takeaways = ['先量生命徵象']; laptop.takeaways = ['先量生命徵象', '問完再下診斷'];
  const merged = mergeSaves(phone, laptop);
  assert.deepEqual(Object.keys(merged.cases).sort(), ['c01a', 'c01b', 'c02a']);
  assert.equal(merged.cases.c01a.best, laptop.cases.c01a.best);
  assert.equal(merged.cases.c01a.safety, laptop.cases.c01a.safety);
  assert.equal(merged.cases.c01a.plays, 3);
  assert.equal(merged.cases.c01a.concern, true, '有一台回應過，就算回應過');
  assert.equal(merged.cases.c01a.reads.length, laptop.cases.c01a.reads.length, '少的那一條從另一台補回來');
  assert.deepEqual([...merged.beats].sort(), ['ch1-second', 'ch2-open', 'prologue']);
  assert.deepEqual(merged.takeaways, ['先量生命徵象', '問完再下診斷']);
  assert.equal(merged.hero, phone.hero);
});

test('併的順序不影響結果；併過的再併一次不會變', () => {
  const a = played(['c01a', 'c03b', 'c09c']), b = played(['c01a', 'c05d']);
  a.cases.c01a = { ...a.cases.c01a, best: 40, plays: 2 };
  const ab = mergeSaves(a, b), ba = mergeSaves(b, a);
  assert.ok(sameSave(ab, ba));
  assert.ok(sameSave(mergeSaves(ab, b), ab));
  assert.ok(sameSave(mergeSaves(a, ab), ab));
  assert.ok(!sameSave(a, ab));
  // 新的裝置（什麼都沒有）登入之後，拿到的就是雲端那一份，主角也跟著過來
  const fresh = mergeSaves(blank(), ab);
  assert.ok(sameSave(fresh, ab));
  assert.equal(fresh.hero, ab.hero);
  // 經過匯出、匯入（雲端存的就是匯出的格式）還是同一份
  const back = readBackup(packSave(ab, 'test'), CASES);
  assert.ok(back.ok && sameSave(back.save, ab));
});

test('資格試煉的紀錄：匯出匯入帶得走，兩台併起來不會重複；舊格式（第 3 版）照樣讀得進來，更新的版本不讀', () => {
  const t1 = { at: 1_800_000_000_000, caseId: 'c01a', score: 72, safety: 'met' as const, seconds: 840, timeUp: false, found: true };
  const t2 = { at: 1_800_000_500_000, caseId: 'c07b', score: 41, safety: 'review' as const, seconds: 900, timeUp: true, found: false };
  const a: Save = { ...played(['c01a']), trials: [t1] }, b: Save = { ...played(['c01a']), trials: [t2, t1] };
  const back = readBackup(packSave(b, 'test'), CASES);
  assert.ok(back.ok);
  assert.deepEqual(back.save.trials, [t2, t1]);
  const merged = mergeSaves(a, b);
  assert.deepEqual(merged.trials, [t2, t1], '同一場只留一筆，新的在前面');
  assert.ok(sameSave(mergeSaves(b, a), merged));
  assert.ok(!sameSave(a, merged));
  // 第 3 版：沒有 trials 這一欄
  const old = JSON.parse(packSave(a, 'test')); old.v = 3; delete old.trials;
  const v3 = readBackup(JSON.stringify(old), CASES);
  assert.ok(v3.ok && v3.save.trials.length === 0 && !!v3.save.cases.c01a);
  // 比這一版新的：不讀，免得把看不懂的東西丟掉
  const newer = JSON.parse(packSave(a, 'test')); newer.v = 5;
  assert.equal(readBackup(JSON.stringify(newer), CASES).ok, false);
  // 這一版沒有的病例的試煉紀錄會略過
  const odd = JSON.parse(packSave(a, 'test')); odd.trials.push([1_800_000_900_000, 'c99z', 50, 0, 600, 0, 1], 'junk', [0, 'c01a', 50, 0, 600, 0, 1]);
  const r = readBackup(JSON.stringify(odd), CASES);
  assert.ok(r.ok && r.save.trials.length === 1);
});
