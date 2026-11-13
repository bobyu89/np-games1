// 公會大廳：故事的段落、委託板、圖鑑（症影、人物、場景）、選主角。
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CaseDef } from '../core/types.ts';
import { SAFETY_LABEL } from '../core/scoring.ts';
import { COMPLAINTS, caseById } from '../data/index.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type TalkHandle, type Who } from './Talk.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx, sound } from './sound.ts';
import type { Run, Save } from './store.ts';
import { Settings, StatsFacts } from './Settings.tsx';
import { setConsent, statsBuilt, statsConsent, statsSubscribe } from './stats.ts';
import { applyUpdate, pwaState, pwaSubscribe } from './pwa.ts';
import { ARCHIVE, BEATS, HEROES, QUESTS, albumCount, codexOf, codexPercent, heroOf, heroShots, nextBeat, peopleOf, placesOf, rankOf, toYou, unlocked, type Beat, type Entry } from './progress.ts';
import { WELCOME, WORLD } from './world.ts';
import { Portrait } from './Portrait.tsx';

const CHAPTERS: Record<number, string> = { 1: '第一章', 2: '第二章', 3: '第三章', 4: '第四章', 5: '第五章' };

/** run：上次沒結案的那一張委託 */
interface Props { save: Save; run: Run | null; onHome(): void; onHero(id: string): void; onBeatSeen(id: string): void; onStart(c: CaseDef): void; onResume(): void; onDropRun(): void; onImport(s: Save): void; onReset(): void }

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

