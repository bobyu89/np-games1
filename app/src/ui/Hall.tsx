// 公會大廳：故事的段落、委託板、圖鑑。
import { useEffect, useRef, useState } from 'react';
import type { CaseDef } from '../core/types.ts';
import { SAFETY_LABEL } from '../core/scoring.ts';
import { COMPLAINTS, caseById } from '../data/index.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type TalkHandle, type Who } from './Talk.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx, sound } from './sound.ts';
import type { Save } from './store.ts';
import { BEATS, QUESTS, codexOf, nextBeat, rankOf, unlocked, type Beat } from './progress.ts';

interface Props { save: Save; onBeatSeen(id: string): void; onStart(c: CaseDef): void }

export function Hall({ save, onBeatSeen, onStart }: Props) {
  const [beat, setBeat] = useState<Beat | null>(() => nextBeat(save) ?? null);
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState<CaseDef | null>(null);
  const [codex, setCodex] = useState(false);
  const [soundOn, setSoundOn] = useState(sound.on);
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null), speaker = useRef<Who | null>(null), bubble = useRef<HTMLDivElement>(null);
  const open = QUESTS.filter((q) => unlocked(q, save)), fresh = open.find((q) => !save.cases[q.caseId]);

  useEffect(() => {
    if (beat) { talk.current?.say([beat.lines[step]]); return; }
    const last = save.takeaways[0];
    talk.current?.say([{ who: 'mentor', text: last ? '你上次說，下次要做到：' + last : fresh ? '委託板上有一張新的。準備好了就接。' : '板子上的委託都走過了。想再走一次也可以，圖鑑還有空白。' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, step]);

  const endBeat = () => {
    if (!beat) return;
    onBeatSeen(beat.id);
    const seen = [...save.beats, beat.id], following = BEATS.find((b) => !seen.includes(b.id) && b.when(save)) ?? null;
    setBeat(following); setStep(0);
  };
  const next = () => {
    if (!beat) return;
    sfx.page();
    if (step + 1 >= beat.lines.length) endBeat(); else setStep(step + 1);
  };
  const onFrame = (s: StageHandle) => {
    const who = speaker.current, key = who === 'mentor' ? 'cen' : who === 'mo' ? 'mo' : null;
    s.state.talker = key; s.state.glow = !beat && fresh ? 1 : 0;
    const at = key ? s.anchor(key) : null, b = bubble.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
  };

  return (
    <div className="screen hall">
      <div className="left">
        <div className="top"><span className="who">霧脈公會</span><span className="clock">{rankOf(save)}</span></div>
        <Stage kind="hall" stage={stage} onFrame={onFrame} label="霧脈公會的大廳：牆上是委託板，眠墨坐在櫃台後面寫字，岑禾站在委託板旁邊，窗外是霧港和燈塔">
          <div className="bubble" ref={bubble} hidden>…</div>
          {beat && <div className="chapter">{beat.title}</div>}
        </Stage>
      </div>
      <div className="right">
        <Talk ref={talk} onSpeaker={(w) => { speaker.current = w; }} onTap={next} more={!!beat} />
        <div className="panel">
          {beat ? (
            <div className="acts one">
              <button type="button" className="act demo" onClick={() => (talk.current?.busy() ? talk.current.finish() : next())}>{step + 1 >= beat.lines.length ? '回到委託板' : '繼續'}</button>
              <button type="button" className="skip" onClick={endBeat}>跳過這一段</button>
            </div>
          ) : (
            <div className="quests">
              {QUESTS.map((q) => {
                const c = caseById(q.caseId), res = save.cases[c.id];
                if (!unlocked(q, save)) return <div key={c.id} className="quest paper locked" aria-disabled="true"><b>？？？</b><span>完成上一張委託之後才會送到</span><em>還沒出現</em></div>;
                return (
                  <button key={c.id} type="button" className={'quest paper' + (res ? '' : ' hint')} onClick={() => { sfx.page(); setReading(c); }}>
                    <i className="seal" aria-hidden="true" />
                    <b>{c.title}</b>
                    <span>{c.patient.name}｜{c.complaintName}</span>
                    <em>{res ? '最佳 ' + res.best + ' 分・' + SAFETY_LABEL[res.safety] : '新的委託'}</em>
                  </button>
                );
              })}
              <div className="quest paper locked" aria-disabled="true"><b>第二章</b><span>另一隻症影</span><em>整理中</em></div>
              <div className="quest paper locked" aria-disabled="true"><b>資格試煉</b><span>抽一個沒練過的主訴，15 分鐘</span><em>還沒開放</em></div>
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setCodex(true); }}>圖鑑{COMPLAINTS.length ? ' ' + codexOf(COMPLAINTS[0], save).percent + '%' : ''}</button>
          {!beat && <button type="button" onClick={() => { setBeat(BEATS[0]); setStep(0); }}>重看開場</button>}
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
        </div>
      </div>

      {reading && (
        <Sheet title={'委託：' + reading.title} onClose={() => setReading(null)} footer={<button type="button" className="act demo" onClick={() => onStart(reading)}>接下委託，進病室</button>}>
          {reading.reading.lines.map((l, i) => <p key={i}>{l}</p>)}
          <h3>進門之前，先想三件事</h3>
          <ul>{reading.reading.prompts.map((p, i) => <li key={i}>{p}</li>)}</ul>
          <h3>這張委託怎麼進行</h3>
          <ul>
            <li>時間只在你做行動的時候走。看字、想事情、排推理板都不扣時間。</li>
            <li>症影底下掛著四盞燈，是四個可能的真身。拿到關鍵的線索，要你判斷它讓哪一盞更像、哪一盞比較不像。</li>
            <li>急的事隨時可以做，不用等問完。卡住的時候可以問岑禾。</li>
            <li>一張委託大約 10 分鐘。</li>
          </ul>
          <p className="dim">{reading.review.note}</p>
        </Sheet>
      )}
      {codex && (
        <Sheet title="症影圖鑑" onClose={() => setCodex(false)}>
          <p className="dim">檔案室淹水之後，圖鑑只剩症影的外形。底下的字，要靠你在一張一張委託裡寫回來。</p>
          {COMPLAINTS.map((m) => {
            const page = codexOf(m, save);
            return (
              <div key={m.id} className="codex">
                <div className="codex-top"><b>{m.shadow.name}</b><span>{m.name}的症影</span><em>寫回 {page.percent}%</em></div>
                <i className="bar"><b style={{ width: page.percent + '%' }} /></i>
                <p>{m.shadow.lore}</p>
                <h3>四個真身</h3>
                {page.forms.map(({ form, seenIn, reads, known }) => (
                  <div key={form.id} className={'form-card' + (known ? '' : ' unknown')}>
                    <div><i className="mark" aria-hidden="true">{known ? form.mark : '？'}</i><b>{known ? form.name : '還沒寫回來'}</b>{seenIn.length > 0 && <em>在{seenIn.join('、')}身上確認過</em>}</div>
                    {known && <p className="dim">{form.blurb}</p>}
                    {reads.length > 0 && <ul>{reads.map((r) => <li key={r.clue + r.who} className={r.dir > 0 ? 'up' : 'down'}>{r.dir > 0 ? '＋' : '－'} {r.text}<small>（{r.who}）</small></li>)}</ul>}
                  </div>
                ))}
                <h3>遇過的人</h3>
                {page.people.length ? page.people.map(({ c, rec }) => <p key={c.id} className="quote"><b>{c.patient.name}</b>，{c.patient.job}。{rec.found ? '你認出了真身。' : '真身還沒有認出來。'}{rec.concern ? '你回應了' + c.patient.pronoun + '最在意的事。' : ''}</p>) : <p className="dim">還沒有。完成第一張委託，才會有第一筆紀錄。</p>}
                <p className="dim">這一頁有 {page.cases.length} 位病人、{page.total} 條可以解讀的線索，你寫回了 {page.got} 條。</p>
              </div>
            );
          })}
          {save.takeaways.length > 0 && <><h3>你寫下的話</h3><ul>{save.takeaways.map((t) => <li key={t}>{t}</li>)}</ul></>}
        </Sheet>
      )}
    </div>
  );
}
