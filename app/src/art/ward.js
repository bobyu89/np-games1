// 病室：林秋的床、岑禾、症影「胸悶蛾」和霧。
// 不會動的背景只畫一次存起來，每一格直接貼上；會動的東西每一格重畫。
import { C, K, TAU, hash, clamp, smooth, ell, rect, rrect, prep, trace, shape, oval, wline, limb, dot, leaf, fillRect, star, createBase } from './sketch.js';
import { eye, drawCat, drawCen, drawShen, drawHero } from './cast.js';

const X0 = -220, X1 = 580, Y0 = -120, Y1 = 420;   // 背景畫到畫面外，窄或寬的螢幕都不會露白
const FLOOR_Y = 186;
const LIN = { x: 90, y: 219 }, CEN = { x: 298, y: 264 }, SHEN = { x: 322, y: 268 }, MOTH = { x: 178, y: 88 }, HERO = { x: 207, y: 297 };
const BIG = 1.14, MOTH_BIG = 1.28;   // 人物比家具大一點，表情在手機上才看得清楚

// ════════ 不會動的背景 ════════
function drawWardRoom(g, rain) {
  K.seed = 100;
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
  shape(g, rect(19, 21, 78, 80), { fill: rain ? C.rainSky : C.sky, lw: 1.2 });
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

}

// 碼頭的貨棧：木板牆、石頭牆腳、朝海的大窗口、堆在角落的貨箱。出診的時候在這裡
function drawDockRoom(g) {
  K.seed = 900;
  // 木板牆
  fillRect(g, X0, Y0, X1 - X0, FLOOR_Y - Y0, C.plank);
  for (let y = -112, row = 0; y < 138; y += 19, row++) {
    wline(g, [[X0, y], [X1, y]], C.plank2, 1.3, { step: 18 });
    for (let x = X0 + ((row * 67) % 110); x < X1; x += 110) { wline(g, [[x, y], [x + 0.6, y + 19]], C.plank2, 1); dot(g, x - 4, y + 5, 0.9, C.wood2); dot(g, x + 4, y + 5, 0.9, C.wood2); }
  }
  // 石頭牆腳
  fillRect(g, X0, 138, X1 - X0, FLOOR_Y - 138, C.stone);
  for (let y = 138, row = 0; y < FLOOR_Y; y += 16, row++) {
    wline(g, [[X0, y], [X1, y]], C.stone2, 1.2, { step: 16 });
    for (let x = X0 + (row % 2) * 19; x < X1; x += 38) wline(g, [[x, y], [x + hash(x, row) * 1.5, y + 16]], C.stone2, 1);
  }
  shape(g, rect(X0, 133, X1 - X0, 6), { fill: C.wood2, lw: 1.2, step: 14 });
  // 地板：寬木板
  fillRect(g, X0, FLOOR_Y, X1 - X0, Y1 - FLOOR_Y, C.plank);
  let prev = FLOOR_Y;
  [206, 230, 258, 290, 326, 366].forEach((y, i) => {
    wline(g, [[X0, y], [X1, y]], C.plank2, 1.3, { step: 16 });
    for (let x = X0 + ((i * 71) % 120); x < X1; x += 120) wline(g, [[x, prev], [x + 1, y]], C.plank2, 1);
    prev = y;
  });
  [[150, 268], [322, 240], [26, 292], [226, 300]].forEach(([x, y]) => oval(g, x, y, 3.4, 1.4, { stroke: C.plank2, lw: 1, double: false }));
  wline(g, [[X0, FLOOR_Y], [X1, FLOOR_Y]], C.ink, 1.5, { step: 14 });
  // 麻繩編的墊子
  oval(g, 272, 266, 74, 18, { fill: C.stone, n: 22 });
  oval(g, 272, 266, 62, 13.5, { stroke: C.stone2, lw: 1.6, n: 22, double: false }); oval(g, 272, 266, 46, 9, { stroke: C.stone2, lw: 1.4, n: 18, double: false });
  // 屋樑
  shape(g, rect(X0, -6, X1 - X0, 11), { fill: C.wood2, lw: 1.3, step: 16 });
  // 朝海的大窗口：外框、天、海
  shape(g, rrect(9, 11, 98, 101, 4), { fill: C.wood2 });
  shape(g, rect(17, 19, 82, 84), { fill: C.sky, lw: 1.2 });
  g.save(); g.beginPath(); g.rect(17.5, 19.5, 81.5, 83.5); g.clip();
  fillRect(g, 17, 74, 84, 30, C.sea);
  wline(g, [[17, 74], [99, 74]], C.sea2, 1.3, { step: 12 });
  g.restore();
  // 角落的貨箱和木桶
  const crate = (x, y, w, h, fill) => {
    shape(g, rect(x, y, w, h), { fill });
    wline(g, [[x + 4, y + 2], [x + 4, y + h - 2]], C.wood2, 1.2); wline(g, [[x + w - 4, y + 2], [x + w - 4, y + h - 2]], C.wood2, 1.2);
    wline(g, [[x + 4, y + 3], [x + w - 4, y + h - 3]], C.wood2, 1.1);
  };
  crate(318, 136, 46, 50, C.wood); crate(268, 150, 44, 36, C.plank2); crate(326, 100, 34, 36, C.plank2);
  shape(g, rect(276, 160, 12, 9), { fill: C.cream, lw: 1 }); wline(g, [[278, 163], [286, 163]], C.ink, 0.9); wline(g, [[278, 166], [284, 166]], C.ink, 0.9);
  // 掛在牆上的一捆纜繩
  dot(g, 232, 64, 2, C.wood2);
  [13, 10, 7].forEach((r) => oval(g, 232, 80, r, r * 1.25, { stroke: C.mustard, lw: 2.2, n: 14, double: false }));
  // 值班鐘的架子（岑禾把鐘帶來，掛在樑上）
  shape(g, rect(306, 4, 5, 20), { fill: C.wood2, lw: 1.2 }); wline(g, [[310, 15], [320, 15]], C.ink, 2);
  // 掛信號旗的繩子
  wline(g, [[112, 6], [150, 20], [196, 22], [246, 8]], C.wood2, 1.2);
}

