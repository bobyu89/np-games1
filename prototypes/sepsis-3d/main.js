/*
 * 《黃金一小時》3D 試作：流程與介面
 * 這是「3D 視覺試作」：只有佈陣和自動處置，沒有商店、評估和研究紀錄（那些在灰盒版）。
 */
import { Stage } from './stage.js';

const D = window.GameData;
const Sim = window.Sim;
const C = D.COMBAT;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unit = (id) => Sim.unitById(D, id);
const bundleShort = (id) => D.BUNDLE.find((b) => b.id === id).short;

const PRESETS = window.Presets;

const S = {
  round: 3,
  board: new Array(C.slots).fill(null),
  sel: null,            // 選取中的角色 id
  phase: 'loading',     // loading | prep | combat | result | error
  speed: 1,
  attempt: 0,
  result: null,
  debrief: null,
  simT: 0,
  safety: 100,
  lastEvent: '',
};

const el = { north: $('#north'), top: $('#top'), traits: $('#traits'), south: $('#south'), toast: $('#toast'), loading: $('#loading') };
let stage = null;
let toastTimer = null;

const wave = () => D.WAVES[S.round - 1];
const cap = () => Sim.teamCap(wave(), []);
const count = () => S.board.filter(Boolean).length;
const traits = () => Sim.computeTraits(S.board, D, []);

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2200);
}

function vitalsOf(w) {
  const get = (id) => (w.params.find((p) => p.id === id) || {}).value || '';
  const bp = /(\d+)\s*\/\s*(\d+)/.exec(get('bp'));
  const num = (s) => { const m = /[\d.]+/.exec(s); return m ? m[0] : null; };
  return {
    hr: num(get('hr')),
    map: bp ? Math.round((Number(bp[1]) + 2 * Number(bp[2])) / 3) : null,
    lac: num(get('lac')),
  };
}

function applyPreset() {
  S.board = new Array(C.slots).fill(null);
  PRESETS[S.round].slice(0, cap()).forEach((id, i) => { S.board[i] = id; });
  S.sel = null;
}

function setRound(n) {
  S.round = Math.max(1, Math.min(D.WAVES.length, n));
  S.phase = 'prep';
  S.result = null;
  S.debrief = null;
  S.simT = 0;
  S.safety = 100;
  S.lastEvent = '';
  S.sel = null;
  let over = count() - cap();                     // 人數上限變少時，從後面的位置開始撤下
  for (let i = C.slots - 1; i >= 0 && over > 0; i--) if (S.board[i]) { S.board[i] = null; over--; }
  stage.backToPrep();
  stage.speed = S.speed;
  stage.setWave(Sim.expandEnemies(wave(), D));
  stage.setVitals(vitalsOf(wave()));
  stage.setSafety(100);
  sync();
}

// ───────────── 佈陣操作 ─────────────
function tapUnit(id) {
  if (S.phase !== 'prep') return;
  S.sel = S.sel === id ? null : id;
  sync();
}

function tapSlot(i) {
  if (S.phase !== 'prep') return;
  const here = S.board[i];
  if (!S.sel) {
    if (here) { S.sel = here; sync(); }
    return;
  }
  const from = S.board.indexOf(S.sel);
  if (from === i) { S.sel = null; sync(); return; }
  if (from === -1) {
    if (!here && count() >= cap()) { toast('這一回合最多上場 ' + cap() + ' 人'); return; }
    S.board[i] = S.sel;                           // 原本站在這格的人回到候補
  } else {
    S.board[from] = here || null;
    S.board[i] = S.sel;
  }
  S.sel = null;
  sync();
}

function benchSelected() {
  const i = S.board.indexOf(S.sel);
  if (i !== -1) S.board[i] = null;
  S.sel = null;
  sync();
}

// ───────────── 處置 ─────────────
function startCombat() {
  if (S.phase !== 'prep') return;
  if (!count()) { toast('至少派 1 名角色上場'); return; }
  S.attempt++;
  S.sel = null;
  S.phase = 'combat';
  S.simT = 0;
  S.safety = 100;
  S.lastEvent = '';
  const seed = (9000 + S.round * 131 + S.attempt * 7919) >>> 0;
  S.result = Sim.simulateCombat({ wave: wave(), board: S.board, data: D, augments: [], seed });
  S.debrief = Sim.buildDebrief(wave(), null, S.result, D);
  stage.setBoard(S.board, -1, false);
  if (!stage.fresh) stage.setWave(Sim.expandEnemies(wave(), D));
  stage.setSafety(100);
  stage.speed = S.speed;
  renderAll();
  stage.play(S.result, {
    onTime: (t) => { S.simT = t; tick(); },
    onEvent: (ev) => {
      const u = unit(ev.unit);
      const hits = (ev.hits || []).map((h) => h.name + ' −' + h.dmg + (h.crit ? '（爆擊）' : '')).join('、');
      S.lastEvent = ev.t + '′　#' + (ev.slot + 1) + ' ' + u.short + '：' + ev.action + (hits ? '（' + hits + '）' : '');
      const line = $('#ticker');
      if (line) line.textContent = S.lastEvent;
    },
    onPressure: (amount) => { S.safety = Math.max(0, S.safety - amount); stage.setSafety(S.safety); tick(); flashHarm(); },
    onDone: () => {
      S.phase = 'result';
      S.simT = S.result.endTime;
      S.safety = Math.max(0, 100 - S.result.damage);
      stage.setSafety(S.safety);
      renderAll();
    },
  });
}

