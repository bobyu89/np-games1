// 風格定稿的 3D 像素場景：霧脈公會的病室、林秋、岑禾、症影「鐵翅蛾」。
//
// 做法：所有東西都是方塊堆出來的 3D 模型。先用很低的解析度算圖，
// 再把每個像素對到一組固定的色盤（加上規則的網點），並在輪廓畫一條深色的線。
// 最後整數倍放大。動作都是移動和旋轉零件，沒有逐格重畫。

import * as THREE from 'three';

// 固定色盤。畫面上只會出現這些顏色
export const PALETTE = [
  '#0a0d14', '#0f1826', '#14243a', '#1f3a5c', '#2f5f8a', '#5a93b8', '#9cc7d8', // 夜色的藍
  '#f5f2ea', '#cfd8d6', '#a3b3b8', '#74858f',                                  // 霧白到灰
  '#2e1f1a', '#4a3226', '#6b4a33', '#8f6a47', '#b48a5e',                       // 木頭
  '#5a3a1c', '#8a5a2b', '#b9803d', '#e0b060', '#f7dc8a',                       // 黃銅和燈光
  '#044a48', '#087e78', '#3fb3a8',                                             // 青綠
  '#7a4a3a', '#c98a6a', '#f0c2a0',                                             // 皮膚
  '#5e1620', '#a12635', '#e0606a',                                             // 紅
  '#2a2f3a', '#515a6b', '#8792a3', '#c3ccd6',                                  // 鐵灰
];

const FOG_VERT = 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const BAYER = `
float bayer4(vec2 p){
  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  float m[16];
  m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
  m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
  return 0.5;
}`;
// 霧：不做半透明，用網點挖洞。這樣霧也是乾淨的像素
const FOG_FRAG = `
uniform vec3 color; uniform float alpha;
${BAYER}
void main(){ if (alpha <= bayer4(gl_FragCoord.xy)) discard; gl_FragColor = vec4(color, 1.0); }`;

