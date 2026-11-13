// 霧港的其他地方：魚市口的診間、檔案室旁的舊病室、船塢的工寮、坡上的靜室、燈塔的值夜房。
// 每個地方四樣東西：back 不會動的牆、地板和窗外的遠景；life 窗外會動的東西；hang 掛在繩子上的東西；front 最靠近鏡頭的東西。
// 床、桌子、吊燈、值班鐘，還有每個人站的位置，每個地方都一樣（在 ward.js）。所以換地方只換看到的東西，不影響怎麼操作。
import { C, K, TAU, hash, rect, rrect, ell, prep, trace, shape, oval, wline, dot, leaf, fillRect, star } from './sketch.js';

export const X0 = -220, X1 = 580, Y0 = -120, Y1 = 420;   // 背景畫到畫面外，窄或寬的螢幕都不會露白
export const FLOOR_Y = 186;

// ── 每個地方都會用到的小東西 ──
/** 右邊牆上的層架（上面放什麼，各個地方自己畫） */
export function shelf(g) {
  [[284, 93], [342, 93]].forEach(([x, y]) => shape(g, [[x, y], [x, y + 11], [x + 9, y]], { fill: C.wood2, lw: 1.2 }));
  shape(g, rect(274, 88, 82, 5), { fill: C.wood });
}
/** 掛值班鐘的架子 */
export const bellPost = (g) => { shape(g, rect(306, 12, 5, 12), { fill: C.wood2, lw: 1.2 }); wline(g, [[310, 15], [320, 15]], C.ink, 2); };
/** 掛公會旗子的桿子：公會的每一個診間都有 */
export const flagPole = (g) => { wline(g, [[110, 17], [132, 17]], C.wood2, 2.4); dot(g, 110, 17, 1.8, C.brass); dot(g, 132, 17, 1.8, C.brass); };
/** 橫過牆上的一條繩子 */
const rope = (g) => wline(g, [[138, 4], [168, 12], [206, 14], [246, 5]], C.wood2, 1.2);
/** 地板和牆的交界 */
const floorEdge = (g) => wline(g, [[X0, FLOOR_Y], [X1, FLOOR_Y]], C.ink, 1.5, { step: 14 });
/** 窗外的雲 */
function clouds(g, t, list) {
  list.forEach(([x0, y, rx, ry, sp], i) => {
    const x = 2 + ((x0 + t * sp) % 118);
    oval(g, x, y, rx, ry, { fill: C.cream, stroke: null, seed: 60 + i }); oval(g, x + rx * 0.5, y - ry * 0.6, rx * 0.55, ry * 0.9, { fill: C.cream, stroke: null, seed: 64 + i });
  });
}
/** 打在窗上的雨絲 */
export function rainFall(g, t) {
  for (let i = 0; i < 16; i++) {
    const k = (t * 1.6 + i * 0.137) % 1, x = 16 + ((i * 37) % 84) + k * 6, y = 18 + k * 88;
    wline(g, [[x, y], [x - 2, y + 7]], C.cream, 1, { amp: 0, seed: 90 + i });
  }
}
/** 一隻飛過去的海鷗 */
function gull(g, t, speed, y0) {
  const b = (t * speed) % 1;
  if (b >= 0.4) return;
  const x = 12 + (b / 0.4) * 94, y = y0 - Math.sin((b / 0.4) * Math.PI) * 9, up = Math.sin(t * 13) > 0;
  wline(g, [[x - 6, y + (up ? -3 : 2)], [x, y], [x + 6, y + (up ? -3 : 2)]], C.ink, 1.4, { amp: 0, seed: 82 });
}
/** 一片大葉子（前景的盆栽用） */
export function bigLeaf(g, t, bx, by, len, rot, col, i) {
  g.save(); g.translate(bx, by); g.rotate(rot + Math.sin(t * 0.8 + i * 1.3) * 0.035);
  wline(g, [[0, 0], [0, -len * 0.45]], C.green, 2.2, { seed: 5001 + i * 9 });
  shape(g, [[0, -len * 0.3], [len * 0.2, -len * 0.55], [len * 0.14, -len * 0.86], [0, -len], [-len * 0.14, -len * 0.86], [-len * 0.2, -len * 0.55]], { fill: col, seed: 5002 + i * 9, boil: true });
  wline(g, [[0, -len * 0.36], [0, -len * 0.92]], C.wall2, 1.1, { seed: 5003 + i * 9 });
  [0.5, 0.66, 0.8].forEach((k, j) => { wline(g, [[0, -len * k], [len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5004 + i * 9 + j }); wline(g, [[0, -len * k], [-len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5007 + i * 9 + j }); });
  g.restore();
}
const clipRect = (g, x, y, w, h) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); };
// 拱窗的外框和裡面那一格（舊病室和燈塔用）
const ARCH_OUT = [[11, 110], [11, 46], [18, 27], [34, 15], [58, 11], [82, 15], [98, 27], [105, 46], [105, 110]];
const ARCH_IN = [[19, 101], [19, 48], [25, 33], [38, 23], [58, 20], [78, 23], [91, 33], [97, 48], [97, 101]];
const clipArch = (g) => { g.save(); trace(g, prep(ARCH_IN, true, 7, 0, 1), true); g.clip(); };

