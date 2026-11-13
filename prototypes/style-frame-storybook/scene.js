// 霧脈公會風格定稿（繪本版）：用 Canvas 畫的手繪風病室。
//
// 畫法：每個形狀都是「幾個點 → 每個點抖一點 → 連成平滑的線」，先平塗顏色，
// 再用鉛筆色描邊（描兩次，第二次淡一點、位置差一點），最後整張蓋上紙的顆粒。
// 會動的東西每秒換五次抖動，看起來像一張一張手畫的（動畫裡叫 line boil）。
// 不會動的背景只畫一次存起來，每一格直接貼上。
//
// 角色和房間都是為這個專案重新設計的，沒有使用任何現成的圖。

const C = {
  ink: '#2c2a25',
  wall: '#8fab89', wall2: '#7c9a79', wallFlower: '#d2b566',
  wains: '#4d735e', wains2: '#3c5f4d',
  floor: '#c79d64', floor2: '#a27a49',
  wood: '#8c6641', wood2: '#6c4d33',
  cream: '#f4eddb', paper: '#eee2c5', paperLine: '#d8c8a0',
  teal: '#57827f', teal2: '#3d6363',
  ochre: '#d9a843', mustard: '#c68c2b', pumpkin: '#c8743a', rust: '#a8522c',
  moss: '#6c8f53', green: '#2f5d49', green2: '#3f7359',
  sky: '#c9dcc0',
  skin: '#f1cfab', blush: '#e08a7c',
  hairGrey: '#908d83', hairDark: '#4b382a',
  shirt: '#dcb35b', shirt2: '#c2963f',
  coat: '#44587a', coat2: '#33456a', trouser: '#3b3a37', boot: '#5b4131',
  iron: '#74888f', iron2: '#566a70', fur: '#ba8b4d', fur2: '#8b6235',
  fog: '#f3ecda', fogLine: '#bdb08f',
  glow: '#ffe9a6', brass: '#c9a24b',
  cat: '#efe2c4', catPatch: '#c98a4a',
  sweat: '#cfe4e2',
  shadow: 'rgba(58, 46, 26, 0.2)',
};

const TAU = Math.PI * 2;
const X0 = -220, X1 = 580, Y0 = -120, Y1 = 420;   // 背景畫到畫面外，窄或寬的螢幕都不會露白
const FLOOR_Y = 186;
const LIN = { x: 90, y: 219 }, CEN = { x: 298, y: 264 }, MOTH = { x: 178, y: 88 };
const BIG = 1.14, MOTH_BIG = 1.28;   // 人物比家具大一點，表情在手機上才看得清楚

let BOIL = 0;   // 目前是第幾組抖動
let SEED = 0;   // 每畫一個形狀就加一，讓每個形狀的抖動不一樣

function hash(a, b) {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };

// ── 形狀的點 ──
function ell(cx, cy, rx, ry, n = 12, rot = 0) {
  const out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
}
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function rrect(x, y, w, h, r) {
  const k = r * 0.3;
  return [[x + r, y], [x + w - r, y], [x + w - k, y + k], [x + w, y + r], [x + w, y + h - r], [x + w - k, y + h - k],
    [x + w - r, y + h], [x + r, y + h], [x + k, y + h - k], [x, y + h - r], [x, y + r], [x + k, y + k]];
}

