// 給管理者看的總表：網址後面加 #stats。要管理密碼；密碼只留在這個分頁，關掉就沒有了。
// 數字來自 worker/ 那個端點。每一關的名字從病例檔補上，端點那邊只認得代號。
import { useEffect, useState } from 'react';
import { CASES } from '../data/index.ts';
import { STATS_URL, statsBuilt } from './stats.ts';
import { Bars, CaseHeatmap, LineChart, SERIES } from './StatsCharts.tsx';

interface CaseRow { case_id: string; starts: number; dones: number; starters: number; finishers: number; firstScore: number | null; score: number | null; met: number; late: number; review: number; found: number; secs: number | null; hints: number | null; stuck: [number, number, number, number] }
const REPORT_KIND: Record<string, string> = { content: '內容有錯', stuck: '操作卡住', idea: '建議', other: '其他' };
const REPORT_PLACE: Record<string, string> = { title: '首頁', hall: '大廳', ward: '病室', debrief: '回顧', settings: '設定' };
interface Summary {
  since: string | null; until: string;
  totals: { devices: number; finishers: number; returning: number; installed: number; opens: number; starts: number; dones: number; leaves: number; drops: number; trials?: number; trialPass?: number };
  days: { day: string; devices: number; starts: number; dones: number; trials?: number; drills?: number }[]; cases: CaseRow[];
  accounts?: { accounts: number; saves: number; google: number; line: number };
  platforms: { pf: string; devices: number }[]; builds: { build: string; devices: number; last: string }[]; depth: { label: string; devices: number }[];
  /** 舊版的端點沒有這一塊 */
  learning?: { first: Played; retry: Played; recall: { n: number; hit: number; devices: number }; drills: { kind: string; rounds: number; devices: number; ok: number; total: number }[] };
  weeks?: { week: string; first: { n: number; found: number }; retry: { n: number; found: number }; recall: { n: number; hit: number }; drill: { ok: number; total: number } }[];
}
/** 每一天連起來：中間沒有事件的那幾天補 0，線才不會跳過去 */
function fillDays(days: Summary['days']) {
  if (!days.length) return [];
  const sorted = [...days].sort((a, b) => (a.day < b.day ? -1 : 1)), out: Summary['days'] = [];
  for (let d = new Date(sorted[0].day + 'T00:00:00Z'), end = sorted[sorted.length - 1].day; d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    out.push(sorted.find((k) => k.day === day) ?? { day, devices: 0, starts: 0, dones: 0, trials: 0, drills: 0 });
  }
  return out;
}
const rate = (a: number, b: number) => (b ? a / b : null);
interface Played { n: number; found: number; trapped: number }
const DRILL_NAME: Record<string, string> = { read: '線索解讀', summary: '問題摘要', sbar: '回報的評估' };
const PF: Record<string, string> = { ios: 'iPhone、iPad', android: 'Android', desktop: '電腦', other: '其他' };
const PHASE = ['問診', '評估', '診斷', '檢查'];
const RANGES: [string, string][] = [['7', '最近 7 天'], ['30', '最近 30 天'], ['90', '最近 90 天'], ['', '全部']];
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '—');
const mins = (s: number | null) => (s === null ? '—' : Math.round(s / 60) + ' 分');
const nameOf = (id: string) => { const c = CASES.find((k) => k.id === id); return c ? c.patient.name + '｜' + c.complaintName + '・' + (c.forms.find((f) => f.id === c.answer.truth)?.name ?? '') : id; };