// ════════ 魚市口的診間（第二章）════════
// 白灰牆、貼磁磚的牆腳、石板地。窗外就是魚市的棚子，攤子上的魚在冰上排成一排
function marketBack(g, rain) {
  K.seed = 1300;
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.plaster);
  for (let y = -104, row = 0; y < 130; y += 24, row++) for (let x = X0 + (row % 3) * 22; x < X1; x += 66) wline(g, [[x, y], [x + 14, y + 0.8], [x + 27, y - 0.4]], C.plaster2, 1.1);
  [[150, 44, 9, 5], [252, 114, 8, 4], [-60, 70, 10, 6], [430, 52, 9, 5], [118, 122, 6, 3]].forEach(([x, y, rx, ry]) => oval(g, x, y, rx, ry, { fill: C.plaster2, stroke: null, n: 9 }));
  // 牆腳的磁磚：每隔幾塊，有一塊畫了魚
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.tile);
  for (let y = 150; y < FLOOR_Y; y += 12) wline(g, [[X0, y], [X1, y]], C.tile2, 1, { step: 18 });
  for (let x = X0 + 4, i = 0; x < X1; x += 12, i++) wline(g, [[x, 139], [x + hash(i, 5) * 0.8, FLOOR_Y]], C.tile2, 0.9);
  for (let x = X0 + 22, i = 0; x < X1; x += 48, i++) { const y = 156 + (i % 2) * 12; leaf(g, x, y, 3.4, 1.6, 0, C.cream); shape(g, [[x + 3, y], [x + 5.8, y - 2.2], [x + 5.8, y + 2.2]], { fill: C.cream, stroke: null, step: 99 }); }
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.rust, lw: 1.2, step: 14 });
  // 石板地
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.stone);
  let prev = FLOOR_Y;
  [208, 234, 264, 300, 342, 392].forEach((y, i) => {
    wline(g, [[X0, y], [X1, y]], C.stone2, 1.3, { step: 16 });
    for (let x = X0 + ((i * 59) % 84); x < X1; x += 84) wline(g, [[x, prev], [x + 2, y]], C.stone2, 1.1);
    prev = y;
  });
  floorEdge(g);
  // 草編的墊子
  oval(g, 272, 264, 76, 19, { fill: C.sea2, n: 22 });
  oval(g, 272, 264, 63, 14, { stroke: C.cream, lw: 1.5, n: 22, double: false }); oval(g, 272, 264, 47, 9.5, { stroke: C.sea, lw: 1.4, n: 18, double: false });
  // 窗：外框、天、對街的房子
  shape(g, rrect(11, 13, 94, 97, 4), { fill: C.wood2 });
  shape(g, rect(19, 21, 78, 80), { fill: rain ? C.rainSky : C.sky, lw: 1.2 });
  clipRect(g, 19.5, 21.5, 77.5, 79.5);
  shape(g, rect(18, 60, 28, 32), { fill: C.plaster2, lw: 1 }); shape(g, [[15, 61], [32, 48], [49, 61]], { fill: C.rust, lw: 1.1 });
  shape(g, rect(52, 56, 30, 36), { fill: C.plaster, lw: 1 }); shape(g, [[48, 57], [67, 44], [86, 57]], { fill: C.slate2, lw: 1.1 });
  shape(g, rect(86, 64, 16, 28), { fill: C.plaster2, lw: 1 }); shape(g, [[82, 65], [94, 54], [106, 65]], { fill: C.pumpkin, lw: 1.1 });
  [[27, 68], [59, 64], [71, 64]].forEach(([x, y]) => shape(g, rect(x, y, 6, 8), { fill: C.coat2, lw: 0.9 }));
  g.restore();
  // 層架：疊起來的碗、一把秤、一瓶藥水
  shelf(g);
  [82, 77, 72].forEach((y, i) => shape(g, [[280 + i, y], [298 - i, y], [295 - i, y + 6], [283 + i, y + 6]], { fill: i === 1 ? C.tile : C.cream, lw: 1.1 }));
  wline(g, [[318, 66], [318, 88]], C.brass, 2); wline(g, [[306, 69], [330, 69]], C.brass, 1.8); dot(g, 318, 66, 1.8, C.brass);
  [306, 330].forEach((x) => { wline(g, [[x, 69], [x - 4, 79]], C.ink, 0.8); wline(g, [[x, 69], [x + 4, 79]], C.ink, 0.8); shape(g, [[x - 5, 79], [x + 5, 79], [x + 3, 82], [x - 3, 82]], { fill: C.brass, lw: 1 }); });
  shape(g, rrect(340, 74, 9, 14, 3), { fill: C.teal }); shape(g, rect(342.5, 69, 4, 5), { fill: C.wood, lw: 1.1 });
  bellPost(g); flagPole(g); rope(g);
}
function marketLife(g, t, o) {
  clipRect(g, 19.5, 21.5, 77.5, 79.5);
  // 從攤子後面走過去的人：只看得到斗笠和肩膀
  const k = (t * 0.05) % 1;
  if (k < 0.55) {
    const x = 6 + (k / 0.55) * 106, y = 78 - Math.abs(Math.sin(t * 5)) * 1.2;
    shape(g, rect(x - 7, y + 3, 14, 14), { fill: C.coat, lw: 1, seed: 66, step: 99 });
    dot(g, x, y, 4.4, C.skin2);
    shape(g, [[x - 9, y - 1.5], [x, y - 8.5], [x + 9, y - 1.5]], { fill: C.mustard, lw: 1.1, seed: 67, step: 99 });
  }
  // 攤子：檯面、冰上的魚
  shape(g, rect(15, 87, 88, 5), { fill: C.cream, lw: 1.1, seed: 68, step: 99 });
  fillRect(g, 15, 92, 88, 12, C.wood);
  [[29, 85, 0.1], [45, 84, -0.14], [61, 85, 0.06], [77, 84, -0.1], [91, 85, 0.12]].forEach(([x, y, r], i) => {
    leaf(g, x, y, 5.6, 2.2, r, i % 2 ? C.silver : C.iron); shape(g, [[x + 5, y + r * 4], [x + 8.6, y - 2.4], [x + 8.6, y + 3]], { fill: C.iron2, stroke: null, step: 99, seed: 69 }); dot(g, x - 3.2, y - 0.4, 0.8, C.ink);
  });
  // 棚子：紅白相間的布，下襬跟著風動
  for (let i = 0; i < 7; i++) {
    const x = 17 + i * 12, sw = Math.sin(t * 2.1 + i * 0.9) * 1.1;
    shape(g, [[x, 20], [x + 12, 20], [x + 12, 33], [x + 6, 37.5 + sw], [x, 33]], { fill: i % 2 ? C.cream : C.rust, lw: 1, seed: 20 + i, step: 99 });
  }
  if (o.rain) rainFall(g, t); else gull(g, t, 0.06, 46);
  g.restore();
  shape(g, rect(7, 101, 102, 7), { fill: C.wood, seed: 87 });
}
function marketHang(g, t) {
  // 繩子上曬著的：兩條魚乾、一串蒜頭
  [[156, 10, 0], [190, 14, 1], [224, 11, 2]].forEach(([x, y, i]) => {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.0 + i * 1.9) * 0.07);
    wline(g, [[0, 0], [0, 6]], C.wood2, 1.2, { amp: 0 });
    if (i === 1) [[0, 9], [-3, 14], [3, 15], [0, 20], [-2.5, 25]].forEach(([dx, dy]) => oval(g, dx, dy, 3.2, 3.6, { fill: C.cream, lw: 1, boil: true, n: 8 }));
    else {
      shape(g, [[0, 6], [4.6, 12], [3.6, 22], [0, 26], [-3.6, 22], [-4.6, 12]], { fill: i ? C.plank : C.mustard, lw: 1.1, boil: true });
      shape(g, [[0, 25], [4, 31], [-4, 31]], { fill: C.plank2, lw: 1, boil: true, step: 99 });
      dot(g, -1.2, 10.5, 0.9, C.ink); wline(g, [[-2.6, 15], [2.6, 15]], C.plank2, 0.9, { amp: 0 }); wline(g, [[-2.6, 19], [2.6, 19]], C.plank2, 0.9, { amp: 0 });
    }
    g.restore();
  });
}
function marketFront(g) {
  // 一簍剛送來的魚
  [[346, 282, -0.5], [360, 278, -0.15], [374, 281, 0.35]].forEach(([x, y, r], i) => {
    g.save(); g.translate(x, y); g.rotate(r);
    shape(g, ell(0, -7, 4.6, 11, 10), { fill: i === 1 ? C.silver : C.iron, lw: 1.2, seed: 5095 + i, step: 99 });
    shape(g, [[0, -17], [-4.4, -24], [4.4, -24]], { fill: C.iron2, lw: 1, seed: 5099 + i, step: 99 }); dot(g, -1.4, -1.5, 0.9, C.ink);
    g.restore();
  });
  shape(g, [[332, 280], [392, 280], [386, 318], [338, 318]], { fill: C.fur, seed: 5090 });
  [290, 300, 310].forEach((y, i) => wline(g, [[334 + i, y], [390 - i, y]], C.fur2, 1.2, { seed: 5091 + i }));
  // 水桶
  wline(g, [[-7, 287], [7, 272], [21, 287]], C.iron2, 1.8, { seed: 5107 });
  shape(g, [[-9, 286], [23, 286], [20, 318], [-6, 318]], { fill: C.plank, seed: 5104 });
  wline(g, [[-8, 294], [22, 294]], C.iron2, 2, { seed: 5105 }); wline(g, [[-7, 309], [21, 309]], C.iron2, 2, { seed: 5106 });
}

