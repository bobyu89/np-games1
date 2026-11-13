/*
 * 《黃金一小時》灰盒原型：畫面與互動
 * 狀態全部放在 S（可序列化），研究紀錄從 S.events / S.history 匯出。
 */
(function () {
  'use strict';

  const D = window.GameData;
  const Sim = window.Sim;
  const E = D.ECONOMY;
  const C = D.COMBAT;
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  let S = null;
  let R = null;      // 商店用的 RNG（狀態同步存在 S.rngState）
  let timer = null;  // 戰鬥回放計時器
  let toastTimer = null;

  // 下載：在 Artifact viewer 裡用 downloads capability；本機開檔用 Blob 下載
  let downloads = null;
  let canDownload = !window.claude;
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then((d) => {
        downloads = d;
        canDownload = !!d;
        const a = document.activeElement;
        if (S && S.phase === 'end' && !(a && a.tagName === 'TEXTAREA')) render();
      }).catch(() => {});
    }
  } catch (e) { /* 沒有 viewer 就用本機下載 */ }

  // ── 小工具
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unit = (id) => Sim.unitById(D, id);
  const wave = () => D.WAVES[S.round - 1];
  const now = () => Date.now();
  const cap = () => Sim.teamCap(wave(), S.augments);
  const boardIds = () => S.board.map((x) => (x ? x.id : null));
  const boardCount = () => S.board.filter(Boolean).length;
  const bundleShort = (id) => D.BUNDLE.find((b) => b.id === id).short;
  const bundleName = (id) => D.BUNDLE.find((b) => b.id === id).name;
  const augName = (id) => D.AUGMENTS.find((a) => a.id === id).name;
  const roleCls = (u) => (u.roles.length > 1 ? 'r-dual' : 'r-' + u.roles[0]);

  // 已擁有（場上＋候補）的角色還缺哪些 bundle 元素，給商店保底用
  function missingOwned() {
    const owned = S.board.concat(S.bench).filter(Boolean).map((x) => x.id);
    return Sim.computeTraits(owned, D, S.augments).bundle.missing;
  }

  function rng() { if (!R) R = Sim.createRng(S.rngState); return R; }
  function syncRng() { if (R) S.rngState = R.state(); }

  function randomSeed() {
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] >>> 0 || 1;
    } catch (e) {
      return (Math.floor(Math.random() * 4294967295) >>> 0) || 1;
    }
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2400);
  }

  // ── 狀態
  function sessionLog(s) {
    return {
      sessionId: s.sessionId,
      playIndex: s.playIndex,
      replayOf: s.replayOf,
      seed: s.seed,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      outcome: s.ended,
      finalSafety: s.safety,
      roundsCompleted: s.history.length,
      augments: s.augments.slice(),
      preRecall: s.preRecall,
      postRecall: s.postRecall,
      rounds: s.history,
      events: s.events,
    };
  }

  function newGame(prev) {
    const seed = randomSeed();
    R = null;
    return {
      v: 1,
      seed,
      rngState: seed,
      round: 1,
      gold: E.startGold,
      safety: E.startSafety,
      streak: { win: null, n: 0 },
      bench: Array(E.benchSize).fill(null),
      board: Array(C.slots).fill(null),
      shop: [],
      augments: [],
      augmentOffer: null,
      phase: 'start',
      sel: null,
      assess: null,
      combat: null,
      debrief: null,
      history: [],
      cur: null,
      participant: prev ? prev.participant : '',
      preRecall: '',
      postRecall: '',
      archive: prev ? prev.archive.concat([sessionLog(prev)]) : [],
      replayOf: prev ? prev.sessionId : null,
      playIndex: prev ? prev.playIndex + 1 : 1,
      sessionId: 's-' + Date.now().toString(36) + '-' + seed.toString(36),
      startedAt: new Date().toISOString(),
      endedAt: null,
      ended: null,
      t0: now(),
      phaseAt: now(),
      lastIncome: null,
      events: [],
      nextUid: 1,
    };
  }

  function logEvent(type, payload) {
    S.events.push(Object.assign({ ms: now() - S.t0, round: S.round, phase: S.phase, type }, payload || {}));
  }

  function buildLog() {
    return {
      schema: 'golden-hour-greybox-log',
      schemaVersion: 1,
      gameVersion: D.VERSION,
      exportedAt: new Date().toISOString(),
      participant: S.participant || null,
      plays: S.archive.concat([sessionLog(S)]),
    };
  }

  function go(phase) {
    S.phase = phase;
    S.phaseAt = now();
    S.sel = null;
    if (phase === 'end' && !S.endedAt) S.endedAt = new Date().toISOString();
    render();
    try { window.scrollTo({ top: 0 }); } catch (e) { /* ignore */ }
  }

  // ── 流程
  function startGame() {
    logEvent('session_start', { seed: S.seed, participant: S.participant || null, playIndex: S.playIndex });
    if (S.preRecall.trim()) logEvent('recall_pre', { text: S.preRecall.trim() });
    beginRound();
  }

  function beginRound() {
    S.cur = { round: S.round, augment: null, assessment: null, prep: { buys: 0, sells: 0, rerolls: 0, ms: 0 }, combat: null };
    S.assess = { tool: null, flagged: [], result: null };
    S.combat = null;
    S.debrief = null;
    S.shop = Sim.rollShop(rng(), S.round, D, missingOwned());
    syncRng();
    logEvent('shop_roll', { shop: S.shop.slice(), reason: 'round_start' });
    if (S.round === 2 || S.round === 4) {
      S.augmentOffer = Sim.pickAugments(rng(), D, S.augments);
      syncRng();
      logEvent('augment_offer', { options: S.augmentOffer.slice() });
      go('augment');
    } else {
      go('assess');
    }
  }

  function pickAugment(id) {
    if (!S.augmentOffer || !S.augmentOffer.includes(id)) return;
    S.augments.push(id);
    S.cur.augment = id;
    if (id === 'shortage') S.gold += 4;
    logEvent('augment_pick', { id, msInPhase: now() - S.phaseAt });
    S.augmentOffer = null;
    go('assess');
  }

  function toggleFlag(pid) {
    if (S.assess.result) return;
    const f = S.assess.flagged;
    const i = f.indexOf(pid);
    if (i === -1) f.push(pid); else f.splice(i, 1);
    logEvent('assess_flag', { param: pid, on: i === -1 });
    render();
  }

  function chooseTool(tid) {
    if (S.assess.result) return;
    S.assess.tool = tid;
    logEvent('assess_tool', { tool: tid });
    render();
  }

  function submitAssess() {
    if (!S.assess.tool || S.assess.result) return;
    const r = Sim.evaluateAssessment(wave(), S.assess.tool, S.assess.flagged, S.augments, D);
    S.assess.result = r;
    S.cur.assessment = Object.assign({}, r, { flagged: S.assess.flagged.slice(), ms: now() - S.phaseAt });
    logEvent('assess_submit', {
      tool: r.tool, quality: r.quality, flagged: S.assess.flagged.slice(),
      correct: r.correct.length, abnormalTotal: r.abnormalTotal, falseFlags: r.falseFlags.slice(),
      missed: r.missed.slice(), reveal: r.reveal, total: r.total,
    });
    render();
  }

  function enforceCap() {
    let over = boardCount() - cap();
    for (let i = C.slots - 1; i >= 0 && over > 0; i--) {
      if (!S.board[i]) continue;
      const j = S.bench.indexOf(null);
      if (j === -1) {
        S.gold += unit(S.board[i].id).cost;
        logEvent('auto_sell', { id: S.board[i].id });
      } else {
        S.bench[j] = S.board[i];
        logEvent('auto_bench', { id: S.board[i].id });
      }
      S.board[i] = null;
      over--;
    }
  }

  function getAt(area, i) {
    if (area === 'board') return S.board[i];
    if (area === 'bench') return S.bench[i];
    return S.shop[i] ? { id: S.shop[i] } : null;
  }
  function setAt(area, i, v) { if (area === 'board') S.board[i] = v; else S.bench[i] = v; }

  function selectShop(i) {
    if (!S.shop[i]) return;
    S.sel = S.sel && S.sel.area === 'shop' && S.sel.i === i ? null : { area: 'shop', i };
    render();
  }

  function buyTo(area, i) {
    const si = S.sel.i;
    const id = S.shop[si];
    if (!id) { S.sel = null; render(); return; }
    const u = unit(id);
    if (S.gold < u.cost) { toast('資源點數不足'); return; }
    if (getAt(area, i)) { toast('這一格已經有人'); return; }
    if (area === 'board' && boardCount() >= cap()) { toast('上場人數已達上限 ' + cap() + ' 人'); return; }
    S.gold -= u.cost;
    setAt(area, i, { uid: S.nextUid++, id });
    S.shop[si] = null;
    S.cur.prep.buys++;
    logEvent('buy', { id, cost: u.cost, to: area + ':' + i, gold: S.gold });
    S.sel = null;
    render();
  }

  function recruit() {
    if (!S.sel || S.sel.area !== 'shop') return;
    const j = S.bench.indexOf(null);
    if (j === -1) { toast('候補區已滿，先出售或派人上場'); return; }
    buyTo('bench', j);
  }

  function tapSlot(area, i) {
    const here = getAt(area, i);
    if (S.sel && S.sel.area === 'shop') {
      if (!here) { buyTo(area, i); return; }
      S.sel = { area, i };
      render();
      return;
    }
    if (!S.sel) {
      if (here) { S.sel = { area, i }; render(); }
      return;
    }
    const fa = S.sel.area;
    const fi = S.sel.i;
    if (fa === area && fi === i) { S.sel = null; render(); return; }
    const moving = getAt(fa, fi);
    if (!moving) { S.sel = null; render(); return; }
    if (fa === 'bench' && area === 'board' && !here && boardCount() >= cap()) {
      toast('上場人數已達上限 ' + cap() + ' 人');
      return;
    }
    setAt(area, i, moving);
    setAt(fa, fi, here || null);
    logEvent('move', { id: moving.id, from: fa + ':' + fi, to: area + ':' + i, swappedWith: here ? here.id : null });
    S.sel = null;
    render();
  }

  function sell() {
    if (!S.sel || S.sel.area === 'shop') return;
    const it = getAt(S.sel.area, S.sel.i);
    if (!it) return;
    const u = unit(it.id);
    setAt(S.sel.area, S.sel.i, null);
    S.gold += u.cost;
    S.cur.prep.sells++;
    logEvent('sell', { id: it.id, refund: u.cost, gold: S.gold });
    S.sel = null;
    render();
  }

  function toBench() {
    if (!S.sel || S.sel.area !== 'board') return;
    const j = S.bench.indexOf(null);
    if (j === -1) { toast('候補區已滿'); return; }
    tapSlot('bench', j);
  }

  function reroll() {
    if (S.gold < E.rerollCost) { toast('資源點數不足'); return; }
    S.gold -= E.rerollCost;
    S.shop = Sim.rollShop(rng(), S.round, D, missingOwned());
    syncRng();
    if (S.sel && S.sel.area === 'shop') S.sel = null;
    S.cur.prep.rerolls++;
    logEvent('reroll', { shop: S.shop.slice(), gold: S.gold });
    render();
  }

  function startCombat() {
    if (boardCount() === 0) { toast('至少派 1 名角色上場'); return; }
    const seed = (S.seed ^ Math.imul(S.round, 2654435761)) >>> 0;
    const result = Sim.simulateCombat({ wave: wave(), board: boardIds(), data: D, augments: S.augments, seed });
    const tr = result.traits;
    S.cur.prep.ms = now() - S.phaseAt;
    S.cur.prep.board = boardIds();
    S.cur.prep.bench = S.bench.map((x) => (x ? x.id : null));
    S.cur.prep.goldLeft = S.gold;
    S.cur.prep.traits = {
      hour1: tr.bundle.count,
      hour1Missing: tr.bundle.missing,
      assessor: tr.roles.assessor.count,
      interventionist: tr.roles.interventionist.count,
      coordinator: tr.roles.coordinator.count,
    };
    logEvent('combat_start', { board: boardIds(), seed, hour1: tr.bundle.count });
    S.combat = { result, frame: 0, done: false, seed };
    go('combat');
    play();
  }

  function play() {
    clearInterval(timer);
    if (!S.combat || S.combat.done) return;
    timer = setInterval(() => {
      if (!S || S.phase !== 'combat' || !S.combat || S.combat.done) { clearInterval(timer); return; }
      S.combat.frame++;
      if (S.combat.frame >= S.combat.result.frames.length - 1) finishCombat();
      else render();
    }, 260);
  }

  function finishCombat() {
    clearInterval(timer);
    const c = S.combat;
    if (!c) return;
    if (c.done) { render(); return; }
    c.frame = c.result.frames.length - 1;
    c.done = true;
    const res = c.result;
    S.safety = Math.max(0, S.safety - res.damage);
    if (S.streak.win === res.win) S.streak.n++;
    else S.streak = { win: res.win, n: 1 };
    S.debrief = Sim.buildDebrief(wave(), S.assess.result, res, D);
    S.cur.combat = {
      win: res.win, damage: res.damage, pressure: res.pressure, remainingThreat: res.remainingThreat,
      penalties: res.penalties.map((p) => p.id), endTime: res.endTime, metrics: res.metrics,
    };
    S.cur.safetyAfter = S.safety;
    logEvent('combat_end', { win: res.win, damage: res.damage, safety: S.safety, metrics: res.metrics });
    render();
  }

  function nextFromDebrief() {
    S.cur.debriefMs = now() - S.phaseAt;
    S.cur.debriefNotes = S.debrief.notes.map((n) => n.kind + ':' + n.text);
    S.history.push(S.cur);
    logEvent('round_end', { safety: S.safety, debriefMs: S.cur.debriefMs });
    if (S.safety <= 0) {
      S.ended = 'gameover';
      logEvent('game_over', {});
      go('end');
      return;
    }
    if (S.round >= D.WAVES.length) {
      S.ended = 'complete';
      logEvent('chapter_complete', { safety: S.safety });
      go('end');
      return;
    }
    const inc = Sim.income(S.gold, S.streak.n, D);
    S.gold += inc.total;
    S.lastIncome = inc;
    logEvent('income', inc);
    S.round++;
    beginRound();
  }

  function replay() {
    logEvent('replay_click', {});
    if (!S.endedAt) S.endedAt = new Date().toISOString();
    S = newGame(S);
    logEvent('session_start', { seed: S.seed, participant: S.participant || null, playIndex: S.playIndex, replay: true });
    beginRound();
  }

  function logFilename() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const who = (S.participant || 'anon').replace(/[^A-Za-z0-9_-]/g, '') || 'anon';
    return 'golden-hour-log-' + who + '-' + stamp + '.json';
  }

  function showRaw() {
    const det = document.getElementById('rawlog');
    const raw = document.getElementById('raw');
    if (raw) raw.value = JSON.stringify(buildLog(), null, 2);
    if (det) det.open = true;
    if (raw) { raw.focus(); raw.select(); }
  }

  function downloadLog() {
    const json = JSON.stringify(buildLog(), null, 2);
    const filename = logFilename();
    if (downloads) {
      downloads.save({ filename, data: json }).then(() => {
        logEvent('log_saved', { via: 'downloads' });
        toast('紀錄已儲存');
      }).catch((e) => {
        if (e && e.code === 'declined') toast('已取消儲存');
        else if (e && e.code === 'rate_limited') toast('已經有一個儲存視窗開著，請稍後再試');
        else { toast('這個畫面不能儲存檔案，請改用「複製紀錄」'); showRaw(); }
      });
      return;
    }
    if (!window.claude) {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      logEvent('log_saved', { via: 'blob' });
      toast('紀錄已下載');
      return;
    }
    toast('這個畫面不能儲存檔案，請改用「複製紀錄」');
    showRaw();
  }

  function copyLog() {
    const json = JSON.stringify(buildLog(), null, 2);
    try {
      navigator.clipboard.writeText(json).then(() => {
        logEvent('log_copied', {});
        toast('紀錄已複製');
      }).catch(() => { showRaw(); toast('請選取下方文字後複製'); });
    } catch (e) {
      showRaw();
      toast('請選取下方文字後複製');
    }
  }

  // 依「每種敵人先出現一次」的順序揭露敵情，讓判讀準確的人先看到隱藏威脅
  function revealOrder(w) {
    const list = Sim.expandEnemies(w, D);
    const byKind = {};
    const kinds = [];
    list.forEach((e) => {
      if (!byKind[e.kind]) { byKind[e.kind] = []; kinds.push(e.kind); }
      byKind[e.kind].push(e);
    });
    const out = [];
    let added = true;
    while (added) {
      added = false;
      kinds.forEach((k) => {
        const e = byKind[k].shift();
        if (e) { out.push(e); added = true; }
      });
    }
    return out;
  }

  // ── 畫面
  function header() {
    const pct = Math.max(0, Math.min(100, S.safety));
    const tone = S.safety > 60 ? 'good' : S.safety > 30 ? 'warn' : 'crit';
    const augs = S.augments.length
      ? '<div class="bar-aug">' + S.augments.map((id) => '<span class="pill">' + esc(augName(id)) + '</span>').join('') + '</div>'
      : '';
    return '<header class="bar"><div class="bar-in">' +
      '<div class="stat"><span class="k">回合</span><span class="v num">' + S.round + '<small>/' + D.WAVES.length + '</small></span></div>' +
      '<div class="stat grow"><span class="k">病人安全指數</span><span class="meter ' + tone + '" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + S.safety + '" aria-label="病人安全指數"><span style="width:' + pct + '%"></span></span><span class="v num">' + S.safety + '</span></div>' +
      '<div class="stat"><span class="k">資源</span><span class="v num">' + S.gold + '</span></div>' +
      '<div class="stat"><span class="k">上場</span><span class="v num">' + boardCount() + '<small>/' + cap() + '</small></span></div>' +
      '</div>' + augs + '</header>';
  }

  function viewStart() {
    return '<section class="hero">' +
      '<p class="eyebrow">ICU Sepsis・NP 學員教學型自走棋・灰盒原型 v' + esc(D.VERSION) + '</p>' +
      '<h1 class="display">黃金一小時</h1>' +
      '<p class="lede">你是 ICU 值班 NP。判讀病人、調度跨專業團隊、湊齊 Hour-1 bundle，在 60 分鐘內把 septic shock 拉回來。</p>' +
      '<div class="monitor" aria-hidden="true">' +
        '<div class="mv hr"><span>HR</span><b class="num">128</b></div>' +
        '<div class="mv bp"><span>MAP</span><b class="num">58</b></div>' +
        '<div class="mv rr"><span>RR</span><b class="num">28</b></div>' +
        '<div class="mv lac"><span>Lactate</span><b class="num">4.2</b></div>' +
      '</div>' +
    '</section>' +
    '<section class="card"><h2>怎麼玩</h2><ol class="steps">' +
      '<li><b>評估</b>：點出異常值、選評估工具。判讀得越準，看到的敵情越多。</li>' +
      '<li><b>調度</b>：用資源點數招募團隊成員。</li>' +
      '<li><b>佈陣</b>：床邊 8 個位置，編號就是出手順序；第 n 位在第 15×n 分鐘第一次出手。</li>' +
      '<li><b>自動處置</b>：團隊依序處置病理過程，時間軸從 0 走到 150 分鐘。</li>' +
      '<li><b>交班</b>：用 ISBAR 回顧這一回合，對照指引。</li>' +
    '</ol></section>' +
    '<section class="card"><h2>開始前</h2>' +
      '<div class="field"><label for="pid">參與者代號（選填）</label>' +
      '<input id="pid" type="text" maxlength="40" autocomplete="off" placeholder="例如 P01" value="' + esc(S.participant) + '">' +
      '<p class="hint">請不要輸入真實姓名。紀錄只存在這台裝置，不會自動上傳。</p></div>' +
      '<div class="field"><label for="pre">寫下你記得的 Hour-1 bundle 元素（選填）</label>' +
      '<textarea id="pre" rows="3" maxlength="2000">' + esc(S.preRecall) + '</textarea></div>' +
      '<button class="btn primary big" data-act="start">開始第一章</button>' +
    '</section>' +
    disclaimer();
  }

  function disclaimer() {
    return '<p class="disclaimer">教學用簡化模型，不能取代臨床判斷和院內 protocol。病例是虛構的，數值待臨床專家審閱。</p>';
  }

  function viewAugment() {
    const cards = S.augmentOffer.map((id) => {
      const a = D.AUGMENTS.find((x) => x.id === id);
      return '<button class="aug" data-act="aug" data-arg="' + esc(id) + '"><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + '</span>' +
        (a.source ? '<small>' + esc(a.source) + '</small>' : '') + '</button>';
    }).join('');
    return '<section class="card"><p class="eyebrow">第 ' + S.round + ' 回合開始</p><h2>院務事件：三選一</h2><div class="aug-list">' + cards + '</div></section>';
  }

  function viewAssess() {
    const w = wave();
    const a = S.assess;
    const done = !!a.result;
    const params = w.params.map((p) => {
      const on = a.flagged.includes(p.id);
      let cls = on ? 'on' : '';
      let mark = '';
      if (done) {
        if (p.abnormal && on) { cls += ' ok'; mark = '判讀正確'; }
        else if (p.abnormal && !on) { cls += ' miss'; mark = '漏判'; }
        else if (!p.abnormal && on) { cls += ' false'; mark = '誤判'; }
        else { mark = '正常'; }
      }
      return '<button class="param ' + cls + '" data-act="flag" data-arg="' + esc(p.id) + '" aria-pressed="' + on + '"' + (done ? ' disabled' : '') + '>' +
        '<span class="pl">' + esc(p.label) + '</span><span class="pv num">' + esc(p.value) + '</span>' +
        (done ? '<span class="why"><b>' + mark + '</b>・' + esc(p.why) + '</span>' : '') + '</button>';
    }).join('');
    const tools = Object.keys(w.tools).map((k) =>
      '<button class="tool' + (a.tool === k ? ' on' : '') + '" data-act="tool" data-arg="' + k + '" aria-pressed="' + (a.tool === k) + '"' + (done ? ' disabled' : '') + '>' + esc(D.TOOLS[k].name) + '</button>'
    ).join('');
    let result = '';
    if (done) {
      const r = a.result;
      result = '<div class="result q-' + r.quality + '">' +
        '<p class="tool-res">' + esc(r.result) + '</p>' +
        '<p>異常值判讀 <b class="num">' + r.correct.length + '/' + r.abnormalTotal + '</b>' +
        (r.falseFlags.length ? '，誤判 <b class="num">' + r.falseFlags.length + '</b> 項' : '') +
        '。揭露敵情 <b class="num">' + r.reveal + '/' + r.total + '</b>。</p>' +
        (r.tool === 'qsofa' ? noteHtml({ kind: 'warn', text: D.NOTES.qsofaOnly.text, source: D.NOTES.qsofaOnly.source }, 'p') : '') +
        '<button class="btn primary big" data-act="toPrep">前往調度與佈陣</button></div>';
    }
    return '<section class="card case"><p class="eyebrow">第 ' + w.round + ' 回合・評估</p>' +
      '<h2 class="display-s">' + esc(w.title) + '</h2><p>' + esc(w.summary) + '</p>' +
      '<h3>點出你判斷為異常的項目</h3><div class="params">' + params + '</div>' +
      '<h3>選擇篩檢／評估工具</h3><div class="tools">' + tools + '</div>' +
      (done ? '' : '<button class="btn primary big" data-act="assess"' + (a.tool ? '' : ' disabled') + '>完成評估</button>') +
      result + '</section>';
  }

  function slotLabel(i) {
    const t = Sim.slotTime(i, D);
    return '<span class="slot-l num' + (t > C.abxWindow ? ' late' : '') + '">#' + (i + 1) + '・' + t + '′</span>';
  }

  function tileHtml(it, area, i) {
    const sel = S.sel && S.sel.area === area && S.sel.i === i;
    const label = area === 'board' ? slotLabel(i) : '';
    const late = area === 'board' && Sim.slotTime(i, D) > C.abxWindow ? ' late' : '';
    if (!it) {
      return '<button class="slot empty' + late + (sel ? ' sel' : '') + '" data-act="slot" data-area="' + area + '" data-arg="' + i + '" aria-label="' +
        (area === 'board' ? '第 ' + (i + 1) + ' 位，空' : '候補位置，空') + '">' + label + '<span class="plus" aria-hidden="true">＋</span></button>';
    }
    const u = unit(it.id);
    return '<button class="slot unit ' + roleCls(u) + late + (sel ? ' sel' : '') + '" data-act="slot" data-area="' + area + '" data-arg="' + i + '" aria-pressed="' + !!sel + '">' +
      label + '<span class="uname">' + esc(u.short) + '</span>' +
      '<span class="utags">' + u.bundle.map((b) => '<span class="el">' + esc(bundleShort(b)) + '</span>').join('') +
      '<span class="cost num">' + u.cost + '</span></span></button>';
  }

  function intelHtml(w) {
    const order = revealOrder(w);
    const r = S.assess.result ? S.assess.result.reveal : 0;
    const items = order.map((e, idx) => (idx < r
      ? '<li class="foe k-' + e.kind + '"><span>' + esc(e.name) + '</span><span class="num">HP ' + e.hp + '</span></li>'
      : '<li class="foe unknown"><span>？未評估</span></li>')).join('');
    return '<section class="card"><div class="sec-h"><h2>敵情</h2><span class="muted num">揭露 ' + r + '/' + order.length + '</span></div>' +
      '<ul class="foes">' + items + '</ul>' +
      (w.shock ? '<p class="note crit"><span>疑似 septic shock：第一劑抗生素要在 <b>60 分鐘</b>內給。</span></p>' : '') + '</section>';
  }

  function boardHtml() {
    let rows = '';
    [0, 1].forEach((r) => {
      rows += '<div class="row-l">' + (r === 0 ? '前排（先出手）' : '後排') + '</div><div class="board-row">';
      for (let c = 0; c < 4; c++) rows += tileHtml(S.board[r * 4 + c], 'board', r * 4 + c);
      rows += '</div>';
    });
    return '<section class="card"><div class="sec-h"><h2>床邊佈陣</h2><span class="muted">編號＝出手順序</span></div>' + rows +
      '<p class="hint">點角色選取，再點另一格移動或交換。虛線格子要超過 60 分鐘才第一次出手。</p></section>';
  }

  function benchHtml() {
    return '<section class="card"><div class="sec-h"><h2>候補</h2><span class="muted num">' + S.bench.filter(Boolean).length + '/' + E.benchSize + '</span></div>' +
      '<div class="bench">' + S.bench.map((it, i) => tileHtml(it, 'bench', i)).join('') + '</div></section>';
  }

  function traitsHtml(t) {
    const els = D.BUNDLE.map((b) => '<li class="' + (t.bundle.present.includes(b.id) ? 'lit' : '') + '"><span class="dot" aria-hidden="true"></span>' + esc(b.name) +
      '<span class="sr">' + (t.bundle.present.includes(b.id) ? '（已上場）' : '（缺）') + '</span></li>').join('');
    let tierText;
    if (t.bundle.tier === 0) tierText = '湊到 3 項：' + D.HOUR1_TIERS[0].text;
    else if (t.bundle.tier === 1) tierText = '已啟動：' + D.HOUR1_TIERS[0].text + '。湊齊 5 項：黃金一小時';
    else tierText = '已啟動：' + D.HOUR1_TIERS[1].text;
    const roles = Object.keys(D.ROLES).map((rid) => {
      const r = t.roles[rid];
      return '<li class="role' + (r.tier ? ' on' : '') + '"><span class="rtag r-' + rid + '">' + esc(D.ROLES[rid].name) + '</span>' +
        '<span class="cnt num">' + r.count + '</span><span class="th num">門檻 ' + r.thresholds.join(' / ') + '</span>' +
        '<span class="eff">' + (r.active ? esc(r.active.text) : '未啟動') + '</span></li>';
    }).join('');
    return '<section class="card"><div class="sec-h"><h2>羈絆</h2></div>' +
      '<div class="h1 t' + t.bundle.tier + '"><div class="h1-h"><b>Hour-1 bundle</b><span class="num big">' + t.bundle.count + '<small>/5</small></span></div>' +
      '<ul class="els">' + els + '</ul><p class="eff">' + esc(tierText) + '</p></div>' +
      '<ul class="roles-l">' + roles + '</ul>' +
      '<p class="hint">羈絆只算「不重複」：同一個角色招兩次，不會多算一項。</p></section>';
  }

  function shopHtml() {
    const cards = S.shop.map((id, i) => {
      if (!id) return '<div class="shop-card sold" aria-label="已招募">已招募</div>';
      const u = unit(id);
      const sel = S.sel && S.sel.area === 'shop' && S.sel.i === i;
      return '<button class="shop-card ' + roleCls(u) + (sel ? ' sel' : '') + (S.gold < u.cost ? ' poor' : '') + '" data-act="shop" data-arg="' + i + '" aria-pressed="' + !!sel + '">' +
        '<span class="sc-h"><b>' + esc(u.short) + '</b><span class="cost num">' + u.cost + '</span></span>' +
        '<span class="sc-r">' + u.roles.map((r) => esc(D.ROLES[r].name)).join('・') + '</span>' +
        '<span class="sc-e">' + (u.bundle.length ? u.bundle.map((b) => esc(bundleShort(b))).join('、') : '—') + '</span></button>';
    }).join('');
    const inc = S.lastIncome
      ? '<p class="muted num">本回合收入 +' + S.lastIncome.total + '（基本 ' + S.lastIncome.base + '・利息 ' + S.lastIncome.interest + '・連續 ' + S.lastIncome.streak + '）</p>'
      : '';
    return '<section class="card"><div class="sec-h"><h2>調度</h2><button class="btn small" data-act="reroll"' + (S.gold >= E.rerollCost ? '' : ' disabled') + '>刷新 −' + E.rerollCost + '</button></div>' +
      '<div class="shop">' + cards + '</div>' + inc +
      '<p class="hint">點卡片看說明，再按「招募」，或直接點棋盤空位上場。商店至少會有一張卡能補上你缺的 bundle 元素。每存 10 點，下回合利息 +1。</p></section>';
  }

  function selHtml() {
    if (!S.sel) return '';
    const it = getAt(S.sel.area, S.sel.i);
    if (!it) return '';
    const u = unit(it.id);
    const fromShop = S.sel.area === 'shop';
    const tags = u.roles.map((r) => '<span class="rtag r-' + r + '">' + esc(D.ROLES[r].name) + '</span>').join('') +
      u.bundle.map((b) => '<span class="el">' + esc(bundleName(b)) + '</span>').join('');
    let actions;
    if (fromShop) {
      actions = '<button class="btn primary" data-act="recruit"' + (S.gold >= u.cost ? '' : ' disabled') + '>招募到候補 −' + u.cost + '</button>' +
        '<button class="btn ghost" data-act="desel">取消</button>';
    } else {
      actions = '<button class="btn" data-act="sell">出售 +' + u.cost + '</button>' +
        (S.sel.area === 'board' ? '<button class="btn" data-act="toBench">移回候補</button>' : '') +
        '<button class="btn ghost" data-act="desel">取消選取</button>';
    }
    return '<div class="sheet" role="region" aria-label="角色說明"><div class="sheet-in">' +
      '<div class="sheet-h"><b>' + esc(u.name) + '</b><span class="cost num">' + u.cost + ' 點</span></div>' +
      '<p class="tags">' + tags + '</p><p class="desc">' + esc(u.desc) + '</p>' +
      (u.source ? '<p class="src">' + esc(u.source) + '</p>' : '') +
      (fromShop ? '' : '<p class="hint">再點另一格就能移動或交換。</p>') +
      '<div class="sheet-a">' + actions + '</div></div></div>';
  }

  function viewPrep() {
    const t = Sim.computeTraits(boardIds(), D, S.augments);
    return '<div class="prep"><div class="col">' + intelHtml(wave()) + boardHtml() + benchHtml() + '</div>' +
      '<div class="col">' + traitsHtml(t) + shopHtml() +
      '<div class="cta"><button class="btn primary big" data-act="combat"' + (boardCount() ? '' : ' disabled') + '>開始處置</button></div></div></div>';
  }

  function timeline(t, res) {
    const pct = (x) => ((x / C.end) * 100).toFixed(2) + '%';
    const abx = res.metrics.abxAt;
    const mark = abx !== null && abx <= t
      ? '<span class="tl-mark ' + (abx <= C.abxWindow ? 'ok' : 'late') + '" style="left:' + pct(abx) + '">Abx ' + abx + '′</span>'
      : '';
    return '<div class="tl" aria-hidden="true"><div class="tl-track"><span class="tl-window" style="width:' + pct(C.abxWindow) + '"></span>' +
      '<span class="tl-fill" style="width:' + pct(t) + '"></span>' + mark + '</div>' +
      '<div class="tl-l"><span>0′</span><span class="w" style="left:' + pct(C.abxWindow) + '">60′ 黃金一小時</span><span class="e">' + C.end + '′</span></div></div>';
  }

  function evHtml(ev) {
    if (ev.kind === 'pressure') return '<li class="ev pressure"><span class="t num">' + ev.t + '′</span><span>' + esc(ev.action) + '</span></li>';
    const u = unit(ev.unit);
    const hits = ev.hits.map((h) => esc(h.name) + ' −' + h.dmg + (h.crit ? '（爆擊）' : '') + (h.killed ? '・已控制' : '')).join('、');
    return '<li class="ev ' + ev.kind + '"><span class="t num">' + ev.t + '′</span><span><b>#' + (ev.slot + 1) + ' ' + esc(u.short) + '</b> ' + esc(ev.action) + (hits ? '：' + hits : '') + '</span></li>';
  }

  function viewCombat() {
    const c = S.combat;
    const res = c.result;
    const f = res.frames[c.frame] || res.frames[res.frames.length - 1];
    const t = f ? f.t : 0;
    const foes = res.enemies.map((e, idx) => {
      const hp = f.hp[idx];
      const max = f.max[idx];
      const hidden = e.kind === 'lactate' && !f.lactateSeen;
      const pct = max ? Math.round((hp / max) * 100) : 0;
      const label = hidden ? '未量測' : hp <= 0 ? '已控制' : hp + '/' + max;
      return '<li class="foe live k-' + e.kind + (hp <= 0 ? ' dead' : '') + '"><div class="foe-h"><span>' + esc(e.name) + '</span><span class="num">' + label + '</span></div>' +
        '<div class="hpbar' + (hidden ? ' unk' : '') + '"><span style="width:' + (hidden ? 100 : pct) + '%"></span></div></li>';
    }).join('');
    const feed = res.events.filter((ev) => ev.t <= t).slice().reverse().map(evHtml).join('');
    let foot;
    if (c.done) {
      const parts = ['持續傷害 ' + res.pressure, '殘留 ' + res.remainingThreat].concat(res.penalties.map((p) => p.text + ' ' + p.amount));
      foot = '<div class="result ' + (res.win ? 'q-good' : 'q-poor') + '"><p><b>' + (res.win ? '控制住了' : '還沒控制住') + '</b>：病人安全指數 −<span class="num">' + res.damage + '</span>（' + esc(parts.join('・')) + '）</p>' +
        '<button class="btn primary big" data-act="toDebrief">交班 Debrief</button></div>';
    } else {
      foot = '<button class="btn" data-act="skip">快轉到結束</button>';
    }
    return '<section class="card"><p class="eyebrow">第 ' + S.round + ' 回合・自動處置</p>' +
      '<div class="clock"><span class="num">T+' + t + '′</span><span class="muted num">/ ' + C.end + '′</span></div>' +
      timeline(t, res) + '<ul class="foes">' + foes + '</ul>' + foot + '</section>' +
      '<section class="card"><h2>處置紀錄</h2><ol class="feed">' + (feed || '<li class="muted">等待第一位出手…</li>') + '</ol></section>';
  }

  function noteHtml(n, tag) {
    tag = tag || 'li';
    return '<' + tag + ' class="note ' + n.kind + '"><span>' + esc(n.text) + '</span>' + (n.source ? '<small>' + esc(n.source) + '</small>' : '') + '</' + tag + '>';
  }

  function viewDebrief() {
    const d = S.debrief;
    const m = S.combat.result.metrics;
    const isbar = [['I', 'Identify'], ['S', 'Situation'], ['B', 'Background'], ['A', 'Assessment'], ['R', 'Recommendation']].map((p) =>
      '<div class="isbar-r"><dt><b>' + p[0] + '</b><span>' + p[1] + '</span></dt><dd>' + esc(d.isbar[p[0]]) + '</dd></div>'
    ).join('');
    const exec = D.BUNDLE.map((b) => {
      const v = m.executed[b.id];
      return '<li class="' + (v === null ? 'no' : 'yes') + '"><span>' + esc(b.short) + '</span><span class="num">' + (v === null ? '—' : v + '′') + '</span></li>';
    }).join('');
    const label = S.safety <= 0 ? '進入 M&M 檢討' : S.round >= D.WAVES.length ? '完成第一章' : '下一回合';
    return '<section class="card"><p class="eyebrow">第 ' + S.round + ' 回合・交班 Debrief</p><h2>ISBAR 交班</h2><dl class="isbar">' + isbar + '</dl>' +
      '<p class="src">' + esc(D.SRC.muller2018) + '</p></section>' +
      '<section class="card"><h2>Bundle 執行時間</h2><ul class="exec">' + exec + '</ul>' +
      '<p class="muted num">上場 ' + m.bundleOnBoard + '/5・實際執行 ' + m.executedCount + '/5</p></section>' +
      '<section class="card"><h2>指引對照</h2><ul class="notes">' + (d.notes.length ? d.notes.map((n) => noteHtml(n)).join('') : '<li class="muted">這一回合沒有需要特別提醒的項目。</li>') + '</ul></section>' +
      '<section class="card"><h2>遊戲簡化說明</h2><ul class="simp">' + d.simplifications.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></section>' +
      '<div class="cta"><button class="btn primary big" data-act="next">' + label + '</button></div>';
  }

  function viewEnd() {
    const over = S.ended === 'gameover';
    const rows = S.history.map((h) => {
      const c = h.combat || {};
      const m = c.metrics || {};
      return '<tr><td class="num">' + h.round + '</td><td>' + (c.win ? '控制' : '未控制') + '</td><td class="num">−' + c.damage + '</td>' +
        '<td class="num">' + m.bundleOnBoard + '/5</td><td class="num">' + (m.abxAt == null ? '—' : m.abxAt + '′') + '</td>' +
        '<td>' + (m.cultureBeforeAbx ? '是' : '否') + '</td><td>' + (h.assessment ? esc(D.TOOLS[h.assessment.tool].name) : '—') + '</td></tr>';
    }).join('');
    return '<section class="card"><p class="eyebrow">' + (over ? 'M&M 檢討' : '第一章完成') + '</p>' +
      '<h1 class="display-s">' + (over ? '病人安全指數歸零' : '病人撐過了黃金一小時') + '</h1>' +
      '<p>' + (over ? '這不是懲罰，是檢討：看哪一回合扣最多分，問題出在哪一項 bundle。' : '最後病人安全指數 ' + S.safety + '。') + '</p>' +
      '<div class="tbl"><table><thead><tr><th>回合</th><th>結果</th><th>扣分</th><th>Bundle</th><th>抗生素</th><th>先培養</th><th>評估工具</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
      '<section class="card"><h2>最後一題</h2><div class="field"><label for="post">現在寫下你記得的 Hour-1 bundle 元素</label>' +
      '<textarea id="post" rows="3" maxlength="2000">' + esc(S.postRecall) + '</textarea></div></section>' +
      '<section class="card"><h2>研究紀錄</h2><p class="muted">這台裝置本次共 ' + (S.archive.length + 1) + ' 局。紀錄不會自動上傳，請交給研究人員。</p>' +
      '<div class="row-btns">' + (canDownload ? '<button class="btn primary" data-act="download">儲存紀錄（.json）</button>' : '') +
      '<button class="btn" data-act="copy">複製紀錄</button></div>' +
      '<details id="rawlog"><summary>顯示紀錄原文</summary><textarea id="raw" rows="8" readonly aria-label="研究紀錄 JSON"></textarea></details></section>' +
      '<div class="cta"><button class="btn primary big" data-act="replay">再玩一局</button></div>' + disclaimer();
  }

  function focusKey(el) {
    if (!el || !el.dataset || !el.dataset.act) return null;
    return el.dataset.act + '|' + (el.dataset.area || '') + '|' + (el.dataset.arg || '');
  }

  function render() {
    const key = focusKey(document.activeElement);
    let body = '';
    switch (S.phase) {
      case 'start': body = viewStart(); break;
      case 'augment': body = viewAugment(); break;
      case 'assess': body = viewAssess(); break;
      case 'prep': body = viewPrep(); break;
      case 'combat': body = viewCombat(); break;
      case 'debrief': body = viewDebrief(); break;
      case 'end': body = viewEnd(); break;
      default: body = '';
    }
    const sheet = S.phase === 'prep' ? selHtml() : '';
    app.innerHTML = (S.phase === 'start' ? '' : header()) + '<main class="main' + (sheet ? ' has-sheet' : '') + '">' + body + '</main>' + sheet;
    if (key) {
      const parts = key.split('|');
      const sel = '[data-act="' + parts[0] + '"]' + (parts[1] ? '[data-area="' + parts[1] + '"]' : '') + (parts[2] ? '[data-arg="' + parts[2] + '"]' : '');
      const el = app.querySelector(sel);
      if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  // ── 事件
  app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const arg = el.dataset.arg;
    switch (el.dataset.act) {
      case 'start': startGame(); break;
      case 'aug': pickAugment(arg); break;
      case 'flag': toggleFlag(arg); break;
      case 'tool': chooseTool(arg); break;
      case 'assess': submitAssess(); break;
      case 'toPrep': enforceCap(); go('prep'); break;
      case 'shop': selectShop(Number(arg)); break;
      case 'recruit': recruit(); break;
      case 'slot': tapSlot(el.dataset.area, Number(arg)); break;
      case 'sell': sell(); break;
      case 'toBench': toBench(); break;
      case 'desel': S.sel = null; render(); break;
      case 'reroll': reroll(); break;
      case 'combat': startCombat(); break;
      case 'skip': logEvent('combat_skip', { frame: S.combat ? S.combat.frame : null }); finishCombat(); break;
      case 'toDebrief': go('debrief'); break;
      case 'next': nextFromDebrief(); break;
      case 'download': downloadLog(); break;
      case 'copy': copyLog(); break;
      case 'replay': replay(); break;
      default: break;
    }
  });

  app.addEventListener('input', (ev) => {
    const id = ev.target.id;
    if (id === 'pid') S.participant = ev.target.value.slice(0, 40);
    else if (id === 'pre') S.preRecall = ev.target.value.slice(0, 2000);
    else if (id === 'post') S.postRecall = ev.target.value.slice(0, 2000);
  });

  app.addEventListener('change', (ev) => {
    if (ev.target.id === 'post' && S.postRecall.trim()) logEvent('recall_post', { text: S.postRecall.trim() });
  });

  app.addEventListener('toggle', (ev) => {
    if (ev.target.id === 'rawlog' && ev.target.open) {
      const raw = document.getElementById('raw');
      if (raw) raw.value = JSON.stringify(buildLog(), null, 2);
    }
  }, true);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && S && S.sel) { S.sel = null; render(); }
  });

  // ── 啟動（支援 viewer 的熱更新：重新發布時保留進度）
  function start(data) {
    if (data && data.S && data.S.v === 1) { S = data.S; R = null; }
    else S = newGame(null);
    render();
    if (S.phase === 'combat' && S.combat && !S.combat.done) play();
  }

  const hot = window.claude && window.claude.hot;
  try { if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => ({ S })); } catch (e) { /* ignore */ }
  if (hot && typeof hot.ready === 'function') hot.ready(start);
  else start((hot && hot.data) || {});

  // 測試與除錯用
  window.__goldenHour = { state: () => S, buildLog };
})();
