// 病室：一張委託從進門到結案都在這個畫面。
// 規則全部在 core/engine，這裡只負責把行動送進去、把發生的事演出來。
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Action, CaseDef, QuestionGroup, Session } from '../core/types.ts';
import { clueOf, createSession, lights, perform, stability, testReady, veil } from '../core/engine.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type Line, type TalkHandle, type Who } from './Talk.tsx';
import { BoardSheet, CluesSheet, ConfirmSheet, ExplainSheet, ReportSheet } from './Sheets.tsx';
import { buzz, sfx, sound } from './sound.ts';

type Panel = 'main' | 'ask' | 'assess' | 'tests' | 'call' | 'close';
type SheetName = null | 'board' | 'report' | 'explain' | 'clues' | 'confirm' | 'quit';
const GROUPS: [QuestionGroup, string][] = [['open', '開場'], ['cc', '主訴'], ['hx', '病史'], ['ros', '系統']];
const HEART = <svg viewBox="0 0 22 20" aria-hidden="true"><path fill="currentColor" stroke="#2c2a25" strokeWidth="2" strokeLinejoin="round" d="M11 18.5C4.5 13.6 1.3 10.2 1.3 6.5 1.3 3.6 3.5 1.5 6.2 1.5c1.9 0 3.6 1 4.8 2.7 1.2-1.7 2.9-2.7 4.8-2.7 2.7 0 4.9 2.1 4.9 5 0 3.7-3.2 7.1-9.7 12z" /></svg>;
const mmss = (t: number) => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');

function Opt({ done, wait, onClick, children, cls = '' }: { done?: boolean; wait?: boolean; onClick(): void; children: ReactNode; cls?: string }) {
  return <button type="button" className={'opt ' + cls + (done ? ' done' : '') + (wait ? ' wait' : '')} onClick={onClick}>{children}{done && <i aria-hidden="true">✓</i>}{wait && <i aria-hidden="true">…</i>}</button>;
}
function Sub({ title, children, extra, onBack }: { title?: string; children: ReactNode; extra?: ReactNode; onBack(): void }) {
  return (
    <div className="sub">
      <div className="sub-top"><button type="button" className="back" onClick={onBack} aria-label="回到行動">‹{title ? ' 行動' : ''}</button>{title && <b>{title}</b>}{extra}</div>
      <div className="opts">{children}</div>
    </div>
  );
}

/** 四個真身的按鈕：解讀線索和回答岑禾都用這一組 */
function Forms({ c, onPick }: { c: CaseDef; onPick(id: string): void }) {
  return <div className="forms">{c.forms.map((f) => <button key={f.id} type="button" className="form" onClick={() => onPick(f.id)}><i aria-hidden="true">{f.mark}</i>{f.name}</button>)}</div>;
}

interface Props { c: CaseDef; takeaway: string | null; onDone(s: Session, seconds: number): void; onQuit(): void }