function flashHarm() {
  const v = $('#vignette');
  v.classList.remove('harm');
  void v.offsetWidth;
  v.classList.add('harm');
}

// ───────────── 畫面 ─────────────
function renderTop() {
  const w = wave();
  const combat = S.phase === 'combat' || S.phase === 'result';
  const pct = (x) => ((x / C.end) * 100).toFixed(2) + '%';
  el.top.innerHTML =
    '<div class="round">' +
      '<button class="ib" data-act="prev" aria-label="上一回合"' + (S.round > 1 && S.phase !== 'combat' ? '' : ' disabled') + '>‹</button>' +
      '<div class="round-t"><span class="eyebrow num">第 ' + w.round + ' / ' + D.WAVES.length + ' 回合</span><strong>' + esc(w.title) + '</strong></div>' +
      '<button class="ib" data-act="next" aria-label="下一回合"' + (S.round < D.WAVES.length && S.phase !== 'combat' ? '' : ' disabled') + '>›</button>' +
    '</div>' +
    '<div class="safety"><span class="k">病人安全指數</span><span class="meter" id="meter"><i></i></span><b class="num" id="safety">100</b></div>' +
    '<div class="clock"><b class="num" id="clock">' + (combat ? 'T+0′' : '備戰') + '</b>' +
      '<div class="tl' + (w.shock ? ' shock' : '') + '"><span class="tl-win" style="width:' + pct(C.abxWindow) + '"></span><span class="tl-fill" id="tlfill"></span>' +
      '<span class="tl-mark" id="abx" hidden></span><span class="tl-60 num" style="left:' + pct(C.abxWindow) + '">60′</span></div>' +
    '</div>';
  tick();
}

function tick() {
  const combat = S.phase === 'combat' || S.phase === 'result';
  const meter = $('#meter');
  if (!meter) return;
  meter.firstChild.style.width = S.safety + '%';
  meter.className = 'meter ' + (S.safety > 60 ? 'good' : S.safety > 30 ? 'warn' : 'crit');
  $('#safety').textContent = String(Math.round(S.safety));
  if (!combat) return;
  const t = S.simT;
  $('#clock').textContent = 'T+' + Math.floor(t) + '′';
  $('#tlfill').style.width = ((t / C.end) * 100).toFixed(2) + '%';
  const m = S.result.metrics;
  const abx = $('#abx');
  if (m.abxAt !== null && t >= m.abxAt && abx.hidden) {
    abx.hidden = false;
    abx.textContent = 'Abx ' + m.abxAt + '′';
    abx.style.left = ((m.abxAt / C.end) * 100).toFixed(2) + '%';
    abx.className = 'tl-mark num ' + (m.abxAt <= C.abxWindow ? 'ok' : 'late');
  }
  D.BUNDLE.forEach((b) => {                         // bundle 元素在實際執行的那一刻亮起
    const at = m.executed[b.id];
    const chip = document.getElementById('b-' + b.id);
    if (chip && at !== null && t >= at && !chip.classList.contains('done')) {
      chip.classList.add('done');
      chip.querySelector('.when').textContent = at + '′';
    }
  });
}

