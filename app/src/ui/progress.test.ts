// 地點和終章的規則：什麼時候開、開了什麼、哪些東西不能被終章的病人影響
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import { NIGHT, NIGHT_REFS, NIGHT_TOTAL } from '../data/night.ts';
import { PLACES, placeOf, sceneName } from '../data/places.ts';
import { BEATS, CHAPTER_PLACE, NIGHT_DONE, QUESTS, codexOf, finaleDone, finaleOpen, nextBeat, nightDone, peopleOf, pickTrial, placesOf, towerOpen } from './progress.ts';
import type { Save } from './store.ts';

const rec = { best: 90, safety: 'met' as const, plays: 1, seconds: 500, found: true, concern: true, reads: [] };
const save = (cases: string[], beats: string[] = []): Save => ({ v: 3, beats, cases: Object.fromEntries(cases.map((id) => [id, rec])), takeaways: [], hero: 'cheng', trials: [] });
const BOARD = QUESTS.map((q) => q.caseId), STORY = BEATS.map((b) => b.id).filter((id) => !id.startsWith('finale-'));

test('每一章的委託都在那一章的地方，除了出診', () => {
  for (const q of QUESTS) {
    const c = CASES.find((k) => k.id === q.caseId)!, at = placeOf(c.scene);
    assert.ok(at === CHAPTER_PLACE[q.chapter as 1 | 2 | 3 | 4 | 5] || at === 'dock', c.id + ' 在 ' + at);
  }
  assert.equal(sceneName('market-rain'), '魚市口的診間（下雨天）'); assert.equal(sceneName('dock'), '碼頭的貨棧（出診）'); assert.equal(sceneName('tower'), '燈塔的值夜房');
  assert.ok(!PLACES.ward.enter && PLACES.market.enter && PLACES.tower.enter);
});

test('終章不在委託板上：照 第五章走完 → 值班夜 → 聽完那一段 → 燈塔 的順序打開', () => {
  assert.ok(!BOARD.includes(FINALE_ID) && BOARD.length === 48);
  const almost = save(BOARD.slice(0, 47), STORY);
  assert.ok(!finaleOpen(almost) && !nightDone({ ...almost, beats: [...STORY, NIGHT_DONE] }));
  let s = save(BOARD, STORY);
  assert.ok(finaleOpen(s) && !nightDone(s) && !towerOpen(s) && !finaleDone(s));
  assert.equal(nextBeat(s)?.id, 'finale-open');
  s = { ...s, beats: [...s.beats, 'finale-open'] };
  assert.equal(nextBeat(s), undefined);                       // 值班夜還沒走，故事在這裡等
  s = { ...s, beats: [...s.beats, NIGHT_DONE] };
  assert.ok(nightDone(s) && !towerOpen(s));                   // 還沒聽送燈油的人帶來的話
  assert.equal(nextBeat(s)?.id, 'finale-tower');
  s = { ...s, beats: [...s.beats, 'finale-tower'] };
  assert.ok(towerOpen(s) && !finaleDone(s)); assert.equal(nextBeat(s), undefined);
  s = { ...s, cases: { ...s.cases, [FINALE_ID]: rec } };
  assert.ok(finaleDone(s)); assert.equal(nextBeat(s)?.id, 'finale-complete');
});

test('終章的病人不會被試煉抽到，遇到之前也不占圖鑑的分母', () => {
  const s = save(BOARD, STORY);
  for (let i = 0; i < 400; i++) assert.notEqual(pickTrial(s, i / 400).id, FINALE_ID);
  const chest = COMPLAINTS.find((m) => m.id === 'chest-pain')!;
  assert.equal(codexOf(chest, s).cases.length, 4);
  assert.equal(codexOf(chest, { ...s, cases: { ...s.cases, [FINALE_ID]: rec } }).cases.length, 5);
  // 人物：她在公會的人那一欄，不在病人那一欄
  const { guild, patients } = peopleOf({ ...s, cases: { ...s.cases, [FINALE_ID]: rec } });
  assert.equal(patients.length, 48); assert.ok(guild.some((e) => e.id === 'dong' && e.shot.scene === 'tower'));
});

test('場景：公會的五個診間一章開一個；燈塔要到終章走完', () => {
  const open = (s: Save) => placesOf(s).filter((e) => e.open).map((e) => e.id);
  assert.deepEqual(open(save([])), ['hall']);
  assert.deepEqual(open(save(['c01a'])), ['hall', 'ward']);
  assert.deepEqual(open(save(['c01a', 'c01b', 'c01c', 'c01d', 'c02a'])), ['hall', 'ward', 'dock', 'market']);
  assert.deepEqual(open(save([...BOARD, FINALE_ID])), ['hall', 'ward', 'dock', 'market', 'archive', 'yard', 'quiet', 'tower']);
  assert.equal(placesOf(save(BOARD)).length, 8);
});

test('值班夜的三輪：每一輪剛好一位該先看、剛好一句對的，回饋和文獻都對得上', () => {
  assert.equal(NIGHT.length, 3); assert.equal(NIGHT_TOTAL, 6);
  const looks = new Set<string>();
  for (const n of NIGHT) {
    assert.ok(n.arrivals.length >= 2 && n.arrivals.some((a) => a.id === n.first), n.id);
    n.arrivals.forEach((a) => { assert.ok(n.notes[a.id], n.id + ' 少了選 ' + a.name + ' 的回饋'); assert.ok(!looks.has(a.look), '同一張臉用了兩次：' + a.look); looks.add(a.look); assert.ok(a.says && a.see); });
    assert.ok(n.notes[n.first].startsWith('對。'));
    assert.equal(n.then.picks.filter((k) => k.ok).length, 1, n.id); assert.equal(n.then.picks.length, 3);
    n.teach.forEach((t) => assert.ok(NIGHT_REFS.some((r) => r.id === t.ref), t.ref));
    assert.ok(n.intro.length && n.after.length);
  }
  // 對的那一句不能每一輪都在同一個位置
  assert.ok(new Set(NIGHT.map((n) => n.then.picks.findIndex((k) => k.ok))).size > 1);
  NIGHT_REFS.forEach((r) => assert.match(r.doi, /^10\.\d{4,}\//));
  assert.ok(NIGHT_REFS.every((r) => NIGHT.some((n) => n.teach.some((t) => t.ref === r.id))), '有沒被引用的文獻');
});
