// 會在不只一個場景出現的角色。全部是為這個專案設計的原創角色。
import { C, K, TAU, clamp, ell, rect, rrect, shape, oval, wline, limb, dot, leaf } from './sketch.js';

// 眼睛：白色的圓，裡面一顆瞳孔。閉眼時畫一條彎線，痛的時候畫「＞」
export function eye(g, x, y, r, look, mode, dir = 1) {
  if (mode === 'blink') { wline(g, [[x - r * 0.9, y], [x, y + r * 0.45], [x + r * 0.9, y]], C.ink, 1.4, { amp: 0.1 }); return; }
  if (mode === 'wince') { wline(g, [[x - dir * r * 0.8, y - r * 0.7], [x + dir * r * 0.5, y], [x - dir * r * 0.8, y + r * 0.7]], C.ink, 1.5, { amp: 0.1 }); return; }
  oval(g, x, y, r, r, { fill: '#fbf7ea', lw: 1.2, n: 10, boil: true });
  dot(g, x + look[0], y + look[1], r * 0.42, C.ink);
}

export function drawCat(g, t, x, y) {
  K.seed = 600;
  g.save(); g.translate(x, y);
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

/** 岑禾，資深專科護理師。o：{ x, y, talking, nod, scale } */
export function drawCen(g, t, o) {
  K.seed = o.seed || 4000;
  const talking = !!o.talking, blink = (t * 0.9 + 2.1) % 4.1 < 0.13, nod = Math.sin(clamp(o.nod || 0) * Math.PI), big = o.scale || 1.14;
  const sway = Math.sin(t * 1.2) * 1.4, bob = Math.sin(t * 1.9) * 0.5;
  g.save(); g.translate(o.x, o.y); g.scale(big, big);
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


/** 沈渡，值班醫師。o：{ x, y, talking, walk, scale } */
export function drawShen(g, t, o) {
  K.seed = o.seed || 4500;
  const talking = !!o.talking, blink = (t * 0.9 + 0.7) % 3.9 < 0.13, big = o.scale || 1.2;
  const step = Math.sin(t * 10) * (o.walk || 0), hand = talking ? Math.sin(t * 6) * 2 : 0;
  g.save(); g.translate(o.x, o.y - Math.abs(step) * 1.5); g.scale(big, big);
  oval(g, 0, 1, 22, 4.5, { fill: C.shadow, stroke: null });
  limb(g, [[-6, -20], [-6 - step * 3, -4]], 6.5, C.trouser, { amp: 0.2 }); limb(g, [[6, -20], [6 + step * 3, -4]], 6.5, C.trouser, { amp: 0.2 });
  shape(g, ell(-8 - step * 3, -1.5, 7.5, 4.4, 10), { fill: C.boot, boil: true, step: 99 }); shape(g, ell(5 + step * 3, -1.5, 7.5, 4.4, 10), { fill: C.boot, boil: true, step: 99 });
  // 後面那隻手提著出診包
  limb(g, [[12, -76], [17, -58], [16, -42]], 7, C.shen2, { boil: true });
  wline(g, [[11, -40], [13, -45], [20, -45], [22, -40]], C.ink, 1.8, { boil: true });
  shape(g, rrect(8, -41, 17, 13, 3), { fill: C.rust, boil: true }); shape(g, rect(14.5, -37, 4, 3.4), { fill: C.cream, lw: 1 });
  // 長外套
  shape(g, [[-12, -80], [-16, -56], [-20, -16], [-6, -13], [6, -14], [20, -16], [16, -56], [12, -80], [0, -84]], { fill: C.shen, boil: true });
  wline(g, [[-2, -74], [-3, -15]], C.ink, 1.2, { boil: true });
  [[-7, -60], [-7.5, -48], [-8, -36]].forEach(([x, y]) => dot(g, x, y, 1.5, C.wood2));
  shape(g, [[-11, -81], [-3, -64], [0, -77]], { fill: C.shen2, lw: 1.1, boil: true }); shape(g, [[11, -81], [3, -64], [0, -77]], { fill: C.shen2, lw: 1.1, boil: true });
  // 聽診器
  wline(g, [[-8, -80], [-10, -66], [-5, -58]], C.ink, 1.7, { boil: true }); dot(g, -5, -56.4, 2.8, C.brass); oval(g, -5, -56.4, 2.8, 2.8, { lw: 1, double: false });
  // 前面那隻手，說話的時候會比劃
  limb(g, [[-11, -76], [-18, -60], [-15 + hand, -45 - hand]], 7, C.shen, { boil: true });
  oval(g, -15 + hand, -43 - hand, 3.6, 3.3, { fill: C.skin2, lw: 1.2, boil: true });
  shape(g, [[-10.5, -87], [10.5, -87], [11.5, -80], [0, -78], [-11.5, -80]], { fill: C.teal, boil: true });
  // 頭
  g.save(); g.translate(-1, -102); g.rotate(-0.03 + (talking ? Math.sin(t * 8) * 0.025 : 0));
  oval(g, 17, 2, 3.6, 4.6, { fill: C.skin2, lw: 1.2, boil: true });
  shape(g, ell(0, 0, 18.5, 18.5, 14), { fill: C.skin2, boil: true, step: 99 });
  shape(g, [[-18, -2], [-18, -12], [-11, -19], [0, -21.5], [11, -19], [18, -11], [19, 3], [15, -5], [9, -11], [-2, -12.5], [-10, -10], [-15, -4]], { fill: C.hairShen, boil: true });
  wline(g, [[6, -17], [11, -13]], C.cream, 1); wline(g, [[12, -14], [15, -9]], C.cream, 1);
  // 鬍子
  shape(g, [[-15.5, 5], [-13, 13], [-5, 18.5], [4, 17.5], [10, 11], [4, 12], [-4, 13.5], [-11, 8]], { fill: C.hairShen, lw: 1.2, boil: true });
  const look = talking ? [0, 0.4] : [-1.1, 0.7], mode = blink ? 'blink' : 'open';
  eye(g, -11, -1.5, 3.5, look, mode); eye(g, 0, -1.5, 3.8, look, mode);
  // 圓眼鏡
  oval(g, -11, -1.5, 5.6, 5.4, { lw: 1.2, double: false, n: 10 }); oval(g, 0, -1.5, 6, 5.6, { lw: 1.2, double: false, n: 10 });
  wline(g, [[-5.6, -2], [-5.8, -2]], C.ink, 1.2, { amp: 0 }); wline(g, [[6, -2], [15, -3.5]], C.ink, 1.2, { amp: 0.1 });
  wline(g, [[-14, -8.5], [-9, -9.5]], C.hairShen, 1.8, { amp: 0.1 }); wline(g, [[-2.5, -9.5], [3, -8.5]], C.hairShen, 1.8, { amp: 0.1 });
  wline(g, [[-6.5, 3], [-8.5, 6], [-6, 6.6]], C.ink, 1.2, { amp: 0.1, boil: true });
  const mo = talking ? Math.abs(Math.sin(t * 10)) * 2.2 : 0;
  if (mo > 0.4) { g.beginPath(); g.ellipse(-5.5, 11.5, 2.2, mo, 0, 0, TAU); g.fillStyle = '#5b2f28'; g.fill(); }
  else wline(g, [[-8, 11], [-3.5, 11.4]], C.ink, 1.2, { amp: 0.1 });
  g.restore();
  g.restore();
}

/** 眠墨，公會的檔案員。坐在櫃台後面，只看得到上半身。o：{ x, y, talking } */
export function drawMo(g, t, o) {
  K.seed = o.seed || 4800;
  const talking = !!o.talking, blink = (t * 0.9 + 3.1) % 4.6 < 0.13;
  const wx = talking ? 0 : Math.sin(t * 8) * 1.2, wy = talking ? 0 : Math.cos(t * 6.3) * 0.7;
  g.save(); g.translate(o.x, o.y + Math.sin(t * 1.7) * 0.5); g.scale(1.14, 1.14);
  // 連帽的短斗篷
  shape(g, [[-17, 2], [-18, -18], [-11, -30], [0, -33], [11, -30], [18, -18], [17, 2]], { fill: C.cloak, boil: true });
  wline(g, [[-1, -30], [0, 1]], C.cloak2, 1.6, { boil: true }); dot(g, 0, -24, 2, C.ochre);
  // 寫字的手和羽毛筆
  limb(g, [[13, -22], [20, -8], [12 + wx, -2 + wy]], 6.5, C.cloak, { boil: true });
  wline(g, [[11 + wx, -1 + wy], [19 + wx, -17 + wy]], C.ink, 2.6, { amp: 0 }); wline(g, [[11 + wx, -1 + wy], [19 + wx, -17 + wy]], C.cream, 1.3, { amp: 0 });
  leaf(g, 20.5 + wx, -20 + wy, 5.5, 2.2, -1.1, C.cream); wline(g, [[18, -15], [23, -25]].map(([x, y]) => [x + wx, y + wy]), C.ink, 0.9, { amp: 0 });
  oval(g, 12 + wx, -2.5 + wy, 3.4, 3.1, { fill: C.skin, lw: 1.2, boil: true });
  // 頭
  g.save(); g.translate(0, -46); g.rotate(0.05 + (talking ? Math.sin(t * 8) * 0.025 : Math.sin(t * 0.6) * 0.02));
  shape(g, ell(0, -1, 21, 21, 14), { fill: C.hairGrey, boil: true, step: 99 });
  shape(g, ell(0, 1.5, 18, 17.5, 14), { fill: C.skin, boil: true, step: 99 });
  shape(g, [[-18.5, -1], [-17, -13], [-8, -20], [3, -21], [13, -17], [19, -8], [19, 1], [13, -7], [4, -10.5], [-6, -9.5], [-13, -6]], { fill: C.hairGrey, boil: true });
  g.globalAlpha = 0.55; leaf(g, -10, 9, 3.8, 2.4, 0, C.blush); leaf(g, 10, 9, 3.8, 2.4, 0, C.blush); g.globalAlpha = 1;
  const look = talking ? [0, 0.3] : [0.9, 1.3], mode = blink ? 'blink' : 'open';
  eye(g, -6.5, 1, 3.6, look, mode); eye(g, 6.5, 1, 3.6, look, mode);
  // 大圓眼鏡
  oval(g, -6.5, 1, 6.2, 6, { lw: 1.3, double: false, n: 10 }); oval(g, 6.5, 1, 6.2, 6, { lw: 1.3, double: false, n: 10 });
  wline(g, [[-0.6, 0.5], [0.6, 0.5]], C.ink, 1.3, { amp: 0 });
  wline(g, [[-1, 7], [0, 8.6], [1.2, 7.2]], C.ink, 1.1, { amp: 0.1 });
  const mo = talking ? Math.abs(Math.sin(t * 10)) * 2.2 : 0;
  if (mo > 0.4) { g.beginPath(); g.ellipse(0, 12.5, 2.2, mo, 0, 0, TAU); g.fillStyle = '#5b2f28'; g.fill(); }
  else wline(g, [[-3, 12], [0, 13.2], [3, 12]], C.ink, 1.2, { amp: 0.1, boil: true });
  g.restore();
  g.restore();
}