// ════════ 檔案室旁的舊病室（第三章）════════
// 牆上有淹水留下來的水痕，繩子上晾著一張一張的舊索引。窗外是公會的後院
function archiveBack(g, rain) {
  K.seed = 1500;
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.hallWall);
  for (let x = X0 + 8, i = 0; x < X1; x += 22, i++) {
    wline(g, [[x, Y0], [x + hash(i, 2), 132]], C.hallWall2, 1.2, { step: 22 });
    if (i % 2 === 0) for (let y = -100; y < 100; y += 34) dot(g, x + 11, y + (i % 4) * 8, 1.5, C.hallWall2);
  }
  // 水痕：一條彎彎的線，線底下的牆顏色深一點
  const mark = [];
  for (let x = X0; x <= X1; x += 20) mark.push([x, 110 + Math.sin(x * 0.05) * 3 + hash(x, 9) * 3]);
  g.save(); g.globalAlpha = 0.5; trace(g, [...mark, [X1, 136], [X0, 136]], true); g.fillStyle = C.stain; g.fill(); g.restore();
  wline(g, mark, C.cork, 1.3, { step: 12 });
  // 牆腳的木板
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.wood);
  for (let x = X0 + 6; x < X1; x += 34) shape(g, rect(x, 145, 26, 34), { stroke: C.wood2, lw: 1.1, double: false, step: 12 });
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.wood2, lw: 1.2, step: 14 });
  // 舊地板
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.floor2);
  let prev = FLOOR_Y;
  [200, 216, 236, 260, 290, 326, 370].forEach((y, i) => {
    wline(g, [[X0, y], [X1, y]], C.wood2, 1.1, { step: 16 });
    for (let x = X0 + ((i * 47) % 72); x < X1; x += 72) wline(g, [[x, prev], [x + 1, y]], C.wood2, 0.9);
    prev = y;
  });
  floorEdge(g);
  // 一條褪色的長地毯
  shape(g, rrect(198, 250, 148, 29, 5), { fill: C.coat });
  [256, 273].forEach((y) => wline(g, [[203, y], [341, y]], C.cream, 1.3));
  for (let x = 212; x < 340; x += 14) dot(g, x, 264.5, 1.6, C.ochre);
  // 拱窗：石頭的窗框、天、後院的牆和銀杏
  shape(g, ARCH_OUT, { fill: C.stone });
  [[14, 80], [14, 58], [20, 36], [36, 21], [80, 21], [96, 36], [102, 58], [102, 80]].forEach(([x, y], i) => wline(g, [[x - 2.5, y], [x + 2.5, y + (i < 4 ? -1 : 1)]], C.stone2, 1));
  shape(g, ARCH_IN, { fill: rain ? C.rainSky : C.sky, lw: 1.2 });
  clipArch(g);
  fillRect(g, 19, 74, 80, 30, C.plaster2);
  for (let x = 19; x < 98; x += 9) shape(g, [[x, 74], [x + 4.5, 70], [x + 9, 74]], { fill: C.slate2, lw: 0.9, step: 99 });
  wline(g, [[80, 102], [78, 72], [84, 54]], C.wood2, 3);
  [[84, 48, 15, 12, C.ochre], [72, 58, 10, 8, C.mustard], [93, 60, 9, 8, C.ochre], [80, 40, 9, 7, C.mustard]].forEach(([x, y, rx, ry, col]) => oval(g, x, y, rx, ry, { fill: col, lw: 1.1 }));
  shape(g, rect(30, 86, 18, 16), { fill: C.stone, lw: 1 }); wline(g, [[31, 86], [31, 76]], C.wood2, 1.6); wline(g, [[47, 86], [47, 76]], C.wood2, 1.6); shape(g, [[27, 77], [39, 70], [51, 77]], { fill: C.rust, lw: 1 });
  g.restore();
  // 層架：幾本豎著的帳冊、墨水瓶和筆
  shelf(g);
  [[280, 19, C.rust], [287.5, 22, C.coat], [295, 18, C.moss], [302.5, 21, C.teal], [310, 17, C.cloak]].forEach(([x, h, col]) => { shape(g, rect(x, 88 - h, 6.5, h), { fill: col, lw: 1.1 }); fillRect(g, x + 1.6, 88 - h + 3, 3.3, 4, C.cream); });
  shape(g, rect(320, 80, 15, 8), { fill: C.paper, lw: 1 }); shape(g, rect(322, 77, 15, 4), { fill: C.cream, lw: 1 });
  shape(g, rrect(340, 79, 9, 9, 2.5), { fill: C.coat2 }); wline(g, [[345, 79], [351, 64]], C.cream, 1.6); wline(g, [[345, 79], [351, 64]], C.ink, 0.6);
  bellPost(g); flagPole(g); rope(g);
}
function archiveLife(g, t, o) {
  clipArch(g);
  clouds(g, t, [[0, 34, 13, 4.5, 2.6], [58, 30, 9, 3.4, 1.7]]);
  if (o.rain) rainFall(g, t);
  else for (let i = 0; i < 4; i++) {
    // 銀杏的葉子
    const k = (t * 0.1 + i * 0.27) % 1, x = 62 + i * 9 + Math.sin(t * 1.3 + i * 2) * 5, y = 44 + k * 60;
    leaf(g, x, y, 2.4, 1.6, t * 1.5 + i, i % 2 ? C.ochre : C.mustard);
  }
  g.restore();
  wline(g, [[58, 20], [58, 101]], C.stone2, 2.8, { seed: 80, amp: 0.3 }); wline(g, [[19, 60], [97, 60]], C.stone2, 2.8, { seed: 81, amp: 0.3 });
  shape(g, rect(7, 101, 102, 7), { fill: C.stone, seed: 87 });
}
function archiveHang(g, t) {
  // 晾在繩子上的舊索引：一張一張，有幾張的墨暈開了
  [[150, 8.5], [170, 12.5], [190, 14], [210, 13.5], [230, 9.5]].forEach(([x, y], i) => {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.3 + i * 1.7) * 0.06);
    shape(g, rect(-6.5, 1, 13, 17), { fill: i % 2 ? C.paper : C.cream, lw: 1, boil: true });
    if (i % 2) { g.globalAlpha = 0.45; leaf(g, 1, 12, 4.2, 2.6, 0.3, C.fogLine); g.globalAlpha = 1; }
    [5, 8.5, 12].forEach((yy, j) => wline(g, [[-4, yy], [3.5 - ((i + j) % 2) * 2, yy]], C.ink, 0.7, { amp: 0 }));
    fillRect(g, -1.3, -1.5, 2.6, 5, C.wood2);
    g.restore();
  });
}
function archiveFront(g) {
  // 一疊搶救出來的帳冊
  [[336, 305, 56, C.coat], [341, 294, 48, C.rust], [337, 283, 53, C.moss], [343, 272, 43, C.teal]].forEach(([x, y, w, col], i) => {
    shape(g, rrect(x, y, w, 11, 2), { fill: col, seed: 5090 + i * 3 });
    fillRect(g, x + 4, y + 2.5, 3, 6, C.cream); wline(g, [[x + w - 5, y + 2], [x + w - 5, y + 9]], C.paper, 2.2, { seed: 5091 + i * 3 });
  });
  // 一箱捲起來的紙
  [[-3, 0.1], [7, -0.14], [15, 0.2]].forEach(([x, r], i) => {
    g.save(); g.translate(x, 292); g.rotate(r);
    shape(g, rect(-3.4, -20, 6.8, 22), { fill: C.paper, lw: 1.1, seed: 5112 + i }); wline(g, [[-3.4, -11], [3.4, -11]], C.rust, 1.5, { seed: 5116 + i });
    g.restore();
  });
  shape(g, rect(-11, 290, 33, 28), { fill: C.wood, seed: 5110 }); wline(g, [[-11, 301], [22, 301]], C.wood2, 1.2, { seed: 5111 });
}

