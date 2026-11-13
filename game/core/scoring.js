// 計分和檢討：從一局的狀態算出六個軸的分數、星數，以及回饋畫面要用的清單。

import { RULES } from './rules.js';
import { systemName, mainDiagnosis } from './engine.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function scoreGame(game) {
  const c = game.case;
  const W = RULES.scoreWeights;

  // 系統選擇：核心算兩份、重要算一份；選了不相干的系統扣分
  const sel = c.system_selection;
  const picked = game.systems.picked;
  const known = [...sel.core, ...sel.important, ...(sel.optional || [])];
  const got = 2 * sel.core.filter((id) => picked.includes(id)).length + sel.important.filter((id) => picked.includes(id)).length;
  const extras = picked.filter((id) => !known.includes(id)).length;
  const systems = clamp01(got / (2 * sel.core.length + sel.important.length) - 0.1 * extras);

  // 問診：13 個面向的覆蓋佔六成，關鍵追問佔四成
  const facets = game.tax.facets;
  const coverage = facets.filter((f) => game.asked[f.id]).length / facets.length;
  let keyTotal = 0, keyAsked = 0;
  for (const f of facets) {
    (c.interview[f.id].follow_ups || []).forEach((fu, i) => {
      if (!fu.key) return;
      keyTotal += 1;
      if (game.asked[f.id] && game.asked[f.id].followUps.includes(i)) keyAsked += 1;
    });
  }
  const interview = clamp01(0.6 * coverage + 0.4 * (keyTotal ? keyAsked / keyTotal : 1));

  // 身體評估：該做的有沒有做（依權重）佔八成，順序佔兩成
  const peTotal = c.physical_exam.reduce((s, p) => s + p.weight, 0);
  const peDone = c.physical_exam.filter((p) => game.exams.some((e) => e.item === p.item)).reduce((s, p) => s + p.weight, 0);
  const ordered = game.exams.filter((e) => e.inOrder !== null);
  const violations = ordered.filter((e) => e.inOrder === false).length;
  const orderPart = ordered.length ? 1 - violations / ordered.length : 0;
  const exam = clamp01(0.8 * (peTotal ? peDone / peTotal : 1) + 0.2 * orderPart);

  // 鑑別診斷：主診斷佔六成（越早答對越高），危險診斷佔兩成五，沒選到干擾選項佔一成五
  const firstRight = game.attempts.findIndex((a) => a.correct);
  const mainPart = firstRight === 0 ? 1 : firstRight === 1 ? 0.5 : firstRight > 1 ? 0.25 : 0;
  const last = game.attempts[game.attempts.length - 1];
  const chosen = last ? [last.main, ...last.differentials] : [];
  const mustNot = c.differential.filter((d) => d.role === '不能漏掉');
  const mustPart = mustNot.length ? mustNot.filter((d) => chosen.includes(d.id)).length / mustNot.length : 1;
  const distractors = last ? last.differentials.filter((id) => c.differential.find((d) => d.id === id).role === '干擾').length : 0;
  const differential = last ? clamp01(0.6 * mainPart + 0.25 * mustPart + 0.15 * clamp01(1 - 0.5 * distractors)) : 0;

  // 檢查檢驗：必要的開了幾成，每開一個不必要的扣兩成
  const necessary = c.workup.filter((w) => w.role === '必要');
  const necessaryDone = necessary.filter((w) => game.orders.some((o) => o.id === w.id)).length;
  const unnecessary = game.orders.filter((o) => o.role === '不必要').length;
  const workup = clamp01(necessaryDone / necessary.length - 0.2 * unnecessary);

  const hp = game.phase === 'won' ? game.hp / game.hpMax : 0;

  const parts = { systems, interview, exam, differential, workup, hp };
  const axes = Object.keys(W).map((key) => ({
    key,
    name: AXIS_NAMES[key],
    max: W[key],
    points: Math.round(parts[key] * W[key]),
  }));
  const total = axes.reduce((s, a) => s + a.points, 0);
  const won = game.phase === 'won';
  const stars = !won ? 0 : total >= RULES.stars.three ? 3 : total >= RULES.stars.two ? 2 : 1;
  return { won, total, stars, axes };
}

