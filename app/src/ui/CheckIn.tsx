// 打卡：大廳和首頁的一條，和點開之後的日曆。規則在 streak.ts。
import { useState } from 'react';
import { dayKey, monthGrid, streakOf } from './streak.ts';
import { trapProfile } from './progress.ts';
import type { Save } from './store.ts';
import { sfx } from './sound.ts';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/** 一行字：連續幾天、今天打卡了沒。onOpen 有給就可以點開日曆 */
export function CheckInStrip({ save, onOpen, now = Date.now() }: { save: Save; onOpen?(): void; now?: number }) {
  const s = streakOf(save.days, dayKey(now));
  const text = s.today ? '今天打卡了・連續 ' + s.count + ' 天' : s.count ? '連續 ' + s.count + ' 天・今天還沒打卡' : s.total ? '今天還沒打卡' : '還沒打過卡';
  const hint = s.today ? (s.best > s.count ? '最長 ' + s.best + ' 天' : '') : '結案一張委託或交一次試弓就算';
  const body = <><i className={'checkin-dot' + (s.today ? ' on' : '')} aria-hidden="true" /><b>{text}</b>{hint && <span>{hint}</span>}</>;
  return onOpen
    ? <button type="button" className="checkin" onClick={() => { sfx.page(); onOpen(); }} aria-label={text + '。' + hint + '。打開打卡日曆'}>{body}</button>
    : <div className="checkin">{body}</div>;
}

/** 日曆和規則，放在 Sheet 裡 */
export function CheckInBody({ save, now = Date.now() }: { save: Save; now?: number }) {
  const today = dayKey(now), s = streakOf(save.days, today);
  const [ym, setYm] = useState(today.slice(0, 7));
  const move = (n: number) => { sfx.tap(); const [y, m] = ym.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + n, 1)); setYm(d.toISOString().slice(0, 7)); };
  const cells = monthGrid(save.days, ym), first = save.days?.[0]?.slice(0, 7) ?? today.slice(0, 7);
  return (
    <>
      <div className="scorehead">
        <div><b>{s.count}</b><span>現在連續（天）</span></div>
        <div><b>{s.best}</b><span>最長（天）</span></div>
        <div><b>{s.total}</b><span>一共打卡（天）</span></div>
      </div>
      <div className="cal-head">
        <button type="button" className="pick" onClick={() => move(-1)} disabled={ym <= first} aria-label="上一個月">‹</button>
        <b>{ym.replace('-', ' 年 ')} 月</b>
        <button type="button" className="pick" onClick={() => move(1)} disabled={ym >= today.slice(0, 7)} aria-label="下一個月">›</button>
      </div>
      <div className="cal" role="grid" aria-label={ym + ' 的打卡日曆'}>
        {WEEK.map((w) => <span key={w} className="cal-w" aria-hidden="true">{w}</span>)}
        {cells.map((c, i) => (c
          ? <span key={c.day} role="gridcell" className={'cal-d' + (c.done ? ' on' : '') + (c.day === today ? ' today' : '')} aria-label={c.n + ' 日' + (c.done ? '，有打卡' : '')}>{c.n}</span>
          : <span key={'x' + i} aria-hidden="true" />))}
      </div>
      <h3>怎麼算</h3>
      <ul>
        <li>結案一張委託，或交一次試弓，那一天就算打卡。只是打開遊戲不算。</li>
        <li>每個月有一天可以休息：缺的那一天前後都有打卡，連續就不會斷（休息的那一天不算進天數）。{s.restUsed ? '這個月的休息日用掉了。' : ''}</li>
        <li>日期照這台裝置的日期。有登入的話，打卡紀錄跟著進度同步到其他裝置。</li>
        <li>打卡只是給自己看的紀錄，不影響分數、不解鎖任何東西，也不會傳給研究或管理者。</li>
      </ul>
    </>
  );
}

/** 你的陷阱紀錄：最近幾場，每一種陷阱掉進去幾次 */
export function TrapRecordCard({ save }: { save: Save }) {
  const rows = trapProfile(save), n = rows.reduce((k, r) => k + r.trapped + r.passed, 0);
  if (!rows.length) return <div className="paper traps-card"><b>你的陷阱紀錄</b><p className="dim">結案一張委託或交一次試弓之後，這裡會記下你掉進了哪一種陷阱。</p></div>;
  const worst = rows[0].trapped > 0 ? rows[0] : null;
  return (
    <div className="paper traps-card">
      <b>你的陷阱紀錄（最近 {n} 場）</b>
      {worst ? <p>最常掉進去的是<b>{worst.peril.bias.name}</b>（{worst.peril.bias.en}）：{worst.peril.bias.what}下一次：{worst.peril.next}</p> : <p className="up">最近每一場都沒有掉進陷阱。</p>}
      <ul className="traps">
        {rows.map((r) => (
          <li key={r.peril.complaint}>
            <span>{r.peril.name}・{r.peril.bias.name}</span>
            <i className="bar"><b style={{ width: (100 * r.trapped) / (r.trapped + r.passed) + '%' }} /></i>
            <em>掉進 {r.trapped}／{r.trapped + r.passed}{r.last ? '・最近一次也是' : ''}</em>
          </li>
        ))}
      </ul>
      <p className="dim">只是給你自己看的，不計分。陷阱的名字依 Croskerry（2003）等文獻整理。</p>
    </div>
  );
}
