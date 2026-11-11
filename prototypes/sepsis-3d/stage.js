/*
 * 《黃金一小時》3D 試作：舞台（three.js）
 * 只負責「畫」：棋盤、角色、敵人、動畫、戰鬥回放。規則全部來自 rules/sim.js。
 * 模型由 tools/blender/build_models.py 產生（assets/models.glb）。
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const HEX_W = Math.sqrt(3);
const FLOOR_Y = -0.24;
const BG = 0x0c1920;
const SIM_SECONDS_PER_MIN = 0.2;          // 1× 速度：模擬 5 分鐘 = 1 秒
const STEP_MIN = 5;
const UNIT_SCALE = 0.84;
const PATIENT = new THREE.Vector3(-1.6, 1.0, -4.55);

const ROLE_COLOR = { assessor: 0x7aa7ea, interventionist: 0xf08a4b, coordinator: 0x6fcf86 };
const SKILL_COLOR = {
  measureLactate: 0xb794ff, fluid: 0x74c6ff, culture: 0xf3ad4e, optimize: 0x8fe0bb, antibiotic: 0xd6ff8a,
  support: 0xa5ecff, protocol: 0x36c2b9, vasopressor: 0xff8274, supervise: 0xffa08f, sourceControl: 0xf4f8fa,
};
const ENEMY_INFO = {
  pathogen: { scale: 0.9, height: 1.3, color: 0x8fd43a },
  hypotension: { scale: 1.02, height: 1.5, color: 0xe2564d },
  lactate: { scale: 0.95, height: 1.35, color: 0x9a6be0 },
  mods: { scale: 1.5, height: 2.05, color: 0x8a6fd0 },
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = {
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inOut: (k) => 0.5 - 0.5 * Math.cos(Math.PI * k),
  outBack: (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};

// 我方 8 格：0–3 前排（靠近病灶，先出手）、4–7 後排
export function slotPosition(i) {
  const front = i < 4;
  return new THREE.Vector3((i % 4 - 1.5) * HEX_W + (front ? HEX_W / 4 : -HEX_W / 4), 0, front ? 1.05 : 2.55);
}
// 病灶側 8 格：0–3 前排、4–7 後排
export function enemyHexPosition(i) {
  const front = i < 4;
  return new THREE.Vector3((i % 4 - 1.5) * HEX_W + (front ? -HEX_W / 4 : HEX_W / 4), 0, front ? -1.05 : -2.55);
}

function layoutEnemies(list) {
  const front = [1, 2, 0, 3];
  const back = [5, 6, 4, 7];
  const used = new Set();
  const take = (order) => { const h = order.find((x) => !used.has(x)); if (h !== undefined) used.add(h); return h; };
  const out = new Array(list.length);
  list.forEach((e, i) => {
    if (e.kind === 'mods') { used.add(5); used.add(6); out[i] = new THREE.Vector3(0.2, 0, -2.35); }
  });
  list.forEach((e, i) => { if (e.kind === 'lactate') { used.add(7); out[i] = enemyHexPosition(7); } });
  list.forEach((e, i) => { if (e.kind === 'hypotension') out[i] = enemyHexPosition(take(front)); });
  list.forEach((e, i) => {
    if (out[i]) return;
    let h = take(front);
    if (h === undefined) h = take(back);
    out[i] = enemyHexPosition(h === undefined ? 4 : h);
  });
  return out;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 有些靜態主機不提供 .glb 這種檔案類型。讀不到時改讀同一份模型的 base64 文字版
//（base64 -w0 models.glb > models.glb.b64.txt）。
async function fetchModel(url) {
  try {
    const r = await fetch(url);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 4 && new TextDecoder().decode(new Uint8Array(buf, 0, 4)) === 'glTF') return buf;
    }
  } catch (e) { /* 改讀文字版 */ }
  const r = await fetch(url + '.b64.txt');
  if (!r.ok) throw new Error('模型載入失敗：' + url);
  const bin = atob((await r.text()).trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export class Stage {
  constructor({ canvas, labels, units, reducedMotion }) {
    this.canvas = canvas;
    this.labelRoot = labels;
    this.unitDefs = units;                 // id → { skill, roles, short }
    this.reducedMotion = !!reducedMotion;
    this.onPick = null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 26, 54);
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    this.probe = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    this.pitch = THREE.MathUtils.degToRad(47);
    this.cam = { target: new THREE.Vector3(0, 0.5, -0.2), dist: 20 };
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.size = { w: 1, h: 1 };

    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.32;
    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x2a2f3d, 0.9));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
    key.position.set(-5.5, 11, 7.5);
    key.target.position.set(0, 0, -1);
    key.castShadow = true;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.035;
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, near: 1, far: 40 });
    scene.add(key, key.target);
    this.keyLight = key;
    const rim = new THREE.DirectionalLight(0x6fd8ff, 0.9);
    rim.position.set(5, 5, -9);
    scene.add(rim);
    const mood = new THREE.PointLight(0xc65cff, 16, 10, 2);     // 病灶側的紫色氣氛光
    mood.position.set(0, 2.6, -2.2);
    scene.add(mood);
    this.moodLight = mood;

    this.glowTex = glowTexture();
    this.templates = {};
    this.tiles = { own: [], enemy: [] };
    this.slotTags = [];
    this.unitActors = new Map();           // id → actor
    this.board = new Array(8).fill(null);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.rings = [];
    this.bubbles = [];
    this.queue = [];
    this.mode = 'prep';
    this.speed = 1;
    this.clock = 0;
    this.time = 0;
    this.trauma = 0;
    this.selSlot = -1;
    this.hintSlots = false;
    this.hooks = null;
    this.result = null;
    this._v = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._ray = new THREE.Raycaster();
    this._down = null;

    canvas.addEventListener('pointerdown', (e) => { this._down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', (e) => {
      const d = this._down;
      this._down = null;
      if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
      const slot = this._pick(e.clientX, e.clientY);
      if (slot >= 0 && this.onPick) this.onPick(slot);
    });
  }

  // ───────────── 載入與場景 ─────────────
  async load(url) {
    const gltf = await new GLTFLoader().parseAsync(await fetchModel(url), '');
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.children.slice().forEach((root) => {
      root.position.set(0, 0, 0);
      this.templates[root.name] = root;
    });
    this._buildEnvironment();
    this.last = performance.now();
    this.renderer.setAnimationLoop((now) => this._frame(now));
  }

  _prop(name, { x = 0, z = 0, yaw = 0, scale = 1, y = FLOOR_Y }) {
    const o = this.templates[name].clone(true);
    o.position.set(x, y, z);
    o.rotation.y = yaw;
    o.scale.setScalar(scale);
    o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    this.scene.add(o);
    return o;
  }

  _buildEnvironment() {
    const scene = this.scene;
    // 地板（淡淡的地磚線）
    const gc = document.createElement('canvas');
    gc.width = gc.height = 128;
    const g = gc.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.2)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 126, 126);
    const grid = new THREE.CanvasTexture(gc);
    grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
    grid.repeat.set(36, 36);
    grid.colorSpace = THREE.SRGBColorSpace;
    grid.anisotropy = 4;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a3742, roughness: 0.9, map: grid }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);
    // 棋盤下方的光暈
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(26, 20),
      new THREE.MeshBasicMaterial({ map: this.glowTex, color: 0x2c7f8c, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, FLOOR_Y + 0.01, -0.4);
    scene.add(pool);
    // 後牆與床頭設備帶
    const wall = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 0.4), new THREE.MeshStandardMaterial({ color: 0x1b3440, roughness: 0.95 }));
    wall.position.set(0, FLOOR_Y + 4, -7.7);
    wall.receiveShadow = true;
    scene.add(wall);
    const band = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: 0x24505c, roughness: 0.9 }));
    band.position.set(0, FLOOR_Y + 1.1, -7.69);
    scene.add(band);
    this._prop('env_rail', { z: -7.42, y: FLOOR_Y + 2.75 });
    this._prop('env_bed', { x: -0.55, z: -4.55 });
    this._prop('env_ivpole', { x: -3.3, z: -5.7, yaw: 0.2 });
    this._prop('env_cart', { x: -5.3, z: -4.3, yaw: 0.55 });
    const mon = this._prop('env_monitor', { x: 3.75, z: -4.85, yaw: -0.32 });
    this._buildMonitor(mon);

    // 六角格
    const tileSrc = this.templates.tile_hex.getObjectByProperty('isMesh', true);
    const mk = (pos, color) => {
      const m = new THREE.Mesh(tileSrc.geometry, tileSrc.material.clone());
      m.material.color.setHex(color);
      m.material.roughness = 0.7;
      m.position.copy(pos);
      m.scale.setScalar(0.955);
      m.receiveShadow = true;
      m.userData.base = new THREE.Color(color);
      scene.add(m);
      return m;
    };
    for (let i = 0; i < 8; i++) {
      const late = (i + 1) * 15 > 60;
      const t = mk(slotPosition(i), late ? 0xc9bd9c : 0x8fe0d6);
      t.userData.slot = i;
      this.tiles.own.push(t);
      const tag = document.createElement('div');
      tag.className = 'slot-tag' + (late ? ' late' : '');
      tag.innerHTML = '<b>' + (i + 1) + '</b><span>' + (i + 1) * 15 + '′</span>';
      this.labelRoot.appendChild(tag);
      this.slotTags.push({ el: tag, pos: slotPosition(i).add(new THREE.Vector3(0, 0, 0.8)) });
      this.tiles.enemy.push(mk(enemyHexPosition(i), 0x7d5a94));
    }
    // 床邊中線
    const mid = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.07), new THREE.MeshBasicMaterial({ color: 0x36c2b9, transparent: true, opacity: 0.7 }));
    mid.rotation.x = -Math.PI / 2;
    mid.position.set(0, FLOOR_Y + 0.02, 0);
    scene.add(mid);
  }

  _buildMonitor(mon) {
    const anchor = mon.getObjectByName('env_monitor__screen');
    const c = document.createElement('canvas');
    c.width = 416;
    c.height = 250;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.94), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    anchor.add(screen);
    this.monitor = { canvas: c, ctx: c.getContext('2d'), tex, vit: { hr: 100, map: 80, rr: 20, lac: null }, safety: 100, alarm: 0, phase: 0, acc: 0, trace: new Array(150).fill(0), head: 0 };
  }

  setVitals(v) { if (this.monitor) Object.assign(this.monitor.vit, v); }
  setSafety(n) { if (this.monitor) this.monitor.safety = n; }

  _drawMonitor(dt) {
    const m = this.monitor;
    if (!m) return;
    m.alarm = Math.max(0, m.alarm - dt);
    m.acc += dt;
    m.phase += dt * (m.vit.hr || 80) / 60;
    if (m.acc < 0.066) return;
    const steps = Math.max(1, Math.round(m.acc / 0.022));
    for (let s = 0; s < steps; s++) {
      const ph = (m.phase - (steps - s) * 0.022 * (m.vit.hr || 80) / 60) % 1;
      const p = (ph + 1) % 1;
      let y = 0;
      if (p > 0.10 && p < 0.18) y = 0.12 * Math.sin((p - 0.10) / 0.08 * Math.PI);
      else if (p > 0.24 && p < 0.27) y = -0.18;
      else if (p >= 0.27 && p < 0.31) y = 1.0 - Math.abs(p - 0.29) / 0.02 * 0.6;
      else if (p >= 0.31 && p < 0.34) y = -0.3;
      else if (p > 0.45 && p < 0.62) y = 0.22 * Math.sin((p - 0.45) / 0.17 * Math.PI);
      m.trace[m.head] = y;
      m.head = (m.head + 1) % m.trace.length;
    }
    m.acc = 0;
    const g = m.ctx;
    const W = m.canvas.width;
    const H = m.canvas.height;
    g.fillStyle = m.alarm > 0 && Math.floor(m.alarm * 8) % 2 === 0 ? '#3a0d10' : '#04100f';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(70,210,127,0.12)';
    g.lineWidth = 1;
    for (let x = 0; x < 270; x += 27) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 150); g.stroke(); }
    g.strokeStyle = '#46d27f';
    g.lineWidth = 3;
    g.beginPath();
    const n = m.trace.length;
    for (let i = 0; i < n; i++) {
      const idx = (m.head + i) % n;
      const x = 8 + i * (254 / n);
      const y = 96 - m.trace[idx] * 62;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    g.textBaseline = 'alphabetic';
    const num = (label, value, color, y) => {
      g.fillStyle = color;
      g.font = '600 19px "IBM Plex Mono", ui-monospace, monospace';
      g.textAlign = 'left';
      g.fillText(label, 284, y - 36);
      g.font = '600 46px "IBM Plex Mono", ui-monospace, monospace';
      g.fillText(value, 284, y);
    };
    num('HR', m.vit.hr == null ? '--' : String(m.vit.hr), '#46d27f', 70);
    num('MAP', m.vit.map == null ? '--' : String(m.vit.map), '#ff6b5e', 150);
    num('LAC', m.vit.lac == null ? '--' : String(m.vit.lac), '#a990ff', 230);
    g.fillStyle = '#9fb0bb';
    g.font = '600 18px "IBM Plex Mono", ui-monospace, monospace';
    g.fillText('SAFETY', 12, 182);
    const s = Math.max(0, Math.min(100, m.safety));
    g.fillStyle = '#12303a';
    g.fillRect(12, 194, 250, 30);
    g.fillStyle = s > 60 ? '#5fcf85' : s > 30 ? '#f0a64a' : '#ff7a6e';
    g.fillRect(12, 194, 250 * s / 100, 30);
    g.fillStyle = '#e6eef2';
    g.font = '600 24px "IBM Plex Mono", ui-monospace, monospace';
    g.fillText(String(Math.round(s)), 104, 184);
    m.tex.needsUpdate = true;
  }

  // ───────────── 鏡頭 ─────────────
  setInsets(insets) {
    Object.assign(this.insets, insets);
    this._fit();
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(w, h, false);
    this.keyLight.shadow.mapSize.setScalar(w < 720 ? 1024 : 2048);
    this.size = { w, h };
    this._fit();
  }

  _camPos(out, target, dist, yaw) {
    const cp = Math.cos(this.pitch);
    return out.set(target.x + Math.sin(yaw) * cp * dist, target.y + Math.sin(this.pitch) * dist, target.z + Math.cos(yaw) * cp * dist);
  }

  _fit() {
    const { w, h } = this.size;
    const aw = Math.max(80, w - this.insets.left - this.insets.right);
    const ah = Math.max(80, h - this.insets.top - this.insets.bottom);
    const pts = [
      [-4.05, 0, 3.75], [4.05, 0, 3.75], [-4.05, 0, -3.6], [4.05, 0, -3.6],
      [-3.7, 2.0, 2.55], [3.7, 2.0, 2.55], [-3.7, 2.5, -2.55], [3.7, 2.5, -2.55],
      [-2.4, 1.25, -5.2], [3.9, 2.5, -4.85],                      // 病床和監視器也要在畫面裡
    ].map((p) => new THREE.Vector3(...p));
    const probe = this.probe;
    probe.aspect = aw / ah;
    probe.updateProjectionMatrix();
    const target = this.cam.target.set(0, 0.5, -0.2);
    const measure = (dist) => {
      this._camPos(probe.position, target, dist, 0);
      probe.lookAt(target);
      probe.updateMatrixWorld(true);
      let mx = 0, lo = 9, hi = -9;
      pts.forEach((p) => {
        this._v.copy(p).project(probe);
        mx = Math.max(mx, Math.abs(this._v.x));
        lo = Math.min(lo, this._v.y);
        hi = Math.max(hi, this._v.y);
      });
      return { mx, lo, hi };
    };
    let dist = 20;
    for (let iter = 0; iter < 5; iter++) {
      let a = 6, b = 90;
      for (let k = 0; k < 22; k++) {
        const mid = (a + b) / 2;
        const r = measure(mid);
        if (r.mx <= 0.95 && r.hi - r.lo <= 1.86) b = mid; else a = mid;
      }
      dist = b;
      const r = measure(dist);
      const cy = (r.lo + r.hi) / 2;
      target.z -= cy * dist * Math.tan(THREE.MathUtils.degToRad(probe.fov / 2)) / Math.sin(this.pitch);
    }
    this.cam.dist = dist;
    this.camera.aspect = aw / ah;
    this.camera.setViewOffset(aw, ah, -this.insets.left, -this.insets.top, w, h);
    this.camera.updateProjectionMatrix();
  }

  _toScreen(v) {
    this._v2.copy(v).project(this.camera);
    return { x: (this._v2.x * 0.5 + 0.5) * this.size.w, y: (-this._v2.y * 0.5 + 0.5) * this.size.h };
  }

  _pick(cx, cy) {
    if (this.mode !== 'prep') return -1;
    const r = this.canvas.getBoundingClientRect();
    this._ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < 8; i++) {
      const p = slotPosition(i);
      const occupied = !!this.board[i];
      // 角色身體（直立圓柱近似）或地上的格子
      const targets = occupied ? [[0.85, 0.62], [0.05, 0.9]] : [[0.05, 0.9]];
      for (const [y, rad] of targets) {
        const hit = this._ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), this._v);
        if (!hit) continue;
        const d = Math.hypot(hit.x - p.x, hit.z - p.z);
        if (d < rad && d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  // ───────────── 角色 ─────────────
  _spawn(name) {
    const src = this.templates[name];
    if (!src) throw new Error('模型不存在：' + name);
    const model = src.clone(true);
    model.position.set(0, 0, 0);
    const mats = new Map();
    const parts = {};
    const rest = {};
    model.traverse((o) => {
      const key = o.name.split('__')[1];
      if (key && !parts[key]) {
        parts[key] = o;
        rest[key] = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
      }
      if (o.isMesh) {
        o.castShadow = true;
        const conv = (m) => {
          if (!mats.has(m)) {
            const c = m.clone();
            c.userData.baseEmissive = c.emissive.clone();
            mats.set(m, c);
          }
          return mats.get(m);
        };
        o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      }
    });
    const holder = new THREE.Group();
    holder.add(model);
    this.scene.add(holder);
    return { holder, model, parts, rest, mats: [...mats.values()], phase: Math.random() * 6.28, pop: 0, flash: 0 };
  }

  _despawn(a) {
    this.scene.remove(a.holder);
    a.mats.forEach((m) => m.dispose());
    if (a.ring) { a.ring.geometry.dispose(); a.ring.material.dispose(); }
    if (a.tag) a.tag.remove();
  }

  _roleRing(roles) {
    const g = new THREE.Group();
    const n = roles.length;
    roles.forEach((r, i) => {
      const geo = new THREE.RingGeometry(0.5, 0.62, 28, 1, (i / n) * Math.PI * 2 + 0.06, Math.PI * 2 / n - 0.12);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ROLE_COLOR[r] || 0xffffff, transparent: true, opacity: 0.95 }));
      m.rotation.x = -Math.PI / 2;
      g.add(m);
    });
    g.position.y = 0.03;
    return g;
  }

  setBoard(board, selSlot = -1, hint = false) {
    this.board = board.slice();
    this.selSlot = selSlot;
    this.hintSlots = hint;
    const seen = new Set();
    board.forEach((id, slot) => {
      if (!id) return;
      seen.add(id);
      let a = this.unitActors.get(id);
      const pos = slotPosition(slot);
      if (!a) {
        a = this._spawn('unit_' + id);
        a.id = id;
        a.def = this.unitDefs[id];
        a.model.scale.setScalar(UNIT_SCALE);
        a.holder.position.copy(pos);
        a.pop = 0.0001;
        a.yaw = 0;
        a.ringGroup = this._roleRing(a.def.roles);
        a.holder.add(a.ringGroup);
        this.unitActors.set(id, a);
      }
      a.slot = slot;
      a.goal = pos;
    });
    for (const [id, a] of this.unitActors) {
      if (!seen.has(id)) {
        this.scene.remove(a.holder);
        a.mats.forEach((m) => m.dispose());
        a.ringGroup.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
        this.unitActors.delete(id);
      }
    }
  }

  setWave(enemyList) {
    this.fresh = true;                       // 敵人是滿血的初始狀態
    this._clearFx();
    this.enemies.forEach((e) => this._despawn(e));
    this.enemies = [];
    const pos = layoutEnemies(enemyList);
    enemyList.forEach((e, i) => {
      const info = ENEMY_INFO[e.kind];
      const a = this._spawn('enemy_' + e.kind);
      Object.assign(a, { idx: i, kind: e.kind, name: e.name, hp: e.hp, max: e.hp, start: e.hp, info, dead: false, dying: 0, grow: 1, pending: 0, ghost: e.kind === 'lactate', yaw: 0 });
      a.model.scale.setScalar(info.scale);
      a.holder.position.copy(pos[i]);
      a.pop = 0.0001 - i * 0.07;
      if (e.kind === 'mods') {
        a.model.updateMatrixWorld(true);
        const orbit = new THREE.Group();
        orbit.position.set(0, 1.05, 0);
        a.model.add(orbit);
        orbit.updateMatrixWorld(true);
        Object.keys(a.parts).filter((k) => k.startsWith('orb_') && !/_\d+$/.test(k)).forEach((k) => orbit.attach(a.parts[k]));
        a.orbit = orbit;
      }
      if (a.ghost) this._setGhost(a, true);
      a.tag = document.createElement('div');
      a.tag.className = 'tag k-' + e.kind;
      a.tag.innerHTML = '<span class="nm"></span><span class="bar"><i></i></span>';
      this.labelRoot.appendChild(a.tag);
      this._updateTag(a);
      this.enemies.push(a);
    });
  }

  _setGhost(a, on) {
    a.ghost = on;
    a.mats.forEach((m) => { m.transparent = on; m.opacity = on ? 0.4 : 1; m.needsUpdate = true; });
  }

  _updateTag(a) {
    if (!a.tag) return;
    const nm = a.tag.firstChild;
    const fill = a.tag.lastChild.firstChild;
    a.tag.classList.toggle('ghost', !!a.ghost);
    a.tag.classList.toggle('dead', a.hp <= 0);
    nm.textContent = a.ghost ? a.name + '・未量測' : a.hp <= 0 ? a.name + '・已控制' : a.name + ' ' + Math.round(a.hp);
    fill.style.width = (a.ghost ? 100 : Math.max(0, Math.min(100, (a.hp / a.max) * 100))) + '%';
  }

  // ───────────── 特效 ─────────────
  _sprite(color, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(size);
    this.scene.add(s);
    return s;
  }

  _burst(pos, color, n = 8, power = 2.2) {
    for (let i = 0; i < n; i++) {
      const s = this._sprite(color, 0.28 + Math.random() * 0.22);
      s.position.copy(pos);
      const a = Math.random() * 6.28;
      const up = 0.6 + Math.random() * 1.4;
      this.particles.push({ s, v: new THREE.Vector3(Math.cos(a) * power * Math.random(), up * power * 0.7, Math.sin(a) * power * Math.random()), life: 0, dur: 0.45 + Math.random() * 0.3 });
    }
  }

  _ring(pos, color, to = 2.2, dur = 0.55) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x, 0.06, pos.z);
    this.scene.add(m);
    this.rings.push({ m, life: 0, dur, to });
  }

  _shoot(from, to, color, dur, onHit, size = 0.55) {
    const s = this._sprite(color, size);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    s.add(core);
    core.scale.setScalar(1 / size);
    s.position.copy(from);
    this.projectiles.push({ s, from: from.clone(), to: to.clone(), life: 0, dur, onHit, arc: 0.5 + from.distanceTo(to) * 0.14, color });
  }

  _float(pos, text, cls) {
    const p = this._toScreen(pos);
    const el = document.createElement('div');
    el.className = 'pop ' + (cls || '');
    el.textContent = text;
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    this.labelRoot.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  _bubble(actor, text, cls) {
    this.bubbles = this.bubbles.filter((b) => { if (b.actor === actor) { b.el.remove(); return false; } return true; });
    const el = document.createElement('div');
    el.className = 'bubble ' + (cls || '');
    el.textContent = text;
    this.labelRoot.appendChild(el);
    this.bubbles.push({ actor, el, life: 0, dur: 1.5 });
  }

  _clearFx() {
    this.queue = [];
    this.projectiles.forEach((p) => { this.scene.remove(p.s); p.s.material.dispose(); });
    this.particles.forEach((p) => { this.scene.remove(p.s); p.s.material.dispose(); });
    this.rings.forEach((r) => { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); });
    this.bubbles.forEach((b) => b.el.remove());
    this.projectiles = [];
    this.particles = [];
    this.rings = [];
    this.bubbles = [];
    this.labelRoot.querySelectorAll('.pop').forEach((el) => el.remove());
  }

  // ───────────── 戰鬥回放 ─────────────
  _at(time, fn) { this.queue.push({ time, fn }); }

  play(result, hooks) {
    this._clearFx();
    this.mode = 'combat';
    this.fresh = false;
    this.result = result;
    this.hooks = hooks || {};
    this.clock = 0;
    this.done = false;
    this.selSlot = -1;
    this.hintSlots = false;
    const K = SIM_SECONDS_PER_MIN;
    const byT = new Map();
    result.events.forEach((ev) => { if (!byT.has(ev.t)) byT.set(ev.t, []); byT.get(ev.t).push(ev); });
    result.frames.forEach((f) => {
      const t0 = f.t * K;                            // 畫面時鐘走到 f.t 分鐘的時刻
      const evs = byT.get(f.t) || [];
      const acts = evs.filter((e) => e.kind !== 'pressure');
      const gap = Math.min(0.12, 0.42 / Math.max(1, acts.length));
      acts.forEach((ev, i) => this._at(t0 - 0.2 + i * gap, () => this._playEvent(ev)));
      evs.filter((e) => e.kind === 'pressure').forEach((ev) => this._at(t0 + 0.3, () => this._pressure(ev)));
      this._at(t0 + 0.78, () => this._syncFrame(f));  // 下一步的攻擊最快在 t0 + 1.0 才出手
    });
    this._at(result.endTime * K + 1.25, () => this._finish());
    this.queue.sort((a, b) => a.time - b.time);
  }

  fastForward() { if (this.mode === 'combat') this.speed = 14; }

  backToPrep() {
    this._clearFx();
    this.mode = 'prep';
    this.result = null;
    this.hooks = null;
    this.cheer = 0;
  }

  _unitAt(slot) {
    for (const a of this.unitActors.values()) if (a.slot === slot) return a;
    return null;
  }

  _playEvent(ev) {
    const actor = this._unitAt(ev.slot);
    if (!actor) return;
    const color = SKILL_COLOR[actor.def.skill] || 0xffffff;
    if (this.hooks.onEvent) this.hooks.onEvent(ev);
    if (ev.kind === 'buff') {
      this._bubble(actor, ev.action.split('：')[0], 'buff');
      this._ring(actor.holder.position, color, 2.6, 0.7);
      actor.atk = { t: 0, dur: 0.55, fired: true, cast: true };
      if (actor.def.skill === 'protocol') {
        for (const o of this.unitActors.values()) if (o !== actor) { this._ring(o.holder.position, color, 1.5, 0.5); o.pop = 0.5; }
      }
      return;
    }
    if (ev.kind === 'warn') {
      this._bubble(actor, '需要醫師監督', 'warn');
      actor.shake = 0.5;
      return;
    }
    const hits = ev.hits || [];
    this._bubble(actor, ev.action.split('：')[0], '');
    if (actor.def.skill === 'measureLactate') {
      const lac = this.enemies.find((e) => e.kind === 'lactate' && e.ghost);
      if (lac) {
        this._setGhost(lac, false);
        this._ring(lac.holder.position, 0xb794ff, 2.4, 0.7);
        this._burst(this._v.copy(lac.holder.position).setY(1), 0xb794ff, 10, 2);
        this._updateTag(lac);
      }
    }
    const first = hits.length ? this.enemies[hits[0].idx] : null;
    actor.faceTo = first ? first.holder.position : null;
    actor.atk = {
      t: 0, dur: 0.5, fired: false, onFire: () => {
        const from = actor.parts.hand_R.getWorldPosition(new THREE.Vector3());
        from.y += 0.25;
        if (!hits.length) { this._burst(from, color, 5, 1.2); return; }
        const heavy = actor.def.skill === 'sourceControl';
        hits.forEach((h, i) => {
          const e = this.enemies[h.idx];
          if (!e) return;
          const to = this._v.copy(e.holder.position).setY(e.info.height * 0.5).clone();
          e.pending += h.dmg;
          this._shoot(from, to, color, 0.28 + i * 0.02, () => this._impact(e, h, color, heavy), heavy ? 0.95 : 0.55);
        });
      },
    };
  }

  _impact(e, h, color, heavy) {
    e.pending = Math.max(0, e.pending - h.dmg);
    e.hp = Math.max(0, e.hp - h.dmg);
    e.flash = 1;
    e.punch = 1;
    const top = this._v.copy(e.holder.position).setY(e.info.height * e.grow + 0.1).clone();
    this._float(top, '−' + h.dmg, h.crit ? 'crit' : '');
    this._burst(this._v.copy(e.holder.position).setY(e.info.height * 0.5), color, heavy ? 12 : 5, heavy ? 3 : 1.8);
    if (heavy || h.crit) this.trauma = Math.min(1, this.trauma + (heavy ? 0.6 : 0.3));
    if (h.killed && !e.dead) this._kill(e);
    this._updateTag(e);
  }

  _kill(e) {
    e.dead = true;
    e.dying = 0.0001;
    e.hp = 0;
    this._burst(this._v.copy(e.holder.position).setY(e.info.height * 0.5), e.info.color, 16, 3.2);
    this._ring(e.holder.position, e.info.color, 2.8, 0.6);
    this._float(this._v.copy(e.holder.position).setY(e.info.height + 0.5).clone(), '已控制', 'ok');
    if (e.kind === 'mods') this.trauma = 1;
  }

  _pressure(ev) {
    const alive = this.enemies.filter((e) => !e.dead);
    if (!alive.length) return;
    let landed = false;
    alive.forEach((e, i) => {
      e.punch = 1;
      e.faceBack = 0.7;
      const from = this._v.copy(e.holder.position).setY(e.info.height * 0.6).clone();
      this._shoot(from, PATIENT.clone(), 0xff5a4a, 0.42 + i * 0.04, () => {
        if (landed) return;
        landed = true;
        this.monitor.alarm = 0.9;
        this.trauma = Math.min(1, this.trauma + 0.45);
        this._burst(PATIENT, 0xff5a4a, 8, 2);
        this._float(PATIENT.clone().setY(2.1), '病人安全 −' + ev.amount, 'harm');
        if (this.hooks && this.hooks.onPressure) this.hooks.onPressure(ev.amount);
      }, 0.5);
    });
  }

  _syncFrame(f) {
    this.enemies.forEach((e, i) => {
      const expected = f.hp[i] + e.pending;         // 模擬的血量 + 還沒落地的傷害
      e.max = Math.max(e.max, f.max[i]);
      if (e.ghost && f.lactateSeen) this._setGhost(e, false);
      if (expected > e.hp + 0.01 && !e.dead && e.kind === 'lactate') {      // 乳酸上升
        e.punch = 0.6;
        this._float(this._v.copy(e.holder.position).setY(e.info.height * e.grow + 0.2).clone(), '乳酸上升 +' + Math.round(expected - e.hp), 'harm');
      }
      e.hp = expected;
      if (f.hp[i] <= 0 && e.pending <= 0 && !e.dead) this._kill(e);
      this._updateTag(e);
    });
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    this.speed = Math.min(this.speed, 2);
    const win = this.result.win;
    if (win) {
      this.cheer = 1.6;
      for (const a of this.unitActors.values()) this._burst(this._v.copy(a.holder.position).setY(1.9), 0x36c2b9, 6, 2.4);
    } else {
      this.enemies.forEach((e) => { if (!e.dead) e.punch = 1; });
      this.monitor.alarm = 1.4;
    }
    const hooks = this.hooks;
    this._at(this.clock + (win ? 1.0 : 0.7), () => { this.mode = 'result'; if (hooks && hooks.onDone) hooks.onDone(); });
  }

  // ───────────── 每一格畫面 ─────────────
  _frame(now) {
    const dtReal = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.time += dtReal;
    const combat = this.mode === 'combat';
    const dt = dtReal * (combat ? this.speed : 1);
    if (combat) {
      this.clock += dt;
      while (this.queue.length && this.queue[0].time <= this.clock) this.queue.shift().fn();
      if (this.hooks && this.hooks.onTime && this.result) {
        this.hooks.onTime(Math.min(this.result.endTime, this.clock / SIM_SECONDS_PER_MIN));
      }
    } else if (this.queue.length) {
      this.queue = [];
    }
    this.cheer = Math.max(0, (this.cheer || 0) - dtReal);

    this._updateUnits(dtReal, dt);
    this._updateEnemies(dtReal, dt);
    this._updateFx(dt);
    this._updateTiles();
    this._updateCamera(dtReal);
    this._drawMonitor(dtReal);
    this.moodLight.intensity = 14 + Math.sin(this.time * 1.7) * 3;
    this.renderer.render(this.scene, this.camera);
    this._updateLabels(dt);
  }

  _updateUnits(dtReal, dt) {
    const t = this.time;
    for (const a of this.unitActors.values()) {
      const sel = this.mode === 'prep' && a.slot === this.selSlot;
      a.holder.position.lerp(a.goal, 1 - Math.pow(0.0005, dtReal));
      // 朝向：備戰時面向鏡頭，處置時面向病灶
      let yawGoal = this.mode === 'prep' ? 0 : Math.PI * 0.8;
      if (this.mode !== 'prep' && a.faceTo && a.atk) yawGoal = Math.atan2(a.faceTo.x - a.holder.position.x, a.faceTo.z - a.holder.position.z);
      let d = yawGoal - a.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      a.yaw += d * (1 - Math.pow(0.002, dtReal));
      a.holder.rotation.y = a.yaw;
      a.ringGroup.rotation.y = -a.yaw + t * 0.4;

      const P = a.parts;
      const R = a.rest;
      const br = Math.sin(t * 2.3 + a.phase);
      P.body.scale.set(1 + 0.012 * br, 1 - 0.022 * br, 1 + 0.012 * br);
      P.head.position.copy(R.head.p).y += -0.018 * br;
      P.head.rotation.set(0, 0, 0.045 * Math.sin(t * 1.4 + a.phase));
      P.hand_L.position.copy(R.hand_L.p).y += 0.035 * Math.sin(t * 2.3 + a.phase + 1.2);
      P.hand_R.position.copy(R.hand_R.p).y += 0.035 * Math.sin(t * 2.3 + a.phase + 2.1);
      P.hand_R.rotation.set(0, 0, 0);
      let y = 0;
      let z = 0;
      let s = UNIT_SCALE;
      if (a.pop > 0) {                                  // 出場
        a.pop += dtReal;
        const k = clamp01(a.pop / 0.38);
        s *= Math.max(0.001, ease.outBack(k));
        if (k >= 1) a.pop = 0;
      }
      if (sel) y += Math.abs(Math.sin(t * 5.5)) * 0.16;
      if (this.cheer > 0) {
        const c = Math.abs(Math.sin((1.6 - this.cheer) * 9 + a.phase));
        y += c * 0.38;
        P.hand_L.position.y += 0.5 * c;
        P.hand_R.position.y += 0.5 * c;
      }
      if (a.shake > 0) {
        a.shake -= dtReal;
        P.head.rotation.y = Math.sin(t * 28) * 0.35 * clamp01(a.shake * 2);
      }
      if (a.atk) {
        const A = a.atk;
        A.t += dt;
        const k = clamp01(A.t / A.dur);
        const wind = Math.sin(Math.PI * clamp01(k / 0.34));           // 蓄力下蹲
        const strike = ease.outCubic(clamp01((k - 0.3) / 0.16)) * (1 - ease.inOut(clamp01((k - 0.52) / 0.48)));
        P.body.scale.y *= 1 - 0.1 * wind;
        y -= 0.05 * wind;
        if (A.cast) {
          P.hand_L.position.y += 0.55 * Math.sin(Math.PI * k);
          P.hand_R.position.y += 0.55 * Math.sin(Math.PI * k);
          y += 0.12 * Math.sin(Math.PI * k);
        } else {
          z += 0.36 * strike;
          y += 0.12 * strike;
          P.hand_R.position.y += 0.5 * strike;
          P.hand_R.position.z += 0.3 * strike;
          P.hand_R.rotation.x = -1.0 * strike;
          P.head.rotation.x = -0.18 * strike;
        }
        if (!A.fired && k >= 0.42) { A.fired = true; A.onFire(); }
        if (k >= 1) { a.atk = null; a.faceTo = null; }
      }
      a.model.position.set(0, y, z);
      a.model.scale.setScalar(s);
    }
  }

  _updateEnemies(dtReal, dt) {
    const t = this.time;
    for (const e of this.enemies) {
      const P = e.parts;
      const info = e.info;
      let s = info.scale;
      let y = 0;
      if (e.pop !== 0) {
        e.pop += dtReal;
        const k = clamp01(e.pop / 0.4);
        s *= e.pop < 0 ? 0.001 : Math.max(0.001, ease.outBack(k));
        if (k >= 1) e.pop = 0;
      }
      // 乳酸越高，體型越大
      const growGoal = e.kind === 'lactate' ? THREE.MathUtils.clamp(0.72 + 0.4 * (e.hp / e.start), 0.6, 1.9) : 1;
      e.grow += (growGoal - e.grow) * (1 - Math.pow(0.02, dtReal));
      s *= e.grow;
      if (e.punch > 0) {
        e.punch = Math.max(0, e.punch - dtReal * 3.2);
        s *= 1 + 0.16 * Math.sin(e.punch * Math.PI);
      }
      if (e.flash > 0) e.flash = Math.max(0, e.flash - dtReal * 5);
      e.mats.forEach((m) => {
        const b = m.userData.baseEmissive;
        m.emissive.setRGB(b.r + e.flash * 0.9, b.g + e.flash * 0.9, b.b + e.flash * 0.9);
      });
      let yawGoal = 0;
      if (e.faceBack > 0) { e.faceBack -= dtReal; yawGoal = Math.PI; }
      let d = yawGoal - e.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      e.yaw += d * (1 - Math.pow(0.001, dtReal));
      let yaw = e.yaw;

      if (e.kind === 'pathogen') {
        y += 0.1 + 0.09 * Math.sin(t * 2.6 + e.phase);
        P.body.rotation.z = 0.12 * Math.sin(t * 1.9 + e.phase);
        ['bud_1', 'bud_2'].forEach((k, i) => {
          if (!P[k]) return;
          P[k].position.copy(e.rest[k].p);
          P[k].position.y += 0.1 * Math.sin(t * 3.1 + e.phase + i * 2);
          P[k].position.x += 0.06 * Math.cos(t * 2.2 + e.phase + i * 2);
        });
      } else if (e.kind === 'hypotension') {
        yaw += 0.1 * Math.sin(t * 1.3 + e.phase);
        P.body.rotation.z = 0.05 * Math.sin(t * 1.6 + e.phase);
        y += Math.abs(Math.sin(t * 1.6 + e.phase)) * 0.03;
        if (P.needle) {
          P.needle.quaternion.copy(e.rest.needle.q);
          P.needle.rotateZ(0.16 * Math.sin(t * 5 + e.phase) + 0.05 * Math.sin(t * 13));
        }
      } else if (e.kind === 'lactate') {
        const b = Math.sin(t * 2 + e.phase);
        P.body.scale.set(1 + 0.04 * b, 1 - 0.06 * b, 1 + 0.04 * b);
        ['bub_1', 'bub_2', 'bub_3'].forEach((k, i) => {
          if (!P[k]) return;
          const u = (t * 0.45 + i * 0.37 + e.phase) % 1;
          P[k].position.copy(e.rest[k].p).y += u * 0.55;
          P[k].scale.setScalar(Math.sin(Math.PI * u) * 1.3 + 0.05);
        });
      } else if (e.kind === 'mods') {
        y += 0.25 + 0.12 * Math.sin(t * 1.2);
        P.body.rotation.z = 0.05 * Math.sin(t * 0.9);
        if (e.orbit) {
          e.orbit.rotation.y = t * 0.7;
          e.orbit.children.forEach((o, i) => { o.rotation.y = -t * 0.7; o.position.y += Math.sin(t * 2 + i) * 0.002; });
        }
      }
      if (e.dying > 0) {
        e.dying += dt;
        const k = clamp01(e.dying / 0.55);
        s *= Math.max(0.001, 1 - ease.inOut(k));
        y += k * 0.9;
        yaw += k * 7;
        if (k >= 1) { e.dying = 0; e.holder.visible = false; }
      }
      e.holder.rotation.y = yaw;
      e.model.position.y = y;
      e.model.scale.setScalar(s);
    }
  }

  _updateFx(dt) {
    this.projectiles = this.projectiles.filter((p) => {
      p.life += dt;
      const k = clamp01(p.life / p.dur);
      p.s.position.lerpVectors(p.from, p.to, k);
      p.s.position.y += Math.sin(Math.PI * k) * p.arc;
      if (k >= 1) {
        this.scene.remove(p.s);
        p.s.material.dispose();
        if (p.onHit) p.onHit();
        return false;
      }
      return true;
    });
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      const k = p.life / p.dur;
      p.v.y -= 6 * dt;
      p.s.position.addScaledVector(p.v, dt);
      p.s.material.opacity = 1 - k;
      if (k >= 1) { this.scene.remove(p.s); p.s.material.dispose(); return false; }
      return true;
    });
    this.rings = this.rings.filter((r) => {
      r.life += dt;
      const k = clamp01(r.life / r.dur);
      r.m.scale.setScalar(1 + (r.to - 1) * ease.outCubic(k));
      r.m.material.opacity = 0.9 * (1 - k);
      if (k >= 1) { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); return false; }
      return true;
    });
  }

  _updateTiles() {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
    this.tiles.own.forEach((tile, i) => {
      const m = tile.material;
      if (this.mode === 'prep' && i === this.selSlot) m.emissive.setRGB(0.05 + 0.12 * pulse, 0.32 + 0.3 * pulse, 0.3 + 0.28 * pulse);
      else if (this.mode === 'prep' && this.hintSlots && !this.board[i]) m.emissive.setRGB(0.02, 0.1 + 0.08 * pulse, 0.1 + 0.08 * pulse);
      else m.emissive.setRGB(0, 0, 0);
    });
  }

  _updateCamera(dtReal) {
    this.trauma = Math.max(0, this.trauma - dtReal * 1.6);
    const sway = this.reducedMotion ? 0 : Math.sin(this.time * 0.22) * 0.03;
    this._camPos(this.camera.position, this.cam.target, this.cam.dist, sway);
    this.camera.lookAt(this.cam.target);
    if (!this.reducedMotion && this.trauma > 0) {
      const k = this.trauma * this.trauma * 0.22;
      this.camera.position.x += Math.sin(this.time * 61) * k;
      this.camera.position.y += Math.sin(this.time * 47) * k;
    }
    this.camera.updateMatrixWorld();
  }

  _updateLabels(dt) {
    for (const t of this.slotTags) {
      const p = this._toScreen(t.pos);
      t.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-50%)';
    }
    for (const e of this.enemies) {
      if (!e.tag) continue;
      if (!e.holder.visible) { e.tag.style.opacity = '0'; continue; }
      const p = this._toScreen(this._v.copy(e.holder.position).setY((e.info.height * e.grow + 0.35) * (e.kind === 'mods' ? 1.25 : 1)));
      e.tag.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-100%)';
    }
    this.bubbles = this.bubbles.filter((b) => {
      b.life += dt;
      if (b.life >= b.dur) { b.el.remove(); return false; }
      const p = this._toScreen(this._v.copy(b.actor.holder.position).setY(2.0));
      b.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-100%)';
      b.el.style.opacity = String(Math.min(1, (b.dur - b.life) * 4));
      return true;
    });
  }
}
