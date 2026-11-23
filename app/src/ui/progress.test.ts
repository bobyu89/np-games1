// 地點和終章的規則：什麼時候開、開了什麼、哪些東西不能被終章的病人影響
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import { NIGHT, NIGHT_REFS, NIGHT_TOTAL } from '../data/night.ts';
import { PLACES, placeOf, sceneName, whereOf } from '../data/places.ts';
import { ISLANDS } from '../data/islands.ts';
import { TIDES } from '../data/tides.ts';
import { AFTER, echoOf, eldersFor, homeOf, islandOf, BEATS, NIGHT_DONE, QUESTS, codexOf, finaleDone, finaleOpen, nextBeat, nightDone, peopleOf, pickTrial, placesOf, questName, towerOpen } from './progress.ts';
import type { Save } from './store.ts';
import { AXE, PASSED, axesLit, bardOf, cantoOpen, record, recordTrial } from './progress.ts';
import { CANTOS } from '../data/odyssey.ts';
import * as PROGRESS from './progress.ts';
import { idealActions, run } from '../core/autoplay.ts';
import { scoreSession } from '../core/scoring.ts';

const rec = { best: 90, safety: 'met' as const, plays: 1, seconds: 500, found: true, concern: true, reads: [] };
const save = (cases: string[], beats: string[] = []): Save => ({ v: 3, beats, cases: Object.fromEntries(cases.map((id) => [id, rec])), takeaways: [], hero: 'cheng', trials: [] });
const BOARD = QUESTS.map((q) => q.caseId), STORY = BEATS.map((b) => b.id).filter((id) => !id.startsWith('finale-'));

test('一劫一座島：每一張委託在它的主訴那座島的診間，除了出診；十二座島各一種劫影', () => {
  for (const q of QUESTS) {
    const c = CASES.find((k) => k.id === q.caseId)!, at = placeOf(c.scene);
    assert.ok(at === homeOf(c) || at === 'dock', c.id + ' 在 ' + at);
    assert.equal(ISLANDS[islandOf(c)].chapter, q.chapter, c.id + ' 的島跟章對不上');
  }
  const isles = COMPLAINTS.map((m) => islandOf({ complaint: m.id }));
  assert.equal(new Set(isles).size, 12); assert.equal(Object.keys(ISLANDS).length, 12);
  assert.equal(sceneName('market-rain'), '魚市口的診間（下雨天）'); assert.equal(sceneName('dock'), '碼頭的貨棧（出診）'); assert.equal(sceneName('tower'), '燈塔的值夜房');
  assert.ok(PLACES.ward.enter && PLACES.market.enter && PLACES.tower.enter);
  // 每一章在一座島；出診的貨棧，算在那一章的島
  for (const q of QUESTS) {
    const c = CASES.find((k) => k.id === q.caseId)!, isle = ISLANDS[islandOf(c)];
    assert.ok(whereOf(c.scene, homeOf(c)).startsWith(isle.name), c.id + '：' + whereOf(c.scene, homeOf(c)));
  }
});

test('歸鄉的消息：診斷對、也回應了擔心的事，才收到近況；四十八位都有一句', () => {
  for (const c of CASES.filter((k) => k.id !== FINALE_ID)) {
    assert.ok(AFTER[c.id], c.id + ' 沒有後來的近況');
    assert.ok(c.explain.some((e) => e.concern), c.id + ' 沒有回應擔心的那一句，永遠收不到回音');
  }
  assert.ok(echoOf({ found: true, concern: true }, '好了。').startsWith('歸鄉的消息'));
  assert.ok(echoOf({ found: true, concern: false }, '好了。').includes('前輩接手'));
  assert.ok(echoOf({ found: false, concern: true }, '好了。').includes('前輩接手'));
});

