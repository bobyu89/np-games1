import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { TIDES, TIDE_DONE } from '../data/tides.ts';
import type { CaseDef, Session } from '../core/types.ts';
import { harvest, scoreSession } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import { Hall } from './Hall.tsx';
import { Title } from './Title.tsx';
import { Ward } from './Ward.tsx';
import { Debrief } from './Debrief.tsx';

import { load, loadRun, store, storeRun, wipe, type Run, type Save } from './store.ts';
import { validRun } from './backup.ts';
import { withNote } from './diary.ts';
import { keepStorage } from './pwa.ts';
import { AFTER, echoed, eldersFor, finaleDone, NIGHT_DONE, TRIAL_SECONDS, newReads, record, recordTrial, tierOf } from './progress.ts';
import { track, trackOpen, type StatEvent } from './stats.ts';
import { perilOf } from '../core/perils.ts';
import { reviewDue } from './review.ts';
import { dayKey } from './streak.ts';
import { formsWritten, matchWritten } from './freetext.ts';
import { weakness } from './sprint.ts';
import { gained } from './feats.ts';
import { TrialBrief } from './Hall.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx } from './sound.ts';

import { bindSave, startAccount, syncSoon } from './account.ts';



// 少數時候才用到的頁面，用到才下載：第一次打開遊戲不用等它們
const Night = lazy(() => import('./Night.tsx').then((m) => ({ default: m.Night })));
const StatsPage = lazy(() => import('./StatsPage.tsx').then((m) => ({ default: m.StatsPage })));
const PrivacyPage = lazy(() => import('./PrivacyPage.tsx').then((m) => ({ default: m.PrivacyPage })));
const NotesPage = lazy(() => import('./NotesPage.tsx').then((m) => ({ default: m.NotesPage })));
const Wait = ({ children }: { children: ReactNode }) => <Suspense fallback={<div className="screen loading"><p className="paper">載入中……</p></div>}>{children}</Suspense>;

type Screen = { name: 'title' } | { name: 'hall' } | { name: 'night' } | { name: 'tide'; n: number } | { name: 'ward'; c: CaseDef; n: number; tier: 0 | 1; resume: Run | null; trial: boolean } | { name: 'debrief'; c: CaseDef; session: Session; seconds: number; trial: boolean; timeUp: boolean; recorded?: boolean } | { name: 'relay'; c: CaseDef };
/** 連戰：一站考完就記下成績、直接進下一站；全部考完再一站一站看回顧 */
interface Played { c: CaseDef; session: Session; seconds: number; timeUp: boolean; recorded: boolean }

const caseOf = (id: string) => CASES.find((c) => c.id === id);
/** 上次沒結案的那一場。病例改過、對不上了就丟掉 */
function pendingRun(): Run | null {
  const r = loadRun();
  if (validRun(r ? caseOf(r.caseId) : undefined, r)) return r;
  if (r) storeRun(null);
  return null;
}