// 把邊切細，再讓每個點抖一點
function prep(pts, closed, step, amp, seed) {
  const out = [], n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
  if (amp) for (let i = 0; i < out.length; i++) { out[i][0] += (hash(seed, i * 2) - 0.5) * 2 * amp; out[i][1] += (hash(seed, i * 2 + 1) - 0.5) * 2 * amp; }
  return out;
}
function trace(g, p, closed) {
  const n = p.length;
  g.beginPath();
  if (closed) {
    g.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.closePath();
  } else {
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = p[i], b = p[i + 1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.lineTo(p[n - 1][0], p[n - 1][1]);
  }
}
function seedOf(o) { SEED += 1; return (o.seed || SEED) * 7 + (o.boil ? BOIL * 131 : 0); }

// 平塗 + 鉛筆描邊
function shape(g, pts, o = {}) {
  const closed = o.closed !== false, step = o.step || 7, amp = o.amp === undefined ? 0.6 : o.amp, seed = seedOf(o);
  if (o.fill) {
    g.save(); g.translate(0.5, 0.4);   // 顏色和線稍微錯開，像印刷沒對準
    trace(g, prep(pts, closed, step, amp * 1.2, seed + 17), closed); g.fillStyle = o.fill; g.fill(); g.restore();
  }
  if (o.stroke !== null) {
    g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = o.stroke || C.ink;
    const lw = o.lw || 1.5, a0 = g.globalAlpha;
    trace(g, prep(pts, closed, step, amp, seed), closed); g.lineWidth = lw; g.globalAlpha = a0 * 0.92; g.stroke();
    if (o.double !== false) { trace(g, prep(pts, closed, step, amp * 1.5, seed + 53), closed); g.lineWidth = lw * 0.55; g.globalAlpha = a0 * 0.4; g.stroke(); }
    g.globalAlpha = a0;
  }
}
const oval = (g, cx, cy, rx, ry, o = {}) => shape(g, ell(cx, cy, rx, ry, o.n || 12, o.rot || 0), { step: 99, ...o });
// 一筆線
function wline(g, pts, color, lw, o = {}) {
  const seed = seedOf(o);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = color || C.ink; g.lineWidth = lw || 1.3;
  trace(g, prep(pts, false, o.step || 7, o.amp === undefined ? 0.5 : o.amp, seed), false); g.stroke();
}
// 手腳、圍巾這類粗粗的條狀物：先畫一條粗的深色線，再疊一條細一點的顏色
function limb(g, pts, w, fill, o = {}) {
  const p = prep(pts, false, o.step || 6, o.amp === undefined ? 0.4 : o.amp, seedOf(o));
  g.lineJoin = 'round'; g.lineCap = 'round';
  trace(g, p, false); g.strokeStyle = C.ink; g.lineWidth = w + 2.8; g.stroke();
  trace(g, p, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
function dot(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = fill; g.fill(); }
function leaf(g, x, y, rx, ry, rot, fill) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill(); }
function fillRect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
function star(cx, cy, r, rot = 0) {
  const out = [];
  for (let i = 0; i < 8; i++) { const a = rot + (i / 8) * TAU, k = i % 2 ? r * 0.38 : r; out.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
  return out;
}

// ── 紙的顆粒 ──
function makeGrain(px, light) {
  const n = 96, small = document.createElement('canvas'); small.width = small.height = n;
  const sg = small.getContext('2d'), img = sg.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const r = hash(i, light ? 911 : 313), blotch = hash(Math.floor((i % n) / 6), Math.floor(i / n / 6) + (light ? 40 : 7));
    let v;
    if (light) v = Math.floor(Math.pow(r, 6) * 120 + blotch * 8);            // 幾乎全黑，偶爾一顆亮點
    else v = 255 - Math.floor(Math.pow(r, 4) * 78 + blotch * 12);            // 幾乎全白，偶爾一顆暗點
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = light ? v * 0.92 : v * 0.96; img.data[i * 4 + 3] = 255;
  }
  sg.putImageData(img, 0, 0);
  const big = document.createElement('canvas'); big.width = big.height = n * px;
  const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(small, 0, 0, n * px, n * px);
  return big;
}

// ════════ 不會動的背景 ════════
function drawBack(g) {
  SEED = 100;
  // 牆和壁紙
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.wall);
  let row = 0;
  for (let y = -110; y < 130; y += 21, row++) {
    let col = 0;
    for (let x = X0 + (row % 2) * 15; x < X1; x += 30, col++) {
      if ((row * 3 + col) % 4 === 0) { dot(g, x, y, 2.7, C.wallFlower); dot(g, x, y, 1, C.cream); }
      else { leaf(g, x - 2.6, y, 3.2, 1.5, -0.7, C.wall2); leaf(g, x + 2.6, y, 3.2, 1.5, 0.7, C.wall2); fillRect(g, x - 0.5, y + 1, 1, 4.5, C.wall2); }
    }
  }
  // 腰板
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.wains);
  for (let x = X0 + 5; x < X1; x += 17) wline(g, [[x, 143], [x + hash(x, 3) * 1.5, FLOOR_Y]], C.wains2, 1.1);
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.wains2, lw: 1.2, step: 14 });
  // 地板
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.floor);
  let prev = FLOOR_Y;
  [203, 223, 247, 275, 308, 348].forEach((y, i) => {
    wline(g, [[X0, y], [X1, y]], C.floor2, 1.2, { step: 16 });
    for (let x = X0 + ((i * 53) % 96); x < X1; x += 96) wline(g, [[x, prev], [x + 1, y]], C.floor2, 1);
    prev = y;
  });
  [[140, 262], [318, 236], [20, 286], [214, 292]].forEach(([x, y]) => oval(g, x, y, 3.2, 1.3, { stroke: C.floor2, lw: 1, double: false }));
  wline(g, [[X0, FLOOR_Y], [X1, FLOOR_Y]], C.ink, 1.5, { step: 14 });

  // 地毯
  oval(g, 272, 264, 76, 19, { fill: C.pumpkin, n: 22 });
  oval(g, 272, 264, 64, 14, { stroke: C.cream, lw: 1.6, n: 22, double: false });
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.3; dot(g, 272 + Math.cos(a) * 70, 264 + Math.sin(a) * 16.5, 1.7, C.ochre); }

  // 窗戶：外框、窗外的天和樹
  shape(g, rrect(11, 13, 94, 97, 6), { fill: C.wood2 });
  shape(g, rect(19, 21, 78, 80), { fill: C.sky, lw: 1.2 });
  g.save(); g.beginPath(); g.rect(19.5, 21.5, 77.5, 79.5); g.clip();
  oval(g, 30, 97, 21, 21, { fill: C.green2 }); oval(g, 92, 93, 17, 24, { fill: C.moss }); oval(g, 62, 102, 26, 17, { fill: C.green });
  [[24, 84], [36, 90], [28, 96], [86, 80], [94, 90], [56, 94], [70, 92], [64, 98]].forEach(([x, y], i) => dot(g, x, y, 1.6 + (i % 2) * 0.5, C.ochre));
  g.restore();

  // 層架和上面的東西
  [[284, 93], [342, 93]].forEach(([x, y]) => shape(g, [[x, y], [x, y + 11], [x + 9, y]], { fill: C.wood2, lw: 1.2 }));
  shape(g, rect(274, 88, 82, 5), { fill: C.wood });
  shape(g, rrect(283, 72, 12, 16, 3), { fill: C.teal }); shape(g, rect(285.5, 68, 7, 4), { fill: C.wood, lw: 1.2 });
  wline(g, [[286, 76], [286, 84]], C.cream, 1.2);
  shape(g, rrect(299, 66, 15, 22, 4), { fill: C.cream }); shape(g, rect(302, 62, 9, 4), { fill: C.wood, lw: 1.2 });
  shape(g, rect(301.5, 73, 10, 8), { fill: C.ochre, lw: 1 }); wline(g, [[303.5, 76], [309.5, 76]], C.ink, 0.9); wline(g, [[303.5, 78.5], [308, 78.5]], C.ink, 0.9);
  shape(g, rrect(319, 75, 10, 13, 3), { fill: C.rust }); shape(g, rect(322, 68, 4, 7), { fill: C.rust, lw: 1.2 }); shape(g, rect(321.5, 65.5, 5, 3), { fill: C.wood, lw: 1 });
  // 吊下來的藤
  wline(g, [[345, 78], [353, 92], [350, 108], [354, 122]], C.green, 1.4);
  wline(g, [[340, 80], [334, 94], [337, 106]], C.green, 1.4);
  [[351, 88, 0.6], [352, 100, -0.5], [350, 112, 0.5], [354, 122, -0.3], [336, 90, -0.6], [335, 100, 0.5], [337, 107, -0.2]].forEach(([x, y, r]) => { leaf(g, x, y, 3.6, 2.2, r, C.moss); });
  shape(g, [[335, 76], [351, 76], [349, 88], [337, 88]], { fill: C.pumpkin });

  // 值班鐘的架子
  shape(g, rect(306, 12, 5, 12), { fill: C.wood2, lw: 1.2 }); wline(g, [[310, 15], [320, 15]], C.ink, 2);
  // 旗桿、掛草藥的繩子
  wline(g, [[110, 17], [132, 17]], C.wood2, 2.4); dot(g, 110, 17, 1.8, C.brass); dot(g, 132, 17, 1.8, C.brass);
  wline(g, [[138, 4], [168, 12], [206, 14], [246, 5]], C.wood2, 1.2);

  // 床：影子、床頭板、床架、床墊、枕頭
  oval(g, 118, 252, 104, 6, { fill: C.shadow, stroke: null });
  shape(g, [[19, 251], [19, 150], [24, 139], [37, 133], [50, 138], [55, 149], [55, 224], [30, 224], [30, 251]], { fill: C.wood });
  leaf(g, 37, 158, 7, 3.4, -0.9, C.wood2); wline(g, [[33, 163], [41, 153]], C.wood, 1);
  shape(g, rect(196, 236, 9, 15), { fill: C.wood2 });
  shape(g, rect(28, 226, 180, 11), { fill: C.wood });
  shape(g, rrect(30, 211, 176, 17, 5), { fill: C.paper });
  for (let x = 40; x < 202; x += 11) wline(g, [[x, 214.5], [x, 225]], C.paperLine, 1.6);
  g.save(); g.translate(60, 193); g.rotate(0.2);
  shape(g, rrect(-13, -25, 26, 50, 10), { fill: C.cream });
  [[-5, -12], [5, -4], [-5, 4], [5, 12]].forEach(([x, y]) => { wline(g, [[x - 1.5, y], [x + 1.5, y]], C.teal, 1); wline(g, [[x, y - 1.5], [x, y + 1.5]], C.teal, 1); });
  g.restore();

  // 床邊桌、杯子、燭台
  oval(g, 240, 252, 23, 4, { fill: C.shadow, stroke: null });
  shape(g, rect(225, 210, 5, 41), { fill: C.wood2, lw: 1.3 }); shape(g, rect(249, 210, 5, 41), { fill: C.wood2, lw: 1.3 });
  wline(g, [[230, 233], [249, 233]], C.wood2, 2.2);
  shape(g, rrect(220, 204, 39, 7, 2), { fill: C.wood });
  wline(g, [[253, 197], [257, 198], [257, 201], [253, 202]], C.ink, 1.3);
  shape(g, [[243, 195], [254, 195], [253, 204], [244, 204]], { fill: C.cream, lw: 1.3 }); wline(g, [[244, 199], [253, 199]], C.teal, 1.6);
  shape(g, rect(226, 200.5, 11, 3.5), { fill: C.brass, lw: 1.2 }); shape(g, rect(229.5, 190, 4.5, 10.5), { fill: C.cream, lw: 1.2 });

  // 林秋搬到一半的三盞燈：兩盞放好了，第三盞倒在地上
  const lamp = (x, y, rot, shade) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    oval(g, 0, -19, 3, 2.6, { lw: 1.3, double: false });
    shape(g, [[-6, -15], [0, -18.5], [6, -15]], { fill: C.brass, lw: 1.2 });
    shape(g, rrect(-7, -15, 14, 13, 2.5), { fill: shade });
    wline(g, [[-2.4, -14], [-2.4, -3]], C.ink, 1); wline(g, [[2.4, -14], [2.4, -3]], C.ink, 1);
    shape(g, rect(-6, -2.5, 12, 2.8), { fill: C.brass, lw: 1.2 });
    g.restore();
  };
  oval(g, 62, 278, 30, 3.6, { fill: C.shadow, stroke: null });
  lamp(46, 277, 0, C.glow); lamp(66, 279, 0, C.paper); lamp(93, 274, 1.42, C.paper);
  // 拖鞋
  shape(g, ell(152, 259, 7, 3.2, 10, -0.15), { fill: C.rust, lw: 1.2, step: 99 }); shape(g, ell(167, 261, 7, 3.2, 10, 0.1), { fill: C.rust, lw: 1.2, step: 99 });
  wline(g, [[148, 258], [152, 256.4], [156, 258.6]], C.cream, 1.4); wline(g, [[163, 260], [167, 258.4], [171, 260.6]], C.cream, 1.4);

  // 出診包
  wline(g, [[237, 248], [239, 241], [249, 241], [251, 248]], C.ink, 2.4);
  shape(g, rrect(229, 247, 30, 17, 4), { fill: C.mustard });
  shape(g, [[229.5, 249], [258.5, 249], [254, 257], [234, 257]], { fill: C.ochre, lw: 1.3 });
  shape(g, rect(241.5, 255, 5, 4), { fill: C.cream, lw: 1.1 });
}

