// 規則核心的測試。執行：node --test game/core/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { RULES } from './rules.js';
import { createGame, perform, interviewMenu, examMenu, diagnosisGate, mainDiagnosis, workupMenu } from './engine.js';
import { scoreGame, reviewGame } from './scoring.js';
import { playByTheBook, playBreadthOnly, playStalling } from './autoplay.js';

const data = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const readJson = (p) => JSON.parse(readFileSync(join(data, p), 'utf8'));
const tax = readJson('taxonomy.json');
const demo = readJson('cases/im-cv-demo-001.json');

function started(mode = 'osce', systems = ['cv', 'resp', 'gi', 'msk']) {
  const g = createGame(demo, tax, { mode });
  assert.equal(perform(g, { type: 'begin' }).ok, true);
  assert.equal(perform(g, { type: 'select_systems', systems }).ok, true);
  return g;
}
const askAll = (g) => tax.facets.forEach((f) => perform(g, { type: 'ask', facet: f.id }));
const mainId = (g) => mainDiagnosis(g).id;

test('開場：急症從 60 血開始，面紗 100%，練習模式掉血比較慢', () => {
  const osce = createGame(demo, tax, { mode: 'osce' });
  const practice = createGame(demo, tax, { mode: 'practice' });
  assert.equal(osce.hp, 60);
  assert.equal(osce.veil, 100);
  assert.equal(osce.drain, 5);
  assert.equal(practice.drain, 3);
  assert.equal(osce.phase, 'intro');
});

test('階段順序：還沒選系統不能問診，還沒診斷不能開檢查', () => {
  const g = createGame(demo, tax, { mode: 'osce' });
  assert.equal(perform(g, { type: 'ask', facet: 'location' }).ok, false);
  perform(g, { type: 'begin' });
  assert.equal(perform(g, { type: 'ask', facet: 'location' }).ok, false);
  assert.equal(perform(g, { type: 'select_systems', systems: [] }).reason, 'none_selected');
  perform(g, { type: 'select_systems', systems: ['cv'] });
  assert.equal(g.phase, 'encounter');
  assert.equal(perform(g, { type: 'order', test: 'ecg' }).ok, false);
  assert.equal(g.turn, 0, '不合規則的操作不花回合');
});

test('系統選擇不花回合；練習模式會補上漏掉的核心系統，OSCE 不會', () => {
  const p = createGame(demo, tax, { mode: 'practice' });
  perform(p, { type: 'begin' });
  const out = perform(p, { type: 'select_systems', systems: ['cv', 'heent'] });
  assert.deepEqual(out.feedback.coreMissed, ['resp']);
  assert.deepEqual(out.feedback.extras, ['heent']);
  assert.ok(p.systems.active.includes('resp'));
  assert.deepEqual(p.systems.picked, ['cv', 'heent']);
  assert.equal(p.turn, 0);

  const o = createGame(demo, tax, { mode: 'osce' });
  perform(o, { type: 'begin' });
  const out2 = perform(o, { type: 'select_systems', systems: ['cv'] });
  assert.equal(out2.feedback, undefined, 'OSCE 不給即時回饋');
  assert.ok(!o.systems.active.includes('resp'));
  assert.equal(perform(o, { type: 'exam', item: 'resp-breath' }).reason, 'system_not_selected');
});

test('第一次問某個面向：回血、面紗變薄，然後主訴讓病人掉血', () => {
  const g = started();
  const out = perform(g, { type: 'ask', facet: 'location' });
  const heal = RULES.heal.facetBase + RULES.heal.facetPerWeight * demo.interview.location.weight;
  assert.equal(out.heal, heal);
  assert.equal(out.drain, 5);
  assert.equal(g.hp, 60 + heal - 5);
  assert.ok(g.veil < 100);
  assert.ok(out.tags.includes('clue'));
  assert.equal(g.turn, 1);
  assert.equal(g.clues.length, 1);
});

test('重複問不回血，算浪費一回合', () => {
  const g = started();
  perform(g, { type: 'ask', facet: 'location' });
  const hp = g.hp, veil = g.veil;
  const out = perform(g, { type: 'ask', facet: 'location' });
  assert.equal(out.heal, 0);
  assert.equal(g.hp, hp - 5);
  assert.equal(g.veil, veil);
  assert.ok(out.tags.includes('repeat') && out.tags.includes('wasted'));
  assert.equal(g.wasted.length, 1);
});

test('13 個面向第一次問都不會吃虧（OSCE 模式每一題回血都不少於掉血）', () => {
  for (const f of tax.facets) {
    const heal = RULES.heal.facetBase + RULES.heal.facetPerWeight * demo.interview[f.id].weight;
    assert.ok(heal >= RULES.acuity[demo.acuity].drain, f.name);
  }
});

