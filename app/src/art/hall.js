// 公會大廳：委託板、眠墨的櫃台、看得到霧港和燈塔的窗。
import { C, K, TAU, rect, rrect, prep, trace, shape, oval, wline, dot, leaf, fillRect, createBase } from './sketch.js';
import { drawCat, drawCen, drawMo } from './cast.js';

const X0 = -220, X1 = 580, Y0 = -120, Y1 = 420;
const FLOOR_Y = 196;
const CEN = { x: 266, y: 270 }, MO = { x: 74, y: 191 }, PAPER = { x: 250, y: 82 };
const WINDOW = [[31, 144], [31, 64], [38, 45], [55, 33], [72, 30], [89, 33], [106, 45], [113, 64], [113, 144]];

function paper(g, x, y, w, h, rot, lines, fill = C.paper) {
  g.save(); g.translate(x, y); g.rotate(rot);
  shape(g, rect(-w / 2, -h / 2, w, h), { fill, lw: 1.1, amp: 0.4 });
  for (let i = 0; i < lines; i++) wline(g, [[-w / 2 + 3, -h / 2 + 6 + i * 4.4], [w / 2 - 3 - (i % 2) * 4, -h / 2 + 6 + i * 4.4]], C.ink, 0.7, { amp: 0.2 });
  dot(g, 0, -h / 2 + 2, 1.7, C.rust);
  g.restore();
}

function drawBack(g) {
  K.seed = 100;
  // 牆
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.hallWall);
  let row = 0;
  for (let y = -100; y < 156; y += 19, row++) for (let x = X0 + (row % 2) * 13; x < X1; x += 26) { leaf(g, x, y, 2.2, 2.2, 0.78, C.hallWall2); }
  // 腰板
  fillRect(g, X0, 158, X1 - X0, FLOOR_Y - 158, C.wood);
  for (let x = X0 + 3; x < X1; x += 19) wline(g, [[x, 163], [x + 1, FLOOR_Y]], C.wood2, 1.1);
  shape(g, rect(X0, 153, X1 - X0, 6), { fill: C.wood2, lw: 1.2, step: 14 });
  // 地磚
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.tile);
  for (let x = X0; x < X1; x += 44) { wline(g, [[x, FLOOR_Y], [x + 150, Y1]], C.tile2, 1.1, { step: 30 }); wline(g, [[x + 150, FLOOR_Y], [x, Y1]], C.tile2, 1.1, { step: 30 }); }
  wline(g, [[X0, FLOOR_Y], [X1, FLOOR_Y]], C.ink, 1.5, { step: 14 });
  // 屋樑
  shape(g, rect(X0, -8, X1 - X0, 15), { fill: C.wood2, step: 14 });
  [[18, 7], [176, 7], [336, 7]].forEach(([x, y]) => shape(g, [[x - 9, y], [x + 9, y], [x, y + 10]], { fill: C.wood, lw: 1.2 }));
  // 長地毯
  oval(g, 214, 272, 96, 17, { fill: C.pumpkin, n: 24 });
  oval(g, 214, 272, 84, 12, { stroke: C.cream, lw: 1.6, n: 24, double: false });
  for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU + 0.2; dot(g, 214 + Math.cos(a) * 90, 272 + Math.sin(a) * 14.6, 1.7, C.ochre); }

  // 拱窗：窗外是霧港和燈塔
  shape(g, [[23, 150], [23, 62], [31, 39], [51, 25], [72, 21], [93, 25], [113, 39], [121, 62], [121, 150]], { fill: C.wood2 });
  shape(g, WINDOW, { fill: C.sky, lw: 1.2 });
  g.save(); trace(g, prep(WINDOW, true, 7, 0, 1), true); g.clip();
  oval(g, 44, 116, 26, 12, { fill: C.green2 }); oval(g, 104, 118, 22, 10, { fill: C.moss });
  shape(g, rect(26, 114, 92, 34), { fill: C.sea, lw: 1.1 });
  [[40, 124], [66, 131], [94, 126], [52, 138], [84, 140]].forEach(([x, y]) => wline(g, [[x, y], [x + 5, y - 1.4], [x + 10, y]], C.cream, 1, { amp: 0.2 }));
  // 燈塔
  shape(g, [[80, 114], [82, 66], [92, 66], [94, 114]], { fill: C.cream });
  shape(g, [[81.2, 98], [92.8, 98], [93.2, 106], [80.8, 106]], { fill: C.rust, lw: 1 }); shape(g, [[81.8, 76], [92.2, 76], [92.5, 84], [81.5, 84]], { fill: C.rust, lw: 1 });
  shape(g, rect(80, 62, 14, 4), { fill: C.wood2, lw: 1 }); shape(g, rect(82.5, 54, 9, 8), { fill: C.glow, lw: 1 }); shape(g, [[80.5, 54], [87, 47], [93.5, 54]], { fill: C.rust, lw: 1 });
  g.restore();

  // 委託板
  shape(g, rrect(186, 30, 130, 106, 4), { fill: C.wood2 });
  shape(g, rect(193, 37, 116, 92), { fill: C.cork, lw: 1.2 });
  shape(g, rrect(230, 22, 42, 14, 4), { fill: C.cream }); [[238, 29], [246, 29], [254, 29], [262, 29]].forEach(([x, y]) => wline(g, [[x, y - 2.5], [x + 3, y + 2.5]], C.ink, 1.2, { amp: 0.2 }));
  paper(g, 208, 58, 22, 30, -0.06, 4); paper(g, 296, 56, 18, 24, 0.08, 3, C.cream); paper(g, 206, 104, 20, 28, 0.05, 4, C.cream);
  paper(g, 294, 100, 22, 32, -0.04, 5); paper(g, 232, 112, 16, 20, -0.1, 2, C.cream); paper(g, 272, 116, 18, 18, 0.12, 2);

  // 旗桿
  wline(g, [[150, 17], [180, 17]], C.wood2, 2.6); dot(g, 150, 17, 2, C.brass); dot(g, 180, 17, 2, C.brass);

  // 通往病室的門
  shape(g, [[324, 196], [324, 96], [332, 78], [348, 70], [364, 78], [372, 96], [372, 196]], { fill: C.wood });
  [336, 348, 360].forEach((x) => wline(g, [[x, 82], [x, 195]], C.wood2, 1.2));
  wline(g, [[324, 110], [338, 110]], C.ink, 2.2); wline(g, [[324, 172], [338, 172]], C.ink, 2.2);
  dot(g, 332, 146, 2.6, C.brass); oval(g, 332, 146, 2.6, 2.6, { lw: 1, double: false });

  // 櫃台後面的書架
  shape(g, rect(126, 96, 44, 5), { fill: C.wood, lw: 1.2 }); shape(g, rect(126, 126, 44, 5), { fill: C.wood, lw: 1.2 });
  [[129, 78, 7, 18, C.teal], [137, 82, 6, 14, C.rust], [144, 76, 8, 20, C.mustard], [153, 80, 6, 16, C.green2], [160, 84, 7, 12, C.cream],
    [129, 108, 8, 18, C.coat], [138, 112, 6, 14, C.pumpkin], [145, 106, 7, 20, C.teal2], [158, 112, 9, 14, C.rust]].forEach(([x, y, w, h, col]) => shape(g, rect(x, y, w, h), { fill: col, lw: 1.1, amp: 0.3 }));
}