// ════════ 船塢的工寮（第四章）════════
// 直的木板牆，牆腳刷了瀝青，地上是沙土和刨花。大門口看出去，船台上有一艘造到一半的船
function yardBack(g, rain) {
  K.seed = 1700;
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.shed);
  for (let x = X0 + 6, i = 0; x < X1; x += 18, i++) {
    wline(g, [[x, Y0], [x + hash(i, 4) * 1.2, 136]], C.shed2, 1.3, { step: 20 });
    if (i % 3 === 0) dot(g, x + 9, 34 + (i % 5) * 16, 1.8, C.shed2);
  }
  shape(g, rect(X0, -6, X1 - X0, 11), { fill: C.wood2, lw: 1.3, step: 16 });
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.tar);
  for (let x = X0 + 6, i = 0; x < X1; x += 18, i++) wline(g, [[x, 140], [x + hash(i, 6), FLOOR_Y]], C.tar2, 1.2);
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.wood2, lw: 1.2, step: 14 });
  // 地：壓實的沙土，散著刨花
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.sand);
  for (let i = 0; i < 60; i++) {
    const x = X0 + hash(i, 11) * (X1 - X0), y = FLOOR_Y + 8 + hash(i, 12) * (Y1 - FLOOR_Y - 12);
    if (i % 3) dot(g, x, y, 0.9 + hash(i, 13), C.sand2); else wline(g, [[x, y], [x + 3, y - 2], [x + 5, y + 0.5], [x + 3, y + 2]], C.cream, 1.2, { amp: 0.2 });
  }
  floorEdge(g);
  // 鋪在地上的三塊木板
  [[204, 250, 140], [210, 262, 132], [201, 274, 144]].forEach(([x, y, w], i) => { shape(g, rect(x, y, w, 10.5), { fill: C.plank, lw: 1.2 }); wline(g, [[x + 44 + i * 17, y + 1], [x + 44 + i * 17, y + 9.5]], C.plank2, 1); dot(g, x + 5, y + 5, 0.9, C.wood2); dot(g, x + w - 5, y + 5, 0.9, C.wood2); });
  // 大門口：外框、天、海、船台上的船
  shape(g, rrect(9, 11, 98, 101, 3), { fill: C.wood2 });
  shape(g, rect(17, 19, 82, 84), { fill: rain ? C.rainSky : C.sky, lw: 1.2 });
  clipRect(g, 17.5, 19.5, 81.5, 83.5);
  fillRect(g, 17, 70, 84, 12, C.sea); wline(g, [[17, 70], [99, 70]], C.sea2, 1.2, { step: 12 });
  fillRect(g, 17, 81, 84, 24, C.sand2);
  // 還沒釘外板的肋骨
  for (let x = 40; x < 100; x += 9) wline(g, [[x, 70], [x - 2.5, 48 + ((x * 7) % 5)]], C.wood2, 2);
  wline(g, [[27, 84], [21, 52]], C.wood2, 2.8);
  shape(g, [[26, 98], [23, 76], [30, 70], [46, 66], [100, 64], [100, 98]], { fill: C.plank, lw: 1.2 });
  wline(g, [[27, 82], [100, 79]], C.plank2, 1.1); wline(g, [[25, 90], [100, 88]], C.plank2, 1.1);
  for (let x = 38; x < 100; x += 13) wline(g, [[x, 67], [x - 1.5, 97]], C.plank2, 0.9);
  // 撐著船的木樁、鷹架
  [[34, 103, 40, 90], [60, 103, 62, 92], [88, 103, 84, 92]].forEach(([a, b, c, d]) => wline(g, [[a, b], [c, d]], C.wood2, 2.2));
  wline(g, [[22, 103], [22, 42]], C.wood, 2.2); wline(g, [[19, 58], [42, 58]], C.wood, 2);
  g.restore();
  // 掛在牆上的工具：鋸子、木槌、一捆纜繩
  dot(g, 150, 22, 1.8, C.wood2); dot(g, 196, 18, 1.8, C.wood2); dot(g, 230, 22, 1.8, C.wood2);
  shape(g, [[151, 29], [186, 31], [186, 35], [151, 41]], { fill: C.silver, lw: 1.1 });
  wline(g, [[153, 41], [156, 38.5], [159, 40.5], [162, 38], [165, 40], [168, 37.5], [171, 39.5], [174, 37], [177, 38.5], [180, 36.5], [184, 37.5]], C.ink, 0.9, { amp: 0 });
  shape(g, rrect(141, 25, 11, 20, 3), { fill: C.wood }); oval(g, 146.5, 35, 2.4, 4.5, { fill: C.shed, lw: 1, double: false });
  wline(g, [[196, 28], [196, 56]], C.wood2, 3); shape(g, rrect(187, 19, 18, 11, 2), { fill: C.wood });
  [12, 9, 6].forEach((r) => oval(g, 230, 38, r, r * 1.22, { stroke: C.mustard, lw: 2.2, n: 14, double: false }));
  // 層架：三罐漆、一把刷子
  shelf(g);
  [[281, C.rust], [297, C.teal], [313, C.cream]].forEach(([x, col], i) => { shape(g, rect(x, 74, 12, 14), { fill: C.iron, lw: 1.1 }); shape(g, [[x, 74], [x + 12, 74], [x + 12, 78], [x + 8, 77 + i], [x + 5, 80], [x, 77]], { fill: col, lw: 1 }); });
  wline(g, [[333, 86], [348, 72]], C.wood, 2.6); shape(g, rect(346, 66, 6, 8), { fill: C.fur2, lw: 1 });
  bellPost(g); flagPole(g);
}
function yardLife(g, t, o) {
  clipRect(g, 17.5, 19.5, 81.5, 83.5);
  clouds(g, t, [[0, 30, 14, 4.5, 2.4], [60, 40, 10, 3.6, 1.7]]);
  if (o.rain) rainFall(g, t);
  else {
    gull(g, t, 0.08, 40);
    // 有人在敲釘子：船身上偶爾閃一下
    const k = (t * 0.8) % 1;
    if (k < 0.1) shape(g, star(58 + (Math.floor(t * 0.8) % 3) * 11, 84, 3.4, t), { fill: C.glow, lw: 0.9, step: 99, amp: 0.2, seed: 83, double: false });
  }
  // 從門楣垂下來的滑車，慢慢地晃
  const sw = Math.sin(t * 0.9) * 3;
  wline(g, [[72, 19], [72 + sw, 38]], C.wood2, 1.4, { amp: 0, seed: 70 });
  shape(g, rrect(68 + sw, 38, 8, 10, 2), { fill: C.wood, lw: 1.1, seed: 71 });
  wline(g, [[72 + sw, 48], [72 + sw, 53], [75 + sw, 55], [76 + sw, 52]], C.ink, 1.5, { amp: 0, seed: 72 });
  g.restore();
  shape(g, rect(5, 103, 106, 7), { fill: C.wood, seed: 87 });
}
function yardFront(g) {
  // 鋸木架，上面一塊鋸到一半的板子
  wline(g, [[338, 318], [347, 286]], C.wood2, 4.6, { seed: 5090 }); wline(g, [[366, 318], [356, 286]], C.wood2, 4.6, { seed: 5091 });
  shape(g, rect(324, 277, 76, 9), { fill: C.plank, seed: 5092 }); wline(g, [[328, 281.5], [396, 281.5]], C.plank2, 1, { seed: 5093 });
  wline(g, [[352, 277], [352, 286]], C.ink, 1.2, { seed: 5094 });
  // 一桶瀝青和刷子
  wline(g, [[9, 288], [18, 262]], C.wood, 3.2, { seed: 5102 });
  shape(g, [[-10, 288], [22, 288], [19, 318], [-7, 318]], { fill: C.iron2, seed: 5100 });
  oval(g, 6, 288, 16, 4.2, { fill: C.tar2, seed: 5101 });
}