test('規則保證：不管多急，價值最低的面向第一次問也不會讓血量倒扣', () => {
  const least = RULES.heal.facetBase + RULES.heal.facetPerWeight * 1;
  for (const [name, a] of Object.entries(RULES.acuity)) assert.ok(least >= a.drain, name);
});

test('追問：要先問過那個面向；關鍵線索大回血；問不到東西算浪費', () => {
  const g = started();
  assert.equal(perform(g, { type: 'follow_up', facet: 'location', index: 0 }).reason, 'not_asked');
  perform(g, { type: 'ask', facet: 'location' });
  const key = perform(g, { type: 'follow_up', facet: 'location', index: 0 });
  assert.ok(key.tags.includes('key'));
  assert.equal(key.heal, RULES.heal.followKeyBase + RULES.heal.followKeyPerWeight * 3);

  perform(g, { type: 'ask', facet: 'relieving' });
  const empty = perform(g, { type: 'follow_up', facet: 'relieving', index: 0 });
  assert.equal(empty.heal, 0);
  assert.ok(empty.tags.includes('empty') && empty.tags.includes('wasted'));
});

test('一整區問齊有額外回血', () => {
  const g = started();
  const past = tax.facets.filter((f) => f.zone === 'past');
  let last;
  for (const f of past) last = perform(g, { type: 'ask', facet: f.id });
  assert.ok(last.tags.includes('zone'));
  assert.equal(last.zone, '過去病史');
  assert.equal(last.heal, RULES.heal.facetBase + RULES.heal.facetPerWeight * demo.interview.social.weight + RULES.heal.zoneComplete);
});

test('系統回顧只回答選到的系統', () => {
  const g = started('osce', ['cv']);
  const out = perform(g, { type: 'ask', facet: 'ros' });
  const text = out.lines[1].text;
  assert.ok(text.includes('心血管：'));
  assert.ok(!text.includes('呼吸：'));
});

test('身體評估：相關的回血，不相關的算浪費，順序不對會被記下來', () => {
  const g = started();
  const heart = perform(g, { type: 'exam', item: 'cv-heart' });      // 聽診先做
  assert.ok(heart.tags.includes('clue') && heart.tags.includes('in_order'));
  const jvp = perform(g, { type: 'exam', item: 'cv-jvp' });          // 再回頭視診：順序不對
  assert.ok(jvp.tags.includes('out_of_order'));
  assert.equal(jvp.heal, RULES.heal.examBase + RULES.heal.examPerWeight * 1);
  const carotid = perform(g, { type: 'exam', item: 'cv-carotid' });  // 病例沒列：不相關
  assert.equal(carotid.heal, 0);
  assert.ok(carotid.tags.includes('wasted'));
  assert.equal(carotid.lines[1].text, tax.exam_items.find((x) => x.id === 'cv-carotid').normal);
  const vitals = perform(g, { type: 'exam', item: 'gen-vitals' });   // 一般項目不算順序
  assert.ok(!vitals.tags.includes('in_order') && !vitals.tags.includes('out_of_order'));
});

test('腹部的順序是視診、聽診、叩診、觸診', () => {
  const g = started();
  perform(g, { type: 'exam', item: 'gi-palpation' });
  const bowel = perform(g, { type: 'exam', item: 'gi-bowel' });
  assert.ok(bowel.tags.includes('out_of_order'), '觸診之後才聽診，順序不對');
});

test('練習模式：13 個面向沒問完不能提出診斷；OSCE 不擋', () => {
  const p = started('practice');
  const blocked = perform(p, { type: 'diagnose', main: mainId(p), differentials: [] });
  assert.equal(blocked.reason, 'facets_missing');
  assert.equal(blocked.missing.length, 13);
  assert.equal(p.turn, 0);
  askAll(p);
  assert.equal(diagnosisGate(p).ok, true);
  assert.equal(perform(p, { type: 'diagnose', main: mainId(p), differentials: [] }).ok, true);

  const o = started('osce');
  assert.equal(diagnosisGate(o).ok, true);
});

test('診斷正確：面紗全開，進入檢查檢驗', () => {
  const g = started();
  askAll(g);
  const out = perform(g, { type: 'diagnose', main: mainId(g), differentials: ['pe', 'dissection'] });
  assert.equal(out.correct, true);
  assert.equal(g.veil, 0);
  assert.equal(g.phase, 'workup');
  assert.ok(out.tags.includes('reveal'));
});

