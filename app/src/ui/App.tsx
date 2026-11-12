import { useState } from 'react';
import type { CaseDef, Session } from '../core/types.ts';
import { scoreSession } from '../core/scoring.ts';
import { Hall } from './Hall.tsx';
import { Ward } from './Ward.tsx';
import { Debrief } from './Debrief.tsx';
import { load, store, type Save } from './store.ts';
import { newReads, record } from './progress.ts';

type Screen = { name: 'hall' } | { name: 'ward'; c: CaseDef; n: number } | { name: 'debrief'; c: CaseDef; session: Session; seconds: number };

export function App() {
  const [save, setSave] = useState<Save>(load);
  const [screen, setScreen] = useState<Screen>({ name: 'hall' });
  const keep = (s: Save) => { setSave(s); store(s); };

  if (screen.name === 'ward') {
    return <Ward key={screen.n} c={screen.c} hero={save.hero} takeaway={save.takeaways[0] ?? null} onQuit={() => setScreen({ name: 'hall' })}
      onDone={(session, seconds) => setScreen({ name: 'debrief', c: screen.c, session, seconds })} />;
  }
  if (screen.name === 'debrief') {
    const { c, session, seconds } = screen;
    return <Debrief c={c} session={session} seconds={seconds} fresh={newReads(save, c, session)} onFinish={(takeaway) => {
      keep(record(save, c, session, scoreSession(c, session), seconds, takeaway));
      setScreen({ name: 'hall' });
    }} />;
  }
  return <Hall save={save} onHero={(hero) => keep({ ...save, hero })} onBeatSeen={(id) => keep({ ...save, beats: save.beats.includes(id) ? save.beats : [...save.beats, id] })} onStart={(c) => setScreen({ name: 'ward', c, n: Date.now() })} />;
}