// 蓋在林秋腿上的被子，要畫在他前面
function drawMid(g) {
  SEED = 400;
  const q = [[73, 209], [92, 202], [116, 196], [138, 191], [157, 195], [179, 203], [203, 206], [206, 234], [189, 239], [166, 236], [142, 240], [118, 237], [96, 240], [75, 237]];
  shape(g, q, { fill: C.teal, seed: 401 });
  g.save(); trace(g, prep(q, true, 7, 0, 1), true); g.clip();
  for (let x = 66; x < 222; x += 15) wline(g, [[x, 184], [x + 7, 246]], C.teal2, 1.2);
  for (let y = 199; y < 250; y += 13) wline(g, [[66, y + 7], [138, y - 6], [212, y + 6]], C.teal2, 1.2);
  for (let x = 74; x < 215; x += 15) for (let y = 206; y < 244; y += 13) {
    const yy = y - 6 + Math.abs(x - 138) * 0.16;
    wline(g, [[x + 6, yy - 1.3], [x + 6, yy + 1.3]], C.cream, 0.9, { amp: 0 }); wline(g, [[x + 4.7, yy], [x + 7.3, yy]], C.cream, 0.9, { amp: 0 });
  }
  g.restore();
  shape(g, q, { seed: 401 });
  shape(g, [[200, 251], [200, 197], [203, 189], [209, 186], [214, 190], [215, 251]], { fill: C.wood });
  dot(g, 207.5, 185, 3.4, C.wood); oval(g, 207.5, 185, 3.4, 3.4, { lw: 1.2, double: false });
}

