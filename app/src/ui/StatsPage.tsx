// 給管理者看的總表：網址後面加 #stats。要管理密碼；密碼只留在這個分頁，關掉就沒有了。
// 數字來自 worker/ 那個端點。每一關的名字從病例檔補上，端點那邊只認得代號。
import { useEffect, useState } from 'react';
import { CASES } from '../data/index.ts';
import { STATS_URL, statsBuilt } from './stats.ts';

interface CaseRow { case_id: string; starts: number; dones: number; starters: number; finishers: number; firstScore: number | null; score: number | null; met: number; late: number; review: number; found: number; secs: number | null; hints: number | null; stuck: [number, number, number, number] }
interface Summary {
  since: string | null; until: string;
  totals: { devices: number; finishers: number; returning: number; installed: number; opens: number; starts: number; dones: number; leaves: number; drops: number };
  days: { day: string; devices: number; starts: number; dones: number }[]; cases: CaseRow[];
  accounts?: { accounts: number; saves: number; google: number; line: number };
  platforms: { pf: string; devices: number }[]; builds: { build: string; devices: number; last: string }[]; depth: { label: string; devices: number }[];
}
const PF: Record<string, string> = { ios: 'iPhone、iPad', android: 'Android', desktop: '電腦', other: '其他' };
const PHASE = ['問診', '評估', '診斷', '檢查'];
const RANGES: [string, string][] = [['7', '最近 7 天'], ['30', '最近 30 天'], ['90', '最近 90 天'], ['', '全部']];
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '—');
const mins = (s: number | null) => (s === null ? '—' : Math.round(s / 60) + ' 分');
const nameOf = (id: string) => { const c = CASES.find((k) => k.id === id); return c ? c.patient.name + '｜' + c.complaintName + '・' + (c.forms.find((f) => f.id === c.answer.truth)?.name ?? '') : id; };
const Bar = ({ n, max }: { n: number; max: number }) => <i className="statbar"><b style={{ width: (max ? Math.round((n / max) * 100) : 0) + '%' }} /></i>;

export function StatsPage({ onClose }: { onClose(): void }) {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem('mist-guild.admin') ?? ''; } catch { return ''; } });
  const [days, setDays] = useState('30');
  const [data, setData] = useState<Summary | null>(null);
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
    try { setData(await (await ask('/stats')).json() as Summary); try { sessionStorage.setItem('mist-guild.admin', key); } catch { /* 記不住就每次輸入 */ } }
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

  const t = data?.totals, maxDay = Math.max(1, ...(data?.days ?? []).map((d) => d.devices));
  return (
    <div className="admin-page">
      <div className="admin-top"><h1>霧脈公會｜使用統計</h1><button type="button" className="pick" onClick={onClose}>回到遊戲</button></div>
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
          {([['出現過的裝置', t.devices], ['至少結案一張', t.finishers], ['在兩天以上出現', t.returning], ['從主畫面圖示開過', t.installed], ['接了幾張', t.starts], ['結案幾張', t.dones], ['做到一半回公會', t.leaves], ['放掉', t.drops]] as [string, number][])
            .map(([name, n]) => <div key={name} className="tile"><b>{n}</b><span>{name}</span></div>)}
        </div>

        <h2>每一關</h2>
        <div className="tw"><table>
          <thead><tr><th>委託</th><th>接過的裝置</th><th>結案的裝置</th><th>結案的比例</th><th>第一次的平均分</th><th>安全行動：達成／部分／複核</th><th>診斷正確</th><th>平均花多久</th><th>平均問岑禾</th><th>離開時停在</th></tr></thead>
          <tbody>{data.cases.map((c) => (
            <tr key={c.case_id}><td>{nameOf(c.case_id)}</td><td>{c.starters}</td><td>{c.finishers}</td><td>{pct(c.finishers, c.starters)}</td><td>{c.firstScore ?? '—'}</td><td>{c.met}／{c.late}／{c.review}</td><td>{pct(c.found, c.dones)}</td><td>{mins(c.secs)}</td><td>{c.hints ?? '—'}</td>
              <td>{c.stuck.some((n) => n > 0) ? c.stuck.map((n, i) => (n ? PHASE[i] + ' ' + n : '')).filter(Boolean).join('、') : '—'}</td></tr>
          ))}</tbody>
        </table></div>
        {!data.cases.length && <p className="dim">這段時間還沒有人接委託。</p>}

        <h2>每一天</h2>
        <div className="tw"><table>
          <thead><tr><th>日期</th><th>裝置</th><th /><th>接了幾張</th><th>結案幾張</th></tr></thead>
          <tbody>{data.days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.devices}</td><td className="wide"><Bar n={d.devices} max={maxDay} /></td><td>{d.starts}</td><td>{d.dones}</td></tr>)}</tbody>
        </table></div>

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
