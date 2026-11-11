// 關卡引擎：純邏輯，不碰畫面。同樣的病例、同樣的操作，一定得到同樣的結果。
//
// 階段：intro（開場）→ systems（系統選擇）→ encounter（問診和身體評估）
//       → workup（檢查檢驗）→ won（康復）｜lost（失敗）
//
// 用法：
//   const game = createGame(caseData, taxonomy, { mode: 'practice' });
//   const out = perform(game, { type: 'ask', facet: 'location' });
// perform 會直接改 game，並回傳這一步發生了什麼（給畫面顯示）。
// 不合規則的操作回傳 { ok: false }，game 不變。

import { RULES, drainFor } from './rules.js';

const OVER = new Set(['won', 'lost']);

export function createGame(caseData, taxonomy, { mode = 'practice' } = {}) {
  if (mode !== 'practice' && mode !== 'osce') throw new Error('不認得的模式：' + mode);
  const startHp = RULES.acuity[caseData.acuity].startHp;
  return {
    case: caseData,
    tax: taxonomy,
    mode,
    phase: 'intro',
    turn: 0,
    hp: startHp,
    hpMax: RULES.hpMax,
    minHp: startHp,
    drain: drainFor(caseData.acuity, mode),
    veil: 100,
    gained: 0,
    totalWeight: totalClueWeight(caseData),
    systems: { picked: [], active: [], autoAdded: [] },
    asked: {},      // 面向 id → { turn, followUps: [已追問的編號] }
    zonesDone: [],
    exams: [],      // { item, system, technique, techIndex, turn, relevant, key, inOrder }
    clues: [],      // 線索筆記
    attempts: [],   // 每一次提出的診斷
    orders: [],     // 開過的檢查檢驗
    wasted: [],     // 浪費掉的回合
    lost: null,     // 'hp'（病況惡化）｜'diagnosis'（OSCE 診斷錯誤）
    log: [],        // 操作紀錄
  };
}

export function totalClueWeight(caseData) {
  let sum = 0;
  for (const f of Object.values(caseData.interview)) {
    sum += f.weight;
    for (const fu of f.follow_ups || []) sum += fu.weight;
  }
  for (const p of caseData.physical_exam) sum += p.weight;
  return sum;
}

// ───────── 查表 ─────────

const facetDef = (game, id) => game.tax.facets.find((f) => f.id === id);
const examDef = (game, id) => game.tax.exam_items.find((x) => x.id === id);
const zoneDef = (game, id) => game.tax.zones.find((z) => z.id === id);
const dxDef = (game, id) => game.case.differential.find((d) => d.id === id);
const workupDef = (game, id) => game.case.workup.find((w) => w.id === id);

export function systemName(game, id) {
  if (id === game.tax.general_system.id) return game.tax.general_system.name;
  const s = game.tax.systems.find((x) => x.id === id);
  return s ? s.name : id;
}

function rosAnswer(game) {
  const by = game.case.interview.ros.by_system || {};
  return game.tax.systems
    .filter((s) => game.systems.active.includes(s.id))
    .map((s) => s.name + '：' + (by[s.id] || game.tax.ros_default))
    .join('\n');
}

function techniqueIndex(game, def) {
  if (def.system === game.tax.general_system.id) return null;
  const order = game.tax.exam_order[def.system] || game.tax.exam_order.default;
  const i = order.indexOf(def.technique);
  return i < 0 ? null : i;
}

// ───────── 給畫面用的查詢 ─────────

export function interviewMenu(game) {
  return game.tax.zones.map((z) => ({
    id: z.id,
    name: z.name,
    facets: game.tax.facets.filter((f) => f.zone === z.id).map((f) => {
      const st = game.asked[f.id];
      const data = game.case.interview[f.id];
      return {
        id: f.id, name: f.name, light: f.light, ask: f.ask,
        asked: !!st,
        followUps: st
          ? (data.follow_ups || []).map((fu, index) => ({ index, ask: fu.ask, asked: st.followUps.includes(index) }))
          : [],
      };
    }),
  }));
}

export function missingFacets(game) {
  return game.tax.facets.filter((f) => !game.asked[f.id]);
}

// 練習模式要 13 個面向都問過才能提出診斷；OSCE 不擋
export function diagnosisGate(game) {
  if (game.phase !== 'encounter') return { ok: false, missing: [] };
  if (game.mode !== 'practice') return { ok: true, missing: [] };
  const missing = missingFacets(game);
  return { ok: missing.length === 0, missing: missing.map((f) => f.name) };
}

