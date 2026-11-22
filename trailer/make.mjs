// 前導片：截靜態圖 → 排成 HyperFrames 的組成 → 輸出 MP4。
//   node trailer/make.mjs            兩個版本都做
//   node trailer/make.mjs --stills   只重截靜態圖
//   node trailer/make.mjs --only=portrait   只做直式（landscape 同理）
//   node trailer/make.mjs --reuse    已經輸出過畫面的話，不重新逐格輸出，只重新壓縮、配上聲音（改配樂的時候用）
// 要先在 trailer/ 裡 npm install（hyperframes、gsap、playwright 用環境裡已經有的那一份）。
// 輸出：app/public/trailer/trailer.mp4（橫式）和 trailer-vertical.mp4（直式 720p，手機直向的時候播），都是遊戲序章前播；
//      app/public/social/trailer-vertical.mp4（直式 1080p，Threads 用）。
// 美術都是遊戲本身用程式畫的（app/src/art）；這裡只截圖、排鏡頭、上字。
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), app = join(here, '..', 'app'), build = join(here, 'build');
const require = createRequire(import.meta.url);
const URL = 'mist-guild.shiftguard-navicare.workers.dev';
const PORT = 5181;
const CREATURES = [['moth', '獨眼蛾', '獨眼巨人之劫'], ['frog', '風袋蛙', '風袋之劫'], ['crab', '斯庫拉蟹', '斯庫拉之劫'], ['newt', '日神蜥', '日神之牛'], ['bird', '賽蓮鳥', '賽蓮之劫'], ['tortoise', '擲石龜', '擲石巨人之劫'],
  ['heron', '疤腿鷺', '野豬之疤'], ['puffer', '漩渦豚', '卡律布狄斯之劫'], ['otter', '忘憂獺', '忘憂果之劫'], ['squid', '喀耳刻魷', '喀耳刻之劫'], ['mouse', '藏洞鼠', '卡呂普索之劫'], ['eel', '冥河鰻', '冥府之劫']];
const ELDERS = ['e-nie', 'e-lu', 'e-guan', 'e-chu', 'e-ge'], ELDER_NAMES = ['埃吉普提歐', '瑙西克拉', '涅斯托', '狄俄墨', '阿瑞忒'];
const quiet = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };

async function stills(dir) {
  mkdirSync(dir, { recursive: true });
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: app, stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + PORT + '/'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
    const { chromium } = require(require.resolve('playwright', { paths: [here, app, '/usr/local/lib/node_modules', '/usr/lib/node_modules'] }));
    const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
    const shots = ['title', 'hall', 'ward', 'tower-lit', ...CREATURES.map(([k]) => 'c-' + k), ...ELDERS];
    for (const s of shots) {
      await p.goto('http://localhost:' + PORT + '/tools/stills.html?shot=' + s);
      await p.waitForSelector('body[data-ready]', { timeout: 20000 });
      await p.screenshot({ path: join(dir, (s === 'tower-lit' ? 'tower' : s) + '.jpg'), quality: 88, type: 'jpeg' });
    }
    // 航海圖：照遊戲裡的樣子，十二座島都去過、終章走完（有歸航線）
    const save = { v: 3, beats: ['prologue', 'night-done'], cases: {}, takeaways: [], hero: 'zhi', trials: [] };
    const { CASES } = await import(join(app, 'src/data/index.ts'));
    const { BEATS } = await import(join(app, 'src/ui/progress.ts'));
    for (const c of CASES) save.cases[c.id] = { best: 90, safety: 'met', plays: 1, seconds: 500, found: true, concern: true, reads: [] };
    save.beats.push(...BEATS.map((x) => x.id), ...CASES.map((c) => 'passed:' + c.id));
    const m = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
    await m.goto('http://localhost:' + PORT + '/');
    await m.evaluate((s) => { localStorage.setItem('mist-guild.v1', JSON.stringify(s)); localStorage.setItem('mist-guild.stats', '"no"'); }, save);
    await m.reload(); await m.waitForTimeout(1500);
    await m.getByRole('button', { name: /委託板|繼續|公會/ }).first().click().catch(() => {});
    await m.waitForTimeout(1500);
    await m.locator('.chart').screenshot({ path: join(dir, 'chart.jpg'), quality: 90, type: 'jpeg' });
    await b.close();
  } finally { vite.kill(); }
}

