// 公會大廳：故事的段落、委託板、圖鑑（症影、人物、場景）、選主角。
import { useEffect, useRef, useState } from 'react';
import type { CaseDef } from '../core/types.ts';
import { SAFETY_LABEL } from '../core/scoring.ts';
import { COMPLAINTS, caseById } from '../data/index.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type TalkHandle, type Who } from './Talk.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx, sound } from './sound.ts';
import type { Save } from './store.ts';
import { BEATS, HEROES, QUESTS, albumCount, codexOf, heroOf, heroShots, nextBeat, peopleOf, placesOf, rankOf, unlocked, type Beat, type Entry } from './progress.ts';
import { Portrait } from './Portrait.tsx';

interface Props { save: Save; onHero(id: string): void; onBeatSeen(id: string): void; onStart(c: CaseDef): void }

/** 圖鑑裡的一張卡：遇到了、去過了才看得到 */
function Card({ e, wide }: { e: Entry; wide?: boolean }) {
  return (
    <div className={'card' + (wide ? ' wide' : '') + (e.open ? '' : ' locked')}>
      <Portrait shot={e.shot} label={e.name} locked={!e.open} wide={wide} />
      <div><b>{e.open ? e.name : '？？？'}</b><span>{e.open ? e.tag : e.hint}</span>{e.open && e.lines.map((l) => <p key={l}>{l}</p>)}</div>
    </div>
  );
}
/** 三位主角。picked 是現在選的那一位 */
function HeroCards({ picked, onPick, action }: { picked: string | null; onPick(id: string): void; action: string }) {
  return (
    <div className="album">
      {HEROES.map((h) => (
        <div key={h.id} className={'card' + (picked === h.id ? ' on' : '')}>
          <Portrait shot={heroShots[h.id]} label={h.name} />
          <div><b>{h.name}</b><span>{h.tag}</span><p>{h.line}</p>{picked === h.id ? <em>現在是這一位</em> : <button type="button" className="pick" onClick={() => { sfx.tap(); onPick(h.id); }}>{action}</button>}</div>
        </div>
      ))}
    </div>
  );
}

export function Hall({ save, onHero, onBeatSeen, onStart }: Props) {
  const [beat, setBeat] = useState<Beat | null>(() => nextBeat(save) ?? null);
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState<CaseDef | null>(null);
  const [codex, setCodex] = useState(false);
  const [tab, setTab] = useState<'shadow' | 'people' | 'places'>('shadow');
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
        <div className="top"><span className="who">霧脈公會</span><span className="clock">{save.hero ? heroOf(save.hero).name + '・' : ''}{rankOf(save)}</span></div>
        <Stage kind="hall" hero={save.hero} stage={stage} onFrame={onFrame} label="霧脈公會的大廳：牆上是委託板，眠墨坐在櫃台後面寫字，岑禾站在委託板旁邊，窗外是霧港和燈塔">
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
            <li>照順序做：開場 → 主訴 → 病史 → 系統回顧 → 身體評估 → 下診斷 → 檢查。前面的隨時可以回去補，後面的要做完前一段才會打開。</li>
            <li>症影底下掛著四盞燈，是四個可能的真身。拿到關鍵的線索，要你判斷它讓哪一盞更像、哪一盞比較不像。</li>
            <li>時間只在你做行動的時候走。看字、想事情、下診斷都不扣時間。</li>
            <li>病人等不了的時候，值班鐘隨時可以敲。卡住的時候可以問岑禾。</li>
            <li>一張委託大約 10 到 12 分鐘。</li>
          </ul>
          <p className="dim">{reading.review.note}</p>
        </Sheet>
      )}
      {!beat && save.hero === null && (
        <Sheet title="你是哪一位？" onClose={() => onHero(HEROES[0].id)}>
          <p className="dim">三位都是剛到霧脈公會的見習專科護理師。只有外表和帶的東西不同，能做的事一模一樣；之後可以在圖鑑的「人物」裡換。</p>
          <HeroCards picked={null} onPick={onHero} action="就是這一位" />
        </Sheet>
      )}
      {codex && (
        <Sheet title="圖鑑" onClose={() => setCodex(false)}>
          <div className="steps" role="tablist">
            {([['shadow', '症影'], ['people', '人物'], ['places', '場景']] as const).map(([id, name]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => { sfx.tap(); setTab(id); }}>{name}</button>)}
          </div>
          {tab === 'people' && (() => {
            const { guild, patients } = peopleOf(save);
            return <>
              <p className="dim">遇到的人會記在這裡。人物和場景一共 {albumCount(save).total} 張，你打開了 {albumCount(save).got} 張。</p>
              <h3>主角</h3>
              <HeroCards picked={save.hero} onPick={onHero} action="換成這一位" />
              <h3>公會的人</h3>
              <div className="album">{guild.map((e) => <Card key={e.id} e={e} />)}</div>
              <h3>照顧過的人</h3>
              <div className="album">{patients.map((e) => <Card key={e.id} e={e} />)}</div>
            </>;
          })()}
          {tab === 'places' && <>
            <p className="dim">去過的地方會記在這裡。出診的委託，會帶你到公會以外的地方。</p>
            <div className="album">{placesOf(save).map((e) => <Card key={e.id} e={e} wide />)}</div>
          </>}
          {tab === 'shadow' && <>
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
          </>}
        </Sheet>
      )}
    </div>
  );
}
