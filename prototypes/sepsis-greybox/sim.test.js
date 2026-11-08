// 執行：node --test prototypes/sepsis-greybox/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./data.js');
const Sim = require('./sim.js');

const board = (...ids) => {
  const b = Array(D.COMBAT.slots).fill(null);
  ids.forEach((id, i) => { b[i] = id; });
  return b;
};
const wave = (r) => D.WAVES[r - 1];
const run = (r, b, extra) => Sim.simulateCombat(Object.assign({ wave: wave(r), board: b, data: D, seed: 42 }, extra || {}));

const FULL = ['rn_lactate', 'ipc_culture', 'resident', 'rn_fluid', 'senior_rn'];

test('同樣的 seed 得到完全一樣的結果（可重現）', () => {
  const b = board(...FULL, 'np');
  assert.deepEqual(run(4, b), run(4, b));
  const r1 = Sim.createRng(7);
  const r2 = Sim.createRng(7);
  for (let i = 0; i < 20; i++) assert.equal(r1.next(), r2.next());
});

test('Hour-1 羈絆只算不重複元素', () => {
  const t = Sim.computeTraits(board('resident', 'resident', 'resident'), D, []);
  assert.equal(t.bundle.count, 1);
  assert.equal(t.bundle.tier, 0);
  const full = Sim.computeTraits(board(...FULL), D, []);
  assert.equal(full.bundle.count, 5);
  assert.equal(full.bundle.tier, 2);
  assert.deepEqual(full.bundle.missing, []);
});

test('NP 同時算評估型和協調型', () => {
  const t = Sim.computeTraits(board('np', 'rn_lactate', 'pharmacist'), D, []);
  assert.equal(t.roles.assessor.count, 2);
  assert.equal(t.roles.coordinator.count, 2);
  assert.equal(t.roles.assessor.tier, 1);
  assert.equal(t.roles.coordinator.tier, 1);
});

test('快速反應小組讓評估型門檻 −1', () => {
  const t = Sim.computeTraits(board('rn_lactate'), D, ['rrt']);
  assert.deepEqual(t.roles.assessor.thresholds, [1, 2]);
  assert.equal(t.roles.assessor.tier, 1);
});

test('先培養再給抗生素才有加成；順序反過來沒有', () => {
  const good = run(2, board('ipc_culture', 'resident'));
  assert.equal(good.metrics.cultureBeforeAbx, true);
  const bad = run(2, board('resident', 'ipc_culture'));
  assert.equal(bad.metrics.cultureBeforeAbx, false);
});

test('septic shock 回合：抗生素超過 60 分鐘要扣分；非休克回合不扣', () => {
  // 第 5 位第一次出手在 75 分鐘
  const late = run(3, board('rn_lactate', 'ipc_culture', 'rn_fluid', 'senior_rn', 'resident'));
  assert.equal(late.metrics.abxAt, 75);
  assert.ok(late.penalties.some((p) => p.id === 'abxLate'));
  const nonShock = run(2, board('rn_lactate', 'ipc_culture', 'rn_fluid', 'rt', 'resident'));
  assert.ok(!nonShock.penalties.some((p) => p.id === 'abxLate'));
});

test('NP 預立特定醫療流程：有醫師才發動，並讓隊友提早出手', () => {
  const withDoc = run(3, board('np', 'rn_lactate', 'ipc_culture', 'rn_fluid', 'resident'));
  assert.equal(withDoc.metrics.protocolAt, 15);
  assert.equal(withDoc.metrics.abxAt, 60); // 75 − 15
  assert.equal(withDoc.metrics.abxOnTime, true);
  const noDoc = run(3, board('np', 'rn_lactate', 'ipc_culture', 'rn_fluid', 'senior_rn'));
  assert.equal(noDoc.metrics.protocolBlocked, true);
  assert.equal(noDoc.metrics.protocolAt, null);
});

test('沒量測的乳酸不能被處置，而且輸液前會一直上升', () => {
  const r = run(2, board('ipc_culture', 'resident', 'rt', 'rt'));
  assert.equal(r.metrics.lactateMeasured, false);
  const lac = r.remaining.find((e) => e.kind === 'lactate');
  assert.ok(lac, '乳酸堆積應該還在');
  assert.ok(lac.hp > wave(2).lactateHp, '沒開始輸液，乳酸應該上升');
});

test('評估：qSOFA 在第 1 回合是 poor，誤判會減少揭露', () => {
  const w = wave(1);
  const allAbn = w.params.filter((p) => p.abnormal).map((p) => p.id);
  const q = Sim.evaluateAssessment(w, 'qsofa', allAbn, [], D);
  assert.equal(q.quality, 'poor');
  assert.equal(q.reveal, Math.min(q.total, Math.floor(allAbn.length / 2)));
  const n = Sim.evaluateAssessment(w, 'news2', allAbn, [], D);
  assert.equal(n.quality, 'good');
  assert.ok(n.reveal > q.reveal);
  // 第 2 回合有 5 個敵人，揭露數不會被上限卡住：2（工具）+ 2（4 項正確 ÷ 2）= 4
  const w2 = wave(2);
  const four = ['temp', 'hr', 'rr', 'lac'];
  const base = Sim.evaluateAssessment(w2, 'news2', four, [], D);
  assert.equal(base.reveal, 4);
  const withFalse = Sim.evaluateAssessment(w2, 'news2', four.concat(['bp']), [], D);
  assert.equal(withFalse.falseFlags.length, 1);
  assert.equal(withFalse.reveal, 3);
  const withAlert = Sim.evaluateAssessment(w2, 'news2', four, ['alert'], D);
  assert.equal(withAlert.reveal, 5);
});