// ════════ 坡上的靜室（第五章）════════
// 門關得起來的一間。淺色的牆、草蓆、一面屏風。圓窗看下去是整個霧港，遠遠的是燈塔
function quietBack(g, rain) {
  K.seed = 1900;
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.mist);
  for (let y = -100, row = 0; y < 128; y += 30, row++) for (let x = X0 + (row % 2) * 30; x < X1; x += 60) wline(g, [[x, y], [x + 6, y - 3], [x + 12, y], [x + 18, y - 3], [x + 24, y]], C.mist2, 1.1, { amp: 0.2 });
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.paper);
  for (let x = X0 + 5; x < X1; x += 26) wline(g, [[x, 143], [x + hash(x, 3) * 1.2, FLOOR_Y]], C.paperLine, 1.1);
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.wood, lw: 1.2, step: 14 });
  // 草蓆
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.tatami);
  for (let y = FLOOR_Y + 6; y < Y1; y += 6) wline(g, [[X0, y], [X1, y]], C.tatami2, 0.6, { step: 40, amp: 0.2 });
  [224, 284, 356].forEach((y) => shape(g, rect(X0, y, X1 - X0, 4.5), { fill: C.green, lw: 1, step: 24 }));
  floorEdge(g);
  // 圓墊
  oval(g, 272, 262, 68, 16, { fill: C.rose, n: 22 }); oval(g, 272, 262, 55, 11.5, { stroke: C.cream, lw: 1.4, n: 22, double: false });
  // 屏風：三扇，畫著蘆葦。靠在牆邊，要看的時候拉過來
  [[196, 96], [218, 102], [240, 96]].forEach(([x, y], i) => {
    shape(g, rect(x, y, 22, 198 - y), { fill: C.cream, lw: 1.3 });
    shape(g, rect(x + 3, y + 4, 16, 190 - y), { stroke: C.wood, lw: 1, double: false, step: 14 });
    [[7, 0.05], [11, -0.08], [15, 0.1]].forEach(([dx, r], j) => { const top = y + 26 + ((i + j) % 3) * 12; wline(g, [[x + dx, 186], [x + dx + r * 40, top]], C.moss, 1.1); leaf(g, x + dx + r * 40, top - 3, 1.6, 4.5, r, C.fur2); });
  });
  // 圓窗：坡下的屋頂、海、遠遠的燈塔
  oval(g, 58, 60, 48, 48, { fill: C.wood2, n: 20 });
  oval(g, 58, 60, 40, 40, { fill: rain ? C.rainSky : C.sky, n: 20, lw: 1.2 });
  g.save(); g.beginPath(); g.arc(58, 60, 39.4, 0, TAU); g.clip();
  fillRect(g, 16, 62, 84, 16, C.sea); wline(g, [[16, 62], [100, 62]], C.sea2, 1.2, { step: 12 });
  shape(g, [[74, 62], [76, 44], [81, 44], [83, 62]], { fill: C.cream, lw: 1 }); shape(g, [[74.5, 44], [78.5, 38], [82.5, 44]], { fill: C.rust, lw: 0.9, step: 99 });
  [[22, 84, C.rust, 15], [44, 78, C.slate2, 14], [66, 86, C.pumpkin, 15], [88, 80, C.rust, 14]].forEach(([x, y, col, w]) => {
    shape(g, rect(x - w + 3, y + 5, w * 2 - 6, 30), { fill: C.plaster2, lw: 1 }); shape(g, [[x - w, y + 6], [x, y - 5], [x + w, y + 6]], { fill: col, lw: 1.1 });
  });
  g.restore();
  // 層架：茶壺、兩只杯子、插著一枝的瓶子
  shelf(g);
  shape(g, ell(288, 80, 9, 7.5, 12), { fill: C.rust, step: 99 }); wline(g, [[296, 78], [302, 74]], C.rust, 2.4); wline(g, [[281, 76], [276, 79], [281, 83]], C.ink, 1.3); shape(g, rect(285, 71, 6, 2.5), { fill: C.wood2, lw: 1 });
  [[308, 82], [320, 82]].forEach(([x, y]) => shape(g, [[x, y], [x + 8, y], [x + 7, y + 6], [x + 1, y + 6]], { fill: C.cream, lw: 1.1 }));
  shape(g, rrect(338, 72, 10, 16, 4), { fill: C.slate }); wline(g, [[343, 72], [340, 56], [346, 46]], C.wood2, 1.3); [[338, 58], [347, 50], [344, 44]].forEach(([x, y]) => dot(g, x, y, 2, C.rose));
  bellPost(g); flagPole(g); rope(g);
}
function quietLife(g, t, o) {
  g.save(); g.beginPath(); g.arc(58, 60, 39.4, 0, TAU); g.clip();
  // 遠遠的燈塔：一閃一閃
  const blink = 0.5 + 0.5 * Math.sin(t * 1.7);
  g.globalAlpha = 0.25 + blink * 0.4; dot(g, 78.5, 47, 5.5, C.glow); g.globalAlpha = 1; dot(g, 78.5, 47, 1.6, C.ochre);
  // 貼著海面的霧
  [[0, 66, 16, 4.5, 1.6], [50, 70, 13, 4, 1.1], [92, 64, 12, 3.6, 2.0]].forEach(([x0, y, rx, ry, sp], i) => {
    g.globalAlpha = 0.8; oval(g, ((x0 + t * sp) % 124) - 4, y, rx, ry, { fill: C.fog, stroke: null, seed: 60 + i });
  });
  g.globalAlpha = 1;
  if (o.rain) rainFall(g, t); else gull(g, t, 0.05, 40);
  g.restore();
  // 窗格：一橫一直，很細
  wline(g, [[58, 20], [58, 100]], C.wood2, 2, { seed: 80, amp: 0.3 }); wline(g, [[18, 60], [98, 60]], C.wood2, 2, { seed: 81, amp: 0.3 });
  shape(g, rect(13, 104, 90, 6), { fill: C.wood, seed: 87 });
}
function quietHang(g, t) {
  // 三串紙鶴
  [[156, 10, C.cream, 0], [190, 14, C.rose, 1], [224, 11, C.sky, 2]].forEach(([x, y, col, i]) => {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.9 + i * 1.9) * 0.08);
    wline(g, [[0, 0], [0, 25]], C.wood2, 0.9, { amp: 0 });
    [9, 20].forEach((yy, j) => shape(g, [[-6.5, yy - 2], [0, yy], [6.5, yy - 3.4], [1.4, yy + 3.6], [-2, yy + 3]], { fill: j ? col : C.paper, lw: 0.9, boil: true, step: 99 }));
    g.restore();
  });
}
function quietFront(g, t) {
  // 一張矮几，香爐裡一縷煙
  shape(g, rect(338, 300, 5, 18), { fill: C.wood2, lw: 1.2, seed: 5093 }); shape(g, rect(382, 300, 5, 18), { fill: C.wood2, lw: 1.2, seed: 5094 });
  shape(g, rrect(330, 293, 66, 8, 2), { fill: C.wood, seed: 5090 });
  shape(g, [[350, 293], [372, 293], [369, 283], [353, 283]], { fill: C.slate2, seed: 5091 }); wline(g, [[352, 284], [370, 284]], C.brass, 1.6, { seed: 5092 });
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.22 + i / 2) % 1, y = 281 - k * 34;
    g.globalAlpha = Math.sin(k * Math.PI) * 0.7;
    wline(g, [[361 + Math.sin(k * 6 + i) * 3, y], [361 + Math.sin(k * 6 + i + 1.4) * 3, y - 6], [361 + Math.sin(k * 6 + i + 2.8) * 3, y - 12]], C.cream, 1.5, { amp: 0, seed: 5095 + i });
  }
  g.globalAlpha = 1;
  // 一盆蘭草
  bigLeaf(g, t, 4, 306, 54, 0.32, C.green2, 4); bigLeaf(g, t, -2, 300, 62, 0.02, C.moss, 5); bigLeaf(g, t, 10, 308, 40, 0.7, C.green, 6);
  shape(g, [[-12, 298], [22, 298], [18, 318], [-8, 318]], { fill: C.slate, seed: 5098 });
}