export function examMenu(game) {
  const ids = [game.tax.general_system.id, ...game.tax.systems.map((s) => s.id).filter((id) => game.systems.active.includes(id))];
  return ids.map((id) => ({
    system: { id, name: systemName(game, id) },
    items: game.tax.exam_items.filter((x) => x.system === id).map((x) => ({
      id: x.id, technique: x.technique, site: x.site,
      done: game.exams.some((e) => e.item === x.id),
    })),
  }));
}

export function candidateList(game) {
  return game.case.differential.map((d) => ({ id: d.id, name: d.name }));
}

export function workupMenu(game) {
  return game.case.workup.map((w) => ({
    id: w.id, name: w.name, kind: w.kind,
    ordered: game.orders.some((o) => o.id === w.id),
  }));
}

export function mainDiagnosis(game) {
  return game.case.differential.find((d) => d.role === '主診斷');
}

// ───────── 執行一步 ─────────

function fail(reason, message, extra) {
  return { ok: false, reason, message, ...extra };
}

function newOutcome(type) {
  return { ok: true, type, lines: [], tags: [], heal: 0, drain: 0, veilDrop: 0 };
}

// 結算一個回合：先算這一步的效果，再讓主訴攻擊（掉血）
function resolve(game, out, action, { heal = 0, veilGain = 0, veilOpen = false, final = false, wasted = null } = {}) {
  game.turn += 1;
  out.turn = game.turn;
  out.heal = heal;
  game.hp = Math.max(0, Math.min(game.hpMax, game.hp + heal));

  const veilBefore = game.veil;
  if (veilOpen) {
    game.veil = 0;
  } else if (veilGain > 0) {
    game.gained += veilGain;
    const span = 100 - RULES.veilFloor;
    game.veil = Math.max(RULES.veilFloor, Math.round(100 - (span * game.gained) / game.totalWeight));
  }
  out.veilDrop = veilBefore - game.veil;

  if (wasted) {
    game.wasted.push({ turn: game.turn, ...wasted });
    if (!out.tags.includes('wasted')) out.tags.push('wasted');
  }

  if (game.hp > 0 && !final) {
    out.drain = game.drain;
    game.hp = Math.max(0, game.hp - game.drain);
  }
  if (game.hp < game.minHp) game.minHp = game.hp;
  if (game.hp <= 0 && game.phase !== 'won') {
    game.phase = 'lost';
    if (!game.lost) game.lost = 'hp';
    out.tags.push('lost');
  }

  out.hp = game.hp;
  out.veil = game.veil;
  out.phase = game.phase;
  game.log.push({
    turn: game.turn, action, tags: [...out.tags],
    heal: out.heal, drain: out.drain, hp: game.hp, veil: game.veil, phase: game.phase,
  });
  return out;
}

export function perform(game, action) {
  if (!action || typeof action.type !== 'string') return fail('bad_action', '沒有指定動作。');
  if (OVER.has(game.phase)) return fail('over', '這一關已經結束了。');
  switch (action.type) {
    case 'begin': return doBegin(game);
    case 'select_systems': return doSelectSystems(game, action);
    case 'ask': return doAsk(game, action);
    case 'follow_up': return doFollowUp(game, action);
    case 'exam': return doExam(game, action);
    case 'diagnose': return doDiagnose(game, action);
    case 'order': return doOrder(game, action);
    default: return fail('bad_action', '不認得的動作：' + action.type);
  }
}

function doBegin(game) {
  if (game.phase !== 'intro') return fail('wrong_phase', '已經開始了。');
  game.phase = 'systems';
  game.log.push({ turn: 0, action: { type: 'begin' }, tags: [], heal: 0, drain: 0, hp: game.hp, veil: game.veil, phase: game.phase });
  return { ...newOutcome('begin'), phase: game.phase, hp: game.hp, veil: game.veil };
}

// 系統選擇不花回合。它決定系統回顧和身體評估的範圍。
function doSelectSystems(game, action) {
  if (game.phase !== 'systems') return fail('wrong_phase', '現在不能選系統。');
  const valid = game.tax.systems.map((s) => s.id);
  const picked = valid.filter((id) => (action.systems || []).includes(id));
  if (picked.length === 0) return fail('none_selected', '請至少選一個系統。');

  const sel = game.case.system_selection;
  const coreMissed = sel.core.filter((id) => !picked.includes(id));
  const autoAdded = game.mode === 'practice' ? coreMissed : [];
  game.systems.picked = picked;
  game.systems.autoAdded = autoAdded;
  game.systems.active = valid.filter((id) => picked.includes(id) || autoAdded.includes(id));
  game.phase = 'encounter';

  const out = { ...newOutcome('select_systems'), phase: game.phase, hp: game.hp, veil: game.veil };
  if (game.mode === 'practice') {
    // 練習模式馬上回饋，漏掉的核心系統自動補上（計分仍看原本選的）
    const known = [...sel.core, ...sel.important, ...(sel.optional || [])];
    out.feedback = {
      coreHit: sel.core.filter((id) => picked.includes(id)),
      coreMissed,
      importantMissed: sel.important.filter((id) => !picked.includes(id)),
      extras: picked.filter((id) => !known.includes(id)),
    };
  }
  game.log.push({ turn: 0, action: { type: 'select_systems', systems: picked }, tags: [], heal: 0, drain: 0, hp: game.hp, veil: game.veil, phase: game.phase });
  return out;
}