export function App() {
  const [save, setSave] = useState<Save>(load);
  const [run, setRun] = useState<Run | null>(pendingRun);
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  // 進度每變一次：存在這台裝置上；有登入的話，過幾秒同步到雲端
  const latest = useRef(save);
  const keep = (s: Save) => { latest.current = s; setSave(s); store(s); syncSoon(); };
  const keepRun = (r: Run | null) => { setRun(r); storeRun(r); };
  const toHall = () => setScreen({ name: 'hall' });
  const [relay, setRelay] = useState<{ next: CaseDef[]; done: Played[] } | null>(null);
  /** 一場結束：送統計、寫進存檔。回傳寫好的存檔（還沒存） */
  const finish = (base: Save, c: CaseDef, session: Session, seconds: number, trial: boolean, timeUp: boolean, takeaway: string | null): Save => {
    const score = scoreSession(c, session);
    // 練習有沒有在發揮作用：掉進陷阱沒有、這一場是不是錯題複習（記之前算）、自己先寫的有沒有想到正確方向。只送 0 和 1
    const peril = perilOf(c, session), written = session.board.written?.length ? formsWritten(c.forms, matchWritten(c.complaint, c.forms, session.board.written)) : null;
    const bit = (b: boolean): 0 | 1 => (b ? 1 : 0);
    const learn: Pick<StatEvent, 'tr' | 'rv' | 'w'> = { rv: bit(reviewDue(base, dayKey(Date.now())).some((r) => r.caseId === c.id)) };
    if (peril) learn.tr = bit(peril.trapped);
    if (written) learn.w = bit(written.includes(c.answer.truth));
    if (trial) {
      // 試弓：不寫圖鑑、不算完成委託，只留一筆成績
      track({ t: 'trial', c: c.id, sc: Math.round(score.total), sf: score.safety, sec: seconds, gt: session.time, f: harvest(c, session).found ? 1 : 0, n: base.trials.length + 1, ...learn });
      const next = recordTrial(base, c, session, score, seconds, timeUp, Date.now(), takeaway);
      return { ...next, takeaways: takeaway ? [takeaway, ...next.takeaways.filter((t) => t !== takeaway)].slice(0, 5) : next.takeaways };
    }
    track({ t: 'done', c: c.id, tier: session.tier, ph: session.phase, sc: Math.round(score.total), sf: score.safety, sec: seconds, gt: session.time, h: session.hints, f: harvest(c, session).found ? 1 : 0, n: (base.cases[c.id]?.plays ?? 0) + 1, ...learn });
    return record(base, c, session, score, seconds, takeaway);
  };
  /** 只算、不送統計也不存：這一場記下去之後，存檔會變成什麼樣子（回顧裡說升了星、拿到勳章） */
  const previewOf = (base: Save, c: CaseDef, session: Session, seconds: number, trial: boolean, timeUp: boolean): Save => {
    const score = scoreSession(c, session);
    return trial ? recordTrial(base, c, session, score, seconds, timeUp, Date.now()) : record(base, c, session, score, seconds, null);
  };
  /** 連戰裡一站看完回顧：還有下一站的回顧就接著看，沒有就回公會 */
  const nextReview = (rest: Played[]) => {
    const [p, ...more] = rest;
    setRelay(more.length ? { next: [], done: more } : null);
    if (p) setScreen({ name: 'debrief', c: p.c, session: p.session, seconds: p.seconds, trial: true, timeUp: p.timeUp, recorded: p.recorded });
    else toHall();
  };
  // 網址後面加 #stats 是給管理者看的總表
  const [admin, setAdmin] = useState(() => location.hash === '#stats');
  // 網址後面加 #privacy 是隱私說明
  const [privacy, setPrivacy] = useState(() => location.hash === '#privacy');
  // 網址後面加 #notes 是考前速記頁
  const [notesOn, setNotesOn] = useState(() => location.hash === '#notes');
  useEffect(() => {
    // 同步併回來的進度：換上、存好，但不用再觸發一次同步
    bindSave(() => latest.current, (s) => { latest.current = s; setSave(s); store(s); });
    void startAccount();
    trackOpen();
    const onHash = () => { setAdmin(location.hash === '#stats'); setPrivacy(location.hash === '#privacy'); setNotesOn(location.hash === '#notes'); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (notesOn) return <Wait><NotesPage onClose={() => { history.replaceState(null, '', location.pathname + location.search); setNotesOn(false); }} /></Wait>;
  if (privacy) return <Wait><PrivacyPage onClose={() => { history.replaceState(null, '', location.pathname + location.search); setPrivacy(false); }} /></Wait>;
  if (admin) return <Wait><StatsPage onClose={() => { history.replaceState(null, '', location.pathname + location.search); setAdmin(false); }} /></Wait>;

  if (screen.name === 'ward') {
    const { c, trial } = screen;
    return <Ward key={screen.n} c={c} tier={screen.tier} hero={save.hero} elders={trial ? [] : eldersFor(save)} takeaway={save.takeaways[0] ?? null} resume={screen.resume} trial={trial} doneLabel={trial && relay?.next.length ? '進下一站' : undefined} coach={!trial && Object.keys(save.cases).length === 0}
      onProgress={(session, seconds) => keepRun({ v: 1, caseId: c.id, session, seconds, at: Date.now(), ...(trial ? { trial: true } : {}) })}
      onQuit={() => { setRelay(null); if (!trial && run?.caseId === c.id) track({ t: 'leave', c: c.id, tier: run.session.tier, ph: run.session.phase, gt: run.session.time, h: run.session.hints }); toHall(); }}
      onDone={(session, seconds, timeUp) => {
        if (trial && relay) {
          if (relay.next.length) {
            // 連戰：這一站先記下成績（不看回顧），直接進下一站的閱題
            keep(finish(latest.current, c, session, seconds, true, timeUp, null)); keepRun(null);
            setRelay({ next: relay.next.slice(1), done: [...relay.done, { c, session, seconds, timeUp, recorded: true }] });
            setScreen({ name: 'relay', c: relay.next[0] }); return;
          }
          // 最後一站：從第一站的回顧開始看；最後一站的成績看完回顧才記（和一般試弓一樣）
          nextReview([...relay.done, { c, session, seconds, timeUp, recorded: false }]); return;
        }
        setScreen({ name: 'debrief', c, session, seconds, trial, timeUp });
      }} />;
  }
  if (screen.name === 'relay') {
    const { c } = screen, n = (relay?.done.length ?? 0) + 1;
    return <div className="screen relay-gap"><Sheet title={'連戰・第 ' + n + ' 站：閱題'} onClose={() => { setRelay(null); toHall(); }} footer={<button type="button" className="act demo" onClick={() => { sfx.page(); keepRun(null); setScreen({ name: 'ward', c, n: Date.now(), tier: 1, resume: null, trial: true }); }}>進場，開始倒數</button>}>
      <p className="note">上一站交卷了，成績已經記下來；回顧等全部考完再一起看。中間不休息，這一站一樣 15 分鐘。</p>
      <TrialBrief c={c} />
    </Sheet></div>;
  }
  if (screen.name === 'debrief') {
    const { c, session, seconds, trial, timeUp, recorded = false } = screen;
    const prev = save.cases[c.id], now = harvest(c, session);
    const echo = trial ? null : { got: echoed({ found: !!prev?.found || now.found, concern: !!prev?.concern || now.concern }), before: echoed(prev), text: AFTER[c.id] ?? '' };
    // 試弓交卷：把這一場也算進去，告訴玩家現在最弱的三種主訴
    const weak = trial ? weakness({ cases: save.cases, plays: [{ at: Date.now(), caseId: c.id, score: Math.round(scoreSession(c, session).total), trial: true, found: now.found, trapped: perilOf(c, session)?.trapped ?? null, takeaway: null }, ...(save.plays ?? [])] }).slice(0, 3) : undefined;
    // 這一場之後升了星的劫影、新的勳章（已經記過的連戰站不算）
    const gains = recorded ? null : gained(save, previewOf(save, c, session, seconds, trial, timeUp));
    return <Debrief key={c.id + ':' + session.time + ':' + seconds} c={c} session={session} seconds={seconds} hero={save.hero} echo={echo} weak={weak} gains={gains} relay={relay ? { left: relay.done.length } : undefined} trial={trial ? { timeUp, axes: finaleDone(save) } : undefined} fresh={trial ? [] : newReads(save, c, session)} onFinish={(takeaway) => {
      if (recorded) { nextReview(relay?.done ?? []); return; }
      keep(finish(save, c, session, seconds, trial, timeUp, takeaway));
      keepRun(null); keepStorage();
      if (relay?.done.length) { nextReview(relay.done); return; }
      setRelay(null); toHall();
    }} />;
  }
  // 終章的值班夜：走完記一筆（和看過的故事記在一起），回到公會接下一段故事
  if (screen.name === 'tide') { const n = screen.n; return <Wait><Night hero={save.hero} rounds={[TIDES[n]]} title="海神的風暴" banner={TIDES[n].title} onQuit={toHall} onDone={() => { if (!save.beats.includes(TIDE_DONE(n))) keep({ ...save, beats: [...save.beats, TIDE_DONE(n)] }); keepStorage(); toHall(); }} /></Wait>; }
  if (screen.name === 'night') return <Wait><Night hero={save.hero} onQuit={toHall} onDone={() => { if (!save.beats.includes(NIGHT_DONE)) keep({ ...save, beats: [...save.beats, NIGHT_DONE] }); keepStorage(); toHall(); }} /></Wait>;
  if (screen.name === 'title') return <Title save={save} run={run} onPlay={toHall} onImport={(s) => { keepRun(null); keep(s); }} onReset={() => { setRun(null); latest.current = wipe(); setSave(latest.current); }} />;
  return <Hall save={save} run={run} onHome={() => setScreen({ name: 'title' })} onHero={(hero) => keep({ ...save, hero })} onBeatSeen={(id) => keep({ ...save, beats: save.beats.includes(id) ? save.beats : [...save.beats, id] })}
    onStart={(c) => { keepRun(null); setRelay(null); track({ t: 'start', c: c.id, tier: tierOf(save), n: (save.cases[c.id]?.plays ?? 0) + 1 }); setScreen({ name: 'ward', c, n: Date.now(), tier: tierOf(save), resume: null, trial: false }); }}
    onNight={() => setScreen({ name: 'night' })}
    onTide={(n) => setScreen({ name: 'tide', n })}
    onTrial={(c) => { keepRun(null); setRelay(null); setScreen({ name: 'ward', c, n: Date.now(), tier: 1, resume: null, trial: true }); }}
    onRelay={(c1, c2) => { keepRun(null); setRelay({ next: [c2], done: [] }); setScreen({ name: 'ward', c: c1, n: Date.now(), tier: 1, resume: null, trial: true }); }}
    onResume={() => {
      setRelay(null);
      const c = run && caseOf(run.caseId);
      if (!run || !c) return;
      // 已經結案、只差回顧沒看完的，直接回到回顧
      const trial = !!run.trial;
      setScreen(run.session.closedAt !== null ? { name: 'debrief', c, session: run.session, seconds: run.seconds, trial, timeUp: trial && run.seconds >= TRIAL_SECONDS } : { name: 'ward', c, n: Date.now(), tier: run.session.tier, resume: run, trial });
    }}
    onDropRun={() => { if (run && !run.trial) track({ t: 'drop', c: run.caseId, tier: run.session.tier, ph: run.session.phase, gt: run.session.time, h: run.session.hints }); keepRun(null); }}
    onImport={(s) => { keepRun(null); keep(s); }}
    onNote={(day, text) => keep(withNote(latest.current, day, text))}
    onReset={() => { setRun(null); latest.current = wipe(); setSave(latest.current); }} />;
}
