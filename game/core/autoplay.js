// 自動試玩：用固定的打法把一關玩完，給病例檢查工具和測試用。
// 目的是驗證「照規矩做一定撐得住」，以及亂按會付出代價。

import { createGame, perform, examMenu, mainDiagnosis } from './engine.js';

function must(out) {
  if (!out.ok) throw new Error('自動試玩走不下去：' + out.message);
  return out;
}

function start(caseData, taxonomy, mode, systems) {
  const game = createGame(caseData, taxonomy, { mode });
  must(perform(game, { type: 'begin' }));
  must(perform(game, { type: 'select_systems', systems }));
  return game;
}

function askAllFacets(game) {
  for (const f of game.tax.facets) {
    if (game.phase !== 'encounter') return;
    must(perform(game, { type: 'ask', facet: f.id }));
  }
}

function diagnoseRight(game) {
  if (game.phase !== 'encounter') return;
  const main = mainDiagnosis(game);
  const differentials = game.case.differential.filter((d) => d.role === '不能漏掉').map((d) => d.id);
  must(perform(game, { type: 'diagnose', main: main.id, differentials }));
}

function orderNecessary(game) {
  for (const w of game.case.workup.filter((x) => x.role === '必要')) {
    if (game.phase !== 'workup') return;
    must(perform(game, { type: 'order', test: w.id }));
  }
}

// 照規矩做：選對系統、13 個面向問完、關鍵追問都問、該做的身體評估照順序做、
// 診斷正確並列出危險診斷、必要的檢查檢驗都開
export function playByTheBook(caseData, taxonomy, mode = 'osce') {
  const sel = caseData.system_selection;
  const game = start(caseData, taxonomy, mode, [...sel.core, ...sel.important]);
  askAllFacets(game);
  for (const f of taxonomy.facets) {
    (caseData.interview[f.id].follow_ups || []).forEach((fu, index) => {
      if (fu.key && game.phase === 'encounter') must(perform(game, { type: 'follow_up', facet: f.id, index }));
    });
  }
  // examMenu 的順序是「一般 → 各系統」；每個系統裡再照常規的手法順序排
  for (const group of examMenu(game)) {
    const order = taxonomy.exam_order[group.system.id] || taxonomy.exam_order.default;
    const rank = (it) => { const i = order.indexOf(it.technique); return i < 0 ? 99 : i; };
    const items = group.items
      .filter((it) => caseData.physical_exam.some((p) => p.item === it.id))
      .sort((a, b) => rank(a) - rank(b));
    for (const it of items) {
      if (game.phase === 'encounter') must(perform(game, { type: 'exam', item: it.id }));
    }
  }
  diagnoseRight(game);
  orderNecessary(game);
  return game;
}

// 只做最低限度：13 個面向各問一次，不追問、不做身體評估，診斷正確，必要的檢查都開
export function playBreadthOnly(caseData, taxonomy, mode = 'osce') {
  const game = start(caseData, taxonomy, mode, [...caseData.system_selection.core]);
  askAllFacets(game);
  diagnoseRight(game);
  orderNecessary(game);
  return game;
}

// 一直重複問同一題：應該撐不住
export function playStalling(caseData, taxonomy, mode = 'osce', maxTurns = 200) {
  const game = start(caseData, taxonomy, mode, [...caseData.system_selection.core]);
  const first = taxonomy.facets[0].id;
  while (game.phase === 'encounter' && game.turn < maxTurns) must(perform(game, { type: 'ask', facet: first }));
  return game;
}
