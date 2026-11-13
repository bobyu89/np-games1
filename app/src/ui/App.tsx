import { useEffect, useRef, useState } from 'react';
import type { CaseDef, Session } from '../core/types.ts';
import { harvest, scoreSession } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import { Hall } from './Hall.tsx';
import { Title } from './Title.tsx';
import { Ward } from './Ward.tsx';
import { Debrief } from './Debrief.tsx';
import { Night } from './Night.tsx';
import { load, loadRun, store, storeRun, wipe, type Run, type Save } from './store.ts';
import { validRun } from './backup.ts';
import { keepStorage } from './pwa.ts';
import { NIGHT_DONE, TRIAL_SECONDS, newReads, record, recordTrial, tierOf } from './progress.ts';
import { track, trackOpen } from './stats.ts';
import { StatsPage } from './StatsPage.tsx';
import { bindSave, startAccount, syncSoon } from './account.ts';
import { PrivacyPage } from './PrivacyPage.tsx';

type Screen = { name: 'title' } | { name: 'hall' } | { name: 'night' } | { name: 'ward'; c: CaseDef; n: number; tier: 0 | 1; resume: Run | null; trial: boolean } | { name: 'debrief'; c: CaseDef; session: Session; seconds: number; trial: boolean; timeUp: boolean };

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
  // 網址後面加 #stats 是給管理者看的總表
  const [admin, setAdmin] = useState(() => location.hash === '#stats');
  // 網址後面加 #privacy 是隱私說明
  const [privacy, setPrivacy] = useState(() => location.hash === '#privacy');
  useEffect(() => {
    // 同步併回來的進度：換上、存好，但不用再觸發一次同步
    bindSave(() => latest.current, (s) => { latest.current = s; setSave(s); store(s); });
    void startAccount();
    trackOpen();
    const onHash = () => { setAdmin(location.hash === '#stats'); setPrivacy(location.hash === '#privacy'); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (privacy) return <PrivacyPage onClose={() => { history.replaceState(null, '', location.pathname + location.search); setPrivacy(false); }} />;
  if (admin) return <StatsPage onClose={() => { history.replaceState(null, '', location.pathname + location.search); setAdmin(false); }} />;

  if (screen.name === 'ward') {
    const { c, trial } = screen;
    return <Ward key={screen.n} c={c} tier={screen.tier} hero={save.hero} takeaway={save.takeaways[0] ?? null} resume={screen.resume} trial={trial} coach={!trial && Object.keys(save.cases).length === 0}
      onProgress={(session, seconds) => keepRun({ v: 1, caseId: c.id, session, seconds, at: Date.now(), ...(trial ? { trial: true } : {}) })}
      onQuit={() => { if (!trial && run?.caseId === c.id) track({ t: 'leave', c: c.id, tier: run.session.tier, ph: run.session.phase, gt: run.session.time, h: run.session.hints }); toHall(); }}
      onDone={(session, seconds, timeUp) => setScreen({ name: 'debrief', c, session, seconds, trial, timeUp })} />;
  }
  if (screen.name === 'debrief') {
    const { c, session, seconds, trial, timeUp } = screen;
    return <Debrief c={c} session={session} seconds={seconds} trial={trial ? { timeUp } : undefined} fresh={trial ? [] : newReads(save, c, session)} onFinish={(takeaway) => {
      const score = scoreSession(c, session);
      if (trial) {
        // 資格試煉：不寫圖鑑、不算完成委託，只留一筆成績
        track({ t: 'trial', c: c.id, sc: Math.round(score.total), sf: score.safety, sec: seconds, gt: session.time, f: harvest(c, session).found ? 1 : 0, n: save.trials.length + 1 });
        const next = recordTrial(save, c, session, score, seconds, timeUp, Date.now());
        keep({ ...next, takeaways: takeaway ? [takeaway, ...next.takeaways.filter((t) => t !== takeaway)].slice(0, 5) : next.takeaways });
      } else {
        track({ t: 'done', c: c.id, tier: session.tier, ph: session.phase, sc: Math.round(score.total), sf: score.safety, sec: seconds, gt: session.time, h: session.hints, f: harvest(c, session).found ? 1 : 0, n: (save.cases[c.id]?.plays ?? 0) + 1 });
        keep(record(save, c, session, score, seconds, takeaway));
      }
      keepRun(null); keepStorage();
      toHall();
    }} />;
  }
  // 終章的值班夜：走完記一筆（和看過的故事記在一起），回到公會接下一段故事
  if (screen.name === 'night') return <Night hero={save.hero} onQuit={toHall} onDone={() => { if (!save.beats.includes(NIGHT_DONE)) keep({ ...save, beats: [...save.beats, NIGHT_DONE] }); keepStorage(); toHall(); }} />;
  if (screen.name === 'title') return <Title save={save} run={run} onPlay={toHall} onImport={(s) => { keepRun(null); keep(s); }} onReset={() => { setRun(null); latest.current = wipe(); setSave(latest.current); }} />;
  return <Hall save={save} run={run} onHome={() => setScreen({ name: 'title' })} onHero={(hero) => keep({ ...save, hero })} onBeatSeen={(id) => keep({ ...save, beats: save.beats.includes(id) ? save.beats : [...save.beats, id] })}
    onStart={(c) => { keepRun(null); track({ t: 'start', c: c.id, tier: tierOf(save), n: (save.cases[c.id]?.plays ?? 0) + 1 }); setScreen({ name: 'ward', c, n: Date.now(), tier: tierOf(save), resume: null, trial: false }); }}
    onNight={() => setScreen({ name: 'night' })}
    onTrial={(c) => { keepRun(null); setScreen({ name: 'ward', c, n: Date.now(), tier: 1, resume: null, trial: true }); }}
    onResume={() => {
      const c = run && caseOf(run.caseId);
      if (!run || !c) return;
      // 已經結案、只差回顧沒看完的，直接回到回顧
      const trial = !!run.trial;
      setScreen(run.session.closedAt !== null ? { name: 'debrief', c, session: run.session, seconds: run.seconds, trial, timeUp: trial && run.seconds >= TRIAL_SECONDS } : { name: 'ward', c, n: Date.now(), tier: run.session.tier, resume: run, trial });
    }}
    onDropRun={() => { if (run && !run.trial) track({ t: 'drop', c: run.caseId, tier: run.session.tier, ph: run.session.phase, gt: run.session.time, h: run.session.hints }); keepRun(null); }}
    onImport={(s) => { keepRun(null); keep(s); }}
    onReset={() => { setRun(null); latest.current = wipe(); setSave(latest.current); }} />;
}
