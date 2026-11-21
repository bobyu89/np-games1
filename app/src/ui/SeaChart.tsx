// 大廳的航海圖：十二座島（一劫一座）、巡診船的航線、燈塔。點一座島，委託板只列那座島的委託。
// 還沒去過的島蓋在霧裡；去過的島寫上結了幾張案，島邊一劫一個小菱形（過了那一劫就塗滿）。
// 終章走完，外海多一條回伊塔洛斯的歸航線。圖是用 SVG 畫的，沒有外部的圖檔。
import { ISLANDS, type IslandId } from '../data/islands.ts';
import { sfx } from './sound.ts';

/** marks：這座島的每一劫，過了沒有 */
export interface ChartIsle { id: IslandId; open: boolean; done: number; total: number; fresh: boolean; marks: boolean[] }

/** 用島的位置算一條固定的海岸線：同一座島每次畫出來都一樣 */
function coast(id: string, x: number, y: number, r: number): string {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
  const n = 22, pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 0.72 + rnd() * 0.42, sx = id === 'main' ? 1.35 : 1.15;
    pts.push([x + Math.cos(a) * r * k * sx, y + Math.sin(a) * r * k * 0.82]);
  }
  // 用中點連成平滑的曲線
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  let d = 'M' + mid(pts[n - 1], pts[0]).map((v) => v.toFixed(1)).join(',');
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); d += ` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`; }
  return d + 'Z';
}

/** 海上的水深數字：只是航海圖的樣子，固定的位置 */
const SOUNDINGS: [number, number, string][] = [[90, 90, '12'], [330, 120, '9'], [560, 80, '15'], [880, 140, '21'], [620, 200, '7'], [940, 380, '18'], [80, 400, '11'],
  [360, 610, '8'], [560, 650, '14'], [930, 650, '23'], [140, 660, '10'], [600, 470, '6'], [330, 250, '5'], [880, 470, '17']];

export function SeaChart({ isles, picked, boat, home = false, onPick }: { isles: ChartIsle[]; picked: IslandId; boat: IslandId; home?: boolean; onPick(id: IslandId): void }) {
  const main = ISLANDS.main;
  return (
    <div className="chart">
      <svg viewBox="0 0 1000 700" role="group" aria-label="霧海群島的航海圖：點一座島，看那裡的委託">
        <defs>
          <pattern id="chart-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="var(--ink-soft)" strokeOpacity="0.12" strokeWidth="1" /></pattern>
          <radialGradient id="chart-fog"><stop offset="0" stopColor="var(--paper)" stopOpacity="0.95" /><stop offset="0.7" stopColor="var(--paper)" stopOpacity="0.85" /><stop offset="1" stopColor="var(--paper)" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1000" height="700" fill="url(#chart-grid)" />
        {/* 羅盤：十六條方位線從右上角的羅盤放出去 */}
        <g className="rhumb">{Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <line key={i} x1="880" y1="110" x2={880 + Math.cos(a) * 1300} y2={110 + Math.sin(a) * 1300} />; })}</g>
        <g className="compass" transform="translate(880 110)">
          <circle r="52" /><circle r="40" />
          <path d="M0,-62 L9,0 L0,62 L-9,0Z" className="needle" /><path d="M-62,0 L0,9 L62,0 L0,-9Z" />
          <text y="-70" textAnchor="middle">北</text>
        </g>
        <text x="880" y="215" textAnchor="middle" className="sea">霧　海</text>
        {SOUNDINGS.map(([x, y, t]) => <text key={x + '-' + y} x={x} y={y} className="depth">{t}</text>)}
        {/* 巡診船的航線：本島到每一章的大島，大島再到同一章的小島 */}
        {isles.filter((i) => i.id !== 'main').map((i) => {
          const s = ISLANDS[i.id], o = ISLANDS[s.from ?? 'main'], mx = (o.x + s.x) / 2, my = (o.y + s.y) / 2 - 30;
          return <path key={i.id} d={`M${o.x},${o.y} Q${mx},${my} ${s.x},${s.y}`} className={'route' + (i.open ? ' open' : '')} />;
        })}
        {/* 歸航線：終章走完，從外海繞回伊塔洛斯 */}
        {home && <path d={`M985,690 C900,640 760,660 ${main.x + 120},${main.y + 90} S${main.x + 40},${main.y + 30} ${main.x},${main.y}`} className="route home" />}
        {isles.map((i) => {
          const s = ISLANDS[i.id], on = picked === i.id;
          return (
            <g key={i.id} className={'isle' + (i.open ? '' : ' fogged') + (on ? ' on' : '')} role="button" tabIndex={i.open ? 0 : -1} aria-disabled={!i.open}
              aria-label={i.open ? s.name + '，' + s.tag + '，結了 ' + i.done + '／' + i.total + ' 張' : s.name + '，還在霧裡'} aria-pressed={on}
              onClick={() => { if (i.open) { sfx.page(); onPick(i.id); } }} onKeyDown={(e) => { if (i.open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sfx.page(); onPick(i.id); } }}>
              <path d={coast(i.id, s.x, s.y, s.r * 1.22)} className="surf" />
              <path d={coast(i.id, s.x, s.y, s.r)} className="land" />
              {!i.open && <ellipse cx={s.x} cy={s.y} rx={s.r * 1.9} ry={s.r * 1.4} fill="url(#chart-fog)" />}
              <text x={s.x} y={s.y - 4} textAnchor="middle" className={'name' + (s.r < 50 ? ' small' : '')}>{i.open ? s.name : '？？？'}</text>
              <text x={s.x} y={s.y + 26} textAnchor="middle" className="sub">{i.open ? (i.total ? i.done + '／' + i.total : '') : '霧'}</text>
              {i.open && i.marks.map((ok, n) => { const x = s.x - (i.marks.length - 1) * 9 + n * 18, y = s.y + s.r * 0.82 + 14; return <path key={n} d={`M${x},${y - 7} L${x + 6},${y} L${x},${y + 7} L${x - 6},${y}Z`} className={'peril' + (ok ? ' ok' : '')} />; })}
              {i.fresh && i.open && <circle cx={s.x + s.r * 0.9} cy={s.y - s.r * 0.6} r="11" className="seal" />}
            </g>
          );
        })}
        {/* 燈塔：本島東北的岬角 */}
        <g className="lighthouse" transform={`translate(${main.x + 150} ${main.y - 92})`} aria-hidden="true">
          <path d="M-8,26 L-5,-14 L5,-14 L8,26Z" /><rect x="-7" y="-22" width="14" height="8" /><circle cy="-26" r="5" className="lamp" />
        </g>
        {/* 巡診船：停在現在這一章的島旁邊 */}
        <g className="boat" transform={`translate(${ISLANDS[boat].x + ISLANDS[boat].r * 1.25} ${ISLANDS[boat].y + ISLANDS[boat].r * 0.55})`} aria-hidden="true">
          <path d="M-22,0 L22,0 L14,10 L-14,10Z" /><path d="M0,-30 L0,0" /><path d="M2,-28 L18,-6 L2,-6Z" className="sail" />
        </g>
      </svg>
    </div>
  );
}
