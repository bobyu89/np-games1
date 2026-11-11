// 進度存檔：只存在玩家自己的瀏覽器，不收個人資料、不傳到任何地方。
// 瀏覽器不給存的時候（例如無痕視窗），遊戲照樣能玩，只是進度不會留下來。

const KEY = 'np-osce-game.v1';
const KEEP_RUNS = 20;

const fresh = () => ({ v: 1, mode: 'practice', cases: {}, dex: [], runs: [] });

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return { ...fresh(), ...s };
  } catch (e) { /* 讀不到就從頭開始 */ }
  return fresh();
}

export function saveStore(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 存不了就算了 */ }
}

// 記下一局的結果。操作紀錄先留著，之後要做研究時加匯出就好。
export function recordRun(store, game, score) {
  const id = game.case.id;
  const perCase = store.cases[id] || (store.cases[id] = {});
  const rec = perCase[game.mode] || (perCase[game.mode] = { plays: 0, wins: 0, best: 0, stars: 0 });
  rec.plays += 1;
  if (score.won) {
    rec.wins += 1;
    rec.best = Math.max(rec.best, score.total);
    rec.stars = Math.max(rec.stars, score.stars);
    if (!store.dex.includes(id)) store.dex.push(id);
  }
  store.runs.push({
    caseId: id, mode: game.mode, at: new Date().toISOString(),
    won: score.won, total: score.total, stars: score.stars, turns: game.turn, hp: game.hp,
    log: game.log,
  });
  if (store.runs.length > KEEP_RUNS) store.runs.splice(0, store.runs.length - KEEP_RUNS);
  saveStore(store);
  return rec;
}