// 櫃台：要畫在眠墨前面
function drawMid(g) {
  K.seed = 400;
  oval(g, 86, 256, 82, 6, { fill: C.shadow, stroke: null });
  shape(g, rect(18, 196, 138, 58), { fill: C.wood });
  [[26, 204, 36, 42], [68, 204, 36, 42], [110, 204, 38, 42]].forEach(([x, y, w, h]) => shape(g, rrect(x, y, w, h, 3), { stroke: C.wood2, lw: 1.3, double: false }));
  shape(g, rrect(11, 187, 152, 10, 3), { fill: C.wood2 });
  // 桌上：一疊書、攤開的登記簿、墨水、桌鈴
  [[22, 180, 30, 7, C.rust], [24, 173, 27, 7, C.teal], [21, 166, 31, 7, C.mustard]].forEach(([x, y, w, h, col]) => { shape(g, rrect(x, y, w, h, 1.5), { fill: col, lw: 1.1, amp: 0.3 }); wline(g, [[x + 4, y + 3.5], [x + w - 4, y + 3.5]], C.cream, 0.9, { amp: 0 }); });
  shape(g, [[66, 187], [70, 181], [106, 181], [110, 187]], { fill: C.cream, lw: 1.1 }); wline(g, [[88, 181], [88, 187]], C.ink, 0.9, { amp: 0 });
  [[74, 183.5, 84, 183.5], [92, 183.5, 103, 183.5]].forEach(([a, b, c, d]) => wline(g, [[a, b], [c, d]], C.ink, 0.7, { amp: 0.2 }));
  shape(g, rrect(118, 177, 9, 10, 2), { fill: C.coat, lw: 1.1 }); shape(g, rect(120.5, 174, 4, 3), { fill: C.cream, lw: 1 });
  shape(g, [[136, 187], [138, 180], [144, 177], [150, 180], [152, 187]], { fill: C.brass, lw: 1.2 }); dot(g, 144, 175.6, 1.6, C.wood2);
}

