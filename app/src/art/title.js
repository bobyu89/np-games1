// 首頁的那一張畫：入夜的霧港。燈塔的光掃過海面，霧一團一團飄過去，有一團長出了眼睛；
// 碼頭上掛著四盞燈，主角（選了才有）站在那裡看著燈塔。
import { C, K, TAU, rect, rrect, ell, shape, oval, wline, dot, fillRect, star, createBase } from './sketch.js';
import { drawCat, drawHero } from './cast.js';

const X0 = -320, X1 = 620, Y0 = -220, Y1 = 520;
const SEA_Y = 178, QUAY_Y = 236;
const TOWER = { x: 78, top: 62 };            // 燈塔的燈室
const LAMPS = [34, 92, 150, 208];            // 碼頭的四盞燈：一個主訴，四個可能的診斷
const NIGHT = '#35525a', NIGHT2 = '#2b4350', HILL = '#2c4a43', HILL2 = '#243d3a', SEA = '#3f6a70', SEA2 = '#335960';

function drawBack(g) {
  K.seed = 9100;
  // 天：上面深一點
  fillRect(g, X0, Y0, X1 - X0, SEA_Y - Y0, NIGHT);
  g.globalAlpha = 0.55; fillRect(g, X0, Y0, X1 - X0, 150, NIGHT2); g.globalAlpha = 0.3; fillRect(g, X0, Y0 + 150, X1 - X0, 60, NIGHT2); g.globalAlpha = 1;
  // 星星
  [[18, 28, 1.1], [52, 52, 0.9], [118, 22, 1.2], [146, 58, 0.8], [176, 34, 1], [262, 30, 1.1], [288, 62, 0.9], [-40, 44, 1], [-110, 70, 0.9], [340, 48, 1.1], [410, 26, 0.9], [232, 12, 0.8], [96, 44, 0.7], [470, 66, 1]].forEach(([x, y, r]) => dot(g, x, y, r, C.cream));
  shape(g, star(200, 40, 3.6, 0.3), { fill: C.glow, lw: 0.8, amp: 0.2, step: 99 }); shape(g, star(30, 70, 2.8, 0.1), { fill: C.glow, lw: 0.8, amp: 0.2, step: 99 });
  // 月亮
  g.globalAlpha = 0.16; dot(g, 232, 74, 26, C.glow); g.globalAlpha = 1;
  oval(g, 232, 74, 13, 13, { fill: C.cream, lw: 1.2, n: 14 }); g.globalAlpha = 0.5; dot(g, 228, 70, 2.6, C.paperLine); dot(g, 237, 79, 1.8, C.paperLine); g.globalAlpha = 1;
  // 遠山和港城：山坡上的屋子亮著窗
  shape(g, [[X0, SEA_Y], [X0, 150], [-120, 138], [-40, 152], [20, 160], [50, SEA_Y]], { fill: HILL2, lw: 1.2, step: 16 });
  shape(g, [[120, SEA_Y], [150, 158], [186, 142], [226, 128], [262, 122], [300, 130], [352, 120], [430, 132], [X1, 126], [X1, SEA_Y]], { fill: HILL, lw: 1.2, step: 16 });
  const house = (x, y, w, h, roof, lit) => {
    shape(g, rect(x, y, w, h), { fill: C.wood2, lw: 1.1, amp: 0.3 });
    shape(g, [[x - 2, y], [x + w / 2, y - h * 0.55], [x + w + 2, y]], { fill: roof, lw: 1.1, amp: 0.3 });
    lit.forEach(([dx, dy]) => { g.globalAlpha = 0.25; dot(g, x + dx + 1.6, y + dy + 2, 4.6, C.glow); g.globalAlpha = 1; shape(g, rect(x + dx, y + dy, 3.4, 4.2), { fill: C.glow, lw: 0.8, amp: 0.15 }); });
  };
  house(196, 136, 16, 14, C.rust, [[3, 4], [10, 4]]); house(216, 128, 13, 13, C.pumpkin, [[5, 4]]); house(274, 124, 15, 15, C.rust, [[3, 5]]); house(296, 134, 18, 13, C.pumpkin, [[4, 4], [11, 4]]);
  house(338, 126, 14, 14, C.rust, [[5, 5]]); house(170, 152, 14, 12, C.pumpkin, [[5, 4]]); house(392, 136, 16, 13, C.rust, [[4, 4]]);
  // 公會：最大的那一棟，有旗子、三扇亮著的窗
  shape(g, rect(234, 106, 34, 34), { fill: C.wood, lw: 1.3, amp: 0.4 });
  shape(g, [[230, 106], [251, 88], [272, 106]], { fill: C.coat, lw: 1.3, amp: 0.4 });
  [[239, 114], [249, 114], [259, 114]].forEach(([x, y]) => { g.globalAlpha = 0.3; dot(g, x + 2, y + 3, 6, C.glow); g.globalAlpha = 1; shape(g, rrect(x, y, 5, 8, 2), { fill: C.glow, lw: 0.9, amp: 0.2 }); });
  shape(g, [[247, 140], [247, 130], [251, 127], [255, 130], [255, 140]], { fill: C.wood2, lw: 1 });
  wline(g, [[251, 88], [251, 74]], C.ink, 1.3, { amp: 0.2 }); shape(g, [[251, 75], [262, 78], [251, 82]], { fill: C.ochre, lw: 1, amp: 0.3 });
  // 海
  fillRect(g, X0, SEA_Y, X1 - X0, QUAY_Y - SEA_Y + 10, SEA);
  for (let i = 0; i < 46; i++) { const x = X0 + ((i * 97) % (X1 - X0)), y = SEA_Y + 6 + ((i * 37) % 50); wline(g, [[x, y], [x + 6, y - 1.5], [x + 12, y]], i % 3 ? SEA2 : C.sea, 1.1, { amp: 0.2 }); }
  wline(g, [[X0, SEA_Y], [X1, SEA_Y]], C.ink, 1.3, { step: 16 });
  // 燈塔底下的礁石
  shape(g, [[40, 190], [46, 174], [60, 166], [84, 163], [104, 168], [116, 180], [120, 190]], { fill: C.stone2, lw: 1.4 });
  shape(g, [[52, 190], [58, 178], [72, 173], [82, 180], [80, 190]], { fill: C.stone, lw: 1.1 });
  // 燈塔
  shape(g, [[66, 170], [71, 76], [85, 76], [90, 170]], { fill: C.cream, lw: 1.5 });
  shape(g, [[67.2, 150], [88.8, 150], [89.6, 164], [66.4, 164]], { fill: C.rust, lw: 1.1 }); shape(g, [[69, 112], [87, 112], [87.8, 127], [68.2, 127]], { fill: C.rust, lw: 1.1 }); shape(g, [[70.5, 82], [85.5, 82], [86, 94], [70, 94]], { fill: C.rust, lw: 1.1 });
  shape(g, rrect(75.5, 132, 5, 9, 2), { fill: NIGHT2, lw: 1 }); shape(g, rect(74, 158, 8, 12), { fill: C.wood2, lw: 1 });
  shape(g, rect(66, 71, 24, 5), { fill: C.wood2, lw: 1.2 }); [[68, 71], [73, 71], [78, 71], [83, 71], [88, 71]].forEach(([x, y]) => wline(g, [[x, y], [x, y - 6]], C.ink, 1, { amp: 0.1 })); wline(g, [[66, 65], [90, 65]], C.ink, 1.1, { amp: 0.2 });
  shape(g, rect(72, 55, 12, 16), { fill: C.glow, lw: 1.2 }); wline(g, [[78, 55], [78, 71]], C.ink, 1, { amp: 0.1 });
  shape(g, [[69, 55], [78, 44], [87, 55]], { fill: C.rust, lw: 1.2 }); dot(g, 78, 43, 1.8, C.brass);
  // 碼頭
  fillRect(g, X0, QUAY_Y, X1 - X0, Y1 - QUAY_Y, C.plank);
  for (let y = QUAY_Y + 9; y < Y1; y += 11) wline(g, [[X0, y], [X1, y + 1]], C.plank2, 1.1, { step: 30 });
  for (let x = X0 + 8; x < X1; x += 46) for (let y = QUAY_Y; y < Y1; y += 22) wline(g, [[x + ((y / 22) % 2) * 23, y], [x + ((y / 22) % 2) * 23, y + 11]], C.plank2, 1, { amp: 0.2 });
  shape(g, rect(X0, QUAY_Y - 3, X1 - X0, 6), { fill: C.wood2, lw: 1.3, step: 18 });
  // 掛燈的柱子和繩子
  [5, 63, 121, 179, 237].forEach((x) => { shape(g, rect(x - 2.5, QUAY_Y - 40, 5, 42), { fill: C.wood, lw: 1.2, amp: 0.3 }); dot(g, x, QUAY_Y - 41, 2.4, C.brass); });
  for (let i = 0; i < 4; i++) { const a = 5 + i * 58, b = a + 58; wline(g, [[a, QUAY_Y - 38], [(a + b) / 2, QUAY_Y - 31], [b, QUAY_Y - 38]], C.ink, 1.1, { amp: 0.2 }); }
  // 纜樁和木箱
  shape(g, rrect(300, QUAY_Y - 14, 12, 16, 3), { fill: C.iron2, lw: 1.3 }); shape(g, rrect(297, QUAY_Y - 17, 18, 6, 3), { fill: C.iron, lw: 1.2 });
  shape(g, rect(-34, QUAY_Y - 20, 26, 22), { fill: C.wood, lw: 1.3 }); wline(g, [[-34, QUAY_Y - 9], [-8, QUAY_Y - 9]], C.wood2, 1.2); wline(g, [[-21, QUAY_Y - 20], [-21, QUAY_Y + 2]], C.wood2, 1.2);
}

