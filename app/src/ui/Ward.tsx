// 病室：一張委託從進門到結案都在這個畫面。
// 規則全部在 core/engine，這裡只負責把行動送進去、把發生的事演出來。
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Action, CaseDef, QuestionGroup, Session } from '../core/types.ts';
import { HINT_LIMIT, clueOf, createSession, formOf, lights, perform, stability, testReady, veil } from '../core/engine.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type Line, type TalkHandle, type Who } from './Talk.tsx';
import { BoardSheet, CluesSheet, ConfirmSheet, ExplainSheet, ReportSheet } from './Sheets.tsx';
import { buzz, sfx, sound } from './sound.ts';

// 一排七個分頁，就是一場的順序：問診（開場、主訴、病史、系統回顧）→ 評估 → 診斷 → 檢查。
// 前面的隨時可以回去補；後面的要等前一個階段做完才打開。
type Tab = QuestionGroup | 'exam' | 'dx' | 'plan';
const TABS: { id: Tab; name: string; phase: 1 | 2 | 3 | 4 }[] = [
  { id: 'open', name: '開場', phase: 1 }, { id: 'cc', name: '主訴', phase: 1 }, { id: 'hx', name: '病史', phase: 1 }, { id: 'ros', name: '系統', phase: 1 },
  { id: 'exam', name: '評估', phase: 2 }, { id: 'dx', name: '診斷', phase: 3 }, { id: 'plan', name: '檢查', phase: 4 },
];
const GROUP_NAME: Record<QuestionGroup, string> = { open: '開場', cc: '主訴', hx: '病史', ros: '系統回顧' };
const NEXT_GROUP: Partial<Record<QuestionGroup, QuestionGroup>> = { open: 'cc', cc: 'hx', hx: 'ros' };
type SheetName = null | 'board' | 'report' | 'explain' | 'clues' | 'confirm' | 'quit' | 'next' | 'bell';
const HEART = <svg viewBox="0 0 22 20" aria-hidden="true"><path fill="currentColor" stroke="#2c2a25" strokeWidth="2" strokeLinejoin="round" d="M11 18.5C4.5 13.6 1.3 10.2 1.3 6.5 1.3 3.6 3.5 1.5 6.2 1.5c1.9 0 3.6 1 4.8 2.7 1.2-1.7 2.9-2.7 4.8-2.7 2.7 0 4.9 2.1 4.9 5 0 3.7-3.2 7.1-9.7 12z" /></svg>;
const mmss = (t: number) => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');

function Opt({ done, wait, onClick, children, cls = '' }: { done?: boolean; wait?: boolean; onClick(): void; children: ReactNode; cls?: string }) {
  return <button type="button" className={'opt ' + cls + (done ? ' done' : '') + (wait ? ' wait' : '')} onClick={onClick}>{children}{done && <i aria-hidden="true">✓</i>}{wait && <i aria-hidden="true">…</i>}</button>;
}

/** 四個診斷的按鈕：解讀線索和回答岑禾都用這一組。病室裡一律說「診斷」，不說圖鑑裡的「真身」 */
function Forms({ c, onPick }: { c: CaseDef; onPick(id: string): void }) {
  return <div className="forms">{c.forms.map((f) => <button key={f.id} type="button" className="form" onClick={() => onPick(f.id)}><i aria-hidden="true">{f.mark}</i>{f.name}</button>)}</div>;
}

/** resume：上次做到一半的那一場。onProgress：每做一個行動就交出去存，中途離開回來可以接著做 */
interface Props { c: CaseDef; tier: 0 | 1; hero: string | null; takeaway: string | null; resume?: { session: Session; seconds: number } | null; onProgress?(s: Session, seconds: number): void; onDone(s: Session, seconds: number): void; onQuit(): void }
/** 接著做的時候，翻到做到一半的那一頁 */
const tabFor = (c: CaseDef, s: Session): Tab => (s.phase === 2 ? 'exam' : s.phase === 3 ? 'dx' : s.phase === 4 ? 'plan'
  : (['open', 'cc', 'hx', 'ros'] as QuestionGroup[]).find((g) => c.questions.some((q) => q.group === g && !s.asked.includes(q.id))) ?? 'ros');