const POST_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const POST_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 texel; uniform vec3 palette[${PALETTE.length}];
uniform float dither; uniform float edge; uniform vec3 flash; uniform float flashAmt;
${BAYER}
float depthAt(vec2 uv){ return texture2D(tDepth, uv).x; }
void main(){
  vec3 c = pow(texture2D(tColor, vUv).rgb, vec3(1.0 / 2.2));
  // 輪廓：旁邊的像素比我近很多，代表我站在某個東西的邊緣外面，畫成深色
  float d = depthAt(vUv);
  float near = min(min(depthAt(vUv + vec2(texel.x, 0.0)), depthAt(vUv - vec2(texel.x, 0.0))),
                   min(depthAt(vUv + vec2(0.0, texel.y)), depthAt(vUv - vec2(0.0, texel.y))));
  float isEdge = step(edge, d - near);
  c = mix(c, vec3(0.04, 0.05, 0.08), isEdge * 0.9);
  c = mix(c, flash, flashAmt);
  // 加一點規則的網點，再找色盤裡最接近的顏色
  c += (bayer4(gl_FragCoord.xy) - 0.5) * dither;
  float best = 1e9; vec3 pick = palette[0];
  for (int i = 0; i < ${PALETTE.length}; i++) {
    vec3 diff = c - palette[i];
    float dist = dot(diff * vec3(0.9, 1.1, 0.8), diff);
    if (dist < best) { best = dist; pick = palette[i]; }
  }
  gl_FragColor = vec4(pick, 1.0);
}`;

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0d14');
  const camera = new THREE.OrthographicCamera(-90, 90, 75, -75, 1, 500);

  // ── 材質和小工具 ──
  const mats = new Map();
  const lit = (hex) => { if (!mats.has(hex)) mats.set(hex, new THREE.MeshLambertMaterial({ color: hex, flatShading: true })); return mats.get(hex); };
  const glowMat = (hex) => new THREE.MeshBasicMaterial({ color: hex });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  // 一個方塊。y 是方塊底面的高度
  function box(parent, w, h, d, x, y, z, color, o = {}) {
    const m = new THREE.Mesh(unit, o.mat || (o.glow ? glowMat(color) : lit(color)));
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    m.castShadow = !o.glow && !o.flat;
    m.receiveShadow = !o.glow;
    parent.add(m);
    return m;
  }
  const group = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ── 燈光 ──
  scene.add(new THREE.HemisphereLight('#7fa3d8', '#3a2a22', 2.1));
  const moon = new THREE.DirectionalLight('#9cc7ff', 1.6);
  moon.position.set(60, 110, 70);
  moon.castShadow = true;
  moon.shadow.mapSize.set(512, 512);
  Object.assign(moon.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 320 });
  moon.shadow.bias = -0.002;
  scene.add(moon);
  const fill = new THREE.DirectionalLight('#ffe6c8', 1.5);
  fill.position.set(80, 70, 120);
  scene.add(fill);
  const lantern = new THREE.PointLight('#ffb866', 7600, 220, 1.7);
  lantern.position.set(2, 56, 2);
  scene.add(lantern);
  const boxLamp = new THREE.PointLight('#ffcf7a', 900, 60, 1.8);
  scene.add(boxLamp);

  // ── 病室 ──
  const room = group(scene);
  for (let i = 0; i < 10; i++) box(room, 114, 3, 9, 0, -3, -40.5 + i * 9, i % 2 ? '#6b4a33' : '#5c4030', { flat: true });
  box(room, 114, 20, 3, 0, 0, -46.5, '#4a3226'); box(room, 114, 46, 3, 0, 20, -46.5, '#1f3a5c');
  box(room, 114, 2, 4, 0, 19, -46, '#8f6a47');
  box(room, 3, 20, 93, -58.5, 0, 0, '#4a3226'); box(room, 3, 46, 93, -58.5, 20, 0, '#1b3350');
  box(room, 4, 2, 93, -58, 19, 0, '#8f6a47');
  // 牆上幾塊突出的石磚
  [[-40, 44], [-12, 52], [40, 48], [-30, 30], [44, 26]].forEach(([x, y]) => box(room, 9, 4, 1, x, y, -44.6, '#2f5f8a', { flat: true }));
  [[-20, 46], [22, 30], [-36, 26]].forEach(([z, y]) => box(room, 1, 4, 9, -56.6, y, z, '#2f5f8a', { flat: true }));

  // 窗：外面是夜色、遠處的燈塔和雨
  const win = group(room, 4, 28, -44.8);
  const glass = box(win, 26, 22, 0.6, 0, 0, 0, '#0f1826', { glow: true });
  box(win, 30, 2, 2, 0, 22, 0.6, '#8a5a2b'); box(win, 30, 2, 3, 0, -2, 1, '#8a5a2b');
  box(win, 2, 22, 2, -14, 0, 0.6, '#8a5a2b'); box(win, 2, 22, 2, 14, 0, 0.6, '#8a5a2b');
  box(win, 1, 22, 1, 0, 0, 0.6, '#5a3a1c'); box(win, 26, 1, 1, 0, 11, 0.6, '#5a3a1c');
  box(win, 2, 9, 0.4, 7, 2, 0.35, '#1f3a5c', { glow: true }); box(win, 3, 1, 0.4, 7, 1, 0.35, '#1f3a5c', { glow: true });
  const beacon = box(win, 2, 2, 0.4, 7, 11, 0.4, '#f7dc8a', { glow: true });
  box(win, 12, 1, 0.4, -5, 1, 0.35, '#14243a', { glow: true });
  const rain = [];
  for (let i = 0; i < 14; i++) rain.push(box(win, 0.7, 3.5, 0.3, -12 + (i * 37 % 25), (i * 53) % 22, 0.5, '#5a93b8', { glow: true }));
  box(win, 34, 1.4, 1.4, 0, 25, 2, '#b9803d');
  const curtains = [-1, 1].map((sd) => {
    const c = group(win, sd * 15, 25, 2.2);
    for (let i = 0; i < 3; i++) box(c, 2, 26, 1.2, sd * (i * 1.9 - 1), -26, 0, i % 2 ? '#044a48' : '#087e78', { flat: true });
    box(c, 6.4, 1.6, 1.6, sd * 0.9, -17, 0.4, '#e0b060', { flat: true });
    return c;
  });
  box(room, 5, 4, 4, 14, 30, -43, '#6b4a33'); box(room, 3, 4, 3, 14, 34, -43, '#087e78'); box(room, 5, 2, 2, 15, 37, -43, '#3fb3a8');

  // 地板的縫、地毯的花紋
  for (let i = 1; i < 10; i++) box(room, 114, 0.3, 0.5, 0, 0, -45 + i * 9, '#2e1f1a', { flat: true });
  [[-30, -31], [22, -13], [-8, 5], [38, 23], [-40, 32], [10, 41]].forEach(([x, z]) => box(room, 0.5, 0.3, 9, x, 0, z, '#2e1f1a', { flat: true }));

  // 牆上的架子和藥瓶
  box(room, 24, 1.5, 6, -22, 40, -43, '#8f6a47');
  [['#3fb3a8', -31], ['#b9803d', -26], ['#cfd8d6', -21], ['#087e78', -16]].forEach(([c, x], i) => { box(room, 3, 5 + (i % 2) * 2, 3, x, 41.5, -43, c); box(room, 1.6, 1.4, 1.6, x, 46.5 + (i % 2) * 2, -43, '#6b4a33'); });

  // 左牆：委託板和值班鐘
  const board = group(room, -56.4, 26, 14);
  box(board, 1.4, 26, 34, 0, 0, 0, '#6b4a33'); box(board, 1.8, 2, 36, 0.2, 26, 0, '#8f6a47'); box(board, 1.8, 2, 36, 0.2, -2, 0, '#8f6a47');
  [['#f5f2ea', 3, -10, 9, 11], ['#e0b060', 15, -2, 8, 8], ['#f5f2ea', 4, 4, 10, 9], ['#cfd8d6', 15, 9, 7, 9]].forEach(([c, y, z, w, h]) => {
    box(board, 0.6, h, w, 0.9, y, z, c, { flat: true });
    box(board, 0.4, 0.8, w - 3, 1.3, y + h - 3, z, '#515a6b', { flat: true }); box(board, 0.4, 0.8, w - 4, 1.3, y + h - 5.5, z, '#515a6b', { flat: true });
  });
  box(board, 0.8, 2, 2, 1.1, 13, 4, '#a12635', { flat: true });
  const bellArm = group(room, 30, 60, -45);
  box(bellArm, 1.5, 1.5, 8, 0, 0, 3, '#5a3a1c');
  const bell = group(bellArm, 0, 0, 6);
  box(bell, 1, 3, 1, 0, -3, 0, '#5a3a1c'); box(bell, 4, 2, 4, 0, -5, 0, '#b9803d'); box(bell, 6, 4, 6, 0, -9, 0, '#b9803d'); box(bell, 7.4, 2, 7.4, 0, -11, 0, '#e0b060'); box(bell, 1.6, 2, 1.6, 0, -13, 0, '#5a3a1c');

  // 公會的旗幟
  const banner = group(room, 46, 54, -44.4);
  box(banner, 14, 1.4, 1.4, 0, 0, 0.4, '#b9803d');
  box(banner, 12, 22, 0.6, 0, -22, 0, '#087e78', { flat: true }); box(banner, 12, 2, 0.8, 0, -24, 0.1, '#e0b060', { flat: true });
  box(banner, 2, 2, 0.5, 0, -12, 0.5, '#f7dc8a', { flat: true }); box(banner, 6, 1, 0.5, 0, -11.5, 0.5, '#e0b060', { flat: true });
  box(banner, 1, 5, 0.5, 0, -15, 0.5, '#e0b060', { flat: true }); box(banner, 4, 1, 0.5, -3, -9, 0.5, '#e0b060', { flat: true }); box(banner, 4, 1, 0.5, 3, -9, 0.5, '#e0b060', { flat: true });

  // 藥櫃：一格一格的抽屜
  const cab = group(room, 44, 0, -39);
  box(cab, 24, 24, 9, 0, 0, 0, '#6b4a33'); box(cab, 26, 1.6, 10, 0, 24, 0, '#8f6a47'); box(cab, 26, 2, 10, 0, 0, 0, '#4a3226');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    box(cab, 4.8, 5.6, 0.8, -8.4 + c * 5.6, 3.4 + r * 6.8, 4.6, '#8f6a47', { flat: true });
    box(cab, 1.2, 1.2, 0.8, -8.4 + c * 5.6, 5.4 + r * 6.8, 5.2, '#e0b060', { flat: true });
    box(cab, 2.6, 1, 0.3, -8.4 + c * 5.6, 7.4 + r * 6.8, 5.1, '#f5f2ea', { flat: true });
  }
  box(cab, 5, 3, 5, -6, 25.6, 0, '#a3b3b8'); box(cab, 1.2, 5, 1.2, -4.5, 27, 1, '#8f6a47'); // 研缽
  box(cab, 6, 0.8, 4, 5, 25.6, 0, '#b9803d'); box(cab, 0.8, 4, 0.8, 5, 26.4, 0, '#b9803d'); box(cab, 7, 0.6, 0.8, 5, 30.4, 0, '#e0b060'); // 秤

  // 牆上的乾燥藥草、床邊的蠟燭、凳子、一疊書
  [[-50, 50, '#3fb3a8'], [-46, 52, '#8f6a47'], [-42, 50, '#087e78']].forEach(([x, y, c]) => { box(room, 0.6, 3, 0.6, x, y + 6, -44.4, '#6b4a33', { flat: true }); box(room, 2.6, 6, 1.6, x, y, -44.2, c, { flat: true }); });
  box(room, 2, 3.4, 2, 0.4, 13.5, -40, '#f5f2ea'); const flame = box(room, 1.2, 2, 1.2, 0.4, 17, -40, '#f7dc8a', { glow: true });
  box(room, 9, 1.6, 9, 44, 8, 26, '#8f6a47'); [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([x, z]) => box(room, 1.6, 8, 1.6, 44 + x, 0, 26 + z, '#6b4a33'));
  box(room, 9, 2, 6.4, 14, 0, 34, '#a12635'); box(room, 8, 2, 6, 14.6, 2, 34, '#1f3a5c'); box(room, 7, 1.6, 5.6, 14, 4, 34.2, '#b48a5e');

  // 床
  const bed = group(room, -30, 0, -30);
  box(bed, 46, 5, 26, 0, 3, 0, '#4a3226'); box(bed, 3, 26, 28, -23, 0, 0, '#4a3226'); box(bed, 3, 12, 28, 23, 0, 0, '#4a3226');
  box(bed, 3, 3, 28, -23, 26, 0, '#8f6a47');
  box(bed, 42, 4, 24, 0, 8, 0, '#cfd8d6'); box(bed, 9, 3, 16, -15, 12, -1, '#f5f2ea');
  box(bed, 14, 2, 25, 14, 12, 0, '#087e78'); box(bed, 3, 8, 25, 21.6, 5, 0, '#087e78'); box(bed, 14, 1, 25.4, 14, 13.6, 0, '#3fb3a8', { flat: true });
  box(bed, 5, 0.6, 3.4, 4, 12, 7, '#f5f2ea', { flat: true }); box(bed, 1.2, 0.5, 1.2, 4, 12.5, 7, '#a12635', { flat: true }); // 沒寄出的信
  box(room, 44, 0.6, 26, -24, 0, -2, '#5e1620', { flat: true }); box(room, 40, 0.5, 22, -24, 0.5, -2, '#a12635', { flat: true }); // 地毯
  box(room, 34, 0.4, 1, -24, 0.9, -11, '#e0b060', { flat: true }); box(room, 34, 0.4, 1, -24, 0.9, 7, '#e0b060', { flat: true });
  box(room, 1, 0.4, 17, -41, 0.9, -2, '#e0b060', { flat: true }); box(room, 1, 0.4, 17, -7, 0.9, -2, '#e0b060', { flat: true });
  [[-33, 0], [-24, 0], [-15, 0]].forEach(([x]) => { const d = box(room, 4, 0.4, 4, x, 0.9, -2, '#e0606a', { flat: true }); d.rotation.y = Math.PI / 4; });
  box(room, 3, 1.4, 5, -14, 0, 3, '#8f6a47'); box(room, 3, 1.4, 5, -10, 0, 4, '#8f6a47'); // 拖鞋

  // 床邊桌
  box(room, 12, 12, 10, 6, 0, -38, '#6b4a33'); box(room, 14, 1.5, 12, 6, 12, -38, '#8f6a47');
  box(room, 6, 2.5, 6, 5, 13.5, -38, '#cfd8d6'); box(room, 2.4, 3, 2.4, 10, 13.5, -36, '#3fb3a8');

  // 林秋的銅箱和小燈
  const kit = group(room, -8, 0, 12);
  box(kit, 12, 7, 8, 0, 0, 0, '#8a5a2b'); box(kit, 12.6, 1.4, 8.6, 0, 7, 0, '#b9803d'); box(kit, 5, 1, 1, 0, 9.4, 0, '#5a3a1c'); box(kit, 1, 1.6, 1, -2.5, 8.4, 0, '#5a3a1c'); box(kit, 1, 1.6, 1, 2.5, 8.4, 0, '#5a3a1c');
  box(kit, 2, 2, 0.6, 0, 2.5, 4.2, '#e0b060');
  const lampCore = box(kit, 3, 4, 3, 10, 2, 2, '#f7dc8a', { glow: true });
  box(kit, 4.4, 1.4, 4.4, 10, 0.6, 2, '#5a3a1c'); box(kit, 4.4, 1.2, 4.4, 10, 6, 2, '#5a3a1c'); box(kit, 1.2, 1.6, 1.2, 10, 7.2, 2, '#b9803d');
  boxLamp.position.set(2, 8, 16);

  // 吊燈
  const lamp = group(scene, 2, 86, 2);
  for (let i = 0; i < 6; i++) box(lamp, 1, 3, 1, 0, -4 - i * 4, 0, i % 2 ? '#515a6b' : '#2a2f3a', { flat: true });
  box(lamp, 9, 1.6, 9, 0, -29, 0, '#8a5a2b'); box(lamp, 5, 2, 5, 0, -27.4, 0, '#b9803d'); box(lamp, 9, 1.6, 9, 0, -38, 0, '#8a5a2b');
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => box(lamp, 1, 8, 1, x, -37, z, '#5a3a1c', { flat: true }));
  const lampGlow = box(lamp, 6, 6.4, 6, 0, -36.4, 0, '#f7dc8a', { glow: true });

  // ── 人物：方塊零件，關節可以轉 ──
  function limb(parent, w, len, d, x, y, z, color) { const g = group(parent, x, y, z); box(g, w, len, d, 0, -len, 0, color); return g; }
  function face(head, skin, o) {
    const eyes = [box(head, 2.2, o.eyeH, 0.6, -2.8, 4.6, 5.1, '#0a0d14', { glow: true }), box(head, 2.2, o.eyeH, 0.6, 2.8, 4.6, 5.1, '#0a0d14', { glow: true })];
    const bl = box(head, 3.4, 1.2, 0.6, -2.8, 7.6, 5.1, o.brow, { flat: true }), br = box(head, 3.4, 1.2, 0.6, 2.8, 7.6, 5.1, o.brow, { flat: true });
    bl.rotation.z = -o.browTilt; br.rotation.z = o.browTilt;
    const mouth = box(head, o.mouthW, 1, 0.6, 0, 1.8, 5.1, '#7a4a3a', { flat: true });
    const shine = [box(head, 0.8, 0.8, 0.3, -3.3, 4.6 + o.eyeH - 0.9, 5.5, '#f5f2ea', { glow: true }), box(head, 0.8, 0.8, 0.3, 2.3, 4.6 + o.eyeH - 0.9, 5.5, '#f5f2ea', { glow: true })];
    box(head, 2, 1, 0.3, -4.2, 2.8, 5.1, '#c98a6a', { flat: true }); box(head, 2, 1, 0.3, 4.2, 2.8, 5.1, '#c98a6a', { flat: true });
    return { eyes, brows: [bl, br], mouth, shine, tilt: o.browTilt };
  }

  // 林秋：坐在床邊，手按著胸口
  const lin = group(scene, -24, 12, -17);
  box(lin, 5, 5, 11, -3.2, 0, 5.5, '#515a6b'); box(lin, 5, 5, 11, 3.2, 0, 5.5, '#515a6b');
  box(lin, 5, 11, 5, -3.2, -11, 9, '#515a6b'); box(lin, 5, 11, 5, 3.2, -11, 9, '#515a6b');
  box(lin, 5.6, 3, 8, -3.2, -12, 10, '#2e1f1a'); box(lin, 5.6, 3, 8, 3.2, -12, 10, '#2e1f1a');
  const linBody = group(lin, 0, 3, 0);
  linBody.rotation.x = 0.12;
  box(linBody, 13, 14, 7.4, 0, 0, 0, '#b48a5e'); box(linBody, 9.6, 11, 0.8, 0, 0, 3.9, '#4a3226'); box(linBody, 1.2, 1.2, 0.6, -3, 9, 4.4, '#b9803d', { flat: true }); box(linBody, 1.2, 1.2, 0.6, 3, 9, 4.4, '#b9803d', { flat: true });
  
  const linArmL = limb(linBody, 4, 12, 4, -8.6, 13.5, 0, '#b48a5e'); linArmL.rotation.z = -0.12; box(linArmL, 4.2, 3, 4.2, 0, -14.6, 0, '#f0c2a0');
  const linArmR = group(linBody, 8.6, 13.5, 0);
  box(linArmR, 4, 7, 4, 0, -7, 1, '#b48a5e'); box(linArmR, 9, 4, 4, -4.4, -8.6, 4.2, '#b48a5e'); box(linArmR, 4.4, 4.4, 2.4, -8.6, -8.8, 5.6, '#f0c2a0');
  const linHead = group(linBody, 0, 14, 0.6);
  linHead.rotation.set(0.06, 0.3, 0.05);
  box(linHead, 11, 11, 10, 0, 0, 0, '#f0c2a0'); box(linHead, 11.3, 3, 10.3, 0, 0, 0, '#c98a6a');
  box(linHead, 11.8, 3.4, 10.8, 0, 9, -0.2, '#515a6b'); box(linHead, 11.8, 8, 3, 0, 3, -4.2, '#515a6b'); box(linHead, 3, 3.6, 4, -4.6, 9.2, 3.4, '#a3b3b8');
  box(linHead, 1.2, 5, 5, -5.6, 4, -1, '#515a6b'); box(linHead, 1.2, 5, 5, 5.6, 4, -1, '#515a6b');
  const linFace = face(linHead, '#f0c2a0', { eyeH: 1.4, brow: '#515a6b', browTilt: -0.5, mouthW: 3 });
  const linEyes = linFace.eyes;
  linFace.shine.forEach((m) => { m.visible = false; });
  box(linHead, 5.4, 1.2, 0.5, 0, 2.9, 5.2, '#8792a3', { flat: true }); box(linHead, 2, 0.8, 0.4, -2.8, 3.6, 5.1, '#c98a6a', { flat: true }); box(linHead, 2, 0.8, 0.4, 2.8, 3.6, 5.1, '#c98a6a', { flat: true });
  box(linBody, 1.6, 6, 0.6, -3.6, 9, 3.9, '#2e1f1a', { flat: true }); box(linBody, 1.6, 6, 0.6, 3.6, 9, 3.9, '#2e1f1a', { flat: true });
  box(linBody, 5, 3.6, 0.6, -1.6, 1.4, 4.5, '#6b4a33', { flat: true }); box(linBody, 1, 3, 0.8, -2.6, 4.4, 4.7, '#e0b060', { flat: true }); box(linBody, 1, 2, 0.8, -0.8, 4.4, 4.7, '#8792a3', { flat: true });
  box(linArmL, 4.6, 1.6, 4.6, 0, -9.4, 0, '#f5f2ea', { flat: true });
  const sweat2 = box(linHead, 0.9, 1.4, 0.6, -5, 5, 4.6, '#9cc7d8', { glow: true });
  const sweat = box(linHead, 1, 1.8, 0.6, 4.4, 6, 5.2, '#9cc7d8', { glow: true });

  // 岑禾：站在旁邊，抱著紀錄板
  const cen = group(scene, 27, 0, 14);
  cen.rotation.y = -0.32;
  const cenLegL = limb(cen, 5, 12, 5, -3, 12, 0, '#14243a'), cenLegR = limb(cen, 5, 12, 5, 3, 12, 0, '#14243a');
  box(cenLegL, 5.6, 4, 6.4, 0, -12, 0.6, '#2e1f1a'); box(cenLegR, 5.6, 4, 6.4, 0, -12, 0.6, '#2e1f1a');
  const cenBody = group(cen, 0, 10, 0);
  box(cenBody, 14.4, 10, 8.6, 0, 0, 0, '#2f5f8a'); box(cenBody, 13, 13, 7.4, 0, 9, 0, '#2f5f8a');
  box(cenBody, 13.6, 1.6, 8, 0, 8.6, 0, '#b9803d'); box(cenBody, 2, 2, 0.8, 0, 8.4, 4, '#e0b060', { flat: true });
  box(cenBody, 1.2, 9, 0.6, 0, 0, 4.4, '#b9803d', { flat: true });
  [13, 16.5].forEach((y) => box(cenBody, 1.2, 1.2, 0.6, 2.6, y, 3.9, '#e0b060', { flat: true }));
  box(cenBody, 10, 2.6, 8.2, 0, 20, 0, '#087e78'); box(cenBody, 3, 7, 1, -3.4, 14, 4, '#087e78'); box(cenBody, 3, 1.2, 1.2, -3.4, 13.4, 4.1, '#3fb3a8', { flat: true });
  const cenArmR = limb(cenBody, 4, 12, 4, 8.6, 21.5, 0, '#2f5f8a'); cenArmR.rotation.z = 0.1; box(cenArmR, 4.2, 3, 4.2, 0, -14.6, 0, '#f0c2a0'); box(cenArmR, 4.4, 1.4, 4.4, 0, -12, 0, '#b9803d', { flat: true });
  const cenArmL = group(cenBody, -8.6, 21.5, 0);
  box(cenArmL, 4, 7, 4, 0, -7, 1, '#2f5f8a'); box(cenArmL, 4, 4, 8, 0.6, -8.6, 4, '#2f5f8a'); box(cenArmL, 4.2, 3.4, 2.6, 1.6, -8.4, 8.4, '#f0c2a0');
  const clip = group(cenArmL, 5.6, -9.6, 7.6); clip.rotation.set(-0.5, 0.25, 0);
  box(clip, 9, 12, 0.8, 0, 0, 0, '#8f6a47'); box(clip, 7.6, 10, 0.5, 0, 0.6, 0.5, '#f5f2ea', { flat: true }); box(clip, 3.4, 1.6, 0.8, 0, 11, 0.6, '#b9803d', { flat: true });
  [3, 5.5, 8].forEach((y, i) => box(clip, 5.6 - i, 0.7, 0.3, -0.4, y, 0.9, '#74858f', { flat: true }));
  const cenHead = group(cenBody, 0, 22.4, 0);
  box(cenHead, 11, 11, 10, 0, 0, 0, '#f0c2a0');
  box(cenHead, 11.8, 4, 10.8, 0, 8.6, -0.2, '#2e1f1a'); box(cenHead, 11.8, 9, 3.4, 0, 2.4, -4.2, '#2e1f1a');
  box(cenHead, 1.4, 7, 6, -5.6, 3.6, -0.6, '#2e1f1a'); box(cenHead, 1.4, 7, 6, 5.6, 3.6, -0.6, '#2e1f1a'); box(cenHead, 5, 2, 1, -2.6, 8.6, 5.2, '#2e1f1a');
  box(cenHead, 6, 6, 5, 0, 8.6, -7.6, '#2e1f1a'); box(cenHead, 7, 1.4, 1.4, 0, 11, -5.2, '#b9803d', { flat: true });
  const cenFace = face(cenHead, '#f0c2a0', { eyeH: 2.4, brow: '#2e1f1a', browTilt: 0.05, mouthW: 2.6 });
  const cenEyes = cenFace.eyes;
  box(cenHead, 6.6, 1.6, 5.6, 0, 8, -7.6, '#087e78', { flat: true }); box(cenHead, 3, 2.4, 1, 3.4, 8.4, 5.2, '#2e1f1a'); box(cenHead, 1.4, 4, 1, 5.2, 5, 5, '#2e1f1a');
  box(cenBody, 2.2, 8, 0.6, -2.6, 12.6, 3.9, '#5a93b8', { flat: true }); box(cenBody, 2.2, 8, 0.6, 2.6, 12.6, 3.9, '#5a93b8', { flat: true });
  box(cenBody, 2.4, 2.4, 0.6, 4.2, 15, 4.2, '#e0b060', { flat: true }); box(cenBody, 1, 1, 0.6, 4.2, 15.7, 4.5, '#f7dc8a', { glow: true });
  box(cenBody, 4, 1.4, 0.6, -4, 4, 4.5, '#14243a', { flat: true }); box(cenBody, 3, 0.6, 0.5, 3.6, 11.4, 4.2, '#e0b060', { flat: true });
  const scarfTail = group(cenBody, -3.4, 14, 4.2); box(scarfTail, 3, 6, 0.8, 0, -6, 0, '#3fb3a8', { flat: true }); box(scarfTail, 3, 1, 0.9, 0, -6, 0.1, '#e0b060', { flat: true });
  const pen = box(cenArmR, 0.8, 5, 0.8, 0.6, -18.4, 1.6, '#f5f2ea', { flat: true }); box(cenArmR, 0.9, 1.2, 0.9, 0.6, -18.8, 1.6, '#0a0d14', { flat: true });

  // ── 症影：鐵翅蛾 ──
  const mothMats = [];
  const mm = (hex) => { const m = new THREE.MeshLambertMaterial({ color: hex, flatShading: true }); m.userData.base = new THREE.Color(hex); mothMats.push(m); return m; };
  const moth = group(scene, -50, 47, -12);
  moth.scale.setScalar(1.15);
  moth.rotation.set(1.0, 0.56, 0);
  const steelD = mm('#2a2f3a'), steel = mm('#515a6b'), steelL = mm('#8792a3'), steelH = mm('#c3ccd6'), brass = mm('#b9803d'), fuzz = mm('#a3b3b8'), rust = mm('#8a5a2b');
  box(moth, 7, 7, 8, 0, -3.5, 0, '', { mat: steelD }); box(moth, 8.4, 3, 8.6, 0, 1.6, 0.4, '', { mat: fuzz });
  box(moth, 6, 6, 4.4, 0, -3.2, -6, '', { mat: steel }); box(moth, 6.4, 1.2, 4.6, 0, -1, -6, '', { mat: brass });
  box(moth, 5, 5, 4.4, 0, -3, -10.2, '', { mat: steelD }); box(moth, 5.4, 1.2, 4.6, 0, -1.2, -10.2, '', { mat: brass });
  box(moth, 3.6, 3.6, 4, 0, -2.4, -14.2, '', { mat: steel });
  const mothHead = group(moth, 0, -0.5, 5.6);
  box(mothHead, 6, 5, 4.6, 0, -2.5, 0, '', { mat: steel });
  const mothEyes = [box(mothHead, 2, 2.2, 1, -2, -1.4, 2.4, '#e0b060', { glow: true }), box(mothHead, 2, 2.2, 1, 2, -1.4, 2.4, '#e0b060', { glow: true })];
  const antenna = [-1, 1].map((s) => {
    const a = group(mothHead, s * 1.8, 2.4, 1);
    a.rotation.set(-0.5, 0, s * -0.5);
    box(a, 0.9, 8, 0.9, 0, 0, 0, '', { mat: steelL });
    for (let i = 0; i < 4; i++) box(a, 3.4 - i * 0.5, 0.7, 0.7, s * 1.2, 2 + i * 1.7, 0, '', { mat: fuzz });
    return a;
  });
  const spots = [];
  const wings = [-1, 1].map((s) => {
    const fore = group(moth, s * 3.4, 0.6, 1);
    box(fore, 15, 0.9, 10, s * 7.5, 0, 0, '', { mat: steel }); box(fore, 8, 0.9, 7, s * 17, 0, -1, '', { mat: steelL });
    box(fore, 13, 0.5, 1.2, s * 8, 0.9, 3.4, '', { mat: brass }); box(fore, 10, 0.5, 1, s * 9, 0.9, -1, '', { mat: rust });
    [[5, 1.5], [15, 1]].forEach(([x, z]) => box(fore, 1.2, 0.5, 1.2, s * x, 0.9, z, '', { mat: steelH }));
    box(fore, 5, 0.5, 5, s * 11, 0.9, -1.4, '', { mat: brass }); spots.push(box(fore, 2.6, 0.5, 2.6, s * 11, 1.3, -1.4, '#a12635', { glow: true }));
    const hind = group(moth, s * 3, -1, -5);
    box(hind, 10, 0.8, 8, s * 5, 0, 0, '', { mat: steelD }); box(hind, 6, 0.5, 1, s * 5, 0.8, 0, '', { mat: brass });
    return { fore, hind, s };
  });
  [-1, 1].forEach((s) => [2, -1, -4].forEach((z) => { const l = limb(moth, 0.8, 5, 0.8, s * 2.6, -3.5, z, ''); l.children[0].material = steelL; l.rotation.z = s * 0.5; }));

  // 霧：一團一團圍著症影
  const fogColor = new THREE.Color('#a3b3b8');
  const puffs = [];
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  [['#cfd8d6', 1, 1, 7, 8], ['#a3b3b8', -9, -2, 3, 8], ['#a3b3b8', 10, 0, 4, 7.5], ['#74858f', 2, -8, 4, 8], ['#cfd8d6', -6, 6, 0, 6.5],
   ['#74858f', 8, 7, -2, 6.5], ['#a3b3b8', -2, -3, 11, 6], ['#74858f', -12, 5, -4, 5.5], ['#f5f2ea', 12, -6, -2, 5]].forEach(([c, x, y, z, r], i) => {
    const mat = new THREE.ShaderMaterial({ vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, uniforms: { color: { value: new THREE.Color(c) }, alpha: { value: 0.7 } } });
    const m = new THREE.Mesh(puffGeo, mat);
    m.userData = { home: new THREE.Vector3(x, y, z), r, phase: i * 1.7, layer: i };
    moth.parent.add(m);
    puffs.push(m);
  });
  const mist = [];
  const motes = [];
  for (let i = 0; i < 12; i++) { const m = box(scene, 0.7, 0.7, 0.7, 0, 0, 0, '#f7dc8a', { glow: true }); m.userData = { a: i * 2.4, r: 8 + (i * 7) % 22, y: 14 + (i * 11) % 34, sp: 0.12 + (i % 5) * 0.03 }; motes.push(m); }
  const scales = [];
  for (let i = 0; i < 9; i++) { const m = box(scene, 0.7, 0.7, 0.7, 0, 0, 0, '#c3ccd6', { glow: true }); m.userData = { off: i / 9, dx: ((i * 37) % 17) - 8, dz: ((i * 53) % 11) - 5 }; scales.push(m); }
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.ShaderMaterial({ vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, uniforms: { color: { value: new THREE.Color('#cfd8d6') }, alpha: { value: 0.4 } } });
    const m = new THREE.Mesh(puffGeo, mat); m.userData = { off: i / 3 }; scene.add(m); steam.push(m);
  }

  // ── 後製：輪廓加色盤 ──
  const target = new THREE.WebGLRenderTarget(180, 150, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  target.depthTexture = new THREE.DepthTexture(180, 150);
  const post = new THREE.ShaderMaterial({
    vertexShader: POST_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      tColor: { value: target.texture }, tDepth: { value: target.depthTexture }, texel: { value: new THREE.Vector2(1 / 180, 1 / 150) },
      palette: { value: PALETTE.map((h) => { const c = new THREE.Color(); c.setStyle(h, THREE.LinearSRGBColorSpace); return new THREE.Vector3(c.r, c.g, c.b); }) },
      dither: { value: 0.022 }, edge: { value: 0.006 }, flash: { value: new THREE.Vector3(1, 0.95, 0.8) }, flashAmt: { value: 0 },
    },
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── 鏡頭：立體（斜上方看整個房間）和平面（正面看，像舞台）──
  const VIEW = {
    iso: { yaw: 0.56, pitch: 0.42, look: new THREE.Vector3(-10, 22, -6), div: 118, lo: 1.25, hi: 1.7, moth: new THREE.Vector3(-50, 47, -12), tilt: 1.0 },
    flat: { yaw: 0, pitch: 0.14, look: new THREE.Vector3(-3, 30, 0), div: 76, lo: 1.5, hi: 2.6, moth: new THREE.Vector3(-26, 50, -30), tilt: 1.3 },
  };
  const look = new THREE.Vector3();
  const MOTH = new THREE.Vector3();
  const camHome = new THREE.Vector3();
  let W = 180, H = 150;
  const lerp = (a, b, k) => a + (b - a) * k;
  function aim(k) {
    const A = VIEW.iso, B = VIEW.flat;
    const yaw = lerp(A.yaw, B.yaw, k), pitch = lerp(A.pitch, B.pitch, k);
    look.lerpVectors(A.look, B.look, k);
    MOTH.lerpVectors(A.moth, B.moth, k);
    camHome.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(220).add(look);
    const zoom = (v) => Math.max(v.lo, Math.min(v.hi, H / v.div));
    camera.zoom = lerp(zoom(A), zoom(B), k);
    camera.updateProjectionMatrix();
    return { yaw, tilt: lerp(A.tilt, B.tilt, k) };
  }
  function resize(w, h) {
    W = w; H = h;
    renderer.setSize(w, h, false);
    target.setSize(w, h);
    post.uniforms.texel.value.set(1 / w, 1 / h);
    camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }

  // ── 狀態和動態 ──
  const state = { veil: 1, veilShown: 1, clue: 0, bell: 0, shake: 0, flash: 0, slump: 0, slumpShown: 0, still: false, flat: 0, flatShown: 0, talker: null };
  const tmp = new THREE.Color();
  function update(t, dt) {
    const s = state;
    const live = s.still ? 0 : 1;
    s.veilShown += (s.veil - s.veilShown) * Math.min(1, dt * 3);
    s.slumpShown += (s.slump - s.slumpShown) * Math.min(1, dt * 2);
    s.clue = Math.max(0, s.clue - dt * 1.6); s.bell = Math.max(0, s.bell - dt * 0.5); s.shake = Math.max(0, s.shake - dt * 3); s.flash = Math.max(0, s.flash - dt * 4);
    const v = s.veilShown;
    s.flatShown += (s.flat - s.flatShown) * Math.min(1, dt * 4);
    const kView = s.flatShown * s.flatShown * (3 - 2 * s.flatShown);
    const cam = aim(kView);

    // 林秋：呼吸偏快，越不舒服越往前彎
    const breath = Math.sin(t * 2.6) * live;
    linBody.scale.y = 1 + breath * 0.025;
    linBody.rotation.x = 0.12 + s.slumpShown * 0.26 + breath * 0.012;
    linHead.rotation.x = 0.06 + s.slumpShown * 0.3 + Math.sin(t * 1.3) * 0.03 * live;
    linArmR.position.y = 13.5 + breath * 0.25;
    sweat.position.y = 6.9 - ((t * 0.9) % 3) * 1.3; sweat.visible = (t * 0.9) % 3 < 2.2;
    // 每隔幾秒痛一下：眉頭更緊、眼睛閉起來、肩膀縮一下、手在胸口揉
    const wince = Math.max(0, Math.sin(t * 1.15)) ** 14 * live;
    linEyes.forEach((e) => { e.scale.y = (s.slumpShown > 0.5 ? 0.7 : 1.4) * (1 - wince * 0.7); });
    linFace.brows.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * (linFace.tilt - wince * 0.3); b.position.y = 8.2 - wince * 0.6; });
    linBody.scale.x = 1 - wince * 0.03;
    linArmR.position.x = 8.6 + Math.sin(t * 3.1) * 0.35 * live; linArmR.position.z = Math.cos(t * 3.1) * 0.3 * live;
    sweat2.position.y = 5.6 - ((t * 0.7 + 1.3) % 3.4) * 1.1; sweat2.visible = (t * 0.7 + 1.3) % 3.4 < 2.4;
    linFace.mouth.scale.x = 3 - wince * 1.2;

    // 岑禾：呼吸慢、偶爾眨眼、低頭看紀錄板
    const cb = Math.sin(t * 1.4) * live;
    cenBody.scale.y = 1 + cb * 0.012; cenBody.rotation.z = Math.sin(t * 0.5) * 0.015 * live;
    const blink = (t % 4.2) < 0.12 ? 0.15 : 1;
    cenEyes.forEach((e) => { e.scale.y = 2.4 * blink; });
    const glance = Math.max(0, Math.sin(t * 0.35 + 1)) ** 6;
    cenHead.rotation.set(glance * 0.3, 0.25 - glance * 0.2 + s.bell * 0.3 * Math.sin(t * 9), 0);
    clip.rotation.x = -0.5 + cb * 0.02;
    // 偶爾在紀錄板上寫幾個字
    const writing = Math.max(0, Math.sin(t * 0.45 + 2)) ** 5 * live;
    cenArmR.rotation.x = -writing * 1.25; cenArmR.rotation.z = 0.1 - writing * 0.5 + Math.sin(t * 16) * 0.05 * writing;
    scarfTail.rotation.z = Math.sin(t * 1.8) * 0.12 * live; scarfTail.rotation.x = Math.sin(t * 1.3) * 0.06 * live;
    cenFace.mouth.scale.x = s.talker === 'cen' ? 2.6 * (0.6 + 0.4 * Math.abs(Math.sin(t * 14))) : 2.6;
    cenFace.mouth.scale.y = s.talker === 'cen' ? 1 + Math.abs(Math.sin(t * 14)) * 1.4 : 1;
    if (s.talker === 'lin') { linFace.mouth.scale.y = 1 + Math.abs(Math.sin(t * 12)) * 1.2; } else linFace.mouth.scale.y = 1;

    // 症影：飄浮、拍翅。拿到線索的瞬間往後縮
    const flinch = Math.sin(Math.min(1, s.clue) * Math.PI);
    moth.position.set(MOTH.x - flinch * 3, MOTH.y + Math.sin(t * 1.7) * 1.6 * live + flinch * 2, MOTH.z - flinch * 2);
    moth.rotation.set(cam.tilt, cam.yaw + Math.sin(t * 0.6) * 0.1 * live, 0);
    const flap = 0.22 + Math.sin(t * (3.2 + flinch * 9)) * (0.2 + flinch * 0.3) * (live || 0.2);
    wings.forEach(({ fore, hind, s: side }) => { fore.rotation.z = side * flap; hind.rotation.z = side * (flap * 0.7 + 0.1); });
    antenna.forEach((a, i) => { a.rotation.x = -0.5 + Math.sin(t * 2.2 + i) * 0.12 * live; });
    const eyeGlow = ((t * 0.37) % 1 > 0.96 ? 0.05 : 0.75 + Math.sin(t * 3) * 0.25);
    mothEyes.forEach((e) => { e.material.color.set('#e0b060').multiplyScalar(eyeGlow * (1 - v * 0.6)); });
    spots.forEach((e) => { e.material.color.set('#a12635').lerp(fogColor, v * 0.9); });
    // 霧越濃，症影越接近霧的顏色，看不出細節
    mothMats.forEach((m) => { m.color.copy(tmp.copy(m.userData.base).lerp(fogColor, v * 0.92)); });

    // 霧：線索進來時被推開，之後留下的越來越少
    puffs.forEach((p) => {
      const u = p.userData;
      const keep = Math.max(0, Math.min(1, v * 9 - u.layer * 0.85));
      const push = 1 + flinch * 0.9 + (1 - v) * 0.5;
      p.position.set(
        moth.position.x + u.home.x * push + Math.sin(t * 0.5 + u.phase) * 2 * live,
        moth.position.y + u.home.y * push + Math.cos(t * 0.4 + u.phase) * 1.4 * live,
        moth.position.z + u.home.z * push);
      const r = u.r * (0.25 + 0.75 * keep) * (1 + Math.sin(t * 0.9 + u.phase) * 0.06 * live);
      p.scale.set(r, r * 0.82, r);
      p.rotation.y = t * 0.1 + u.phase;
      p.material.uniforms.alpha.value = u.layer < 5 ? (keep > 0.55 ? 1 : 0.8 * keep + 0.2) : 0.62 * keep;
      p.visible = keep > 0.02;
    });
    mist.forEach((m) => { m.position.x = m.userData.x + Math.sin(t * 0.25 + m.userData.phase) * 5 * live; m.material.uniforms.alpha.value = 0.26 + Math.sin(t * 0.4 + m.userData.phase) * 0.06; });

    // 吊燈：微微晃、火光閃
    const flick = 1 + (Math.sin(t * 11) * 0.03 + Math.sin(t * 23.7) * 0.02) * live + s.clue * 0.35;
    lantern.intensity = 7600 * flick; lamp.rotation.z = Math.sin(t * 0.8) * 0.025 * live;
    lampGlow.material.color.set('#f7dc8a').multiplyScalar(Math.min(1.15, flick));
    lampCore.material.color.set('#f7dc8a').multiplyScalar(0.9 + Math.sin(t * 7) * 0.08 * live);
    // 燈光裡飄的灰塵、症影掉下來的鱗粉、杯子的熱氣
    motes.forEach((m) => { const u = m.userData; const a = u.a + t * u.sp * live; m.position.set(2 + Math.cos(a) * u.r, u.y + Math.sin(t * 0.3 + u.a) * 3 * live, 2 + Math.sin(a) * u.r * 0.8); m.visible = Math.sin(t * 1.7 + u.a * 3) > -0.4; });
    scales.forEach((m) => { const u = m.userData; const f = (t * 0.22 + u.off) % 1; m.position.set(moth.position.x + u.dx + Math.sin(f * 9 + u.dx) * 1.5, moth.position.y - 4 - f * 26, moth.position.z + u.dz); m.visible = v < 0.9 && f < 0.85 && Math.sin(t * 9 + u.dx) > -0.2; });
    steam.forEach((m) => { const f = (t * 0.25 + m.userData.off) % 1; const r = 1 + f * 2.2; m.scale.set(r, r, r); m.position.set(10 + Math.sin(f * 6) * 1.2, 18 + f * 10, -36); m.material.uniforms.alpha.value = 0.5 * (1 - f); });
    // 窗外的燈塔一圈一圈掃過來、窗簾和旗幟輕輕晃、蠟燭
    const sweep = Math.max(0, Math.sin(t * 0.9)) ** 8;
    beacon.material.color.set('#f7dc8a').multiplyScalar(0.35 + sweep * 0.9);
    glass.material.color.set('#0f1826').lerp(tmp.set('#1f3a5c'), sweep * 0.8);
    curtains.forEach((c, i) => { c.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.03 * live; });
    banner.rotation.z = Math.sin(t * 0.7) * 0.025 * live;
    flame.scale.y = 2 * (1 + Math.sin(t * 13) * 0.18 * live); flame.position.x = 0.4 + Math.sin(t * 7) * 0.15 * live;
    // 雨
    rain.forEach((r, i) => { r.position.y = 22 - ((t * (26 + (i % 4) * 5) + i * 5.3) % 23); });
    // 值班鐘
    bell.rotation.x = Math.sin(t * 10) * 0.6 * s.bell;

    // 鏡頭震一下（對齊整數像素，畫面才不會糊）
    const k = s.shake * 2.2;
    camera.position.copy(camHome);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.translateX(Math.round(Math.sin(t * 61) * k)); camera.translateY(Math.round(Math.cos(t * 47) * k));
    post.uniforms.flashAmt.value = s.flash * 0.55;
  }

  function render() {
    renderer.setRenderTarget(target); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }

  const heads = { lin: [linHead, 15], cen: [cenHead, 16], moth: [moth, 10] };
  const pos = new THREE.Vector3();
  function anchor(who) {
    const h = heads[who];
    if (!h) return null;
    h[0].getWorldPosition(pos); pos.y += h[1]; pos.project(camera);
    return { x: (pos.x * 0.5 + 0.5) * W, y: (1 - (pos.y * 0.5 + 0.5)) * H };
  }

  resize(180, 150);
  return {
    state, resize, update, render, anchor,
    setFlat(on) { state.flat = on ? 1 : 0; },
    clue(step) { state.veil = Math.max(0.08, state.veil - step); state.clue = 1; state.flash = 0.5; },
    ring() { state.bell = 1; state.shake = 1; },
    worsen() { state.slump = 1; state.shake = 0.6; },
    reset() { Object.assign(state, { veil: 1, clue: 0, bell: 0, shake: 0, flash: 0, slump: 0 }); },
  };
}
