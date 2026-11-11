// 風格定稿：把 3D 像素的病室接上介面，示範幾個動作的回饋。
// 這不是遊戲本體。對話和數值取自企劃裡的示範病例 C01A，還沒經過臨床老師審查。

import { createStage } from './scene.js';

const root = document.getElementById('app');
const still = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach((kid) => { if (kid !== null && kid !== undefined && kid !== false) n.append(kid); });
  return n;
}

// ── 聲音：程式合成的電子音，不需要音檔 ──
let audio = null, soundOn = true;
function tone(freq, dur, type = 'square', vol = 0.05, when = 0, slide = 0) {
  if (!soundOn) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const t0 = audio.currentTime + when, o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* 沒有聲音也能用 */ }
}
const sfx = {
  tap: () => tone(660, 0.05, 'square', 0.03),
  type: () => tone(880 + Math.random() * 120, 0.02, 'square', 0.012),
  clue: () => { tone(523, 0.09, 'triangle', 0.07); tone(784, 0.09, 'triangle', 0.07, 0.08); tone(1047, 0.16, 'triangle', 0.07, 0.16); },
  key: () => { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.12, 'square', 0.04, i * 0.07)); },
  bell: () => { tone(392, 0.9, 'triangle', 0.12); tone(784, 0.7, 'sine', 0.06); tone(1176, 0.5, 'sine', 0.03); tone(392, 0.9, 'triangle', 0.1, 0.55); },
  alarm: () => { tone(220, 0.18, 'sawtooth', 0.05); tone(196, 0.25, 'sawtooth', 0.05, 0.2, -40); },
  miss: () => tone(140, 0.12, 'square', 0.04, 0, -30),
};
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 不支援就算了 */ } };

// ── 示範用的內容 ──
const ASKS = [
  { q: '林先生，我是今天照顧您的專科護理師。現在還在痛嗎？什麼時候開始的？', a: '搬到第三盞燈的時候開始的。大概四十分鐘了，休息也沒有比較好。', chip: '持續 40 分鐘', veil: 0.22 },
  { q: '是怎麼樣的痛？在哪個位置？', a: '胸口正中間，像被什麼壓住。', chip: '胸口壓迫感', veil: 0.22 },
  { q: '會痛到別的地方嗎？還有哪裡不舒服？', a: '一路到左手臂。一直冒冷汗，還有點想吐。', chip: '傳到左臂、冒冷汗', veil: 0.3, key: true },
];
const VITALS = [['BP', '103/68'], ['HR', '108'], ['RR', '24'], ['SpO₂', '96%']];

const ui = { asked: 0, called: false, worse: false, seconds: 0, busy: false };
let stage, refs, typing = null;

function build() {
  const cs = getComputedStyle(document.body);
  const availW = document.body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = document.body.clientHeight > 100 ? document.body.clientHeight : window.innerHeight;
  const wide = availW > availH * 1.15;
  let u = 1;
  for (const s of [5, 4, 3, 2]) if ((wide ? 380 : 160) * s <= availW && (wide ? 170 : 284) * s <= availH) { u = s; break; }
  const W = wide ? Math.floor(availW / u) : Math.max(160, Math.min(210, Math.floor(availW / u)));
  const lw = wide ? Math.min(240, Math.floor(W * 0.56)) : W;
  const sceneW = lw - 2;
  const sceneH = wide ? Math.min(170, Math.floor(availH / u) - 54) : Math.max(110, Math.min(160, Math.floor(availH / u) - 204));
  root.style.setProperty('--u', u + 'px'); root.style.setProperty('--w', String(W));
  root.style.setProperty('--lw', String(lw)); root.style.setProperty('--sh', String(sceneH + 2));
  root.className = wide ? 'wide' : '';

  const canvas = el('canvas', { 'aria-label': '霧脈公會的病室：林秋坐在床邊按著胸口，岑禾抱著紀錄板站在旁邊，牆邊飄著一隻被霧裹住的鐵翅蛾' });
  refs = {
    clock: el('span', { class: 'clock' }),
    banner: el('div', { class: 'banner' }),
    veil: el('div', { class: 'veil' }),
    vitals: el('div', { class: 'box vitals' }),
    talk: el('div', { class: 'box talk', 'aria-live': 'polite' }),
    clues: el('div', { class: 'chips' }),
    ask: el('button', { class: 'box act demo', type: 'button', onclick: doAsk, text: '問診' }),
    call: el('button', { class: 'box act urgent', type: 'button', onclick: doCall, text: '通報' }),
  };
  const idle = (label) => el('button', { class: 'box act', type: 'button', text: label, onclick: () => { sfx.miss(); say([['sys', '「' + label + '」在這張定稿裡還沒有接上。可以試「問診」和「通報」。']]); } });
  root.replaceChildren(
    el('div', { class: 'left' },
      el('div', { class: 'box top' }, el('span', { class: 'who', text: '林秋｜胸痛' }), refs.clock),
      el('div', { class: 'scene' }, canvas, refs.banner, refs.veil),
      refs.vitals),
    el('div', { class: 'right' },
      refs.talk, el('div', { class: 'clues' }, el('span', { class: 'label', text: '已知線索' }), refs.clues),
      el('div', { class: 'acts' }, refs.ask, idle('評估'), idle('檢查'), idle('推理'), refs.call, idle('說明')),
      el('div', { class: 'foot' },
        el('button', { type: 'button', onclick: reset, text: '重來' }),
        el('button', { type: 'button', onclick: (e) => { soundOn = !soundOn; e.target.textContent = soundOn ? '聲音：開' : '聲音：關'; }, text: '聲音：開' }),
        el('span', { text: '風格定稿' }))));

  stage = createStage(canvas);
  stage.resize(sceneW, sceneH);
  stage.state.still = still();
  paint();
  if (!refs.talk.childElementCount) say([['name', '岑禾'], ['line', '「你現在最想知道什麼？有什麼要同時處理？」']]);
}

