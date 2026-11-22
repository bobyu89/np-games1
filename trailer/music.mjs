// 前導片的配樂：海浪和鐘聲，全部用程式合成（沒有音檔、沒有版權問題）。
// 鐘聲的時間點對著 composition.html 的分鏡。同樣的程式每次產生一模一樣的聲音。
//   node music.mjs build/music.wav
import { writeFileSync } from 'node:fs';

const RATE = 44100, LEN = 52, N = RATE * LEN;
const L = new Float32Array(N), R = new Float32Array(N);

// 固定種子的亂數：每次輸出都一樣
let seed = 20261205;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };

// ── 海浪：低頻的雜訊，音量一波一波起伏 ──
{
  let bl = 0, br = 0, sl = 0, sr = 0;
  for (let i = 0; i < N; i++) {
    const t = i / RATE;
    bl = (bl + 0.02 * rnd()) / 1.02; br = (br + 0.02 * rnd()) / 1.02;        // 布朗雜訊
    sl += (bl - sl) * 0.08; sr += (br - sr) * 0.08;                            // 再柔一點
    const wl = 0.55 + 0.45 * Math.sin(2 * Math.PI * t / 7.3) ** 2 * (0.7 + 0.3 * Math.sin(2 * Math.PI * t / 11.1));
    const wr = 0.55 + 0.45 * Math.sin(2 * Math.PI * (t + 1.6) / 7.3) ** 2 * (0.7 + 0.3 * Math.sin(2 * Math.PI * (t + 2) / 11.1));
    L[i] += sl * 1.1 * wl; R[i] += sr * 1.1 * wr;
  }
}

// ── 低低的持續音：D 和 A，讓整段有一點溫度 ──
for (let i = 0; i < N; i++) {
  const t = i / RATE, env = Math.min(1, t / 4) * Math.min(1, (LEN - t) / 3) * (0.6 + 0.4 * Math.sin(2 * Math.PI * t / 13));
  const v = 0.018 * env * (Math.sin(2 * Math.PI * 73.42 * t) + 0.6 * Math.sin(2 * Math.PI * 110 * t + 0.4) + 0.3 * Math.sin(2 * Math.PI * 146.83 * t + 1.1));
  L[i] += v; R[i] += v;
}

// ── 鐘聲：幾個不成整數倍的泛音，各自慢慢消失 ──
const PARTIALS = [[1, 1, 1], [2.0, 0.55, 0.7], [2.76, 0.4, 0.5], [5.4, 0.22, 0.32], [8.93, 0.12, 0.2]];
function bell(at, f, vol, decay = 3.5, pan = 0) {
  const start = Math.floor(at * RATE), len = Math.min(N - start, Math.floor(decay * 1.6 * RATE));
  for (let k = 0; k < len; k++) {
    const t = k / RATE, attack = Math.min(1, t / 0.004);
    let v = 0;
    for (const [ratio, amp, dk] of PARTIALS) v += amp * Math.exp(-t / (decay * dk)) * Math.sin(2 * Math.PI * f * ratio * t);
    v *= vol * attack;
    L[start + k] += v * (1 - pan) / 1.5; R[start + k] += v * (1 + pan) / 1.5;
  }
}
const note = (n) => 440 * Math.pow(2, (n - 69) / 12);   // MIDI 音高 → 頻率

bell(0.6, note(50), 0.32, 5);                 // 開場：遠遠的低鐘（D3）
bell(3.3, note(57), 0.2, 3, -0.3);           // 「說那位見習的故事」
bell(6.1, note(62), 0.22, 3.5, 0.2);          // 地圖
bell(8.9, note(66), 0.17, 3, -0.2);
// 十二劫影：一秒一隻，D 大調五聲音階往上走
const PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98, 100];
PENTA.forEach((n, i) => bell(12.1 + i, note(n), 0.18, 1.6, i % 2 ? 0.35 : -0.35));
bell(24.1, note(62), 0.24, 4);                // 大廳
bell(30.1, note(57), 0.22, 4, -0.2);          // 病室：霧
bell(33.1, note(64), 0.17, 3, 0.2);
[69, 71, 74, 76, 78].forEach((n, i) => bell(36.3 + i * 0.35, note(n), 0.14, 2.5, -0.4 + i * 0.2));   // 五位長老
bell(41.2, note(45), 0.3, 6);                 // 燈塔：暗（A2）
[62, 66, 69, 74].forEach((n, i) => bell(43.1 + i * 0.08, note(n), 0.13, 4.5, -0.3 + i * 0.2));   // 燈亮了
[50, 57, 62, 66, 69].forEach((n, i) => bell(46.3 + i * 0.05, note(n), 0.17, 6));   // 片名：大鐘

// ── 整段淡入淡出，最大音量壓在 -3 dB ──
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / RATE, g = Math.min(1, t / 1.5) * Math.min(1, (LEN - t) / 1.6);
  L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.7 / peak;

const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8);
out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(RATE, 24); out.writeUInt32LE(RATE * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4);
}
writeFileSync(process.argv[2] || 'build/music.wav', out);
console.log('配樂：' + (process.argv[2] || 'build/music.wav'));
