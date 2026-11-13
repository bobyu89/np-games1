// 終章的前半「值班夜」：三輪分流。每一輪兩個決定：先看誰；另一位怎麼交代（或是回頭之後先做什麼）。
// 沒有分數，不寫圖鑑；每個決定當下就有回饋，走完有一頁整理。題目在 data/night.ts。
import { useEffect, useRef, useState } from 'react';
import { NIGHT, NIGHT_REFS, NIGHT_TOTAL } from '../data/night.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type Line, type TalkHandle, type Who } from './Talk.tsx';
import { Portrait } from './Portrait.tsx';
import { ConfirmSheet } from './Sheets.tsx';
import { sfx, buzz } from './sound.ts';

/** intro 旁白 → first 先看誰 → noted 岑禾的回饋 → then 一句話 → after 這一輪的結果 → end 整理 */
type Phase = 'intro' | 'first' | 'noted' | 'then' | 'after' | 'end';
interface Mark { round: string; first: boolean; then: boolean; said: string }

export function Night({ hero, onDone, onQuit }: { hero: string | null; onDone(right: number): void; onQuit(): void }) {
  const [r, setR] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [quit, setQuit] = useState(false);
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null), speaker = useRef<Who | null>(null), bubble = useRef<HTMLDivElement>(null);
  const round = NIGHT[r], mark = marks[r];
  const right = marks.reduce((n, m) => n + (m.first ? 1 : 0) + (m.then ? 1 : 0), 0);

  useEffect(() => {
    if (phase === 'intro') talk.current?.say(round.intro as Line[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, phase === 'intro']);

  const onFrame = (s: StageHandle) => {
    const who = speaker.current, key = who === 'mentor' ? 'cen' : who === 'doctor' ? 'shen' : null;
    s.state.talker = key; s.state.glow = 0;
    s.state.fx = 'dusk dark fog' + (phase === 'after' || who === 'doctor' ? ' shen' : '');   // 夜裡，燈塔的燈熄著，霧漫進大廳；鐘響了沈渡才走進來
    const at = key ? s.anchor(key) : null, b = bubble.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
  };
  const go = (next: Phase, lines: Line[]) => { setPhase(next); talk.current?.say(lines); };
  const skipTalk = () => { if (talk.current?.busy()) { talk.current.finish(); return true; } return false; };

  const pickFirst = (id: string) => {
    const ok = id === round.first, who = round.arrivals.find((a) => a.id === id)!;
    if (ok) { sfx.key(); buzz(20); } else sfx.miss();
    setMarks((m) => [...m.slice(0, r), { round: round.id, first: ok, then: false, said: '' }]);
    go('noted', [{ who: 'you', text: '先看' + who.name + '。' }, { who: 'mentor', text: round.notes[id], bad: !ok }]);
  };
  const pickThen = (id: string) => {
    const p = round.then.picks.find((k) => k.id === id)!;
    if (p.ok) { sfx.key(); buzz(20); } else sfx.miss();
    setMarks((m) => m.map((k, i) => (i === r ? { ...k, then: p.ok, said: p.text } : k)));
    go('after', [{ who: 'you', text: p.text }, { who: 'sys', text: (p.ok ? '這一句可以。' : '這一句不夠。') + p.note, bad: !p.ok }, ...(round.after as Line[])]);
  };
  const next = () => {
    if (skipTalk()) return;
    sfx.page();
    if (phase === 'intro') go('first', [{ who: 'sys', text: round.ask }]);
    else if (phase === 'noted') go('then', [{ who: 'sys', text: round.then.ask }]);
    else if (phase === 'after') { if (r + 1 < NIGHT.length) { setR(r + 1); setPhase('intro'); } else { sfx.done(); go('end', [{ who: 'mentor', text: '門口空了。這一夜的六個決定，你回頭看一遍。' }]); } }
  };

  return (
    <div className="screen hall night">
      <div className="left">
        <div className="top"><span className="who"><button type="button" className="home" onClick={() => { sfx.page(); if (phase === 'end') onDone(right); else setQuit(true); }}>‹ 公會</button>值班夜</span><span className="clock">{phase === 'end' ? '走完了' : round.title}</span></div>
        <Stage kind="hall" hero={hero} stage={stage} onFrame={onFrame} label="夜裡的公會大廳：窗外的燈塔沒有亮，霧貼著窗。岑禾站在委託板旁邊，眠墨在櫃台後面">
          <div className="bubble" ref={bubble} hidden>…</div>
          <div className="chapter">終章　大霧值班夜</div>
        </Stage>
      </div>
      <div className="right">
        <Talk ref={talk} onSpeaker={(w) => { speaker.current = w; }} onTap={() => { if (phase === 'intro' || phase === 'noted' || phase === 'after') next(); }} more={phase === 'intro' || phase === 'noted' || phase === 'after'} />
        <div className="panel">
          {phase === 'first' ? (
            <div className="quests">
              {round.arrivals.map((a) => (
                <div key={a.id} className="card arrival">
                  <Portrait shot={{ kind: 'ward', patient: a.look, view: { w: 104, h: 104, cx: 92, cy: 170 } }} label={a.name} />
                  <div>
                    <b>{a.name}</b><span>{a.tag}</span>
                    <p className="says">{a.says}</p>
                    <p><i>你看到的：</i>{a.see}</p>
                    <button type="button" className="pick" onClick={() => pickFirst(a.id)}>先看這一位</button>
                  </div>
                </div>
              ))}
            </div>
          ) : phase === 'then' ? (
            <div className="quests">
              <div className="stack">{round.then.picks.map((p) => <button key={p.id} type="button" className="pick" onClick={() => pickThen(p.id)}>{p.text}</button>)}</div>
            </div>
          ) : phase === 'end' ? (
            <div className="quests recap">
              <p className="tally">六個決定，你做對了 <b>{right}</b> 個。</p>
              {NIGHT.map((n, i) => (
                <div key={n.id} className="leaf">
                  <b>{n.title}</b>
                  <p className={marks[i]?.first ? 'up' : 'down'}>{marks[i]?.first ? '✓' : '✗'} 先看：{n.arrivals.find((a) => a.id === n.first)!.name}。{n.notes[n.first].replace(/^對。/, '')}</p>
                  <p className={marks[i]?.then ? 'up' : 'down'}>{marks[i]?.then ? '✓' : '✗'} {n.then.ask.replace(/[？。]$/, '')}：「{n.then.picks.find((p) => p.ok)!.text}」</p>
                  {n.teach.map((t) => <p key={t.text} className="dim">{t.text}<sup>{NIGHT_REFS.findIndex((x) => x.id === t.ref) + 1}</sup></p>)}
                </div>
              ))}
              <p className="dim">情境和數字是設計出來的，還沒有經過臨床老師審查。文獻：</p>
              <ol className="refs">{NIGHT_REFS.map((x) => <li key={x.id}>{x.text} <a href={'https://doi.org/' + x.doi} target="_blank" rel="noreferrer">https://doi.org/{x.doi}</a></li>)}</ol>
              <button type="button" className="act demo" onClick={() => onDone(right)}>回公會</button>
            </div>
          ) : (
            <div className="acts one">
              <button type="button" className="act demo" onClick={next}>{phase === 'intro' ? '看門口' : phase === 'noted' ? '繼續' : r + 1 < NIGHT.length ? '下一輪' : '這一夜的整理'}</button>
              {mark && phase !== 'intro' && <p className="dim tally">這一夜到目前：{right}／{NIGHT_TOTAL}</p>}
            </div>
          )}
        </div>
      </div>
      {quit && <ConfirmSheet title="要先回公會嗎？" yes="回公會" no="留下" onNo={() => setQuit(false)} onYes={onQuit} lines={['值班夜沒有走完的話，下次要從第一輪開始。', '走完之後，燈塔那一張委託才會貼上板子。']} />}
    </div>
  );
}