// ════════ 燈塔的值夜房（終章）════════
// 燈室底下的一間圓房間：很厚的石牆、很深的拱窗、一座鐵爐、架上一排值夜日誌。夜裡。
function towerBack(g) {
  K.seed = 2100;
  // 圓的石牆：每一層石頭在中間高一點、往兩邊低下去
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.night);
  const bow = (x) => ((x - 180) * (x - 180)) / 5200;
  for (let y = -112, row = 0; y < 190; y += 22, row++) {
    const pts = [];
    for (let x = X0; x <= X1; x += 40) pts.push([x, y + bow(x)]);
    wline(g, pts, C.night2, 1.3, { step: 18 });
    for (let x = X0 + (row % 2) * 24; x < X1; x += 48) wline(g, [[x, y + bow(x)], [x + hash(x, row), y + 22 + bow(x)]], C.night2, 1.1);
  }
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.nightFloor);
  let prev = FLOOR_Y;
  [206, 230, 258, 290, 326, 366].forEach((y, i) => {
    wline(g, [[X0, y], [X1, y]], C.nightFloor2, 1.3, { step: 16 });
    for (let x = X0 + ((i * 71) % 120); x < X1; x += 120) wline(g, [[x, prev], [x + 1, y]], C.nightFloor2, 1);
    prev = y;
  });
  floorEdge(g);
  oval(g, 272, 264, 74, 18, { fill: C.coat2, n: 22 }); oval(g, 272, 264, 60, 13, { stroke: C.slate, lw: 1.5, n: 22, double: false });
  // 很深的拱窗：窗框、夜空、海
  shape(g, ARCH_OUT, { fill: C.night2 });
  shape(g, ARCH_IN, { fill: C.nightSky, lw: 1.2 });
  clipArch(g);
  fillRect(g, 19, 76, 80, 28, C.nightSea); wline(g, [[19, 76], [98, 76]], C.night2, 1.1, { step: 12 });
  g.restore();
  // 牆上的掛鉤：一件油布雨衣、一捆繩子
  dot(g, 150, 22, 1.8, C.nightFloor2); dot(g, 228, 20, 1.8, C.nightFloor2);
  shape(g, [[142, 26], [158, 26], [164, 62], [150, 66], [137, 62]], { fill: C.mustard, lw: 1.2 }); wline(g, [[150, 28], [150, 64]], C.amber2, 1.1);
  [11, 8, 5].forEach((r) => oval(g, 228, 36, r, r * 1.22, { stroke: C.stone, lw: 2.2, n: 14, double: false }));
  // 層架：十五本值夜日誌，一年一本，還有一只油壺
  shelf(g);
  for (let i = 0; i < 15; i++) { const x = 277 + i * 4, h = 15 + ((i * 5) % 4); shape(g, rect(x, 88 - h, 4, h), { fill: i % 2 ? C.coat : C.coat2, lw: 0.9, step: 99 }); fillRect(g, x + 1.1, 88 - h + 3, 1.8, 2.4, C.ochre); }
  shape(g, [[340, 88], [351, 88], [349, 77], [342, 77]], { fill: C.brass, lw: 1.1 }); wline(g, [[349, 79], [355, 73]], C.brass, 2);
  // 往燈室的梯子（房間比較寬的時候才看得到）
  wline(g, [[416, 186], [436, -40]], C.nightFloor2, 3.4, { step: 20 }); wline(g, [[440, 186], [460, -40]], C.nightFloor2, 3.4, { step: 20 });
  for (let y = 170; y > -40; y -= 18) wline(g, [[417.5 + (186 - y) * 0.088, y], [441.5 + (186 - y) * 0.088, y]], C.nightFloor2, 2.6);
  // 霧鐘的架子
  shape(g, rect(306, 4, 5, 20), { fill: C.nightFloor2, lw: 1.2 }); wline(g, [[310, 15], [320, 15]], C.ink, 2);
}
function towerLife(g, t, o) {
  const beam = o.state.beamShown || 0;
  clipArch(g);
  // 星星：燈亮了，霧薄了才看得到
  [[30, 34], [44, 28], [70, 32], [84, 44], [26, 56]].forEach(([x, y], i) => { g.globalAlpha = beam * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)); dot(g, x, y, 1.1, C.cream); });
  // 燈塔的光：一道一道掃過海面
  if (beam > 0.02) {
    const k = (t * 0.28 + 0.42) % 1, x = -30 + k * 170;
    g.globalAlpha = beam * 0.34 * Math.sin(k * Math.PI);
    g.beginPath(); g.moveTo(x - 6, 18); g.lineTo(x + 14, 18); g.lineTo(x + 50, 104); g.lineTo(x + 6, 104); g.closePath(); g.fillStyle = C.glow; g.fill();
  }
  // 霧：燈熄著的時候，整個窗外都是
  [[0, 44, 22, 9, 1.2], [60, 60, 26, 10, 0.8], [30, 78, 24, 8, 1.6], [96, 36, 18, 8, 1.0], [10, 92, 24, 8, 0.7]].forEach(([x0, y, rx, ry, sp], i) => {
    g.globalAlpha = (i < 2 ? 0.75 - beam * 0.6 : 0.8 - beam * 0.25);
    oval(g, ((x0 + t * sp) % 130) - 8, y, rx, ry, { fill: C.fog, stroke: null, seed: 60 + i });
  });
  g.globalAlpha = 1;
  g.restore();
  wline(g, [[58, 20], [58, 101]], C.night2, 2.8, { seed: 80, amp: 0.3 }); wline(g, [[19, 62], [97, 62]], C.night2, 2.8, { seed: 81, amp: 0.3 });
  shape(g, rect(7, 101, 102, 7), { fill: C.night2, seed: 87 });
}
function towerFront(g, t) {
  // 鐵爐：爐門裡的火一明一滅
  const fl = 0.5 + 0.5 * Math.sin(t * 5.1) * Math.sin(t * 2.3);
  shape(g, rect(374, 96, 12, 142), { fill: C.iron2, seed: 5093, step: 16 });
  shape(g, rrect(352, 236, 56, 84, 5), { fill: C.iron2, seed: 5090 });
  g.globalAlpha = 0.16 + fl * 0.1; dot(g, 380, 264, 36, C.glow); g.globalAlpha = 1;
  shape(g, rrect(364, 252, 32, 22, 3), { fill: C.pumpkin, seed: 5091 });
  shape(g, [[371, 274], [375, 262 - fl * 3], [380, 269], [385, 259 - fl * 4], [389, 274]], { fill: C.glow, lw: 1, seed: 5092, boil: true, step: 99 });
  [372, 380, 388].forEach((x, i) => wline(g, [[x, 253], [x, 273]], C.ink, 1.3, { seed: 5094 + i, amp: 0.2 }));
  shape(g, rect(350, 232, 60, 6), { fill: C.iron, seed: 5097, step: 16 });
  // 一只油桶
  shape(g, rrect(-9, 290, 30, 28, 3), { fill: C.brass, seed: 5100 }); wline(g, [[-8, 300], [20, 300]], C.amber2, 1.4, { seed: 5101 });
  wline(g, [[18, 292], [27, 284]], C.brass, 3, { seed: 5102 }); wline(g, [[0, 290], [6, 283], [12, 290]], C.ink, 1.6, { seed: 5103 });
}

/** 一個地方：back(g, rain)、life(g, t, { rain, state })、hang(g, t)、front(g, t)。沒寫的就是不畫 */
export const ROOMS = {
  market: { back: marketBack, life: marketLife, hang: marketHang, front: marketFront },
  archive: { back: archiveBack, life: archiveLife, hang: archiveHang, front: archiveFront },
  yard: { back: yardBack, life: yardLife, front: yardFront },
  quiet: { back: quietBack, life: quietLife, hang: quietHang, front: quietFront },
  tower: { back: towerBack, life: towerLife, front: towerFront },
};
