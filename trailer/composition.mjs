// 前導片的分鏡「出航：一座島一種症狀」：產生 HyperFrames 的 index.html。橫式和直式用同一份，寬高不同。
// 不出現任何病人。時間點對著 music.mjs 的鐘聲（改這裡的時間，要一起改配樂的 CUES）。
//   0–5   夜裡的霧港（燈塔掃光、霧飄）             「說吧，記事的人，說那位見習的故事。」
//   5–10  公會大廳（蒙托拉、你、斐米歐）            「你是剛出師的見習專科護理師。蒙托拉帶你出海巡診。」
//   10–14 航海圖全景，十二座島還在霧裡，船出港      「霧海群島，十二座島。一座島，一種症狀。」
//   14–38 航行：一座島兩秒。航線畫出來、島亮起來、寫上症狀，那裡的劫影從霧裡浮出來
//   38–42 十二隻劫影排成一片                        「它只告訴你哪裡不舒服，不告訴你為什麼。」
//   42–47 回到霧港，燈塔從暗到亮                    「問、看、量，抓著它不放。燈亮了，船就回得了家。」
//   47–55 十二把斧頭一把一把亮起來，片名
// 畫面：assets/<鏡頭>.mp4 是遊戲的場景一格一格錄下來的；assets/sprite-<劫影>.png 是一隻劫影會動的樣子（42 格，7×6）；航海圖用 SVG 在這裡畫。
// 規則（HyperFrames）：有時間的元素都是 .clip，有 data-start、data-duration；一條暫停的時間軸登記在 window.__timelines.main；
// 不用亂數和時鐘，畫面只跟時間軸的時間有關。

export const LENGTH = 55;
export const VOYAGE = 14, LEG = 2;   // 第 14 秒開始航行，一座島兩秒

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

/** 一把斧頭（SVG） */
const AXE = '<svg viewBox="0 0 60 90"><path class="haft" d="M28 14 L32 14 L33 86 L27 86Z" /><path class="blade" d="M31 10 C46 6 56 16 56 30 C56 42 46 50 31 46 C36 36 36 22 31 10Z" /><path class="blade" d="M29 10 C18 8 8 16 8 28 C8 38 18 44 29 42 C25 34 25 20 29 10Z" /></svg>';

/**
 * w, h：畫面大小。isles：照航行的順序 [{ id, name, x, y, r, from, look, complaint, shadow, peril }]。url：網址
 */
