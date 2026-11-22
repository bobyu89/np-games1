// 前導片的分鏡「歸航記」：用《奧德賽》的整趟旅程當故事，照史詩的順序走十二劫，每一劫揭曉它在霧海裡是哪一個症狀、哪一隻劫影、哪四位病人。
// 產生 HyperFrames 的 index.html。橫式和直式用同一份，寬高不同。時間點對著 music.mjs 的鐘聲（改這裡的時間，要一起改配樂）。
//   0–6   夜裡的霧港                         「說吧，記事的人，說那位漂流的人：他在海上走了十年，一關一關認出眼前的危險，才回到家。」
//   6–11  公會大廳（蒙托拉、你、斐米歐）      「現在換你出海。你是剛出師的見習專科護理師。」
//   11–15 航海圖，島一座一座從霧裡浮出來     「霧海群島就是那片海：十二座島，十二段試煉。」
//   15–45 十二劫，一劫 2.5 秒：一句神話 → 劫影從霧裡浮出來 → 揭曉症狀 → 那座島的四位病人一個一個出現
//   45–49 四十八位病人排滿畫面               「每一劫，都是一種主訴最容易掉進去的陷阱。」
//   49–54 回到霧港，燈塔亮起，十二把斧頭一把一把亮　「歸航：拉開那張弓，一箭穿過十二把斧頭。」
//   54–60 片名
// 畫面：assets/<鏡頭>.mp4 是遊戲的場景一格一格錄下來的；assets/sprite-<劫影>.png 是一隻劫影會動的樣子（42 格，7×6）；
// assets/p-<病例>.png 是去背的病人（assets/cutouts）；航海圖用 SVG 在這裡畫。
// 規則（HyperFrames）：有時間的元素都是 .clip，有 data-start、data-duration；一條暫停的時間軸登記在 window.__timelines.main；
// 不用亂數和時鐘，畫面只跟時間軸的時間有關。

export const LENGTH = 60;
export const EPIC = 15, STEP = 2.5;   // 第 15 秒開始走十二劫，一劫 2.5 秒

/** 史詩的順序：每一劫在霧海裡是哪一座島（島 id），和一句神話 */
export const ODYSSEY = [
  ['lotus', '吃了果子的人，忘了要回家，也不想說話。'],
  ['main', '巨人只有一隻眼睛，只看得到一樣東西。'],
  ['wind', '袋子打開得太早，船被吹回了原點。'],
  ['keel', '巨人從崖上，把大石砸進港裡。'],
  ['circe', '女巫把人變了樣子，裡面還是原來那個人。'],
  ['shade', '亡魂不會先開口，要你先問。'],
  ['book', '最好聽的歌聲，把船帶向礁石。'],
  ['tide', '只看窄道的一邊，就被另一邊吃掉。'],
  ['whirl', '漩渦一天三次，把海吞進去，又吐出來。'],
  ['sun', '餓了的人，動了不該動的牛。'],
  ['bamboo', '被留在島上七年，一天比一天瘦。'],
  ['boar', '老乳母洗腳的時候，摸到了那道疤。'],
];

/** 用島的位置算一條固定的海岸線（跟遊戲的航海圖同一個算法） */
function coast(id, x, y, r) {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
  const n = 22, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 0.72 + rnd() * 0.42, sx = id === 'main' ? 1.35 : 1.15;
    pts.push([x + Math.cos(a) * r * k * sx, y + Math.sin(a) * r * k * 0.82]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = 'M' + mid(pts[n - 1], pts[0]).map((v) => v.toFixed(1)).join(',');
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); d += ` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`; }
  return d + 'Z';
}

/** 一句字幕：一個字一個 span，讓字一個一個浮出來 */
const chars = (text) => [...text].map((c) => (c === '\n' ? '<br />' : `<span class="ch">${c}</span>`)).join('');
const NUM = '一二三四五六七八九十';
const numZh = (n) => (n <= 10 ? NUM[n - 1] : '十' + NUM[n - 11]);

