// 公會大廳：開場的故事、委託板、圖鑑。
import { useEffect, useRef, useState } from 'react';
import type { CaseDef } from '../core/types.ts';
import { SAFETY_LABEL } from '../core/scoring.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type Line, type TalkHandle, type Who } from './Talk.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx, sound } from './sound.ts';
import type { Save } from './store.ts';

// 序章「遺失的一頁」：一次一句，點一下往下
const INTRO: Line[] = [
  { who: 'sys', text: '霧港。霧脈公會的大廳。' },
  { who: 'mo', text: '檔案室淹水了。圖鑑只救回症影的外形，名字和解法都糊掉了。' },
  { who: 'mentor', text: '所以從今天起，每一張委託都要重新看。你來得正好，見習生。' },
  { who: 'mentor', text: '症影只告訴你「哪裡不舒服」，不告訴你「為什麼」。為什麼，要你自己問出來。' },
  { who: 'mentor', text: '板子上那張蓋了紅蠟的，是剛送來的。去看看吧。' },
];

interface Props { c: CaseDef; save: Save; onIntroSeen(): void; onStart(): void }

export function Hall({ c, save, onIntroSeen, onStart }: Props) {
  const [step, setStep] = useState(save.introSeen ? INTRO.length : 0);
  const [sheet, setSheet] = useState<null | 'reading' | 'codex'>(null);
  const [soundOn, setSoundOn] = useState(sound.on);
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null), speaker = useRef<Who | null>(null), bubble = useRef<HTMLDivElement>(null);
  const intro = step < INTRO.length, res = save.results[c.id];

  useEffect(() => {
    if (step < INTRO.length) talk.current?.say([INTRO[step]]);
    else talk.current?.say([{ who: 'mentor', text: save.takeaway ? '你上次說，下次要做到：' + save.takeaway : res ? '板子上還有委託。想再走一次也可以。' : '委託板上有一張新的。準備好了就接。' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    if (!intro) return;
    sfx.page();
    if (step + 1 >= INTRO.length) onIntroSeen();
    setStep(step + 1);
  };
  const onFrame = (s: StageHandle) => {
    const who = speaker.current, key = who === 'mentor' ? 'cen' : who === 'mo' ? 'mo' : null;
    s.state.talker = key; s.state.glow = intro && step < INTRO.length - 1 ? 0 : 1;
    const at = key ? s.anchor(key) : null, b = bubble.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
  };

  return (
    <div className="screen hall">
      <div className="left">
        <div className="top"><span className="who">霧脈公會</span><span className="clock">見習專科護理師</span></div>
        <Stage kind="hall" stage={stage} onFrame={onFrame} label="霧脈公會的大廳：牆上是委託板，眠墨坐在櫃台後面寫字，岑禾站在委託板旁邊，窗外是霧港和燈塔">
          <div className="bubble" ref={bubble} hidden>…</div>
        </Stage>
      </div>
      <div className="right">
        <Talk ref={talk} onSpeaker={(w) => { speaker.current = w; }} onTap={next} more={intro} />
        <div className="panel">
          {intro ? (
            <div className="acts one">
              <button type="button" className="act demo" onClick={() => (talk.current?.busy() ? talk.current.finish() : next())}>{step + 1 >= INTRO.length ? '去看委託板' : '繼續'}</button>
              <button type="button" className="skip" onClick={() => { onIntroSeen(); setStep(INTRO.length); }}>跳過開場</button>
            </div>
          ) : (
            <div className="quests">
              <button type="button" className={'quest paper' + (res ? '' : ' hint')} onClick={() => { sfx.page(); setSheet('reading'); }}>
                <i className="seal" aria-hidden="true" />
                <b>{c.title}</b>
                <span>{c.patient.name}｜{c.complaint}</span>
                <em>{res ? '最佳 ' + res.best + ' 分・' + SAFETY_LABEL[res.safety] + '・走過 ' + res.plays + ' 次' : '新的委託'}</em>
              </button>
              <div className="quest paper locked" aria-disabled="true"><b>同一張面孔</b><span>另一位胸痛的病人</span><em>還沒開放</em></div>
              <div className="quest paper locked" aria-disabled="true"><b>資格試煉</b><span>抽一個沒練過的主訴，15 分鐘</span><em>還沒開放</em></div>
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setSheet('codex'); }}>圖鑑</button>
          {!intro && <button type="button" onClick={() => setStep(0)}>重看開場</button>}
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
        </div>
      </div>

      {sheet === 'reading' && (
        <Sheet title={'委託：' + c.title} onClose={() => setSheet(null)} footer={<button type="button" className="act demo" onClick={onStart}>接下委託，進病室</button>}>
          {c.reading.lines.map((l, i) => <p key={i}>{l}</p>)}
          <h3>進門之前，先想三件事</h3>
          <ul>{c.reading.prompts.map((p, i) => <li key={i}>{p}</li>)}</ul>
          <h3>這張委託怎麼進行</h3>
          <ul>
            <li>時間只在你做行動的時候走。看字、想事情、排推理板都不扣時間。</li>
            <li>急的事隨時可以做，不用等問完。</li>
            <li>卡住的時候可以問岑禾。</li>
          </ul>
          <p className="dim">{c.review.note}</p>
        </Sheet>
      )}
      {sheet === 'codex' && (
        <Sheet title="症影圖鑑" onClose={() => setSheet(null)}>
          {res ? (
            <>
              <h3>{c.shadow.name}</h3>
              <p>{c.shadow.lore}</p>
              <p className="quote">遇過的病人：{c.patient.name}（{c.patient.job}）。最佳 {res.best} 分，安全行動「{SAFETY_LABEL[res.safety]}」。</p>
              {save.takeaway && <p className="quote">你寫下的：{save.takeaway}</p>}
            </>
          ) : <p className="dim">圖鑑是空的。完成第一張委託，才會有第一筆紀錄。</p>}
        </Sheet>
      )}
    </div>
  );
}