export function createStage(canvas) {
  const ctx = canvas.getContext('2d');
  const state = { veil: 1, veilShown: 1, bell: 0, shake: 0, slump: 0, slumpShown: 0, still: false, talker: null, nod: 0, flinch: 0, wince: 0 };
  let W = 300, H = 250, dpr = 1, S = 1, OX = 0, OY = 0, back = null, mid = null, grainD = null, grainL = null, T = 0, dustClock = 0;
  const sparks = [], dust = [];
  const PUFFS = [
    { a: 0, d: 0, r: 36, th: 0.72 }, { a: 3.5, d: 40, r: 27, th: 0.6 }, { a: 5.6, d: 42, r: 26, th: 0.5 }, { a: 1.0, d: 38, r: 25, th: 0.43 },
    { a: 2.3, d: 40, r: 26, th: 0.36 }, { a: 4.6, d: 38, r: 24, th: 0.3 }, { a: 0.1, d: 56, r: 23, th: 0.2 }, { a: 3.0, d: 60, r: 22, th: 0.12 },
    { a: 1.65, d: 46, r: 21, th: 0.05 }, { a: 5.0, d: 60, r: 20, th: -0.05 },
  ];
  // 病人變差時，從畫面邊緣湧進來的霧
  const EDGE = [{ x: 16, y: 124, r: 26 }, { x: 132, y: 18, r: 27 }, { x: 350, y: 132, r: 25 }, { x: 18, y: 26, r: 26 }, { x: 346, y: 34, r: 24 }, { x: 236, y: 132, r: 17 }, { x: 22, y: 286, r: 24 }, { x: 346, y: 284, r: 22 }];

  function layer(draw) {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    const g = c.getContext('2d'); g.setTransform(dpr * S, 0, 0, dpr * S, dpr * OX, dpr * OY); draw(g); return c;
  }
  function resize(w, h) {
    W = Math.max(60, Math.round(w)); H = Math.max(60, Math.round(h)); dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    S = Math.min(W / 332, H / 268);                       // 重要的東西都放在中間 332×268 的範圍裡
    OX = W / 2 - 181 * S; OY = H / 2 - 146 * S;
    const save = BOIL; BOIL = 0;
    back = layer(drawBack); mid = layer(drawMid);
    BOIL = save;
    const px = Math.max(1, Math.round(dpr * 1.1));
    grainD = ctx.createPattern(makeGrain(px, false), 'repeat'); grainL = ctx.createPattern(makeGrain(px, true), 'repeat');
  }

  // ── 會動的東西 ──
  function drawWindowLife(g, t) {
    g.save(); g.beginPath(); g.rect(19.5, 21.5, 77.5, 79.5); g.clip();
    // 雲
    [[0, 36, 15, 5, 3.2], [50, 52, 11, 4, 2.1]].forEach(([x0, y, rx, ry, sp], i) => {
      const x = 4 + ((x0 + t * sp) % 112);
      oval(g, x, y, rx, ry, { fill: C.cream, stroke: null, seed: 60 + i }); oval(g, x + rx * 0.5, y - ry * 0.6, rx * 0.55, ry * 0.9, { fill: C.cream, stroke: null, seed: 64 + i });
    });
    // 落葉
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.11 + i * 0.27) % 1, x = 24 + i * 19 + Math.sin(t * 1.3 + i * 2) * 5, y = 20 + k * 86;
      leaf(g, x, y, 2.4, 1.5, t * 1.5 + i, i % 2 ? C.ochre : C.pumpkin);
    }
    // 偶爾飛過一隻鳥
    const b = (t * 0.07) % 1;
    if (b < 0.3) {
      const x = 14 + (b / 0.3) * 92, y = 44 - Math.sin((b / 0.3) * Math.PI) * 8, up = Math.sin(t * 16) > 0;
      shape(g, [[x - 5, y], [x, y - 2.4], [x + 5, y - 0.5], [x + 7.5, y + 0.6], [x + 4, y + 2], [x - 2, y + 2.4]], { fill: C.green, lw: 1, seed: 70, step: 99 });
      shape(g, up ? [[x - 1, y - 1], [x - 4, y - 8], [x + 3, y - 1]] : [[x - 1, y + 1], [x - 4, y + 7], [x + 3, y + 1]], { fill: C.green2, lw: 1, seed: 71, step: 99 });
    }
    g.restore();
    // 窗格、窗簾、窗台
    wline(g, [[58, 21], [58, 101]], C.wood2, 3.2, { seed: 80, amp: 0.3 }); wline(g, [[19, 58], [97, 58]], C.wood2, 3.2, { seed: 81, amp: 0.3 });
    const sw = Math.sin(t * 0.9) * 1.6;
    shape(g, [[19, 21], [42, 21], [39, 38], [31 + sw, 56], [25 + sw * 0.6, 70], [19, 73]], { fill: C.ochre, seed: 82 });
    shape(g, [[97, 21], [74, 21], [77, 38], [85 + sw, 56], [91 + sw * 0.6, 70], [97, 73]], { fill: C.ochre, seed: 83 });
    [[26, 30], [33, 40], [24, 48], [90, 30], [83, 40], [92, 48]].forEach(([x, y]) => dot(g, x, y, 1.2, C.rust));
    wline(g, [[20, 60 + sw * 0.2], [31 + sw, 57]], C.rust, 2, { seed: 84 }); wline(g, [[96, 60 + sw * 0.2], [85 + sw, 57]], C.rust, 2, { seed: 85 });
    wline(g, [[8, 19], [108, 19]], C.wood2, 2.6, { seed: 86, amp: 0.3 }); dot(g, 8, 19, 2.2, C.brass); dot(g, 108, 19, 2.2, C.brass);
    shape(g, rect(7, 101, 102, 7), { fill: C.wood, seed: 87 });
  }

  function drawCat(g, t) {
    SEED = 600;
    g.save(); g.translate(40, 101);
    const br = 1 + 0.05 * Math.sin(t * 1.5), flick = Math.max(0, Math.sin(t * 0.7)) ** 8;
    limb(g, [[11, -3], [20, -2.5], [24, -6 - flick * 4]], 3.2, C.catPatch, { boil: true });
    g.save(); g.scale(1, br); shape(g, ell(2, -7, 13, 7.4, 12), { fill: C.cat, boil: true, step: 99 }); leaf(g, 6, -9.5, 5, 3, 0.2, C.catPatch); g.restore();
    shape(g, [[-15.5, -9], [-14.5, -15.5], [-10.5, -11.5]], { fill: C.catPatch, lw: 1.2, boil: true });
    shape(g, [[-9, -11.5], [-5.5, -15.5], [-4.5, -9]], { fill: C.cat, lw: 1.2, boil: true });
    shape(g, ell(-10, -6, 6.6, 5.8, 10), { fill: C.cat, boil: true, step: 99 });
    wline(g, [[-13.5, -6.2], [-12, -5], [-10.6, -6.2]], C.ink, 1.1, { amp: 0.15 }); wline(g, [[-8.6, -6.2], [-7.2, -5], [-5.8, -6.2]], C.ink, 1.1, { amp: 0.15 });
    dot(g, -10.2, -3.4, 0.9, C.blush);
    g.restore();
  }

  function drawHangings(g, t) {
    SEED = 700;
    // 公會的旗子
    const s1 = Math.sin(t * 1.1) * 1.8;
    shape(g, [[112, 18], [130, 18], [130 + s1 * 0.4, 46], [121 + s1, 62], [112 + s1 * 0.4, 46]], { fill: C.coat, boil: true });
    oval(g, 121 + s1 * 0.3, 34, 4.6, 6, { fill: C.ochre, lw: 1.1, boil: true }); wline(g, [[121 + s1 * 0.3, 29], [121 + s1 * 0.3, 40]], C.ink, 0.9);
    wline(g, [[121 + s1 * 0.3, 33], [124 + s1 * 0.3, 31]], C.ink, 0.8); wline(g, [[121 + s1 * 0.3, 36], [118 + s1 * 0.3, 34]], C.ink, 0.8);
    // 三把草藥
    [[156, 10, C.moss, 0], [190, 14, C.ochre, 1], [224, 11, C.rust, 2]].forEach(([x, y, col, i]) => {
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.0 + i * 1.9) * 0.07);
      [-4, 0, 4].forEach((dx, k) => { wline(g, [[0, 2], [dx, 20 + (k % 2) * 3]], C.green, 1.3, { boil: true }); if (i === 1) dot(g, dx, 21 + (k % 2) * 3, 2.3, col); else leaf(g, dx, 19 + (k % 2) * 3, 4.2, 2.2, 1.2 + dx * 0.1, col); });
      [-2, 2].forEach((dx) => leaf(g, dx * 1.6, 12, 3.4, 1.8, dx > 0 ? 0.7 : -0.7, i === 1 ? C.moss : col));
      wline(g, [[-2, 4], [2, 4]], C.wood2, 2.2); g.restore();
    });
    // 吊燈
    g.save(); g.translate(262, -40); g.rotate(Math.sin(t * 0.85) * 0.03); g.translate(0, 40);
    const pulse = 0.5 + 0.5 * Math.sin(t * 5.3) * Math.sin(t * 3.1);
    g.globalAlpha = 0.16 + pulse * 0.05; dot(g, 0, 42, 30, C.glow); g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + (BOIL % 2) * 0.2, r1 = 23, r2 = 27 + (i % 2) * 2; wline(g, [[Math.cos(a) * r1, 42 + Math.sin(a) * r1], [Math.cos(a) * r2, 42 + Math.sin(a) * r2]], C.ochre, 1.2, { amp: 0 }); }
    wline(g, [[0, -90], [0, 27]], C.ink, 1.3, { amp: 0.2, step: 20 });
    shape(g, [[-7, 32], [0, 26], [7, 32]], { fill: C.brass, lw: 1.3, boil: true });
    shape(g, rrect(-8, 32, 16, 20, 3), { fill: C.glow, boil: true });
    wline(g, [[0, 33], [0, 51]], C.ink, 1.1); wline(g, [[-7, 42], [7, 42]], C.ink, 1.1);
    shape(g, rect(-6.5, 52, 13, 3.4), { fill: C.brass, lw: 1.2, boil: true });
    wline(g, [[0, 55.5], [0, 60]], C.rust, 1.6); g.restore();
    // 值班鐘
    g.save(); g.translate(320, 16); g.rotate(Math.sin(t * 15) * state.bell * 0.5 + Math.sin(t * 0.8) * 0.015);
    wline(g, [[0, 0], [0, 5]], C.ink, 1.5);
    shape(g, [[-2.5, 5], [2.5, 5], [5, 12], [8, 21], [-8, 21], [-5, 12]], { fill: C.brass, boil: true });
    dot(g, 0, 23.5, 2, C.wood2); g.restore();
    if (state.bell > 0.12) for (let i = 0; i < 2; i++) {
      const r = 16 + i * 6 + (BOIL % 2) * 2; g.globalAlpha = clamp(state.bell * 1.4);
      wline(g, [[320 - r, 24], [320 - r * 0.95, 32], [320 - r * 0.75, 39]], C.ink, 1.3, { amp: 0.2 }); wline(g, [[320 + r, 24], [320 + r * 0.95, 32], [320 + r * 0.75, 39]], C.ink, 1.3, { amp: 0.2 }); g.globalAlpha = 1;
    }
    // 地上那盞點著的燈
    const lf = 0.5 + 0.5 * Math.sin(t * 6.1) * Math.sin(t * 2.3);
    g.globalAlpha = 0.14 + lf * 0.07; dot(g, 46, 268, 15, C.glow); g.globalAlpha = 1;
    // 繞著吊燈飛的螢火蟲
    for (let i = 0; i < 3; i++) {
      const a = t * (0.5 + i * 0.13) + i * 2.1, fx = 262 + Math.cos(a) * (26 + i * 9) + Math.sin(t * 1.7 + i) * 4, fy = 44 + Math.sin(a * 1.3) * (14 + i * 4), tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2);
      g.globalAlpha = 0.25 * tw; dot(g, fx, fy, 4.5, C.glow); g.globalAlpha = 0.5 + 0.5 * tw; dot(g, fx, fy, 1.5, C.ochre);
    }
    g.globalAlpha = 1;
    // 燭火和茶的熱氣
    const fl = 1 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.1;
    g.globalAlpha = 0.2; dot(g, 232, 185, 9 * fl, C.glow); g.globalAlpha = 1;
    shape(g, [[232, 190], [229.6, 186.5], [232, 181 - fl * 1.5], [234.4, 186.5]], { fill: C.ochre, lw: 1, boil: true, step: 99 });
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.32 + i / 3) % 1, x = 246 + i * 2.6, y = 193 - k * 20;
      g.globalAlpha = Math.sin(k * Math.PI) * 0.75;
      wline(g, [[x + Math.sin(k * 7 + i) * 2, y], [x + Math.sin(k * 7 + i + 1.5) * 2, y - 4], [x + Math.sin(k * 7 + i + 3) * 2, y - 8]], C.cream, 1.5, { amp: 0 });
    }
    g.globalAlpha = 1;
  }

  // 眼睛：白色的圓，裡面一顆瞳孔。閉眼時畫一條彎線，痛的時候畫「＞」
  function eye(g, x, y, r, look, mode, dir = 1) {
    if (mode === 'blink') { wline(g, [[x - r * 0.9, y], [x, y + r * 0.45], [x + r * 0.9, y]], C.ink, 1.4, { amp: 0.1 }); return; }
    if (mode === 'wince') { wline(g, [[x - dir * r * 0.8, y - r * 0.7], [x + dir * r * 0.5, y], [x - dir * r * 0.8, y + r * 0.7]], C.ink, 1.5, { amp: 0.1 }); return; }
    oval(g, x, y, r, r, { fill: '#fbf7ea', lw: 1.2, n: 10, boil: true });
    dot(g, x + look[0], y + look[1], r * 0.42, C.ink);
  }

  function drawLin(g, t) {
    SEED = 1000;
    const slump = state.slumpShown, wince = state.wince, breath = Math.sin(t * 2.5);
    const talking = state.talker === 'lin', blink = (t * 0.9 + 0.4) % 3.6 < 0.13;
    g.save(); g.translate(LIN.x, LIN.y); g.scale(BIG, BIG); g.rotate(-0.07 + slump * 0.3 + wince * 0.035);
    // 後面那隻手
    limb(g, [[10, -36], [19, -19], [21, -4]], 7.5, C.shirt2, { boil: true });
    // 身體，跟著呼吸起伏
    g.save(); g.scale(1 + breath * 0.012, 1 + breath * 0.022 + wince * 0.01);
    shape(g, [[-15, 3], [-17, -22], [-15, -37], [-7, -44], [6, -44], [13, -38], [16, -20], [16, 3]], { fill: C.shirt, boil: true });
    wline(g, [[-4, -43], [1, -35], [6, -43]], C.ink, 1.3, { boil: true });
    shape(g, [[-4, -43.5], [1, -36], [6, -43.5], [3, -46], [-2, -46]], { fill: C.cream, lw: 1.1, boil: true });
    dot(g, 2, -14, 1.1, C.ink); dot(g, 2.4, -6, 1.1, C.ink);
    g.restore();
    // 按著胸口的手：慢慢揉，痛的時候壓得更緊
    const rub = t * 2.2, hx = 3 + Math.cos(rub) * 1.6 - wince * 1.5, hy = -26 + Math.sin(rub) * 1.3 + wince;
    limb(g, [[-11, -36], [-15, -18 + wince * 2], [hx - 2, hy + 1]], 8, C.shirt, { boil: true });
    oval(g, hx, hy, 4.2, 3.8, { fill: C.skin, lw: 1.3, boil: true });
    if (wince > 0.3) { g.globalAlpha = clamp((wince - 0.3) * 2.5); [[9, -33, 14, -37], [10, -27, 16, -27], [9, -21, 14, -17]].forEach(([a, b, c, d]) => wline(g, [[a, b], [c, d]], C.rust, 1.6, { amp: 0.2, boil: true })); g.globalAlpha = 1; }
    // 脖子
    limb(g, [[0, -44], [1, -49]], 6, C.skin, { amp: 0 });
    // 頭
    g.save(); g.translate(1, -59 - breath * 0.5); g.rotate(slump * 0.35 + wince * 0.1 + (talking ? Math.sin(t * 9) * 0.02 : 0));
    oval(g, -17.5, 2, 4, 5, { fill: C.skin, lw: 1.3, boil: true });
    shape(g, ell(0, 0, 20, 19, 14), { fill: C.skin, boil: true, step: 99 });
    shape(g, [[-19.5, 4], [-21, -8], [-16, -17], [-5, -21], [7, -20], [14, -14], [7, -13.5], [-3, -14.5], [-10, -10], [-13, -2], [-14.5, 5]], { fill: C.hairGrey, boil: true });
    wline(g, [[-14, -13], [-9, -16]], C.cream, 1); wline(g, [[-16, -6], [-13, -10]], C.cream, 1);
    // 臉頰、眼睛、眉毛
    g.globalAlpha = 0.42 - slump * 0.2; leaf(g, -4, 6, 4, 2.4, 0, C.blush); leaf(g, 17, 6, 2.8, 2.2, 0, C.blush); g.globalAlpha = 1;
    const mode = wince > 0.45 ? 'wince' : (blink || slump > 0.6) ? 'blink' : 'open', look = talking ? [0.9, 0.2] : [1.2, 0.9];
    eye(g, 3, -2.5, 4.2, look, mode, -1); eye(g, 13.5, -2.5, 3.9, look, mode, 1);
    const w = 1.2 + wince * 2;   // 眉頭往上皺
    wline(g, [[-2.5, -8 + w * 0.3], [6, -10 - w]], C.hairGrey, 2.2, { amp: 0.15, boil: true }); wline(g, [[10.5, -10 - w], [18, -8 + w * 0.3]], C.hairGrey, 2.2, { amp: 0.15, boil: true });
    // 鼻子、鬍子、嘴
    wline(g, [[9, 1], [12.4, 4.2], [9.4, 6]], C.ink, 1.3, { amp: 0.15, boil: true });
    const mo = talking ? Math.abs(Math.sin(t * 11)) * 2.6 : wince * 1.2;
    if (mo > 0.4) { g.beginPath(); g.ellipse(9, 13.6, 2.6, mo, 0, 0, TAU); g.fillStyle = '#5b2f28'; g.fill(); }
    shape(g, [[0, 9.5], [4.5, 6.6], [9, 7.6], [13.5, 6.6], [18, 9.5], [14, 12.4], [9, 10.6], [4, 12.4]], { fill: C.hairGrey, lw: 1.2, boil: true });
    // 冷汗
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.33 + i * 0.5) % 1, sx = -9 + i * 26, sy = -9 + k * 13;
      g.globalAlpha = Math.sin(k * Math.PI);
      shape(g, [[sx, sy - 3.4], [sx + 2.1, sy + 0.6], [sx, sy + 2.6], [sx - 2.1, sy + 0.6]], { fill: C.sweat, lw: 1, step: 99, boil: true });
    }
    g.globalAlpha = 1;
    g.restore();
    g.restore();
  }

  function drawMoth(g, t) {
    SEED = 2000;
    const flinch = state.flinch, agit = state.slumpShown;
    const x = MOTH.x + Math.sin(t * 0.7) * 3 + flinch * (8 + Math.sin(t * 60) * 2), y = MOTH.y + Math.sin(t * 1.3) * 3.2 - flinch * 7;
    // 連到林秋胸口的那條霧線
    g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2.5);
    const tx = LIN.x + 7, ty = LIN.y - 34;
    for (let i = 1; i < 9; i++) { const k = i / 9, px = x + (tx - x) * k + Math.sin(k * 9 + t * 2) * 4, py = y + 14 + (ty - y - 14) * k; dot(g, px, py, 1.5 - k * 0.5, C.cream); }
    g.globalAlpha = 1;
    g.save(); g.translate(x, y); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.05 + flinch * 0.25);
    const flap = 0.8 + 0.2 * Math.sin(t * (3.2 + agit * 7 + flinch * 12));
    [-1, 1].forEach((side) => {
      g.save(); g.scale(side * flap, 1);
      shape(g, [[4, 2], [24, 4], [33, 14], [27, 27], [13, 23], [5, 12]], { fill: C.iron2, boil: true, seed: 2001 });
      dot(g, 20, 15, 3.6, C.rust); oval(g, 20, 15, 3.6, 3.6, { lw: 1, double: false, seed: 2002 });
      shape(g, [[3, -7], [13, -25], [31, -32], [45, -25], [43, -8], [29, 2], [10, 3]], { fill: C.iron, boil: true, seed: 2003 });
      wline(g, [[10, -6], [24, -17], [39, -23]], C.iron2, 1.4, { seed: 2004 }); wline(g, [[12, -1], [27, -6], [40, -11]], C.iron2, 1.4, { seed: 2005 });
      dot(g, 31, -18, 5, C.cream); dot(g, 31, -18, 3, C.rust); oval(g, 31, -18, 5, 5, { lw: 1, double: false, seed: 2006 });
      [[20, -27], [29, -29.5], [38, -27], [42, -19], [41, -11]].forEach(([rx, ry]) => dot(g, rx, ry, 0.9, C.ink));   // 鉚釘
      g.restore();
    });
    // 腳、身體、頭
    wline(g, [[-4, 18], [-7, 25]], C.ink, 1.3, { boil: true }); wline(g, [[4, 18], [7, 25]], C.ink, 1.3, { boil: true });
    shape(g, ell(0, 6, 8.2, 16, 12), { fill: C.fur, amp: 1.1, boil: true, step: 99 });
    [0, 6, 12].forEach((dy) => wline(g, [[-6.5, 2 + dy], [0, 4.4 + dy], [6.5, 2 + dy]], C.fur2, 1.5, { boil: true }));
    const wig = Math.sin(t * 2.3) * 2;
    wline(g, [[-3, -21], [-8, -31], [-15, -34 + wig]], C.ink, 1.4, { boil: true }); wline(g, [[3, -21], [8, -31], [15, -34 - wig]], C.ink, 1.4, { boil: true });
    dot(g, -15, -34 + wig, 1.8, C.ochre); dot(g, 15, -34 - wig, 1.8, C.ochre);
    shape(g, ell(0, -13, 10, 9.4, 12), { fill: C.fur2, amp: 0.9, boil: true, step: 99 });
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 4.6 + flinch * 1.4;
    eye(g, -4.6, -13.5, r, [-1.3, 1.3], blink ? 'blink' : 'open'); eye(g, 4.6, -13.5, r, [-1.3, 1.3], blink ? 'blink' : 'open');
    g.restore();
    return { x, y };
  }

  function puff(g, x, y, r, i, t) {
    const pts = [], n = 20;
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU, rr = r * (1 + 0.075 * Math.sin(a * 5 + i * 1.3) + 0.06 * Math.sin(a * 3 + i * 2.1) + 0.03 * Math.sin(t * 1.4 + k + i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86]); }
    shape(g, pts, { fill: C.fog, stroke: C.fogLine, lw: 1, double: false, step: 99, amp: 0.5, boil: true, seed: 3000 + i });
    wline(g, [[x - r * 0.45, y + r * 0.1], [x - r * 0.25, y - r * 0.32], [x + r * 0.05, y - r * 0.2]], C.fogLine, 1.2, { seed: 3100 + i, boil: true });
    wline(g, [[x + r * 0.2, y + r * 0.34], [x + r * 0.46, y + r * 0.16]], C.fogLine, 1.2, { seed: 3200 + i, boil: true });
  }
  function drawFog(g, t, m) {
    const v = state.veilShown;
    PUFFS.forEach((p, i) => {
      const k = smooth(p.th - 0.1, p.th + 0.06, v);
      if (k < 0.02) return;
      const d = p.d + (1 - k) * 46, x = m.x + Math.cos(p.a) * d + Math.sin(t * 0.5 + i * 1.7) * 2.4, y = m.y + Math.sin(p.a) * d * 0.72 + Math.cos(t * 0.42 + i) * 1.8;
      g.globalAlpha = clamp(k * 1.3) * 0.97;
      puff(g, x, y, p.r * (0.5 + 0.5 * k) * (1 + 0.03 * Math.sin(t * 0.8 + i)), i, t);
    });
    g.globalAlpha = 1;
    // 霧很濃的時候只看得到一雙眼睛
    const peek = smooth(0.5, 0.8, v);
    if (peek > 0.02) {
      g.globalAlpha = peek;
      const blink = (t * 0.8 + 1.3) % 4.4 < 0.14;
      [-6, 6].forEach((dx) => { if (blink) wline(g, [[m.x + dx - 3.5, m.y - 17], [m.x + dx + 3.5, m.y - 17]], C.ink, 1.5, { amp: 0 }); else { dot(g, m.x + dx, m.y - 17, 4.4, C.ochre); dot(g, m.x + dx - 1.1, m.y - 15.9, 2, C.ink); } });
      g.globalAlpha = 1;
    }
  }

  function drawCen(g, t) {
    SEED = 4000;
    const talking = state.talker === 'cen', blink = (t * 0.9 + 2.1) % 4.1 < 0.13, nod = Math.sin(clamp(state.nod) * Math.PI);
    const sway = Math.sin(t * 1.2) * 1.4, bob = Math.sin(t * 1.9) * 0.5;
    g.save(); g.translate(CEN.x, CEN.y); g.scale(BIG, BIG);
    oval(g, 0, 1, 21, 4.5, { fill: C.shadow, stroke: null });
    limb(g, [[-6, -16], [-6, -4]], 6, C.trouser, { amp: 0.2 }); limb(g, [[6, -16], [6, -4]], 6, C.trouser, { amp: 0.2 });
    shape(g, ell(-8, -1.5, 7, 4.4, 10), { fill: C.boot, boil: true, step: 99 }); shape(g, ell(5, -1.5, 7, 4.4, 10), { fill: C.boot, boil: true, step: 99 });
    g.translate(0, bob);
    // 圍巾垂在背後的那一段
    limb(g, [[9, -75], [16, -62 + sway * 0.4], [15 + sway, -47]], 5.5, C.mustard, { boil: true });
    // 後面那隻手，托著紀錄板
    limb(g, [[11, -69], [15, -53], [3, -45]], 7, C.coat2, { boil: true });
    // 外套
    shape(g, [[-11, -73], [-15, -52], [-20, -14], [-7, -11], [6, -12], [20, -14], [15, -52], [11, -73], [0, -77]], { fill: C.coat, boil: true });
    wline(g, [[-3, -70], [-5, -13]], C.ink, 1.2, { boil: true });
    wline(g, [[-19, -20], [-6, -17.5], [6, -18], [19, -20]], C.coat2, 2.2, { boil: true });
    dot(g, -9, -34, 1.5, C.ochre); dot(g, -10, -25, 1.5, C.ochre);
    oval(g, 9, -35, 3.6, 3.6, { fill: C.ochre, lw: 1.1, boil: true }); wline(g, [[9, -37.5], [9, -32.5]], C.ink, 0.9);   // 公會的徽章
    // 聽診器
    wline(g, [[6, -73], [11, -62], [8, -50]], C.ink, 1.7, { boil: true }); dot(g, 8, -48.5, 2.8, C.brass); oval(g, 8, -48.5, 2.8, 2.8, { lw: 1, double: false });
    // 紀錄板
    g.save(); g.translate(-6, -51); g.rotate(-0.14);
    shape(g, rrect(-9.5, -13, 19, 25, 2), { fill: C.wood, boil: true });
    shape(g, rect(-7.5, -10, 15, 20), { fill: C.cream, lw: 1, boil: true });
    shape(g, rect(-3, -15, 6, 4), { fill: C.brass, lw: 1 });
    const done = 2 + Math.floor((t * 0.5) % 4);
    for (let i = 0; i < done; i++) wline(g, [[-5, -6 + i * 3.6], [3 + (i % 2) * 2, -6 + i * 3.6]], C.ink, 0.8, { amp: 0.2 });
    g.restore();
    // 前面那隻手，拿著筆寫字
    const wx = talking ? 0 : Math.sin(t * 9) * 1.3, wy = talking ? 0 : Math.cos(t * 7) * 0.8;
    limb(g, [[-10, -69], [-18, -55], [-9 + wx, -47 + wy]], 7, C.coat, { boil: true });
    wline(g, [[-10 + wx, -45 + wy], [-3.5 + wx, -55 + wy]], C.ink, 3.2, { amp: 0 }); wline(g, [[-10 + wx, -45 + wy], [-3.5 + wx, -55 + wy]], C.ochre, 1.6, { amp: 0 });
    oval(g, -8.5 + wx, -47.5 + wy, 3.5, 3.2, { fill: C.skin, lw: 1.2, boil: true });
    // 領子和圍巾
    shape(g, [[-9, -75], [0, -70], [9, -75], [6, -79], [-6, -79]], { fill: C.cream, lw: 1.2, boil: true });
    shape(g, [[-10.5, -80], [10.5, -80], [11.5, -73.5], [0, -71.5], [-11.5, -73.5]], { fill: C.mustard, boil: true });
    // 頭
    g.save(); g.translate(-1, -95 + nod * 3.2); g.rotate(-0.04 + nod * 0.16 + (talking ? Math.sin(t * 8) * 0.025 : 0));
    oval(g, 13, -22, 7, 6.6, { fill: C.hairDark, boil: true });
    wline(g, [[7, -29], [20, -17]], C.ink, 2.6, { amp: 0 }); wline(g, [[7, -29], [20, -17]], C.teal, 1.2, { amp: 0 }); dot(g, 6.6, -29.4, 1.9, C.rust);
    shape(g, ell(3.5, -1.5, 21, 21, 14), { fill: C.hairDark, boil: true, step: 99 });
    shape(g, ell(-1.5, 1.5, 18.5, 18, 14), { fill: C.skin, boil: true, step: 99 });
    shape(g, [[-19, -3], [-18, -13], [-10, -20], [2, -22], [13, -19], [20, -10], [21, 2], [15, -6], [7, -11.5], [-3, -12], [-11, -9]], { fill: C.hairDark, boil: true });
    g.globalAlpha = 0.6; leaf(g, -15, 7, 3.6, 2.4, 0, C.blush); leaf(g, 4.5, 7, 4, 2.5, 0, C.blush); g.globalAlpha = 1;
    const look = talking ? [0, 0.5] : [-1.2, 0.8], mode = blink ? 'blink' : 'open';
    eye(g, -11, -0.5, 3.9, look, mode); eye(g, 0, -0.5, 4.2, look, mode);
    wline(g, [[-14, -6.5], [-9, -7.5]], C.hairDark, 1.5, { amp: 0.1 }); wline(g, [[-2.5, -7.5], [3, -6.5]], C.hairDark, 1.5, { amp: 0.1 });
    wline(g, [[-6.5, 3.5], [-8.5, 6], [-6.5, 6.6]], C.ink, 1.2, { amp: 0.1, boil: true });
    const mo = talking ? Math.abs(Math.sin(t * 10)) * 2.4 : 0;
    if (mo > 0.4) { g.beginPath(); g.ellipse(-6, 11, 2.4, mo, 0, 0, TAU); g.fillStyle = '#5b2f28'; g.fill(); }
    else wline(g, [[-9.5, 10], [-6, 11.8], [-2.5, 10]], C.ink, 1.3, { amp: 0.1, boil: true });
    g.restore();
    g.restore();
  }

  // 畫面前面的大葉子，讓畫面有前後
  function drawFront(g, t) {
    SEED = 5000;
    const big = (bx, by, len, rot, col, i) => {
      g.save(); g.translate(bx, by); g.rotate(rot + Math.sin(t * 0.8 + i * 1.3) * 0.035);
      wline(g, [[0, 0], [0, -len * 0.45]], C.green, 2.2, { seed: 5001 + i * 9 });
      shape(g, [[0, -len * 0.3], [len * 0.2, -len * 0.55], [len * 0.14, -len * 0.86], [0, -len], [-len * 0.14, -len * 0.86], [-len * 0.2, -len * 0.55]], { fill: col, seed: 5002 + i * 9, boil: true });
      wline(g, [[0, -len * 0.36], [0, -len * 0.92]], C.wall2, 1.1, { seed: 5003 + i * 9 });
      [0.5, 0.66, 0.8].forEach((k, j) => { wline(g, [[0, -len * k], [len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5004 + i * 9 + j }); wline(g, [[0, -len * k], [-len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5007 + i * 9 + j }); });
      g.restore();
    };
    big(352, 292, 64, -0.5, C.green, 0); big(362, 296, 74, -0.12, C.green2, 1); big(372, 300, 58, 0.3, C.green, 2); big(342, 300, 44, -0.9, C.moss, 3);
    big(6, 312, 60, 0.3, C.green2, 4); big(-2, 300, 70, 0.05, C.green, 5);
    shape(g, [[338, 282], [388, 282], [382, 316], [344, 316]], { fill: C.pumpkin, seed: 5090 });
    wline(g, [[340, 289], [386, 289]], C.rust, 1.6, { seed: 5091 });
  }

  function drawParticles(g) {
    dust.forEach((d) => { g.globalAlpha = clamp(d.life * 1.6) * 0.9; dot(g, d.x, d.y, d.r, d.c); });
    sparks.forEach((s, i) => {
      const k = s.life / s.max, r = s.r * Math.sin(clamp(k) * Math.PI) * 1.2 + 0.6;
      g.globalAlpha = clamp(k * 2.5);
      shape(g, star(s.x, s.y, r, s.rot), { fill: s.c, lw: 1.1, step: 99, amp: 0.2, seed: 6000 + i, double: false });
    });
    g.globalAlpha = 1;
  }

  function update(t, dt) {
    T = t; const still = state.still;
    BOIL = still ? 0 : Math.floor(t * 5) % 3;
    const ease = (k) => (still ? 1 : Math.min(1, dt * k));
    state.veilShown += (state.veil - state.veilShown) * ease(2.6);
    state.slumpShown += (state.slump - state.slumpShown) * ease(2.2);
    state.bell *= Math.exp(-dt * 1.5); state.shake *= Math.exp(-dt * 7);
    state.nod = Math.max(0, state.nod - dt * 1.6); state.flinch = Math.max(0, state.flinch - dt * 2.4);
    const ph = (t + 2.2) % 5.6;
    state.wince = still ? 0 : Math.max(ph < 1 ? Math.sin(ph * Math.PI) : 0, state.slumpShown * 0.7);
    if (still) { sparks.length = 0; dust.length = 0; return; }
    // 鐵翅蛾翅膀掉下來的鱗粉
    dustClock += dt;
    if (dustClock > 0.3 && state.veilShown < 0.85) {
      dustClock = 0;
      dust.push({ x: MOTH.x + (Math.random() - 0.5) * 70, y: MOTH.y + 10 + Math.random() * 14, vx: (Math.random() - 0.5) * 4, vy: 9 + Math.random() * 8, r: 0.8 + Math.random() * 0.9, life: 1, c: Math.random() < 0.5 ? C.ochre : C.cream });
    }
    for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.x += (d.vx + Math.sin(t * 3 + i) * 3) * dt; d.y += d.vy * dt; d.life -= dt * 0.45; if (d.life <= 0) dust.splice(i, 1); }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.94; s.vy *= 0.94; s.rot += dt * 2; s.life -= dt; if (s.life <= 0) sparks.splice(i, 1); }
  }

  function render() {
    if (!back) return;
    const t = state.still ? 0 : T, g = ctx;
    const sx = state.still ? 0 : (hash(BOIL, Math.floor(T * 30)) - 0.5) * state.shake * 10, sy = state.still ? 0 : (hash(BOIL + 9, Math.floor(T * 30)) - 0.5) * state.shake * 10;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(back, Math.round(sx * dpr), Math.round(sy * dpr));
    g.setTransform(dpr * S, 0, 0, dpr * S, dpr * (OX + sx), dpr * (OY + sy));
    SEED = 50; drawWindowLife(g, t);
    drawCat(g, t);
    drawHangings(g, t);
    drawLin(g, t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(mid, Math.round(sx * dpr), Math.round(sy * dpr));
    g.setTransform(dpr * S, 0, 0, dpr * S, dpr * (OX + sx), dpr * (OY + sy));
    const m = drawMoth(g, t);
    drawFog(g, t, m);
    drawCen(g, t);
    drawFront(g, t);
    drawParticles(g);
    // 病人變差：霧從四周湧進來，畫面暗一點
    const bad = state.slumpShown;
    if (bad > 0.02) {
      EDGE.forEach((e, i) => { g.globalAlpha = clamp(bad * 1.2) * 0.93; puff(g, e.x + Math.sin(t * 0.6 + i) * 3, e.y + Math.cos(t * 0.5 + i) * 2, e.r * (0.4 + 0.6 * bad), 20 + i, t); });
      g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(70, 60, 96, ' + (bad * 0.13).toFixed(3) + ')'; g.fillRect(0, 0, canvas.width, canvas.height);
    }
    // 紙的顆粒
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.globalCompositeOperation = 'multiply'; g.fillStyle = grainD; g.fillRect(0, 0, canvas.width, canvas.height);
    g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.4; g.fillStyle = grainL; g.fillRect(0, 0, canvas.width, canvas.height);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }

  function burst(n, key) {
    if (state.still) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.5, v = 40 + Math.random() * 50;
      sparks.push({ x: MOTH.x, y: MOTH.y - 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, r: 3 + Math.random() * (key ? 4 : 2.5), rot: Math.random() * 3, life: 0.9 + Math.random() * 0.4, max: 1.3, c: i % 2 ? C.ochre : C.cream });
    }
  }

  return {
    state, resize, update, render,
    // 角色頭頂的位置，給對話泡泡用（CSS 像素）
    anchor(who) {
      const p = who === 'lin' ? [LIN.x + 1, LIN.y - 84 * BIG] : who === 'cen' ? [CEN.x - 1, CEN.y - 128 * BIG] : who === 'fog' ? [MOTH.x, MOTH.y + 54] : null;
      return p && { x: OX + p[0] * S, y: OY + p[1] * S };
    },
    clue(step, key) { state.veil = Math.max(0, state.veil - step); state.flinch = 1; state.nod = 1; burst(key ? 12 : 7, key); },
    ring() { state.bell = 1; },
    worsen() { state.slump = 1; state.shake = 1; state.veil = Math.min(1, state.veil + 0.25); },
    reset() { Object.assign(state, { veil: 1, bell: 0, shake: 0, slump: 0, nod: 0, flinch: 0 }); sparks.length = 0; },
  };
}