/** 字體：遊戲用的霞鶩文楷（SIL OFL 1.1），只留前導片用到的字 */
async function font(dir, html) {
  const { default: subsetFont } = await import(require.resolve('subset-font', { paths: [app] }));
  const ttf = readFileSync(join(app, 'node_modules/@expo-google-fonts/lxgw-wenkai-tc/700Bold/LXGWWenKaiTC_700Bold.ttf'));
  const text = [...new Set(html.replace(/<[^>]+>/g, ''))].join('');
  writeFileSync(join(dir, 'wenkai.woff2'), await subsetFont(ttf, text, { targetFormat: 'woff2' }));
  copyFileSync(join(app, 'node_modules/@expo-google-fonts/lxgw-wenkai-tc/LICENSE_FONT'), join(dir, 'OFL.txt'));
}

function compose(w, h) {
  const creatures = CREATURES.map(([k, n, p], i) => `<section id="c${i}" class="clip shot" data-start="${12 + i}" data-duration="1" data-track-index="0"><img class="bg" src="assets/c-${k}.jpg" alt="" /><p class="tag">${n}<small>${p}</small></p></section>`).join('\n  ');
  const elders = ELDERS.map((k, i) => `<figure><img src="assets/${k}.jpg" alt="" /><figcaption>${ELDER_NAMES[i]}</figcaption></figure>`).join('');
  return readFileSync(join(here, 'composition.html'), 'utf8').replaceAll('__W__', String(w)).replaceAll('__H__', String(h))
    .replace('__ORIENT__', w > h ? 'landscape' : 'portrait').replace('__CREATURES__', creatures).replace('__ELDERS__', elders).replaceAll('__URL__', URL);
}

// 配樂：海浪和鐘聲，music.mjs 用程式合成
const music = join(build, 'music.wav');
execFileSync('node', [join(here, 'music.mjs'), music], { stdio: 'inherit' });
const audio = ['-i', music, '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-18:TP=-1.5', '-c:a', 'aac', '-b:a', '96k', '-shortest'];
const assets = join(build, 'assets');
if (!existsSync(join(assets, 'title.jpg')) || process.argv.includes('--stills')) await stills(assets);
if (process.argv.includes('--stills')) process.exit(0);
copyFileSync(require.resolve('gsap/dist/gsap.min.js', { paths: [here] }), join(assets, 'gsap.min.js'));
const cuts = [['landscape', 1920, 1080, join(app, 'public/trailer/trailer.mp4'), ['-vf', 'scale=1280:720', '-crf', '27']], ['portrait', 1080, 1920, join(app, 'public/social/trailer-vertical.mp4'), ['-crf', '27']]];
await font(assets, cuts.map(([, w, h]) => compose(w, h)).join(''));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
for (const [name, w, h, out, enc] of cuts) {
  if (only && only !== name) continue;
  const dir = join(build, name);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), compose(w, h));
  writeFileSync(join(dir, 'hyperframes.json'), JSON.stringify({ paths: { assets: 'assets' } }, null, 2));
  execFileSync('cp', ['-r', assets, join(dir, 'assets')]);
  const raw = join(build, name + '.mp4');
  if (!(process.argv.includes('--reuse') && existsSync(raw))) execFileSync('npx', ['hyperframes', 'render', dir, '-o', raw, '--fps', '30', '--quality', 'delivery', '--quiet'], { cwd: here, env: quiet, stdio: 'inherit' });
  mkdirSync(dirname(out), { recursive: true });
  // 再壓一次：遊戲裡的那一份要小，手機上也能很快開始播；加 faststart 讓它邊下載邊播
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, ...audio, ...enc, '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log(name + '：' + out);
  if (name === 'portrait') {
    const small = join(app, 'public/trailer/trailer-vertical.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, ...audio, '-vf', 'scale=720:1280', '-crf', '28', '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', small]);
    console.log('portrait（遊戲用）：' + small);
  }
}
