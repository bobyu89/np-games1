// 執行：node --test prototypes/sepsis-3d/assets.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('./rules/data.js');
const Sim = require('./rules/sim.js');
const Presets = require('./presets.js');

const here = (...p) => path.join(__dirname, ...p);

function readGlb(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.toString('ascii', 0, 4), 'glTF');
  const jsonLen = buf.readUInt32LE(12);
  return { json: JSON.parse(buf.toString('utf8', 20, 20 + jsonLen)), bytes: buf.length };
}

const { json: glb, bytes } = readGlb(here('assets', 'models.glb'));
const names = new Set(glb.nodes.map((n) => n.name));

test('規則檔和灰盒版完全相同（3D 版只換畫面，不改規則）', () => {
  for (const f of ['data.js', 'sim.js']) {
    assert.equal(fs.readFileSync(here('rules', f), 'utf8'), fs.readFileSync(here('..', 'sepsis-greybox', f), 'utf8'), f + ' 和灰盒版不同步');
  }
});

test('每個角色都有模型，而且可動部位的名稱齊全', () => {
  D.UNITS.forEach((u) => {
    assert.ok(names.has('unit_' + u.id), '缺角色模型 unit_' + u.id);
    ['body', 'head', 'hand_L', 'hand_R'].forEach((part) => assert.ok(names.has(u.id + '__' + part), '缺部位 ' + u.id + '__' + part));
  });
});

test('每種敵人、場景道具和六角格都有模型', () => {
  const kinds = new Set(Object.values(D.ENEMIES).map((e) => e.kind));
  kinds.forEach((k) => {
    assert.ok(names.has('enemy_' + k), '缺敵人模型 enemy_' + k);
    assert.ok(names.has('enemy_' + k + '__body'), '缺 enemy_' + k + '__body');
  });
  ['enemy_hypotension__needle', 'enemy_mods__orb_lung', 'enemy_mods__orb_heart', 'tile_hex', 'env_bed', 'env_monitor', 'env_monitor__screen', 'env_ivpole', 'env_rail', 'env_cart']
    .forEach((n) => assert.ok(names.has(n), '缺 ' + n));
});

test('模型帶頂點色，檔案大小在手機可接受的範圍內', () => {
  const clay = glb.materials.findIndex((m) => m.name === 'clay');
  assert.ok(clay >= 0, '找不到共用材質 clay');
  glb.meshes.forEach((m) => m.primitives.forEach((p) => {
    if (p.material === clay) assert.ok('COLOR_0' in p.attributes, m.name + ' 沒有頂點色');
  }));
  assert.ok(bytes < 2.5 * 1024 * 1024, 'models.glb 太大：' + Math.round(bytes / 1024) + ' KB');
});

test('建議陣容：人數不超過上限、角色不重複，而且每回合都控制得住', () => {
  D.WAVES.forEach((w) => {
    const ids = Presets[w.round];
    assert.ok(ids, '第 ' + w.round + ' 回合沒有建議陣容');
    assert.ok(ids.length <= Sim.teamCap(w, []), '第 ' + w.round + ' 回合超過人數上限');
    assert.equal(new Set(ids).size, ids.length);
    const board = Array(D.COMBAT.slots).fill(null);
    ids.forEach((id, i) => { board[i] = id; });
    for (let seed = 1; seed <= 25; seed++) {
      const r = Sim.simulateCombat({ wave: w, board, data: D, augments: [], seed });
      assert.equal(r.win, true, '第 ' + w.round + ' 回合 seed ' + seed + ' 沒有控制住');
    }
  });
});

test('戰鬥事件帶有畫面需要的欄位：打到哪一隻敵人、持續傷害的數值', () => {
  const board = Array(D.COMBAT.slots).fill(null);
  ['rt', 'resident'].forEach((id, i) => { board[i] = id; });
  const r = Sim.simulateCombat({ wave: D.WAVES[2], board, data: D, augments: [], seed: 3 });
  const hits = r.events.flatMap((e) => e.hits || []);
  assert.ok(hits.length > 0);
  hits.forEach((h) => assert.ok(Number.isInteger(h.idx) && h.idx >= 0 && h.idx < r.enemies.length));
  const pressure = r.events.filter((e) => e.kind === 'pressure');
  assert.ok(pressure.length > 0);
  pressure.forEach((e) => assert.ok(e.amount > 0));
  assert.equal(pressure.reduce((s, e) => s + e.amount, 0), r.pressure);
});