test('平衡底線：完整 bundle 能控制 septic shock', () => {
  assert.equal(run(3, board(...FULL)).win, true);
  assert.equal(run(4, board(...FULL, 'rt')).win, true);
  assert.equal(run(5, board(...FULL, 'surgeon', 'np')).win, true);
});

test('平衡底線：第 3 回合缺升壓、缺輸液或沒量乳酸就控制不住', () => {
  assert.equal(run(3, board('rn_lactate', 'ipc_culture', 'resident', 'rn_fluid', 'rt')).win, false, '缺升壓');
  assert.equal(run(3, board('rn_lactate', 'ipc_culture', 'resident', 'rt', 'senior_rn')).win, false, '缺輸液');
  assert.equal(run(3, board('rt', 'ipc_culture', 'resident', 'rn_fluid', 'senior_rn')).win, false, '沒量乳酸');
});

test('平衡底線：完美玩法五回合後病人安全指數還有一半以上', () => {
  const plan = [
    [1, board('ipc_culture', 'resident', 'rn_lactate')],
    [2, board('rn_lactate', 'ipc_culture', 'resident', 'rn_fluid')],
    [3, board(...FULL)],
    [4, board(...FULL, 'rt')],
    [5, board(...FULL, 'surgeon', 'np')],
  ];
  const total = plan.reduce((s, [r, b]) => s + run(r, b).damage, 0);
  assert.ok(total < D.ECONOMY.startSafety / 2, '完美玩法總扣分 ' + total);
});

test('debrief：用 qSOFA 會提醒，五項齊全會肯定', () => {
  const w = wave(3);
  const a = Sim.evaluateAssessment(w, 'qsofa', [], [], D);
  const c = run(3, board(...FULL));
  const d = Sim.buildDebrief(w, a, c, D);
  assert.ok(d.notes.some((n) => n.text === D.NOTES.qsofaOnly.text));
  assert.ok(d.notes.some((n) => n.kind === 'good' && n.text === D.NOTES.hour1Complete.text));
  ['I', 'S', 'B', 'A', 'R'].forEach((k) => assert.ok(d.isbar[k].length > 0));
});

test('商店：第 1 回合不出 3 費以上；同 seed 結果相同', () => {
  for (let s = 1; s <= 50; s++) {
    const shop = Sim.rollShop(Sim.createRng(s), 1, D);
    assert.equal(shop.length, D.ECONOMY.shopSize);
    shop.forEach((id) => assert.ok(Sim.unitById(D, id).cost <= 2));
  }
  assert.deepEqual(Sim.rollShop(Sim.createRng(9), 3, D), Sim.rollShop(Sim.createRng(9), 3, D));
});

test('商店保底：一定有一張卡能補上缺的 bundle 元素（且是本回合買得到的費用）', () => {
  for (let s = 1; s <= 200; s++) {
    const r1 = Sim.rollShop(Sim.createRng(s), 1, D, ['antimicrobials']);
    assert.ok(r1.includes('resident'), 'seed ' + s + ' 第 1 回合沒出抗生素');
    const r3 = Sim.rollShop(Sim.createRng(s), 3, D, ['vasopressor']);
    assert.ok(r3.some((id) => Sim.unitById(D, id).bundle.includes('vasopressor')), 'seed ' + s + ' 第 3 回合沒出升壓');
  }
  // 第 1 回合買不到 3 費以上，所以不會硬塞升壓角色
  const r1v = Sim.rollShop(Sim.createRng(3), 1, D, ['vasopressor']);
  r1v.forEach((id) => assert.ok(Sim.unitById(D, id).cost <= 2));
});

test('經濟：利息每 10 點 +1、上限 5；連續 2 回合 +1', () => {
  assert.deepEqual(Sim.income(23, 1, D), { base: 5, interest: 2, streak: 0, total: 7 });
  assert.equal(Sim.income(99, 4, D).interest, 5);
  assert.equal(Sim.income(0, 2, D).streak, 1);
  assert.equal(Sim.teamCap(wave(4), ['shortage']), wave(4).cap - 1);
});

test('資料完整性：每個 bundle 元素、工具、敵人都對得上，臨床規則都有出處', () => {
  const bundleIds = D.BUNDLE.map((b) => b.id);
  D.UNITS.forEach((u) => {
    u.bundle.forEach((b) => assert.ok(bundleIds.includes(b), u.id + ' 的元素 ' + b));
    u.roles.forEach((r) => assert.ok(D.ROLES[r], u.id + ' 的職能 ' + r));
    if (u.bundle.length) assert.ok(u.source, u.id + ' 帶 bundle 元素卻沒有出處');
  });
  // 每個 bundle 元素至少有一個角色能提供
  bundleIds.forEach((b) => assert.ok(D.UNITS.some((u) => u.bundle.includes(b)), '沒有角色提供 ' + b));
  D.WAVES.forEach((w) => {
    Object.keys(w.tools).forEach((k) => assert.ok(D.TOOLS[k], '工具 ' + k));
    w.enemies.forEach(([k]) => assert.ok(D.ENEMIES[k], '敵人 ' + k));
    assert.ok(w.params.some((p) => !p.abnormal), '第 ' + w.round + ' 回合至少要有一個正常值，判讀才有鑑別度');
    assert.ok(w.params.some((p) => p.abnormal));
    if (w.enemies.some(([k]) => k === 'lactate')) assert.ok(w.lactateHp > 0);
  });
  Object.values(D.NOTES).forEach((n) => assert.ok(n.source, '指引提醒缺出處：' + n.text));
});
