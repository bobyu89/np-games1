// 像素圖：全部用程式畫，沒有外部圖檔。風格是「十六位元 RPG」（美術方向 B）。
// 這一版的圖是佔位用的，內容階段會重畫一整套。
//
// 每張圖是一個小畫板（Grid），格子裡放的是「顏色代號」，畫到畫面上時才查調色盤。
// 面紗效果是把真面目降低解析度（馬賽克），不用另外畫。

export class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill('.'); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? '.' : this.d[y * this.w + x]; }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; return this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  px(list, c) { list.forEach(([x, y]) => this.set(x, y, c)); return this; }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) this.set(x, y, c);
    }
    return this;
  }
  line(x0, y0, x1, y1, c, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      this.rect(x, y, t, t, c);
    }
    return this;
  }
  outline(c = 'o') {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y) !== '.') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => this.get(x + a, y + b) !== '.')) add.push([x, y]);
    }
    return this.px(add, c);
  }
  // 馬賽克：每 b×b 一格取最多的顏色。flat 時只留兩個色調，看不出是誰
  mosaic(b, flat) {
    const g = new Grid(this.w, this.h);
    for (let by = 0; by < this.h; by += b) for (let bx = 0; bx < this.w; bx += b) {
      const count = {}; let filled = 0;
      for (let j = 0; j < b; j++) for (let i = 0; i < b; i++) {
        const c = this.get(bx + i, by + j);
        if (c !== '.') { filled++; count[c] = (count[c] || 0) + 1; }
      }
      if (filled < b * b * 0.38) continue;
      let top = Object.keys(count).sort((p, q) => count[q] - count[p])[0];
      if (flat) top = DARK_SLOTS.includes(top) ? 'V' : 'v';
      g.rect(bx, by, b, b, top);
    }
    return g;
  }
}

const DARK_SLOTS = 'oRkCU';

// 調色盤（B：十六位元 RPG）。代號 → 顏色
export const PALETTE = Object.freeze({
  o: '#22232f', // 描邊
  h: '#6a4530', // 頭髮
  s: '#f4cba6', S: '#d9a07c', // 皮膚、皮膚陰影
  w: '#ffffff', k: '#22232f', // 白、黑
  c: '#a6dcd4', C: '#6fb1ab', // 病人服、陰影
  m: '#a8484a', // 嘴
  b: '#f6f8fa', B: '#c7d2da', f: '#8794a3', // 床單、床單陰影、床架
  r: '#e3474f', R: '#a52b3c', p: '#ff9a94', // 紅、深紅、亮紅
  y: '#ffd94a', // 黃
  u: '#8f7bd6', U: '#5b4a9c', // 紫、深紫
  V: '#3b3550', v: '#6c648a', // 面紗的兩個色調
});

// 病人：坐在床邊。mood = 'pain'（不舒服，手按胸口）或 'ok'（康復）。44×52
export function makePatient(mood = 'pain') {
  const g = new Grid(44, 52);
  g.rect(0, 36, 44, 4, 'b').rect(0, 40, 44, 1, 'B').rect(0, 41, 44, 3, 'f').rect(3, 44, 3, 6, 'f').rect(38, 44, 3, 6, 'f');
  g.rect(15, 34, 5, 12, 'C').rect(24, 34, 5, 12, 'C').rect(13, 46, 7, 3, 'w').rect(24, 46, 7, 3, 'w');
  g.rect(12, 20, 20, 16, 'c').px([[12, 20], [13, 20], [12, 21], [31, 20], [30, 20], [31, 21]], '.').rect(28, 22, 4, 14, 'C');
  g.px([[20, 20], [21, 20], [22, 20], [23, 20], [21, 21], [22, 21]], 's');
  g.rect(8, 21, 4, 11, 'c').rect(8, 32, 4, 3, 's');
  if (mood === 'pain') {
    g.rect(32, 21, 4, 7, 'C').rect(26, 27, 9, 3, 'C').rect(21, 25, 5, 5, 's').rect(21, 29, 5, 1, 'S');
  } else {
    g.rect(32, 21, 4, 11, 'C').rect(32, 32, 4, 3, 's');
  }
  g.rect(19, 17, 6, 4, 's').rect(19, 19, 6, 1, 'S');
  g.ellipse(22, 9.5, 9.5, 9, 's');
  for (let y = 0; y < 52; y++) for (let x = 0; x < 44; x++) {
    if (g.get(x, y) !== 's' || y > 18) continue;
    if (y <= 5 || ((x <= 14 || x >= 29) && y <= 9)) g.set(x, y, 'h');
  }
  g.rect(17, 10, 2, 3, 'k').rect(25, 10, 2, 3, 'k').px([[17, 10], [25, 10]], 'w');
  g.px([[15, 13], [16, 13], [27, 13], [28, 13]], 'S');
  if (mood === 'pain') {
    g.px([[15, 8], [16, 8], [17, 7], [18, 7], [28, 8], [27, 8], [26, 7], [25, 7]], 'h');
    g.rect(20, 15, 4, 1, 'm').px([[19, 16], [24, 16]], 'm');
    g.px([[33, 5], [33, 6], [34, 6], [33, 7], [34, 7]], 'w');
  } else {
    g.px([[16, 7], [17, 7], [18, 7], [25, 7], [26, 7], [27, 7]], 'h');
    g.rect(20, 16, 4, 1, 'm').px([[19, 15], [24, 15]], 'm');
  }
  return g.outline('o');
}