export const AXIS_NAMES = Object.freeze({
  systems: '系統選擇',
  interview: '問診',
  exam: '身體評估',
  differential: '鑑別診斷',
  workup: '檢查檢驗',
  hp: '病人血量',
});

// 回饋畫面要用的清單：漏了什麼、哪幾回合浪費掉、診斷靠哪些線索
export function reviewGame(game) {
  const c = game.case;
  const sel = c.system_selection;
  const picked = game.systems.picked;
  const name = (id) => systemName(game, id);

  const missedFacets = game.tax.facets.filter((f) => !game.asked[f.id]).map((f) => f.name);
  const keyFollowUps = [];
  for (const f of game.tax.facets) {
    (c.interview[f.id].follow_ups || []).forEach((fu, i) => {
      if (!fu.key) return;
      keyFollowUps.push({
        facet: f.name, ask: fu.ask, answer: fu.answer,
        asked: !!(game.asked[f.id] && game.asked[f.id].followUps.includes(i)),
      });
    });
  }

  const exams = c.physical_exam.map((p) => {
    const def = game.tax.exam_items.find((x) => x.id === p.item);
    return {
      label: def.technique + '｜' + def.site, system: name(def.system), finding: p.finding,
      key: !!p.key, done: game.exams.some((e) => e.item === p.item),
    };
  });
  const orderViolations = game.exams.filter((e) => e.inOrder === false).map((e) => {
    const def = game.tax.exam_items.find((x) => x.id === e.item);
    return name(e.system) + '：' + def.technique + '｜' + def.site;
  });

  const main = mainDiagnosis(game);
  const supportedBy = (main.supported_by || []).map((ref) => describeClueRef(game, ref)).filter(Boolean);
  const last = game.attempts[game.attempts.length - 1];
  const chosen = last ? [last.main, ...last.differentials] : [];
  const differential = c.differential.map((d) => ({
    name: d.name, role: d.role, note: d.note || '', chosen: chosen.includes(d.id),
  }));

  const workup = c.workup.map((w) => ({
    name: w.name, kind: w.kind, role: w.role, note: w.note || '', result: w.result || '',
    ordered: game.orders.some((o) => o.id === w.id),
  }));

  return {
    systems: {
      core: sel.core.map((id) => ({ name: name(id), picked: picked.includes(id) })),
      important: sel.important.map((id) => ({ name: name(id), picked: picked.includes(id) })),
      extras: picked.filter((id) => ![...sel.core, ...sel.important, ...(sel.optional || [])].includes(id)).map(name),
    },
    missedFacets,
    keyFollowUps,
    exams,
    orderViolations,
    main: { name: main.name, note: main.note || '', supportedBy },
    attempts: game.attempts.map((a) => ({ turn: a.turn, name: c.differential.find((d) => d.id === a.main).name, correct: a.correct })),
    differential,
    workup,
    wasted: game.wasted.map((w) => ({ turn: w.turn, text: w.text })),
    turns: game.turn,
    hp: game.hp,
    minHp: game.minHp,
  };
}

// 把 "interview.onset.0"、"exam.cv-heart" 這種線索代號轉成人看得懂的文字
export function describeClueRef(game, ref) {
  const parts = String(ref).split('.');
  if (parts[0] === 'interview') {
    const f = game.tax.facets.find((x) => x.id === parts[1]);
    const data = f && game.case.interview[f.id];
    if (!data) return null;
    if (parts.length === 2) {
      const found = !!game.asked[f.id];
      return { label: f.name, text: f.id === 'ros' ? '系統回顧的結果' : data.answer, found };
    }
    const i = Number(parts[2]);
    const fu = (data.follow_ups || [])[i];
    if (!fu) return null;
    const found = !!(game.asked[f.id] && game.asked[f.id].followUps.includes(i));
    return { label: f.name + '・追問', text: fu.answer, found };
  }
  if (parts[0] === 'exam') {
    const id = parts.slice(1).join('.');
    const def = game.tax.exam_items.find((x) => x.id === id);
    const p = game.case.physical_exam.find((x) => x.item === id);
    if (!def || !p) return null;
    return { label: def.technique + '｜' + def.site, text: p.finding, found: game.exams.some((e) => e.item === id) };
  }
  return null;
}
