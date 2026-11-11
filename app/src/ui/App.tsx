import { useState } from 'react';
import type { Session } from '../core/types.ts';
import { scoreSession } from '../core/scoring.ts';
import { C01A } from '../data/c01a.ts';
import { Hall } from './Hall.tsx';
import { Ward } from './Ward.tsx';
import { Debrief } from './Debrief.tsx';
import { load, store, type Save } from './store.ts';

type Screen = { name: 'hall' } | { name: 'ward'; n: number } | { name: 'debrief'; session: Session };

export function App() {
  const c = C01A;   // 互動原型只有這一張委託
  const [save, setSave] = useState<Save>(load);
  const [screen, setScreen] = useState<Screen>({ name: 'hall' });
  const keep = (s: Save) => { setSave(s); store(s); };

  if (screen.name === 'ward') return <Ward key={screen.n} c={c} takeaway={save.takeaway} onQuit={() => setScreen({ name: 'hall' })} onDone={(session) => setScreen({ name: 'debrief', session })} />;
  if (screen.name === 'debrief') {
    return <Debrief c={c} session={screen.session} onFinish={(score, takeaway) => {
      const old = save.results[c.id], safety = scoreSession(c, screen.session).safety;
      const better = !old || score > old.best;
      keep({ ...save, takeaway: takeaway ?? save.takeaway, results: { ...save.results, [c.id]: { best: better ? score : old.best, safety: better ? safety : old.safety, plays: (old?.plays ?? 0) + 1 } } });
      setScreen({ name: 'hall' });
    }} />;
  }
  return <Hall c={c} save={save} onIntroSeen={() => keep({ ...save, introSeen: true })} onStart={() => setScreen({ name: 'ward', n: Date.now() })} />;
}