/** 一把斧頭（SVG） */
const AXE = '<svg viewBox="0 0 60 90"><path class="haft" d="M28 14 L32 14 L33 86 L27 86Z" /><path class="blade" d="M31 10 C46 6 56 16 56 30 C56 42 46 50 31 46 C36 36 36 22 31 10Z" /><path class="blade" d="M29 10 C18 8 8 16 8 28 C8 38 18 44 29 42 C25 34 25 20 29 10Z" /></svg>';

/**
 * w, h：畫面大小。isles：照史詩的順序 [{ id, name, x, y, r, look, complaint, shadow, peril, myth, patients: [{ id, name }] }]。
 * chart：航海圖上的島 [{ id, name, x, y, r, from }]。url：網址
 */
export function compose({ w, h, isles, chart, url }) {
  const tall = h > w, m = Math.min(w, h), px = (v) => Math.round(v) + 'px';
  const cap = (id, text, top = false) => `<p class="cap${top ? ' top' : ''}" id="${id}">${chars(text)}</p>`;
  const byId = Object.fromEntries(chart.map((i) => [i.id, i]));

  // ── 航海圖（全景）──
  const k = Math.min((w * 0.94) / 1000, (h * (tall ? 0.55 : 0.8)) / 700), SW = 1000 * k, SH = 700 * k;
  const left = (w - SW) / 2, top = tall ? h * 0.18 : (h - SH) / 2 - h * 0.04;
  const routes = chart.filter((i) => i.id !== 'main').map((i) => {
    const o = byId[i.from ?? 'main'], mx = (o.x + i.x) / 2, my = (o.y + i.y) / 2 - 30;
    return `<path class="route" d="M${o.x},${o.y} Q${mx},${my} ${i.x},${i.y}" pathLength="1" />`;
  }).join('');
  const islands = chart.map((i) => `<g class="isle"><path d="${coast(i.id, i.x, i.y, i.r * 1.22)}" class="surf" /><path d="${coast(i.id, i.x, i.y, i.r)}" class="land${i.id === 'main' ? ' home' : ''}" />
      <text x="${i.x}" y="${i.y + 8}" class="name${i.r < 50 ? ' small' : ''}">${i.name}</text></g>`).join('');
  const map = `<svg id="chart" viewBox="0 0 1000 700" width="${SW.toFixed(0)}" height="${SH.toFixed(0)}" style="left:${left.toFixed(0)}px;top:${top.toFixed(0)}px">
    <rect width="1000" height="700" fill="#efe3c8" rx="14" />
    <g class="grid">${Array.from({ length: 21 }, (_, n) => `<path d="M${n * 50} 0V700" />`).join('')}${Array.from({ length: 15 }, (_, n) => `<path d="M0 ${n * 50}H1000" />`).join('')}</g>
    <g class="compass" transform="translate(880 110)"><circle r="52" /><circle r="40" /><path d="M0,-62 L9,0 L0,62 L-9,0Z" class="needle" /><path d="M-62,0 L0,9 L62,0 L0,-9Z" /><text y="-70">北</text></g>
    <text x="880" y="215" class="sea">霧　海</text>${routes}${islands}
  </svg>`;

  // ── 十二劫：一劫一張 ──
  const POS = tall
    ? { label: 8, myth: 13.5, beast: [50, 37], size: 0.56, reveal: 56, pts: 70 }
    : { label: 7, myth: 15, beast: [27, 58], size: 0.6, reveal: 27, pts: 52 };
  const perils = isles.map((i, n) => `
  <div class="clip peril" id="e${n}" data-start="${EPIC + n * STEP}" data-duration="${STEP}" data-track-index="2">
    <p class="isle-name">${i.name}</p>
    <p class="label">第${numZh(n + 1)}劫・${i.peril.replace('之劫', '')}</p>
    <p class="myth">${chars(i.myth)}</p>
    <div class="glow"></div><div class="sprite" id="sp${n}" style="background-image:url(assets/sprite-${i.look}.png)"></div>
    <p class="reveal"><small>在霧海裡，牠是</small><b>${i.complaint}</b><small>${i.shadow}</small></p>
    <div class="pts">${i.patients.map((q, j) => `<figure id="p${n}-${j}"><img src="assets/p-${q.id}.png" alt="" /><figcaption>${q.name}</figcaption></figure>`).join('')}</div>
  </div>`).join('');
  const wall = isles.flatMap((i) => i.patients).map((q) => `<img src="assets/p-${q.id}.png" alt="" />`).join('');
  const axes = isles.map((i, n) => `<figure class="axe" id="a${n}">${AXE}<figcaption>${i.complaint}</figcaption></figure>`).join('');

  // 換場的霧：一團一團從左邊推到右邊
  const WIPES = [5.6, 10.6, 14.6, 44.6, 48.6, 53.6];
  const wipes = WIPES.map((t, j) => `<div class="clip wipe" id="w${j}" data-start="${t}" data-duration="1" data-track-index="4">${[0, 1, 2, 3, 4, 5].map((q) => `<i style="top:${(q * 19 + (j * 7) % 13) - 10}%;left:${-30 + (q % 3) * 9}%;width:${55 + (q * 13) % 25}%"></i>`).join('')}</div>`).join('');

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${w}, height=${h}" />
<script src="assets/gsap.min.js"></script>
<style>
@font-face { font-family: 'WenKai'; src: url(assets/wenkai.woff2) format('woff2'); font-weight: 700; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${w}px; height: ${h}px; overflow: hidden; background: #0f1714; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: 'WenKai', serif; color: #f3ead7; }
video.clip { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.layer { position: absolute; inset: 0; }
.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,20,.9), rgba(15,23,20,0) ${tall ? 40 : 52}%); }
.cap { position: absolute; left: 6%; right: 6%; bottom: ${tall ? 10 : 8}%; text-align: center; font-size: ${px(m * (tall ? 0.058 : 0.052))}; line-height: 1.5; letter-spacing: .05em; text-shadow: 0 0 ${px(m * 0.02)} #0f1714, 0 3px 8px #0f1714; }
.cap.top { bottom: auto; top: ${tall ? 8 : 7}%; }
.ch { display: inline-block; opacity: 0; }
.sea-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, #3d5a51 0%, #1c2925 75%); }
#chart { position: absolute; }
#chart .grid path { stroke: #2a2520; stroke-opacity: .1; stroke-width: 1; }
#chart .compass circle { fill: none; stroke: #6d6253; stroke-width: 1.5; } #chart .compass path { fill: #e3d4b1; stroke: #2a2520; stroke-width: 1.5; } #chart .compass .needle { fill: #b5532f; }
#chart .compass text { font-size: 24px; fill: #2a2520; text-anchor: middle; } #chart .sea { font-size: 26px; fill: #2f6b62; opacity: .6; letter-spacing: .3em; text-anchor: middle; }
#chart .route { fill: none; stroke: #2f6b62; stroke-width: 3; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: .8; }
#chart .surf { fill: none; stroke: #2f6b62; stroke-width: 2; stroke-dasharray: 2 7; opacity: .45; }
#chart .land { fill: #b9c9a3; stroke: #2a2520; stroke-width: 3; } #chart .land.home { fill: #d9a645; }
#chart .name { font-size: 28px; font-weight: 700; fill: #2a2520; text-anchor: middle; paint-order: stroke; stroke: #efe3c8; stroke-width: 5px; } #chart .name.small { font-size: 23px; }
.peril { position: absolute; inset: 0; background: radial-gradient(ellipse at ${POS.beast[0]}% ${POS.beast[1]}%, #3d5a51 0%, #1c2925 70%); }
.peril .isle-name { position: absolute; right: 4%; bottom: 3%; font-size: ${px(m * 0.2)}; opacity: .07; letter-spacing: .1em; white-space: nowrap; }
.peril .label { position: absolute; left: 0; right: 0; top: ${POS.label}%; text-align: center; font-size: ${px(m * 0.05)}; color: #e7b65a; letter-spacing: .2em; }
.peril .myth { position: absolute; left: 4%; right: 4%; top: ${POS.myth}%; text-align: center; font-size: ${px(m * (tall ? 0.044 : 0.046))}; line-height: 1.45; }
.peril .glow { position: absolute; left: ${POS.beast[0]}%; top: ${POS.beast[1]}%; width: ${px(m * POS.size)}; height: ${px(m * POS.size)}; margin: -${px(m * POS.size / 2)} 0 0 -${px(m * POS.size / 2)}; border-radius: 50%; background: radial-gradient(closest-side, rgba(239,227,200,.5), rgba(239,227,200,0)); }
.peril .sprite { position: absolute; left: ${POS.beast[0]}%; top: ${POS.beast[1]}%; width: ${px(m * POS.size)}; height: ${px(m * POS.size)}; margin: -${px(m * POS.size / 2)} 0 0 -${px(m * POS.size / 2)}; background-size: 700% 600%; background-repeat: no-repeat; }
.peril .reveal { position: absolute; ${tall ? 'left: 0; right: 0;' : 'left: 50%; right: 4%;'} top: ${POS.reveal}%; text-align: center; }
.peril .reveal small { display: block; font-size: ${px(m * 0.032)}; color: rgba(243,234,215,.75); }
.peril .reveal b { display: inline-block; margin: .1em 0; padding: .05em .5em .12em; font-size: ${px(m * 0.1)}; background: #efe3c8; color: #2a2520; border: ${px(m * 0.005)} solid #1d1a16; border-radius: ${px(m * 0.02)}; }
.peril .pts { position: absolute; ${tall ? 'left: 4%; right: 4%;' : 'left: 51%; right: 3%;'} top: ${POS.pts}%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2%; }
.peril .pts figure { text-align: center; font-size: ${px(m * 0.032)}; text-shadow: 0 2px 6px #0f1714; }
.peril .pts img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; object-position: 50% 100%; margin-bottom: .1em; }
.fog i, .wipe i { position: absolute; display: block; aspect-ratio: 2 / 1; border-radius: 50%; background: radial-gradient(closest-side, rgba(239,227,200,.9), rgba(239,227,200,0)); }
.wipe { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.wall { position: absolute; left: 2%; right: 2%; top: ${tall ? 6 : 3}%; display: grid; grid-template-columns: repeat(${tall ? 6 : 12}, 1fr); }
.wall img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; padding: 4%; }
.axes { position: absolute; left: 6%; right: 6%; top: ${tall ? 30 : 22}%; display: grid; grid-template-columns: repeat(${tall ? 4 : 6}, 1fr); gap: ${tall ? 3 : 2}% 2%; }
.axe { text-align: center; font-size: ${px(m * 0.034)}; color: rgba(243,234,215,.5); text-shadow: 0 2px 6px #0f1714; }
.axe svg { display: block; width: 46%; margin: 0 auto .2em; overflow: visible; }
.axe .haft { fill: #6b5236; } .axe .blade { fill: #55625d; stroke: #1d1a16; stroke-width: 2; }
.veil { position: absolute; inset: 0; background: rgba(10,16,14,.55); }
.end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(15,23,20,.88); }
.end h1 { font-size: ${px(m * 0.15)}; letter-spacing: .16em; } .end h2 { font-size: ${px(m * 0.06)}; letter-spacing: .5em; color: #e7b65a; margin-top: .2em; }
.end p { font-size: ${px(m * 0.038)}; margin-top: 1.2em; } .end .note { font-size: ${px(m * 0.026)}; opacity: .65; margin-top: 2.2em; }
.dark { position: absolute; inset: 0; background: #0a100e; }
#fade { position: absolute; inset: 0; background: #0f1714; z-index: 30; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${LENGTH}" data-width="${w}" data-height="${h}">

  <video class="clip" id="v-title" src="assets/title.mp4" data-start="0" data-duration="6" data-track-index="0" muted></video>
  <video class="clip" id="v-hall" src="assets/hall.mp4" data-start="6" data-duration="5" data-track-index="0" muted></video>
  <video class="clip" id="v-home" src="assets/home.mp4" data-start="49" data-duration="11" data-track-index="0" muted></video>

  <div class="clip layer" id="s1" data-start="0" data-duration="6" data-track-index="1"><div class="shade"></div>
    ${cap('s1a', '說吧，記事的人，說那位漂流的人：')}${cap('s1b', tall ? '他在海上走了十年，\n一關一關認出眼前的危險，才回到家。' : '他在海上走了十年，一關一關認出眼前的危險，才回到家。')}</div>

  <div class="clip layer" id="s2" data-start="6" data-duration="5" data-track-index="1"><div class="shade"></div>
    ${cap('s2a', '現在換你出海。')}${cap('s2b', '你是剛出師的見習專科護理師。')}</div>

  <div class="clip layer" id="s3" data-start="11" data-duration="4" data-track-index="1"><div class="sea-bg"></div>${map}<div class="shade"></div>
    ${cap('s3a', tall ? '霧海群島就是那片海：\n十二座島，十二段試煉。' : '霧海群島就是那片海：十二座島，十二段試煉。')}</div>
  ${perils}

  <div class="clip layer" id="s4" data-start="45" data-duration="4" data-track-index="1"><div class="sea-bg"></div>
    <div class="wall">${wall}</div><div class="shade"></div>
    ${cap('s4a', tall ? '每一劫，\n都是一種主訴最容易掉進去的陷阱。' : '每一劫，都是一種主訴最容易掉進去的陷阱。')}</div>

  <div class="clip layer" id="s5" data-start="49" data-duration="5" data-track-index="1"><div class="dark" id="dark"></div><div class="veil" id="veil"></div>
    <div class="axes">${axes}</div><div class="shade"></div>
    ${cap('s5a', tall ? '歸航：拉開那張弓，\n一箭穿過十二把斧頭。' : '歸航：拉開那張弓，一箭穿過十二把斧頭。')}</div>

  <div class="clip layer" id="s6" data-start="54" data-duration="6" data-track-index="1">
    <div class="end"><h1 id="t1">${chars('霧脈公會')}</h1><h2 id="t2">歸航記</h2>
      <p id="t3">專科護理師口試的練習・十二種主訴</p>
      <p class="note" id="t4">病例是草稿，還沒經過臨床老師審查，不能當教材<br />${url}</p></div></div>

  ${wipes}
  <div class="clip" id="fade" data-start="0" data-duration="${LENGTH}" data-track-index="5"></div>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  // 字一個一個浮出來；離開的時候整句淡掉
  const say = (sel, at, out, gap = 0.045) => {
    tl.fromTo(sel + ' .ch', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: gap, ease: 'power2.out' }, at);
    if (out) tl.to(sel + ' .ch', { opacity: 0, duration: 0.3 }, out);
  };
  // 一隻劫影自己的動畫：42 格，7×6 排，onUpdate 照時間挑一格
  const play = (el, at, dur) => { const c = { f: 0 }; tl.fromTo(c, { f: 0 }, { f: 41, duration: dur, ease: 'none', onUpdate: () => { const n = Math.round(c.f); el.style.backgroundPosition = ((n % 7) * 100 / 6) + '% ' + (Math.floor(n / 7) * 100 / 5) + '%'; } }, at); };

  // 開場：從黑淡入，鏡頭慢慢推近
  tl.fromTo('#fade', { opacity: 1 }, { opacity: 0, duration: 1.3, ease: 'power1.out' }, 0);
  tl.fromTo('#v-title', { scale: 1.02 }, { scale: 1.14, duration: 6, ease: 'none' }, 0);
  say('#s1a', 0.7, 2.7); say('#s1b', 2.9, null, 0.035);
  tl.fromTo('#v-hall', { scale: 1.0 }, { scale: 1.08, duration: 5, ease: 'none' }, 6);
  say('#s2a', 6.3, 8.3); say('#s2b', 8.5);
  // 航海圖：島一座一座從霧裡浮出來，航線連起來
  tl.fromTo('#chart', { opacity: 0, scale: 1.08, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 11);
  tl.fromTo('#chart .isle', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.8)' }, 11.2);
  tl.to('#chart .route', { strokeDashoffset: 0, duration: 0.6, stagger: 0.1 }, 11.6);
  say('#s3a', 11.5);
  // 十二劫：一句神話 → 劫影從霧裡浮出來 → 揭曉症狀 → 四位病人
  for (let n = 0; n < ${isles.length}; n++) {
    const t = ${EPIC} + n * ${STEP}, e = '#e' + n;
    tl.fromTo(e + ' .label', { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.2em', duration: 0.4 }, t + 0.05);
    say(e + ' .myth', t + 0.15, null, 0.03);
    tl.fromTo(e + ' .sprite', { opacity: 0, y: ${Math.round(m * 0.08)}, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, t + 0.35);
    tl.fromTo(e + ' .glow', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5 }, t + 0.3);
    tl.fromTo(e + ' .reveal', { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, t + 1.05);
    tl.fromTo(e + ' .pts figure', { opacity: 0, y: 24, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.28, stagger: 0.1, ease: 'back.out(1.5)' }, t + 1.3);
    tl.fromTo(e + ' .isle-name', { xPercent: 4 }, { xPercent: -4, duration: ${STEP}, ease: 'none' }, t);
    tl.to(e + ' .label, ' + e + ' .myth, ' + e + ' .sprite, ' + e + ' .glow, ' + e + ' .reveal, ' + e + ' .pts', { opacity: 0, duration: 0.2 }, t + ${STEP} - 0.22);
    play(document.getElementById('sp' + n), t, ${STEP});
  }
  // 四十八位病人排滿畫面
  tl.fromTo('.wall img', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.035, ease: 'back.out(1.5)' }, 45.05);
  say('#s4a', 45.8);
  // 歸航：燈塔亮起，十二把斧頭一把一把亮
  tl.fromTo('#v-home', { scale: 1.1 }, { scale: 1.0, duration: 6, ease: 'power1.out' }, 49);
  tl.fromTo('#dark', { opacity: 0.7 }, { opacity: 0, duration: 1.6, ease: 'power2.inOut' }, 49.3);
  tl.fromTo('.axe', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }, 49.4);
  for (let n = 0; n < ${isles.length}; n++) {
    tl.to('#a' + n + ' .blade', { fill: '#e7b65a', duration: 0.2 }, 50.8 + n * 0.25);
    tl.to('#a' + n, { color: '#f3ead7', duration: 0.2 }, 50.8 + n * 0.25);
    tl.fromTo('#a' + n + ' svg', { filter: 'drop-shadow(0 0 0 rgba(231,182,90,0))' }, { filter: 'drop-shadow(0 0 12px rgba(231,182,90,.9))', duration: 0.25 }, 50.8 + n * 0.25);
  }
  say('#s5a', 49.6);
  // 片名
  tl.fromTo('#t1 .ch', { opacity: 0, y: 30, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 54.4);
  tl.fromTo('#t2', { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '0.5em', duration: 0.9 }, 55.2);
  tl.fromTo('#t3', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 56.0);
  tl.fromTo('#t4', { opacity: 0 }, { opacity: 0.65, duration: 0.6 }, 56.6);
  tl.to('#fade', { opacity: 1, duration: 0.8 }, ${LENGTH - 0.9});
  // 換場的霧
  ${JSON.stringify(WIPES)}.forEach((t, j) => tl.fromTo('#w' + j + ' i', { xPercent: -40, opacity: 0 }, { xPercent: 260, opacity: 1, duration: 1, stagger: 0.03, ease: 'power1.inOut' }, t));
  window.__timelines.main = tl;
  tl.seek(0);
</script>
</body>
</html>`;
}