export function Ward({ c, takeaway, onDone, onQuit }: Props) {
  const [session, setSession] = useState(() => createSession(c));
  const [panel, setPanel] = useState<Panel>('main');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [group, setGroup] = useState<QuestionGroup>('open');   // 口試的第一步是自我介紹，所以先停在「開場」
  const [gain, setGain] = useState<{ text: string; key: boolean; n: number } | null>(null);
  const [explainOn, setExplainOn] = useState(false);
  const [banner, setBanner] = useState<{ text: string; bad: boolean; show: boolean }>({ text: '', bad: false, show: false });
  const [soundOn, setSoundOn] = useState(sound.on);
  const live = useRef(session), nudged = useRef(false), bannerTimer = useRef(0), began = useRef(performance.now());
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null);
  const bubble = useRef<HTMLDivElement>(null), veilTag = useRef<HTMLDivElement>(null), speaker = useRef<Who | null>(null);
  const who = c.patient.name;

  const toast = (text: string, bad = false) => {
    setBanner({ text, bad, show: true });
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner((b) => ({ ...b, show: false })), 1800);
  };
  const finish = () => onDone(live.current, Math.round((performance.now() - began.current) / 1000));

  // 進門：岑禾的第一句話
  useEffect(() => {
    const lines: Line[] = [];
    if (takeaway) lines.push({ who: 'sys', text: '你上次說這次要做到：' + takeaway });
    c.lines.opening.forEach((text) => lines.push({ who: 'mentor', text }));
    talk.current?.say(lines);
    return () => window.clearTimeout(bannerTimer.current);
  }, [c, takeaway]);

  // 把對局的狀況交給場景：霧、四盞燈、病人的姿勢、醫師到了沒
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    s.state.veil = session.closedAt !== null ? -0.4 : veil(c, session); s.state.slump = session.worsenedAt !== null ? 1 : 0; s.state.doctor = session.doctorHere ? 1 : 0;
    const l = lights(c, session);
    s.setLights(c.forms.map((f) => ({ mark: f.mark, level: Math.max(-1, Math.min(1, l[f.id] / 4)) })));
  }, [c, session]);

  const onFrame = (s: StageHandle) => {
    const sp = speaker.current, key = sp === 'patient' ? 'lin' : sp === 'mentor' ? 'cen' : sp === 'doctor' ? 'shen' : null;
    s.state.talker = key;
    const at = key ? s.anchor(key) : null, b = bubble.current, v = veilTag.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
    if (v) { const named = live.current.closedAt !== null; v.textContent = named ? c.shadow.name : '霧 ' + Math.max(0, Math.round((s.state.veilShown as number) * 100)) + '%'; v.classList.toggle('named', named); }
  };

  /** 做一個行動：規則核心算結果，這裡把事件演出來 */
  const act = (a: Action) => {
    talk.current?.finish();
    const { session: next, events } = perform(c, live.current, a);
    const first = events[0];
    if (first?.type === 'reject') { sfx.miss(); talk.current?.say([{ who: 'sys', text: first.text }]); return; }
    sfx.tap(); buzz(8);
    live.current = next; setSession(next);
    if (a.type === 'ask' && a.id === 'q-intro') setGroup('cc');
    const lines: Line[] = events.flatMap((e) => (e.type === 'say' ? [{ who: e.who, text: e.text, bad: e.bad }] : []));
    if (a.type === 'exam' && !a.explain && !nudged.current) { nudged.current = true; lines.push({ who: 'mentor', text: c.lines.hintNoExplain }); }
    // 馬上演的
    for (const e of events) {
      if (e.type === 'bell') { sfx.bell(); buzz([40, 60, 40]); stage.current?.ring(); toast(e.by === 'you' ? '值班鐘響了' : '岑禾敲了值班鐘', e.by !== 'you'); }
      if (e.type === 'worsen') { sfx.alarm(); buzz([60, 40, 60]); stage.current?.jolt(); toast(who + '的狀況變了', true); }
      if (e.type === 'doctor') toast('沈渡醫師到了');
      if (e.type === 'read') { if (e.ok) { sfx.key(); buzz(20); stage.current?.clue(true); toast('解讀正確'); } else { sfx.miss(); toast('再想一下', true); } }
    }
    // 等話說完才演的
    talk.current?.say(lines, () => {
      for (const e of events) {
        if (e.type === 'clue') {
          const k = clueOf(c, e.id);
          setGain((g) => ({ text: k.text, key: e.key, n: (g?.n ?? 0) + 1 }));
          if (!k.tell) { stage.current?.clue(false); sfx.clue(); }
        }
        if (e.type === 'toast') toast(e.text, !!e.bad);
        if (e.type === 'closed') sfx.done();
      }
    });
  };

  const v = session.vitalsSeen, stale = !!v && (session.time - v.at > 180 || (session.worsenedAt !== null && v.at < session.worsenedAt));
  const stab = stability(c, session), closed = session.closedAt !== null;
  const ordered = (id: string) => session.ordered.some((o) => o.id === id);
  const seenRecord = (id: string) => session.log.some((l) => l.type === 'record' && l.id === id);
  const open = (p: Panel) => { sfx.page(); setPanel(p); };
  const back = () => open('main');
  const missing = [c.safety.some((r) => r.type === 'call') && session.calledAt === null && '還沒有通報。', !session.report && '還沒有向值班醫師回報。', !session.board.likely && '推理板還是空的。', !session.explained && '還沒有向' + who + '說明。'].filter(Boolean) as string[];
  const reading = session.pending[0] ? clueOf(c, session.pending[0]) : null;

  return (
    <div className="screen ward">
      <div className="left">
        <Stage kind="ward" patient={c.patient.look} stage={stage} onFrame={onFrame} label={'霧脈公會的病室：' + who + '坐在床上，岑禾拿著紀錄板站在旁邊，房間中間飄著被霧裹住的症影，底下掛著四盞燈'}>
          <button type="button" className="tag tag-back" onClick={() => (closed ? finish() : setSheet('quit'))}>‹ 公會</button>
          <span className="tag tag-clock" aria-label={'已經過了 ' + mmss(session.time)}>{mmss(session.time)}</span>
          <div className="bubble" ref={bubble} hidden>…</div>
          <div className="veil" ref={veilTag} />
          <div className={'banner' + (banner.show ? ' show' : '') + (banner.bad ? ' bad' : '')} role="status">{banner.text}</div>
          {gain && <div key={gain.n} className={'gain' + (gain.key ? ' key' : '')}>＋ {gain.text}</div>}
          <div className={'stab' + (stab < 40 ? ' low' : '')} aria-label={'穩定度 ' + stab}><span>穩定度</span><i><b style={{ width: stab + '%' }} /></i></div>
        </Stage>
        {v ? (
          <button type="button" className={'vitals' + (stale && !closed ? ' stale' : '')} disabled={closed || !!reading || session.needCommit} onClick={() => act({ type: 'vitals' })} aria-label={'生命徵象：血壓 ' + v.v.bp + '、心跳 ' + v.v.hr + '、呼吸 ' + v.v.rr + '、血氧 ' + v.v.spo2 + '%。點一下重測'}>
            <span><b>BP</b>{v.v.bp}</span>
            <span><b><i className="heart" style={{ animationDuration: (60 / v.v.hr).toFixed(2) + 's' }}>{HEART}</i>HR</b>{v.v.hr}</span>
            <span><b>RR</b>{v.v.rr}</span>
            <span><b>SpO₂</b>{v.v.spo2}%</span>
            {stale && !closed && <em>舊了，點一下重測</em>}
          </button>
        ) : (
          <button type="button" className="vitals unknown" disabled={closed || !!reading || session.needCommit} onClick={() => act({ type: 'vitals' })}><span>生命徵象還沒量<b>點一下測量</b></span></button>
        )}
      </div>

      <div className="right">
        <Talk ref={talk} patient={who} onSpeaker={(w) => { speaker.current = w; }} more />
        <div className="panel">
          {closed ? (
            <div className="acts one"><button type="button" className="act demo" onClick={finish}>看這一關的回顧</button></div>
          ) : reading ? (
            <div className="ask-read">
              <p><b>「{reading.text}」</b></p>
              <p>這條線索，讓哪一個真身{reading.tell!.dir > 0 ? <em className="up">更像</em> : <em className="down">比較不像</em>}？</p>
              <Forms c={c} onPick={(form) => act({ type: 'read', clue: reading.id, form })} />
            </div>
          ) : session.needCommit ? (
            <div className="ask-read">
              <p><b>岑禾在等你回答。</b></p>
              <p>到目前為止，你最擔心哪一個？</p>
              <Forms c={c} onPick={(form) => act({ type: 'commit', form })} />
            </div>
          ) : panel === 'main' ? (
            <div className="acts">
              <button type="button" className={'act demo' + (session.log.length === 0 ? ' hint' : '')} onClick={() => open('ask')}>問診</button>
              <button type="button" className="act" onClick={() => open('assess')}>評估</button>
              <button type="button" className="act" onClick={() => open('tests')}>檢查</button>
              <button type="button" className="act" onClick={() => { sfx.page(); setSheet('board'); }}>推理</button>
              <button type="button" className="act urgent" onClick={() => open('call')}>通報</button>
              <button type="button" className="act" onClick={() => open('close')}>說明</button>
            </div>
          ) : panel === 'ask' ? (
            <Sub onBack={back} extra={<span className="tabs">{GROUPS.map(([g, name]) => <button key={g} type="button" className={g === group ? 'on' : ''} onClick={() => { sfx.tap(); setGroup(g); }}>{name}</button>)}</span>}>
              {c.questions.filter((q) => q.group === group).map((q) => <Opt key={q.id} done={session.asked.includes(q.id)} onClick={() => act({ type: 'ask', id: q.id })}>{q.label}</Opt>)}
            </Sub>
          ) : panel === 'assess' ? (
            <Sub onBack={back} title="評估" extra={<button type="button" className={'toggle' + (explainOn ? ' on' : '')} aria-pressed={explainOn} onClick={() => { sfx.tap(); setExplainOn(!explainOn); }}>{explainOn ? '☑' : '☐'} 動手前先說明</button>}>
              <Opt done={session.vitalsLog.length > 0} onClick={() => act({ type: 'vitals' })}>量生命徵象</Opt>
              {c.exams.map((e) => <Opt key={e.id} done={session.examined.some((k) => k.id === e.id)} onClick={() => act({ type: 'exam', id: e.id, explain: explainOn })}>{e.label}</Opt>)}
              <Opt onClick={() => act({ type: 'watch' })}>陪著觀察 30 秒</Opt>
            </Sub>
          ) : panel === 'tests' ? (
            <Sub onBack={back} title="檢查與資料">
              {c.tests.map((t) => {
                const ready = t.kind === 'record' ? seenRecord(t.id) : testReady(session, t.id), waiting = t.kind === 'order' && ordered(t.id) && !ready;
                return <Opt key={t.id} done={ready || (waiting && t.delay === undefined)} wait={waiting && t.delay !== undefined} onClick={() => (ready && t.kind === 'order' ? talk.current?.say([{ who: 'sys', text: t.label + '：' + t.result }]) : act({ type: 'test', id: t.id }))}>{t.label}</Opt>;
              })}
            </Sub>
          ) : panel === 'call' ? (
            <Sub onBack={back} title="通報">
              <Opt cls="urgent" done={session.bell} onClick={() => act({ type: 'call' })}>敲值班鐘</Opt>
              <Opt done={!!session.report} onClick={() => (session.report ? act({ type: 'report', a: '', r: [] }) : (sfx.page(), setSheet('report')))}>向值班醫師回報</Opt>
              <Opt onClick={() => act({ type: 'vitals' })}>重測生命徵象</Opt>
            </Sub>
          ) : (
            <Sub onBack={back} title="說明與結案">
              <Opt done={!!session.explained} onClick={() => (session.explained ? act({ type: 'explain', ids: [] }) : (sfx.page(), setSheet('explain')))}>向{who}說明</Opt>
              <Opt cls="urgent" onClick={() => { sfx.page(); setSheet('confirm'); }}>提交摘要，結案</Opt>
            </Sub>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setSheet('clues'); }}>線索 {session.clues.length}</button>
          {!closed && !reading && !session.needCommit && <button type="button" onClick={() => act({ type: 'hint' })}>問岑禾</button>}
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
        </div>
      </div>

      {sheet === 'board' && <BoardSheet c={c} s={session} onClose={() => setSheet(null)} onSave={(board) => { setSheet(null); act({ type: 'board', board }); }} />}
      {sheet === 'report' && <ReportSheet c={c} s={session} onClose={() => setSheet(null)} onSend={(a, r) => { setSheet(null); act({ type: 'report', a, r }); }} />}
      {sheet === 'explain' && <ExplainSheet c={c} s={session} onClose={() => setSheet(null)} onSend={(ids) => { setSheet(null); act({ type: 'explain', ids }); }} />}
      {sheet === 'clues' && <CluesSheet c={c} s={session} onClose={() => setSheet(null)} />}
      {sheet === 'confirm' && <ConfirmSheet title="要結案了嗎？" yes="結案" no="回去補" onNo={() => setSheet(null)} onYes={() => { setSheet(null); setPanel('main'); act({ type: 'close' }); }}
        lines={missing.length ? ['岑禾：「提交之前再看一眼。」', ...missing, '結案之後就不能再補了。'] : ['岑禾：「該做的都做了。」', '提交之後會進到這一關的回顧。']} />}
      {sheet === 'quit' && <ConfirmSheet title="要離開病室嗎？" yes="離開" no="留下" onNo={() => setSheet(null)} onYes={onQuit} lines={['這張委託的進度不會留下來。']} />}
    </div>
  );
}