function doAsk(game, action) {
  if (game.phase !== 'encounter') return fail('wrong_phase', '現在不能問診。');
  const f = facetDef(game, action.facet);
  if (!f) return fail('bad_target', '沒有這個問診面向。');
  const data = game.case.interview[f.id];
  const answer = f.id === 'ros' ? rosAnswer(game) : data.answer;
  const out = newOutcome('ask');
  out.lines.push({ who: 'you', text: f.ask }, { who: 'patient', text: answer });
  const act = { type: 'ask', facet: f.id };

  if (game.asked[f.id]) {
    out.tags.push('repeat');
    return resolve(game, out, act, { wasted: { code: 'repeat_ask', text: '重複問「' + f.name + '」' } });
  }

  game.asked[f.id] = { turn: game.turn + 1, followUps: [] };
  let heal = RULES.heal.facetBase + RULES.heal.facetPerWeight * data.weight;
  out.tags.push('clue');
  game.clues.push({ kind: 'interview', zone: f.zone, facet: f.id, label: f.name, text: answer, key: false, turn: game.turn + 1 });

  const zoneFacets = game.tax.facets.filter((x) => x.zone === f.zone);
  if (zoneFacets.every((x) => game.asked[x.id])) {
    heal += RULES.heal.zoneComplete;
    game.zonesDone.push(f.zone);
    out.tags.push('zone');
    out.zone = zoneDef(game, f.zone).name;
  }
  return resolve(game, out, act, { heal, veilGain: data.weight });
}

function doFollowUp(game, action) {
  if (game.phase !== 'encounter') return fail('wrong_phase', '現在不能問診。');
  const f = facetDef(game, action.facet);
  if (!f) return fail('bad_target', '沒有這個問診面向。');
  const st = game.asked[f.id];
  if (!st) return fail('not_asked', '要先問過「' + f.name + '」，才能追問。');
  const fu = (game.case.interview[f.id].follow_ups || [])[action.index];
  if (!fu) return fail('bad_target', '沒有這個追問。');

  const out = newOutcome('follow_up');
  out.lines.push({ who: 'you', text: fu.ask }, { who: 'patient', text: fu.answer });
  const act = { type: 'follow_up', facet: f.id, index: action.index };

  if (st.followUps.includes(action.index)) {
    out.tags.push('repeat');
    return resolve(game, out, act, { wasted: { code: 'repeat_ask', text: '重複追問「' + fu.ask + '」' } });
  }
  st.followUps.push(action.index);

  if (fu.weight <= 0) {
    out.tags.push('empty');
    return resolve(game, out, act, { wasted: { code: 'empty_follow_up', text: '追問「' + fu.ask + '」沒有問到新線索' } });
  }
  const heal = fu.key
    ? RULES.heal.followKeyBase + RULES.heal.followKeyPerWeight * fu.weight
    : RULES.heal.followBase + RULES.heal.followPerWeight * fu.weight;
  out.tags.push('clue');
  if (fu.key) out.tags.push('key');
  game.clues.push({ kind: 'interview', zone: f.zone, facet: f.id, label: f.name + '・追問', text: fu.answer, key: !!fu.key, turn: game.turn + 1 });
  return resolve(game, out, act, { heal, veilGain: fu.weight });
}

