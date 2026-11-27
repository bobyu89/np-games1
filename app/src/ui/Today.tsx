// 大廳的「今天」卡：今天該做的事收在一張，打開就知道先按哪裡。
// 今日之劫、考前衝刺的試弓（口試前兩週）、到期的錯題；衝刺期間再加一條日子和最弱的三種主訴（收起來，要看再點開）。
import type { CaseDef } from '../core/types.ts';
import { caseById } from '../data/index.ts';
import type { ReviewItem } from './review.ts';
import type { Save } from './store.ts';
import { RECENT, weakness, whyWeak, type Sprint } from './sprint.ts';
import { openNotes } from './notes.ts';
import { sfx } from './sound.ts';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

interface Props {
  save: Save;
  /** 試弓開放了沒（今日之劫和衝刺都用試弓的規則考） */
  trials: boolean;
  sprint: Sprint | null;
  daily: CaseDef;
  dailyOk: boolean;
  due: ReviewItem[];
  soon: ReviewItem[];
  onDaily(): void;
  onDraw(): void;
  onReview(r: ReviewItem): void;
}

export function TodayCard({ save, trials, sprint, daily, dailyOk, due, soon, onDaily, onDraw, onReview }: Props) {
  const rows = (trials ? 1 : 0) + (sprint ? 1 : 0) + due.length;
  if (!rows && !soon.length) return null;
  const left = (trials && !dailyOk ? 1 : 0) + (sprint && !sprint.trialToday ? 1 : 0) + due.length;
  return (
    <div className="paper today-card" role="region" aria-label="今天">
      <b className="today-head">今天{sprint ? '・距離口試還有 ' + sprint.daysLeft + ' 天' : ''}<em>{left ? '還有 ' + left + ' 件' : '都做完了'}</em></b>
      <ul className="todo">
        {trials && (
          <li className={dailyOk ? 'done' : ''}>
            <span><b>今日之劫</b>：{daily.patient.name}（{daily.complaintName}）<small>大家今天都是這一位，和 Threads 同一天</small></span>
            {!dailyOk ? <button type="button" className="pick on" onClick={() => { sfx.page(); onDaily(); }}>閱題</button> : <i>✓</i>}
          </li>
        )}
        {sprint && (
          <li className={sprint.trialToday ? 'done' : ''}>
            <span><b>衝刺試弓</b>：從你最弱的主訴抽一位<small>15 分鐘、沒有提示</small></span>
            {!sprint.trialToday ? <button type="button" className="pick on" onClick={() => { sfx.page(); onDraw(); }}>抽題</button> : <i>✓</i>}
          </li>
        )}
        {due.map((r) => { const c = caseById(r.caseId); return (
          <li key={r.caseId}>
            <span><b>錯題複習</b>：{c.patient.name}（{c.complaintName}）<small>{r.why.wrong ? '診斷沒有對到' : '掉進了陷阱'}・第 {r.round} 次複習</small></span>
            <button type="button" className="pick on" onClick={() => { sfx.page(); onReview(r); }}>{r.trial ? '重考' : '重接'}</button>
          </li>
        ); })}
        {!due.length && soon.length > 0 && <li className="done"><span>錯題複習：今天沒有到期的<small>下一次 {soon[0].due.slice(5).replace('-', '/')}</small></span></li>}
      </ul>
      {sprint && <>
        <ol className="sprint-days" aria-label={'衝刺期間有 ' + sprint.trialDays + ' 天考了試弓'}>
          {sprint.days.map((d) => (
            <li key={d.day} className={d.state + (d.trial ? ' done' : '')} title={d.day + (d.state === 'exam' ? '：口試' : d.trial ? '：考了試弓' : '')}>
              <small>{WEEK[new Date(d.day + 'T00:00:00').getDay()]}</small><span>{d.state === 'exam' ? '考' : Number(d.day.slice(8))}</span>
            </li>
          ))}
        </ol>
        <details className="weak-box">
          <summary>最弱的三種主訴</summary>
          <ol className="weak">{weakness(save).slice(0, 3).map((w) => <li key={w.complaint}><b>{w.name}</b><span className="dim">{whyWeak(w)}</span></li>)}</ol>
          <p className="dim">每一種只看最近 {RECENT} 場（委託和試弓都算）。衝刺試弓從這三種裡抽。</p>
          <button type="button" className="pick" onClick={() => { sfx.page(); openNotes(); }}>考前速記頁</button>
        </details>
      </>}
    </div>
  );
}