function paint() {
  const m = Math.floor(ui.seconds / 60), s = ui.seconds % 60;
  refs.clock.textContent = '委託　' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  const v = ui.worse ? [['BP', '86/58'], ['HR', '118'], ['RR', '26'], ['SpO₂', '95%']] : VITALS;
  refs.vitals.replaceChildren(...v.map(([k, val], i) => el('span', { class: ui.worse && i < 2 ? 'alert' : '' }, el('b', { text: k }), val)));
  refs.veil.textContent = '霧 ' + Math.round(stage.state.veil * 100) + '%';
  refs.ask.disabled = ui.asked >= ASKS.length; refs.call.disabled = ui.called;
}

// 對話：一個字一個字打出來，點一下對話框可以直接看完
function say(lines, done) {
  if (typing) typing.finish();
  const nodes = lines.map(([cls, text]) => ({ node: el('p', { class: cls === 'line' ? '' : cls }), text }));
  refs.talk.replaceChildren(...nodes.map((n) => n.node));
  let li = 0, ci = 0, timer = null, over = false;
  const finish = () => { if (over) return; over = true; clearTimeout(timer); nodes.forEach((n) => { n.node.textContent = n.text; }); refs.talk.scrollTop = refs.talk.scrollHeight; typing = null; if (done) done(); };
  const step = () => {
    if (li >= nodes.length) return finish();
    const n = nodes[li];
    ci += 1; n.node.textContent = n.text.slice(0, ci);
    refs.talk.scrollTop = refs.talk.scrollHeight;
    if (ci % 2 === 0) sfx.type();
    if (ci >= n.text.length) { li += 1; ci = 0; }
    timer = setTimeout(step, 28);
  };
  typing = { finish };
  if (still()) finish(); else step();
}
function banner(text, bad) {
  refs.banner.textContent = text; refs.banner.className = 'banner show' + (bad ? ' bad' : '');
  clearTimeout(banner.t); banner.t = setTimeout(() => { refs.banner.className = 'banner' + (bad ? ' bad' : ''); }, 1500);
}
function tick(sec) {
  ui.seconds += sec;
  // 劇本事件：模擬時間到第 2 分鐘還沒通報，病人的狀況變差
  if (!ui.called && !ui.worse && ui.seconds >= 120) {
    ui.worse = true; stage.worsen(); sfx.alarm(); buzz([60, 40, 60]); banner('血壓降至 86/58 mmHg', true);
    setTimeout(() => say([['name', '林秋'], ['line', '「頭……有點暈。」'], ['sys bad', '病人的狀況變了。現在通報還來得及。']]), 500);
  }
  paint();
}

function doAsk() {
  if (ui.asked >= ASKS.length) return;
  const a = ASKS[ui.asked]; ui.asked += 1;
  sfx.tap(); buzz(8);
  say([['you', '你：' + a.q], ['name', '林秋'], ['line', '「' + a.a + '」']], () => {
    stage.clue(a.veil);
    if (a.key) { sfx.key(); buzz(30); banner('關鍵線索'); } else sfx.clue();
    refs.clues.append(el('span', { class: 'chip', text: a.chip }));
    refs.clues.scrollLeft = refs.clues.scrollWidth;
    tick(40);
  });
}
function doCall() {
  if (ui.called) return;
  ui.called = true; sfx.tap(); sfx.bell(); buzz([40, 60, 40]); stage.ring(); banner('已呼叫支援');
  say([['you', '你：持續的胸口壓迫，合併冒冷汗，我擔心急性冠心症。請一起安排心電圖，我會重測血壓並回報。'], ['name', '岑禾'], ['line', '「值班鐘響了。沈渡醫師馬上到。」'],
    ['sys', ui.worse ? '延遲之後補救：通報已記錄。' : '及時通報：安全行動達成。']]);
  paint();
}
function reset() {
  Object.assign(ui, { asked: 0, called: false, worse: false, seconds: 0 });
  stage.reset(); refs.clues.replaceChildren();
  say([['name', '岑禾'], ['line', '「你現在最想知道什麼？有什麼要同時處理？」']]);
  paint();
}

async function main() {
  try { await document.fonts.load('12px "Fusion Pixel 12"', '霧脈公會'); } catch (e) { /* 沒有像素字體就用系統字 */ }
  try { build(); } catch (e) {
    root.replaceChildren(el('p', { class: 'loading', text: '這個瀏覽器畫不出 3D 場景：' + e.message }));
    return;
  }
  refs.talk.addEventListener('click', () => { if (typing) typing.finish(); });
  let timer = null;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { const keep = { ...ui }; build(); Object.assign(ui, keep); paint(); }, 150); });
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    stage.update(now / 1000, dt); stage.render();
    refs.veil.textContent = '霧 ' + Math.round(stage.state.veilShown * 100) + '%';
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__ready = true;
}
main();