test('海神的風暴：每一章一場，用那一章看過的病人；先看的那一位在門口，對的交代剛好一句、三句差不多長', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const r = TIDES[n];
    assert.ok(r.arrivals.some((a) => a.id === r.first) && Object.keys(r.notes).length === r.arrivals.length);
    assert.equal(r.then.picks.filter((p) => p.ok).length, 1);
    const len = r.then.picks.map((p) => p.text.length);
    assert.ok(Math.max(...len) / Math.min(...len) <= 1.6, r.id + '：選項長度 ' + len.join('、'));
    const looks = QUESTS.filter((q) => q.chapter === n).map((q) => CASES.find((c) => c.id === q.caseId)!.patient.look);
    for (const a of r.arrivals) assert.ok(looks.includes(a.look), r.id + '：' + a.name + ' 不是這一章的病人');
    for (const t of r.teach) assert.ok(NIGHT_REFS.some((x) => x.id === t.ref), r.id + ' 的文獻 ' + t.ref);
  }
});

test('長老會：第五章走完先重新表決，再進終章；請教的名單跟著去過的島', () => {
  const ids = BEATS.map((b) => b.id);
  assert.ok(ids.indexOf('ch5-complete') < ids.indexOf('council') && ids.indexOf('council') < ids.indexOf('finale-open'));
  const none: Save = { v: 3, cases: {}, beats: [], hero: null, takeaways: [], trials: [] } as unknown as Save;
  assert.deepEqual(eldersFor(none), []);
  const ch1 = { ...none, cases: Object.fromEntries(QUESTS.filter((q) => q.chapter === 1).map((q) => [q.caseId, { best: 90, safety: 'met', plays: 1, seconds: 1, found: true, concern: true, reads: [] }])) } as unknown as Save;
  assert.deepEqual(eldersFor(ch1).sort(), ['lu', 'nie']);
  const all = { ...none, cases: Object.fromEntries(QUESTS.map((q) => [q.caseId, { best: 90, safety: 'met', plays: 1, seconds: 1, found: true, concern: true, reads: [] }])) } as unknown as Save;
  assert.equal(eldersFor(all).length, 5);
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

test('場景：每座島的診間，在那座島結過一張才打開；燈塔要到終章走完', () => {
  const open = (s: Save) => placesOf(s).filter((e) => e.open).map((e) => e.id);
  assert.deepEqual(open(save([])), ['hall']);
  assert.deepEqual(open(save(['c01a'])), ['hall', 'ward']);
  assert.deepEqual(open(save(['c01a', 'c01b', 'c01c', 'c01d', 'c02a'])), ['hall', 'ward', 'dock', 'wind']);
  assert.deepEqual(open(save([...BOARD, FINALE_ID])), ['hall', 'ward', 'dock', 'wind', 'market', 'sun', 'archive', 'yard', 'boar', 'whirl', 'lotus', 'circe', 'quiet', 'shade', 'tower']);
  assert.equal(placesOf(save(BOARD)).length, 15);
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

test('進門之前不先給方向：標題結案才出現、值班鐘那一句每一張出診都一樣、提問都是三題', () => {
  const c = CASES.find((k) => k.id === 'c02a')!;
  assert.equal(questName(c, false), c.patient.name, '結案之前，板子上只寫病人的名字');
  assert.equal(questName(c, true), c.title);
  const BELL = '值班鐘我帶來了，用不用由你決定。';
  for (const k of CASES) {
    const opening = k.lines.opening.join(''), dock = placeOf(k.scene) === 'dock';
    // 以前只有緊急的那幾張，蒙托拉才會提值班鐘；提了，就等於先說了這一張要敲
    assert.equal(opening.includes('值班鐘'), dock, k.id + '：只有出診會提值班鐘，而且每一張出診都提');
    if (dock) assert.ok(opening.includes(BELL), k.id + '：出診提值班鐘的那一句要一樣');
    assert.equal(k.reading.prompts.length, 3, k.id);
    assert.ok(k.reading.prompts[0].includes('最危險'), k.id + '：第一題都是最危險的可能');
  }
});

test('值班夜的一句話：三個選項差不多長，最長的那一句不會剛好是答案', () => {
  for (const r of NIGHT) {
    const len = r.then.picks.map((p) => p.text.length);
    assert.ok(Math.max(...len) / Math.min(...len) <= 2, r.id + '：選項的長度差太多（' + len.join('、') + '）');
  }
});

test('劫的記號：理想的打法結案，記下過了這一劫；掉進陷阱的那一場不記', () => {
  const c = CASES.find((k) => k.id === 'c01a')!, good = run(c, idealActions(c));
  const a = record(save([]), c, good, scoreSession(c, good), 600, null);
  assert.ok(a.beats.includes(PASSED(c.id)));
  const bad = { ...good, board: { ...good.board, exclude: [] } }, b = record(save([]), c, bad, scoreSession(c, bad), 600, null);
  assert.ok(!b.beats.includes(PASSED(c.id)));
  assert.equal(record(a, c, good, scoreSession(c, good), 600, null).beats.filter((x) => x === PASSED(c.id)).length, 1, '不重複記');
});

test('十二斧之試：試弓及格才亮那一種劫影的斧頭；終章走完之後，還沒亮的比較容易抽到', () => {
  const c = CASES.find((k) => k.id === 'c02a')!, good = run(c, idealActions(c)), sc = scoreSession(c, good);
  assert.ok(recordTrial(save([]), c, good, sc, 600, false, 1).beats.includes(AXE('dyspnea')));
  assert.ok(!recordTrial(save([]), c, good, { ...sc, total: 40 }, 600, false, 1).beats.includes(AXE('dyspnea')));
  const all = [...BOARD, FINALE_ID], lit = COMPLAINTS.filter((m) => m.id !== 'rash').map((m) => AXE(m.id));
  const s = save(all, lit), share = (x: Save) => { let n = 0; for (let i = 0; i < 1000; i++) if (pickTrial(x, i / 1000).complaint === 'rash') n++; return n / 1000; };
  assert.equal(axesLit(s).length, 11);
  assert.ok(share(s) > 0.25, '還沒亮的疹子應該比較容易抽到：' + share(s));
  assert.ok(share(save(BOARD, lit)) < 0.15, '終章走完之前不偏');
});

test('篇章：每一章的開場由斐米歐先唸那一篇的開場；英雄歸來要十二把斧頭都亮', () => {
  for (const [beat, canto] of [['ch2-open', 'tide'], ['ch3-open', 'book'], ['ch4-open', 'keel'], ['ch5-open', 'bamboo'], ['finale-open', 'home']]) {
    const b = BEATS.find((x) => x.id === beat)!;
    assert.equal(b.lines[0].who, 'mo', beat);
    assert.ok(b.lines[0].text.includes(bardOf(canto)), beat);
  }
  const done = save([...BOARD, FINALE_ID], [...STORY, NIGHT_DONE, 'finale-tower', 'finale-open', 'finale-complete']);
  const hero = BEATS.find((b) => b.id === 'axes-all')!;
  assert.equal(hero.when(done), false);
  assert.equal(hero.when({ ...done, beats: [...done.beats, ...COMPLAINTS.map((m) => AXE(m.id))] }), true);
  assert.equal(cantoOpen('main', save([])), true);
  assert.equal(cantoOpen('tide', save([])), false);
  assert.equal(cantoOpen('home', done), true);
  assert.equal(CANTOS.length, 14);
  for (const id of Object.keys(ISLANDS)) assert.equal(CANTOS.filter((k) => k.island === id).length, 1, id + ' 要剛好一篇');
});

test('下一步：每一個階段都只指一件事，而且按下去帶得到那裡', () => {
  const { nextStep, sideStep } = PROGRESS;
  // 第一次：接林秋那一張，說明一張委託要做什麼
  let n = nextStep(save([]), null);
  assert.deepEqual(n.action, { kind: 'quest', caseId: 'c01a', island: 'main' });
  assert.ok(n.title.includes('第一張') && n.why.includes('問診'));
  // 做到一半：先接著做
  assert.deepEqual(nextStep(save([]), { caseId: 'c01a', trial: false, closed: false }).action, { kind: 'resume' });
  assert.ok(nextStep(save([]), { caseId: 'c01a', trial: false, closed: true }).title.includes('回顧'));
  // 第一章走完：到下一座島，說明航海圖
  n = nextStep(save(['c01a', 'c01b', 'c01c', 'c01d']), null);
  assert.equal(n.action.kind, 'quest'); assert.ok(n.title.includes('巡診船') && n.why.includes('航海圖'));
  // 同一座島還有沒結的：說還剩幾張
  n = nextStep(save(['c01a']), null);
  assert.ok(n.why.includes('還有 3 張'));
  // 委託都結了 → 值班夜 → 燈塔 → 十二斧
  assert.equal(nextStep(save(BOARD, STORY), null).action.kind, 'night');
  assert.equal(nextStep(save(BOARD, [...STORY, NIGHT_DONE, 'finale-tower']), null).action.kind, 'tower');
  const end = save([...BOARD, FINALE_ID], [...STORY, NIGHT_DONE, 'finale-tower']);
  n = nextStep(end, null); assert.equal(n.action.kind, 'trial'); assert.ok(n.title.includes('12 把'));
  assert.equal(nextStep({ ...end, beats: [...end.beats, ...COMPLAINTS.map((m) => AXE(m.id))] }, null).action.kind, 'codex');
  // 選做的那一句：一章走完、風暴還沒推演，才提風暴；沒有就提試弓；都做過了就不說
  const ch2 = [...['c01a', 'c01b', 'c01c', 'c01d'], 'c02a', 'c02b', 'c02c', 'c02d', 'c03a', 'c03b', 'c03c', 'c03d'];
  assert.deepEqual(sideStep(save(ch2))?.action, { kind: 'tide', n: 2 });
  assert.equal(sideStep(save(['c01a', 'c01b', 'c01c', 'c01d']))?.action.kind, 'trial');
  assert.equal(sideStep(save([])), null);
});

test('你在哪裡：五章加終章，現在在哪一段、這一段做了幾張', () => {
  const { journey } = PROGRESS;
  let j = journey(save(['c01a']));
  assert.equal(j.legs.length, 6); assert.equal(j.now.key, 'ch1'); assert.equal(j.now.done, 1); assert.equal(j.now.total, 4); assert.equal(j.done, 1);
  assert.deepEqual(j.legs.map((l) => l.state), ['now', 'later', 'later', 'later', 'later', 'later']);
  j = journey(save(['c01a', 'c01b', 'c01c', 'c01d']));
  assert.equal(j.now.key, 'ch2'); assert.ok(j.now.place.includes('斯克里亞'));
  j = journey(save(BOARD, STORY));
  assert.equal(j.now.key, 'end'); assert.equal(j.legs.filter((l) => l.state === 'done').length, 5);
});

test('你的陷阱紀錄：委託和試弓都記；掉進去最多的排前面；只看最近一百場，紀錄留三百場', () => {
  const c = CASES.find((k) => k.complaint === 'chest-pain')!, good = run(c, idealActions(c));
  const bad = run(c, []);   // 什麼都沒做就結案：沒有下診斷，掉進獨眼巨人之劫
  const blank: Save = { v: 3, beats: [], cases: {}, takeaways: [], hero: 'cheng', trials: [] };
  let s = record(blank, c, bad, scoreSession(c, bad), 60, null, 1_800_000_000_000);
  s = recordTrial(s, c, good, scoreSession(c, good), 600, false, 1_800_000_100_000);
  s = record(s, c, bad, scoreSession(c, bad), 60, null, 1_800_000_200_000);
  const rows = PROGRESS.trapProfile(s);
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].peril.complaint, rows[0].trapped, rows[0].passed, rows[0].last], ['chest-pain', 2, 1, true]);
  assert.equal(s.days?.length, 1, '同一天');
  assert.equal(s.plays?.[1].trial, true, '試弓也記');
  for (let i = 0; i < 320; i++) s = record(s, c, good, scoreSession(c, good), 60, null, 1_800_001_000_000 + i);
  assert.equal(s.plays?.length, PROGRESS.PLAYS_KEPT);
  const after = PROGRESS.trapProfile(s);
  assert.equal(after[0].trapped + after[0].passed, PROGRESS.TRAPS_SHOWN);
  assert.equal(after[0].trapped, 0, '最近一百場都過了');
});