function drawBack(g, who, scene) {
  if (scene === 'dock') drawDockRoom(g); else drawWardRoom(g, scene === 'ward-rain');
  K.seed = 180;
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

  if (who === 'zhou') {
    // 阮舟的東西：一根拐杖、一疊綁起來的帳冊、一只水手袋
    oval(g, 78, 282, 38, 3.6, { fill: C.shadow, stroke: null });
    wline(g, [[45, 282], [55, 232]], C.wood2, 3.4); wline(g, [[48, 232], [63, 231]], C.wood2, 4.6); wline(g, [[49, 256], [58, 255]], C.wood2, 2.6);
    [[66, 272, C.rust], [68, 265, C.teal], [67, 258, C.ochre]].forEach(([x, y, col], i) => { shape(g, rrect(x, y, 30 - i, 7.5, 1.5), { fill: col }); wline(g, [[x + 27 - i, y + 1.5], [x + 27 - i, y + 6]], C.cream, 1.6); });
    wline(g, [[81, 257], [81, 280]], C.cream, 1.6); wline(g, [[66, 268.5], [97, 268.5]], C.cream, 1.2);
    shape(g, ell(114, 271, 12, 10, 12), { fill: C.coat, step: 99 }); wline(g, [[106, 264], [114, 261], [122, 264]], C.cream, 1.4); dot(g, 114, 260, 1.8, C.brass);
  } else if (who === 'tong') {
    // 莫桐的東西：一根拐杖、一把填船縫的木槌、一捲麻絮
    oval(g, 74, 281, 34, 3.6, { fill: C.shadow, stroke: null });
    wline(g, [[45, 281], [52, 236]], C.wood2, 3.4); wline(g, [[52, 236], [57, 231], [63, 234]], C.wood2, 3.4);
    shape(g, rrect(66, 268, 24, 12, 3), { fill: C.wood });
    wline(g, [[70, 268.5], [70, 279.5]], C.wood2, 1.1); wline(g, [[86, 268.5], [86, 279.5]], C.wood2, 1.1);
    wline(g, [[90, 274], [112, 278]], C.wood2, 3.2);
    shape(g, ell(104, 266, 8, 5, 12, 0.1), { fill: C.cream, lw: 1.2, step: 99 }); wline(g, [[99, 265], [104, 263.5], [109, 266.5]], C.paperLine, 1.1); wline(g, [[100, 268], [105, 266.5], [109, 269]], C.paperLine, 1.1);
  } else if (who === 'jian') {
    // 簡晴的東西：一只綁著麻繩的木箱、一雙工作手套
    oval(g, 66, 282, 32, 3.6, { fill: C.shadow, stroke: null });
    shape(g, rect(42, 258, 40, 24), { fill: C.wood });
    wline(g, [[42, 266], [82, 266]], C.wood2, 1.2); wline(g, [[42, 274], [82, 274]], C.wood2, 1.2);
    wline(g, [[58, 257], [57, 283]], C.cream, 2.4); wline(g, [[68, 257], [69, 283]], C.cream, 2.4);
    shape(g, ell(98, 279, 8, 4, 10, 0.2), { fill: C.mustard, lw: 1.2, step: 99 }); shape(g, ell(108, 281, 7, 3.6, 10, -0.3), { fill: C.mustard, lw: 1.2, step: 99 });
  } else if (who !== 'lin') {
    drawProps(g, who);
  } else {
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
  }
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
  K.seed = 400;
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

// 每位病人的樣子。shirt、hair 是顏色；其他是畫不畫某個東西
//   woman 女性的瀏海和嘴、pony 馬尾、bob 齊耳短髮、bun 髮髻、moustache 鬍子、beard 落腮鬍、cap 船長帽、scarf 圍巾
//   calm 坐得穩（不痛得往前彎）、fast 呼吸又快又淺、sweat 幾滴冷汗、pale 臉色差、flush 發燒的潮紅
const PATIENTS = {
  lin: { shirt: C.shirt, shirt2: C.shirt2, hair: C.hairGrey, brow: C.hairGrey, moustache: true, sweat: 2 },
  jian: { shirt: C.pumpkin, shirt2: C.rust, hair: C.hairDark, brow: C.hairDark, woman: true, pony: true, calm: true },
  tong: { shirt: C.moss, shirt2: C.green2, hair: C.cream, brow: C.hairGrey, moustache: true, scarf: true, calm: true, pale: true },
  zhou: { shirt: C.sky, shirt2: C.wall2, hair: C.hairInk, brow: C.hairInk, woman: true, bob: true, fast: true },
  song: { shirt: C.coat, shirt2: C.coat2, hair: C.cream, brow: C.hairGrey, moustache: true, beard: true, cap: true, calm: true },
  zhang: { shirt: C.wood, shirt2: C.wood2, hair: C.hairGrey, brow: C.hairGrey, moustache: true, fast: true, sweat: 2 },
  ling: { shirt: C.amber, shirt2: C.amber2, hair: C.hairDark, brow: C.hairDark, woman: true, bun: true, sweat: 1 },
  tang: { shirt: C.paper, shirt2: C.paperLine, hair: C.hairInk, brow: C.hairInk, sweat: 1 },
  pu: { shirt: C.cloak, shirt2: C.cloak2, hair: C.hairDark, brow: C.hairDark, moustache: true, fast: true, flush: true, sweat: 1 },
  yang: { shirt: C.rose, shirt2: C.rose2, hair: C.hairBrown, brow: C.hairBrown, fast: true },
  chun: { shirt: C.rust, shirt2: C.wood2, hair: C.hairInk, brow: C.hairInk, moustache: true, beard: true, sweat: 2, pale: true },
  tao: { shirt: C.slate, shirt2: C.slate2, hair: C.hairGrey, brow: C.hairGrey, woman: true, bun: true, calm: true },
  // 第三章
  he: { shirt: C.sea, shirt2: C.sea2, hair: C.hairBrown, brow: C.hairBrown, woman: true, pony: true, flush: true, sweat: 1 },
  bai: { shirt: C.stone, shirt2: C.stone2, hair: C.cream, brow: C.hairGrey, moustache: true, fast: true, pale: true, sweat: 1 },
  yun: { shirt: C.frog, shirt2: C.frog2, hair: C.hairInk, brow: C.hairInk, woman: true, bob: true, calm: true },
  kui: { shirt: C.moss, shirt2: C.green2, hair: C.hairDark, brow: C.hairDark, woman: true, bun: true, pale: true, sweat: 2 },
  yu: { shirt: C.paper, shirt2: C.paperLine, hair: C.hairDark, brow: C.hairDark, moustache: true, scarf: true, pale: true },
  shan: { shirt: C.plank, shirt2: C.plank2, hair: C.hairBrown, brow: C.hairBrown, beard: true, calm: true, flush: true },
  feng: { shirt: C.slate, shirt2: C.slate2, hair: C.hairInk, brow: C.hairInk, fast: true, flush: true, sweat: 2 },
  lan: { shirt: C.rose, shirt2: C.rose2, hair: C.hairGrey, brow: C.hairGrey, woman: true, bob: true, calm: true, pale: true },
  // 第四章：背痛、腳痛、腫脹。從這裡開始，樣子的代號就是病例的代號
  c06a: { shirt: C.pumpkin, shirt2: C.rust, hair: C.hairDark, brow: C.hairDark, sweat: 1 },
  c06b: { shirt: C.paper, shirt2: C.paperLine, hair: C.hairInk, brow: C.hairInk, moustache: true, fast: true, sweat: 2 },
  c06c: { shirt: C.sea, shirt2: C.sea2, hair: C.hairBrown, brow: C.hairBrown, woman: true, bun: true, pale: true, sweat: 1 },
  c06d: { shirt: C.coat, shirt2: C.coat2, hair: C.cream, brow: C.hairGrey, moustache: true, beard: true, pale: true, fast: true, sweat: 2 },
  c07a: { shirt: C.rust, shirt2: C.wood2, hair: C.hairDark, brow: C.hairDark, moustache: true, calm: true, flush: true },
  c07b: { shirt: C.slate, shirt2: C.slate2, hair: C.cream, brow: C.hairGrey, cap: true, pale: true, fast: true, sweat: 1 },
  c07c: { shirt: C.stone, shirt2: C.stone2, hair: C.hairInk, brow: C.hairInk, fast: true, sweat: 2 },
  c07d: { shirt: C.moss, shirt2: C.green2, hair: C.hairGrey, brow: C.hairGrey, woman: true, bun: true, calm: true },
  c08a: { shirt: C.frog, shirt2: C.frog2, hair: C.hairDark, brow: C.hairDark, woman: true, pony: true, calm: true, pale: true },
  c08b: { shirt: C.wood, shirt2: C.wood2, hair: C.cream, brow: C.hairGrey, moustache: true, pale: true, fast: true, sweat: 2 },
  c08c: { shirt: C.amber, shirt2: C.amber2, hair: C.hairDark, brow: C.hairDark, woman: true, bun: true, calm: true },
  c08d: { shirt: C.sky, shirt2: C.wall2, hair: C.hairInk, brow: C.hairInk, woman: true, bob: true, calm: true },
  // 第五章：排泄物異常、皮膚疹子、體重減輕、感覺異常
  c09a: { shirt: C.plank, shirt2: C.plank2, hair: C.hairGrey, brow: C.hairGrey, moustache: true, pale: true, fast: true, sweat: 1 },
  c09b: { shirt: C.cloak, shirt2: C.cloak2, hair: C.hairDark, brow: C.hairDark, moustache: true, calm: true, pale: true },
  c09c: { shirt: C.teal, shirt2: C.teal2, hair: C.hairGrey, brow: C.hairGrey, beard: true, calm: true },
  c09d: { shirt: C.rose, shirt2: C.rose2, hair: C.cream, brow: C.hairGrey, woman: true, bun: true, calm: true },
  c10a: { shirt: C.sea, shirt2: C.sea2, hair: C.hairGrey, brow: C.hairGrey, woman: true, bun: true, calm: true },
  c10b: { shirt: C.pumpkin, shirt2: C.rust, hair: C.hairBrown, brow: C.hairBrown, woman: true, pony: true, fast: true, flush: true, sweat: 2 },
  c10c: { shirt: C.paper, shirt2: C.paperLine, hair: C.hairInk, brow: C.hairInk, woman: true, bob: true, calm: true, flush: true },
  c10d: { shirt: C.slate, shirt2: C.slate2, hair: C.hairDark, brow: C.hairDark, woman: true, pony: true, calm: true, pale: true },
  c11a: { shirt: C.amber, shirt2: C.amber2, hair: C.hairBrown, brow: C.hairBrown, woman: true, bob: true, fast: true, flush: true, sweat: 1 },
  c11b: { shirt: C.wood, shirt2: C.wood2, hair: C.hairGrey, brow: C.hairGrey, moustache: true, calm: true, pale: true },
  c11c: { shirt: C.sky, shirt2: C.wall2, hair: C.hairBrown, brow: C.hairBrown, calm: true, pale: true },
  c11d: { shirt: C.stone, shirt2: C.stone2, hair: C.cream, brow: C.hairGrey, beard: true, scarf: true, calm: true, pale: true },
  c12a: { shirt: C.moss, shirt2: C.green2, hair: C.hairDark, brow: C.hairDark, moustache: true, calm: true },
  c12b: { shirt: C.coat, shirt2: C.coat2, hair: C.hairGrey, brow: C.hairGrey, woman: true, bun: true, pale: true, sweat: 1 },
  c12c: { shirt: C.cloak, shirt2: C.cloak2, hair: C.hairGrey, brow: C.hairGrey, moustache: true, calm: true, pale: true },
  c12d: { shirt: C.rose, shirt2: C.rose2, hair: C.hairInk, brow: C.hairInk, woman: true, pony: true, fast: true, flush: true, sweat: 1 },
};

// 第四、五章的病人帶來的東西：每個人一大一小，從下面的零件裡挑。[大的, 顏色, 小的]
const KIT = {
  c06a: ['crate', C.wood, 'rope'], c06b: ['books', C.cloak, 'abacus'], c06c: ['cloth', C.cream, 'needle'], c06d: ['chest', C.wood, 'cane'],
  c07a: ['barrel', C.wood, 'cup'], c07b: ['bag', C.slate2, 'scroll'], c07c: ['chest', C.iron, 'hammer'], c07d: ['basket', C.sea, 'fish'],
  c08a: ['cloth', C.frog, 'bottle'], c08b: ['crate', C.plank, 'bell'], c08c: ['jar', C.wood2, 'bottle'], c08d: ['bag', C.mustard, 'scroll'],
  c09a: ['barrel', C.plank, 'hammer'], c09b: ['sack', C.mustard, 'bottle'], c09c: ['pot', C.rust, 'brush'], c09d: ['basket', C.cream, 'herbs'],
  c10a: ['basket', C.moss, 'teapot'], c10b: ['basket', C.sea, 'fish'], c10c: ['cloth', C.rose, 'spool'], c10d: ['chest', C.plank, 'herbs'],
  c11a: ['pot', C.slate, 'brush'], c11b: ['crate', C.wood, 'knife'], c11c: ['bag', C.wood, 'letter'], c11d: ['chest', C.wood2, 'cane'],
  c12a: ['sack', C.moss, 'teapot'], c12b: ['books', C.rust, 'abacus'], c12c: ['pot', C.iron, 'cup'], c12d: ['bag', C.rose2, 'fan'],
};

// 第二章四位病人帶來的東西
function drawProps(g, who) {
  oval(g, 72, 282, 34, 3.6, { fill: C.shadow, stroke: null });
  const basket = (x, y, fill) => {
    shape(g, [[x, y], [x + 40, y], [x + 36, y + 20], [x + 4, y + 20]], { fill });
    [5, 10, 15].forEach((d) => wline(g, [[x + 1 + d * 0.2, y + d], [x + 39 - d * 0.2, y + d]], C.wood2, 1));
    wline(g, [[x + 4, y], [x + 20, y - 12], [x + 36, y]], C.wood2, 2.2);
  };
  if (KIT[who]) {
    const [big, col, small] = KIT[who];
    if (big === 'crate') { shape(g, rect(44, 262, 40, 20), { fill: col }); [268, 275].forEach((y) => wline(g, [[44, y], [84, y]], C.wood2, 1.1)); [56, 72].forEach((x) => wline(g, [[x, 262], [x, 282]], C.wood2, 1.1)); }
    if (big === 'books') [[44, 276, 40, col], [47, 270, 36, C.rust], [45, 264, 38, C.moss]].forEach(([x, y, w, c]) => { shape(g, rrect(x, y, w, 6, 1.5), { fill: c, lw: 1.1 }); wline(g, [[x + 4, y + 3], [x + w - 4, y + 3]], C.cream, 1); });
    if (big === 'cloth') [[col, 0], [C.sea, 5], [col, 10], [C.ochre, 15]].forEach(([c, d]) => shape(g, rrect(44, 277 - d, 40, 5.4, 2), { fill: c, lw: 1.1 }));
    if (big === 'chest') { shape(g, rect(44, 264, 40, 18), { fill: col }); wline(g, [[44, 271], [84, 271]], C.wood2, 1.2); shape(g, rect(61, 268, 6, 5), { fill: C.brass, lw: 1 }); wline(g, [[52, 264], [56, 257], [72, 257], [76, 264]], C.wood2, 2.2); }
    if (big === 'barrel') { shape(g, [[48, 260], [80, 260], [84, 271], [80, 282], [48, 282], [44, 271]], { fill: col }); [265, 277].forEach((y) => wline(g, [[46, y], [82, y]], C.iron2, 1.8)); oval(g, 64, 260, 16, 2.6, { fill: C.wood2, lw: 1.1 }); }
    if (big === 'bag') { shape(g, [[46, 282], [44, 268], [52, 260], [76, 260], [84, 268], [82, 282]], { fill: col }); wline(g, [[52, 260], [58, 250], [70, 250], [76, 260]], C.wood2, 2); shape(g, rect(60, 266, 8, 6), { fill: C.brass, lw: 1 }); }
    if (big === 'basket') { basket(46, 262, C.mustard); shape(g, [[45, 263], [54, 257], [66, 259], [78, 256], [87, 263]], { fill: col, lw: 1.1 }); }
    if (big === 'jar') { shape(g, [[50, 258], [78, 258], [84, 268], [82, 282], [46, 282], [44, 268]], { fill: col }); shape(g, rect(54, 253, 20, 6), { fill: C.cream, lw: 1.1 }); wline(g, [[46, 270], [82, 270]], C.rust, 2); }
    if (big === 'sack') { shape(g, [[46, 282], [44, 268], [52, 259], [60, 262], [68, 258], [78, 262], [84, 270], [82, 282]], { fill: col }); wline(g, [[56, 262], [72, 262]], C.wood2, 2); }
    if (big === 'pot') { shape(g, [[44, 268], [84, 268], [80, 282], [48, 282]], { fill: col }); oval(g, 64, 268, 20, 3.4, { fill: C.iron2, lw: 1.2 }); wline(g, [[40, 271], [44, 271]], C.ink, 2.4); wline(g, [[84, 271], [88, 271]], C.ink, 2.4); }
    if (small === 'rope') [10, 7, 4].forEach((r, i) => oval(g, 108, 277, r, r * 0.55, { stroke: C.mustard, lw: 2.4, n: 12, double: false, seed: 970 + i }));
    if (small === 'abacus') { shape(g, rect(96, 270, 26, 12), { fill: C.wood, lw: 1.1 }); [274, 278].forEach((y) => { wline(g, [[98, y], [120, y]], C.ink, 0.8); [101, 106, 112, 117].forEach((x) => dot(g, x, y, 1.4, C.rust)); }); }
    if (small === 'needle') { wline(g, [[96, 282], [122, 266]], C.ink, 2); wline(g, [[96, 282], [122, 266]], C.brass, 0.9); wline(g, [[122, 266], [126, 258], [116, 262], [108, 270]], C.cream, 1.1); }
    if (small === 'cane') { wline(g, [[98, 283], [120, 250]], C.wood2, 2.6); wline(g, [[120, 250], [125, 248], [127, 253]], C.wood2, 2.6); }
    if (small === 'cup') { shape(g, [[100, 270], [116, 270], [114, 282], [102, 282]], { fill: C.teal }); wline(g, [[116, 273], [121, 275], [115, 279]], C.ink, 1.4); }
    if (small === 'scroll') { shape(g, rrect(96, 274, 26, 8, 3), { fill: C.cream, lw: 1.1 }); oval(g, 96, 278, 2.2, 4, { fill: C.paperLine, lw: 1 }); wline(g, [[104, 278], [118, 278]], C.rust, 1); }
    if (small === 'hammer') { wline(g, [[106, 276], [122, 284]], C.wood2, 2.6); shape(g, rrect(96, 267, 16, 9, 2), { fill: C.iron }); }
    if (small === 'fish') { shape(g, [[97, 278], [91, 273], [92, 283]], { fill: C.slate2, lw: 1.1 }); shape(g, ell(108, 277, 12, 4.6, 10, -0.12), { fill: C.slate, lw: 1.2, step: 99 }); dot(g, 116, 275.5, 0.9, C.ink); }
    if (small === 'bottle') { shape(g, [[102, 282], [101, 270], [105, 266], [105, 260], [111, 260], [111, 266], [115, 270], [114, 282]], { fill: C.moss }); shape(g, rect(104.5, 257, 7, 3.4), { fill: C.cork, lw: 1 }); }
    if (small === 'bell') { shape(g, [[100, 282], [103, 268], [108, 264], [113, 268], [116, 282]], { fill: C.brass }); dot(g, 108, 283, 1.8, C.ink); wline(g, [[108, 264], [108, 260]], C.ink, 1.6); }
    if (small === 'brush') { wline(g, [[96, 283], [118, 266]], C.wood2, 2.2); shape(g, [[116, 268], [122, 260], [125, 263], [120, 270]], { fill: C.rust, lw: 1.1 }); }
    if (small === 'herbs') { [[102, 0.5], [108, 0], [114, -0.5]].forEach(([x, r]) => { wline(g, [[108, 283], [x, 266]], C.green2, 1.2); leaf(g, x, 264, 4.5, 2.4, r, C.moss); }); wline(g, [[104, 278], [112, 278]], C.cream, 2); }
    if (small === 'teapot') { wline(g, [[117, 274], [123, 270]], C.ink, 2.2); wline(g, [[99, 272], [95, 275], [99, 279]], C.ink, 1.6); shape(g, ell(108, 275, 10, 7, 12), { fill: C.rose, lw: 1.2, step: 99 }); shape(g, rect(104, 266, 8, 3), { fill: C.rose2, lw: 1 }); }
    if (small === 'spool') { shape(g, rect(102, 268, 12, 14), { fill: C.rust, lw: 1.1 }); shape(g, rect(99, 265, 18, 3.4), { fill: C.wood, lw: 1 }); shape(g, rect(99, 281, 18, 3.4), { fill: C.wood, lw: 1 }); wline(g, [[114, 274], [124, 278]], C.rust, 1); }
    if (small === 'knife') { shape(g, [[98, 270], [118, 268], [120, 278], [100, 280]], { fill: C.iron }); wline(g, [[118, 273], [126, 272]], C.wood2, 3); }
    if (small === 'letter') [[100, 270, -0.15], [106, 273, 0.12]].forEach(([x, y, r]) => { g.save(); g.translate(x + 8, y + 5); g.rotate(r); shape(g, rect(-9, -6, 18, 12), { fill: C.cream, lw: 1.1 }); wline(g, [[-9, -6], [0, 1], [9, -6]], C.paperLine, 1); dot(g, 0, 1, 1.6, C.rust); g.restore(); });
    if (small === 'fan') { shape(g, [[108, 283], [94, 268], [100, 262], [108, 260], [116, 262], [122, 268]], { fill: C.rose, lw: 1.2 }); [[98, 265], [104, 261], [112, 261], [118, 265]].forEach(([x, y]) => wline(g, [[108, 283], [x, y]], C.rose2, 0.9)); }
  } else if (who === 'song') {          // 駱松：一支黃銅望遠鏡、一雙脫下來的靴子
    shape(g, rrect(44, 271, 22, 8, 2), { fill: C.brass }); shape(g, rrect(64, 269, 16, 12, 2), { fill: C.brass }); wline(g, [[58, 271.5], [58, 279]], C.ink, 1.1);
    shape(g, [[92, 262], [100, 262], [101, 276], [112, 279], [112, 283], [91, 283]], { fill: C.boot }); shape(g, [[108, 266], [115, 266], [116, 277], [124, 280], [124, 283], [107, 283]], { fill: C.boot });
  } else if (who === 'zhang') {   // 霍樟：一籃燻魚
    basket(46, 262, C.mustard);
    [[52, 258, 0.3], [64, 256, -0.2], [76, 259, 0.4]].forEach(([x, y, r]) => { leaf(g, x, y, 8, 3.2, r, C.rust); dot(g, x + 5, y - 0.5, 0.8, C.ink); });
  } else if (who === 'ling') {    // 方苓：蓋著布的菜籃、一支長筷子
    basket(46, 262, C.mustard);
    shape(g, [[45, 263], [52, 257], [66, 259], [80, 256], [87, 263]], { fill: C.cream }); wline(g, [[50, 261], [82, 260]], C.teal, 1.1);
    wline(g, [[96, 282], [118, 262]], C.wood2, 2); wline(g, [[100, 283], [122, 264]], C.wood2, 2);
  } else if (who === 'pu') {      // 柯蒲：拍賣用的小木槌和一疊號牌
    shape(g, rrect(46, 270, 20, 11, 3), { fill: C.wood }); wline(g, [[66, 275.5], [88, 279]], C.wood2, 3);
    [[96, 268, -0.2, C.cream], [102, 271, 0.1, C.paper], [108, 269, 0.3, C.cream]].forEach(([x, y, r, col]) => { g.save(); g.translate(x, y); g.rotate(r); shape(g, rect(-6, -8, 12, 16), { fill: col, lw: 1.1 }); wline(g, [[-3, -2], [3, -2]], C.ink, 1); g.restore(); });
  } else if (who === 'yang') {    // 岳楊：一捲索具和一根穿帆的大針
    [15, 11, 7].forEach((r, i) => oval(g, 62, 274, r, r * 0.55, { stroke: C.mustard, lw: 2.8, n: 14, double: false, seed: 930 + i }));
    wline(g, [[86, 281], [116, 266]], C.ink, 2.2); wline(g, [[86, 281], [116, 266]], C.brass, 1); wline(g, [[116, 266], [122, 258], [112, 262]], C.cream, 1.2);
  } else if (who === 'chun') {    // 龔椿：一只酒罈和一個倒著的杯子
    shape(g, [[48, 258], [70, 258], [78, 268], [76, 282], [44, 282], [41, 268]], { fill: C.wood2 }); shape(g, rect(51, 253, 16, 6), { fill: C.cream, lw: 1.1 }); wline(g, [[45, 270], [77, 270]], C.rust, 2.4);
    shape(g, [[94, 276], [108, 273], [110, 281], [96, 284]], { fill: C.cream }); oval(g, 102, 284, 9, 1.6, { fill: C.shadow, stroke: null });
  } else if (who === 'tao') {     // 鄔桃：一籃麵包
    basket(46, 262, C.mustard);
    [[54, 258, 0.2], [66, 255, -0.1], [78, 258, 0.3]].forEach(([x, y, r]) => { shape(g, ell(x, y, 8, 5, 10, r), { fill: C.ochre, lw: 1.2, step: 99 }); wline(g, [[x - 3, y - 2], [x - 1, y + 1]], C.wood2, 1); wline(g, [[x + 1, y - 2], [x + 3, y + 1]], C.wood2, 1); });
  } else if (who === 'he') {      // 溫荷：一堆補到一半的漁網和一支梭子
    shape(g, [[42, 282], [46, 266], [60, 259], [78, 262], [88, 272], [86, 282]], { fill: C.sea });
    [[48, 268, 84, 280], [56, 262, 86, 274], [44, 276, 70, 282], [62, 260, 50, 282], [74, 262, 62, 282], [84, 268, 76, 282]].forEach(([a, b, c2, d]) => wline(g, [[a, b], [c2, d]], C.sea2, 1));
    shape(g, [[98, 278], [106, 274], [122, 276], [114, 281]], { fill: C.wood }); wline(g, [[103, 277], [117, 278]], C.cream, 1.4);
  } else if (who === 'bai') {     // 涂柏：一頂斗笠和一小盒魚鉤
    shape(g, [[40, 281], [64, 258], [90, 281]], { fill: C.ochre }); oval(g, 65, 281, 26, 3.4, { fill: C.mustard, lw: 1.2 });
    [[52, 270, 78, 270], [46, 276, 84, 276]].forEach(([a, b, c2, d]) => wline(g, [[a, b], [c2, d]], C.wood2, 1));
    shape(g, rect(100, 272, 20, 10), { fill: C.wood }); wline(g, [[100, 276], [120, 276]], C.wood2, 1.1);
    [[105, 270], [111, 269], [116, 270]].forEach(([x, y]) => wline(g, [[x, y + 2], [x, y - 3], [x + 2.5, y - 4.5], [x + 3.5, y - 2]], C.ink, 1.2));
  } else if (who === 'yun') {     // 喬芸：一本攤開的帳冊、一支筆和一只茶杯
    shape(g, [[42, 278], [62, 273], [64, 281], [44, 285]], { fill: C.paper }); shape(g, [[62, 273], [84, 277], [84, 285], [64, 281]], { fill: C.cream });
    [[47, 279.5, 59, 277], [48, 282, 60, 279.5], [67, 278, 80, 280.5], [67, 280.5, 80, 283]].forEach(([a, b, c2, d]) => wline(g, [[a, b], [c2, d]], C.paperLine, 1));
    wline(g, [[72, 270], [90, 262]], C.ink, 1.8); wline(g, [[90, 262], [94, 260]], C.cream, 2.4);
    shape(g, [[102, 270], [118, 270], [116, 282], [104, 282]], { fill: C.teal }); wline(g, [[118, 273], [123, 275], [117, 279]], C.ink, 1.5);
  } else if (who === 'kui') {     // 魏葵：一只魚箱和一桿秤
    shape(g, rect(42, 264, 44, 18), { fill: C.plank }); [270, 276].forEach((y) => wline(g, [[42, y], [86, y]], C.plank2, 1.2));
    [[50, 261, 0.2], [64, 259, -0.1], [77, 261, 0.3]].forEach(([x, y, r]) => { leaf(g, x, y, 8, 3, r, C.slate); dot(g, x + 5, y - 0.5, 0.8, C.ink); });
    wline(g, [[94, 262], [126, 268]], C.wood2, 2.2); wline(g, [[100, 263], [100, 274]], C.ink, 1.1); oval(g, 100, 278, 6, 2.2, { fill: C.brass, lw: 1.1 });
    wline(g, [[120, 267], [120, 276]], C.ink, 1.1); dot(g, 120, 279, 3.2, C.iron2);
  } else if (who === 'yu') {      // 池榆：一口小湯鍋、一支長杓和一條手帕
    shape(g, [[44, 268], [84, 268], [80, 282], [48, 282]], { fill: C.iron }); oval(g, 64, 268, 20, 3.4, { fill: C.iron2, lw: 1.2 });
    wline(g, [[40, 271], [44, 271]], C.ink, 2.4); wline(g, [[84, 271], [88, 271]], C.ink, 2.4);
    wline(g, [[70, 266], [92, 252]], C.wood2, 2.2); oval(g, 94, 251, 4.4, 3, { fill: C.brass, lw: 1.1 });
    shape(g, [[100, 276], [116, 273], [121, 281], [105, 284]], { fill: C.cream }); wline(g, [[105, 278], [116, 277]], C.rust, 1);
  } else if (who === 'shan') {    // 尤杉：一只工具袋、一把木槌和幾捲刨花
    shape(g, [[42, 282], [45, 264], [80, 264], [84, 282]], { fill: C.mustard }); wline(g, [[50, 264], [56, 255], [70, 255], [76, 264]], C.wood2, 2.2);
    wline(g, [[58, 264], [58, 258]], C.ink, 2); shape(g, rect(54, 252, 9, 7), { fill: C.iron2, lw: 1.1 });
    shape(g, rrect(96, 268, 18, 10, 2), { fill: C.wood }); wline(g, [[105, 278], [108, 284]], C.wood2, 2.6);
    [[118, 280], [124, 276]].forEach(([x, y], i) => oval(g, x, y, 3.2, 2.6, { stroke: C.plank2, lw: 1.3, n: 8, double: false, seed: 960 + i }));
  } else if (who === 'feng') {    // 賀楓：一個倒著的酒碗、一只水手袋
    shape(g, [[44, 282], [48, 262], [62, 257], [78, 262], [82, 282]], { fill: C.slate2 }); wline(g, [[54, 260], [72, 260]], C.cream, 2); wline(g, [[63, 257], [66, 250], [72, 253]], C.cream, 1.4);
    shape(g, [[96, 283], [100, 275], [118, 275], [122, 283]], { fill: C.ochre }); oval(g, 109, 283, 13, 1.8, { fill: C.shadow, stroke: null });
  } else if (who === 'lan') {     // 季蘭：一疊染好的布和一根晾布的竹竿
    [[C.sea, 0], [C.rose, 5], [C.ochre, 10], [C.slate, 15]].forEach(([col, d]) => shape(g, rrect(44, 278 - d, 40, 5.4, 2), { fill: col, lw: 1.1 }));
    wline(g, [[92, 283], [126, 258]], C.mustard, 2.6); [0.3, 0.6].forEach((k) => wline(g, [[92 + 34 * k - 1, 283 - 25 * k - 1.6], [92 + 34 * k + 1, 283 - 25 * k + 1.6]], C.wood2, 1.2));
  } else {                        // 邵棠：工具箱和一把刨刀
    shape(g, rect(44, 264, 40, 18), { fill: C.wood }); wline(g, [[44, 271], [84, 271]], C.wood2, 1.2); shape(g, rect(61, 268, 6, 5), { fill: C.brass, lw: 1 });
    wline(g, [[52, 264], [56, 256], [72, 256], [76, 264]], C.wood2, 2.4);
    shape(g, rrect(94, 274, 26, 8, 2), { fill: C.plank }); shape(g, [[104, 274], [108, 266], [113, 266], [112, 274]], { fill: C.wood2 });
  }
}

export function createWard(canvas, opts = {}) {
  // 病人長什麼樣子：一張表，一位病人一行。新的病人加一行就好
  const who = PATIENTS[opts.patient] ? opts.patient : 'lin', LOOK = PATIENTS[who];
  const calm = !!LOOK.calm, woman = !!LOOK.woman, pony = !!LOOK.pony, fast = !!LOOK.fast;
  // 在哪裡：ward 公會的病室、ward-rain 下雨天的病室、dock 碼頭的貨棧（出診）
  const scene = ['ward-rain', 'dock'].includes(opts.scene) ? opts.scene : 'ward', dock = scene === 'dock', rain = scene === 'ward-rain';
  const base = createBase(canvas, { back: (g) => drawBack(g, who, scene), mid: drawMid }, opts.view), ctx = base.ctx;
  // hero：主角是哪一位（沒有就不畫）；hide：不畫症影、霧和燈（圖鑑的頭像用）
  const state = { veil: 1, veilShown: 1, bell: 0, shake: 0, slump: 0, slumpShown: 0, still: false, talker: null, nod: 0, flinch: 0, wince: 0, doctor: 0, doctorShown: 0, lights: [], hero: opts.hero || null, hide: false };
  let T = 0, dustClock = 0;
  const sparks = [], dust = [];
  const PUFFS = [
    { a: 0, d: 0, r: 36, th: 0.72 }, { a: 3.5, d: 40, r: 27, th: 0.6 }, { a: 5.6, d: 42, r: 26, th: 0.5 }, { a: 1.0, d: 38, r: 25, th: 0.43 },
    { a: 2.3, d: 40, r: 26, th: 0.36 }, { a: 4.6, d: 38, r: 24, th: 0.3 }, { a: 0.1, d: 56, r: 23, th: 0.2 }, { a: 3.0, d: 60, r: 22, th: 0.12 },
    { a: 1.65, d: 46, r: 21, th: 0.05 }, { a: 5.0, d: 60, r: 20, th: -0.05 },
  ];
  // 病人變差時，從畫面邊緣湧進來的霧
  const EDGE = [{ x: 16, y: 124, r: 26 }, { x: 132, y: 18, r: 27 }, { x: 350, y: 132, r: 25 }, { x: 18, y: 26, r: 26 }, { x: 346, y: 34, r: 24 }, { x: 236, y: 132, r: 17 }, { x: 22, y: 286, r: 24 }, { x: 346, y: 284, r: 22 }];


  // ── 會動的東西 ──
  // 碼頭的窗口：雲、海浪、一艘靠岸的船、海鷗
  function drawDockLife(g, t) {
    g.save(); g.beginPath(); g.rect(17.5, 19.5, 81.5, 83.5); g.clip();
    [[0, 32, 15, 5, 2.6], [56, 46, 11, 4, 1.8]].forEach(([x0, y, rx, ry, sp], i) => {
      const x = 2 + ((x0 + t * sp) % 118);
      oval(g, x, y, rx, ry, { fill: C.cream, stroke: null, seed: 60 + i }); oval(g, x + rx * 0.5, y - ry * 0.6, rx * 0.55, ry * 0.9, { fill: C.cream, stroke: null, seed: 64 + i });
    });
    // 船：跟著浪輕輕晃
    const bobY = Math.sin(t * 1.1) * 1.2, tilt = Math.sin(t * 0.8) * 0.02;
    g.save(); g.translate(68, 76 + bobY); g.rotate(tilt);
    wline(g, [[2, -4], [2, -46]], C.wood2, 2.2, { seed: 70 }); wline(g, [[-16, -4], [-16, -32]], C.wood2, 1.8, { seed: 71 });
    shape(g, [[3, -44], [3, -18], [22, -20]], { fill: C.cream, lw: 1.1, seed: 72, step: 99 }); shape(g, [[-15, -30], [-15, -12], [-2, -14]], { fill: C.paper, lw: 1.1, seed: 73, step: 99 });
    const pen = Math.sin(t * 5) * 1.5; shape(g, [[2, -46], [11, -44 + pen], [2, -41]], { fill: C.rust, lw: 1, seed: 74, step: 99 });
    shape(g, [[-30, -6], [32, -6], [26, 6], [-24, 6]], { fill: C.wood2, lw: 1.3, seed: 75, step: 99 }); wline(g, [[-27, -1], [29, -1]], C.ochre, 1.3, { seed: 76 });
    g.restore();
    // 浪
    for (let i = 0; i < 4; i++) {
      const y = 80 + i * 6, ph = t * (0.9 + i * 0.2) + i * 1.7, pts = [];
      for (let x = 14; x <= 102; x += 8) pts.push([x, y + Math.sin(x * 0.16 + ph) * 1.3]);
      wline(g, pts, i % 2 ? C.cream : C.sea2, 1.1, { amp: 0, seed: 77 + i });
    }
    // 海鷗
    const b = (t * 0.09) % 1;
    if (b < 0.4) {
      const x = 12 + (b / 0.4) * 94, y = 40 - Math.sin((b / 0.4) * Math.PI) * 9, up = Math.sin(t * 13) > 0;
      wline(g, [[x - 6, y + (up ? -3 : 2)], [x, y], [x + 6, y + (up ? -3 : 2)]], C.ink, 1.4, { amp: 0, seed: 82 });
    }
    g.restore();
    // 撐起來的木板窗、窗台
    shape(g, [[9, 12], [107, 12], [112, 2], [4, 2]], { fill: C.wood, seed: 86 });
    wline(g, [[14, 12], [10, 30]], C.wood2, 2.2, { seed: 88 }); wline(g, [[102, 12], [106, 30]], C.wood2, 2.2, { seed: 89 });
    shape(g, rect(5, 103, 106, 7), { fill: C.wood, seed: 87 });
  }

  function drawWindowLife(g, t) {
    if (dock) return drawDockLife(g, t);
    g.save(); g.beginPath(); g.rect(19.5, 21.5, 77.5, 79.5); g.clip();
    // 雲
    [[0, 36, 15, 5, 3.2], [50, 52, 11, 4, 2.1]].forEach(([x0, y, rx, ry, sp], i) => {
      const x = 4 + ((x0 + t * sp) % 112);
      oval(g, x, y, rx, ry, { fill: C.cream, stroke: null, seed: 60 + i }); oval(g, x + rx * 0.5, y - ry * 0.6, rx * 0.55, ry * 0.9, { fill: C.cream, stroke: null, seed: 64 + i });
    });
    // 下雨天：雨絲斜斜地打在窗上
    if (rain) for (let i = 0; i < 16; i++) {
      const k = (t * 1.6 + i * 0.137) % 1, x = 16 + ((i * 37) % 84) + k * 6, y = 18 + k * 88;
      wline(g, [[x, y], [x - 2, y + 7]], C.cream, 1, { amp: 0, seed: 90 + i });
    }
    // 落葉
    for (let i = 0; i < (rain ? 0 : 4); i++) {
      const k = (t * 0.11 + i * 0.27) % 1, x = 24 + i * 19 + Math.sin(t * 1.3 + i * 2) * 5, y = 20 + k * 86;
      leaf(g, x, y, 2.4, 1.5, t * 1.5 + i, i % 2 ? C.ochre : C.pumpkin);
    }
    // 偶爾飛過一隻鳥
    const b = (t * 0.07) % 1;
    if (b < 0.3 && !rain) {
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

  function drawHangings(g, t) {
    K.seed = 700;
    if (dock) {
      // 一串信號旗
      [[131, 13, C.rust], [158, 21, C.cream], [185, 22, C.teal], [213, 17, C.ochre]].forEach(([x, y, col], i) => {
        const sw = Math.sin(t * 2.2 + i * 1.3) * 1.6;
        shape(g, [[x - 7, y], [x + 7, y + 1], [x + sw, y + 15]], { fill: col, lw: 1.1, boil: true });
      });
    } else {
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
    }
    // 吊燈
    g.save(); g.translate(262, -40); g.rotate(Math.sin(t * 0.85) * 0.03); g.translate(0, 40);
    const pulse = 0.5 + 0.5 * Math.sin(t * 5.3) * Math.sin(t * 3.1);
    g.globalAlpha = 0.16 + pulse * 0.05; dot(g, 0, 42, 30, C.glow); g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + (K.boil % 2) * 0.2, r1 = 23, r2 = 27 + (i % 2) * 2; wline(g, [[Math.cos(a) * r1, 42 + Math.sin(a) * r1], [Math.cos(a) * r2, 42 + Math.sin(a) * r2]], C.ochre, 1.2, { amp: 0 }); }
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
      const r = 16 + i * 6 + (K.boil % 2) * 2; g.globalAlpha = clamp(state.bell * 1.4);
      wline(g, [[320 - r, 24], [320 - r * 0.95, 32], [320 - r * 0.75, 39]], C.ink, 1.3, { amp: 0.2 }); wline(g, [[320 + r, 24], [320 + r * 0.95, 32], [320 + r * 0.75, 39]], C.ink, 1.3, { amp: 0.2 }); g.globalAlpha = 1;
    }
    // 地上那盞點著的燈（林秋搬來的）
    const lf = 0.5 + 0.5 * Math.sin(t * 6.1) * Math.sin(t * 2.3);
    if (who === 'lin') { g.globalAlpha = 0.14 + lf * 0.07; dot(g, 46, 268, 15, C.glow); g.globalAlpha = 1; }
    // 繞著吊燈飛的螢火蟲
    for (let i = 0; i < (dock ? 0 : 3); i++) {
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

  function drawLin(g, t) {
    K.seed = 1000;
    const slump = state.slumpShown, wince = state.wince, breath = Math.sin(t * (fast ? 5.2 : 2.5)) * (fast ? 1.5 : 1);
    const talking = state.talker === 'lin', blink = (t * 0.9 + 0.4) % 3.6 < 0.13;
    g.save(); g.translate(LIN.x, LIN.y); g.scale(BIG, BIG); g.rotate((calm ? -0.02 : -0.07) + slump * 0.3 + wince * 0.035);
    // 後面那隻手
    limb(g, [[10, -36], [19, -19], [21, -4]], 7.5, LOOK.shirt2, { boil: true });
    // 身體，跟著呼吸起伏
    g.save(); g.scale(1 + breath * 0.012, 1 + breath * 0.022 + wince * 0.01);
    shape(g, [[-15, 3], [-17, -22], [-15, -37], [-7, -44], [6, -44], [13, -38], [16, -20], [16, 3]], { fill: LOOK.shirt, boil: true });
    wline(g, [[-4, -43], [1, -35], [6, -43]], C.ink, 1.3, { boil: true });
    shape(g, [[-4, -43.5], [1, -36], [6, -43.5], [3, -46], [-2, -46]], { fill: C.cream, lw: 1.1, boil: true });
    dot(g, 2, -14, 1.1, C.ink); dot(g, 2.4, -6, 1.1, C.ink);
    g.restore();
    // 按著胸口的手：慢慢揉，痛的時候壓得更緊
    const rub = t * 2.2, hx = 3 + Math.cos(rub) * 1.6 - wince * 1.5, hy = -26 + Math.sin(rub) * 1.3 + wince;
    limb(g, [[-11, -36], [-15, -18 + wince * 2], [hx - 2, hy + 1]], 8, LOOK.shirt, { boil: true });
    oval(g, hx, hy, 4.2, 3.8, { fill: C.skin, lw: 1.3, boil: true });
    if (wince > 0.3) { g.globalAlpha = clamp((wince - 0.3) * 2.5); [[9, -33, 14, -37], [10, -27, 16, -27], [9, -21, 14, -17]].forEach(([a, b, c, d]) => wline(g, [[a, b], [c, d]], C.rust, 1.6, { amp: 0.2, boil: true })); g.globalAlpha = 1; }
    // 脖子
    limb(g, [[0, -44], [1, -49]], 6, C.skin, { amp: 0 });
    if (LOOK.scarf) {   // 一條繞了兩圈的圍巾
      shape(g, [[-9, -41], [-7, -48], [9, -48], [11, -41], [5, -38], [-4, -38]], { fill: C.rust, lw: 1.3, boil: true });
      shape(g, [[4, -40], [9, -40], [10, -26], [5, -25]], { fill: C.rust, lw: 1.3, boil: true });
      wline(g, [[5.5, -29], [9.5, -29.5]], C.cream, 1.1); wline(g, [[5.5, -32.5], [9.5, -33]], C.cream, 1.1);
    }
    // 頭
    g.save(); g.translate(1, -59 - breath * 0.5); g.rotate(slump * 0.35 + wince * 0.1 + (talking ? Math.sin(t * 9) * 0.02 : 0));
    if (LOOK.bob) shape(g, ell(-3, 2, 21.5, 20.5, 14), { fill: LOOK.hair, boil: true, step: 99 });   // 齊耳的短髮
    if (LOOK.bun) { oval(g, -9, -21, 8, 7.4, { fill: LOOK.hair, boil: true }); wline(g, [[-15, -27], [-3, -17]], C.rust, 1.8, { amp: 0 }); }   // 髮髻和髮簪
    if (pony) {   // 簡晴：綁在腦後的馬尾
      limb(g, [[-17, -8], [-27, -2], [-29, 12 + Math.sin(t * 1.4) * 1.5]], 7, LOOK.hair, { boil: true });
      wline(g, [[-19, -9], [-23, -5]], C.rust, 2.6);
    }
    oval(g, -17.5, 2, 4, 5, { fill: C.skin, lw: 1.3, boil: true });
    shape(g, ell(0, 0, 20, 19, 14), { fill: C.skin, boil: true, step: 99 });
    if (woman) shape(g, [[-19.5, 6], [-21, -8], [-16, -17], [-5, -21.5], [8, -20.5], [17, -14], [19.5, -6], [14, -11], [5, -13.5], [-5, -12], [-12, -7], [-14, 4]], { fill: LOOK.hair, boil: true });
    else {
      shape(g, [[-19.5, 4], [-21, -8], [-16, -17], [-5, -21], [7, -20], [14, -14], [7, -13.5], [-3, -14.5], [-10, -10], [-13, -2], [-14.5, 5]], { fill: LOOK.hair, boil: true });
      wline(g, [[-14, -13], [-9, -16]], C.cream, 1); wline(g, [[-16, -6], [-13, -10]], C.cream, 1);
    }
    // 臉頰、眼睛、眉毛
    g.globalAlpha = (LOOK.flush ? 0.95 : LOOK.pale ? 0.22 : woman ? 0.62 : 0.42) - slump * 0.2; leaf(g, -4, 6, 4, 2.4, 0, C.blush); leaf(g, 17, 6, 2.8, 2.2, 0, C.blush); g.globalAlpha = 1;
    const mode = wince > 0.45 ? 'wince' : (blink || slump > 0.6) ? 'blink' : 'open', look = talking ? [0.9, 0.2] : [1.2, 0.9];
    eye(g, 3, -2.5, 4.2, look, mode, -1); eye(g, 13.5, -2.5, 3.9, look, mode, 1);
    const w = 1.2 + wince * 2;   // 眉頭往上皺
    wline(g, [[-2.5, -8 + w * 0.3], [6, -10 - w]], LOOK.brow, woman ? 1.6 : 2.2, { amp: 0.15, boil: true }); wline(g, [[10.5, -10 - w], [18, -8 + w * 0.3]], LOOK.brow, woman ? 1.6 : 2.2, { amp: 0.15, boil: true });
    // 鼻子、鬍子、嘴
    wline(g, [[9, 1], [12.4, 4.2], [9.4, 6]], C.ink, 1.3, { amp: 0.15, boil: true });
    const mo = talking ? Math.abs(Math.sin(t * 11)) * 2.6 : wince * 1.2;
    if (mo > 0.4) { g.beginPath(); g.ellipse(9, woman || !LOOK.moustache ? 11.5 : 13.6, 2.6, mo, 0, 0, TAU); g.fillStyle = '#5b2f28'; g.fill(); }
    else if (woman || !LOOK.moustache) wline(g, [[5.5, 11], [9, 12], [12.5, 11]], C.ink, 1.3, { amp: 0.1, boil: true });
    if (LOOK.beard) shape(g, [[-7, 9], [0, 12.5], [9, 12], [18.5, 9], [17, 18], [9, 23], [-1, 20]], { fill: LOOK.hair, lw: 1.2, boil: true });
    if (LOOK.cap) {   // 船長帽
      shape(g, [[-19, -9], [-17, -19], [-3, -24.5], [13, -22], [20, -12], [8, -13.5], [-6, -12.5]], { fill: C.coat2, boil: true });
      shape(g, [[2, -13.5], [20, -12], [26, -7.5], [9, -8.5]], { fill: C.ink, lw: 1, boil: true }); dot(g, 3, -17.5, 2, C.brass);
    }
    if (LOOK.moustache) shape(g, [[0, 9.5], [4.5, 6.6], [9, 7.6], [13.5, 6.6], [18, 9.5], [14, 12.4], [9, 10.6], [4, 12.4]], { fill: LOOK.hair, lw: 1.2, boil: true });
    // 冷汗
    for (let i = 0; i < (LOOK.sweat || 0); i++) {
      const k = (t * 0.33 + i * 0.5) % 1, sx = -9 + i * 26, sy = -9 + k * 13;
      g.globalAlpha = Math.sin(k * Math.PI);
      shape(g, [[sx, sy - 3.4], [sx + 2.1, sy + 0.6], [sx, sy + 2.6], [sx - 2.1, sy + 0.6]], { fill: C.sweat, lw: 1, step: 99, boil: true });
    }
    g.globalAlpha = 1;
    g.restore();
    g.restore();
  }

  // 氣促蛙：喘的症影。肚子一鼓一縮，喉嚨的鳴囊跟著反過來動
  function drawFrog(g, t, x, y, flinch, agit) {
    const puff = 0.5 + 0.5 * Math.sin(t * (2.2 + agit * 4 + flinch * 8));
    g.save(); g.translate(x, y + 4); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.04 + flinch * 0.2);
    [-1, 1].forEach((sd) => {
      limb(g, [[sd * 16, 10], [sd * 31, 15], [sd * 24, 25]], 7, C.frog2, { boil: true, seed: 2100 });
      shape(g, ell(sd * 27, 26, 8.5, 3.2, 10), { fill: C.frog2, boil: true, step: 99, seed: 2102 });
    });
    const bw = 25 + puff * 5, bh = 18 + puff * 3.5;
    shape(g, ell(0, 8, bw, bh, 14), { fill: C.frog, boil: true, step: 99, seed: 2104 });
    // 風箱的皮摺
    [-0.62, -0.3, 0.3, 0.62].forEach((k, i) => { const h = bh * 0.82 * Math.sqrt(1 - k * k); wline(g, [[k * bw, 8 - h], [k * bw * 1.05, 8], [k * bw, 8 + h]], C.frog2, 1.4, { boil: true, seed: 2110 + i }); });
    shape(g, ell(0, 14, bw * 0.5, bh * 0.48, 12), { fill: C.cream, lw: 1.2, boil: true, step: 99, seed: 2116 });
    dot(g, 0, 16, 2.8, C.ink); dot(g, 0, 16, 1.4, C.brass);   // 風口
    [-1, 1].forEach((sd) => limb(g, [[sd * 14, 6], [sd * 21, 18], [sd * 15, 24]], 5, C.frog, { boil: true, seed: 2120 }));
    shape(g, ell(0, -13, 17.5, 11, 12), { fill: C.frog, boil: true, step: 99, seed: 2124 });
    g.globalAlpha = 0.92; shape(g, ell(0, -3, 8 + (1 - puff) * 6, 5 + (1 - puff) * 4, 10), { fill: C.fog, stroke: C.fogLine, lw: 1.1, boil: true, step: 99, seed: 2118 }); g.globalAlpha = 1;
    [-1, 1].forEach((sd) => shape(g, ell(sd * 9.5, -21, 7.4, 7.2, 10), { fill: C.frog, boil: true, step: 99, seed: 2126 }));
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 4.6 + flinch * 1.4;
    eye(g, -9.5, -21, r, [-1.2, 1.2], blink ? 'blink' : 'open'); eye(g, 9.5, -21, r, [-1.2, 1.2], blink ? 'blink' : 'open');
    wline(g, [[-10, -11.5], [0, -9.5], [10, -11.5]], C.ink, 1.4, { boil: true, seed: 2130 });
    dot(g, -3, -15, 0.9, C.ink); dot(g, 3, -15, 0.9, C.ink);
    g.restore();
  }

  // 腹痛蟹：腹痛的症影。懷裡抱著一個打死的繩結，兩隻螯一開一合
  function drawCrab(g, t, x, y, flinch, agit) {
    const snap = 0.5 + 0.5 * Math.sin(t * (2.6 + agit * 5 + flinch * 10));
    g.save(); g.translate(x, y + 6); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.04 + flinch * 0.2);
    [-1, 1].forEach((sd) => [0, 1, 2].forEach((i) => {
      const lift = Math.max(0, Math.sin(t * 3.2 + i * 2.1 + (sd > 0 ? 1 : 0))) * 2.5;
      const leg = [[sd * (15 + i * 3), 9 + i * 2], [sd * (27 + i * 4), 10 + i * 4 - lift], [sd * (30 + i * 5), 23 + i * 1.5 - lift]];
      wline(g, leg, C.ink, 3.8, { boil: true, seed: 2200 + i }); wline(g, leg, C.crab2, 2.2, { boil: true, seed: 2200 + i });
    }));
    [-1, 1].forEach((sd) => {
      limb(g, [[sd * 18, 0], [sd * 30, -7], [sd * 33, -17]], 5.5, C.crab2, { boil: true, seed: 2210 });
      g.save(); g.translate(sd * 34, -21); g.scale(sd, 1);
      shape(g, [[-5, 4], [-6.5, -6], [0, -13 - snap * 2.5], [4, -6], [0, -1]], { fill: C.crab, boil: true, seed: 2212 });
      shape(g, [[1, 4], [5, -2 + snap * 3], [11, -8 + snap * 5], [9, 1], [4, 7]], { fill: C.crab, boil: true, seed: 2214 });
      g.restore();
    });
    shape(g, [[-25, 4], [-21, -9], [-10, -15.5], [10, -15.5], [21, -9], [25, 4], [17, 14], [0, 17.5], [-17, 14]], { fill: C.crab, boil: true, seed: 2216 });
    [[-17, -6], [17, -6], [-11, -11], [11, -11]].forEach(([dx, dy]) => dot(g, dx, dy, 1.3, C.crab2));
    // 繩結：兩股繩子交叉繞過去
    [[[-16, 7], [-8, -3], [1, 7], [8, -3], [16, 7]], [[-16, -2], [-7, 8], [1, -3], [9, 8], [16, -1]]].forEach((pts, i) => {
      wline(g, pts, C.ink, 5.4, { boil: true, seed: 2220 + i }); wline(g, pts, C.cream, 3.2, { boil: true, seed: 2220 + i });
    });
    [-1, 1].forEach((sd) => wline(g, [[sd * 6, -15], [sd * 7.5, -22]], C.ink, 1.8, { boil: true, seed: 2226 }));
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 4.4 + flinch * 1.4;
    eye(g, -7.5, -25, r, [-1.2, 1.2], blink ? 'blink' : 'open'); eye(g, 7.5, -25, r, [-1.2, 1.2], blink ? 'blink' : 'open');
    g.restore();
  }

  // 發熱蜥：發燒的症影。背上三塊炭一明一滅，尾巴捲著，鼻子冒一縷煙
  function drawNewt(g, t, x, y, flinch, agit) {
    const glow = t * (2.2 + agit * 4 + flinch * 8);
    g.save(); g.translate(x, y + 6); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.04 + flinch * 0.2);
    const tail = [[16, 9], [29, 13], [38, 5], [36, -6], [28, -9], [24, -2], [29, 2]];
    wline(g, tail, C.ink, 9, { boil: true, seed: 2300 }); wline(g, tail, C.newt2, 6.4, { boil: true, seed: 2300 });
    [-1, 1].forEach((sd) => {
      limb(g, [[sd * 13, 10], [sd * 25, 14], [sd * 22, 23]], 5.5, C.newt2, { boil: true, seed: 2304 });
      shape(g, ell(sd * 24, 24.5, 6.5, 2.8, 8), { fill: C.newt2, boil: true, step: 99, seed: 2306 });
    });
    shape(g, ell(0, 6, 24, 15, 14), { fill: C.newt, boil: true, step: 99, seed: 2308 });
    shape(g, ell(0, 13, 13, 6.5, 12), { fill: C.cream, lw: 1.2, boil: true, step: 99, seed: 2310 });
    [[-12, -3, 0], [0, -7, 2.1], [12, -3, 4.2]].forEach(([dx, dy, ph], i) => {
      const k = 0.5 + 0.5 * Math.sin(glow + ph);
      g.globalAlpha = 0.25 + 0.45 * k; dot(g, dx, dy, 6.5 + k * 2.5, C.ochre); g.globalAlpha = 1;
      shape(g, ell(dx, dy, 4.8, 3.9, 8), { fill: k > 0.5 ? C.pumpkin : C.rust, lw: 1.2, boil: true, step: 99, seed: 2312 + i });
    });
    shape(g, ell(0, -18, 15, 10.5, 12), { fill: C.newt, boil: true, step: 99, seed: 2320 });
    [-1, 1].forEach((sd) => shape(g, ell(sd * 9, -25, 6.6, 6.4, 10), { fill: C.newt, boil: true, step: 99, seed: 2322 }));
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 4.3 + flinch * 1.4;
    eye(g, -9, -25, r, [-1.2, 1.2], blink ? 'blink' : 'open'); eye(g, 9, -25, r, [-1.2, 1.2], blink ? 'blink' : 'open');
    wline(g, [[-8, -13.5], [0, -12], [8, -13.5]], C.ink, 1.4, { boil: true, seed: 2326 });
    dot(g, -2.5, -17, 0.9, C.ink); dot(g, 2.5, -17, 0.9, C.ink);
    for (let i = 0; i < 3; i++) { const k = (t * 0.55 + i / 3) % 1; g.globalAlpha = (1 - k) * 0.6; dot(g, 3 + Math.sin(k * 6 + i) * 2.5, -22 - k * 16, 1.4 + k * 2, C.cream); }
    g.globalAlpha = 1;
    g.restore();
  }

  // 頭痛鳥：頭痛的症影。停在半空，一下一下地往病人那一邊啄
  function drawBird(g, t, x, y, flinch, agit) {
    const beat = (t * (1.1 + agit * 1.3 + flinch * 2)) % 1, peck = beat < 0.18 ? Math.sin((beat / 0.18) * Math.PI) : 0;
    g.save(); g.translate(x, y + 4); g.scale(-MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.03 + flinch * 0.2);
    shape(g, [[-17, 5], [-34, 1], [-37, 9], [-21, 16]], { fill: C.slate2, boil: true, seed: 2400 });
    [-5, 6].forEach((dx, i) => { wline(g, [[dx, 21], [dx, 28]], C.ink, 2, { boil: true, seed: 2402 + i }); wline(g, [[dx - 4, 29.5], [dx, 28], [dx + 4, 29.5]], C.ink, 1.6, { seed: 2404 + i }); });
    shape(g, ell(0, 8, 21, 16, 14), { fill: C.slate, boil: true, step: 99, seed: 2406 });
    shape(g, ell(4, 14, 12, 8.5, 12), { fill: C.cream, lw: 1.2, boil: true, step: 99, seed: 2408 });
    shape(g, [[-15, 0], [-2, 1], [2, 13], [-10, 18], [-20, 10]], { fill: C.slate2, boil: true, seed: 2410 });
    wline(g, [[-13, 8], [-3, 9.5]], C.ink, 1, { seed: 2412 }); wline(g, [[-12, 13], [-3, 14]], C.ink, 1, { seed: 2413 });
    g.save(); g.translate(12, -9); g.rotate(peck * 0.8);
    shape(g, [[-7, -13], [-3, -22], [0, -15], [4, -22], [7, -13]], { fill: C.crab, boil: true, seed: 2416 });
    shape(g, ell(0, -4, 12.5, 11.5, 12), { fill: C.slate, boil: true, step: 99, seed: 2414 });
    shape(g, [[10, -7], [28, -1], [10, 2]], { fill: C.ochre, boil: true, seed: 2418 }); wline(g, [[11, -2.5], [24, -1]], C.ink, 1, { seed: 2420 });
    eye(g, 3, -6, 4.2 + flinch * 1.2, [1.2, 1], (t * 0.8 + 1.3) % 4.4 < 0.14 || peck > 0.5 ? 'blink' : 'open');
    g.restore();
    if (peck > 0.55) [[37, 9, 43, 12], [39, 3, 46, 1], [33, 14, 37, 20]].forEach(([a, b, c2, d]) => wline(g, [[a, b], [c2, d]], C.cream, 1.5, { amp: 0 }));
    g.restore();
  }

  // 腰背龜：背痛的症影。背上疊著石頭，走一步、沉一分
  function drawTortoise(g, t, x, y, flinch, agit) {
    const sag = Math.sin(t * (1.6 + agit * 3 + flinch * 6)) * (1 + agit * 1.5);
    g.save(); g.translate(x, y + 8 + sag * 0.6); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.8) * 0.02 + flinch * 0.15);
    [-1, 1].forEach((sd) => shape(g, ell(sd * 17, 15, 6, 5.5, 8), { fill: C.stone, boil: true, step: 99, seed: 2500 }));
    shape(g, [[22, 8], [30, 11], [23, 13]], { fill: C.stone, boil: true, seed: 2502 });
    shape(g, ell(-27, 4, 9.5, 8, 10), { fill: C.stone, boil: true, step: 99, seed: 2504 });
    shape(g, [[-22, 12], [-20, -1], [-10, -9], [8, -9], [19, -2], [22, 12]], { fill: C.moss, boil: true, seed: 2506 });
    wline(g, [[-21, 6], [21, 6]], C.green2, 1.4, { boil: true, seed: 2508 }); [[-9, -8, -11, 6], [5, -9, 7, 6]].forEach(([a, b, c2, d]) => wline(g, [[a, b], [c2, d]], C.green2, 1.3, { seed: 2510 }));
    shape(g, [[-22, 12], [22, 12], [18, 16], [-18, 16]], { fill: C.cream, lw: 1.2, boil: true, seed: 2512 });
    [[-4, -15, 13, 6, 0.04], [3, -25, 10.5, 5.5, -0.07], [-2, -34, 8, 5, 0.1]].forEach(([sx, sy, rx, ry, rot], i) => { g.save(); g.translate(sx + sag * (i + 1) * 0.5, sy); g.rotate(rot + sag * 0.02 * (i + 1)); shape(g, ell(0, 0, rx, ry, 9), { fill: i === 1 ? C.stone2 : C.iron, boil: true, step: 99, seed: 2514 + i }); g.restore(); });
    eye(g, -29, 2, 3.8 + flinch, [-1.2, 1.2], (t * 0.8 + 1.3) % 4.4 < 0.14 ? 'blink' : 'open');
    wline(g, [[-35, 7], [-30, 8.5]], C.ink, 1.2, { seed: 2520 });
    g.restore();
  }

  // 跛足鷺：腳痛的症影。只用一隻腳站著，另一隻縮起來不讓人看
  function drawHeron(g, t, x, y, flinch, agit) {
    const sway = Math.sin(t * (1.4 + agit * 3 + flinch * 7)) * (0.04 + agit * 0.05);
    g.save(); g.translate(x, y - 6); g.scale(MOTH_BIG, MOTH_BIG);
    const leg = [[2, 8], [1, 22], [3, 31]];
    wline(g, leg, C.ink, 2.6, { boil: true, seed: 2600 }); wline(g, leg, C.ochre, 1.3, { boil: true, seed: 2600 }); wline(g, [[-4, 32], [3, 31], [10, 32]], C.ink, 1.8, { seed: 2602 });
    g.rotate(sway);
    const tuck = [[-4, 8], [-9, 15], [-3, 18]];
    wline(g, tuck, C.ink, 2.4, { boil: true, seed: 2604 }); wline(g, tuck, C.ochre, 1.2, { boil: true, seed: 2604 });
    shape(g, ell(0, 0, 17, 11.5, 12, -0.25), { fill: C.cream, boil: true, step: 99, seed: 2606 });
    shape(g, [[-4, -6], [14, -2], [22, 6], [8, 8], [-6, 3]], { fill: C.iron, boil: true, seed: 2608 });
    wline(g, [[2, 0], [14, 3]], C.iron2, 1.1, { seed: 2610 }); wline(g, [[0, 4], [10, 6]], C.iron2, 1.1, { seed: 2611 });
    // 霧還濃的時候把脖子縮起來，頭才不會從霧裡冒出來；霧散了再伸直
    const n = smooth(0.4, 0.75, state.veilShown), mix = (a, b) => a.map(([px, py], i) => [px + (b[i][0] - px) * n, py + (b[i][1] - py) * n]);
    const neck = mix([[-12, -5], [-19, -14], [-11, -22], [-16, -31]], [[-12, -5], [-17, -9], [-11, -12], [-13, -14]]);
    const [[hx, hy], [ex, ey]] = mix([[-18, -34], [-19, -35]], [[-14, -16], [-15, -17]]);
    wline(g, neck, C.ink, 7, { boil: true, seed: 2612 }); wline(g, neck, C.cream, 4.6, { boil: true, seed: 2612 });
    shape(g, mix([[-24, -36], [-40, -32], [-24, -31]], [[-19, -18], [-30, -13], [-19, -13]]), { fill: C.ochre, boil: true, seed: 2618 });
    shape(g, ell(hx, hy, 7, 6, 10), { fill: C.cream, boil: true, step: 99, seed: 2614 });
    wline(g, mix([[-14, -38], [-6, -42]], [[-10, -20], [-3, -23]]), C.iron2, 1.8, { seed: 2616 });
    eye(g, ex, ey, 3 + flinch, [-1, 0.8], (t * 0.8 + 1.3) % 4.4 < 0.14 ? 'blink' : 'open');
    g.restore();
  }

  // 水腫豚：腫脹的症影。一鼓一消
  function drawPuffer(g, t, x, y, flinch, agit) {
    const puff = 0.5 + 0.5 * Math.sin(t * (1.8 + agit * 3.5 + flinch * 8)), r = 19 + puff * 6;
    g.save(); g.translate(x, y + 4); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.05 + flinch * 0.2);
    shape(g, [[r - 3, -2], [r + 11, -9], [r + 9, 0], [r + 11, 9], [r - 3, 3]], { fill: C.mustard, boil: true, seed: 2700 });
    [-1, 1].forEach((sd) => shape(g, [[2, sd * (r - 3)], [10, sd * (r + 6)], [-4, sd * (r + 5)]], { fill: C.mustard, boil: true, seed: 2702 }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.26, r2 = r + 3 + puff * 2.5; wline(g, [[Math.cos(a) * (r - 1), Math.sin(a) * (r - 1) * 0.92], [Math.cos(a) * r2, Math.sin(a) * r2 * 0.92]], C.ink, 1.5, { amp: 0 }); }
    shape(g, ell(0, 0, r, r * 0.92, 16), { fill: C.ochre, boil: true, step: 99, seed: 2704 });
    shape(g, ell(-2, r * 0.3, r * 0.7, r * 0.5, 12), { fill: C.cream, lw: 1.1, boil: true, step: 99, seed: 2706 });
    [[5, -8], [11, -3], [1, -13], [10, -12]].forEach(([dx, dy]) => dot(g, dx, dy, 1.3, C.mustard));
    eye(g, -11, -6, 4.2 + flinch * 1.2, [-1.2, 1], (t * 0.8 + 1.3) % 4.4 < 0.14 ? 'blink' : 'open');
    oval(g, -r + 3, 3, 2.6, 2.2 + puff, { fill: C.rust, lw: 1.1 });
    g.restore();
  }

  // 二便獺：排泄物異常的症影。把水攪渾了就躲起來
  function drawOtter(g, t, x, y, flinch, agit) {
    const stir = t * (1.6 + agit * 3 + flinch * 6);
    g.save(); g.translate(x, y + 4); g.scale(MOTH_BIG, MOTH_BIG);
    [[26, 9, 0], [19, 6.5, 2]].forEach(([rx, ry, ph], i) => { const pts = []; for (let k = 0; k <= 14; k++) { const a = (k / 14) * TAU * 0.86 + stir * 0.5 + ph; pts.push([Math.cos(a) * rx, 17 + Math.sin(a) * ry]); } wline(g, pts, i ? C.plank2 : C.plank, 2.2, { amp: 0.4, seed: 2800 + i }); });
    g.rotate(Math.sin(t * 0.9) * 0.04 + flinch * 0.2);
    const tail = [[10, 10], [22, 12], [30, 6], [33, -2]];
    wline(g, tail, C.ink, 7.5, { boil: true, seed: 2804 }); wline(g, tail, C.fur2, 5, { boil: true, seed: 2804 });
    shape(g, ell(0, 4, 15, 13, 12), { fill: C.fur, boil: true, step: 99, seed: 2806 });
    shape(g, ell(-1, 8, 9, 8, 10), { fill: C.cream, lw: 1.1, boil: true, step: 99, seed: 2808 });
    [-1, 1].forEach((sd) => limb(g, [[sd * 11, 0], [sd * 7, 8], [sd * 2, 7]], 4.2, C.fur2, { boil: true, seed: 2810 }));
    [-1, 1].forEach((sd) => shape(g, ell(-2 + sd * 10.5, -23, 3.6, 3.2, 8), { fill: C.fur2, boil: true, step: 99, seed: 2814 }));
    shape(g, ell(-2, -15, 13, 10.5, 12), { fill: C.fur, boil: true, step: 99, seed: 2812 });
    shape(g, ell(-2, -11, 7.5, 5, 10), { fill: C.cream, lw: 1.1, boil: true, step: 99, seed: 2816 });
    dot(g, -2, -13, 1.8, C.ink);
    [-1, 1].forEach((sd) => { wline(g, [[-2 + sd * 5, -11], [-2 + sd * 14, -12]], C.ink, 0.8, { amp: 0 }); wline(g, [[-2 + sd * 5, -9.5], [-2 + sd * 13, -8]], C.ink, 0.8, { amp: 0 }); });
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 3.4 + flinch;
    eye(g, -8, -18, r, [-1, 1], blink ? 'blink' : 'open'); eye(g, 4, -18, r, [-1, 1], blink ? 'blink' : 'open');
    g.restore();
  }

  // 皮疹魷：皮膚疹子的症影。游過哪裡，墨點就留在哪裡
  function drawSquid(g, t, x, y, flinch, agit) {
    const wave = t * (2 + agit * 4 + flinch * 8);
    g.save(); g.translate(x, y); g.scale(MOTH_BIG, MOTH_BIG);
    [[-30, -8, 2.2], [-34, 8, 1.6], [28, -14, 2], [33, 4, 2.6], [-22, 20, 1.8], [24, 20, 1.5], [-12, -30, 1.4], [14, -31, 1.8]].forEach(([dx, dy, r], i) => { g.globalAlpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(wave * 0.6 + i * 1.3)); dot(g, dx, dy, r, i % 3 ? C.ink : C.rust); });
    g.globalAlpha = 1;
    g.rotate(Math.sin(t * 0.9) * 0.05 + flinch * 0.2);
    for (let i = 0; i < 6; i++) { const bx = -10 + i * 4, sw = Math.sin(wave + i * 0.9) * 3, pts = [[bx, 6], [bx + sw, 16], [bx - sw * 0.6, 25], [bx + sw, 32]]; wline(g, pts, C.ink, 4, { boil: true, seed: 2900 + i }); wline(g, pts, C.rose2, 2.4, { boil: true, seed: 2900 + i }); }
    [-1, 1].forEach((sd) => shape(g, [[sd * 8, -22], [sd * 21, -16], [sd * 10, -8]], { fill: C.rose2, boil: true, seed: 2910 }));
    shape(g, [[0, -34], [10, -22], [12, -2], [8, 8], [-8, 8], [-12, -2], [-10, -22]], { fill: C.rose, boil: true, seed: 2912 });
    [[-4, -22], [5, -16], [-2, -10]].forEach(([dx, dy]) => dot(g, dx, dy, 1.5, C.rose2));
    const blink = (t * 0.8 + 1.3) % 4.4 < 0.14, r = 3.8 + flinch * 1.2;
    eye(g, -6, 1, r, [-1, 1], blink ? 'blink' : 'open'); eye(g, 6, 1, r, [1, 1], blink ? 'blink' : 'open');
    g.restore();
  }

  // 消瘦鼠：體重減輕的症影。每天夜裡把月亮啃掉一小口
  function drawMouse(g, t, x, y, flinch, agit) {
    const nib = Math.max(0, Math.sin(t * (5 + agit * 6 + flinch * 10)));
    g.save(); g.translate(x + 4, y + 4); g.scale(MOTH_BIG, MOTH_BIG); g.rotate(Math.sin(t * 0.9) * 0.04 + flinch * 0.2);
    const moon = [];
    for (let k = 0; k <= 10; k++) { const a = ((60 + k * 24) * Math.PI) / 180; moon.push([Math.cos(a) * 15, Math.sin(a) * 15]); }
    for (let k = 10; k >= 0; k--) { const a = ((75 + k * 21) * Math.PI) / 180; moon.push([6 + Math.cos(a) * 12.5, Math.sin(a) * 12.5]); }
    g.save(); g.translate(-20, -6); shape(g, moon, { fill: C.ochre, boil: true, seed: 3000 }); g.restore();
    [[-9, 7], [-6, 11], [-12, 12]].forEach(([dx, dy]) => dot(g, dx, dy + nib, 1, C.ochre));
    const tail = [[14, 12], [24, 14], [31, 8], [28, 0]];
    wline(g, tail, C.ink, 3, { boil: true, seed: 3004 }); wline(g, tail, C.rose, 1.6, { boil: true, seed: 3004 });
    shape(g, ell(8, 6, 13, 11, 12), { fill: C.iron, boil: true, step: 99, seed: 3006 });
    shape(g, ell(6, 10, 7, 6, 10), { fill: C.cream, lw: 1.1, boil: true, step: 99, seed: 3008 });
    [[3, -13, 5.5], [10, -10, 5]].forEach(([dx, dy, r], i) => { shape(g, ell(dx, dy, r, r, 9), { fill: C.iron, boil: true, step: 99, seed: 3012 + i }); dot(g, dx, dy, r * 0.5, C.rose); });
    shape(g, [[-9 - nib, -2], [2, -11], [10, -6], [8, 3], [0, 4]], { fill: C.iron, boil: true, seed: 3010 });
    dot(g, -9 - nib, -2, 1.5, C.ink);
    [-1, 1].forEach((sd) => wline(g, [[-6, -1], [-13, -1 + sd * 3]], C.ink, 0.7, { amp: 0 }));
    eye(g, 1, -4, 3.2 + flinch, [-1.2, 0.6], (t * 0.8 + 1.3) % 4.4 < 0.14 ? 'blink' : 'open');
    [[-3, 3], [-1, 7]].forEach(([dx, dy], i) => shape(g, ell(dx, dy, 2.6, 2, 7), { fill: C.rose, lw: 1, boil: true, step: 99, seed: 3016 + i }));
    g.restore();
  }

  // 麻木鰻：感覺異常的症影。游過的地方又麻又刺，像有細細的電
  function drawEel(g, t, x, y, flinch, agit) {
    const sw = t * (2 + agit * 4 + flinch * 8);
    g.save(); g.translate(x, y + 2); g.scale(MOTH_BIG, MOTH_BIG);
    const body = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; body.push([-30 + u * 60, Math.sin(u * 5.2 + sw) * (7 - u * 2) + (u - 0.5) * 6]); }
    wline(g, body, C.ink, 11, { amp: 0.3, seed: 3100 }); wline(g, body, C.teal, 8.4, { amp: 0.3, seed: 3100 });
    wline(g, body.map(([px, py]) => [px, py + 2.6]), C.cream, 1.6, { amp: 0.2, seed: 3102 });
    const [hx, hy] = body[0];
    shape(g, ell(hx - 2, hy, 8.5, 7, 10), { fill: C.teal, boil: true, step: 99, seed: 3104 });
    wline(g, [[hx - 9, hy + 2.5], [hx - 4, hy + 3.5]], C.ink, 1.2, { seed: 3106 });
    eye(g, hx - 3, hy - 2, 3.2 + flinch, [-1.2, 0.8], (t * 0.8 + 1.3) % 4.4 < 0.14 ? 'blink' : 'open');
    [[-12, -16], [6, -18], [20, -10], [-2, 18], [16, 16], [-22, 14]].forEach(([dx, dy], i) => { if ((Math.floor(sw * 1.4) + i) % 3) return; wline(g, [[dx, dy], [dx + 3, dy + 4], [dx - 1, dy + 5], [dx + 2, dy + 10]], C.ochre, 1.6, { amp: 0 }); });
    g.restore();
  }

  function drawMoth(g, t) {
    K.seed = 2000;
    const flinch = state.flinch, agit = state.slumpShown;
    const x = MOTH.x + Math.sin(t * 0.7) * 3 + flinch * (8 + Math.sin(t * 60) * 2), y = MOTH.y + Math.sin(t * 1.3) * 3.2 - flinch * 7;
    // 連到林秋胸口的那條霧線
    g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2.5);
    const tx = LIN.x + 7, ty = LIN.y - 34;
    for (let i = 1; i < 9; i++) { const k = i / 9, px = x + (tx - x) * k + Math.sin(k * 9 + t * 2) * 4, py = y + 14 + (ty - y - 14) * k; dot(g, px, py, 1.5 - k * 0.5, C.cream); }
    g.globalAlpha = 1;
    // 症影長什麼樣子，看是哪一個主訴
    if (opts.shadow === 'frog') { drawFrog(g, t, x, y, flinch, agit); return { x, y }; }
    if (opts.shadow === 'crab') { drawCrab(g, t, x, y, flinch, agit); return { x, y }; }
    if (opts.shadow === 'newt') { drawNewt(g, t, x, y, flinch, agit); return { x, y }; }
    if (opts.shadow === 'bird') { drawBird(g, t, x, y, flinch, agit); return { x, y }; }
    const more = { tortoise: drawTortoise, heron: drawHeron, puffer: drawPuffer, otter: drawOtter, squid: drawSquid, mouse: drawMouse, eel: drawEel }[opts.shadow];
    if (more) { more(g, t, x, y, flinch, agit); return { x, y }; }
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

  function drawLights(g, t, m) {
    const list = state.lights;
    if (!list.length) return;
    K.seed = 2500;
    list.forEach((it, i) => {
      const n = list.length, lx = m.x + (i - (n - 1) / 2) * 27 + Math.sin(t * 1.1 + i) * 1.2, ly = m.y + 52 + Math.cos(t * 1.3 + i * 1.7) * 1.2 + Math.abs(i - (n - 1) / 2) * -3;
      it.shown = (it.shown ?? 0) + (it.level - (it.shown ?? 0)) * 0.12;
      const lv = it.shown, on = Math.max(0, lv), off = Math.max(0, -lv);
      wline(g, [[m.x + (i - (n - 1) / 2) * 6, m.y + 26], [lx, ly - 10]], C.ink, 1, { amp: 0.3, boil: true });
      if (on > 0.05) { g.globalAlpha = on * (0.3 + 0.08 * Math.sin(t * 4 + i)); dot(g, lx, ly, 15 + on * 4, C.glow); g.globalAlpha = 1; }
      shape(g, [[lx - 5, ly - 9.5], [lx + 5, ly - 9.5], [lx + 4, ly - 7.5], [lx - 4, ly - 7.5]], { fill: C.brass, lw: 1, step: 99 });
      const paper = on > 0.05 ? (on > 0.5 ? C.ochre : C.glow) : off > 0.05 ? '#b9b6a8' : C.cream;
      shape(g, ell(lx, ly, 8.6, 8.2, 12), { fill: paper, lw: 1.3, boil: true, step: 99 });
      g.globalAlpha = off > 0.05 ? 0.45 : 0.92; g.fillStyle = C.ink; g.font = '700 9.5px "LXGW WenKai TC", "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(it.mark, lx, ly + 0.6); g.globalAlpha = 1;
      if (off > 0.3) { g.globalAlpha = Math.min(1, off * 1.4); wline(g, [[lx - 6.5, ly - 6], [lx + 6.5, ly + 6]], C.ink, 1.5, { amp: 0.3, boil: true }); g.globalAlpha = 1; }
    });
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

  function drawFront(g, t) {
    K.seed = 5000;
    const big = (bx, by, len, rot, col, i) => {
      g.save(); g.translate(bx, by); g.rotate(rot + Math.sin(t * 0.8 + i * 1.3) * 0.035);
      wline(g, [[0, 0], [0, -len * 0.45]], C.green, 2.2, { seed: 5001 + i * 9 });
      shape(g, [[0, -len * 0.3], [len * 0.2, -len * 0.55], [len * 0.14, -len * 0.86], [0, -len], [-len * 0.14, -len * 0.86], [-len * 0.2, -len * 0.55]], { fill: col, seed: 5002 + i * 9, boil: true });
      wline(g, [[0, -len * 0.36], [0, -len * 0.92]], C.wall2, 1.1, { seed: 5003 + i * 9 });
      [0.5, 0.66, 0.8].forEach((k, j) => { wline(g, [[0, -len * k], [len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5004 + i * 9 + j }); wline(g, [[0, -len * k], [-len * 0.11, -len * (k + 0.07)]], C.wall2, 0.9, { seed: 5007 + i * 9 + j }); });
      g.restore();
    };
    if (dock) {
      shape(g, [[336, 268], [384, 268], [388, 292], [384, 318], [336, 318], [332, 292]], { fill: C.wood, seed: 5080 });
      wline(g, [[334, 280], [386, 280]], C.ink, 2.2, { seed: 5081 }); wline(g, [[333, 304], [387, 304]], C.ink, 2.2, { seed: 5082 });
      [348, 360, 372].forEach((x, i) => wline(g, [[x, 270], [x + (i - 1) * 1.5, 316]], C.wood2, 1.1, { seed: 5083 + i }));
      [16, 12, 8].forEach((r, i) => oval(g, 10, 300, r, r * 0.5, { stroke: C.mustard, lw: 2.6, n: 14, double: false, seed: 5087 + i }));
      return;
    }
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
    K.boil = still ? 0 : Math.floor(t * 5) % 3;
    const ease = (k) => (still ? 1 : Math.min(1, dt * k));
    state.veilShown += (state.veil - state.veilShown) * ease(2.6);
    state.slumpShown += (state.slump - state.slumpShown) * ease(2.2);
    state.doctorShown += (state.doctor - state.doctorShown) * ease(1.6);
    state.bell *= Math.exp(-dt * 1.5); state.shake *= Math.exp(-dt * 7);
    state.nod = Math.max(0, state.nod - dt * 1.6); state.flinch = Math.max(0, state.flinch - dt * 2.4);
    const ph = (t + 2.2) % 5.6;
    state.wince = still ? 0 : Math.max((ph < 1 ? Math.sin(ph * Math.PI) : 0) * (calm ? 0.5 : 1), state.slumpShown * 0.7);
    if (still) { sparks.length = 0; dust.length = 0; return; }
    // 胸悶蛾翅膀掉下來的鱗粉
    dustClock += dt;
    if (dustClock > 0.3 && state.veilShown < 0.85) {
      dustClock = 0;
      dust.push({ x: MOTH.x + (Math.random() - 0.5) * 70, y: MOTH.y + 10 + Math.random() * 14, vx: (Math.random() - 0.5) * 4, vy: 9 + Math.random() * 8, r: 0.8 + Math.random() * 0.9, life: 1, c: Math.random() < 0.5 ? C.ochre : C.cream });
    }
    for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.x += (d.vx + Math.sin(t * 3 + i) * 3) * dt; d.y += d.vy * dt; d.life -= dt * 0.45; if (d.life <= 0) dust.splice(i, 1); }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.94; s.vy *= 0.94; s.rot += dt * 2; s.life -= dt; if (s.life <= 0) sparks.splice(i, 1); }
  }

  function render() {
    if (!base.img) return;
    const t = state.still ? 0 : T, g = ctx;
    const sx = state.still ? 0 : (hash(K.boil, Math.floor(T * 30)) - 0.5) * state.shake * 10, sy = state.still ? 0 : (hash(K.boil + 9, Math.floor(T * 30)) - 0.5) * state.shake * 10;
    base.begin(); base.paste('back', sx, sy); base.world(sx, sy);
    K.seed = 50; drawWindowLife(g, t);
    if (!dock) drawCat(g, t, 40, 101);
    drawHangings(g, t);
    drawLin(g, t);
    base.paste('mid', sx, sy); base.world(sx, sy);
    if (state.hero) drawHero(g, t, { x: HERO.x, y: HERO.y, look: state.hero, talking: state.talker === 'hero', scale: 1.03 });
    if (!state.hide) {
      const m = drawMoth(g, t);
      drawFog(g, t, m);
      drawLights(g, t, m);
    }
    // 值班醫師到了，岑禾往旁邊讓一步
    const d = state.doctorShown;
    drawCen(g, t, { x: CEN.x - 34 * d, y: CEN.y, talking: state.talker === 'cen', nod: state.nod });
    if (d > 0.02) drawShen(g, t, { x: SHEN.x + (1 - d) * 70, y: SHEN.y, talking: state.talker === 'shen', walk: d < 0.97 ? 1 : 0 });
    drawFront(g, t);
    drawParticles(g);
    // 病人變差：霧從四周湧進來，畫面暗一點
    const bad = state.slumpShown;
    if (bad > 0.02) {
      EDGE.forEach((e, i) => { g.globalAlpha = clamp(bad * 1.2) * 0.93; puff(g, e.x + Math.sin(t * 0.6 + i) * 3, e.y + Math.cos(t * 0.5 + i) * 2, e.r * (0.4 + 0.6 * bad), 20 + i, t); });
      base.tint('rgba(70, 60, 96, ' + (bad * 0.13).toFixed(3) + ')');
    }
    g.globalAlpha = 1; base.grain();
  }

  function burst(n, key) {
    if (state.still) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.5, v = 40 + Math.random() * 50;
      sparks.push({ x: MOTH.x, y: MOTH.y - 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, r: 3 + Math.random() * (key ? 4 : 2.5), rot: Math.random() * 3, life: 0.9 + Math.random() * 0.4, max: 1.3, c: i % 2 ? C.ochre : C.cream });
    }
  }

  return {
    state, resize: base.resize, update, render,
    /** 角色頭頂的位置，給對話泡泡和標籤用（CSS 像素） */
    anchor(who) {
      const d = state.doctorShown;
      const p = who === 'lin' ? [LIN.x + 1, LIN.y - 84 * BIG] : who === 'cen' ? [CEN.x - 1 - 34 * d, CEN.y - 128 * BIG] : who === 'shen' ? [SHEN.x - 1, SHEN.y - 150] : who === 'hero' && state.hero ? [HERO.x - 1, HERO.y - 124] : null;
      return p && base.css(p[0], p[1]);
    },
    /** 拿到一條線索：症影往後縮、岑禾點頭、星星散開 */
    clue(key) { state.flinch = 1; state.nod = 1; burst(key ? 12 : 7, key); },
    /** 四盞燈：[{ mark, level }]，level 從 -1（比較不像）到 1（更像） */
    setLights(list) { state.lights = list.map((it, i) => ({ ...it, shown: state.lights[i]?.shown ?? 0 })); },
    ring() { state.bell = 1; },
    jolt() { state.shake = 1; },
  };
}
