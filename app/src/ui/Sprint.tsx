// 大廳的考前衝刺卡：離口試還有幾天、每天考了試弓沒有、今天要做的兩件事、最弱的三種主訴。規則在 sprint.ts。
import type { Save } from './store.ts';
import { RECENT, weakness, whyWeak, type Sprint } from './sprint.ts';
import { sfx } from './sound.ts';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export function SprintCard({ save, sprint, due, onDraw }: { save: Save; sprint: Sprint; due: number; onDraw(): void }) {
  const weak = weakness(save).slice(0, 3);
  return (
    <div className="paper sprint-card" role="region" aria-label="考前衝刺">
      <b>考前衝刺・距離口試還有 {sprint.daysLeft} 天</b>
      <ol className="sprint-days" aria-label={'衝刺期間有 ' + sprint.trialDays + ' 天考了試弓'}>
        {sprint.days.map((d) => (
          <li key={d.day} className={d.state + (d.trial ? ' done' : '')} title={d.day + (d.state === 'exam' ? '：口試' : d.trial ? '：考了試弓' : '')}>
            <small>{WEEK[new Date(d.day + 'T00:00:00').getDay()]}</small><span>{d.state === 'exam' ? '考' : Number(d.day.slice(8))}</span>
          </li>
        ))}
      </ol>
      <h4>今天</h4>
      <ul className="todo">
        <li className={sprint.trialToday ? 'done' : ''}>
          <span>{sprint.trialToday ? '✓ 今天考過試弓了' : '一場試弓：從你最弱的主訴抽，15 分鐘、沒有提示'}</span>
          {!sprint.trialToday && <button type="button" className="pick on" onClick={() => { sfx.page(); onDraw(); }}>抽題</button>}
        </li>
        <li className={due ? '' : 'done'}><span>{due ? '錯題複習：今天有 ' + due + ' 位到期（在下面）' : '✓ 今天沒有到期的錯題'}</span></li>
      </ul>
      <h4>最弱的三種主訴</h4>
      <ol className="weak">{weak.map((w) => <li key={w.complaint}><b>{w.name}</b><span className="dim">{whyWeak(w)}</span></li>)}</ol>
      <p className="dim">每一種只看最近 {RECENT} 場（委託和試弓都算）。衝刺抽題會從這三種裡抽；練過、變強了，名單就會換。</p>
    </div>
  );
}

