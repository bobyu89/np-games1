// 前導片：錄遊戲的畫面 → 用 HyperFrames 排成動畫 → 配上合成的海浪和鐘聲 → 輸出 MP4。
//   node trailer/make.mjs              全部重做
//   node trailer/make.mjs --reuse      已經錄過畫面、輸出過的話，只重新壓縮配上聲音（改配樂的時候用）
//   node trailer/make.mjs --only=portrait   只做直式（landscape 同理）
// 要先在 trailer/ 裡 npm install（hyperframes、gsap；playwright 用環境裡已經有的那一份）。
// 輸出：app/public/trailer/trailer.mp4（橫式 720p）和 trailer-vertical.mp4（直式 720p），遊戲序章前播；
//      app/public/social/trailer-vertical.mp4（直式 1080p），Threads 用。
// 畫面全部是遊戲本身的程式美術（app/src/art）：場景照目標比例一格一格錄（不裁切），劫影單獨畫在透明背景上做成動畫。不出現任何病人。
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose } from './composition.mjs';

const here = dirname(fileURLToPath(import.meta.url)), app = join(here, '..', 'app'), build = join(here, 'build');
const require = createRequire(import.meta.url);
const URL = 'mist-guild.shiftguard-navicare.workers.dev', PORT = 5181, FPS = 30;
// 航行的順序：本島，然後每一章先到那片海最大的島，再到同一章的小島（跟航線一樣）
const VOYAGE = ['main', 'tide', 'wind', 'book', 'sun', 'keel', 'boar', 'whirl', 'bamboo', 'lotus', 'circe', 'shade'];
const quiet = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7), reuse = process.argv.includes('--reuse');
const CUTS = [['landscape', 1920, 1080], ['portrait', 1080, 1920]].filter(([n]) => !only || n === only);

// 遊戲的資料：島、症狀、劫的名字（直接讀遊戲的檔，名字改了這裡跟著改）
const { ISLANDS, ISLAND_OF } = await import(join(app, 'src/data/islands.ts'));
const { COMPLAINTS } = await import(join(app, 'src/data/index.ts'));
const { PERILS } = await import(join(app, 'src/data/odyssey.ts'));
// 每座島剛好一種症狀（一劫一座島）
const isles = VOYAGE.map((id) => {
  const i = ISLANDS[id], c = COMPLAINTS.find((m) => ISLAND_OF[m.place ?? 'ward'] === id);
  return { id, name: i.name, x: i.x, y: i.y, r: i.r, from: i.from, look: c.shadow.look, complaint: c.name, shadow: c.shadow.name, peril: PERILS[c.id].name };
});

/** 一段場景：照目標比例錄 frames 格，at(秒) 可以在某些時間改場景狀態（例如霧散開、燈亮起來） */
async function clip(page, shot, seconds, out, at = () => null, pre = 0) {
  const dir = out + '.frames'; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await page.goto('http://localhost:' + PORT + '/tools/stills.html?shot=' + shot);
  await page.waitForSelector('body[data-ready]', { timeout: 20000 });
  if (pre) await page.evaluate((s) => window.adv(s), pre);   // 先往前走一段，跟開場不是同一個畫面
  const n = Math.round(seconds * FPS);
  for (let i = 0; i < n; i++) {
    const set = at(i / FPS); if (set) await page.evaluate(([k, v]) => window.set(k, v), set);
    await page.evaluate((dt) => window.adv(dt), 1 / FPS);
    await page.screenshot({ path: join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.jpg'), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', out]);
  rmSync(dir, { recursive: true, force: true });
}

async function capture() {
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: app, stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + PORT + '/'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
    const { chromium } = require(require.resolve('playwright', { paths: [here, app, '/usr/local/lib/node_modules', '/usr/lib/node_modules'] }));
    const b = await chromium.launch();
    const shared = join(build, 'shared'); mkdirSync(shared, { recursive: true });
    // 劫影：單獨畫、背景透明，42 格動畫排成 7×6 的一張圖
    const sp = await b.newPage({ viewport: { width: 400, height: 400 } });
    for (const { look } of isles) {
      if (existsSync(join(shared, 'sprite-' + look + '.png'))) continue;   // 錄過了就不再錄
      const dir = join(shared, 'solo-' + look); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      await sp.goto('http://localhost:' + PORT + '/tools/stills.html?shot=solo-' + look); await sp.waitForSelector('body[data-ready]');
      for (let i = 0; i < 42; i++) { await sp.evaluate(() => window.adv(1 / 30)); await sp.screenshot({ path: join(dir, String(i).padStart(4, '0') + '.png'), omitBackground: true }); }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, '%04d.png'), '-vf', 'tile=7x6', '-frames:v', '1', join(shared, 'sprite-' + look + '.png')]);
      rmSync(dir, { recursive: true, force: true });
    }
    // 場景：每個比例各錄一次，畫面本來就會延伸到兩邊，不用裁
    for (const [name, w, h] of CUTS) {
      const dir = join(build, name, 'assets'); mkdirSync(dir, { recursive: true });
      const p = await b.newPage({ viewport: { width: w, height: h } });
      // 不錄任何病人：霧港（你在碼頭）、公會大廳（蒙托拉、你、斐米歐），最後回到霧港
      await clip(p, 'title', 5.2, join(dir, 'title.mp4'));
      await clip(p, 'hall', 5.2, join(dir, 'hall.mp4'));
      await clip(p, 'title', 13.2, join(dir, 'home.mp4'), () => null, 9);
      await p.close();
      console.log('錄好了：' + name);
    }
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

if (!reuse) await capture();
// 配樂：海浪和鐘聲，music.mjs 用程式合成
const music = join(build, 'music.wav');
execFileSync('node', [join(here, 'music.mjs'), music], { stdio: 'inherit' });
const audio = ['-i', music, '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-18:TP=-1.5', '-c:a', 'aac', '-b:a', '96k', '-shortest'];
const OUT = { landscape: [[join(app, 'public/trailer/trailer.mp4'), ['-vf', 'scale=1280:720', '-crf', '27']]],
  portrait: [[join(app, 'public/social/trailer-vertical.mp4'), ['-crf', '27']], [join(app, 'public/trailer/trailer-vertical.mp4'), ['-vf', 'scale=720:1280', '-crf', '28']]] };
for (const [name, w, h] of CUTS) {
  const dir = join(build, name), assets = join(dir, 'assets'), raw = join(build, name + '.mp4');
  if (!(reuse && existsSync(raw))) {
    const html = compose({ w, h, isles, url: URL });
    writeFileSync(join(dir, 'index.html'), html);
    writeFileSync(join(dir, 'hyperframes.json'), JSON.stringify({ paths: { assets: 'assets' } }, null, 2));
    for (const { look } of isles) copyFileSync(join(build, 'shared', 'sprite-' + look + '.png'), join(assets, 'sprite-' + look + '.png'));
    copyFileSync(require.resolve('gsap/dist/gsap.min.js', { paths: [here] }), join(assets, 'gsap.min.js'));
    await font(assets, html);
    execFileSync('npx', ['hyperframes', 'render', dir, '-o', raw, '--fps', String(FPS), '--quality', 'delivery', '--quiet'], { cwd: here, env: quiet, stdio: 'inherit' });
  }
  for (const [out, enc] of OUT[name]) {
    mkdirSync(dirname(out), { recursive: true });
    // 再壓一次：遊戲裡的那一份要小；faststart 讓它邊下載邊播
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, ...audio, ...enc, '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    console.log(name + '：' + out);
  }
}