export function createHall(canvas) {
  const base = createBase(canvas, { back: drawBack, mid: drawMid }), ctx = base.ctx;
  // glow：委託板上那張可以接的委託有沒有在發亮
  const state = { talker: null, still: false, glow: 1 };
  let T = 0;

  function drawWindowLife(g, t) {
    g.save(); trace(g, prep(WINDOW, true, 7, 0, 1), true); g.clip();
    // 燈塔的光掃過來
    const dir = Math.sin(t * 0.7), a = 0.1 + 0.16 * (1 - Math.abs(dir));
    g.globalAlpha = a; g.beginPath(); g.moveTo(87, 58); g.lineTo(87 + dir * 80 - 10, 58 + 26); g.lineTo(87 + dir * 80 + 10, 58 - 12); g.closePath(); g.fillStyle = C.glow; g.fill(); g.globalAlpha = 1;
    g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3.1); dot(g, 87, 58, 4.2, C.glow); g.globalAlpha = 1;
    // 霧一團一團飄過港口
    [[0, 100, 20, 8, 2.6], [46, 122, 24, 9, 1.9], [90, 84, 15, 6, 3.4], [20, 138, 22, 8, 2.2]].forEach(([x0, y, rx, ry, sp], i) => {
      const x = 130 - ((x0 + t * sp) % 150);
      g.globalAlpha = 0.9; oval(g, x, y, rx, ry, { fill: C.fog, stroke: null, seed: 60 + i }); oval(g, x + rx * 0.55, y - ry * 0.5, rx * 0.6, ry * 0.9, { fill: C.fog, stroke: null, seed: 66 + i }); g.globalAlpha = 1;
    });
    g.restore();
    wline(g, [[72, 30], [72, 144]], C.wood2, 3.2, { seed: 80, amp: 0.3 }); wline(g, [[31, 88], [113, 88]], C.wood2, 3.2, { seed: 81, amp: 0.3 });
    shape(g, rect(19, 146, 106, 7), { fill: C.wood, seed: 82 });
  }

  function drawWallLife(g, t) {
    K.seed = 700;
    // 公會的旗子
    const s1 = Math.sin(t * 1.1) * 2.2;
    shape(g, [[153, 18], [177, 18], [177 + s1 * 0.4, 62], [165 + s1, 84], [153 + s1 * 0.4, 62]], { fill: C.coat, boil: true });
    oval(g, 165 + s1 * 0.3, 42, 7, 9, { fill: C.ochre, lw: 1.2, boil: true });
    wline(g, [[165 + s1 * 0.3, 35], [165 + s1 * 0.3, 50]], C.ink, 1); wline(g, [[165 + s1 * 0.3, 40], [169 + s1 * 0.3, 37]], C.ink, 0.9); wline(g, [[165 + s1 * 0.3, 45], [161 + s1 * 0.3, 42]], C.ink, 0.9);
    // 吊燈和螢火蟲
    g.save(); g.translate(140, -40); g.rotate(Math.sin(t * 0.85) * 0.03); g.translate(0, 40);
    g.globalAlpha = 0.17 + 0.05 * Math.sin(t * 5.3) * Math.sin(t * 3.1); dot(g, 0, 36, 28, C.glow); g.globalAlpha = 1;
    wline(g, [[0, -90], [0, 21]], C.ink, 1.3, { amp: 0.2, step: 20 });
    shape(g, [[-7, 26], [0, 20], [7, 26]], { fill: C.brass, lw: 1.3, boil: true });
    shape(g, rrect(-8, 26, 16, 20, 3), { fill: C.glow, boil: true });
    wline(g, [[0, 27], [0, 45]], C.ink, 1.1); wline(g, [[-7, 36], [7, 36]], C.ink, 1.1);
    shape(g, rect(-6.5, 46, 13, 3.4), { fill: C.brass, lw: 1.2, boil: true }); g.restore();
    for (let i = 0; i < 3; i++) {
      const a = t * (0.5 + i * 0.13) + i * 2.1, fx = 140 + Math.cos(a) * (24 + i * 8), fy = 40 + Math.sin(a * 1.3) * (13 + i * 4), tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2);
      g.globalAlpha = 0.25 * tw; dot(g, fx, fy, 4.5, C.glow); g.globalAlpha = 0.5 + 0.5 * tw; dot(g, fx, fy, 1.5, C.ochre);
    }
    g.globalAlpha = 1;
    // 委託板上可以接的那一張：會飄、會發亮、蓋著紅色的封蠟
    const gl = state.glow, flut = Math.sin(t * 2.3) * 0.05 * gl, pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
    if (gl > 0.02) { g.globalAlpha = (0.2 + 0.14 * pulse) * gl; dot(g, PAPER.x, PAPER.y, 30, C.glow); g.globalAlpha = 1; }
    g.save(); g.translate(PAPER.x, PAPER.y - 19); g.rotate(-0.03 + flut); g.translate(0, 19);
    shape(g, rect(-15, -19, 30, 38), { fill: C.cream, boil: true, amp: 0.4 });
    for (let i = 0; i < 4; i++) wline(g, [[-10, -9 + i * 5], [10 - (i % 2) * 5, -9 + i * 5]], C.ink, 0.8, { amp: 0.2 });
    dot(g, 0, -17, 2, C.rust); dot(g, 8, 13, 4.2, C.rust); oval(g, 8, 13, 4.2, 4.2, { lw: 1, double: false });
    g.restore();
    if (gl > 0.02) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + (K.boil % 2) * 0.26; g.globalAlpha = gl; wline(g, [[PAPER.x + Math.cos(a) * 25, PAPER.y + Math.sin(a) * 27], [PAPER.x + Math.cos(a) * 30, PAPER.y + Math.sin(a) * 32]], C.ochre, 1.3, { amp: 0 }); }
    g.globalAlpha = 1;
  }

  function drawDeskLife(g, t) {
    drawCat(g, t, 38, 166);
    // 桌上的蠟燭
    const fl = 1 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.1;
    shape(g, rect(58.5, 176, 4.5, 11), { fill: C.cream, lw: 1.1, seed: 900 });
    g.globalAlpha = 0.2; dot(g, 60.7, 171, 9 * fl, C.glow); g.globalAlpha = 1;
    shape(g, [[60.7, 176], [58.4, 172.5], [60.7, 167 - fl * 1.5], [63, 172.5]], { fill: C.ochre, lw: 1, boil: true, step: 99, seed: 901 });
  }

  function drawFront(g, t) {
    K.seed = 5000;
    const big = (bx, by, len, rot, col, i) => {
      g.save(); g.translate(bx, by); g.rotate(rot + Math.sin(t * 0.8 + i * 1.3) * 0.035);
      wline(g, [[0, 0], [0, -len * 0.45]], C.green, 2.2, { seed: 5001 + i * 9 });
      shape(g, [[0, -len * 0.3], [len * 0.2, -len * 0.55], [len * 0.14, -len * 0.86], [0, -len], [-len * 0.14, -len * 0.86], [-len * 0.2, -len * 0.55]], { fill: col, seed: 5002 + i * 9, boil: true });
      wline(g, [[0, -len * 0.36], [0, -len * 0.92]], C.wall2, 1.1, { seed: 5003 + i * 9 });
      g.restore();
    };
    big(350, 296, 62, -0.5, C.green, 0); big(360, 300, 72, -0.12, C.green2, 1); big(370, 304, 56, 0.3, C.green, 2); big(340, 304, 42, -0.9, C.moss, 3);
    shape(g, [[336, 286], [386, 286], [380, 320], [342, 320]], { fill: C.pumpkin, seed: 5090 });
    // 飄在空氣裡的灰塵
    for (let i = 0; i < 7; i++) { const k = (t * 0.04 + i * 0.143) % 1; g.globalAlpha = Math.sin(k * Math.PI) * 0.6; dot(g, 30 + i * 46 + Math.sin(t * 0.5 + i * 2) * 8, 150 - k * 110, 1.1, C.cream); }
    g.globalAlpha = 1;
  }

  return {
    state, resize: base.resize,
    update(t) { T = t; K.boil = state.still ? 0 : Math.floor(t * 5) % 3; },
    render() {
      if (!base.img) return;
      const t = state.still ? 0 : T, g = ctx;
      base.begin(); base.paste('back'); base.world();
      K.seed = 50; drawWindowLife(g, t);
      drawWallLife(g, t);
      drawMo(g, t, { x: MO.x, y: MO.y, talking: state.talker === 'mo' });
      base.paste('mid'); base.world();
      drawDeskLife(g, t);
      drawCen(g, t, { x: CEN.x, y: CEN.y, talking: state.talker === 'cen', nod: 0 });
      drawFront(g, t);
      g.globalAlpha = 1; base.grain();
    },
    anchor(who) {
      const p = who === 'cen' ? [CEN.x - 1, CEN.y - 146] : who === 'mo' ? [MO.x, MO.y - 84] : who === 'board' ? [PAPER.x, PAPER.y - 30] : null;
      return p && base.css(p[0], p[1]);
    },
    clue() {}, ring() {}, jolt() {},
  };
}
