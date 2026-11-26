// 關後回顧：蒐集 → 分析 → 摘要。學習發生在這裡。
import { useMemo, useState } from 'react';
import { consultQuestion } from '../core/elders.ts';
import { perilOf } from '../core/perils.ts';
import { GAP_NAME } from '../data/islands.ts';
import { BIAS_REFS } from '../data/odyssey.ts';
import { heroOf } from './progress.ts';
import type { CaseDef, Session } from '../core/types.ts';
import { SAFETY_LABEL, moments, scoreSession, takeaways, trajectory } from '../core/scoring.ts';
import { formOf } from '../core/engine.ts';
import { TRIAL_PASS } from './progress.ts';
import { ReportSheet, useCanReport } from './Report.tsx';
import { sfx } from './sound.ts';
import { formsWritten, matchWritten } from './freetext.ts';
import { REVIEW_GAPS, missed } from './review.ts';
import { RECENT, whyWeak, type Weak } from './sprint.ts';

const mmss = (t: number) => Math.floor(t / 60) + ' 分 ' + String(t % 60).padStart(2, '0') + ' 秒';
const STEPS = ['蒐集', '分析', '摘要'];

/** trial：這一場是試弓。timeUp：時間到自動交卷的 */
interface Props { weak?: Weak[]; c: CaseDef; session: Session; seconds: number; hero?: string | null; echo?: { got: boolean; before: boolean; text: string } | null; trial?: { timeUp: boolean; axes?: boolean }; fresh: { text: string; form: string; dir: 1 | -1 }[]; onFinish(takeaway: string | null): void }

