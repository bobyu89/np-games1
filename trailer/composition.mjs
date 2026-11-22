// 前導片的分鏡：產生 HyperFrames 的 index.html。橫式和直式用同一份，寬高不同。
// 時間點對著 music.mjs 的鐘聲（改這裡的時間，要一起改配樂）。
// 畫面：
//   assets/<鏡頭>.mp4    遊戲的場景，一格一格錄下來的（燈塔掃光、霧飄、霧散開、燈亮起來）
//   assets/sprite-<劫影>.png  一隻劫影會動的樣子（42 格，7×6 排），背景透明
//   航海圖用 SVG 在這裡畫，島、航線、巡診船都會動
// 規則（HyperFrames）：每個有時間的元素都是 .clip，有 data-start、data-duration；一條暫停的時間軸登記在 window.__timelines.main；
// 不用亂數和時鐘，畫面只跟時間軸的時間有關。

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

/**
 * w, h：畫面大小。isles：[{ id, name, tag, x, y, r, from, chapter }]（tag 是症狀）。
 * creatures：[{ look, name, peril, complaint }]。elders：[{ look, name }]。url：網址
 */
export function compose({ w, h, isles, creatures, elders, url }) {
  const tall = h > w, m = Math.min(w, h);
  const cap = (id, at, text, top = false) => `<p class="cap${top ? ' top' : ''}" id="${id}" data-at="${at}">${chars(text)}</p>`;

  // ── 航海圖 ──
  const byId = Object.fromEntries(isles.map((i) => [i.id, i]));
  const order = [...isles].sort((a, b) => a.chapter - b.chapter || (a.from ? 1 : 0) - (b.from ? 1 : 0));
  const routes = isles.filter((i) => i.id !== 'main').map((i) => {
    const o = byId[i.from ?? 'main'], mx = (o.x + i.x) / 2, my = (o.y + i.y) / 2 - 30;
    return `<path class="route" id="r-${i.id}" d="M${o.x},${o.y} Q${mx},${my} ${i.x},${i.y}" pathLength="1" />`;
  }).join('');
  const islands = order.map((i) => `<g class="isle" id="i-${i.id}">
      <path d="${coast(i.id, i.x, i.y, i.r * 1.22)}" class="surf" /><path d="${coast(i.id, i.x, i.y, i.r)}" class="land${i.id === 'main' ? ' home' : ''}" />
      <text x="${i.x}" y="${i.y - 2}" class="name${i.r < 50 ? ' small' : ''}">${i.name}</text><text x="${i.x}" y="${i.y + 24}" class="sub">${i.tag}</text></g>`).join('');
  const chart = `<div class="chartwrap"><svg viewBox="0 0 1000 700" class="chart">
    <rect width="1000" height="700" fill="#efe3c8" />
    <g class="grid">${Array.from({ length: 21 }, (_, k) => `<path d="M${k * 50} 0V700" />`).join('')}${Array.from({ length: 15 }, (_, k) => `<path d="M0 ${k * 50}H1000" />`).join('')}</g>
    <g class="compass" transform="translate(880 110)"><circle r="52" /><circle r="40" /><path d="M0,-62 L9,0 L0,62 L-9,0Z" class="needle" /><path d="M-62,0 L0,9 L62,0 L0,-9Z" /><text y="-70">北</text></g>
    <text x="880" y="215" class="sea">霧　海</text>
    ${routes}${islands}
    <g id="boat" class="boat"><path d="M-22,0 L22,0 L14,10 L-14,10Z" /><path d="M0,-30 L0,0" /><path d="M2,-28 L18,-6 L2,-6Z" class="sail" /></g>
  </svg></div>`;

  // ── 十二劫影 ──
  const beasts = creatures.map((c, i) => `
  <div class="clip beast" id="c${i}" data-start="${12 + i}" data-duration="1" data-track-index="2">
    <div class="sprite" id="sp${i}" style="background-image:url(assets/sprite-${c.look}.png)"></div>
    <p class="tag"><b>${c.name}</b><small>${c.complaint}・${c.peril}</small></p>
  </div>`).join('');
  const lineup = creatures.map((c, i) => `<div class="mini" id="m${i}" style="background-image:url(assets/sprite-${c.look}.png)"></div>`).join('');

  // 換場的霧：一團一團從左邊推到右邊
  const WIPES = [5.6, 11.6, 23.6, 29.6, 35.6, 40.6, 45.6];
  const wipes = WIPES.map((t, k) => `<div class="clip wipe" id="w${k}" data-start="${t}" data-duration="1" data-track-index="4">${[0, 1, 2, 3, 4, 5].map((j) => `<i style="top:${(j * 19 + (k * 7) % 13) - 10}%;left:${-30 + (j % 3) * 9}%;width:${55 + (j * 13) % 25}%"></i>`).join('')}</div>`).join('');

  const html = `<!doctype html>
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
.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,20,.88), rgba(15,23,20,0) ${tall ? 38 : 48}%); }
.cap { position: absolute; left: 7%; right: 7%; bottom: ${tall ? 12 : 9}%; text-align: center; font-size: ${Math.round(m * (tall ? 0.062 : 0.056))}px; line-height: 1.5; letter-spacing: 0.06em; text-shadow: 0 0 ${Math.round(m * 0.02)}px #0f1714, 0 3px 8px #0f1714; }
.cap.top { bottom: auto; top: ${tall ? 10 : 8}%; }
.ch { display: inline-block; opacity: 0; }
.chartwrap { position: absolute; left: 50%; top: ${tall ? 30 : 50}%; width: ${tall ? Math.round(w * 1.5) : Math.round(w * 0.9)}px; transform: translate(-50%, -50%); }
.chart { display: block; width: 100%; height: auto; }
.chart .grid path { stroke: #2a2520; stroke-opacity: .1; stroke-width: 1; }
.chart .compass circle { fill: none; stroke: #6d6253; stroke-width: 1.5; } .chart .compass path { fill: #e3d4b1; stroke: #2a2520; stroke-width: 1.5; } .chart .compass .needle { fill: #b5532f; }
.chart .compass text { font-size: 24px; fill: #2a2520; text-anchor: middle; } .chart .sea { font-size: 26px; fill: #2f6b62; opacity: .6; letter-spacing: .3em; text-anchor: middle; }
.chart .route { fill: none; stroke: #2f6b62; stroke-width: 3; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: .85; }
.chart .surf { fill: none; stroke: #2f6b62; stroke-width: 2; stroke-dasharray: 2 7; opacity: .55; }
.chart .land { fill: #b9c9a3; stroke: #2a2520; stroke-width: 3; } .chart .land.home { fill: #d9a645; }
.chart .name { font-size: 28px; font-weight: 700; fill: #2a2520; text-anchor: middle; paint-order: stroke; stroke: #efe3c8; stroke-width: 5px; } .chart .name.small { font-size: 22px; }
.chart .sub { font-size: 20px; fill: #8a4b2c; text-anchor: middle; paint-order: stroke; stroke: #efe3c8; stroke-width: 4px; }
.chart .boat path { fill: #8a5a3b; stroke: #2a2520; stroke-width: 2.5; stroke-linejoin: round; } .chart .boat .sail { fill: #f3ead7; }
.mapbg { position: absolute; inset: 0; background: #2f4038; }
.fogbg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 55%, #3d5a51 0%, #1f2e29 70%); }
.fogbg i, .wipe i { position: absolute; display: block; aspect-ratio: 2 / 1; border-radius: 50%; background: radial-gradient(closest-side, rgba(239,227,200,.9), rgba(239,227,200,0)); }
.wipe { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.beast { position: absolute; inset: 0; }
.sprite { position: absolute; left: 50%; top: ${tall ? 44 : 46}%; width: ${Math.round(m * 0.72)}px; height: ${Math.round(m * 0.72)}px; margin: -${Math.round(m * 0.36)}px 0 0 -${Math.round(m * 0.36)}px; background-size: 700% 600%; background-repeat: no-repeat; }
.tag { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; top: ${tall ? 12 : 7}%; background: #efe3c8; color: #2a2520; border: ${Math.round(m * 0.005)}px solid #1d1a16; border-radius: ${Math.round(m * 0.02)}px; padding: .15em .9em .25em; font-size: ${Math.round(m * 0.06)}px; text-align: center; }
.tag small { display: block; font-size: .5em; color: #8a4b2c; }
.lineup { position: absolute; left: 4%; right: 4%; top: 50%; transform: translateY(-50%); display: grid; grid-template-columns: repeat(${tall ? 3 : 6}, 1fr); gap: 1%; }
.mini { aspect-ratio: 1; background-size: 700% 600%; background-position: 0 0; background-repeat: no-repeat; }
.row { position: absolute; left: 3%; right: 3%; top: ${tall ? 12 : 10}%; display: flex; gap: 1.5%; justify-content: center; flex-wrap: wrap; row-gap: 2%; }
.row figure { width: ${tall ? 30 : 18.5}%; text-align: center; font-size: ${Math.round(m * 0.036)}px; }
.row img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border: ${Math.round(m * 0.004)}px solid #1d1a16; border-radius: ${Math.round(m * 0.012)}px; background: #efe3c8; }
.end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: #0f1714; }
.end h1 { font-size: ${Math.round(m * 0.15)}px; letter-spacing: .16em; } .end h2 { font-size: ${Math.round(m * 0.06)}px; letter-spacing: .5em; color: #e7b65a; margin-top: .2em; }
.end p { font-size: ${Math.round(m * 0.038)}px; margin-top: 1.2em; } .end .note { font-size: ${Math.round(m * 0.026)}px; opacity: .65; margin-top: 2.2em; }
.beam { position: absolute; left: 50%; top: 50%; width: ${Math.round(m * 1.6)}px; height: ${Math.round(m * 0.5)}px; margin: -${Math.round(m * 0.25)}px 0 0 0; transform-origin: 0 50%; background: linear-gradient(to right, rgba(231,182,90,.35), rgba(231,182,90,0)); clip-path: polygon(0 45%, 100% 0, 100% 100%, 0 55%); }
#fade { position: absolute; inset: 0; background: #0f1714; z-index: 30; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="52" data-width="${w}" data-height="${h}">

  <video class="clip" id="v-title" src="assets/title.mp4" data-start="0" data-duration="6" data-track-index="0" muted></video>
  <video class="clip" id="v-hall" src="assets/hall.mp4" data-start="24" data-duration="6" data-track-index="0" muted></video>
  <video class="clip" id="v-ward" src="assets/ward.mp4" data-start="30" data-duration="6" data-track-index="0" muted></video>
  <video class="clip" id="v-tower" src="assets/tower.mp4" data-start="41" data-duration="5" data-track-index="0" muted></video>

  <div class="clip layer" id="s1" data-start="0" data-duration="6" data-track-index="1"><div class="shade"></div>
    ${cap('s1a', 0.9, '說吧，記事的人，')}${cap('s1b', 3.2, '說那位見習的故事。')}</div>

  <div class="clip layer" id="s2" data-start="6" data-duration="6" data-track-index="1"><div class="mapbg"></div>${chart}<div class="shade"></div>
    ${cap('s2a', 6.5, '霧海群島，十二座島。')}${cap('s2b', 8.9, tall ? '一座島，\n一種症狀。' : '一座島，一種症狀。')}</div>

  <div class="clip layer" id="s3" data-start="12" data-duration="12" data-track-index="1"><div class="fogbg">${[0, 1, 2, 3, 4].map((j) => `<i class="drift" id="f${j}" style="top:${10 + j * 17}%;left:${-20 + (j * 31) % 60}%;width:${60 + (j * 11) % 30}%;opacity:.18"></i>`).join('')}</div>
    <p class="cap top" id="s3a" data-at="12.05">${chars('人不舒服的時候，霧裡的海中老人\n會化成一種形狀，浮在他身邊。')}</p></div>
  ${beasts}

  <div class="clip layer" id="s4" data-start="24" data-duration="6" data-track-index="1"><div class="shade"></div>
    ${cap('s4a', 24.4, '你是剛出師的見習專科護理師。')}${cap('s4b', 27.0, '一張委託，就是一位病人。')}</div>

  <div class="clip layer" id="s5" data-start="30" data-duration="6" data-track-index="1"><div class="shade"></div>
    ${cap('s5a', 30.3, tall ? '它只告訴你哪裡不舒服，\n不告訴你為什麼。' : '它只告訴你哪裡不舒服，不告訴你為什麼。')}${cap('s5b', 33.0, tall ? '問、看、量，抓著它不放，\n它才會現出原形。' : '問、看、量，抓著它不放，它才會現出原形。')}</div>

  <div class="clip layer" id="s6" data-start="36" data-duration="5" data-track-index="1" style="background:#2f4038">
    <div class="row">${elders.map((e) => `<figure><img src="assets/${e.look}.jpg" alt="" /><figcaption>${e.name}</figcaption></figure>`).join('')}</div>
    ${cap('s6a', 37.6, tall ? '五島長老會：\n每一位都很會問，也都有不問的地方。' : '五島長老會：每一位都很會問，也都有不問的地方。')}</div>

  <div class="clip layer" id="s7" data-start="41" data-duration="5" data-track-index="1"><div class="shade"></div>
    ${cap('s7a', 41.3, '十五年前，燈塔熄過一次。')}${cap('s7b', 43.6, '這一次，換你把燈點亮。')}</div>

  <div class="clip layer" id="s8" data-start="46" data-duration="6" data-track-index="1">
    <div class="end"><div class="beam" id="beam"></div><div class="lineup">${lineup}</div>
      <h1 id="t1">${chars('霧脈公會')}</h1><h2 id="t2">歸航記</h2>
      <p id="t3">專科護理師口試的練習・十二種主訴</p>
      <p class="note" id="t4">病例是草稿，還沒經過臨床老師審查，不能當教材<br />${url}</p></div></div>

  ${wipes}
  <div class="clip" id="fade" data-start="0" data-duration="52" data-track-index="5"></div>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  // 字一個一個浮出來；離開的時候整句淡掉
  const say = (sel, at, out) => {
    tl.fromTo(sel + ' .ch', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.045, ease: 'power2.out' }, at);
    if (out) tl.to(sel + ' .ch', { opacity: 0, duration: 0.3 }, out);
  };
  // 開場：從黑淡入，鏡頭慢慢推近燈塔
  tl.fromTo('#fade', { opacity: 1 }, { opacity: 0, duration: 1.4, ease: 'power1.out' }, 0);
  tl.fromTo('#v-title', { scale: 1.02 }, { scale: 1.14, duration: 6, ease: 'none' }, 0);
  say('#s1a', 0.9, 3.0); say('#s1b', 3.2);
  // 航海圖：島照章節一座一座從霧裡亮起，航線一條一條畫出來，巡診船從家裡出發
  ${JSON.stringify(order.map((i) => i.id))}.forEach((id, k) => {
    tl.fromTo('#i-' + id, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' }, 6.3 + k * 0.33);
    if (id !== 'main') tl.to('#r-' + id, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut' }, 6.45 + k * 0.33);
  });
  tl.fromTo('#boat', { x: ${byId.main.x + 120}, y: ${byId.main.y + 55} }, { x: ${byId.tide.x + 70}, y: ${byId.tide.y + 40}, duration: 4.5, ease: 'power1.inOut' }, 7.2);
  tl.fromTo('.chart', { scale: 1.12 }, { scale: 1, duration: 6, ease: 'power1.out' }, 6);
  say('#s2a', 6.5, 8.6); say('#s2b', 8.9);
  // 十二劫影：每一隻從霧裡浮上來，牠自己的動畫一直在動（42 格，7×6）
  [0, 1, 2, 3, 4].forEach((j) => tl.fromTo('#f' + j, { xPercent: -10 }, { xPercent: 25 + j * 6, duration: 12, ease: 'none' }, 12));
  say('#s3a', 12.05, 23.6);
  for (let i = 0; i < ${creatures.length}; i++) {
    const t = 12 + i, el = document.getElementById('sp' + i), cell = { f: 0 };
    tl.fromTo('#sp' + i, { opacity: 0, y: ${Math.round(m * 0.08)}, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, t);
    tl.to('#sp' + i, { opacity: 0, scale: 1.08, duration: 0.18 }, t + 0.82);
    tl.fromTo('#c' + i + ' .tag', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.25 }, t + 0.08);
    tl.to(cell, { f: 41, duration: 1, ease: 'none', onUpdate: () => { const n = Math.round(cell.f), c = n % 7, r = Math.floor(n / 7); el.style.backgroundPosition = (c * 100 / 6) + '% ' + (r * 100 / 5) + '%'; } }, t);
  }
  tl.fromTo('#v-hall', { scale: 1 }, { scale: 1.1, duration: 6, ease: 'none' }, 24);
  say('#s4a', 24.4, 26.8); say('#s4b', 27.0);
  tl.fromTo('#v-ward', { scale: 1.1 }, { scale: 1, duration: 6, ease: 'power1.inOut' }, 30);
  say('#s5a', 30.3, 32.8); say('#s5b', 33.0);
  tl.fromTo('#s6 .row figure', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.35, ease: 'power2.out' }, 36.2);
  tl.to('#s6 .row figure', { y: -8, duration: 2.4, ease: 'sine.inOut', stagger: 0.2 }, 38.2);
  say('#s6a', 37.6);
  tl.fromTo('#v-tower', { scale: 1.08 }, { scale: 1, duration: 5, ease: 'none' }, 41);
  say('#s7a', 41.3, 43.3); say('#s7b', 43.6);
  // 換場的霧
  ${JSON.stringify(WIPES)}.forEach((t, k) => tl.fromTo('#w' + k + ' i', { xPercent: -40, opacity: 0 }, { xPercent: 260, opacity: 1, duration: 1, stagger: 0.03, ease: 'power1.inOut' }, t));
  // 片名：燈塔的光掃過，十二隻劫影排成一排，字一個一個亮
  tl.fromTo('#beam', { rotation: -200 }, { rotation: 20, duration: 6, ease: 'none' }, 46);
  tl.fromTo('.lineup .mini', { opacity: 0 }, { opacity: 0.22, duration: 0.4, stagger: 0.05 }, 46.2);
  tl.fromTo('#t1 .ch', { opacity: 0, y: 30, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 46.3);
  tl.fromTo('#t2', { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '0.5em', duration: 0.9 }, 47.2);
  tl.fromTo('#t3', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 48.2);
  tl.fromTo('#t4', { opacity: 0 }, { opacity: 0.65, duration: 0.6 }, 49.0);
  tl.to('#fade', { opacity: 1, duration: 0.8 }, 51.2);
  window.__timelines.main = tl;
  tl.seek(0);
</script>
</body>
</html>`;
  return html;
}
