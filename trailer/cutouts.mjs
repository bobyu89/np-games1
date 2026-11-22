// 去背素材：把遊戲裡的每一個人物單獨畫在透明背景上，存成 PNG（600×600）。
//   node trailer/cutouts.mjs       → assets/cutouts/*.png 和 assets/cutouts/index.json（檔名 → 名字、身分）
// 病人是床上的上半身（床、被子、房間都不畫）；公會的人和主角是站著的全身，斐米歐是坐在櫃台後面的上半身。
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
  { file: 'guild-mentor', shot: 'cast-cen', name: '蒙托拉', role: '公會・資深專科護理師' },
  { file: 'guild-doctor', shot: 'cast-shen', name: '馬卡翁', role: '公會・值班醫師' },
  { file: 'guild-archivist', shot: 'cast-mo', name: '斐米歐', role: '公會・檔案員' },
  ...HEROES.map((h) => ({ file: 'hero-' + h.id, shot: 'cast-hero-' + h.id, name: h.name, role: '主角・' + h.tag })),
];

mkdirSync(out, { recursive: true });
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: app, stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + PORT + '/'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const { chromium } = require(require.resolve('playwright', { paths: [here, app, '/usr/local/lib/node_modules', '/usr/lib/node_modules'] }));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 600, height: 600 } });
  for (const x of list) {
    await p.goto('http://localhost:' + PORT + '/tools/stills.html?shot=' + x.shot);
    await p.waitForSelector('body[data-ready]', { timeout: 20000 });
    await p.screenshot({ path: join(out, x.file + '.png'), omitBackground: true });
  }
  await b.close();
} finally { vite.kill(); }
writeFileSync(join(out, 'index.json'), JSON.stringify(Object.fromEntries(list.map((x) => [x.file + '.png', { name: x.name, role: x.role }])), null, 2) + '\n');
console.log('去背素材：' + list.length + ' 張 → ' + out);