test('診斷錯誤：練習模式大扣血、可以再試；OSCE 只有一次機會', () => {
  const p = started('practice');
  askAll(p);
  const hp = p.hp;
  const wrong = perform(p, { type: 'diagnose', main: 'gerd', differentials: [] });
  assert.equal(wrong.correct, false);
  assert.equal(p.hp, hp + RULES.heal.diagnosisWrong - p.drain);
  assert.equal(p.phase, 'encounter');
  assert.equal(perform(p, { type: 'diagnose', main: mainId(p), differentials: [] }).correct, true);

  const o = started('osce');
  askAll(o);
  perform(o, { type: 'diagnose', main: 'gerd', differentials: [] });
  assert.equal(o.phase, 'lost');
  assert.equal(o.lost, 'diagnosis');
  assert.equal(scoreGame(o).stars, 0);
});

test('檢查檢驗：必要的都開了才康復；不必要的算浪費', () => {
  const g = started();
  askAll(g);
  perform(g, { type: 'diagnose', main: mainId(g), differentials: [] });
  const junk = perform(g, { type: 'order', test: 'ck-mb' });
  assert.equal(junk.heal, 0);
  assert.ok(junk.tags.includes('wasted'));
  assert.equal(g.phase, 'workup');
  const ecg = perform(g, { type: 'order', test: 'ecg' });
  assert.equal(ecg.heal, RULES.heal.workupNecessary);
  assert.equal(g.phase, 'workup');
  const tn = perform(g, { type: 'order', test: 'hs-ctn' });
  assert.ok(tn.tags.includes('recovered'));
  assert.equal(tn.drain, 0, '康復的那一回合不再掉血');
  assert.equal(g.phase, 'won');
  assert.equal(perform(g, { type: 'order', test: 'cxr' }).reason, 'over');
  assert.equal(workupMenu(g).filter((w) => w.ordered).length, 3);
});

test('血量歸零：病況惡化，這一關失敗', () => {
  const g = playStalling(demo, tax, 'osce');
  assert.equal(g.phase, 'lost');
  assert.equal(g.lost, 'hp');
  assert.equal(g.hp, 0);
  assert.equal(scoreGame(g).won, false);
});

test('照規矩做一定撐得住，而且拿三顆星（兩種模式）', () => {
  for (const mode of ['practice', 'osce']) {
    const g = playByTheBook(demo, tax, mode);
    assert.equal(g.phase, 'won', mode);
    assert.ok(g.minHp >= 30, mode + ' 最低血量 ' + g.minHp);
    const s = scoreGame(g);
    assert.equal(s.stars, 3, mode + ' ' + s.total + ' 分');
    assert.equal(g.wasted.length, 0);
  }
});

test('只問完 13 個面向、不追問不評估，也能康復，但分數比較低', () => {
  const lazy = playBreadthOnly(demo, tax, 'osce');
  const full = playByTheBook(demo, tax, 'osce');
  assert.equal(lazy.phase, 'won');
  assert.ok(scoreGame(lazy).total < scoreGame(full).total);
});

test('同樣的操作一定得到同樣的結果', () => {
  const a = playByTheBook(demo, tax, 'osce');
  const b = playByTheBook(demo, tax, 'osce');
  assert.deepEqual(a.log, b.log);
  assert.equal(a.hp, b.hp);
});

test('計分：六個軸加起來是 100 分', () => {
  const s = scoreGame(playByTheBook(demo, tax, 'osce'));
  assert.equal(s.axes.reduce((n, a) => n + a.max, 0), 100);
  assert.equal(s.axes.length, 6);
  assert.ok(s.total <= 100);
});

test('檢討：列出漏掉的面向、浪費的回合，和支持主診斷的線索', () => {
  const g = started('osce', ['cv']);
  perform(g, { type: 'ask', facet: 'location' });
  perform(g, { type: 'ask', facet: 'location' });
  perform(g, { type: 'diagnose', main: mainId(g), differentials: ['uti'] });
  const r = reviewGame(g);
  assert.equal(r.missedFacets.length, 12);
  assert.equal(r.wasted.length, 1);
  assert.ok(r.main.supportedBy.length >= 3);
  assert.equal(r.systems.core.find((s) => s.name === '呼吸').picked, false);
  assert.ok(r.differential.find((d) => d.name === '泌尿道感染').chosen);
});

test('畫面用的查詢：問診選單、身體評估選單', () => {
  const g = started('osce', ['cv']);
  const zones = interviewMenu(g);
  assert.deepEqual(zones.map((z) => z.facets.length), [8, 4, 1]);
  assert.equal(zones[0].facets[0].followUps.length, 0, '還沒問過就看不到追問');
  perform(g, { type: 'ask', facet: 'location' });
  assert.equal(interviewMenu(g)[0].facets[0].followUps.length, 2);
  const groups = examMenu(g);
  assert.deepEqual(groups.map((x) => x.system.id), ['general', 'cv']);
});
