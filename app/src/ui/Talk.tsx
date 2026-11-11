// 對話框：一個字一個字寫出來。點一下可以直接看完。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { sfx, still } from './sound.ts';

export type Who = 'you' | 'patient' | 'mentor' | 'doctor' | 'mo' | 'sys';
export interface Line { who: Who; text: string; bad?: boolean }
export interface TalkHandle { say(lines: Line[], done?: () => void): void; finish(): void; busy(): boolean }

const NAMES: Partial<Record<Who, string>> = { patient: '林秋', mentor: '岑禾', doctor: '沈渡', mo: '眠墨' };

interface Props { onSpeaker(who: Who | null): void; onTap?: () => void; more?: boolean }

export const Talk = forwardRef<TalkHandle, Props>(function Talk({ onSpeaker, onTap, more }, ref) {
  const st = useRef({ lines: [] as Line[], li: 0, ci: 0, over: true, done: undefined as undefined | (() => void), timer: 0 });
  const [, bump] = useState(0);
  const box = useRef<HTMLDivElement>(null), speak = useRef(onSpeaker);
  speak.current = onSpeaker;

  const finish = () => {
    const s = st.current;
    if (s.over) return;
    s.over = true; window.clearTimeout(s.timer); s.li = s.lines.length; speak.current(null); bump((n) => n + 1);
    const d = s.done; s.done = undefined; d?.();
  };
  const step = () => {
    const s = st.current;
    if (s.over) return;
    if (s.li >= s.lines.length) return finish();
    const ln = s.lines[s.li];
    speak.current(ln.who);
    s.ci += 1;
    if (s.ci % 2 === 0) sfx.type();
    if (s.ci >= ln.text.length) { s.li += 1; s.ci = 0; }
    bump((n) => n + 1);
    s.timer = window.setTimeout(step, 24);
  };
  useImperativeHandle(ref, () => ({
    say(lines, done) {
      finish();
      st.current = { lines, li: 0, ci: 0, over: false, done, timer: 0 };
      if (still() || !lines.length) finish(); else step();
    },
    finish,
    busy: () => !st.current.over,
  }));
  useEffect(() => () => window.clearTimeout(st.current.timer), []);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; });

  const s = st.current;
  return (
    <div className="paper talk" ref={box} aria-live="polite" onClick={() => { if (!s.over) finish(); else onTap?.(); }}>
      {s.lines.map((ln, i) => {
        if (i > s.li) return null;
        const text = i < s.li ? ln.text : ln.text.slice(0, s.ci), name = NAMES[ln.who];
        const tail = s.over && more && i === s.lines.length - 1 ? <span className="more" aria-hidden="true"> ▾</span> : null;
        if (ln.who === 'you') return <p key={i} className="you">你：{text}{tail}</p>;
        if (ln.who === 'sys') return <p key={i} className={'sys' + (ln.bad ? ' bad' : '')}>{text}{tail}</p>;
        return <p key={i}><b className="name">{name}</b>「{text}{i < s.li ? '」' : ''}{tail}</p>;
      })}
    </div>
  );
});
