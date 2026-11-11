// 像素場景：診間、病人、被面紗蓋住的主訴怪。畫在低解析度的畫布上，再整數倍放大。

import { PATIENT, monsterSprite, veiled, drawGrid } from '../art/sprites.js';

export const SCENE_H = 112; // 場景高度（邏輯像素）。寬度跟著畫面走

// state: { veil, monster, mood, flash, hurt, monsterGone }
export function drawScene(canvas, W, state) {
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== SCENE_H) canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d');
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const E = (cx, cy, rx, ry, c) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) R(x, y, 1, 1, c);
    }
  };

  // 牆、踢腳板、地板
  R(0, 0, W, 78, '#cfe3ea'); R(0, 68, W, 10, '#b9d2dc'); R(0, 78, W, 3, '#8aa3b0');
  R(0, 81, W, SCENE_H - 81, '#e6d8c0');
  for (let y = 81, row = 0; y < SCENE_H; y += 10, row++) for (let x = row % 2 ? 0 : 12; x < W; x += 24) R(x, y, 12, 10, '#dccbb0');

  // 窗戶（夜班）
  const wx = Math.round(W / 2) - 20, wy = 37;
  R(wx - 4, wy - 4, 38, 3, '#8794a3');
  R(wx, wy, 30, 28, '#5d7f9a'); R(wx + 2, wy + 2, 26, 24, '#1d2f55');
  R(wx + 14, wy + 2, 2, 24, '#5d7f9a'); R(wx + 2, wy + 13, 26, 2, '#5d7f9a');
  [[6, 6], [22, 8], [9, 20], [24, 22], [19, 17]].forEach(([dx, dy]) => R(wx + dx, wy + dy, 1, 1, '#f6e9a8'));
  R(wx - 3, wy - 1, 5, 31, '#e58a8a'); R(wx + 28, wy - 1, 5, 31, '#e58a8a');

  // 主訴怪站的平台
  const mx = W - 58, my = 36;
  E(mx + 24, 87, 30, 6, '#8aa3b0'); E(mx + 24, 86, 27, 4.5, '#a9bfca');

  if (!state.monsterGone) {
    const sprite = veiled(monsterSprite(state.monster), state.veil);
    drawGrid(ctx, sprite, mx, my, { tint: state.flash ? '#ffffff' : null });
  }
  drawGrid(ctx, PATIENT[state.mood === 'ok' ? 'ok' : 'pain'], 6, 58, { tint: state.hurt ? '#ff9a94' : null });
}

// 圖鑑用：單獨畫一隻主訴怪
export function drawMonster(canvas, monster, veil) {
  canvas.width = 48; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 48, 48);
  drawGrid(ctx, veiled(monsterSprite(monster), veil), 0, 0);
}