function renderTraits() {
  const t = traits();
  const combat = S.phase === 'combat' || S.phase === 'result';
  const chips = D.BUNDLE.map((b) => {
    const on = t.bundle.present.includes(b.id);
    const at = combat ? S.result.metrics.executed[b.id] : null;
    const done = at !== null && S.simT >= at;
    return '<li id="b-' + b.id + '" class="chip' + (on ? ' on' : '') + (done ? ' done still' : '') + '"><span class="dot" aria-hidden="true"></span><span class="nm">' + esc(b.short) + '</span>' +
      '<span class="when num">' + (done ? at + '′' : combat ? '' : on ? '上場' : '缺') + '</span></li>';
  }).join('');
  const tier = t.bundle.tier;
  const tierText = tier === 2 ? '黃金一小時：對低血壓、MODS +40%，乳酸停止上升' : tier === 1 ? '處置力 +15%（湊齊 5 項啟動黃金一小時）' : '湊到 3 項：處置力 +15%';
  const roles = Object.keys(D.ROLES).map((rid) => {
    const r = t.roles[rid];
    return '<li class="role r-' + rid + (r.tier ? ' on' : '') + '"><span class="rn">' + esc(D.ROLES[rid].name) + '</span><span class="num">' + r.count + '/' + r.thresholds[Math.min(r.tier, r.thresholds.length - 1)] + '</span>' +
      '<span class="eff">' + (r.active ? esc(r.active.text) : '未啟動') + '</span></li>';
  }).join('');
  el.traits.innerHTML =
    '<div class="h1 t' + tier + '"><div class="h1-h"><b>Hour-1 bundle</b><span class="num">' + t.bundle.count + '<small>/5</small></span></div>' +
    '<ul class="chips">' + chips + '</ul><p class="eff">' + esc(tierText) + '</p></div>' +
    '<ul class="roles">' + roles + '</ul>';
  if (combat) tick();
}

function benchCard(u) {
  const slot = S.board.indexOf(u.id);
  const sel = S.sel === u.id;
  const role = u.roles.length > 1 ? 'dual' : u.roles[0];
  return '<button class="card r-' + role + (sel ? ' sel' : '') + (slot !== -1 ? ' placed' : '') + '" data-act="unit" data-arg="' + u.id + '" aria-pressed="' + sel + '">' +
    '<span class="c-n">' + esc(u.short) + '</span>' +
    '<span class="c-b">' + (u.bundle.length ? u.bundle.map((b) => esc(bundleShort(b))).join('、') : '—') + '</span>' +
    '<span class="c-s num">' + (slot !== -1 ? '#' + (slot + 1) : '候補') + '</span></button>';
}

function renderSouth() {
  el.south.classList.toggle('as-result', S.phase === 'result');
  if (S.phase === 'result') { el.south.innerHTML = resultHtml(); return; }
  if (S.phase === 'combat') {
    el.south.innerHTML =
      '<p class="ticker" id="ticker">' + esc(S.lastEvent || '團隊就位，依站位順序開始處置…') + '</p>' +
      '<div class="actions"><button class="btn" data-act="speed">速度 ' + S.speed + '×</button><button class="btn" data-act="skip">快轉到結束</button></div>';
    return;
  }
  let info;
  if (S.sel) {
    const u = unit(S.sel);
    const placed = S.board.indexOf(u.id) !== -1;
    info = '<div class="info sel"><p><b>' + esc(u.name) + '</b>　' + esc(u.desc) + '</p>' +
      '<div class="info-a">' + (placed ? '<button class="btn small" data-act="bench">移回候補</button>' : '') +
      '<button class="btn small ghost" data-act="desel">取消</button></div></div>';
  } else {
    info = '<div class="info"><p>點角色，再點格子。<b>編號＝出手順序</b>：第 n 位在第 15×n 分鐘出手，後排超過 60 分鐘。</p></div>';
  }
  el.south.innerHTML = info +
    '<div class="bench" role="group" aria-label="團隊成員">' + D.UNITS.map(benchCard).join('') + '</div>' +
    '<div class="actions"><span class="count num">上場 ' + count() + '/' + cap() + '</span>' +
    '<button class="btn" data-act="preset">建議陣容</button><button class="btn" data-act="clear">清空</button>' +
    '<button class="btn primary" data-act="go"' + (count() ? '' : ' disabled') + '>開始處置</button></div>';
}

function resultHtml() {
  const r = S.result;
  const m = r.metrics;
  const parts = ['持續傷害 ' + r.pressure, '殘留 ' + r.remainingThreat].concat(r.penalties.map((p) => p.text + ' ' + p.amount));
  const exec = D.BUNDLE.map((b) => {
    const v = m.executed[b.id];
    return '<li class="' + (v === null ? 'no' : 'yes') + '"><span>' + esc(b.short) + '</span><b class="num">' + (v === null ? '—' : v + '′') + '</b></li>';
  }).join('');
  const order = { warn: 0, good: 1, info: 2 };
  const li = (n) => '<li class="note ' + n.kind + '"><span>' + esc(n.text) + '</span>' + (n.source ? '<small>' + esc(n.source) + '</small>' : '') + '</li>';
  const sorted = S.debrief.notes.slice().sort((a, b) => order[a.kind] - order[b.kind]);
  const wide = window.matchMedia('(min-width: 900px)').matches;
  // 窄螢幕只先顯示最重要的一則，其餘收合，棋盤才不會被擠掉
  let notes = '';
  if (sorted.length) {
    notes = '<ul class="notes">' + li(sorted[0]) + '</ul>';
    if (sorted.length > 1) {
      notes += '<details class="more"' + (wide ? ' open' : '') + '><summary>其他 ' + (sorted.length - 1) + ' 則指引對照</summary><ul class="notes">' + sorted.slice(1).map(li).join('') + '</ul></details>';
    }
  }
  return '<div class="result ' + (r.win ? 'win' : 'lose') + '">' +
    '<div class="res-h"><h2>' + (r.win ? '控制住了' : '還沒控制住') + '</h2><p class="num">病人安全指數 −' + r.damage + '（' + esc(parts.join('・')) + '）</p></div>' +
    '<ul class="exec">' + exec + '</ul>' + notes +
    '<div class="actions"><button class="btn" data-act="retry">調整陣容再試</button>' +
    (S.round < D.WAVES.length ? '<button class="btn primary" data-act="nextRound">下一回合</button>' : '<button class="btn primary" data-act="restart">回到第 1 回合</button>') + '</div></div>';
}