function doExam(game, action) {
  if (game.phase !== 'encounter') return fail('wrong_phase', '現在不能做身體評估。');
  const def = examDef(game, action.item);
  if (!def) return fail('bad_target', '沒有這個身體評估項目。');
  if (def.system !== game.tax.general_system.id && !game.systems.active.includes(def.system)) {
    return fail('system_not_selected', '「' + systemName(game, def.system) + '」不在你選的系統裡。');
  }
  const found = game.case.physical_exam.find((p) => p.item === def.id);
  const label = def.technique + '｜' + def.site;
  const out = newOutcome('exam');
  out.lines.push({ who: 'you', text: label }, { who: 'finding', text: found ? found.finding : def.normal });
  const act = { type: 'exam', item: def.id };

  if (game.exams.some((e) => e.item === def.id)) {
    out.tags.push('repeat');
    return resolve(game, out, act, { wasted: { code: 'repeat_exam', text: '重複做「' + label + '」' } });
  }

  const techIndex = techniqueIndex(game, def);
  // 同一個系統裡，已經做過順序在後面的手法，這一步就算沒照順序
  const inOrder = techIndex === null
    ? null
    : !game.exams.some((e) => e.system === def.system && e.techIndex !== null && e.techIndex > techIndex);
  game.exams.push({
    item: def.id, system: def.system, technique: def.technique, techIndex,
    turn: game.turn + 1, relevant: !!found, key: !!(found && found.key), inOrder,
  });
  if (inOrder === true) out.tags.push('in_order');
  if (inOrder === false) out.tags.push('out_of_order');

  if (!found) {
    return resolve(game, out, act, { wasted: { code: 'irrelevant_exam', text: '做了和主訴關係不大的身體評估「' + label + '」' } });
  }
  let heal = RULES.heal.examBase + RULES.heal.examPerWeight * found.weight;
  if (found.key) heal += RULES.heal.examKeyBonus;
  if (inOrder === true) heal += RULES.heal.examInOrderBonus;
  out.tags.push('clue');
  if (found.key) out.tags.push('key');
  game.clues.push({ kind: 'exam', system: def.system, item: def.id, label, text: found.finding, key: !!found.key, turn: game.turn + 1 });
  return resolve(game, out, act, { heal, veilGain: found.weight });
}

function doDiagnose(game, action) {
  if (game.phase !== 'encounter') return fail('wrong_phase', '現在不能提出診斷。');
  const main = dxDef(game, action.main);
  if (!main) return fail('bad_target', '請選一個最可能的診斷。');
  const gate = diagnosisGate(game);
  if (!gate.ok) return fail('facets_missing', '還有問診面向沒問到：' + gate.missing.join('、'), { missing: gate.missing });

  const differentials = [...new Set(action.differentials || [])]
    .filter((id) => id !== main.id && dxDef(game, id))
    .slice(0, RULES.maxDifferentials);
  const correct = main.role === '主診斷';
  game.attempts.push({ turn: game.turn + 1, main: main.id, differentials, correct });

  const out = newOutcome('diagnose');
  out.correct = correct;
  out.lines.push({ who: 'you', text: '我認為最可能是：' + main.name });
  const act = { type: 'diagnose', main: main.id, differentials };

  if (correct) {
    game.phase = 'workup';
    out.tags.push('reveal');
    return resolve(game, out, act, { heal: RULES.heal.diagnosisRight, veilOpen: true });
  }
  out.tags.push('wrong');
  const wasted = { code: 'wrong_diagnosis', text: '提出的診斷不正確（' + main.name + '）' };
  if (game.mode === 'osce') {
    // OSCE 只有一次機會
    game.phase = 'lost';
    game.lost = 'diagnosis';
    out.tags.push('lost');
    return resolve(game, out, act, { heal: RULES.heal.diagnosisWrong, wasted, final: true });
  }
  return resolve(game, out, act, { heal: RULES.heal.diagnosisWrong, wasted });
}

function doOrder(game, action) {
  if (game.phase !== 'workup') return fail('wrong_phase', '提出正確的診斷之後，才能開檢查檢驗。');
  const w = workupDef(game, action.test);
  if (!w) return fail('bad_target', '沒有這個檢查或檢驗。');
  const out = newOutcome('order');
  out.role = w.role;
  out.lines.push({ who: 'you', text: '開立：' + w.name });
  const act = { type: 'order', test: w.id };

  if (game.orders.some((o) => o.id === w.id)) {
    out.tags.push('repeat');
    out.lines.push({ who: 'finding', text: w.result || '這一項已經開過了。' });
    return resolve(game, out, act, { wasted: { code: 'repeat_order', text: '重複開「' + w.name + '」' } });
  }
  game.orders.push({ id: w.id, role: w.role, turn: game.turn + 1 });

  if (w.role === '不必要') {
    out.lines.push({ who: 'finding', text: w.note || '這一項對確認診斷沒有幫助。' });
    return resolve(game, out, act, { wasted: { code: 'unnecessary_order', text: '開了不必要的「' + w.name + '」' } });
  }
  out.lines.push({ who: 'finding', text: w.result });
  out.tags.push(w.role === '必要' ? 'necessary' : 'optional');

  const necessary = game.case.workup.filter((x) => x.role === '必要');
  const done = necessary.every((x) => game.orders.some((o) => o.id === x.id));
  const heal = w.role === '必要' ? RULES.heal.workupNecessary : RULES.heal.workupOptional;
  if (done) {
    game.phase = 'won';
    out.tags.push('recovered');
    return resolve(game, out, act, { heal, final: true });
  }
  return resolve(game, out, act, { heal });
}