export function createTitle(canvas, opts = {}) {
  const base = createBase(canvas, { back: drawBack }, opts.view || { w: 300, h: 250, cx: 150, cy: 152 }), ctx = base.ctx;
  // hero：主角是哪一位（還沒選就不畫）
  const state = { still: false, hero: opts.hero || null };
  let T = 0;

  function drawBeam(g, t) {
    // 燈塔的光：慢慢掃過去，掃到正面的時候最亮
    const dir = Math.sin(t * 0.45), a = 0.1 + 0.2 * (1 - Math.abs(dir)), len = 330, spread = 0.11, ang = -0.12 + dir * 1.05;
    const p = (k) => [TOWER.x + Math.cos(ang + k) * len, TOWER.top + Math.sin(ang + k) * len * 0.5];
    const q = (k) => [TOWER.x - Math.cos(ang + k) * len, TOWER.top - Math.sin(ang + k) * len * 0.5];
    g.fillStyle = C.glow;
    g.globalAlpha = a; g.beginPath(); g.moveTo(TOWER.x, TOWER.top); g.lineTo(...p(-spread)); g.lineTo(...p(spread)); g.closePath(); g.fill();
    g.globalAlpha = a * 0.6; g.beginPath(); g.moveTo(TOWER.x, TOWER.top); g.lineTo(...q(-spread)); g.lineTo(...q(spread)); g.closePath(); g.fill();
    g.globalAlpha = 0.3 + 0.2 * Math.sin(t * 2.3); dot(g, TOWER.x, TOWER.top + 1, 13, C.glow);
    g.globalAlpha = 1; dot(g, TOWER.x, TOWER.top + 1, 3.2, '#fff6cf');
    // 海面上的倒影
    for (let i = 0; i < 5; i++) { g.globalAlpha = (0.5 - i * 0.08) * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7)); wline(g, [[TOWER.x - 9 + i * 1.5, 196 + i * 7], [TOWER.x + 9 - i * 1.5, 196 + i * 7]], C.glow, 1.6, { amp: 0.3, seed: 9300 + i, boil: true }); }
    g.globalAlpha = 1;
  }

  function puff(g, x, y, rx, ry, alpha, seed) {
    g.globalAlpha = alpha;
    oval(g, x, y, rx, ry, { fill: C.fog, stroke: null, seed });
    oval(g, x - rx * 0.55, y + ry * 0.2, rx * 0.62, ry * 0.8, { fill: C.fog, stroke: null, seed: seed + 1 });
    oval(g, x + rx * 0.5, y - ry * 0.35, rx * 0.66, ry * 0.9, { fill: C.fog, stroke: null, seed: seed + 2 });
    g.globalAlpha = 1;
  }
  function drawFog(g, t) {
    // 一團一團的霧，從右邊飄到左邊
    [[0, 150, 44, 11, 5.2, 0.5], [170, 168, 56, 13, 3.6, 0.62], [330, 132, 38, 9, 6.4, 0.42], [470, 186, 62, 14, 4.2, 0.7], [600, 158, 46, 11, 5.6, 0.5], [90, 204, 52, 12, 3, 0.55]].forEach(([x0, y, rx, ry, sp, al], i) => {
      const span = 760, x = 520 - ((x0 + t * sp) % span);
      puff(g, x, y + Math.sin(t * 0.4 + i) * 2, rx, ry, al, 9400 + i * 5);
    });
    // 有一團長出了眼睛：症影
    const sx = 176 + Math.sin(t * 0.23) * 26, sy = 126 + Math.sin(t * 0.61) * 5, blink = (t * 0.7 + 2.2) % 5.1 < 0.14;
    g.globalAlpha = 0.94;
    oval(g, sx, sy, 22, 13, { fill: C.fog, stroke: C.fogLine, lw: 1.2, seed: 9500, boil: true, n: 14 });
    oval(g, sx - 15, sy + 4, 11, 8, { fill: C.fog, stroke: C.fogLine, lw: 1.1, seed: 9501, boil: true });
    oval(g, sx + 15, sy + 3, 12, 9, { fill: C.fog, stroke: C.fogLine, lw: 1.1, seed: 9502, boil: true });
    oval(g, sx + 2, sy - 8, 13, 9, { fill: C.fog, stroke: C.fogLine, lw: 1.1, seed: 9503, boil: true });
    g.globalAlpha = 1;
    oval(g, sx, sy + 1, 19, 10, { fill: C.fog, stroke: null, seed: 9504 });
    [-6, 6].forEach((dx) => { if (blink) wline(g, [[sx + dx - 3, sy], [sx + dx + 3, sy]], C.ink, 1.4, { amp: 0 }); else { dot(g, sx + dx, sy, 3.6, C.ochre); dot(g, sx + dx - 1.2, sy + 0.8, 1.6, C.ink); } });
    // 拖在後面的幾縷
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.55 - i * 0.14; wline(g, [[sx + 24 + i * 9, sy + 6 + i * 2], [sx + 31 + i * 9, sy + 4 + i * 2 + Math.sin(t * 2 + i) * 1.5]], C.fog, 2.4 - i * 0.5, { amp: 0.3, seed: 9510 + i, boil: true }); }
    g.globalAlpha = 1;
  }

  function drawLamps(g, t) {
    K.seed = 9600;
    LAMPS.forEach((x, i) => {
      const y = QUAY_Y - 31, swing = Math.sin(t * 0.9 + i * 1.4) * 0.05, fl = 0.5 + 0.5 * Math.sin(t * (4.1 + i * 0.7) + i * 2);
      g.save(); g.translate(x, y); g.rotate(swing);
      g.globalAlpha = 0.16 + 0.07 * fl; dot(g, 0, 10, 20, C.glow); g.globalAlpha = 1;
      wline(g, [[0, 0], [0, 4]], C.ink, 1.1, { amp: 0 });
      shape(g, [[-5, 6.5], [0, 2.5], [5, 6.5]], { fill: C.brass, lw: 1.2, boil: true });
      shape(g, rrect(-5.5, 6.5, 11, 13, 2.5), { fill: C.glow, lw: 1.3, boil: true });
      wline(g, [[0, 7], [0, 19]], C.ink, 0.9, { amp: 0 }); wline(g, [[-5, 13], [5, 13]], C.ink, 0.9, { amp: 0 });
      shape(g, rect(-4.5, 19.5, 9, 2.6), { fill: C.brass, lw: 1.1, boil: true });
      g.restore();
    });
  }

  return {
    state, resize: base.resize,
    update(t) { T = t; K.boil = state.still ? 0 : Math.floor(t * 5) % 3; },
    render() {
      if (!base.img) return;
      const t = state.still ? 0 : T, g = ctx;
      base.begin(); base.paste('back'); base.world();
      K.seed = 9200;
      drawBeam(g, t);
      drawFog(g, t);
      drawLamps(g, t);
      drawCat(g, t, 198, QUAY_Y + 24);
      if (state.hero) drawHero(g, t, { x: 258, y: QUAY_Y + 36, look: state.hero, talking: false, scale: 0.92 });
      // 貼著碼頭的一層薄霧
      g.globalAlpha = 0.2; fillRect(g, X0, QUAY_Y - 10, X1 - X0, 12, C.fog); g.globalAlpha = 1;
      base.grain();
    },
    anchor() { return null; }, clue() {}, ring() {}, jolt() {}, setLights() {},
  };
}