function renderAll() {
  const a = document.activeElement;
  const key = a && a.dataset && a.dataset.act ? '[data-act="' + a.dataset.act + '"]' + (a.dataset.arg ? '[data-arg="' + a.dataset.arg + '"]' : '') : null;
  renderTop();
  renderTraits();
  renderSouth();
  if (key) {
    const again = document.querySelector(key);
    if (again && !again.disabled) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
  }
  measure();
}

// 佈陣有變動時：更新 3D 棋盤和面板
function sync() {
  stage.setBoard(S.board, S.sel ? S.board.indexOf(S.sel) : -1, !!S.sel);
  renderAll();
}

// 介面佔掉的邊界告訴舞台，棋盤才會置中在看得到的區域
function measure() {
  if (!stage) return;
  const app = $('#app').getBoundingClientRect();
  const top = el.top.getBoundingClientRect();
  const tr = el.traits.getBoundingClientRect();
  const south = el.south.getBoundingClientRect();
  const side = tr.width < app.width * 0.5;            // 寬螢幕：羈絆面板在左側
  const rail = south.left - app.left > app.width * 0.5;   // 寬螢幕的結算面板在右側
  stage.setInsets({
    top: (side ? top.bottom : tr.bottom) - app.top + 6,
    left: side ? tr.right - app.left + 6 : 0,
    right: rail ? app.right - south.left + 6 : 0,
    bottom: rail ? 12 : app.bottom - south.top + 6,
  });
}

// ───────────── 事件 ─────────────
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]');
  if (!b || b.disabled || !stage) return;
  switch (b.dataset.act) {
    case 'prev': setRound(S.round - 1); break;
    case 'next': setRound(S.round + 1); break;
    case 'unit': tapUnit(b.dataset.arg); break;
    case 'bench': benchSelected(); break;
    case 'desel': S.sel = null; sync(); break;
    case 'preset': applyPreset(); sync(); break;
    case 'clear': S.board = new Array(C.slots).fill(null); S.sel = null; sync(); break;
    case 'speed': S.speed = S.speed === 1 ? 2 : 1; stage.speed = S.speed; renderSouth(); measure(); break;
    case 'go': startCombat(); break;
    case 'skip': stage.fastForward(); break;
    case 'retry': setRound(S.round); break;
    case 'nextRound': setRound(S.round + 1); applyPreset(); sync(); break;
    case 'restart': setRound(1); applyPreset(); sync(); break;
    default: break;
  }
});

document.addEventListener('toggle', (ev) => { if (ev.target.classList && ev.target.classList.contains('more')) measure(); }, true);

document.addEventListener('keydown', (ev) => {
  if (!stage || S.phase !== 'prep') return;
  if (ev.key === 'Escape' && S.sel) { S.sel = null; sync(); return; }
  if (/^[1-8]$/.test(ev.key) && !ev.metaKey && !ev.ctrlKey && !ev.altKey) tapSlot(Number(ev.key) - 1);   // 數字鍵 1–8：放到對應位置
});

// ───────────── 啟動 ─────────────
async function boot() {
  const canvas = $('#stage');
  const units = {};
  D.UNITS.forEach((u) => { units[u.id] = { skill: u.skill, roles: u.roles, short: u.short }; });
  try {
    stage = new Stage({ canvas, labels: $('#labels'), units, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
    await stage.load('assets/models.glb');
  } catch (e) {
    console.error(e);
    stage = null;
    S.phase = 'error';
    el.loading.innerHTML = '<b>這個裝置開不了 3D 畫面</b><span>可能是瀏覽器不支援 WebGL，或模型沒有載入成功。可以改玩 2D 灰盒版。</span>';
    return;
  }
  stage.onPick = tapSlot;
  new ResizeObserver(() => { stage.resize(); measure(); }).observe($('#app'));
  stage.resize();
  applyPreset();
  setRound(S.round);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => measure());
  el.loading.hidden = true;
  window.__stage3d = { state: S, stage, ready: true };
}

boot();
