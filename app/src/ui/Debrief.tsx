// 關後回顧：蒐集 → 分析 → 摘要。學習發生在這裡。
import { useMemo, useState } from 'react';
import type { CaseDef, Session } from '../core/types.ts';
import { SAFETY_LABEL, moments, scoreSession, takeaways, trajectory } from '../core/scoring.ts';
import { formOf } from '../core/engine.ts';
import { sfx } from './sound.ts';

const mmss = (t: number) => Math.floor(t / 60) + ' 分 ' + String(t % 60).padStart(2, '0') + ' 秒';
const STEPS = ['蒐集', '分析', '摘要'];

interface Props { c: CaseDef; session: Session; seconds: number; fresh: { text: string; form: string; dir: 1 | -1 }[]; onFinish(takeaway: string | null): void }

export function Debrief({ c, session, seconds, fresh, onFinish }: Props) {
  const sc = useMemo(() => scoreSession(c, session), [c, session]);
  const ms = useMemo(() => moments(c, session), [c, session]);
  const tk = useMemo(() => takeaways(c, session, sc), [c, session, sc]);
  const tr = useMemo(() => trajectory(c, session), [c, session]);
  const [step, setStep] = useState(0), [pick, setPick] = useState<string | null>(null), [mine, setMine] = useState<string | null>(null);
  const m = ms.find((k) => k.id === pick);
  const go = (n: number) => { sfx.page(); setStep(n); };

  return (
    <div className="screen debrief">
      <div className="top"><span className="who">回顧｜{c.title}</span><span className="clock">{Math.round(sc.total)} 分</span></div>
      <div className="steps" role="tablist">{STEPS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={i === step} className={i === step ? 'on' : ''} onClick={() => go(i)}>{i + 1}. {name}</button>)}</div>

      <div className="paper page">
        {step === 0 && (
          <>
            <p><b className="name">岑禾</b>「先不看分數。哪一刻最影響你的判斷？」</p>
            <div className="stack">
              {ms.map((k) => <button key={k.id} type="button" className={'pick' + (pick === k.id ? ' on' : '')} aria-pressed={pick === k.id} onClick={() => { sfx.tap(); setPick(k.id); }}><b>{mmss(k.t)}</b>　{k.name}</button>)}
              {!ms.length && <p className="dim">這一場沒有留下可以回看的時間點。</p>}
            </div>
            {m && (
              <>
                <h3>那一刻你手上有的線索（{m.clues.length}）</h3>
                {m.clues.length ? <div className="chips wrap">{m.clues.map((id) => { const k = c.clues.find((x) => x.id === id)!; return <span key={id} className={'chip ' + k.kind}>{k.text}</span>; })}</div> : <p className="dim">什麼都還不知道。</p>}
                <p className="dim">想一想：用這些線索，那時候可以做出不一樣的決定嗎？</p>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className="scorehead">
              <div><b>{sc.data}</b><span>資料與診察 / 55</span></div>
              <div><b>{sc.reason}</b><span>推理與決策 / 45</span></div>
              <div className={'safety ' + sc.safety}><b>{SAFETY_LABEL[sc.safety]}</b><span>安全行動</span></div>
            </div>
            <p className="quote">{sc.safetyNote}</p>
            <h3>你的想法怎麼變</h3>
            {tr.steps.length ? <ol className="path">{tr.steps.map((k, i) => <li key={i} className={k.right ? 'up' : 'down'}><b>{mmss(k.t)}</b>　{i === tr.steps.length - 1 && session.board.likely ? '結案時' : '岑禾問你時'}：{k.name}</li>)}<li><b>真身</b>　{tr.truth}</li></ol> : <p className="dim">這一場沒有留下你的判斷。真身是{tr.truth}。</p>}
            <p className="quote">{tr.verdict}</p>
            {sc.rows.map((r) => (
              <div key={r.id} className="row">
                <div className="row-top"><b>{r.name}</b><span>{r.got} / {r.max}</span></div>
                <i className="bar"><b style={{ width: (r.got / r.max) * 100 + '%' }} /></i>
                <ul>{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            ))}
            <h3>其他也可以的做法</h3>
            <ul>{c.debrief.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
            <h3>這一關的重點</h3>
            <ul>{c.debrief.teaching.map((t, i) => <li key={i}>{t.text}<sup>［{c.debrief.references.findIndex((r) => r.id === t.ref) + 1}］</sup></li>)}</ul>
            <h3>出處</h3>
            <ol className="refs">{c.debrief.references.map((r) => <li key={r.id}>{r.text} <a href={'https://doi.org/' + r.doi} target="_blank" rel="noreferrer">https://doi.org/{r.doi}</a></li>)}</ol>
            <p className="dim">這是訓練用的分數，不代表正式甄審的成績。{c.review.note}</p>
          </>
        )}

        {step === 2 && (
          <>
            <p><b className="name">岑禾</b>「選一件下次要做到的事，帶進下一張委託。」</p>
            <div className="stack">{tk.map((t) => <button key={t} type="button" className={'pick' + (mine === t ? ' on' : '')} aria-pressed={mine === t} onClick={() => { sfx.tap(); setMine(t); }}>{t}</button>)}</div>
            <p className="dim">下一次進病室的時候，岑禾會提醒你這一句。</p>
            <h3>這一關寫回圖鑑的</h3>
            {fresh.length ? <ul className="path">{fresh.map((r, i) => <li key={i} className={r.dir > 0 ? 'up' : 'down'}>{r.dir > 0 ? '＋' : '－'} {r.text} → {formOf(c, r.form)!.name}</li>)}</ul> : <p className="dim">這一次沒有新的線索寫回去。解讀對的線索才會留下來。</p>}
            <p className="dim">這一關你花了 {Math.floor(seconds / 60)} 分 {String(seconds % 60).padStart(2, '0')} 秒。</p>
          </>
        )}
      </div>

      <div className="acts two">
        {step > 0 ? <button type="button" className="act" onClick={() => go(step - 1)}>上一步</button> : <span />}
        {step < 2 ? <button type="button" className="act demo" onClick={() => go(step + 1)}>下一步</button>
          : <button type="button" className="act demo" onClick={() => { sfx.done(); onFinish(mine); }}>{mine ? '帶回公會' : '不選，回公會'}</button>}
      </div>
    </div>
  );
}
