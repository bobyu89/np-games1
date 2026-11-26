// 管理頁的圖：每天的人數、沒結案的停在哪裡、每一位病人的診斷正確率、練習指標每週的變化。
// 不用圖表套件：SVG 自己畫，滑過去有數字，每一張圖底下都可以攤開看表格。
// 顏色（四色）用 dataviz 的驗證腳本在 #fffaf0 底上檢查過：亮度、彩度、色盲分辨、對比都過。順序固定，不會因為篩選換色。
import { useState, type ReactNode } from 'react';
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';

export const SERIES = ['#00897a', '#b4532b', '#5b62b0', '#9a7410'] as const;
const SURFACE = '#fffaf0', GRID = '#e2d5b3', AXIS = '#6a6352';
const pctText = (x: number | null) => (x === null ? '—' : Math.round(x * 100) + '%');

/** 攤開看表格：圖的每一個數字都在這裡 */
function TableView({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="viz-table"><summary>看數字</summary>
      <div className="tw"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>
    </details>
  );
}

export interface Line { name: string; color: string; values: (number | null)[] }

/** 折線圖：同一個單位的幾條線，一個 y 軸。滑過去有十字線和那一格的數字；線尾直接寫名字 */
export function LineChart({ title, labels, lines, max, fmt, note }: { title: string; labels: string[]; lines: Line[]; max?: number; fmt(v: number): string; note?: ReactNode }) {
  const [at, setAt] = useState<number | null>(null);
  const W = 680, H = 230, L = 44, R = 96, T = 12, B = 28, w = W - L - R, h = H - T - B;
  const top = max ?? Math.max(1, ...lines.flatMap((l) => l.values.filter((v): v is number => v !== null)));
  const x = (i: number) => L + (labels.length <= 1 ? w / 2 : (i / (labels.length - 1)) * w), y = (v: number) => T + h - (v / top) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * top);
  const every = Math.max(1, Math.ceil(labels.length / 7));
  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - box.left) / box.width) * W;
    const i = labels.length <= 1 ? 0 : Math.round(((px - L) / w) * (labels.length - 1));
    setAt(i >= 0 && i < labels.length ? i : null);
  };
  // 線尾的名字：照最後一個值的高低排，太擠就往下推
  const ends = lines.map((l) => { const i = l.values.map((v) => v !== null).lastIndexOf(true); return { l, i, y: i < 0 ? 0 : y(l.values[i]!) }; }).filter((k) => k.i >= 0).sort((a, b) => a.y - b.y);
  ends.forEach((k, j) => { if (j > 0 && k.y - ends[j - 1].y < 14) k.y = ends[j - 1].y + 14; });
  return (
    <figure className="viz">
      <figcaption><b>{title}</b>{lines.length > 1 && <span className="legend">{lines.map((l) => <span key={l.name}><i style={{ background: l.color }} />{l.name}</span>)}</span>}</figcaption>
      <div className="viz-scroll"><div className="viz-box">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseMove={move} onMouseLeave={() => setAt(null)}>
          <rect x="0" y="0" width={W} height={H} fill={SURFACE} />
          {ticks.map((v) => <g key={v}><line x1={L} x2={L + w} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth="1" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">{fmt(v)}</text></g>)}
          {labels.map((d, i) => (i % every === 0 || i === labels.length - 1) && <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className="axis">{d}</text>)}
          {at !== null && <line x1={x(at)} x2={x(at)} y1={T} y2={T + h} stroke={AXIS} strokeWidth="1" strokeDasharray="3 3" />}
          {lines.map((l) => {
            // 中間沒有值的那幾格斷開，不硬連
            const segs: string[][] = [[]];
            l.values.forEach((v, i) => { if (v === null) segs.push([]); else segs[segs.length - 1].push(x(i) + ',' + y(v)); });
            return <g key={l.name}>
              {segs.filter((p) => p.length > 1).map((p, k) => <polyline key={k} points={p.join(' ')} fill="none" stroke={l.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
              {l.values.map((v, i) => v !== null && (labels.length <= 31 || i === at) && <circle key={i} cx={x(i)} cy={y(v)} r={i === at ? 5 : 4} fill={l.color} stroke={SURFACE} strokeWidth="2" />)}
            </g>;
          })}
          {lines.length <= 4 && ends.map(({ l, y: yy }) => <text key={l.name} x={L + w + 8} y={yy + 4} className="end">{l.name}</text>)}
        </svg>
        {at !== null && (
          <div className="tip" style={{ left: (x(at) / W) * 100 + '%' }}>
            <b>{labels[at]}</b>
            {lines.map((l) => <span key={l.name}><i style={{ background: l.color }} />{l.name}：{l.values[at] === null ? '—' : fmt(l.values[at]!)}</span>)}
          </div>
        )}
      </div></div>
      {note && <p className="dim">{note}</p>}
      <TableView head={['', ...lines.map((l) => l.name)]} rows={labels.map((d, i) => [d, ...lines.map((l) => (l.values[i] === null ? '—' : fmt(l.values[i]!)))])} />
    </figure>
  );
}

/** 橫條：一個系列一個顏色，數字寫在條的後面 */
export function Bars({ title, rows, note }: { title: string; rows: { name: string; n: number }[]; note?: ReactNode }) {
  const top = Math.max(1, ...rows.map((r) => r.n));
  return (
    <figure className="viz">
      <figcaption><b>{title}</b></figcaption>
      <div className="hbars">{rows.map((r) => (
        <div key={r.name} className="hbar" title={r.name + '：' + r.n}>
          <span>{r.name}</span><i><b style={{ width: (r.n / top) * 100 + '%', background: SERIES[0] }} /></i><em>{r.n}</em>
        </div>
      ))}</div>
      {note && <p className="dim">{note}</p>}
    </figure>
  );
}

interface CaseCell { case_id: string; dones: number; found: number }
/** 熱圖：每個主訴一列，同一個主訴的四位病人各一格，顏色是診斷正確的比例（一個色相，淺到深）。不到 3 場的格子畫斜線，不給顏色 */
export function CaseHeatmap({ cases }: { cases: CaseCell[] }) {
  const of = (id: string) => cases.find((c) => c.case_id === id);
  const rows = COMPLAINTS.map((m) => ({ m, ids: CASES.filter((c) => c.complaint === m.id && c.id !== FINALE_ID).map((c) => c.id) }));
  const cols = Math.max(...rows.map((r) => r.ids.length));
  const cell = (id: string) => {
    const c = of(id), rate = c && c.dones >= 3 ? c.found / c.dones : null, name = CASES.find((k) => k.id === id)!.patient.name;
    const tip = name + '（' + id + '）：' + (c ? c.found + '／' + c.dones + ' 場診斷正確' : '還沒有人結案');
    if (rate === null) return <td key={id} className="hm none" title={tip}><span>{name}</span><small>{c ? c.dones + ' 場' : '—'}</small></td>;
    return <td key={id} className={'hm' + (rate >= 0.6 ? ' dark' : '')} style={{ background: `color-mix(in srgb, ${SERIES[0]} ${Math.round(12 + rate * 88)}%, ${SURFACE})` }} title={tip}><span>{name}</span><small>{pctText(rate)}・{c!.dones} 場</small></td>;
  };
  return (
    <figure className="viz">
      <figcaption><b>每一位病人的診斷正確率</b><span className="legend scale"><span>0%</span><i className="ramp" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${SERIES[0]} 12%, ${SURFACE}), ${SERIES[0]})` }} /><span>100%</span><span><i className="hatch" />不到 3 場</span></span></figcaption>
      <div className="tw"><table className="heat">
        <thead><tr><th>主訴</th>{Array.from({ length: cols }, (_, i) => <th key={i}>第 {i + 1} 位</th>)}</tr></thead>
        <tbody>{rows.map(({ m, ids }) => <tr key={m.id}><th>{m.name}</th>{ids.map(cell)}{Array.from({ length: cols - ids.length }, (_, i) => <td key={'x' + i} />)}</tr>)}</tbody>
      </table></div>
      <p className="dim">只算委託的結案（試弓另外算）。顏色越深，診斷越常對；淺的那幾格是最難的病人，值得回去看是哪一條線索沒被讀出來。終章燈塔那一位不列。</p>
    </figure>
  );
}