// 主訴怪「怒心怪」：一顆生氣的心臟。48×48
function makeAngryHeart() {
  const g = new Grid(48, 48);
  g.rect(16, 31, 4, 13, 'R').rect(28, 31, 4, 13, 'R').rect(13, 43, 8, 3, 'R').rect(27, 43, 8, 3, 'R');
  g.rect(1, 20, 6, 3, 'R').rect(41, 20, 6, 3, 'R').ellipse(2.5, 21.5, 2.6, 2.6, 'R').ellipse(45.5, 21.5, 2.6, 2.6, 'R');
  g.rect(13, 1, 4, 7, 'R').rect(31, 1, 4, 7, 'R').rect(13, 1, 4, 1, 'p').rect(31, 1, 4, 1, 'p');
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const u = (x + 0.5 - 24) / 17, v = -(y + 0.5 - 21) / 17;
    const a = u * u + v * v - 1;
    if (a * a * a - u * u * v * v * v > 0) continue;
    g.set(x, y, u * 0.8 - v * 0.62 > 0.52 ? 'R' : 'r');
  }
  g.ellipse(13.5, 11.5, 3.6, 2.6, 'p');
  g.ellipse(17, 19.5, 4.2, 3.6, 'w').ellipse(31, 19.5, 4.2, 3.6, 'w').rect(18, 19, 2, 3, 'k').rect(29, 19, 2, 3, 'k');
  g.line(11, 13, 20, 16, 'o', 2).line(36, 13, 27, 16, 'o', 2);
  g.rect(18, 27, 13, 3, 'o').px([[20, 27], [21, 27], [24, 27], [25, 27], [28, 27], [29, 27], [22, 29], [23, 29], [26, 29], [27, 29]], 'w');
  g.line(38, 6, 35, 10, 'y').line(35, 10, 38, 11, 'y').line(38, 11, 34, 16, 'y');
  return g.outline('o');
}

// 還沒有專屬圖的診斷先用這隻
function makeBlob() {
  const g = new Grid(48, 48);
  g.ellipse(24, 30, 19, 15, 'u').ellipse(24, 20, 13, 12, 'u').rect(6, 40, 36, 5, 'u');
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) if (g.get(x, y) === 'u' && x - y * 0.3 > 22) g.set(x, y, 'U');
  g.ellipse(18, 22, 4, 4, 'w').ellipse(30, 22, 4, 4, 'w').rect(18, 22, 2, 3, 'k').rect(29, 22, 2, 3, 'k');
  g.rect(20, 32, 9, 2, 'o');
  return g.outline('o');
}

export const PATIENT = Object.freeze({ pain: makePatient('pain'), ok: makePatient('ok') });
const MONSTERS = { 'angry-heart': makeAngryHeart(), blob: makeBlob() };
export function monsterSprite(id) { return MONSTERS[id] || MONSTERS.blob; }

// 面紗的厚度（0 到 100）對應馬賽克的粗細
export function veiled(grid, veil) {
  if (veil >= 85) return grid.mosaic(12, true);
  if (veil >= 65) return grid.mosaic(8, true);
  if (veil >= 45) return grid.mosaic(6, true);
  if (veil >= 30) return grid.mosaic(4, false);
  if (veil >= 15) return grid.mosaic(3, false);
  if (veil > 2) return grid.mosaic(2, false);
  return grid;
}

// 把一張圖畫到畫布上。tint 可以把整張圖換成同一個顏色（閃一下的效果）
export function drawGrid(ctx, grid, x, y, { tint = null, scale = 1 } = {}) {
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    const s = grid.get(i, j);
    if (s === '.') continue;
    ctx.fillStyle = tint && s !== 'o' ? tint : PALETTE[s] || '#ff00ff';
    ctx.fillRect((x + i) * scale, (y + j) * scale, scale, scale);
  }
}