export function compose({ w, h, isles, url }) {
  const tall = h > w, m = Math.min(w, h);
  const cap = (id, text, top = false) => `<p class="cap${top ? ' top' : ''}" id="${id}">${chars(text)}</p>`;
  const byId = Object.fromEntries(isles.map((i) => [i.id, i]));

  // ── 航海圖：整張放得進畫面的大小（k），鏡頭用 GSAP 推近、平移 ──
  const k = Math.min((w * 0.94) / 1000, (h * (tall ? 0.6 : 0.86)) / 700), SW = 1000 * k, SH = 700 * k;
  const left = (w - SW) / 2, top = tall ? h * 0.08 : (h - SH) / 2;
  const ZOOM = tall ? 2.0 : 2.1, focus = tall ? [w * 0.5, h * 0.27] : [w * 0.33, h * 0.5];
  const cam = (i) => ({ x: +(focus[0] - left - i.x * k * ZOOM).toFixed(1), y: +(focus[1] - top - i.y * k * ZOOM).toFixed(1) });
  const routes = isles.filter((i) => i.id !== 'main').map((i) => {
    const o = byId[i.from ?? 'main'], mx = (o.x + i.x) / 2, my = (o.y + i.y) / 2 - 30;
    return `<path class="route" id="r-${i.id}" d="M${o.x},${o.y} Q${mx},${my} ${i.x},${i.y}" pathLength="1" />`;
  }).join('');
  const islands = isles.map((i) => `<g class="isle" id="i-${i.id}">
      <path d="${coast(i.id, i.x, i.y, i.r * 1.22)}" class="surf" /><path d="${coast(i.id, i.x, i.y, i.r)}" class="fogged" />
      <path d="${coast(i.id, i.x, i.y, i.r)}" class="land${i.id === 'main' ? ' home' : ''}" />
      <text x="${i.x}" y="${i.y - 2}" class="name${i.r < 50 ? ' small' : ''}">${i.name}</text><text x="${i.x}" y="${i.y + 24}" class="sub">${i.complaint}</text></g>`).join('');
  const chart = `<svg id="chart" viewBox="0 0 1000 700" width="${SW.toFixed(0)}" height="${SH.toFixed(0)}" style="left:${left.toFixed(0)}px;top:${top.toFixed(0)}px">
    <rect width="1000" height="700" fill="#efe3c8" rx="14" />
    <g class="grid">${Array.from({ length: 21 }, (_, n) => `<path d="M${n * 50} 0V700" />`).join('')}${Array.from({ length: 15 }, (_, n) => `<path d="M0 ${n * 50}H1000" />`).join('')}</g>
    <g class="compass" transform="translate(880 110)"><circle r="52" /><circle r="40" /><path d="M0,-62 L9,0 L0,62 L-9,0Z" class="needle" /><path d="M-62,0 L0,9 L62,0 L0,-9Z" /><text y="-70">北</text></g>
    <text x="880" y="215" class="sea">霧　海</text>
    ${routes}${islands}
    <g id="boat" class="boat"><path d="M-22,0 L22,0 L14,10 L-14,10Z" /><path d="M0,-30 L0,0" /><path d="M2,-28 L18,-6 L2,-6Z" class="sail" /></g>
  </svg>`;

  // ── 航行的時候，每座島的劫影：從霧裡浮出來，標上症狀 ──
  const cards = isles.map((i, n) => `
  <div class="clip card" id="k${n}" data-start="${VOYAGE + n * LEG}" data-duration="${LEG}" data-track-index="2">
    <div class="glow"></div><div class="sprite" id="sp${n}" style="background-image:url(assets/sprite-${i.look}.png)"></div>
    <p class="tag"><b>${i.complaint}</b><small>${i.shadow}・${i.peril}</small></p>
  </div>`).join('');
  const lineup = isles.map((i, n) => `<figure><div class="mini" id="m${n}" style="background-image:url(assets/sprite-${i.look}.png)"></div><figcaption>${i.complaint}</figcaption></figure>`).join('');
  const axes = isles.map((i, n) => `<figure class="axe" id="a${n}">${AXE}<figcaption>${i.complaint}</figcaption></figure>`).join('');

  // 換場的霧：一團一團從左邊推到右邊
  const WIPES = [4.6, 9.6, 37.6, 41.6, 46.6];
  const wipes = WIPES.map((t, j) => `<div class="clip wipe" id="w${j}" data-start="${t}" data-duration="1" data-track-index="4">${[0, 1, 2, 3, 4, 5].map((q) => `<i style="top:${(q * 19 + (j * 7) % 13) - 10}%;left:${-30 + (q % 3) * 9}%;width:${55 + (q * 13) % 25}%"></i>`).join('')}</div>`).join('');
  const px = (v) => Math.round(v) + 'px';

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
.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,20,.88), rgba(15,23,20,0) ${tall ? 38 : 50}%); }
.cap { position: absolute; left: 7%; right: 7%; bottom: ${tall ? 11 : 9}%; text-align: center; font-size: ${px(m * (tall ? 0.062 : 0.056))}; line-height: 1.5; letter-spacing: .06em; text-shadow: 0 0 ${px(m * 0.02)} #0f1714, 0 3px 8px #0f1714; }
.cap.top { bottom: auto; top: ${tall ? 9 : 8}%; }
.ch { display: inline-block; opacity: 0; }
.sea-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, #3d5a51 0%, #1c2925 75%); }
#chart { position: absolute; }
#chart .grid path { stroke: #2a2520; stroke-opacity: .1; stroke-width: 1; }
#chart .compass circle { fill: none; stroke: #6d6253; stroke-width: 1.5; } #chart .compass path { fill: #e3d4b1; stroke: #2a2520; stroke-width: 1.5; } #chart .compass .needle { fill: #b5532f; }
#chart .compass text { font-size: 24px; fill: #2a2520; text-anchor: middle; } #chart .sea { font-size: 26px; fill: #2f6b62; opacity: .6; letter-spacing: .3em; text-anchor: middle; }
#chart .route { fill: none; stroke: #2f6b62; stroke-width: 3.5; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: .9; }
#chart .surf { fill: none; stroke: #2f6b62; stroke-width: 2; stroke-dasharray: 2 7; opacity: .45; }
#chart .fogged { fill: #d9cfbb; stroke: #8f8676; stroke-width: 2.5; stroke-dasharray: 6 6; }
#chart .land { fill: #b9c9a3; stroke: #2a2520; stroke-width: 3; opacity: 0; } #chart .land.home { fill: #d9a645; }
#chart .name { font-size: 28px; font-weight: 700; fill: #2a2520; text-anchor: middle; paint-order: stroke; stroke: #efe3c8; stroke-width: 5px; opacity: 0; } #chart .name.small { font-size: 23px; }
#chart .sub { font-size: 22px; font-weight: 700; fill: #b5532f; text-anchor: middle; paint-order: stroke; stroke: #efe3c8; stroke-width: 5px; opacity: 0; }
#chart .boat path { fill: #8a5a3b; stroke: #2a2520; stroke-width: 2.5; stroke-linejoin: round; } #chart .boat .sail { fill: #f3ead7; }
.card { position: absolute; inset: 0; pointer-events: none; }
.card .glow { position: absolute; left: ${tall ? '50%' : '74%'}; top: ${tall ? '72%' : '54%'}; width: ${px(m * 0.7)}; height: ${px(m * 0.7)}; margin: -${px(m * 0.35)} 0 0 -${px(m * 0.35)}; border-radius: 50%; background: radial-gradient(closest-side, rgba(239,227,200,.55), rgba(239,227,200,0)); }
.card .sprite { position: absolute; left: ${tall ? '50%' : '74%'}; top: ${tall ? '72%' : '54%'}; width: ${px(m * 0.78)}; height: ${px(m * 0.78)}; margin: -${px(m * 0.39)} 0 0 -${px(m * 0.39)}; background-size: 700% 600%; background-repeat: no-repeat; }
.card .tag { position: absolute; left: ${tall ? '50%' : '74%'}; top: ${tall ? '53%' : '14%'}; width: ${px(tall ? m * 0.8 : m * 0.62)}; margin-left: -${px(tall ? m * 0.4 : m * 0.31)}; text-align: center; background: #efe3c8; color: #2a2520; border: ${px(m * 0.005)} solid #1d1a16; border-radius: ${px(m * 0.02)}; padding: .1em .5em .2em; font-size: ${px(m * 0.08)}; }
.card .tag small { display: block; font-size: .36em; color: #8a4b2c; }
.fog i, .wipe i { position: absolute; display: block; aspect-ratio: 2 / 1; border-radius: 50%; background: radial-gradient(closest-side, rgba(239,227,200,.9), rgba(239,227,200,0)); }
.wipe { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.grid12 { position: absolute; left: 4%; right: 4%; top: ${tall ? 22 : 12}%; display: grid; grid-template-columns: repeat(${tall ? 3 : 6}, 1fr); gap: ${tall ? 1.5 : 1}%; }
.grid12 figure { text-align: center; font-size: ${px(m * (tall ? 0.04 : 0.036))}; }
.mini { width: 100%; aspect-ratio: 1; background-size: 700% 600%; background-repeat: no-repeat; margin-bottom: -.4em; }
.axes { position: absolute; left: 6%; right: 6%; top: ${tall ? 26 : 18}%; display: grid; grid-template-columns: repeat(${tall ? 4 : 6}, 1fr); gap: ${tall ? 3 : 2}% 2%; }
.axe { text-align: center; font-size: ${px(m * 0.034)}; color: rgba(243,234,215,.45); }
.axe svg { display: block; width: 46%; margin: 0 auto .2em; overflow: visible; }
.axe .haft { fill: #6b5236; } .axe .blade { fill: #55625d; stroke: #1d1a16; stroke-width: 2; }
.axe.lit { color: #f3ead7; }
.end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(15,23,20,.86); }
.end h1 { font-size: ${px(m * 0.15)}; letter-spacing: .16em; } .end h2 { font-size: ${px(m * 0.06)}; letter-spacing: .5em; color: #e7b65a; margin-top: .2em; }
.end p { font-size: ${px(m * 0.038)}; margin-top: 1.2em; } .end .note { font-size: ${px(m * 0.026)}; opacity: .65; margin-top: 2.2em; }
.dark { position: absolute; inset: 0; background: #0a100e; }
#fade { position: absolute; inset: 0; background: #0f1714; z-index: 30; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${LENGTH}" data-width="${w}" data-height="${h}">

  <video class="clip" id="v-title" src="assets/title.mp4" data-start="0" data-duration="5" data-track-index="0" muted></video>
  <video class="clip" id="v-hall" src="assets/hall.mp4" data-start="5" data-duration="5" data-track-index="0" muted></video>
  <video class="clip" id="v-home" src="assets/home.mp4" data-start="42" data-duration="13" data-track-index="0" muted></video>

  <div class="clip layer" id="s1" data-start="0" data-duration="5" data-track-index="1"><div class="shade"></div>
    ${cap('s1a', '說吧，記事的人，')}${cap('s1b', '說那位見習的故事。')}</div>

  <div class="clip layer" id="s2" data-start="5" data-duration="5" data-track-index="1"><div class="shade"></div>
    ${cap('s2a', '你是剛出師的見習專科護理師。')}${cap('s2b', '蒙托拉帶你出海巡診。')}</div>

  <div class="clip layer" id="s3" data-start="10" data-duration="28" data-track-index="1"><div class="sea-bg"></div>${chart}
    <div class="shade"></div>${cap('s3a', '霧海群島，十二座島。')}${cap('s3b', '一座島，一種症狀。')}</div>
  ${cards}

  <div class="clip layer" id="s4" data-start="38" data-duration="4" data-track-index="1"><div class="sea-bg"></div>
    <div class="fog">${[0, 1, 2, 3].map((j) => `<i id="f${j}" style="top:${10 + j * 22}%;left:${-25 + (j * 31) % 50}%;width:${60 + (j * 11) % 30}%;opacity:.14"></i>`).join('')}</div>
    <div class="grid12">${lineup}</div>
    ${cap('s4a', tall ? '它只告訴你哪裡不舒服，\n不告訴你為什麼。' : '它只告訴你哪裡不舒服，不告訴你為什麼。')}</div>

  <div class="clip layer" id="s5" data-start="42" data-duration="5" data-track-index="1"><div class="dark" id="dark"></div><div class="shade"></div>
    ${cap('s5a', '問、看、量，抓著它不放。')}${cap('s5b', '燈亮了，船就回得了家。')}</div>

  <div class="clip layer" id="s6" data-start="47" data-duration="8" data-track-index="1">
    <div class="end" id="endbg"></div>
    <div class="axes">${axes}</div>
    ${cap('s6a', tall ? '十二種主訴，\n一種一把斧頭。' : '十二種主訴，一種一把斧頭。', true)}
    <div class="end" id="title"><h1 id="t1">${chars('霧脈公會')}</h1><h2 id="t2">歸航記</h2>
      <p id="t3">專科護理師口試的練習・十二種主訴</p>
      <p class="note" id="t4">病例是草稿，還沒經過臨床老師審查，不能當教材<br />${url}</p></div></div>

  ${wipes}
  <div class="clip" id="fade" data-start="0" data-duration="${LENGTH}" data-track-index="5"></div>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  // 字一個一個浮出來；離開的時候整句淡掉
  const say = (sel, at, out) => {
    tl.fromTo(sel + ' .ch', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.045, ease: 'power2.out' }, at);
    if (out) tl.to(sel + ' .ch', { opacity: 0, duration: 0.3 }, out);
  };
  // 一隻劫影自己的動畫：42 格，7×6 排，onUpdate 照時間挑一格
  const play = (el, at, dur) => { const c = { f: 0 }; tl.fromTo(c, { f: 0 }, { f: 41, duration: dur, ease: 'none', onUpdate: () => { const n = Math.round(c.f); el.style.backgroundPosition = ((n % 7) * 100 / 6) + '% ' + (Math.floor(n / 7) * 100 / 5) + '%'; } }, at); };

  // 開場：從黑淡入，鏡頭慢慢推近
  tl.fromTo('#fade', { opacity: 1 }, { opacity: 0, duration: 1.3, ease: 'power1.out' }, 0);
  tl.fromTo('#v-title', { scale: 1.02 }, { scale: 1.12, duration: 5, ease: 'none' }, 0);
  say('#s1a', 0.8, 2.7); say('#s1b', 2.9);
  tl.fromTo('#v-hall', { scale: 1.0 }, { scale: 1.08, duration: 5, ease: 'none' }, 5);
  say('#s2a', 5.4, 7.6); say('#s2b', 7.8);

  // 航海圖：全景，十二座島還在霧裡，船停在家
  const ISLES = ${JSON.stringify(isles.map((i) => ({ id: i.id, x: i.x, y: i.y })))}, CAM = ${JSON.stringify(isles.map(cam))};
  tl.set('#chart', { transformOrigin: '0 0', x: 0, y: 0, scale: 1 }, 10);
  tl.set('#boat', { x: ${byId.main.x + 120}, y: ${byId.main.y + 70} }, 10);
  tl.fromTo('#chart', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 10);
  say('#s3a', 10.4, 12.4); say('#s3b', 12.5, 13.9);
  // 航行：一座島兩秒。鏡頭和船一起過去，航線畫出來，島亮起來、寫上症狀，劫影從霧裡浮上來
  ISLES.forEach((i, n) => {
    const t = ${VOYAGE} + n * ${LEG}, c = CAM[n];
    tl.to('#chart', { x: c.x, y: c.y, scale: ${ZOOM}, duration: 0.9, ease: 'power2.inOut' }, t - 0.25);
    tl.to('#boat', { x: i.x + 44, y: i.y + 38, duration: 0.9, ease: 'power2.inOut' }, t - 0.25);
    if (n > 0) tl.to('#r-' + i.id, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, t - 0.2);
    tl.to('#i-' + i.id + ' .land', { opacity: 1, duration: 0.35 }, t + 0.25);
    tl.to('#i-' + i.id + ' text', { opacity: 1, duration: 0.35 }, t + 0.3);
    tl.fromTo('#k' + n + ' .sprite', { opacity: 0, y: ${Math.round(m * 0.1)}, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, t + 0.3);
    tl.fromTo('#k' + n + ' .glow', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5 }, t + 0.25);
    tl.fromTo('#k' + n + ' .tag', { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.3 }, t + 0.35);
    tl.to('#k' + n + ' .sprite, #k' + n + ' .glow, #k' + n + ' .tag', { opacity: 0, duration: 0.25 }, t + ${LEG} - 0.3);
    play(document.getElementById('sp' + n), t, ${LEG});
  });
  tl.to('#chart', { x: 0, y: 0, scale: 1, duration: 1, ease: 'power2.inOut' }, ${VOYAGE + 12 * LEG - 0.4});

  // 十二隻劫影排成一片，每一隻都在動
  ISLES.forEach((_, n) => play(document.getElementById('m' + n), 38, 4));
  tl.fromTo('.grid12 figure', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.5)' }, 38.1);
  [0, 1, 2, 3].forEach((j) => tl.fromTo('#f' + j, { xPercent: -10 }, { xPercent: 20 + j * 8, duration: 4, ease: 'none' }, 38));
  say('#s4a', 38.9);

  // 回到霧港：先暗，燈亮起來
  tl.fromTo('#v-home', { scale: 1.1 }, { scale: 1.0, duration: 5, ease: 'power1.out' }, 42);
  tl.fromTo('#dark', { opacity: 0.78 }, { opacity: 0, duration: 2.2, ease: 'power2.inOut' }, 43.8);
  say('#s5a', 42.3, 44.3); say('#s5b', 44.5);

  // 十二把斧頭一把一把亮起來，然後是片名
  tl.fromTo('#endbg', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 47);
  tl.fromTo('.axe', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, 47.1);
  ISLES.forEach((_, n) => {
    tl.to('#a' + n + ' .blade', { fill: '#e7b65a', duration: 0.2 }, 47.6 + n * 0.2);
    tl.to('#a' + n, { color: '#f3ead7', duration: 0.2 }, 47.6 + n * 0.2);
    tl.fromTo('#a' + n + ' svg', { filter: 'drop-shadow(0 0 0 rgba(231,182,90,0))' }, { filter: 'drop-shadow(0 0 12px rgba(231,182,90,.9))', duration: 0.25 }, 47.6 + n * 0.2);
  });
  say('#s6a', 47.3, 50.1);
  tl.to('.axes', { opacity: 0, duration: 0.4 }, 50.1);
  tl.fromTo('#title', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 50.2);
  tl.fromTo('#t1 .ch', { opacity: 0, y: 30, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 50.4);
  tl.fromTo('#t2', { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '0.5em', duration: 0.9 }, 51.2);
  tl.fromTo('#t3', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 52.0);
  tl.fromTo('#t4', { opacity: 0 }, { opacity: 0.65, duration: 0.6 }, 52.6);
  tl.to('#fade', { opacity: 1, duration: 0.8 }, ${LENGTH - 0.9});

  // 換場的霧
  ${JSON.stringify(WIPES)}.forEach((t, j) => tl.fromTo('#w' + j + ' i', { xPercent: -40, opacity: 0 }, { xPercent: 260, opacity: 1, duration: 1, stagger: 0.03, ease: 'power1.inOut' }, t));
  window.__timelines.main = tl;
  tl.seek(0);
</script>
</body>
</html>`;
}