export function Hall({ save, run, onHome, onHero, onBeatSeen, onStart, onResume, onDropRun, onImport, onReset }: Props) {
  const [pendingBeat, setBeat] = useState<Beat | null>(() => nextBeat(save) ?? null);
  // 先知道自己是誰，故事才開始：還沒選主角之前，序章先等著
  const beat = save.hero === null ? null : pendingBeat;
  const [welcomed, setWelcomed] = useState(() => save.hero !== null || save.beats.length > 0);
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState<CaseDef | null>(null);
  const [codex, setCodex] = useState(false);
  const [tab, setTab] = useState<'shadow' | 'people' | 'places' | 'world'>('shadow');
  const [soundOn, setSoundOn] = useState(sound.on);
  const [settings, setSettings] = useState(false);
  const [story, setStory] = useState<Beat | null>(null);   // 從圖鑑重看的那一段故事
  const pwa = useSyncExternalStore(pwaSubscribe, pwaState);
  const consent = useSyncExternalStore(statsSubscribe, statsConsent);
  const [later, setLater] = useState(false);   // 按了關閉：這一次先不問，下次打開再問
  const pending = run ? caseById(run.caseId) : null;
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null), speaker = useRef<Who | null>(null), bubble = useRef<HTMLDivElement>(null);
  const open = QUESTS.filter((q) => unlocked(q, save)), fresh = open.find((q) => !save.cases[q.caseId]);

  useEffect(() => {
    if (save.hero === null) return;
    if (beat) { talk.current?.say([{ ...beat.lines[step], text: toYou(beat.lines[step].text, save.hero) }]); return; }
    const last = save.takeaways[0];
    if (pending) { talk.current?.say([{ who: 'mentor', text: run!.session.closedAt !== null ? pending.patient.name + '那一張結案了，回顧還沒看完。' : pending.patient.name + '還在等你。上次做到一半，可以接著做。' }]); return; }
    talk.current?.say([{ who: 'mentor', text: last ? '你上次說，下次要做到：' + last : fresh ? '委託板上有一張新的。準備好了就接。' : '板子上的委託都走過了。想再走一次也可以，圖鑑還有空白。' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, step, save.hero]);

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
        <div className="top"><span className="who"><button type="button" className="home" onClick={() => { sfx.page(); onHome(); }}>‹ 首頁</button>霧脈公會</span><span className="clock">{save.hero ? heroOf(save.hero).name + '・' : ''}{rankOf(save)}</span></div>
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
              {pwa.update && <button type="button" className="quest paper hint" onClick={() => { sfx.done(); applyUpdate(); }}><i className="seal" aria-hidden="true" /><b>有新的版本</b><span>換上只要幾秒，進度不會動</span><em>現在更新</em></button>}
              {pending && run && <>
                <div className="quest-head">還沒結案</div>
                <button type="button" className="quest paper hint" onClick={() => { sfx.page(); onResume(); }}><i className="seal" aria-hidden="true" /><b>{pending.title}</b><span>{pending.patient.name}｜{run.session.closedAt !== null ? '結案了，回顧還沒看完' : '做到一半'}</span><em>{run.session.closedAt !== null ? '看回顧' : '接著做'}</em></button>
                {run.session.closedAt === null && <button type="button" className="skip" onClick={() => { sfx.miss(); onDropRun(); }}>不接了，放掉這一張</button>}
              </>}
              {COMPLAINTS.map((m) => {
                const mine = QUESTS.filter((q) => caseById(q.caseId).complaint === m.id);
                if (!mine.length) return null;
                const seen = mine.some((q) => unlocked(q, save));
                return (
                  <Fragment key={m.id}>
                    <div className="quest-head">{CHAPTERS[mine[0].chapter] ?? ''}　{seen ? m.shadow.name + '｜' + m.name : '還沒送到的委託'}</div>
                    {mine.map((q) => {
                      const c = caseById(q.caseId), res = save.cases[c.id];
                      if (!unlocked(q, save)) return <div key={c.id} className="quest paper locked" aria-disabled="true"><b>？？？</b><span>{q.chapter > 1 && !seen ? CHAPTERS[q.chapter - 1] + '走完之後才會送到' : '完成上一張委託之後才會送到'}</span><em>還沒出現</em></div>;
                      return (
                        <button key={c.id} type="button" className={'quest paper' + (res ? '' : ' hint')} onClick={() => { sfx.page(); setReading(c); }}>
                          <i className="seal" aria-hidden="true" />
                          <b>{c.title}</b>
                          <span>{c.patient.name}｜{c.complaintName}{c.scene === 'dock' ? '｜出診' : ''}</span>
                          <em>{res ? '最佳 ' + res.best + ' 分・' + SAFETY_LABEL[res.safety] : '新的委託'}</em>
                        </button>
                      );
                    })}
                  </Fragment>
                );
              })}
              <div className="quest paper locked" aria-disabled="true"><b>終章</b><span>大霧值班夜</span><em>整理中</em></div>
              <div className="quest paper locked" aria-disabled="true"><b>資格試煉</b><span>抽一個沒練過的主訴，15 分鐘</span><em>還沒開放</em></div>
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setCodex(true); }}>圖鑑 {codexPercent(COMPLAINTS, save)}%</button>
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
          <button type="button" onClick={() => { sfx.page(); setSettings(true); }}>設定{pwa.update ? '・有新版' : ''}</button>
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
            <li>畫面上掛著四盞燈，是這個主訴四個可能的診斷。拿到關鍵的線索，要你判斷它讓哪一個診斷更像、哪一個比較不像；更像，那一盞就亮一點。</li>
            <li>時間只在你做行動的時候走。看字、想事情、下診斷都不扣時間。</li>
            <li>病人等不了的時候，值班鐘隨時可以敲。卡住的時候可以問岑禾。</li>
            <li>一張委託大約 10 到 12 分鐘。</li>
          </ul>
          <p className="dim">{reading.review.note}</p>
        </Sheet>
      )}
      {settings && <Settings save={save} onImport={onImport} onReset={onReset} onReplayIntro={() => { setSettings(false); setBeat(BEATS[0]); setStep(0); }} onClose={() => setSettings(false)} />}
      {statsBuilt && consent === 'ask' && !later && !beat && save.hero !== null && !settings && !reading && !codex && (
        <Sheet title="先問你一件事" onClose={() => setLater(true)} footer={<div className="two"><button type="button" className="act" onClick={() => { sfx.tap(); setConsent('no'); }}>不要回傳</button><button type="button" className="act demo" onClick={() => { sfx.done(); setConsent('yes'); }}>可以回傳</button></div>}>
          <p>可以讓這個遊戲回傳<b>匿名的使用統計</b>嗎？</p>
          <StatsFacts />
          <p className="dim">之後想改，在「設定」裡。你選之前，什麼都不會送出去。</p>
        </Sheet>
      )}
      {save.hero === null && !welcomed && !settings && (
        <Sheet title="霧脈公會" onClose={() => setWelcomed(true)} footer={<button type="button" className="act demo" onClick={() => { sfx.page(); setWelcomed(true); }}>開始</button>}>
          <p>{WELCOME.what}</p>
          <dl className="pairs">{WELCOME.points.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <p className="dim">{WELCOME.note}</p>
        </Sheet>
      )}
      {save.hero === null && welcomed && !settings && (
        <Sheet title="你是哪一位？" onClose={() => onHero(HEROES[0].id)}>
          <p>你剛結束訓練，今天第一天到霧脈公會報到。選一位當你自己。</p>
          <p className="dim">六位都是見習專科護理師。只有來歷、外表和帶的東西不同，能做的事一模一樣；之後可以在圖鑑的「人物」裡換。</p>
          <HeroCards picked={null} onPick={onHero} action="就是這一位" />
        </Sheet>
      )}
      {codex && (
        <Sheet title="圖鑑" onClose={() => setCodex(false)}>
          <div className="steps four" role="tablist">
            {([['shadow', '症影'], ['people', '人物'], ['places', '場景'], ['world', '公會']] as const).map(([id, name]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => { sfx.tap(); setTab(id); }}>{name}</button>)}
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
          {tab === 'world' && <>
            {WORLD.paragraphs.map((t) => <p key={t}>{t}</p>)}
            <h3>看過的故事</h3>
            {save.beats.length ? <div className="stack">{BEATS.filter((b) => save.beats.includes(b.id)).map((b) => <button key={b.id} type="button" className="pick" onClick={() => { sfx.page(); setStory(b); }}>{b.title}</button>)}</div> : <p className="dim">還沒有。</p>}
            <h3>舊檔案</h3>
            <p className="dim">眠墨從淹過水的櫃子裡，一頁一頁晾乾的值班日誌。是誰寫的、寫的是哪一年，故事走到了才知道。不讀也不影響委託。</p>
            {ARCHIVE.map((l) => (l.when(save)
              ? <div key={l.id} className="leaf"><b>{l.day}</b>{l.lines.map((t) => <p key={t}>{t}</p>)}</div>
              : <div key={l.id} className="leaf locked"><b>？？？</b><p className="dim">{l.hint}</p></div>))}
            <h3>這裡的東西，對到現實的什麼</h3>
            <dl className="pairs">{WORLD.map.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <h3>這是什麼</h3>
            <p>{WELCOME.what}</p>
            <p className="dim">{WELCOME.note}</p>
          </>}
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
                <h3>四個診斷</h3>
                {page.forms.map(({ form, seenIn, reads, known }) => (
                  <div key={form.id} className={'form-card' + (known ? '' : ' unknown')}>
                    <div><i className="mark" aria-hidden="true">{known ? form.mark : '？'}</i><b>{known ? form.name : '還沒寫回來'}</b>{seenIn.length > 0 && <em>在{seenIn.join('、')}身上確認過</em>}</div>
                    {known && <p className="dim">{form.blurb}</p>}
                    {reads.length > 0 && <ul>{reads.map((r) => <li key={r.clue + r.who} className={r.dir > 0 ? 'up' : 'down'}>{r.dir > 0 ? '＋' : '－'} {r.text}<small>（{r.who}）</small></li>)}</ul>}
                  </div>
                ))}
                <h3>遇過的人</h3>
                {page.people.length ? page.people.map(({ c, rec }) => <p key={c.id} className="quote"><b>{c.patient.name}</b>，{c.patient.job}。{rec.found ? '你的診斷是對的。' : '還沒有診斷對過。'}{rec.concern ? '你回應了' + c.patient.pronoun + '最在意的事。' : ''}</p>) : <p className="dim">還沒有。完成第一張委託，才會有第一筆紀錄。</p>}
                <p className="dim">這一頁有 {page.cases.length} 位病人、{page.total} 條可以解讀的線索，你寫回了 {page.got} 條。</p>
              </div>
            );
          })}
          {save.takeaways.length > 0 && <><h3>你寫下的話</h3><ul>{save.takeaways.map((t) => <li key={t}>{t}</li>)}</ul></>}
          </>}
        </Sheet>
      )}
      {story && (
        <Sheet title={story.title} onClose={() => setStory(null)}>
          {story.lines.map((l, i) => (l.who === 'sys' ? <p key={i} className="dim">{toYou(l.text, save.hero)}</p>
            : <p key={i}><b className="name">{l.who === 'you' ? '你' : l.who === 'mo' ? '眠墨' : l.who === 'doctor' ? '沈渡' : '岑禾'}</b>「{toYou(l.text, save.hero)}」</p>))}
        </Sheet>
      )}
    </div>
  );
}