export function Ward({ c, tier, hero, takeaway, resume, onProgress, onDone, onQuit }: Props) {
  const [session, setSession] = useState(() => resume?.session ?? createSession(c, tier));
  const [dir, setDir] = useState<1 | -1 | null>(null);   // 提示拿掉一層之後，線索的方向要自己選
  const [tab, setTab] = useState<Tab>(() => (resume ? tabFor(c, resume.session) : 'open'));   // 第一步是開場：洗手、自我介紹、說明流程
  const [sheet, setSheet] = useState<SheetName>(null);
  const [gain, setGain] = useState<{ text: string; key: boolean; n: number } | null>(null);
  const [explainOn, setExplainOn] = useState(false);
  const [banner, setBanner] = useState<{ text: string; bad: boolean; show: boolean }>({ text: '', bad: false, show: false });
  const [soundOn, setSoundOn] = useState(sound.on);
  const live = useRef(session), nudged = useRef(false), bannerTimer = useRef(0), began = useRef(performance.now() - (resume?.seconds ?? 0) * 1000), resumed = useRef(!!resume);
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null);
  const bubble = useRef<HTMLDivElement>(null), veilTag = useRef<HTMLDivElement>(null), speaker = useRef<Who | null>(null);
  const who = c.patient.name;

  const toast = (text: string, bad = false) => {
    setBanner({ text, bad, show: true });
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner((b) => ({ ...b, show: false })), 1800);
  };
  const elapsed = () => Math.round((performance.now() - began.current) / 1000);
  const finish = () => onDone(live.current, elapsed());

  // 進門：岑禾的第一句話
  useEffect(() => {
    const lines: Line[] = [];
    if (resumed.current) lines.push({ who: 'sys', text: '你回到' + who + '的床邊。之前問到的、做過的都還在；剛才的對話沒有留下來，拿到的線索在底下的「線索」裡。' });
    else {
      if (takeaway) lines.push({ who: 'sys', text: '你上次說這次要做到：' + takeaway });
      c.lines.opening.forEach((text) => lines.push({ who: 'mentor', text }));
    }
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
    const sp = speaker.current, key = sp === 'patient' ? 'lin' : sp === 'mentor' ? 'cen' : sp === 'doctor' ? 'shen' : sp === 'you' ? 'hero' : null;
    s.state.talker = key;
    const at = key ? s.anchor(key) : null, b = bubble.current, v = veilTag.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
    if (v) { const named = live.current.closedAt !== null; v.textContent = named ? c.shadow.name : '霧 ' + Math.max(0, Math.round((s.state.veilShown as number) * 100)) + '%'; v.classList.toggle('named', named); }
  };

  /** 做一個行動：規則核心算結果，這裡把事件演出來 */
  const act = (a: Action) => {
    talk.current?.finish();
    const before = live.current, { session: next, events } = perform(c, before, a);
    const first = events[0];
    if (first?.type === 'reject') { sfx.miss(); talk.current?.say([{ who: 'sys', text: first.text }]); return; }
    sfx.tap(); buzz(8);
    live.current = next; setSession(next);
    onProgress?.(next, elapsed());
    // 這一段第一次問完，就翻到下一段；進到新的階段，就翻到那一頁
    if (a.type === 'ask' && !before.asked.includes(a.id)) {
      const g = c.questions.find((q) => q.id === a.id)!.group, to = NEXT_GROUP[g];
      if (to && c.questions.filter((q) => q.group === g).every((q) => next.asked.includes(q.id))) setTab((t) => (t === g ? to : t));
    }
    if (next.phase !== before.phase) setTab(next.phase === 2 ? 'exam' : next.phase === 3 ? 'dx' : 'plan');
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
  const inGroup = (g: QuestionGroup) => c.questions.filter((q) => q.group === g);
  const askedIn = (g: QuestionGroup) => inGroup(g).filter((q) => session.asked.includes(q.id)).length;
  const examsDone = c.exams.filter((e) => session.examined.some((k) => k.id === e.id)).length;
  const tabFull = (t: Tab) => (t === 'exam' ? session.vitalsLog.length > 0 && examsDone === c.exams.length : t === 'dx' ? session.dxAt !== null : t === 'plan' ? false : askedIn(t) === inGroup(t).length);
  const pick = (t: (typeof TABS)[number]) => {
    if (t.phase <= session.phase) { sfx.tap(); setTab(t.id); return; }
    if (t.phase === session.phase + 1 && session.phase < 3) { sfx.page(); setSheet('next'); return; }
    sfx.miss(); talk.current?.say([{ who: 'sys', text: session.phase === 3 ? '先下診斷，才會進到檢查。' : '照順序來：先把前面的做完。' }]);
  };
  const leftAsk = c.questions.length - session.asked.length, leftExam = c.exams.length - examsDone;
  const missing = [!session.board.likely && '還沒有下診斷。', c.safety.some((r) => r.type === 'call') && session.calledAt === null && '還沒有通報。', session.dxAt !== null && !session.ordered.length && '還沒有提出任何檢查。',
    !session.report && '還沒有向值班醫師回報。', !session.explained && '還沒有向' + who + '說明。', leftAsk > 0 && '問診還有 ' + leftAsk + ' 題沒問。', leftExam > 0 && '身體評估還有 ' + leftExam + ' 項沒做。'].filter(Boolean) as string[];
  const nextLines = session.phase === 1
    ? [...(['open', 'cc', 'hx', 'ros'] as const).map((g) => GROUP_NAME[g] + '：問了 ' + askedIn(g) + '／' + inGroup(g).length), '進到評估之後，想到還可以回來補問。']
    : ['生命徵象：' + (session.vitalsLog.length ? '量過了' : '還沒量'), '身體評估：做了 ' + examsDone + '／' + c.exams.length + '，其中 ' + session.examined.filter((k) => k.explained).length + ' 項動手前有先說明', '下了診斷之後，還是可以回來補做。'];
  const likely = formOf(c, session.board.likely);
  const reading = session.pending[0] ? clueOf(c, session.pending[0]) : null;

  return (
    <div className="screen ward">
      <div className="left">
        <Stage kind="ward" patient={c.patient.look} scene={c.scene} shadow={c.shadow.look} hero={hero} stage={stage} onFrame={onFrame} label={(c.scene === 'dock' ? '碼頭的貨棧：' : '霧脈公會的病室：') + who + '坐在床上，你站在床尾，岑禾拿著紀錄板站在旁邊，房間中間飄著被霧裹住的症影，底下掛著四盞燈'}>
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
              {session.tier === 0 ? (
                <>
                  <p>這條線索，讓哪一個診斷{reading.tell!.dir > 0 ? <em className="up">更像</em> : <em className="down">比較不像</em>}？</p>
                  <Forms c={c} onPick={(form) => act({ type: 'read', clue: reading.id, form })} />
                </>
              ) : dir === null ? (
                <>
                  <p>這條線索，是讓某一個診斷更像，還是比較不像？</p>
                  <div className="forms dirs">
                    <button type="button" className="form" onClick={() => { sfx.tap(); setDir(1); }}><em className="up">更像</em>支持它</button>
                    <button type="button" className="form" onClick={() => { sfx.tap(); setDir(-1); }}><em className="down">比較不像</em>排除它</button>
                  </div>
                </>
              ) : (
                <>
                  <p>讓哪一個診斷{dir > 0 ? <em className="up">更像</em> : <em className="down">比較不像</em>}？<button type="button" className="redo" onClick={() => setDir(null)}>改方向</button></p>
                  <Forms c={c} onPick={(form) => { setDir(null); act({ type: 'read', clue: reading.id, form, dir }); }} />
                </>
              )}
            </div>
          ) : session.needCommit ? (
            <div className="ask-read">
              <p><b>岑禾在等你回答。</b></p>
              <p>到目前為止，你最擔心哪一個？</p>
              <Forms c={c} onPick={(form) => act({ type: 'commit', form })} />
            </div>
          ) : (
            <div className="sub">
              <div className="flow" role="tablist" aria-label="這一場的順序">
                {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className={(t.id === tab ? 'on' : '') + (t.phase > session.phase ? ' locked' : '') + (tabFull(t.id) ? ' full' : '')} onClick={() => pick(t)}>{t.name}</button>)}
              </div>
              {tab === 'dx' ? (
                <div className="dx">
                  <p>{likely ? <>你的診斷：<b>{likely.name}</b>。想法變了可以修改。</> : '把線索排一排：一句話說出問題，最可能的是哪一個，還要排除哪幾個。'}</p>
                  <button type="button" className={'act demo' + (likely ? '' : ' hint')} onClick={() => { sfx.page(); setSheet('board'); }}>{likely ? '修改診斷' : '下診斷'}</button>
                </div>
              ) : (
                <div className="opts" key={tab}>
                  {tab === 'exam' ? <>
                    <button type="button" className={'toggle wide' + (explainOn ? ' on' : '')} aria-pressed={explainOn} onClick={() => { sfx.tap(); setExplainOn(!explainOn); }}>{explainOn ? '☑' : '☐'} 動手前先說明</button>
                    <Opt done={session.vitalsLog.length > 0} onClick={() => act({ type: 'vitals' })}><small>先做</small>量生命徵象</Opt>
                    {c.exams.map((e) => <Opt key={e.id} done={session.examined.some((k) => k.id === e.id)} onClick={() => act({ type: 'exam', id: e.id, explain: explainOn })}><small>{e.part}</small>{e.label}</Opt>)}
                    {session.phase === 2 && <Opt cls={'next' + (tabFull('exam') ? ' hint' : '')} onClick={() => { sfx.page(); setSheet('next'); }}>評估完了，去診斷 ›</Opt>}
                  </> : tab === 'plan' ? <>
                    {c.tests.map((t) => {
                      const ready = testReady(session, t.id), waiting = ordered(t.id) && !ready;
                      return <Opt key={t.id} done={ready || (waiting && t.delay === undefined)} wait={waiting && t.delay !== undefined} onClick={() => (ready ? talk.current?.say([{ who: 'sys', text: t.label + '：' + t.result }]) : act({ type: 'test', id: t.id }))}>{t.label}</Opt>;
                    })}
                    <Opt done={!!session.report} onClick={() => (session.report ? act({ type: 'report', a: '', r: [] }) : (sfx.page(), setSheet('report')))}>向醫師回報</Opt>
                    <Opt onClick={() => act({ type: 'vitals' })}>重測生命徵象</Opt>
                    <Opt onClick={() => act({ type: 'watch' })}>陪著觀察 30 秒</Opt>
                    <Opt done={!!session.explained} onClick={() => (session.explained ? act({ type: 'explain', ids: [] }) : (sfx.page(), setSheet('explain')))}>向{who}說明</Opt>
                    <Opt cls="urgent" onClick={() => { sfx.page(); setSheet('confirm'); }}>提交摘要，結案</Opt>
                  </> : <>
                    {inGroup(tab).map((q, i) => <Opt key={q.id} cls={session.log.length === 0 && i === 0 ? 'hint' : ''} done={session.asked.includes(q.id)} onClick={() => act({ type: 'ask', id: q.id })}>{q.label}</Opt>)}
                    {tab === 'ros' && session.phase === 1 && <Opt cls={'next' + (tabFull('ros') ? ' hint' : '')} onClick={() => { sfx.page(); setSheet('next'); }}>問完了，去評估 ›</Opt>}
                  </>}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setSheet('clues'); }}>線索 {session.clues.length}</button>
          {!closed && !reading && !session.needCommit && <button type="button" aria-label={session.tier >= 1 ? '問岑禾，這一張委託還可以問 ' + Math.max(0, HINT_LIMIT - session.hints) + ' 次' : undefined} onClick={() => act({ type: 'hint' })}>問岑禾{session.tier >= 1 ? ' ×' + Math.max(0, HINT_LIMIT - session.hints) : ''}</button>}
          {!closed && !reading && !session.needCommit && <button type="button" className={session.bell ? 'rung' : ''} onClick={() => (session.bell ? act({ type: 'call' }) : (sfx.page(), setSheet('bell')))}>{session.bell ? '鐘已響' : '值班鐘'}</button>}
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
        </div>
      </div>

      {sheet === 'board' && <BoardSheet c={c} s={session} onClose={() => setSheet(null)} onSave={(board) => { setSheet(null); act({ type: 'board', board }); }} />}
      {sheet === 'report' && <ReportSheet c={c} s={session} onClose={() => setSheet(null)} onSend={(a, r) => { setSheet(null); act({ type: 'report', a, r }); }} />}
      {sheet === 'explain' && <ExplainSheet c={c} s={session} onClose={() => setSheet(null)} onSend={(ids) => { setSheet(null); act({ type: 'explain', ids }); }} />}
      {sheet === 'clues' && <CluesSheet c={c} s={session} onClose={() => setSheet(null)} />}
      {sheet === 'confirm' && <ConfirmSheet title="要結案了嗎？" yes="結案" no="回去補" onNo={() => setSheet(null)} onYes={() => { setSheet(null); act({ type: 'close' }); }}
        lines={missing.length ? ['岑禾：「提交之前再看一眼。」', ...missing, '結案之後就不能再補了。'] : ['岑禾：「該做的都做了。」', '提交之後會進到這一關的回顧。']} />}
      {sheet === 'next' && <ConfirmSheet title={session.phase === 1 ? '問診問完了嗎？' : '評估做完了嗎？'} yes={session.phase === 1 ? '開始評估' : '去下診斷'} no="再補一下" onNo={() => setSheet(null)} onYes={() => { setSheet(null); act({ type: 'advance' }); }} lines={nextLines} />}
      {sheet === 'bell' && <ConfirmSheet title="要敲值班鐘嗎？" yes="敲鐘" no="先不要" onNo={() => setSheet(null)} onYes={() => { setSheet(null); act({ type: 'call' }); }} lines={['值班鐘是留給等不了的病人。', '敲了，沈渡醫師會放下手邊的事趕過來。病人等不了的時候，隨時都可以敲，不用等到問完。']} />}
      {sheet === 'quit' && <ConfirmSheet title="要先回公會嗎？" yes="回公會" no="留下" onNo={() => setSheet(null)} onYes={onQuit} lines={['做到這裡的都會留著，回到公會可以接著做。', '不想接了，在委託板上可以把這一張放掉。']} />}
    </div>
  );
}
