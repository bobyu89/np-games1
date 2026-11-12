import { useState } from 'react';
import type { CaseDef, Session } from '../core/types.ts';
import { scoreSession } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import { Hall } from './Hall.tsx';
import { Ward } from './Ward.tsx';
import { Debrief } from './Debrief.tsx';
import { load, loadRun, store, storeRun, wipe, type Run, type Save } from './store.ts';
import { validRun } from './backup.ts';
import { keepStorage } from './pwa.ts';
import { newReads, record, tierOf } from './progress.ts';

type Screen = { name: 'hall' } | { name: 'ward'; c: CaseDef; n: number; tier: 0 | 1; resume: Run | null } | { name: 'debrief'; c: CaseDef; session: Session; seconds: number };

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
  const [screen, setScreen] = useState<Screen>({ name: 'hall' });
  const keep = (s: Save) => { setSave(s); store(s); };
  const keepRun = (r: Run | null) => { setRun(r); storeRun(r); };
  const toHall = () => setScreen({ name: 'hall' });

  if (screen.name === 'ward') {
    const { c } = screen;
    return <Ward key={screen.n} c={c} tier={screen.tier} hero={save.hero} takeaway={save.takeaways[0] ?? null} resume={screen.resume}
      onProgress={(session, seconds) => keepRun({ v: 1, caseId: c.id, session, seconds, at: Date.now() })}
      onQuit={toHall}
      onDone={(session, seconds) => setScreen({ name: 'debrief', c, session, seconds })} />;
  }
  if (screen.name === 'debrief') {
    const { c, session, seconds } = screen;
    return <Debrief c={c} session={session} seconds={seconds} fresh={newReads(save, c, session)} onFinish={(takeaway) => {
      keep(record(save, c, session, scoreSession(c, session), seconds, takeaway));
      keepRun(null); keepStorage();
      toHall();
    }} />;
  }
  return <Hall save={save} run={run} onHero={(hero) => keep({ ...save, hero })} onBeatSeen={(id) => keep({ ...save, beats: save.beats.includes(id) ? save.beats : [...save.beats, id] })}
    onStart={(c) => { keepRun(null); setScreen({ name: 'ward', c, n: Date.now(), tier: tierOf(save), resume: null }); }}
    onResume={() => {
      const c = run && caseOf(run.caseId);
      if (!run || !c) return;
      // 已經結案、只差回顧沒看完的，直接回到回顧
      setScreen(run.session.closedAt !== null ? { name: 'debrief', c, session: run.session, seconds: run.seconds } : { name: 'ward', c, n: Date.now(), tier: run.session.tier, resume: run });
    }}
    onDropRun={() => keepRun(null)}
    onImport={(s) => { keepRun(null); keep(s); }}
    onReset={() => { setRun(null); setSave(wipe()); }} />;
}
