// 去背素材：把遊戲裡的每一個人物單獨畫在透明背景上，貼齊人物裁成正方形的 PNG。
//   node trailer/cutouts.mjs       → assets/cutouts/*.png 和 assets/cutouts/index.json（檔名 → 名字、身分）
// 病人是床上的上半身（床、被子、房間都不畫）；公會的人和主角是站著的全身，費民是坐在櫃台後面的上半身。
// 畫面全部來自 app/src/art 的程式美術，改了遊戲的畫，重跑這支就會更新。
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), app = join(here, '..', 'app'), out = join(here, '..', 'assets', 'cutouts');
const require = createRequire(import.meta.url), PORT = 5182;
const { CASES } = await import(join(app, 'src/data/index.ts'));
const { ELDERS, RESIDENTS } = await import(join(app, 'src/data/islands.ts'));
const { HEROES } = await import(join(app, 'src/ui/progress.ts'));

// 檔名 → 要畫的鏡頭、名字、身分
const list = [
  ...CASES.map((c) => ({ file: 'patient-' + c.id, shot: 'person-' + c.patient.look, name: c.patient.name, role: '病人・' + c.patient.age + ' 歲・' + c.patient.job + '・' + c.complaintName })),
  ...ELDERS.map((e) => ({ file: 'elder-' + e.id, shot: 'person-e-' + e.id, name: e.name, role: '五島長老會・' + e.tag })),
  ...Object.values(RESIDENTS).map((r) => ({ file: 'resident-' + r.id, shot: 'person-' + r.look, name: r.name, role: '常駐的人・' + r.tag })),
  { file: 'guild-mentor', shot: 'cast-cen', name: '孟拓', role: '公會・資深專科護理師' },
  { file: 'guild-doctor', shot: 'cast-shen', name: '馬凱', role: '公會・值班醫師' },
  { file: 'guild-archivist', shot: 'cast-mo', name: '費民', role: '公會・檔案員' },
  ...HEROES.map((h) => ({ file: 'hero-' + h.id, shot: 'cast-hero-' + h.id, name: h.name, role: '主角・' + h.tag })),
];

mkdirSync(out, { recursive: true });
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: app, stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + PORT + '/'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const { chromium } = require(require.resolve('playwright', { paths: [here, app, '/usr/local/lib/node_modules', '/usr/lib/node_modules'] }));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 900, height: 900 } });
  for (const x of list) {
    await p.goto('http://localhost:' + PORT + '/tools/stills.html?shot=' + x.shot);
    await p.waitForSelector('body[data-ready]', { timeout: 20000 });
    // 貼齊人物裁切：找出不透明的範圍，留一點邊，裁成正方形
    const box = await p.evaluate(() => {
      const c = document.querySelector('canvas'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const r = c.width / c.clientWidth, side = Math.max(x1 - x0, y1 - y0) / r * 1.08, cx = (x0 + x1) / 2 / r, cy = (y0 + y1) / 2 / r;
      return { x: Math.max(0, cx - side / 2), y: Math.max(0, cy - side / 2), width: Math.min(side, c.clientWidth), height: Math.min(side, c.clientHeight) };
    });
    await p.screenshot({ path: join(out, x.file + '.png'), omitBackground: true, clip: box });
  }
  await b.close();
} finally { vite.kill(); }
writeFileSync(join(out, 'index.json'), JSON.stringify(Object.fromEntries(list.map((x) => [x.file + '.png', { name: x.name, role: x.role }])), null, 2) + '\n');
console.log('去背素材：' + list.length + ' 張 → ' + out);