export function Debrief({ weak, c, session, seconds, hero = null, echo = null, trial, fresh, onFinish }: Props) {
  const cq = useMemo(() => (trial ? null : consultQuestion(session)), [session, trial]);
  const [cqPick, setCqPick] = useState<string | null>(null);
  const me = heroOf(hero);
  const pr = useMemo(() => perilOf(c, session), [c, session]);
  const sc = useMemo(() => scoreSession(c, session), [c, session]);
  const ms = useMemo(() => moments(c, session), [c, session]);
  const tk = useMemo(() => takeaways(c, session, sc), [c, session, sc]);
  const tr = useMemo(() => trajectory(c, session), [c, session]);
  const written = useMemo(() => (session.board.written?.length ? matchWritten(c.complaint, c.forms, session.board.written) : null), [c, session]);
  const again = missed({ found: session.board.likely === c.answer.truth, trapped: pr ? pr.trapped : null });
  const [step, setStep] = useState(0), [pick, setPick] = useState<string | null>(null), [mine, setMine] = useState<string | null>(null);
  const m = ms.find((k) => k.id === pick);
  const canReport = useCanReport(), [report, setReport] = useState(false);
  const go = (n: number) => { sfx.page(); setStep(n); };

  return (
    <div className="screen debrief">
      <div className="top"><span className="who">{trial ? '試弓' : '回顧'}｜{c.title}</span><span className="clock">{Math.round(sc.total)} 分</span></div>
      <div className="steps" role="tablist">{STEPS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={i === step} className={i === step ? 'on' : ''} onClick={() => go(i)}>{i + 1}. {name}</button>)}</div>

      <div className="paper page">
        {step === 0 && (
          <>
            <p><b className="name">孟拓</b>「先不看分數。哪一刻最影響你的判斷？」</p>
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
            {trial && <>
              <p className={'note' + (sc.total >= TRIAL_PASS ? '' : ' bad')}><b>{Math.round(sc.total)} 分，{sc.total >= TRIAL_PASS ? '達到及格線' : '還沒到及格線'}</b>（{TRIAL_PASS} 分及格）。{trial.timeUp ? '時間到，自動交卷。' : '用了 ' + mmss(seconds) + '。'}</p>
              <p className="dim">及格線照 115 年度甄審口試的規定。這是訓練用的分數，量的是你在這一場做了什麼，不代表正式甄審的成績。</p>
            </>}
            <div className="scorehead">
              <div><b>{sc.data}</b><span>資料與診察 / 55</span></div>
              <div><b>{sc.reason}</b><span>推理與決策 / 45</span></div>
              <div className={'safety ' + sc.safety}><b>{SAFETY_LABEL[sc.safety]}</b><span>安全行動</span></div>
            </div>
            <p className="quote">{sc.safetyNote}</p>
            <h3>你的想法怎麼變</h3>
            {tr.steps.length ? <ol className="path">{tr.steps.map((k, i) => <li key={i} className={k.right ? 'up' : 'down'}><b>{mmss(k.t)}</b>　{i === tr.steps.length - 1 && session.board.likely ? (trial ? '交卷時' : '結案時') : (trial ? '口試委員問你時' : '孟拓問你時')}：{k.name}</li>)}<li><b>實際上</b>　{tr.truth}</li></ol> : <p className="dim">這一場沒有留下你的判斷。實際上是{tr.truth}。</p>}
            <p className="quote">{tr.verdict}</p>
            {written && <>
              <h3>下診斷之前，你先寫的</h3>
              <ul className="path">{written.map((w) => <li key={w.text} className={w.forms.includes(c.answer.truth) ? 'up' : 'none'}>{w.text}{w.forms.length ? ' → ' + w.forms.map((id) => formOf(c, id)!.name).join('、') : ''}</li>)}</ul>
              <p className="dim">{formsWritten(c.forms, written).includes(c.answer.truth) ? '這一關的診斷方向「' + formOf(c, c.answer.truth)!.name + '」，你沒看選項就想到了。' : '這一關的診斷方向「' + formOf(c, c.answer.truth)!.name + '」，你自己寫的時候沒有想到。下一次遇到' + c.complaintName + '，先把它放進腦子裡的清單。'}（這一段不計分。）</p>
            </>}
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
            {canReport && <button type="button" className="skip" onClick={() => { sfx.page(); setReport(true); }}>覺得這一張的內容有問題？告訴我們</button>}
          </>
        )}

        {step === 2 && (
          <>
            {pr && (
              <div className={'leaf peril' + (pr.trapped ? ' trapped' : '')}>
                <b>{pr.peril.name}：{pr.trapped ? '這一劫，你被困住了' : '你過了這一劫'}</b>
                <p className="dim">{pr.peril.myth}</p>
                <p>{pr.peril.trap}</p>
                <p className="bias-name"><b>{pr.peril.bias.kind === 'bias' ? '這個陷阱的名字' : '這個陷阱'}：{pr.peril.bias.name}</b>（{pr.peril.bias.en}）。{pr.peril.bias.what}{pr.peril.bias.kind === 'habit' ? '它不是一種認知偏誤，是常漏掉的一個習慣。' : ''}</p>
                <p className={pr.trapped ? 'down' : 'up'}>{pr.why}</p>
                {pr.trapped && <p>{pr.peril.next}</p>}
                {trial?.axes && sc.total >= TRIAL_PASS && <p className="up">十二斧之試：{c.shadow.name}的那一把斧頭亮了。</p>}
                <p className="dim">這一段不計分。病室裡不會出現劫的名字；它是讓你把這個主訴最容易掉進去的陷阱記住。陷阱的名字依{' '}<a href={'https://doi.org/' + BIAS_REFS[pr.peril.bias.ref].doi} target="_blank" rel="noreferrer">{BIAS_REFS[pr.peril.bias.ref].short}</a>整理。</p>
              </div>
            )}
            {cq && (
              <div className="leaf">
                <b>你請教的那一位，漏了什麼？</b>
                <p>你在第 {Math.floor(cq.t / 60)} 分 {String(cq.t % 60).padStart(2, '0')} 秒請教了{cq.name}。那時候你還沒做、{cq.pronoun}也沒提的，是哪一項？</p>
                <div className="stack">{cq.options.map((g) => <button key={g} type="button" className={'pick' + (cqPick === g ? (g === cq.answer ? ' on' : ' off') : '')} disabled={cqPick !== null} onClick={() => { sfx.tap(); setCqPick(g); }}>{GAP_NAME[g]}</button>)}</div>
                {cqPick && <p className={cqPick === cq.answer ? 'up' : 'down'}>{cqPick === cq.answer ? '對。' : '不是這一項：那時候你已經做了。是「' + GAP_NAME[cq.answer] + '」。'}{cq.name}的盲點是：{cq.blind}{cq.pronoun}說的要聽，{cq.pronoun}沒提的，要自己看。</p>}
                <p className="dim">這一題不計分。</p>
              </div>
            )}
            {!trial && (
              <div className="leaf">
                <b>{me.name}的盲點：{me.blind}</b>
                <p>{me.ask}</p>
                <p className="dim">想一想就好，不用作答，不計分。</p>
              </div>
            )}
            {echo && (echo.got
              ? <div className="leaf"><b>{echo.before ? '歸鄉的消息' : '歸鄉的消息（新的）'}</b><p>{echo.text}</p></div>
              : <div className="leaf"><b>歸鄉的消息</b><p className="dim">這一次，{c.patient.name}由公會的前輩接手安頓。重接這一張，診斷對、也回應{c.patient.pronoun}擔心的事，才會收到{c.patient.pronoun}的近況。</p></div>)}
            <p><b className="name">孟拓</b>「選一件下次要做到的事，帶進下一張委託。」</p>
            <div className="stack">{tk.map((t) => <button key={t} type="button" className={'pick' + (mine === t ? ' on' : '')} aria-pressed={mine === t} onClick={() => { sfx.tap(); setMine(t); }}>{t}</button>)}</div>
            <p className="dim">下一次進病室的時候，孟拓會提醒你這一句。</p>
            {trial ? <p className="dim">試弓不會寫進圖鑑，也不算完成這一張委託；成績會記在大廳的「試弓」裡。</p> : <>
              <h3>這一關寫回圖鑑的</h3>
              {fresh.length ? <ul className="path">{fresh.map((r, i) => <li key={i} className={r.dir > 0 ? 'up' : 'down'}>{r.dir > 0 ? '＋' : '－'} {r.text} → {formOf(c, r.form)!.name}</li>)}</ul> : <p className="dim">這一次沒有新的線索寫回去。解讀對的線索才會留下來。</p>}
            </>}
            {weak && weak.length > 0 && (
              <div className="leaf">
                <b>算進這一場之後，你最弱的三種主訴</b>
                <ol className="weak">{weak.map((w) => <li key={w.complaint}><b>{w.name}</b><span className="dim">{whyWeak(w)}</span></li>)}</ol>
                <p className="dim">每一種只看最近 {RECENT} 場。口試前兩週的「考前衝刺」會從這三種抽題；還沒練過的排在最前面。</p>
              </div>
            )}
            {again && <p className="note">這一位{session.board.likely === c.answer.truth ? '你掉進了陷阱' : '的診斷沒有對到'}，大約 {REVIEW_GAPS[0]} 天後會出現在大廳的「錯題複習」，{trial ? '再考一次' : '再接一次'}。隔幾天再做，比馬上重來記得牢。</p>}
            <p className="dim">這一關你花了 {Math.floor(seconds / 60)} 分 {String(seconds % 60).padStart(2, '0')} 秒。</p>
          </>
        )}
      </div>

      {report && <ReportSheet place="debrief" caseId={c.id} caseTitle={c.title + '（' + c.patient.name + '）'} onClose={() => setReport(false)} />}
      <div className="acts two">
        {step > 0 ? <button type="button" className="act" onClick={() => go(step - 1)}>上一步</button> : <span />}
        {step < 2 ? <button type="button" className="act demo" onClick={() => go(step + 1)}>下一步</button>
          : <button type="button" className="act demo" onClick={() => { sfx.done(); onFinish(mine); }}>{mine ? '帶回公會' : '不選，回公會'}</button>}
      </div>
    </div>
  );
}
