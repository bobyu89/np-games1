// 繪本風的畫筆：色盤、形狀、鉛筆線、紙的顆粒。病室和公會大廳共用這一份。
//
// 畫法：每個形狀都是「幾個點 → 每個點抖一點 → 連成平滑的線」，先平塗顏色，
// 再用鉛筆色描邊（描兩次，第二次淡一點、位置差一點），最後整張蓋上紙的顆粒。
// 會動的東西每秒換五次抖動，看起來像一張一張手畫的（動畫裡叫 line boil）。

/** boil：目前是第幾組抖動。seed：每畫一個形狀就加一，讓每個形狀的抖動不一樣 */
export const K = { boil: 0, seed: 0 };

export const C = {
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
  shen: '#7c6b47', shen2: '#63553a', skin2: '#e6bd94', hairShen: '#5a554e',
  cloak: '#55807e', cloak2: '#3d6363',
  // 碼頭的貨棧、雨天
  plank: '#b08a5c', plank2: '#8f6c45', stone: '#9b957f', stone2: '#7c7663', sea: '#6f9d9a', sea2: '#4f7f80', rainSky: '#9fb0aa', rose: '#b98579', rose2: '#96635a', hairInk: '#33302c', hairBrown: '#7a5a3c',
  // 第二章的症影和主角
  frog: '#a98aa6', frog2: '#7d5f7b', crab: '#cc6a48', crab2: '#9c4a32', slate: '#7384ad', slate2: '#55648c', amber: '#c68c2b', amber2: '#9c6d1d',
  hallWall: '#d9c692', hallWall2: '#c9b47c', tile: '#7b9a94', tile2: '#63817c', cork: '#b98a5a', sea: '#6f9a98',
};

export const TAU = Math.PI * 2;

export function hash(a, b) {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };

// ── 形狀的點 ──
export function ell(cx, cy, rx, ry, n = 12, rot = 0) {
  const out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
}
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export function rrect(x, y, w, h, r) {
  const k = r * 0.3;
  return [[x + r, y], [x + w - r, y], [x + w - k, y + k], [x + w, y + r], [x + w, y + h - r], [x + w - k, y + h - k],
    [x + w - r, y + h], [x + r, y + h], [x + k, y + h - k], [x, y + h - r], [x, y + r], [x + k, y + k]];
}

// 把邊切細，再讓每個點抖一點
export function prep(pts, closed, step, amp, seed) {
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
export function trace(g, p, closed) {
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
function seedOf(o) { K.seed += 1; return (o.seed || K.seed) * 7 + (o.boil ? K.boil * 131 : 0); }

// 平塗 + 鉛筆描邊
export function shape(g, pts, o = {}) {
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
export const oval = (g, cx, cy, rx, ry, o = {}) => shape(g, ell(cx, cy, rx, ry, o.n || 12, o.rot || 0), { step: 99, ...o });
// 一筆線
export function wline(g, pts, color, lw, o = {}) {
  const seed = seedOf(o);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = color || C.ink; g.lineWidth = lw || 1.3;
  trace(g, prep(pts, false, o.step || 7, o.amp === undefined ? 0.5 : o.amp, seed), false); g.stroke();
}
// 手腳、圍巾這類粗粗的條狀物：先畫一條粗的深色線，再疊一條細一點的顏色
export function limb(g, pts, w, fill, o = {}) {
  const p = prep(pts, false, o.step || 6, o.amp === undefined ? 0.4 : o.amp, seedOf(o));
  g.lineJoin = 'round'; g.lineCap = 'round';
  trace(g, p, false); g.strokeStyle = C.ink; g.lineWidth = w + 2.8; g.stroke();
  trace(g, p, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
export function dot(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = fill; g.fill(); }
export function leaf(g, x, y, rx, ry, rot, fill) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill(); }
export function fillRect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
export function star(cx, cy, r, rot = 0) {
  const out = [];
  for (let i = 0; i < 8; i++) { const a = rot + (i / 8) * TAU, k = i % 2 ? r * 0.38 : r; out.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
  return out;
}

// ── 紙的顆粒 ──
export function makeGrain(px, light) {
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

/** 場景共用的底：畫布大小、不會動的圖層、座標換算、紙的顆粒 */
export function createBase(canvas, layers, view = { w: 332, h: 268, cx: 181, cy: 146 }) {
  const ctx = canvas.getContext('2d');
  const b = { ctx, W: 300, H: 250, dpr: 1, S: 1, OX: 0, OY: 0, img: null, grainD: null, grainL: null };
  b.resize = (w, h) => {
    b.W = Math.max(60, Math.round(w)); b.H = Math.max(60, Math.round(h)); b.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(b.W * b.dpr); canvas.height = Math.round(b.H * b.dpr);
    b.S = Math.min(b.W / view.w, b.H / view.h);            // 重要的東西都放在中間這個範圍裡
    b.OX = b.W / 2 - view.cx * b.S; b.OY = b.H / 2 - view.cy * b.S;
    const save = K.boil; K.boil = 0; b.img = {};
    for (const [name, draw] of Object.entries(layers)) {
      const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
      const g = c.getContext('2d'); g.setTransform(b.dpr * b.S, 0, 0, b.dpr * b.S, b.dpr * b.OX, b.dpr * b.OY); draw(g); b.img[name] = c;
    }
    K.boil = save;
    const px = Math.max(1, Math.round(b.dpr * 1.1));
    b.grainD = ctx.createPattern(makeGrain(px, false), 'repeat'); b.grainL = ctx.createPattern(makeGrain(px, true), 'repeat');
  };
  /** 換到場景的座標 */
  b.world = (sx = 0, sy = 0) => ctx.setTransform(b.dpr * b.S, 0, 0, b.dpr * b.S, b.dpr * (b.OX + sx), b.dpr * (b.OY + sy));
  /** 貼上一張預先畫好的圖層 */
  b.paste = (name, sx = 0, sy = 0) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(b.img[name], Math.round(sx * b.dpr), Math.round(sy * b.dpr)); };
  b.begin = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; };
  b.tint = (rgba) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = rgba; ctx.fillRect(0, 0, canvas.width, canvas.height); };
  b.grain = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = b.grainD; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.4; ctx.fillStyle = b.grainL; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
  /** 場景座標 → 畫布上的 CSS 像素 */
  b.css = (x, y) => ({ x: b.OX + x * b.S, y: b.OY + y * b.S });
  return b;
}