export function StatsPage({ onClose }: { onClose(): void }) {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem('mist-guild.admin') ?? ''; } catch { return ''; } });
  const [days, setDays] = useState('30');
  const [data, setData] = useState<Summary | null>(null);
  const [reports, setReports] = useState<{ at: number; build: string; pf: string; kind: string; place: string; case_id: string; text: string }[] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.documentElement.classList.add('admin'); return () => document.documentElement.classList.remove('admin'); }, []);

  const ask = async (path: string) => {
    const res = await fetch(STATS_URL + path + (days ? '?days=' + days : ''), { headers: { Authorization: 'Bearer ' + key }, credentials: 'omit' });
    if (res.status === 401) throw new Error('密碼不對。');
    if (res.status === 503) throw new Error('端點那邊還沒有設定管理密碼（ADMIN_KEY）。');
    if (!res.ok) throw new Error('端點回了 ' + res.status + '。');
    return res;
  };
  const load = async () => {
    if (!key) { setNote('先輸入管理密碼。'); return; }
    setBusy(true); setNote('');
    try { setData(await (await ask('/stats')).json() as Summary); try { setReports(((await (await ask('/reports')).json()) as { reports: NonNullable<typeof reports> }).reports); } catch { setReports(null); } try { sessionStorage.setItem('mist-guild.admin', key); } catch { /* 記不住就每次輸入 */ } }
    catch (e) { setData(null); setNote(e instanceof TypeError ? '連不到端點。可能是沒有網路，或是這個網址不在端點允許的名單裡。' : (e as Error).message); }
    setBusy(false);
  };
  const download = async () => {
    try {
      const url = URL.createObjectURL(await (await ask('/export.csv')).blob()), a = document.createElement('a');
      a.href = url; a.download = 'mist-guild-events.csv'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { setNote((e as Error).message); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (key && statsBuilt) void load(); }, [days]);

  const t = data?.totals;
  return (
    <div className="admin-page">
      <div className="admin-top"><h1>歸航記｜使用統計</h1><button type="button" className="pick" onClick={onClose}>回到遊戲</button></div>
      {!statsBuilt ? <p className="note bad">這一版建置的時候沒有設定統計的端點，所以遊戲不會回傳任何資料，這裡也沒有東西可以看。</p> : <>
        <form className="admin-bar" onSubmit={(e) => { e.preventDefault(); void load(); }}>
          <label>管理密碼 <input type="password" value={key} autoComplete="current-password" onChange={(e) => setKey(e.target.value)} /></label>
          <label>範圍 <select value={days} onChange={(e) => setDays(e.target.value)}>{RANGES.map(([v, name]) => <option key={v} value={v}>{name}</option>)}</select></label>
          <button type="submit" className="pick on" disabled={busy}>{busy ? '讀取中……' : '讀取'}</button>
          {data && <button type="button" className="pick" onClick={download}>下載每一筆（CSV）</button>}
        </form>
        {note && <p className="note bad" role="status">{note}</p>}
        <p className="dim">這些數字只包含選了「可以回傳」的人，而且是匿名回傳的，有心的人可以灌水。拿來看哪一關有人玩、哪裡卡住可以；不能當成研究數據。「裝置」是用隨機代號分的：同一個人換手機、清掉瀏覽器資料，會算成兩台。</p>
      </>}
      {data && t && <>
        <h2>總覽（{data.since ?? '一開始'} 到 {data.until}）</h2>
        <div className="tiles">
          {([['出現過的裝置', t.devices], ['至少結案一張', t.finishers], ['在兩天以上出現', t.returning], ['從主畫面圖示開過', t.installed], ['接了幾張', t.starts], ['結案幾張', t.dones], ['做到一半回公會', t.leaves], ['放掉', t.drops], ['試弓幾場', t.trials ?? 0], ['試煉及格幾場', t.trialPass ?? 0]] as [string, number][])
            .map(([name, n]) => <div key={name} className="tile"><b>{n}</b><span>{name}</span></div>)}
        </div>

        <h2>練習有沒有在發揮作用</h2>
        {!data.learning ? <p className="dim">端點還是舊版，還沒有這一塊。</p> : <Learning l={data.learning} weeks={data.weeks} />}

        <h2>玩家的回報</h2>
        {!reports ? <p className="dim">讀不到回報。</p> : !reports.length ? <p className="dim">這個範圍裡沒有回報。</p> : (
          <div className="tw"><table>
            <thead><tr><th>什麼時候</th><th>種類</th><th>哪一張委託</th><th>在哪個畫面</th><th>版本</th><th>寫了什麼</th></tr></thead>
            <tbody>{reports.map((r, i) => (
              <tr key={r.at + ':' + i}><td>{new Date(r.at * 1000).toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>{REPORT_KIND[r.kind] ?? r.kind}</td><td>{r.case_id ? nameOf(r.case_id) : '—'}</td><td>{REPORT_PLACE[r.place] ?? '—'}・{PF[r.pf] ?? r.pf}</td><td>{r.build || '—'}</td><td className="wide said">{r.text}</td></tr>
            ))}</tbody>
          </table></div>
        )}
        <p className="dim">回報是匿名的，最多列出最近 300 則。裡面的字是玩家自己寫的。</p>

        <h2>每一關</h2>
        <div className="tw"><table>
          <thead><tr><th>委託</th><th>接過的裝置</th><th>結案的裝置</th><th>結案的比例</th><th>第一次的平均分</th><th>安全行動：達成／部分／複核</th><th>診斷正確</th><th>平均花多久</th><th>平均問孟拓</th><th>離開時停在</th></tr></thead>
          <tbody>{data.cases.map((c) => (
            <tr key={c.case_id}><td>{nameOf(c.case_id)}</td><td>{c.starters}</td><td>{c.finishers}</td><td>{pct(c.finishers, c.starters)}</td><td>{c.firstScore ?? '—'}</td><td>{c.met}／{c.late}／{c.review}</td><td>{pct(c.found, c.dones)}</td><td>{mins(c.secs)}</td><td>{c.hints ?? '—'}</td>
              <td>{c.stuck.some((n) => n > 0) ? c.stuck.map((n, i) => (n ? PHASE[i] + ' ' + n : '')).filter(Boolean).join('、') : '—'}</td></tr>
          ))}</tbody>
        </table></div>
        {!data.cases.length && <p className="dim">這段時間還沒有人接委託。</p>}

        <h2>每一天</h2>
        {(() => { const ds = fillDays(data.days); return ds.length ? <LineChart title="每天有幾台裝置在玩、結案幾張" labels={ds.map((d) => d.day.slice(5).replace('-', '/'))} fmt={(v) => String(Math.round(v))}
          lines={[{ name: '裝置', color: SERIES[0], values: ds.map((d) => d.devices) }, { name: '結案', color: SERIES[1], values: ds.map((d) => d.dones) }, ...(ds.some((d) => d.trials) ? [{ name: '試弓', color: SERIES[2], values: ds.map((d) => d.trials ?? 0) }] : [])]}
          note="同一個單位（次數），一個 y 軸。滑過去看那一天的數字；中間沒有人玩的日子算 0。" /> : <p className="dim">這段時間沒有資料。</p>; })()}

        <h2>沒結案的，停在哪一段</h2>
        {(() => { const st = [0, 1, 2, 3].map((i) => data.cases.reduce((n, c) => n + c.stuck[i], 0)); return <Bars title={'接了 ' + t.starts + ' 張、結案 ' + t.dones + ' 張（' + pct(t.dones, t.starts) + '）；中途離開或放掉的時候停在：'} rows={PHASE.map((name, i) => ({ name, n: st[i] }))}
          note="一張委託中途離開又回來，會算好幾次。停在問診或評估的多，可能是題目太長；停在檢查的多，可能是不知道怎麼結案。" />; })()}

        <h2>哪一位最難</h2>
        <CaseHeatmap cases={data.cases} />

        <div className="cols">
          <div><h2>玩得多深</h2><table><tbody>{data.depth.map((d) => <tr key={d.label}><td>{d.label}</td><td>{d.devices} 台</td></tr>)}</tbody></table></div>
          <div><h2>用什麼玩</h2><table><tbody>{data.platforms.map((p) => <tr key={p.pf}><td>{PF[p.pf] ?? p.pf}</td><td>{p.devices} 台</td></tr>)}</tbody></table></div>
          <div><h2>哪一版</h2><table><tbody>{data.builds.map((b) => <tr key={b.build}><td>{b.build}</td><td>{b.devices} 台</td><td>到 {b.last}</td></tr>)}</tbody></table></div>
          {data.accounts && <div><h2>登入同步</h2><table><tbody><tr><td>帳號</td><td>{data.accounts.accounts} 個</td></tr><tr><td>用 Google</td><td>{data.accounts.google} 個</td></tr><tr><td>用 LINE</td><td>{data.accounts.line} 個</td></tr><tr><td>雲端有進度的</td><td>{data.accounts.saves} 個</td></tr></tbody></table><p className="dim">帳號和上面的匿名統計是分開存的，沒有辦法對起來。這裡只有全部的範圍，不跟著上面選的天數變。</p></div>}
        </div>
      </>}
    </div>
  );
}

/** 錯題複習的重考 vs 一般的場次、自己先寫有沒有想到、刻意練習。只算新版遊戲送來的事件 */
function Learning({ l, weeks }: { l: NonNullable<Summary['learning']>; weeks?: Summary['weeks'] }) {
  const row = (name: string, p: Played) => <tr key={name}><td>{name}</td><td>{p.n}</td><td>{pct(p.found, p.n)}</td><td>{pct(p.trapped, p.n)}</td></tr>;
  return <>
    <div className="tw"><table>
      <thead><tr><th>場次（結案和試弓）</th><th>幾場</th><th>診斷正確</th><th>掉進陷阱</th></tr></thead>
      <tbody>{row('一般', l.first)}{row('錯題複習的重考', l.retry)}</tbody>
    </table></div>
    <p className="dim">重考的是上次錯的那一位，隔 3 天或 7 天之後再做。重考的診斷正確比例比一般高、掉進陷阱比例比一般低，才表示間隔複習有在幫忙；場數太少（例如不到 20 場）先不要下結論。</p>
    <div className="tiles">
      <div className="tile"><b>{pct(l.recall.hit, l.recall.n)}</b><span>下診斷前自己寫，想到正確方向（{l.recall.hit}／{l.recall.n} 場，{l.recall.devices} 台裝置）</span></div>
      {l.drills.map((d) => <div key={d.kind} className="tile"><b>{pct(d.ok, d.total)}</b><span>刻意練習・{DRILL_NAME[d.kind] ?? d.kind}答對（{d.rounds} 輪，{d.devices} 台裝置）</span></div>)}
      {!l.drills.length && <div className="tile"><b>0</b><span>刻意練習的輪數</span></div>}
    </div>
    {weeks && weeks.some((w) => w.first.n || w.retry.n || w.recall.n || w.drill.total) && <LineChart title="每週的變化（比例）" labels={weeks.map((w) => w.week.slice(5).replace('-', '/') + ' 那週')} max={1} fmt={(v) => Math.round(v * 100) + '%'}
      lines={[{ name: '一般・診斷正確', color: SERIES[0], values: weeks.map((w) => rate(w.first.found, w.first.n)) }, { name: '重考・診斷正確', color: SERIES[1], values: weeks.map((w) => rate(w.retry.found, w.retry.n)) },
        { name: '先寫・想到方向', color: SERIES[2], values: weeks.map((w) => rate(w.recall.hit, w.recall.n)) }, { name: '刻意練習・答對', color: SERIES[3], values: weeks.map((w) => rate(w.drill.ok, w.drill.total)) }]}
      note="四條都是比例，同一個 y 軸（0–100%）。那一週沒有資料的就斷開。看的是方向：重考那條在一般那條上面、先寫那條往上走，才是好消息。" />}
    <p className="dim">只算 2026-11-26 之後的版本送來的；更早的事件沒有這幾欄，不算進來。這是看功能有沒有在用、方向對不對的內部指標：只有同意回傳的人、沒有對照組，不能當成研究的成效證據。</p>
  </>;
}
